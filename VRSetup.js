/******************************************************************************
 * SMO - 08/15/2014
 * VR setup code consolidated and adapted from Brandon Jones' ("Toji") webvr-test application.
 * Original sample code:
 * https://github.com/toji/webvr-test/blob/master/index.html
 *
 * What you need to know:
 * 1) Add "render()" method to your requestFrame loop. It will execute scene
 * rendering when vrMode is active. When vrMode is inactive, its still up to
 * you to make the render call.
 *
 * 2) When ready to activate vrMode, call RequestFullScreenVR()
 *
 *
 *
 * Disclaimer from Toji's code follows:
<!--
Copyright (c) 2014, Brandon Jones. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
-->
 ******************************************************************************/
function VRSetup(p_renderer, p_scene){
	this.renderer = p_renderer;
	this.scene = p_scene;

	// WebVR Device initialization
	this.sensorDevice = null;
	this.hmdDevice = null;
	this.vrMode = false;
	this.fovScale = 1.0;
	this.eyeOffsetLeft;
    this.eyeOffsetRight;

    // Camera setup
    this.zNear = 0.1;
    this.zFar = 5000;
    this.cameraGlobalPosition = new THREE.Vector3(0, 0, 0);
	this.VR_POSITION_SCALE = 25; //25

	this.cameraLeft = new THREE.PerspectiveCamera( 75, 4/3, this.zNear, this.zFar );
	this.cameraRight = new THREE.PerspectiveCamera( 75, 4/3, this.zNear, this.zFar );

	// non VR camera
	this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, this.zNear, this.zFar);

	//Holders to save the original renderer size for when we exit rift mode. But...why would we ever want to do that?
	this.oldRendererWidth = this.renderer.domElement.width;
	this.oldRendererHeight = this.renderer.domElement.height;

	/**
	 * Initialize VR hardware
	 */
	if (navigator.getVRDevices) {
		navigator.getVRDevices().then(this.EnumerateVRDevices.bind(this));
	} else if (navigator.mozGetVRDevices) {
		navigator.mozGetVRDevices(this.EnumerateVRDevices.bind(this));
	} else {
	    //No supported VR browsers found
		console.log("no supported browser api found");
	}

	// keyboard bindings
	var vr = this;
	window.onkeydown = function(ev) {
      if (ev.keyCode == "R".charCodeAt(0))  {
        vr.reset();
        console.log("Resetting");
      }

      if (ev.keyCode == 187 || ev.keyCode == 61 || ev.keyCode == 107)  { // "+" key
        vr.resizeFOV(0.1);
    	console.log("FOV Scale: " + vr.fovScale);
      }
      if (ev.keyCode == 189 || ev.keyCode == 173 || ev.keyCode == 109)  { // "-" key
       	vr.resizeFOV(-0.1);
       	console.log("FOV Scale: " + vr.fovScale);
      }
    }
};

/*******************************************************************************************
 * Makes your display work for a hmd
 * Add this method to your VR trigger event
 *******************************************************************************************/
VRSetup.prototype.RequestFullScreenVR = function(){
	this.vrMode = true;
	
    if (this.renderer.domElement.webkitRequestFullscreen) {
    	this.renderer.domElement.webkitRequestFullscreen({ vrDisplay: this.hmdDevice });
    	document.addEventListener("webkitfullscreenchange", this.onFullscreenChange.bind(this), false);
    } else if (this.renderer.domElement.mozRequestFullScreen) {
    	this.renderer.domElement.mozRequestFullScreen({ vrDisplay: this.hmdDevice });
    	document.addEventListener("mozfullscreenchange", this.onFullscreenChange.bind(this), false);
    }
};

/*******************************************************************************************
 * Returns display from stereo VR mode back to mundane mono-mode
 *******************************************************************************************/
VRSetup.prototype.onFullscreenChange = function(){
	if(!document.webkitFullscreenElement && !document.mozFullScreenElement) {
		this.vrMode = false;
		this.renderer.setSize(this.oldRendererWidth, this.oldRendererHeight);
		document.removeEventListener("webkitfullscreenchange", this.onFullscreenChange, false);
		document.removeEventListener("mozfullscreenchange", this.onFullscreenChange, false);
} else {
		this.renderer.setSize( window.innerWidth, window.innerHeight );
	}
};

VRSetup.prototype.PerspectiveMatrixFromVRFieldOfView = function (fov, zNear, zFar) {
	var outMat = new THREE.Matrix4();
	var out = outMat.elements;
	var upTan = Math.tan(fov.upDegrees * Math.PI/180.0);
	var downTan = Math.tan(fov.downDegrees * Math.PI/180.0);
	var leftTan = Math.tan(fov.leftDegrees * Math.PI/180.0);
	var rightTan = Math.tan(fov.rightDegrees * Math.PI/180.0);

	var xScale = 2.0 / (leftTan + rightTan);
	var yScale = 2.0 / (upTan + downTan);

	out[0] = xScale;
	out[4] = 0.0;
	out[8] = -((leftTan - rightTan) * xScale * 0.5);
	out[12] = 0.0;

	out[1] = 0.0;
	out[5] = yScale;
	out[9] = ((upTan - downTan) * yScale * 0.5);
	out[13] = 0.0;

	out[2] = 0.0;
	out[6] = 0.0;
	out[10] = zFar / (zNear - zFar);
	out[14] = (zFar * zNear) / (zNear - zFar);

	out[3] = 0.0;
	out[7] = 0.0;
	out[11] = -1.0;
	out[15] = 0.0;

	return outMat;
};

