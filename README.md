VRSetupjs
=========

<h3>What is it?</h3>
VRSetupJS is a consolidation of the code that you will need in order to enable your ThreeJS program to use a native browser VR API.

<h3>When would I use it?</h3>
You may consider this library if your project meets the following criteria:
1) Your application is written in ThreeJS r68 or a closely related derivative or wrapper (such as physijs)
2) You anticipate that your target audience will be running a VR-capable browser
3) Your project will be tolerant to changes, because changes will be made (a necessary prerequisite for all current Rift development)

<h3>How is this different from benvanik's VR.js?</h3>
VR.js is designed to be used in conjunction with a separate VR plugin for current versions of Mozilla and Chrome. By contrast, VRSetup.js is a consolidation of boilerplate code needed to harness the native browser VR API. At time of this posting, only branch versions of Chromium and Mozilla support this API, which is still in the process of being defined.

It bears repeating: this library is only suitable if you (and your target audience) are running one of the VR-enabled browser branches.

<h3>Tell me more about VR-enabled browsers, and where can I get one?</h3>
See this excellent blog post on the subject: http://blog.tojicode.com/2014/07/bringing-vr-to-chrome.html

<h3>Why shouldn't I just use the browser's VR API directly?</h3>
If you have the time and patience, there's absolutely no reason you shouldn't. This library is simply designed to help you get up and running in about 5-10 minutes, assuming you know your way about ThreeJS.

<h3>Credits</h3>
Much of this code is a repackaging and consolidation of Brandon Jones' works into a reusable and distributable form.
