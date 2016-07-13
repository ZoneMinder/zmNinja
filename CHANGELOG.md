# Change Log

## [v1.1.96](https://github.com/pliablepixels/zmNinja/tree/v1.1.96) (2016-07-13)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.1.94...v1.1.96)

**Implemented enhancements:**

- Make sure zmNinja plays ball with new user roles in APIs [\#93](https://github.com/pliablepixels/zmNinja/issues/93)

**Fixed bugs:**

- Slash screen PIN entry text error on zmN 1.1.94b [\#284](https://github.com/pliablepixels/zmNinja/issues/284)
- build for android broke - uglify is messing up release builds [\#282](https://github.com/pliablepixels/zmNinja/issues/282)
- ZMNinja back button issue [\#281](https://github.com/pliablepixels/zmNinja/issues/281)
- Modify montage filtering to make sure maxLimit does not include disabled monitors [\#277](https://github.com/pliablepixels/zmNinja/issues/277)
- Some Android phones seem to have SSL issues with self-signed certs [\#273](https://github.com/pliablepixels/zmNinja/issues/273)

**Closed issues:**

- Multi-server not video from cameras [\#283](https://github.com/pliablepixels/zmNinja/issues/283)

## [v1.1.94](https://github.com/pliablepixels/zmNinja/tree/v1.1.94) (2016-07-09)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.1.93...v1.1.94)

**Implemented enhancements:**

- Allow to  navigate to live stream on notification tap [\#278](https://github.com/pliablepixels/zmNinja/issues/278)
- Allow upto 10 monitors to be arranged per row  in montage [\#276](https://github.com/pliablepixels/zmNinja/issues/276)

**Fixed bugs:**

- Playback of events fails using view=video mode [\#275](https://github.com/pliablepixels/zmNinja/issues/275)
- zmNinja does not launch on iOS 10 [\#271](https://github.com/pliablepixels/zmNinja/issues/271)

**Closed issues:**

- zmNinja-I can only see one camera in the app in montage view, but I can see my 2 cameras in browser [\#280](https://github.com/pliablepixels/zmNinja/issues/280)
- Swipe to next event for the same monitor id not working [\#274](https://github.com/pliablepixels/zmNinja/issues/274)

## [v1.1.93](https://github.com/pliablepixels/zmNinja/tree/v1.1.93) (2016-06-16)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.1.92...v1.1.93)

**Implemented enhancements:**

- Implement language translations [\#261](https://github.com/pliablepixels/zmNinja/issues/261)
- Italian Language [\#260](https://github.com/pliablepixels/zmNinja/issues/260)
- Improve desktop mouse-wheel scrolling in the event view [\#258](https://github.com/pliablepixels/zmNinja/issues/258)

**Fixed bugs:**

- Allow special characters in password to work in wizard  [\#264](https://github.com/pliablepixels/zmNinja/issues/264)
- if you open a footage modal and exit before 5 seconds, the app keeps checking for event status  [\#257](https://github.com/pliablepixels/zmNinja/issues/257)
- Montage and Live View no longer working [\#256](https://github.com/pliablepixels/zmNinja/issues/256)
- 1.1.9 for Android broke pinch and zoom [\#255](https://github.com/pliablepixels/zmNinja/issues/255)

**Closed issues:**

- Fix android permissions [\#268](https://github.com/pliablepixels/zmNinja/issues/268)
- Validate language coverage [\#267](https://github.com/pliablepixels/zmNinja/issues/267)
- Update project to work with ionic@2 tools [\#259](https://github.com/pliablepixels/zmNinja/issues/259)
- switch to non parsed zms for montage - see if it helps packery [\#254](https://github.com/pliablepixels/zmNinja/issues/254)

**Merged pull requests:**

- IT Translations correction \#270 [\#272](https://github.com/pliablepixels/zmNinja/pull/272) ([mcbittech](https://github.com/mcbittech))
- More Translations \#267 [\#269](https://github.com/pliablepixels/zmNinja/pull/269) ([mcbittech](https://github.com/mcbittech))
- Italian Translations first commit [\#266](https://github.com/pliablepixels/zmNinja/pull/266) ([mcbittech](https://github.com/mcbittech))

## [v1.1.92](https://github.com/pliablepixels/zmNinja/tree/v1.1.92) (2016-05-21)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.1.9...v1.1.92)

## [v1.1.9](https://github.com/pliablepixels/zmNinja/tree/v1.1.9) (2016-05-20)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.1.7...v1.1.9)

**Implemented enhancements:**

- Add ability to jump to specific timeframe during event playback [\#252](https://github.com/pliablepixels/zmNinja/issues/252)
- Allow users to specify a minimum alarm frame count for the events page [\#250](https://github.com/pliablepixels/zmNinja/issues/250)
- Implement new color scheme  [\#249](https://github.com/pliablepixels/zmNinja/issues/249)
- Show recording state in monitors \(alert/alarm/recording/idle\) [\#248](https://github.com/pliablepixels/zmNinja/issues/248)
- add ability to force trigger alarms \(needs API upgrade\) [\#245](https://github.com/pliablepixels/zmNinja/issues/245)
- support multi-server feeds and the new server API [\#241](https://github.com/pliablepixels/zmNinja/issues/241)
- Write a configuration wizard [\#234](https://github.com/pliablepixels/zmNinja/issues/234)

**Fixed bugs:**

- Fix keyboard jump on certain fields/iOS [\#251](https://github.com/pliablepixels/zmNinja/issues/251)
- clean up buttons so they don't overlap in many views [\#246](https://github.com/pliablepixels/zmNinja/issues/246)
- Switching between profiles fails to discover monitors [\#244](https://github.com/pliablepixels/zmNinja/issues/244)
- Event Graphs issue [\#239](https://github.com/pliablepixels/zmNinja/issues/239)
- Event server customization [\#238](https://github.com/pliablepixels/zmNinja/issues/238)
- Push notification issue [\#237](https://github.com/pliablepixels/zmNinja/issues/237)
- Fix the monitor orientation code for rotated cameras [\#232](https://github.com/pliablepixels/zmNinja/issues/232)
- protocol bug - cgi-bin discover [\#231](https://github.com/pliablepixels/zmNinja/issues/231)

**Closed issues:**

- . [\#253](https://github.com/pliablepixels/zmNinja/issues/253)
- clean up monitorCtrl - remove Event crap - we now have different controllers [\#247](https://github.com/pliablepixels/zmNinja/issues/247)
- switching between fid mode playback \(api 1.30+\) and path mode causes issues if I don't restart app [\#243](https://github.com/pliablepixels/zmNinja/issues/243)
- video .mp4 event issue [\#242](https://github.com/pliablepixels/zmNinja/issues/242)
- check if android is exiting on background [\#240](https://github.com/pliablepixels/zmNinja/issues/240)
- Enhancement: zmNinja as surveillance solution [\#236](https://github.com/pliablepixels/zmNinja/issues/236)
- Application not recorvering from connection errors [\#199](https://github.com/pliablepixels/zmNinja/issues/199)
- Event Montage unstable [\#183](https://github.com/pliablepixels/zmNinja/issues/183)
- \[DESKTOP\] Playback control bar lost some features in 1.0.9 [\#176](https://github.com/pliablepixels/zmNinja/issues/176)

## [v1.1.7](https://github.com/pliablepixels/zmNinja/tree/v1.1.7) (2016-04-23)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.1.4...v1.1.7)

**Implemented enhancements:**

- Add option to tap on alarm events in events view to see a larger version [\#229](https://github.com/pliablepixels/zmNinja/issues/229)
- Add a helper function to automatically detect cgi-bin [\#228](https://github.com/pliablepixels/zmNinja/issues/228)
- PTZ zoom support [\#224](https://github.com/pliablepixels/zmNinja/issues/224)

**Fixed bugs:**

- Not possible to control PTZ after swipe from non-PTZ camera [\#223](https://github.com/pliablepixels/zmNinja/issues/223)
- PTZ with moveRel \(Axis PTZ as an example\) does not work when navigated from Montage view [\#222](https://github.com/pliablepixels/zmNinja/issues/222)
- montage natural scrolling does not work  [\#218](https://github.com/pliablepixels/zmNinja/issues/218)
- when dragging around in analyze graph, don't scroll the screen [\#217](https://github.com/pliablepixels/zmNinja/issues/217)
- full screen in montage does not work [\#216](https://github.com/pliablepixels/zmNinja/issues/216)

**Closed issues:**

- improve timeline taps - make a closest guess  [\#230](https://github.com/pliablepixels/zmNinja/issues/230)
- iOS and Android: introduce native transitions and scrolling \[performance\] [\#226](https://github.com/pliablepixels/zmNinja/issues/226)
- Email notifications with animated GIF attachements [\#225](https://github.com/pliablepixels/zmNinja/issues/225)
- Add version number to help page [\#220](https://github.com/pliablepixels/zmNinja/issues/220)
- Upgrade code-base to new plugins, ionic 1.2.4, etc. [\#219](https://github.com/pliablepixels/zmNinja/issues/219)
- Error: Hook failed with error code ENOENT: [\#210](https://github.com/pliablepixels/zmNinja/issues/210)

## [v1.1.4](https://github.com/pliablepixels/zmNinja/tree/v1.1.4) (2016-04-05)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.1.3...v1.1.4)

## [v1.1.3](https://github.com/pliablepixels/zmNinja/tree/v1.1.3) (2016-04-02)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.1.2...v1.1.3)

**Implemented enhancements:**

- new feature to analyze frames quickly from event list  [\#215](https://github.com/pliablepixels/zmNinja/issues/215)
- re-introduce ability to hide monitors with new drag/drop montage [\#213](https://github.com/pliablepixels/zmNinja/issues/213)
- Enhance timeline graph to allow for event frame scrubbing [\#209](https://github.com/pliablepixels/zmNinja/issues/209)
- Allow ability to only browse alarm frames while in full screen footage view [\#206](https://github.com/pliablepixels/zmNinja/issues/206)

**Fixed bugs:**

- zmNinja build from source does not load on iOS 9.x - hangs on splashscreen [\#212](https://github.com/pliablepixels/zmNinja/issues/212)
- Some SSL users are facing issues with reachability returning no servers reachable [\#208](https://github.com/pliablepixels/zmNinja/issues/208)

**Closed issues:**

- zmNinja 1.1.3 build from source - Push registration failed  [\#214](https://github.com/pliablepixels/zmNinja/issues/214)
- No live view video playback, cgi path is set. [\#211](https://github.com/pliablepixels/zmNinja/issues/211)
- Fix layout for first run when no layout config exists - check demo acct [\#205](https://github.com/pliablepixels/zmNinja/issues/205)

## [v1.1.2](https://github.com/pliablepixels/zmNinja/tree/v1.1.2) (2016-03-19)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.1.1...v1.1.2)

**Implemented enhancements:**

- Left drawer should open with swipe gesture in any view not just fullscreen [\#202](https://github.com/pliablepixels/zmNinja/issues/202)
- Local and External Server configuration \[$5\] [\#133](https://github.com/pliablepixels/zmNinja/issues/133)

**Fixed bugs:**

- quick scrub drag slider stopped working  [\#196](https://github.com/pliablepixels/zmNinja/issues/196)

**Closed issues:**

- Add gesture to exit any fullscreen [\#203](https://github.com/pliablepixels/zmNinja/issues/203)
- Demo Account Autocreating itself [\#200](https://github.com/pliablepixels/zmNinja/issues/200)
- ionic state restore not creating platforms/android directory [\#198](https://github.com/pliablepixels/zmNinja/issues/198)
- Authentication Failed [\#195](https://github.com/pliablepixels/zmNinja/issues/195)

## [v1.1.1](https://github.com/pliablepixels/zmNinja/tree/v1.1.1) (2016-03-14)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.1.0...v1.1.1)

**Fixed bugs:**

- The new montage function resets montage layout if there are hidden or disabled monitors [\#194](https://github.com/pliablepixels/zmNinja/issues/194)

**Closed issues:**

- Testing issue template \(dummy issue\) [\#192](https://github.com/pliablepixels/zmNinja/issues/192)
- testing issue template [\#191](https://github.com/pliablepixels/zmNinja/issues/191)
- decrease splash screen delay \(reduce startup delay\) [\#190](https://github.com/pliablepixels/zmNinja/issues/190)
- Android build fails ref \#180 [\#184](https://github.com/pliablepixels/zmNinja/issues/184)

## [v1.1.0](https://github.com/pliablepixels/zmNinja/tree/v1.1.0) (2016-03-12)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.0.9...v1.1.0)

**Implemented enhancements:**

- Add a pre-configured demo account for people to test around with [\#187](https://github.com/pliablepixels/zmNinja/issues/187)
- Add gesture to open left menu while in full screen live view [\#185](https://github.com/pliablepixels/zmNinja/issues/185)
- Add touch gesture to exit live view [\#182](https://github.com/pliablepixels/zmNinja/issues/182)
- add dynamic drag and drop and multiple size options to montage - make it awesome and more consistent [\#179](https://github.com/pliablepixels/zmNinja/issues/179)
- Prev day/next day for timeline [\#177](https://github.com/pliablepixels/zmNinja/issues/177)
- 12/24 hours scheme settings  [\#175](https://github.com/pliablepixels/zmNinja/issues/175)

**Fixed bugs:**

- switching server profiles causes inconsistency if you go to developer options [\#189](https://github.com/pliablepixels/zmNinja/issues/189)
- changing timeline limit does not go into effect until app restart [\#188](https://github.com/pliablepixels/zmNinja/issues/188)
- Desktop \(possibly others\): Inescapable UI pattern [\#174](https://github.com/pliablepixels/zmNinja/issues/174)

**Closed issues:**

- No image for monitors nor events [\#181](https://github.com/pliablepixels/zmNinja/issues/181)
- Android build fails [\#180](https://github.com/pliablepixels/zmNinja/issues/180)
- iPhone stopped working [\#178](https://github.com/pliablepixels/zmNinja/issues/178)
- non-free license [\#173](https://github.com/pliablepixels/zmNinja/issues/173)
- iOS: Montage View arrange views \(third icon from top-right\) does not function [\#172](https://github.com/pliablepixels/zmNinja/issues/172)

## [v1.0.9](https://github.com/pliablepixels/zmNinja/tree/v1.0.9) (2016-02-25)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.0.7...v1.0.9)

**Implemented enhancements:**

- Route event playback via ZMS [\#164](https://github.com/pliablepixels/zmNinja/issues/164)
- Montage view zoom slider, ergonomy [\#163](https://github.com/pliablepixels/zmNinja/issues/163)
- \[DESKTOP\] Zooming for non touch screen displays. [\#162](https://github.com/pliablepixels/zmNinja/issues/162)
- Fix playback speed for long events [\#161](https://github.com/pliablepixels/zmNinja/issues/161)

**Fixed bugs:**

- Desktop: Monitors Freeze when Exiting Full Screen [\#169](https://github.com/pliablepixels/zmNinja/issues/169)
- changing to invalid credentials after valid credentials continues to work [\#167](https://github.com/pliablepixels/zmNinja/issues/167)

**Closed issues:**

- iOS: Events--\>Filter by Date/Time does not work [\#171](https://github.com/pliablepixels/zmNinja/issues/171)
- Desktop: Event Footage extremely low resolution [\#168](https://github.com/pliablepixels/zmNinja/issues/168)
- ionic state restore failed [\#166](https://github.com/pliablepixels/zmNinja/issues/166)
- Desktop: Montage places last image below rather than alongside previous [\#165](https://github.com/pliablepixels/zmNinja/issues/165)
- \[DESKTOP\] Playback issue on windows platform [\#151](https://github.com/pliablepixels/zmNinja/issues/151)

## [v1.0.7](https://github.com/pliablepixels/zmNinja/tree/v1.0.7) (2016-02-09)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.0.6...v1.0.7)

**Implemented enhancements:**

- Refine montage history to accept from/to dates [\#160](https://github.com/pliablepixels/zmNinja/issues/160)

**Closed issues:**

- Build is failing [\#156](https://github.com/pliablepixels/zmNinja/issues/156)

## [v1.0.6](https://github.com/pliablepixels/zmNinja/tree/v1.0.6) (2016-02-05)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.0.5...v1.0.6)

**Implemented enhancements:**

- Allow event server to work without SSL - requires zmeventserver upgrade  [\#159](https://github.com/pliablepixels/zmNinja/issues/159)
- Introduce a montage timeline function  [\#154](https://github.com/pliablepixels/zmNinja/issues/154)
- Addition Next frame/prev frame buttons when viewing event - for fine grained snapshot control. [\#150](https://github.com/pliablepixels/zmNinja/issues/150)
- Notification icon and sound - add ability to play default sounds [\#135](https://github.com/pliablepixels/zmNinja/issues/135)

**Closed issues:**

- Make exit buttons of live view and events view consistent [\#158](https://github.com/pliablepixels/zmNinja/issues/158)
- Remove SSL cert requirement [\#157](https://github.com/pliablepixels/zmNinja/issues/157)
- Closing data leaks - trying to bottle up areas which may result in chrome keeping TCP connections open in background [\#155](https://github.com/pliablepixels/zmNinja/issues/155)
- xcode fails on linking [\#153](https://github.com/pliablepixels/zmNinja/issues/153)
- installing ios-deploy ends with an error [\#152](https://github.com/pliablepixels/zmNinja/issues/152)
- Progress bar is ignored in Event View when playback is paused. [\#149](https://github.com/pliablepixels/zmNinja/issues/149)

## [v1.0.5](https://github.com/pliablepixels/zmNinja/tree/v1.0.5) (2016-01-23)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.0.3...v1.0.5)

**Implemented enhancements:**

- Add ability to save a snapshot of an event playback to disk [\#148](https://github.com/pliablepixels/zmNinja/issues/148)

**Fixed bugs:**

- 1.0.4 Broke basic auth  [\#147](https://github.com/pliablepixels/zmNinja/issues/147)
- Basic auth only - no zm auth - app goes to login on restart and says auth fails - app works [\#140](https://github.com/pliablepixels/zmNinja/issues/140)

**Closed issues:**

- montage display wrap got messed up in newer versions of Chrome [\#146](https://github.com/pliablepixels/zmNinja/issues/146)
- Viewing events on slow connection basically doesn't work [\#145](https://github.com/pliablepixels/zmNinja/issues/145)

## [v1.0.3](https://github.com/pliablepixels/zmNinja/tree/v1.0.3) (2016-01-19)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.0.2...v1.0.3)

**Implemented enhancements:**

- Allow montage to flow as columns \(packed\) or rows \(not packed\)  [\#144](https://github.com/pliablepixels/zmNinja/issues/144)
- Reduce android apk size  [\#142](https://github.com/pliablepixels/zmNinja/issues/142)
- Improve timeline performance [\#129](https://github.com/pliablepixels/zmNinja/issues/129)
- For Android only: Allow an exit option in menu [\#128](https://github.com/pliablepixels/zmNinja/issues/128)
- Implement a mechanism to detect when network is on/off [\#127](https://github.com/pliablepixels/zmNinja/issues/127)
- Add support for Pan/Tilt/Zoom Presets [\#116](https://github.com/pliablepixels/zmNinja/issues/116)

**Fixed bugs:**

- Monitor order is different one can observe in ZM montage [\#143](https://github.com/pliablepixels/zmNinja/issues/143)
- You can swipe to dead monitor [\#138](https://github.com/pliablepixels/zmNinja/issues/138)
- switching networks should trigger authentication [\#134](https://github.com/pliablepixels/zmNinja/issues/134)
- Excessive background data usage [\#131](https://github.com/pliablepixels/zmNinja/issues/131)

**Closed issues:**

- \[Log in Failed\] Checking if reCaptcha is enabled in zm.. [\#141](https://github.com/pliablepixels/zmNinja/issues/141)
- Swiping with ZMS is slower than swiping without zms [\#139](https://github.com/pliablepixels/zmNinja/issues/139)
- Exit button on Android build  [\#137](https://github.com/pliablepixels/zmNinja/issues/137)
- zmninja cannot talk to zmeventserver [\#136](https://github.com/pliablepixels/zmNinja/issues/136)
- HTTP basic auth credentials not stored [\#132](https://github.com/pliablepixels/zmNinja/issues/132)
- Android build fails [\#130](https://github.com/pliablepixels/zmNinja/issues/130)
- \[DESKTOP\]\[QUESTION\] gconf [\#125](https://github.com/pliablepixels/zmNinja/issues/125)
- CSS montage - implement a better reflow algorithm [\#124](https://github.com/pliablepixels/zmNinja/issues/124)
- Auto upload successful build to testfairy [\#75](https://github.com/pliablepixels/zmNinja/issues/75)
- Integrate with Travis [\#72](https://github.com/pliablepixels/zmNinja/issues/72)
- When moving montage monitors around, remember to move the size  [\#16](https://github.com/pliablepixels/zmNinja/issues/16)

## [v1.0.2](https://github.com/pliablepixels/zmNinja/tree/v1.0.2) (2015-12-28)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v1.0.1...v1.0.2)

**Implemented enhancements:**

- Implement a way to only play alarmed frames [\#118](https://github.com/pliablepixels/zmNinja/issues/118)

## [v1.0.1](https://github.com/pliablepixels/zmNinja/tree/v1.0.1) (2015-12-27)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v0.87.3...v1.0.1)

**Implemented enhancements:**

- Add an option to play at real FPS in single monitor view [\#123](https://github.com/pliablepixels/zmNinja/issues/123)
- Offer a server selection menu on app launch [\#122](https://github.com/pliablepixels/zmNinja/issues/122)
- Add a stop button to PTZ [\#121](https://github.com/pliablepixels/zmNinja/issues/121)
- Pack in the montage view better [\#119](https://github.com/pliablepixels/zmNinja/issues/119)
- Truncate monitor name in montage if size of image is less [\#117](https://github.com/pliablepixels/zmNinja/issues/117)

**Fixed bugs:**

- Developer setting for Frame Update allows decimals  [\#114](https://github.com/pliablepixels/zmNinja/issues/114)

**Closed issues:**

- HTTP Basic authentication [\#120](https://github.com/pliablepixels/zmNinja/issues/120)
- Cannot get video [\#115](https://github.com/pliablepixels/zmNinja/issues/115)

## [v0.87.3](https://github.com/pliablepixels/zmNinja/tree/v0.87.3) (2015-12-15)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v0.87.2...v0.87.3)

**Implemented enhancements:**

- Add ability to detect cgi-bin configuration issues \(experimental\) [\#110](https://github.com/pliablepixels/zmNinja/issues/110)
- Allow 'show all/show alarmed' events to persist and show menu option in both Events and Timeline Views [\#108](https://github.com/pliablepixels/zmNinja/issues/108)
- Make timeline items configurable instead of forcing 200 [\#104](https://github.com/pliablepixels/zmNinja/issues/104)

**Fixed bugs:**

- popover "..." menu in event and timeline does not show in certain scenarios - so no menu [\#109](https://github.com/pliablepixels/zmNinja/issues/109)
- Disabling event server does not disable push notifications via APNS/GCM [\#107](https://github.com/pliablepixels/zmNinja/issues/107)
- Quick scrub on devices \(atleast iOS\) does not stop if you tap [\#106](https://github.com/pliablepixels/zmNinja/issues/106)
- Bulk frames are causing problems with the scrub bar positioning of alarmed frames [\#102](https://github.com/pliablepixels/zmNinja/issues/102)
- Gapless playback showing events from non-persisted monitors [\#86](https://github.com/pliablepixels/zmNinja/issues/86)

**Closed issues:**

- Timeline on v0.87.2 shows only motion events [\#105](https://github.com/pliablepixels/zmNinja/issues/105)

## [v0.87.2](https://github.com/pliablepixels/zmNinja/tree/v0.87.2) (2015-11-20)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v0.87...v0.87.2)

## [v0.87](https://github.com/pliablepixels/zmNinja/tree/v0.87) (2015-11-20)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v0.87.1...v0.87)

**Fixed bugs:**

- Tap to load events on push notification is broken [\#103](https://github.com/pliablepixels/zmNinja/issues/103)
- Monitors in zmNinja should respect sequence of monitors in Zoneminder [\#100](https://github.com/pliablepixels/zmNinja/issues/100)
- SavetoPhone not working [\#99](https://github.com/pliablepixels/zmNinja/issues/99)
- 0.87.1 broke quick scrub thumbnail [\#98](https://github.com/pliablepixels/zmNinja/issues/98)
- \[DESKTOP\] Image scaling issues [\#90](https://github.com/pliablepixels/zmNinja/issues/90)

**Closed issues:**

- \[DESKTOP\] Timeline is UTC [\#101](https://github.com/pliablepixels/zmNinja/issues/101)
- \[DESKTOP\] Lift 200 last entries limit for timeline [\#88](https://github.com/pliablepixels/zmNinja/issues/88)

## [v0.87.1](https://github.com/pliablepixels/zmNinja/tree/v0.87.1) (2015-11-18)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v0.86...v0.87.1)

**Implemented enhancements:**

- Event page is overcrowded for mocord users - add option to show only alarmed frames [\#89](https://github.com/pliablepixels/zmNinja/issues/89)
- Ability to specify multiple ZM servers and switch between them [\#83](https://github.com/pliablepixels/zmNinja/issues/83)
- add per monitor 'alarmed' status indicator to montage view [\#82](https://github.com/pliablepixels/zmNinja/issues/82)

**Fixed bugs:**

- zmNinja adds cgi-bin on its own to cgi path. This is a problem for Centos  [\#92](https://github.com/pliablepixels/zmNinja/issues/92)
- Can't toggle gapless playback when viewing timeline events  [\#85](https://github.com/pliablepixels/zmNinja/issues/85)
- desktop app no video from timeline [\#70](https://github.com/pliablepixels/zmNinja/issues/70)

**Closed issues:**

- Breaking changes for this release: [\#97](https://github.com/pliablepixels/zmNinja/issues/97)
- Zoneminder specific notes for this release  [\#96](https://github.com/pliablepixels/zmNinja/issues/96)
- Increase desktop limit of timeline to 2000 events instead of 200 [\#95](https://github.com/pliablepixels/zmNinja/issues/95)
- Implement daily version check for Desktop versions [\#94](https://github.com/pliablepixels/zmNinja/issues/94)
- eliminate duplicate code between timeline and event control for footage mode [\#87](https://github.com/pliablepixels/zmNinja/issues/87)
- Non-persisted monitors showing in timeline, events views [\#84](https://github.com/pliablepixels/zmNinja/issues/84)
- Clean up persistent data storage mechanism [\#81](https://github.com/pliablepixels/zmNinja/issues/81)
- Remove external deps from codebase [\#80](https://github.com/pliablepixels/zmNinja/issues/80)
- Update .gitignore to support osx [\#78](https://github.com/pliablepixels/zmNinja/issues/78)
- Welcome message on first start [\#76](https://github.com/pliablepixels/zmNinja/issues/76)
- add contributing guidelines [\#74](https://github.com/pliablepixels/zmNinja/issues/74)
- Add License [\#73](https://github.com/pliablepixels/zmNinja/issues/73)
- desktop app, can't export logs [\#71](https://github.com/pliablepixels/zmNinja/issues/71)
- make email logs work in desktop mode by opening default client [\#69](https://github.com/pliablepixels/zmNinja/issues/69)
- in quick scrub/footage mode - start playing without waiting for a tap [\#68](https://github.com/pliablepixels/zmNinja/issues/68)
- make mouse wheel work in desktop mode [\#67](https://github.com/pliablepixels/zmNinja/issues/67)

**Merged pull requests:**

- prevents checkin of unessicary file from osx [\#79](https://github.com/pliablepixels/zmNinja/pull/79) ([jsloyer](https://github.com/jsloyer))
- move license file to correct filename [\#77](https://github.com/pliablepixels/zmNinja/pull/77) ([jsloyer](https://github.com/jsloyer))

## [v0.86](https://github.com/pliablepixels/zmNinja/tree/v0.86) (2015-11-06)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v0.85...v0.86)

**Implemented enhancements:**

- Make Back button to exit from live view [\#61](https://github.com/pliablepixels/zmNinja/issues/61)
- ability to run all screens of zmNinja on a desktop without console errors [\#59](https://github.com/pliablepixels/zmNinja/issues/59)
- In playback mode, add the ability to swipe to the next event of whichever monitor has the next event and/or initiate gapless playback of same. [\#49](https://github.com/pliablepixels/zmNinja/issues/49)
- In playback mode, add the ability to swipe to the next event of the same monitor and/or initiate gapless playback. [\#48](https://github.com/pliablepixels/zmNinja/issues/48)

**Fixed bugs:**

- tapping on events before they complete causes issues [\#44](https://github.com/pliablepixels/zmNinja/issues/44)

**Closed issues:**

- If swiping is enabled, don't swipe if image is zoomed in -- causes pan/zoom conflicts [\#66](https://github.com/pliablepixels/zmNinja/issues/66)
- getDiskStatus seems to be a performance bottleneck - disable for now in System State screen [\#65](https://github.com/pliablepixels/zmNinja/issues/65)
- clean up non-reachable code during portal check [\#64](https://github.com/pliablepixels/zmNinja/issues/64)

## [v0.85](https://github.com/pliablepixels/zmNinja/tree/v0.85) (2015-11-01)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v0.84...v0.85)

**Implemented enhancements:**

- video branch support for zmNinja  [\#60](https://github.com/pliablepixels/zmNinja/issues/60)
- changing servers requires reload of monitors - should be automatically done [\#58](https://github.com/pliablepixels/zmNinja/issues/58)

**Fixed bugs:**

- fix version check - in one part of the code, I'm not doing a \>= check resulting in new ZM versions failing [\#57](https://github.com/pliablepixels/zmNinja/issues/57)
- notifications delivered while the app is running should also produce the same sound [\#55](https://github.com/pliablepixels/zmNinja/issues/55)
- iOS notifications are not showing style and sound options [\#54](https://github.com/pliablepixels/zmNinja/issues/54)

**Closed issues:**

- permissions on Android [\#56](https://github.com/pliablepixels/zmNinja/issues/56)

## [v0.84](https://github.com/pliablepixels/zmNinja/tree/v0.84) (2015-10-28)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v0.83...v0.84)

**Implemented enhancements:**

- offer an option to force web sockets even if push is supported [\#53](https://github.com/pliablepixels/zmNinja/issues/53)
- customize screen to load on push notification tap [\#47](https://github.com/pliablepixels/zmNinja/issues/47)

**Fixed bugs:**

- Ssl toggle and https in login [\#52](https://github.com/pliablepixels/zmNinja/issues/52)
- Swiping to the left should reveal next monitor, not prev monitor \(seen on iOS 9\) [\#51](https://github.com/pliablepixels/zmNinja/issues/51)
- rev 0.83, event icon is a solid block [\#50](https://github.com/pliablepixels/zmNinja/issues/50)
- Monitor view: events not showing for deselected monitors \(and should since the goal in monitor view is to see all monitors which would include their events\). 	 	 [\#46](https://github.com/pliablepixels/zmNinja/issues/46)
- Montage view: swipe shows deselected monitors \(and should not\). [\#45](https://github.com/pliablepixels/zmNinja/issues/45)
- Timeline more menu bonked again [\#43](https://github.com/pliablepixels/zmNinja/issues/43)

**Closed issues:**

- custom range dates shown even if pullup overwrites them [\#37](https://github.com/pliablepixels/zmNinja/issues/37)
- Android client: System Status view returns HTTP error [\#32](https://github.com/pliablepixels/zmNinja/issues/32)
- app causes ZM crash/bad behavior after it's been asleep for a while [\#30](https://github.com/pliablepixels/zmNinja/issues/30)

## [v0.83](https://github.com/pliablepixels/zmNinja/tree/v0.83) (2015-10-24)
**Implemented enhancements:**

- ability to restrict monitors in all views - depending on some global selection [\#42](https://github.com/pliablepixels/zmNinja/issues/42)
- make it optional to swipe between live view of monitors [\#41](https://github.com/pliablepixels/zmNinja/issues/41)
- review security approach - switch to auth token instead of passing u+p in url [\#2](https://github.com/pliablepixels/zmNinja/issues/2)

**Fixed bugs:**

- if apis can't be reached the app assumes version is 0.0.0 and moves app to low version screen [\#40](https://github.com/pliablepixels/zmNinja/issues/40)
- Check multiple web sockets created in android -- seems old web sockets don't get deleted [\#39](https://github.com/pliablepixels/zmNinja/issues/39)
- Background mode: Popover menus stick around [\#33](https://github.com/pliablepixels/zmNinja/issues/33)

**Closed issues:**

- Monitor change makes enabled 0 [\#38](https://github.com/pliablepixels/zmNinja/issues/38)
- Restarting ZM in state control results in client freezing [\#35](https://github.com/pliablepixels/zmNinja/issues/35)
- radial menu is broken [\#34](https://github.com/pliablepixels/zmNinja/issues/34)
- monitor buttons to navigate can overlap exit,zoom,refresh buttons [\#31](https://github.com/pliablepixels/zmNinja/issues/31)
- pinch zoom on monitor too sensitive, detects false swipes [\#29](https://github.com/pliablepixels/zmNinja/issues/29)
- Montage re-order does not work with large list of monitors [\#28](https://github.com/pliablepixels/zmNinja/issues/28)
- investigate when timeline barfs with a "no parent" error [\#27](https://github.com/pliablepixels/zmNinja/issues/27)
- zmNinja should give a useful warning when the API is non-functional [\#25](https://github.com/pliablepixels/zmNinja/issues/25)
- apk Download of zmNinja [\#22](https://github.com/pliablepixels/zmNinja/issues/22)
- Add destroy to each view and cancel all view timers again there just to make sure [\#21](https://github.com/pliablepixels/zmNinja/issues/21)
- Add random string recalc every 1 sec to monitor view [\#20](https://github.com/pliablepixels/zmNinja/issues/20)
- Long press on android to increase individual montage size does not work [\#19](https://github.com/pliablepixels/zmNinja/issues/19)
- white screen on idle during playback [\#17](https://github.com/pliablepixels/zmNinja/issues/17)
- make sure image works if an autologin happens in the background [\#15](https://github.com/pliablepixels/zmNinja/issues/15)
- settings UI - keep hints always on top [\#14](https://github.com/pliablepixels/zmNinja/issues/14)
- skip disabled monitors in montage view [\#13](https://github.com/pliablepixels/zmNinja/issues/13)
- how to install your application? [\#12](https://github.com/pliablepixels/zmNinja/issues/12)
- Implement a way to do a sanity check on the input and inform the user if the paths are wrong [\#11](https://github.com/pliablepixels/zmNinja/issues/11)
- come up with a clean input box to make sure I account for various API/base path install combos [\#10](https://github.com/pliablepixels/zmNinja/issues/10)
- Implement event filtering for graph generation - last hr/week/month [\#9](https://github.com/pliablepixels/zmNinja/issues/9)
- Android: Montage screen - scaling is not correct [\#8](https://github.com/pliablepixels/zmNinja/issues/8)
- Android: Http problem [\#7](https://github.com/pliablepixels/zmNinja/issues/7)
- When images are loaded over a slow connection, there is a white screen till it loads [\#6](https://github.com/pliablepixels/zmNinja/issues/6)
- handle situations when zms does not respond to your commands for a while [\#5](https://github.com/pliablepixels/zmNinja/issues/5)
- test product on Android - make sure all plugins work etc. [\#4](https://github.com/pliablepixels/zmNinja/issues/4)
- we are only retrieving the first page of events - need to fix it to get all  [\#1](https://github.com/pliablepixels/zmNinja/issues/1)

**Merged pull requests:**

- Build docs [\#24](https://github.com/pliablepixels/zmNinja/pull/24) ([bklang](https://github.com/bklang))
- Add additional JS build dependencies [\#23](https://github.com/pliablepixels/zmNinja/pull/23) ([bklang](https://github.com/bklang))



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*