VRSetup.prototype.resizeFOV = function(amount) {
	var fovLeft, fovRight;
	if (!this.hmdDevice) { return; }
	if (amount != 0 && 'setFieldOfView' in this.hmdDevice) {
		this.fovScale += amount;
		if (this.fovScale < 0.1) { this.fovScale = 0.1; }

		fovLeft = this.hmdDevice.getRecommendedEyeFieldOfView("left");
		fovRight = this.hmdDevice.getRecommendedEyeFieldOfView("right");

		fovLeft.upDegrees *= this.fovScale;
		fovLeft.downDegrees *= this.fovScale;
		fovLeft.leftDegrees *= this.fovScale;
		fovLeft.rightDegrees *= this.fovScale;

		fovRight.upDegrees *= this.fovScale;
		fovRight.downDegrees *= this.fovScale;
		fovRight.leftDegrees *= this.fovScale;
		fovRight.rightDegrees *= this.fovScale;

		this.hmdDevice.setFieldOfView(fovLeft, fovRight);
	}
	if ('getRecommendedRenderTargetSize' in this.hmdDevice) {
		//var renderTargetSize = this.hmdDevice.getRecommendedRenderTargetSize();
		//document.getElementById("renderTarget").innerHTML = renderTargetSize.width + "x" + renderTargetSize.height;
	}
	if ('getCurrentEyeFieldOfView' in this.hmdDevice) {
		fovLeft = this.hmdDevice.getCurrentEyeFieldOfView("left");
		fovRight = this.hmdDevice.getCurrentEyeFieldOfView("right");
	} else {
		fovLeft = this.hmdDevice.getRecommendedEyeFieldOfView("left");
		fovRight = this.hmdDevice.getRecommendedEyeFieldOfView("right");
	}
	this.cameraLeft.projectionMatrix = this.PerspectiveMatrixFromVRFieldOfView(fovLeft, this.zNear, this.zFar);
	this.cameraRight.projectionMatrix = this.PerspectiveMatrixFromVRFieldOfView(fovRight, this.zNear, this.zFar);
};

VRSetup.prototype.EnumerateVRDevices = function(devices) {
	// First find an HMD device
	for (var i = 0; i < devices.length; ++i) {
	  if (devices[i] instanceof HMDVRDevice) {
	    this.hmdDevice = devices[i];
	    this.eyeOffsetLeft = this.hmdDevice.getEyeTranslation("left");
	    this.eyeOffsetRight = this.hmdDevice.getEyeTranslation("right");
	    this.cameraLeft.position.sub(this.eyeOffsetLeft);
	    this.cameraRight.position.sub(this.eyeOffsetRight);
	    this.resizeFOV(0.0);
	  }
	}
	// Next find a sensor that matches the HMD hardwareUnitId
	for (var i = 0; i < devices.length; ++i) {
		if (devices[i] instanceof PositionSensorVRDevice &&
				(!this.hmdDevice || devices[i].hardwareUnitId == this.hmdDevice.hardwareUnitId)) {
			this.sensorDevice = devices[i];
		}
	}
};

VRSetup.prototype.updateVRDevice = function() {
	if (!this.sensorDevice) return false;
	var vrState = this.sensorDevice.getState();

    this.camera.quaternion.x = vrState.orientation.x;
    this.camera.quaternion.y = vrState.orientation.y;
    this.camera.quaternion.z = vrState.orientation.z;
    this.camera.quaternion.w = vrState.orientation.w;

    this.camera.position.x = (vrState.position.x * this.VR_POSITION_SCALE) + this.cameraGlobalPosition.x;
    this.camera.position.y = (vrState.position.y * this.VR_POSITION_SCALE) + this.cameraGlobalPosition.y;
    this.camera.position.z = (vrState.position.z * this.VR_POSITION_SCALE) + this.cameraGlobalPosition.z;

    this.cameraLeft.quaternion.copy(this.camera.quaternion);
    this.cameraRight.quaternion.copy(this.camera.quaternion);

    this.cameraLeft.position.copy(this.camera.position);
    this.cameraRight.position.copy(this.camera.position);

    this.eyeOffsetLeftV.copy(this.eyeOffsetLeft);
    this.eyeOffsetRightV.copy(this.eyeOffsetRight);
	
    this.cameraLeft.position.add(this.eyeOffsetLeftV.applyQuaternion(this.camera.quaternion));
    this.cameraRight.position.add(this.eyeOffsetRightV.applyQuaternion(this.camera.quaternion));

	return true;
};

/*******************************************************************************************
 * Add render method to your requestFrame loop
 * If vrMode is activated, then VRSetup will render your scene and return true.
 * If not, will return false and it's all up to you!
 *******************************************************************************************/
VRSetup.prototype.render = function(){
	this.updateVRDevice();

	if (this.vrMode) {
		// Render left eye
		this.renderer.enableScissorTest ( true );
		this.renderer.setScissor( 0, 0, window.innerWidth / 2, window.innerHeight );
		this.renderer.setViewport( 0, 0, window.innerWidth / 2, window.innerHeight );
		this.renderer.render(this.scene, this.cameraLeft);

		// Render right eye
		this.renderer.setScissor( window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight );
		this.renderer.setViewport( window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight );
		this.renderer.render(this.scene, this.cameraRight);

		return true;
	} else {
		this.renderer.enableScissorTest (false);
		this.renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
		this.renderer.render(this.scene, this.camera);

		return false;
	}
};

VRSetup.prototype.reset = function(){
	if (this.sensorDevice) {
		this.sensorDevice.resetSensor();
	}
}