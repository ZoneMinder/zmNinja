# Changelog
## [v1.8.000](https://github.com/ZoneMinder/zmNinja/tree/v1.8.000) (2025-09-08)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.7.008...v1.8.000)

- Fixes to event viewing
- Fix EdgeToEdge mode on android 15
- Fix blank streams when streams not https
- Fix Event Server integration not working due to missing Firebase plugin
- Format load to 1 decimal place

## [v1.7.008](https://github.com/ZoneMinder/zmNinja/tree/v1.7.008) (2025-08-09)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.7.007...v1.7.008)

- Target android 34
- Don't show Function on ZoneMinder instances that do not have it. Instead show Capturing/Analysing/Recording options.
- Bug fixes to Monitor Groups
- Add Lithuanian translation
- Bump versions of various dependencies
- fix lack of connKey after selecting visible monitors.  Add monitor.Capturing case.  Use monitor specific API and stream status urls
- Updated FAQ entries

## [v1.7.007](https://github.com/ZoneMinder/zmNinja/tree/v1.7.007) (2024-03-03)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.7.006...v1.7.007)

- Switch internal webview paths from https to http
- This resolves issues on Android loading events and live views from non-https servers.


## [v1.7.006](https://github.com/ZoneMinder/zmNinja/tree/v1.7.006) (2024-01-22)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.7.005...v1.7.006)

- Fix **EXCEPTION**ReferenceError: currentVersion is not defined caused by undefined when saving monitor config.


## [v1.7.005](https://github.com/ZoneMinder/zmNinja/tree/v1.7.005) (2024-01-04)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.7.004...v1.7.005)

- fix NVR.genConnKey not being defined, causing lots of breakage.


## [v1.7.004](https://github.com/ZoneMinder/zmNinja/tree/v1.7.004) (2023-12-22)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.7.003...v1.7.004)

- Implement 1.37 support for Deleted and Capturing monitor fields.
- Fix error when closing montage profile edit
- Prevent setting img src to undefined due to imageSpinnerSrc being undefined.
- Add login credentials to API login?
- Fix connKey becoming undefined due to use of regenConnKey instead of genConnKey


## [v1.7.003](https://github.com/ZoneMinder/zmNinja/tree/v1.7.003) (2023-12-07)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.7.002...v1.7.003)

- Fix Montage using snapshot mode instead of full streaming

## [v1.7.002](https://github.com/ZoneMinder/zmNinja/tree/v1.7.002) (2023-11-28)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.6.009...v1.7.002)

- Updates to build on modern Android and IOS
- Refresh auth tokens early to reduce logging of expired tokens.
- Add support for ZM 1.37

## [v1.6.009](https://github.com/ZoneMinder/zmNinja/tree/v1.6.009) (2021-07-14)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.6.008...v1.6.009)

**Fixed bugs:**

- Adding new monitors seems to mess up organization and always get turned off [\#1067](https://github.com/ZoneMinder/zmNinja/issues/1067)
- Montage profiles [\#1057](https://github.com/ZoneMinder/zmNinja/issues/1057)

**Closed issues:**

- zmNinja end of life notice [\#1081](https://github.com/ZoneMinder/zmNinja/issues/1081)
- 24hr Review when accessed from different time zone, pulls old events. [\#1074](https://github.com/ZoneMinder/zmNinja/issues/1074)
- Delay when playing events [\#1073](https://github.com/ZoneMinder/zmNinja/issues/1073)
- Auto play while viewing videos from Events List doesn't respect "hidden" attribute [\#1072](https://github.com/ZoneMinder/zmNinja/issues/1072)
- zmNinja not working properly with Zoneminder v1.36.1 [\#1069](https://github.com/ZoneMinder/zmNinja/issues/1069)
- No monitors visible after upgrade to 1.36.0 [\#1066](https://github.com/ZoneMinder/zmNinja/issues/1066)
- No windows build of v1.6.008 [\#1064](https://github.com/ZoneMinder/zmNinja/issues/1064)
- small issue since you changed the app to stack unread notifications. [\#1051](https://github.com/ZoneMinder/zmNinja/issues/1051)
- Copying log creates semi-permanent text overlay on display outside app - zmNinja Android 10 - OnePlus 6 [\#1021](https://github.com/ZoneMinder/zmNinja/issues/1021)

**Merged pull requests:**

- EOL [\#1080](https://github.com/ZoneMinder/zmNinja/pull/1080) ([florie1706](https://github.com/florie1706))
- EOL [\#1079](https://github.com/ZoneMinder/zmNinja/pull/1079) ([maymaymay](https://github.com/maymaymay))
- \#1073 formatting and cosmetics... [\#1076](https://github.com/ZoneMinder/zmNinja/pull/1076) ([maymaymay](https://github.com/maymaymay))
- \#1067 make sure we don't get stuck in a loop between ZM groups and mo… [\#1071](https://github.com/ZoneMinder/zmNinja/pull/1071) ([florie1706](https://github.com/florie1706))
- \#1067 make sure we don't get stuck in a loop between ZM groups and mo… [\#1070](https://github.com/ZoneMinder/zmNinja/pull/1070) ([maymaymay](https://github.com/maymaymay))
- update zh\_TW translation and apply translation to some texts [\#1063](https://github.com/ZoneMinder/zmNinja/pull/1063) ([civita](https://github.com/civita))
-  \#1057 bazillion hacks to make this work [\#1062](https://github.com/ZoneMinder/zmNinja/pull/1062) ([florie1706](https://github.com/florie1706))
- \#1057 bazillion hacks to make this work [\#1061](https://github.com/ZoneMinder/zmNinja/pull/1061) ([maymaymay](https://github.com/maymaymay))

## [v1.6.008](https://github.com/ZoneMinder/zmNinja/tree/v1.6.008) (2021-04-18)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.6.006...v1.6.008)

**Implemented enhancements:**

- add traditional chinese translation \(正體中文\) [\#1059](https://github.com/ZoneMinder/zmNinja/pull/1059) ([civita](https://github.com/civita))

**Fixed bugs:**

- Monitors that don't have analysis enabled are not shown in zmNinja [\#1055](https://github.com/ZoneMinder/zmNinja/issues/1055)
- Issue when disabling all cameras in zmES settings of zmNinja [\#1050](https://github.com/ZoneMinder/zmNinja/issues/1050)
- Monitors not updating in zmNinja after RUN state change. [\#1047](https://github.com/ZoneMinder/zmNinja/issues/1047)
- ZM Multi Port breaks individual feed views. [\#1046](https://github.com/ZoneMinder/zmNinja/issues/1046)
- Video will not rotate to landscape in iOS 14 when tilted left after update to 1.6.006 [\#1045](https://github.com/ZoneMinder/zmNinja/issues/1045)
- Timeline tap broken in 1.6.006 for mobile devices [\#1044](https://github.com/ZoneMinder/zmNinja/issues/1044)

**Closed issues:**

- WSS isnt updating the token.txt, WS works. [\#1060](https://github.com/ZoneMinder/zmNinja/issues/1060)
- Old ZM version [\#1054](https://github.com/ZoneMinder/zmNinja/issues/1054)
- Replay in H264 passthrough very slow to start and in X264 start immediately [\#1049](https://github.com/ZoneMinder/zmNinja/issues/1049)
- Pending Auth [\#1048](https://github.com/ZoneMinder/zmNinja/issues/1048)

**Merged pull requests:**

- update translation [\#1058](https://github.com/ZoneMinder/zmNinja/pull/1058) ([florie1706](https://github.com/florie1706))
- \#1050 don't allow all monitors to be disabled in ES, show monitor sub… [\#1053](https://github.com/ZoneMinder/zmNinja/pull/1053) ([florie1706](https://github.com/florie1706))
- \#1050 don't allow all monitors to be disabled in ES, show monitor sub… [\#1052](https://github.com/ZoneMinder/zmNinja/pull/1052) ([maymaymay](https://github.com/maymaymay))
- \#1039 prompt before delete [\#1042](https://github.com/ZoneMinder/zmNinja/pull/1042) ([maymaymay](https://github.com/maymaymay))

## [v1.6.006](https://github.com/ZoneMinder/zmNinja/tree/v1.6.006) (2021-02-20)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.6.004...v1.6.006)

**Implemented enhancements:**

- Apple M1 support [\#1041](https://github.com/ZoneMinder/zmNinja/issues/1041)
- Look at providing a notification \(mobile only\) when a video download completes [\#1034](https://github.com/ZoneMinder/zmNinja/issues/1034)
- Feature request: snooze button for alarm notifications [\#959](https://github.com/ZoneMinder/zmNinja/issues/959)
- Android TV Support [\#285](https://github.com/ZoneMinder/zmNinja/issues/285)

**Fixed bugs:**

- Starting zminja on Android with montage previously set to full screen does not hide status/nav bar [\#1026](https://github.com/ZoneMinder/zmNinja/issues/1026)
- Saving snapshots from video [\#1024](https://github.com/ZoneMinder/zmNinja/issues/1024)
- Notifications for events from unchecked monitor. [\#1022](https://github.com/ZoneMinder/zmNinja/issues/1022)

**Closed issues:**

- Tileing incorrect on Windows [\#1043](https://github.com/ZoneMinder/zmNinja/issues/1043)
- Delete event no confirmation. [\#1039](https://github.com/ZoneMinder/zmNinja/issues/1039)
- zmNinja mobile stuck at "Loading Monitors" [\#1038](https://github.com/ZoneMinder/zmNinja/issues/1038)
- Events do not work [\#1037](https://github.com/ZoneMinder/zmNinja/issues/1037)
- API access to zoneminder borked with PHP 8 update. [\#1036](https://github.com/ZoneMinder/zmNinja/issues/1036)
- Unable to download footage using Android app [\#1031](https://github.com/ZoneMinder/zmNinja/issues/1031)
- Three dots for events preview [\#1030](https://github.com/ZoneMinder/zmNinja/issues/1030)
- Run script on alarm \(desktop version\) [\#1029](https://github.com/ZoneMinder/zmNinja/issues/1029)
- Building from source Hook failed error 02\_jshint.js [\#1028](https://github.com/ZoneMinder/zmNinja/issues/1028)
- Timeline not loading over WAN [\#1027](https://github.com/ZoneMinder/zmNinja/issues/1027)
- Stuck on loading monitors [\#1025](https://github.com/ZoneMinder/zmNinja/issues/1025)
- Black video with H.265 [\#1023](https://github.com/ZoneMinder/zmNinja/issues/1023)
- Recorded Events Viewing - Difference In Behavior Between Desktop And Mobile ZMNinja [\#1016](https://github.com/ZoneMinder/zmNinja/issues/1016)
- Events Filter by Hidden Camera No Results [\#1012](https://github.com/ZoneMinder/zmNinja/issues/1012)
- zmNinja stops responding when Timeline selected \(some android devices?\) [\#1006](https://github.com/ZoneMinder/zmNinja/issues/1006)
- Android - Attempting to skip to another part of event video causes video to crash [\#999](https://github.com/ZoneMinder/zmNinja/issues/999)
- Cannot Switch Between Servers Using New People Icon [\#749](https://github.com/ZoneMinder/zmNinja/issues/749)
- support the proposed 'web' monitor type [\#601](https://github.com/ZoneMinder/zmNinja/issues/601)

**Merged pull requests:**

- new interface to restart ES [\#1033](https://github.com/ZoneMinder/zmNinja/pull/1033) ([florie1706](https://github.com/florie1706))
- new interface to restart ES [\#1032](https://github.com/ZoneMinder/zmNinja/pull/1032) ([maymaymay](https://github.com/maymaymay))

## [v1.6.004](https://github.com/ZoneMinder/zmNinja/tree/v1.6.004) (2020-12-11)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.6.000...v1.6.004)

**Implemented enhancements:**

- Arm64 support [\#1017](https://github.com/ZoneMinder/zmNinja/issues/1017)

**Fixed bugs:**

- Cannot download videos - zmNinja Android 10 - OnePlus 6 [\#1020](https://github.com/ZoneMinder/zmNinja/issues/1020)
- Swipe left on video no longer honours filter [\#1015](https://github.com/ZoneMinder/zmNinja/issues/1015)
- Seamless play not respecting filters [\#1008](https://github.com/ZoneMinder/zmNinja/issues/1008)

**Closed issues:**

- electron crash [\#1019](https://github.com/ZoneMinder/zmNinja/issues/1019)
- "event still recording" in all events footage   [\#1014](https://github.com/ZoneMinder/zmNinja/issues/1014)
- events sorted oldest to newest [\#1013](https://github.com/ZoneMinder/zmNinja/issues/1013)
- AM/PM and no image with notification [\#1010](https://github.com/ZoneMinder/zmNinja/issues/1010)
- IOS 9.3.5 and ZMNINJA 1.3.025 error api  [\#1009](https://github.com/ZoneMinder/zmNinja/issues/1009)
- Increase Zoom Level [\#1005](https://github.com/ZoneMinder/zmNinja/issues/1005)
- I havent changed anything at all but now im getting BADAUTH on event server and it fails to send me a push message [\#1001](https://github.com/ZoneMinder/zmNinja/issues/1001)
- No Longer Receive ES Notifications After Latest App Update \(Android\) [\#1000](https://github.com/ZoneMinder/zmNinja/issues/1000)
- Event server not supported after zmninja upgrade [\#998](https://github.com/ZoneMinder/zmNinja/issues/998)
- A corrupt/missing frame for an event kills the Event List in the Windows Client [\#972](https://github.com/ZoneMinder/zmNinja/issues/972)

**Merged pull requests:**

- \#1039 prompt before delete [\#1040](https://github.com/ZoneMinder/zmNinja/pull/1040) ([florie1706](https://github.com/florie1706))
- Update source.rst [\#1007](https://github.com/ZoneMinder/zmNinja/pull/1007) ([nestorwheelock](https://github.com/nestorwheelock))

## [v1.6.000](https://github.com/ZoneMinder/zmNinja/tree/v1.6.000) (2020-10-12)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.4.009...v1.6.000)

**Implemented enhancements:**

- Support multiple event thumb sizes [\#995](https://github.com/ZoneMinder/zmNinja/issues/995)
- Support Notches in devices [\#967](https://github.com/ZoneMinder/zmNinja/issues/967)
- Migrate from Push Plugin to firebasex [\#962](https://github.com/ZoneMinder/zmNinja/issues/962)
- Event list improvements [\#963](https://github.com/ZoneMinder/zmNinja/pull/963) ([lucasnz](https://github.com/lucasnz))

**Fixed bugs:**

- Green dots in Android Montage if it is the first screen [\#983](https://github.com/ZoneMinder/zmNinja/issues/983)
- iOS zmNinja sends token for platform Android [\#960](https://github.com/ZoneMinder/zmNinja/issues/960)
- No images on iOS with zmNinja 1.4.009 [\#958](https://github.com/ZoneMinder/zmNinja/issues/958)

**Closed issues:**

- Like to have a better filename for Snapshots [\#989](https://github.com/ZoneMinder/zmNinja/issues/989)
- zmninja Montage not owrking/blank screen, monitors work and stream, montage blank, monitors enabled [\#982](https://github.com/ZoneMinder/zmNinja/issues/982)
- zmNinja Pro not showing streaming images while zm website is ok [\#969](https://github.com/ZoneMinder/zmNinja/issues/969)
- Trial or test version [\#961](https://github.com/ZoneMinder/zmNinja/issues/961)
- Loading Events Delay [\#957](https://github.com/ZoneMinder/zmNinja/issues/957)
- 1.4.7, 1.4.9 Desktop installer failing on Windows [\#956](https://github.com/ZoneMinder/zmNinja/issues/956)
- Zoneminder push notification problem on iOS with ZMNINJA [\#949](https://github.com/ZoneMinder/zmNinja/issues/949)
- Incorrect os in tokens.txt for ios version [\#943](https://github.com/ZoneMinder/zmNinja/issues/943)

**Merged pull requests:**

- Make build\_android.sh script more user friendly [\#994](https://github.com/ZoneMinder/zmNinja/pull/994) ([a-pavlov](https://github.com/a-pavlov))
- set event height for all rows [\#993](https://github.com/ZoneMinder/zmNinja/pull/993) ([lucasnz](https://github.com/lucasnz))
- switch to browser fetch to download media for desktops, use timestamp… [\#992](https://github.com/ZoneMinder/zmNinja/pull/992) ([florie1706](https://github.com/florie1706))
- switch to browser fetch to download media for desktops, use timestamp… [\#991](https://github.com/ZoneMinder/zmNinja/pull/991) ([maymaymay](https://github.com/maymaymay))
- After rotate, scroll the view back to the event we were looking at [\#990](https://github.com/ZoneMinder/zmNinja/pull/990) ([lucasnz](https://github.com/lucasnz))
- add xsmall thumbs [\#988](https://github.com/ZoneMinder/zmNinja/pull/988) ([florie1706](https://github.com/florie1706))
- add xsmall thumbs [\#987](https://github.com/ZoneMinder/zmNinja/pull/987) ([maymaymay](https://github.com/maymaymay))
- Ui fixes [\#984](https://github.com/ZoneMinder/zmNinja/pull/984) ([lucasnz](https://github.com/lucasnz))
- large thumbs were being cropped a touch [\#980](https://github.com/ZoneMinder/zmNinja/pull/980) ([lucasnz](https://github.com/lucasnz))
- clock div is too wide and cropping recording friendly time [\#979](https://github.com/ZoneMinder/zmNinja/pull/979) ([lucasnz](https://github.com/lucasnz))
- fix help contact [\#978](https://github.com/ZoneMinder/zmNinja/pull/978) ([maymaymay](https://github.com/maymaymay))
- \#973 take care humanize time going to 2nd row [\#977](https://github.com/ZoneMinder/zmNinja/pull/977) ([florie1706](https://github.com/florie1706))
- \#973 take care humanize time going to 2nd row [\#976](https://github.com/ZoneMinder/zmNinja/pull/976) ([maymaymay](https://github.com/maymaymay))
- Resizing updates [\#975](https://github.com/ZoneMinder/zmNinja/pull/975) ([lucasnz](https://github.com/lucasnz))
- \#963 show filter text properly, also indicate selective monitors [\#968](https://github.com/ZoneMinder/zmNinja/pull/968) ([maymaymay](https://github.com/maymaymay))
-  \#963 show filter text properly, also indicate selective monitors [\#966](https://github.com/ZoneMinder/zmNinja/pull/966) ([florie1706](https://github.com/florie1706))
- \#963 allow size selection of thumbs [\#965](https://github.com/ZoneMinder/zmNinja/pull/965) ([maymaymay](https://github.com/maymaymay))
- Dev [\#964](https://github.com/ZoneMinder/zmNinja/pull/964) ([ZoneMinder](https://github.com/ZoneMinder))

## [v1.4.009](https://github.com/ZoneMinder/zmNinja/tree/v1.4.009) (2020-07-02)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.4.007...v1.4.009)

**Implemented enhancements:**

- Add ability to force MJPEG streaming per monitor [\#951](https://github.com/ZoneMinder/zmNinja/issues/951)

**Fixed bugs:**

- 1.4.3 encode URL seems broken at least on iOS \(Event/24 hr filters etc\) [\#933](https://github.com/ZoneMinder/zmNinja/issues/933)

**Closed issues:**

- Connection through WireGuard fails to communicate with API [\#955](https://github.com/ZoneMinder/zmNinja/issues/955)
- zmNinja not working on Mobile Data, but works properly on WiFi [\#952](https://github.com/ZoneMinder/zmNinja/issues/952)
- H265 not working in event view [\#950](https://github.com/ZoneMinder/zmNinja/issues/950)
- APK Download without playstore \(android\) [\#945](https://github.com/ZoneMinder/zmNinja/issues/945)
- ZMNinja stops working after a random period of time [\#938](https://github.com/ZoneMinder/zmNinja/issues/938)
- znNinja won't start when opening from a notification [\#911](https://github.com/ZoneMinder/zmNinja/issues/911)

**Merged pull requests:**

-  \#951 add forced mjpeg support on per monitor basis [\#954](https://github.com/ZoneMinder/zmNinja/pull/954) ([florie1706](https://github.com/florie1706))
- \#951 add forced mjpeg support on per monitor basis [\#953](https://github.com/ZoneMinder/zmNinja/pull/953) ([maymaymay](https://github.com/maymaymay))

## [v1.4.007](https://github.com/ZoneMinder/zmNinja/tree/v1.4.007) (2020-05-18)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.4.005...v1.4.007)

**Implemented enhancements:**

- Support ZM Groups \(requires new ZM API in 1.35\) [\#939](https://github.com/ZoneMinder/zmNinja/issues/939)

**Fixed bugs:**

- zmNinja goes to login screen randomly [\#942](https://github.com/ZoneMinder/zmNinja/issues/942)
- zmNinja not loading monitors and Event list after the upgrade to 1.4.004 [\#935](https://github.com/ZoneMinder/zmNinja/issues/935)

**Closed issues:**

- ZM Auth not working [\#910](https://github.com/ZoneMinder/zmNinja/issues/910)

## [v1.4.005](https://github.com/ZoneMinder/zmNinja/tree/v1.4.005) (2020-05-01)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.4.004...v1.4.005)

## [v1.4.004](https://github.com/ZoneMinder/zmNinja/tree/v1.4.004) (2020-04-30)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.4.3...v1.4.004)

**Implemented enhancements:**

- Add option to hide footers in montage [\#931](https://github.com/ZoneMinder/zmNinja/issues/931)
- Allow automatic distribution in montage based on number of columns [\#930](https://github.com/ZoneMinder/zmNinja/issues/930)

## [v1.4.3](https://github.com/ZoneMinder/zmNinja/tree/v1.4.3) (2020-04-28)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.096...v1.4.3)

**Implemented enhancements:**

- New language: Simplified Chinese [\#925](https://github.com/ZoneMinder/zmNinja/issues/925)

**Fixed bugs:**

- ZM Authentication settings does not update user restricted monitors [\#926](https://github.com/ZoneMinder/zmNinja/issues/926)
- iOS push registration not working \(identifies as desktop\) [\#922](https://github.com/ZoneMinder/zmNinja/issues/922)
- Double encoded URLs [\#920](https://github.com/ZoneMinder/zmNinja/issues/920)
- iPadOS 13.4 header icons/controls overlay OS Time/date/battery etc. [\#919](https://github.com/ZoneMinder/zmNinja/issues/919)

**Closed issues:**

-  Disable alarm  notification for a specific camera or all [\#929](https://github.com/ZoneMinder/zmNinja/issues/929)
- Live view not working in zmNinja Pro but is working in web browser [\#928](https://github.com/ZoneMinder/zmNinja/issues/928)
- zmNinja for Blue Iris. \(biNinja?\) [\#918](https://github.com/ZoneMinder/zmNinja/issues/918)
- \[DESKTOP\] Swiping through Event previews gets slower until returning to event view. [\#904](https://github.com/ZoneMinder/zmNinja/issues/904)

## [v1.3.096](https://github.com/ZoneMinder/zmNinja/tree/v1.3.096) (2020-04-01)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.091...v1.3.096)

**Fixed bugs:**

- 24hr format: incorrect sorting once in a while [\#912](https://github.com/ZoneMinder/zmNinja/issues/912)

**Closed issues:**

- All live views are blank since upgrading to 1.34.8 [\#916](https://github.com/ZoneMinder/zmNinja/issues/916)
- Start removing any/all UIWebView references [\#914](https://github.com/ZoneMinder/zmNinja/issues/914)
- 24 hr format more performance improvements [\#913](https://github.com/ZoneMinder/zmNinja/issues/913)
- Full screen montage - menu button overrides monitor event buttons [\#909](https://github.com/ZoneMinder/zmNinja/issues/909)
- Feature request: skip over idle periods when playing videos from 'mocord' mode [\#896](https://github.com/ZoneMinder/zmNinja/issues/896)

## [v1.3.091](https://github.com/ZoneMinder/zmNinja/tree/v1.3.091) (2020-03-18)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.089...v1.3.091)

**Fixed bugs:**

- Montage screen often doesn't load monitors [\#908](https://github.com/ZoneMinder/zmNinja/issues/908)
- “zmninjapro” Desktop app can’t be opened in Catalina because Apple cannot check it for malicious software. [\#906](https://github.com/ZoneMinder/zmNinja/issues/906)

**Closed issues:**

- ZM APi not working [\#907](https://github.com/ZoneMinder/zmNinja/issues/907)
- Change the layout of the montage page? [\#905](https://github.com/ZoneMinder/zmNinja/issues/905)
- High value on AUTH\_HASH\_TTL in zoneminder gives zmninja auth timeout problems [\#893](https://github.com/ZoneMinder/zmNinja/issues/893)

## [v1.3.089](https://github.com/ZoneMinder/zmNinja/tree/v1.3.089) (2020-02-24)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.088...v1.3.089)

**Fixed bugs:**

- Push notifications don't take the app to the screen designated in ES Settings [\#903](https://github.com/ZoneMinder/zmNinja/issues/903)
- Navigating/scrubbing timeline for playback does not work over red motion indicators [\#897](https://github.com/ZoneMinder/zmNinja/issues/897)

**Closed issues:**

- Update checker - Linux AppImage [\#902](https://github.com/ZoneMinder/zmNinja/issues/902)

## [v1.3.088](https://github.com/ZoneMinder/zmNinja/tree/v1.3.088) (2020-02-21)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.085...v1.3.088)

**Implemented enhancements:**

- Add swedish language [\#892](https://github.com/ZoneMinder/zmNinja/issues/892)

**Fixed bugs:**

- live streams do not recover after monitors crash [\#901](https://github.com/ZoneMinder/zmNinja/issues/901)
- Configuration wizard appears fails - uses old credentials when new tokens are available [\#900](https://github.com/ZoneMinder/zmNinja/issues/900)
- montage sporadic freezes \(possibly triggered by unstable RTSP\) [\#894](https://github.com/ZoneMinder/zmNinja/issues/894)
- Help buttons don't seem to work on Android [\#890](https://github.com/ZoneMinder/zmNinja/issues/890)
- Error: Cannot find module 'object-keys' [\#884](https://github.com/ZoneMinder/zmNinja/issues/884)
- SaveDevOptions -\> \*\*EXCEPTION\*\*TypeError: Cannot read property 'replace' of undefined caused by undefined [\#883](https://github.com/ZoneMinder/zmNinja/issues/883)
- Performance issues with "24hr Review" mode [\#882](https://github.com/ZoneMinder/zmNinja/issues/882)

**Closed issues:**

- Android 8 notification looks like it should be showing an image when expanded but it doesn't [\#899](https://github.com/ZoneMinder/zmNinja/issues/899)
- zmNinja getting wrong server time [\#898](https://github.com/ZoneMinder/zmNinja/issues/898)
- API Problem \(Desktop and mobile\) [\#895](https://github.com/ZoneMinder/zmNinja/issues/895)
- CryptoAES decryption takes time on mobile devices after a while [\#886](https://github.com/ZoneMinder/zmNinja/issues/886)
- Duplicate monitors appearing in montage [\#881](https://github.com/ZoneMinder/zmNinja/issues/881)
- PTZ - zmNinja sends start but no stop [\#880](https://github.com/ZoneMinder/zmNinja/issues/880)
- zmNinja live view fills PATH\_SWAP [\#873](https://github.com/ZoneMinder/zmNinja/issues/873)
- Provide a flatpak on flathub [\#868](https://github.com/ZoneMinder/zmNinja/issues/868)

## [v1.3.085](https://github.com/ZoneMinder/zmNinja/tree/v1.3.085) (2019-12-27)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.082...v1.3.085)

**Implemented enhancements:**

- Add custom header & id to zmninja \(X-ZmNinja/id=\) [\#876](https://github.com/ZoneMinder/zmNinja/issues/876)
- zmNinja Desktop Filter Event input dialog  ignores system date & time formats [\#875](https://github.com/ZoneMinder/zmNinja/issues/875)

**Fixed bugs:**

- Thumbnails on Events List being displayed with incorrect aspect ratio [\#872](https://github.com/ZoneMinder/zmNinja/issues/872)
- browser links don't work on iOS 13+ [\#869](https://github.com/ZoneMinder/zmNinja/issues/869)
- Last row in timeline view layout pushes thumbnail off the screen [\#866](https://github.com/ZoneMinder/zmNinja/issues/866)

**Closed issues:**

- zmNinja app will not open on iOS 10.3.4 [\#877](https://github.com/ZoneMinder/zmNinja/issues/877)
- API problem... [\#874](https://github.com/ZoneMinder/zmNinja/issues/874)
- clean up monitor change state view \(especially global\), allow folks to turn motion detection on/off easily [\#867](https://github.com/ZoneMinder/zmNinja/issues/867)
- Not playing live stream - iOS. Works on Desktop App version, and Mobile Zoneminder Website. [\#856](https://github.com/ZoneMinder/zmNinja/issues/856)

## [v1.3.082](https://github.com/ZoneMinder/zmNinja/tree/v1.3.082) (2019-11-12)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.079...v1.3.082)

**Implemented enhancements:**

- Allow timelines to scroll vertically within its window [\#859](https://github.com/ZoneMinder/zmNinja/issues/859)
- Implement an API caching layer for performance [\#857](https://github.com/ZoneMinder/zmNinja/issues/857)

**Fixed bugs:**

- Fix timeline doubletapping on mobile \(iOS\) [\#863](https://github.com/ZoneMinder/zmNinja/issues/863)

**Closed issues:**

- Enhancement: Zoom for Events List [\#855](https://github.com/ZoneMinder/zmNinja/issues/855)

## [v1.3.079](https://github.com/ZoneMinder/zmNinja/tree/v1.3.079) (2019-10-16)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.078...v1.3.079)

**Implemented enhancements:**

- Hide buttons and controls in live/events view if you single tap \(toggle on off on tap\) [\#854](https://github.com/ZoneMinder/zmNinja/issues/854)

**Closed issues:**

- Link to desktop builds on website [\#853](https://github.com/ZoneMinder/zmNinja/issues/853)
- Do we have support for ionic4 [\#851](https://github.com/ZoneMinder/zmNinja/issues/851)
- zmNinja issue when connected via Mobile data [\#850](https://github.com/ZoneMinder/zmNinja/issues/850)
- event playback mode [\#849](https://github.com/ZoneMinder/zmNinja/issues/849)
- cycle montage not working [\#828](https://github.com/ZoneMinder/zmNinja/issues/828)

## [v1.3.078](https://github.com/ZoneMinder/zmNinja/tree/v1.3.078) (2019-08-23)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.074...v1.3.078)

**Fixed bugs:**

- Timescale logic is wrong for filtering everywhere [\#848](https://github.com/ZoneMinder/zmNinja/issues/848)
- Android 9: Back button doesn't work properly [\#846](https://github.com/ZoneMinder/zmNinja/issues/846)
- No exit event view option on iOS v1.3.070 release [\#839](https://github.com/ZoneMinder/zmNinja/issues/839)

**Closed issues:**

- "Authentication Success" reported, even when not possible [\#847](https://github.com/ZoneMinder/zmNinja/issues/847)
- cannot view events from monitors not present in montage view [\#844](https://github.com/ZoneMinder/zmNinja/issues/844)
- Cannot select different server while connection attempt is ongoing [\#842](https://github.com/ZoneMinder/zmNinja/issues/842)

## [v1.3.074](https://github.com/ZoneMinder/zmNinja/tree/v1.3.074) (2019-08-10)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.070...v1.3.074)

**Fixed bugs:**

- Android 9.0 breaks HTTP access [\#841](https://github.com/ZoneMinder/zmNinja/issues/841)
- Analyze event option - exit broke [\#840](https://github.com/ZoneMinder/zmNinja/issues/840)

**Closed issues:**

- Works on iPad but not on iPhone [\#838](https://github.com/ZoneMinder/zmNinja/issues/838)

## [v1.3.070](https://github.com/ZoneMinder/zmNinja/tree/v1.3.070) (2019-07-23)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.066...v1.3.070)

**Implemented enhancements:**

- gapless playback support for mp4 events [\#837](https://github.com/ZoneMinder/zmNinja/issues/837)
- Allow kiosk mode  [\#830](https://github.com/ZoneMinder/zmNinja/issues/830)

**Fixed bugs:**

- fallbacks are broken [\#833](https://github.com/ZoneMinder/zmNinja/issues/833)
- Navigation from monitor view to event view broke in mobile devices [\#832](https://github.com/ZoneMinder/zmNinja/issues/832)
- Add a relogin timer for tokens [\#829](https://github.com/ZoneMinder/zmNinja/issues/829)

**Closed issues:**

- Got a stream wtihin local network. No stream from outside network [\#834](https://github.com/ZoneMinder/zmNinja/issues/834)

## [v1.3.066](https://github.com/ZoneMinder/zmNinja/tree/v1.3.066) (2019-07-01)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.065...v1.3.066)

## [v1.3.065](https://github.com/ZoneMinder/zmNinja/tree/v1.3.065) (2019-07-01)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.061...v1.3.065)

**Fixed bugs:**

- Don't close event playback if video controls were pressed quickly [\#827](https://github.com/ZoneMinder/zmNinja/issues/827)
- Linux installer - doesn't install into favorites [\#826](https://github.com/ZoneMinder/zmNinja/issues/826)
- Layout No Longer Saves [\#823](https://github.com/ZoneMinder/zmNinja/issues/823)
- It is not possible to view a full-size frame from a thumbnail in the analysis view [\#822](https://github.com/ZoneMinder/zmNinja/issues/822)

**Closed issues:**

- \[Desktop\] Request - Zoom for events on none touchscreen. [\#815](https://github.com/ZoneMinder/zmNinja/issues/815)
- Enhancement: add system state info in  "System status" item menu [\#812](https://github.com/ZoneMinder/zmNinja/issues/812)

## [v1.3.061](https://github.com/ZoneMinder/zmNinja/tree/v1.3.061) (2019-06-06)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.060...v1.3.061)

**Closed issues:**

- Unable to view video streams [\#821](https://github.com/ZoneMinder/zmNinja/issues/821)

## [v1.3.060](https://github.com/ZoneMinder/zmNinja/tree/v1.3.060) (2019-06-05)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.057...v1.3.060)

## [v1.3.057](https://github.com/ZoneMinder/zmNinja/tree/v1.3.057) (2019-05-28)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.056...v1.3.057)

**Implemented enhancements:**

- Support new token system in ZM [\#817](https://github.com/ZoneMinder/zmNinja/issues/817)
- Montage Bling: Unseen events, event playback, event details [\#806](https://github.com/ZoneMinder/zmNinja/issues/806)
- Add menu item for navigation from monitor live view to event list [\#803](https://github.com/ZoneMinder/zmNinja/issues/803)

**Fixed bugs:**

- iOS App. API Access Error. ZM 1.33.9 [\#820](https://github.com/ZoneMinder/zmNinja/issues/820)
- ZMNinja pro gets stuck with grey empty screen before even getting to setup step [\#816](https://github.com/ZoneMinder/zmNinja/issues/816)
-  Error: File to import not found or unreadable: www/lib/ionic/scss/ionic [\#809](https://github.com/ZoneMinder/zmNinja/issues/809)
- Montage profiles breaks if you don't save all-monitors at least once [\#808](https://github.com/ZoneMinder/zmNinja/issues/808)
- Incorrect behaviour when using "next event" in the event modal depending on how zmNinja was started. [\#807](https://github.com/ZoneMinder/zmNinja/issues/807)
- Event list footage play speed is no longer persisted [\#805](https://github.com/ZoneMinder/zmNinja/issues/805)

**Closed issues:**

- What does the man on bicycle icon does? [\#818](https://github.com/ZoneMinder/zmNinja/issues/818)
- zmNinja push toasts not fully rendering image [\#813](https://github.com/ZoneMinder/zmNinja/issues/813)
- Enhancement: View Object Detection Images in zmninja [\#804](https://github.com/ZoneMinder/zmNinja/issues/804)
- Cannot run zmN v1.3.42 or v1.3.50 on RPi 3 Model B [\#789](https://github.com/ZoneMinder/zmNinja/issues/789)
- Do not see video with ios 10.3.3 Ipad [\#785](https://github.com/ZoneMinder/zmNinja/issues/785)

## [v1.3.056](https://github.com/ZoneMinder/zmNinja/tree/v1.3.056) (2019-04-02)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.050...v1.3.056)

**Implemented enhancements:**

- Add thumbnail to timeline and hover \(desktop only\) capability [\#796](https://github.com/ZoneMinder/zmNinja/issues/796)
- Add automated test harness [\#791](https://github.com/ZoneMinder/zmNinja/issues/791)
- Password protect desktop instance [\#784](https://github.com/ZoneMinder/zmNinja/issues/784)

**Fixed bugs:**

- Fix multi-server port/protocol differences [\#800](https://github.com/ZoneMinder/zmNinja/issues/800)
- App not working on Android 6 10 inch tablet [\#793](https://github.com/ZoneMinder/zmNinja/issues/793)
- Unable to change state [\#786](https://github.com/ZoneMinder/zmNinja/issues/786)

**Closed issues:**

- remove bower [\#801](https://github.com/ZoneMinder/zmNinja/issues/801)
- Everything looks good but no push notifications [\#799](https://github.com/ZoneMinder/zmNinja/issues/799)
- Unable start after build [\#788](https://github.com/ZoneMinder/zmNinja/issues/788)
- Video URLs undefined [\#787](https://github.com/ZoneMinder/zmNinja/issues/787)
- iOS log view issues & improvements [\#767](https://github.com/ZoneMinder/zmNinja/issues/767)

## [v1.3.050](https://github.com/ZoneMinder/zmNinja/tree/v1.3.050) (2019-02-25)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.043...v1.3.050)

## [v1.3.043](https://github.com/ZoneMinder/zmNinja/tree/v1.3.043) (2019-02-24)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.042...v1.3.043)

**Implemented enhancements:**

- Update Event List dynamically [\#779](https://github.com/ZoneMinder/zmNinja/issues/779)

**Fixed bugs:**

- Fix Event Server message handling [\#781](https://github.com/ZoneMinder/zmNinja/issues/781)
- event popover doesn't work at times [\#780](https://github.com/ZoneMinder/zmNinja/issues/780)
- \[Desktop\] top menu bar goes away on specific event view [\#777](https://github.com/ZoneMinder/zmNinja/issues/777)

**Closed issues:**

- zmNinjaPro is not showing remote-cameras [\#778](https://github.com/ZoneMinder/zmNinja/issues/778)

## [v1.3.042](https://github.com/ZoneMinder/zmNinja/tree/v1.3.042) (2019-02-02)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.039...v1.3.042)

**Implemented enhancements:**

- Add picture messaging to iOS as well [\#776](https://github.com/ZoneMinder/zmNinja/issues/776)

**Fixed bugs:**

- Fix Event Montage [\#775](https://github.com/ZoneMinder/zmNinja/issues/775)
- zmninja no longer works with 307 redirects \(possibly caused by \#716?\) [\#772](https://github.com/ZoneMinder/zmNinja/issues/772)
- Image review via progress slider fails to navigate. [\#768](https://github.com/ZoneMinder/zmNinja/issues/768)
- Event playback scaling issue [\#766](https://github.com/ZoneMinder/zmNinja/issues/766)
- Inverted width/height thumbnails in Events List [\#765](https://github.com/ZoneMinder/zmNinja/issues/765)
- Montage Dropping out on the hour, after a few hours, potential auth refresh issue [\#758](https://github.com/ZoneMinder/zmNinja/issues/758)

**Closed issues:**

- API 401 Error - Basic Auth [\#774](https://github.com/ZoneMinder/zmNinja/issues/774)
- Desktop Build Errors for Linux64 [\#773](https://github.com/ZoneMinder/zmNinja/issues/773)
- Changing mode to MONITOR keeps monitor function as in MODECT mode [\#771](https://github.com/ZoneMinder/zmNinja/issues/771)
- zmNinja doesn't work Error: ZoneMinder authentication faild [\#770](https://github.com/ZoneMinder/zmNinja/issues/770)
- Live Stream Broken - Client Cert [\#769](https://github.com/ZoneMinder/zmNinja/issues/769)
- why montage using refresh instead of stream [\#764](https://github.com/ZoneMinder/zmNinja/issues/764)
- Monitor snapshot - desktop app [\#761](https://github.com/ZoneMinder/zmNinja/issues/761)
- Issues seeing live stream [\#756](https://github.com/ZoneMinder/zmNinja/issues/756)
- Running on Raspberry Pi, instructions unclear, not getting an electron window [\#750](https://github.com/ZoneMinder/zmNinja/issues/750)
- Multiple notifications on iOS 12 [\#729](https://github.com/ZoneMinder/zmNinja/issues/729)

## [v1.3.039](https://github.com/ZoneMinder/zmNinja/tree/v1.3.039) (2018-12-13)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.035...v1.3.039)

**Fixed bugs:**

- 1.3.037 - push notification icon in android is a block [\#762](https://github.com/ZoneMinder/zmNinja/issues/762)
- After update zmninja stops working [\#760](https://github.com/ZoneMinder/zmNinja/issues/760)
- Ctrl-Alt-D opens Chrome Developer Tools panel on Windows, no matter what app is active [\#759](https://github.com/ZoneMinder/zmNinja/issues/759)
- Portals that implement redirects don't work with web scrape \(Wizard\) [\#716](https://github.com/ZoneMinder/zmNinja/issues/716)

**Closed issues:**

- ZMninja ios update 1.3.033 'cleaning up' delays for failover switching [\#753](https://github.com/ZoneMinder/zmNinja/issues/753)

## [v1.3.035](https://github.com/ZoneMinder/zmNinja/tree/v1.3.035) (2018-12-11)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.032...v1.3.035)

**Fixed bugs:**

- zmNinja montage stops working randomly [\#757](https://github.com/ZoneMinder/zmNinja/issues/757)
- Event server crashed during websocket close  \(mobile\) [\#755](https://github.com/ZoneMinder/zmNinja/issues/755)

**Closed issues:**

- ZMNinja Server time zone wrong [\#754](https://github.com/ZoneMinder/zmNinja/issues/754)
- No camera controls when I click the push notification. Android. [\#752](https://github.com/ZoneMinder/zmNinja/issues/752)
- Sine Android update to 1.3.032 streaming does not work [\#748](https://github.com/ZoneMinder/zmNinja/issues/748)
- preview image on android is center cropped, not scaled. [\#747](https://github.com/ZoneMinder/zmNinja/issues/747)
- Various inputs/cleanups  [\#745](https://github.com/ZoneMinder/zmNinja/issues/745)

## [v1.3.032](https://github.com/ZoneMinder/zmNinja/tree/v1.3.032) (2018-11-24)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.029...v1.3.032)

**Closed issues:**

- Events playback doens't work in zmNinja with ZoneMinder 1.32.2 but works on native web interface [\#744](https://github.com/ZoneMinder/zmNinja/issues/744)

## [v1.3.029](https://github.com/ZoneMinder/zmNinja/tree/v1.3.029) (2018-11-07)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.018...v1.3.029)

**Implemented enhancements:**

- Add support to display storage information [\#733](https://github.com/ZoneMinder/zmNinja/issues/733)
- Allow full video downloads [\#710](https://github.com/ZoneMinder/zmNinja/issues/710)
- Is it possible to run zm ninja with dual screen? Two instances? [\#706](https://github.com/ZoneMinder/zmNinja/issues/706)

**Fixed bugs:**

- \(Android only\) Notifications don't arrive when a cellphone is locked  [\#726](https://github.com/ZoneMinder/zmNinja/issues/726)
- push onTap doesn't always work [\#725](https://github.com/ZoneMinder/zmNinja/issues/725)
- multi server multi storage event playback doesn't work [\#724](https://github.com/ZoneMinder/zmNinja/issues/724)

**Closed issues:**

- Windows client issues [\#739](https://github.com/ZoneMinder/zmNinja/issues/739)
- IOS Notifications not clearing [\#727](https://github.com/ZoneMinder/zmNinja/issues/727)
- migrate zmN to WKWebView [\#723](https://github.com/ZoneMinder/zmNinja/issues/723)
- How to view continuous events? [\#715](https://github.com/ZoneMinder/zmNinja/issues/715)
- Is the android version still available from Google Play? [\#713](https://github.com/ZoneMinder/zmNinja/issues/713)
- Recording playback fails after upgrade to ZM 1.32.0 [\#711](https://github.com/ZoneMinder/zmNinja/issues/711)
- Google Play store states app not compatible with Nvidia Shield Android TV [\#705](https://github.com/ZoneMinder/zmNinja/issues/705)

## [v1.3.018](https://github.com/ZoneMinder/zmNinja/tree/v1.3.018) (2018-09-14)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.016...v1.3.018)

**Implemented enhancements:**

- Allow easier switching between profiles [\#704](https://github.com/ZoneMinder/zmNinja/issues/704)

**Fixed bugs:**

- If multi-server recording server name doesn't have a protocol, zmN doesn't show feeds [\#702](https://github.com/ZoneMinder/zmNinja/issues/702)
- Authentification with new iOs app version [\#690](https://github.com/ZoneMinder/zmNinja/issues/690)
- Authentication broken with API Access Error [\#689](https://github.com/ZoneMinder/zmNinja/issues/689)

**Closed issues:**

- Allow better desktop packaging schemes [\#701](https://github.com/ZoneMinder/zmNinja/issues/701)
- Thumbnails not appearing in Events list [\#700](https://github.com/ZoneMinder/zmNinja/issues/700)
- switch between different Zoneminder servers [\#699](https://github.com/ZoneMinder/zmNinja/issues/699)
- Enable cloud sync [\#697](https://github.com/ZoneMinder/zmNinja/issues/697)
- iOS issues with Auth and zmNinja 1.3.017, with ZM 1.30.4 \(exploratory\) [\#696](https://github.com/ZoneMinder/zmNinja/issues/696)
- Live Streaming Does Not Work for iOS 11.4.1 [\#694](https://github.com/ZoneMinder/zmNinja/issues/694)
- Check for privacy disclaimer accept/reject status in ZM 1.31.47 and beyond [\#692](https://github.com/ZoneMinder/zmNinja/issues/692)
- Desktop - Clicking the event notify icon when an event is being viewed results in a "No events to display message" [\#674](https://github.com/ZoneMinder/zmNinja/issues/674)
- Allow navigation to detailed event playback from event montage [\#347](https://github.com/ZoneMinder/zmNinja/issues/347)
- Desktop: Window Title is Inconsistent [\#170](https://github.com/ZoneMinder/zmNinja/issues/170)

## [v1.3.016](https://github.com/ZoneMinder/zmNinja/tree/v1.3.016) (2018-08-24)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.013...v1.3.016)

**Implemented enhancements:**

- Support multi-window view on Android [\#682](https://github.com/ZoneMinder/zmNinja/issues/682)
- Add zmNinja keybindings for desktop [\#675](https://github.com/ZoneMinder/zmNinja/issues/675)

**Fixed bugs:**

- Not auto switching to fallback server [\#681](https://github.com/ZoneMinder/zmNinja/issues/681)
- Settings keep disappearing [\#680](https://github.com/ZoneMinder/zmNinja/issues/680)
- Authentication issues between zm 1.30.4 and zmNinja 1.3.013 [\#679](https://github.com/ZoneMinder/zmNinja/issues/679)
- Desktop - Event list thumbnails knock buttons out of view [\#673](https://github.com/ZoneMinder/zmNinja/issues/673)

**Closed issues:**

- Desktop app, no notifications. Works with ios app. [\#650](https://github.com/ZoneMinder/zmNinja/issues/650)
- Push Notification issue [\#639](https://github.com/ZoneMinder/zmNinja/issues/639)

## [v1.3.013](https://github.com/ZoneMinder/zmNinja/tree/v1.3.013) (2018-07-31)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.011...v1.3.013)

**Fixed bugs:**

- Android App sucked all my high speed data plan [\#647](https://github.com/ZoneMinder/zmNinja/issues/647)

## [v1.3.011](https://github.com/ZoneMinder/zmNinja/tree/v1.3.011) (2018-07-25)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.008...v1.3.011)

**Implemented enhancements:**

- Allow montage resize to work with finer grained control [\#669](https://github.com/ZoneMinder/zmNinja/issues/669)
- support new API login mechanism [\#668](https://github.com/ZoneMinder/zmNinja/issues/668)
- Enhancement: For desktop instances, would be cool to control cams motion \(PTZ\) using keyboard arrow keys [\#648](https://github.com/ZoneMinder/zmNinja/issues/648)

**Fixed bugs:**

- Fix FreeNAS 1.30.4 API issues + other stuff related to 1.32.0 login process vs 1.30.4 [\#676](https://github.com/ZoneMinder/zmNinja/issues/676)

**Closed issues:**

- Updating EventsController.php [\#672](https://github.com/ZoneMinder/zmNinja/issues/672)
- Montage frame rate  [\#666](https://github.com/ZoneMinder/zmNinja/issues/666)
- Zmeventnotification.pl Working but no push notifications [\#664](https://github.com/ZoneMinder/zmNinja/issues/664)
- Montage cannot load images and monitor streams will not load, but API calls succeed [\#658](https://github.com/ZoneMinder/zmNinja/issues/658)
- ZmNinjaDesktop on Linux64 \( ubuntu 16.04 \) touchscreen scrolling [\#642](https://github.com/ZoneMinder/zmNinja/issues/642)
- Enhancement: Change between running states from main menu big buttons or widget [\#633](https://github.com/ZoneMinder/zmNinja/issues/633)

## [v1.3.008](https://github.com/ZoneMinder/zmNinja/tree/v1.3.008) (2018-06-30)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.004...v1.3.008)

**Fixed bugs:**

- Event list incorrect after deleting first event in the list [\#651](https://github.com/ZoneMinder/zmNinja/issues/651)
- Time not properly displayed in the event modal when selecting 'next event' [\#649](https://github.com/ZoneMinder/zmNinja/issues/649)
- zmNinja - montage view - monitors don't show on first run, but show after login saved [\#641](https://github.com/ZoneMinder/zmNinja/issues/641)

**Closed issues:**

- Don't delete logs on coldstart. Android now that that every time [\#661](https://github.com/ZoneMinder/zmNinja/issues/661)
- Build instructions required for various platforms [\#659](https://github.com/ZoneMinder/zmNinja/issues/659)
- Cameras Slow [\#656](https://github.com/ZoneMinder/zmNinja/issues/656)
- Add privacy/transparency link [\#653](https://github.com/ZoneMinder/zmNinja/issues/653)
- Add hook before sending notification [\#652](https://github.com/ZoneMinder/zmNinja/issues/652)
- api update needed [\#610](https://github.com/ZoneMinder/zmNinja/issues/610)
- Can't build in IOS [\#609](https://github.com/ZoneMinder/zmNinja/issues/609)

## [v1.3.004](https://github.com/ZoneMinder/zmNinja/tree/v1.3.004) (2018-06-03)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.002...v1.3.004)

**Fixed bugs:**

- Certain android phones cannot store data [\#636](https://github.com/ZoneMinder/zmNinja/issues/636)
- Login succeeded but API failed [\#635](https://github.com/ZoneMinder/zmNinja/issues/635)
- 1.3.0 - live view not working if no auth is used [\#634](https://github.com/ZoneMinder/zmNinja/issues/634)

**Closed issues:**

- Desktop, at certain windows sizes the 24hr Preview frames will jiggle. [\#600](https://github.com/ZoneMinder/zmNinja/issues/600)
- Missing events if logged in zmNinja with non admin user [\#568](https://github.com/ZoneMinder/zmNinja/issues/568)
- Enhance System Status to show disk space details [\#430](https://github.com/ZoneMinder/zmNinja/issues/430)
- Order of persisted monitors should be reflected in timeline and when swiping prev/next in fullscreen view. [\#62](https://github.com/ZoneMinder/zmNinja/issues/62)

## [v1.3.002](https://github.com/ZoneMinder/zmNinja/tree/v1.3.002) (2018-05-24)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.001...v1.3.002)

## [v1.3.001](https://github.com/ZoneMinder/zmNinja/tree/v1.3.001) (2018-05-21)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.3.0...v1.3.001)

## [v1.3.0](https://github.com/ZoneMinder/zmNinja/tree/v1.3.0) (2018-05-18)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.515...v1.3.0)

**Implemented enhancements:**

- Allow alarm image browsing inside events modal view  [\#624](https://github.com/ZoneMinder/zmNinja/issues/624)
- Add ability to copy/paste text  [\#623](https://github.com/ZoneMinder/zmNinja/issues/623)
- Support storageareas multi-port [\#602](https://github.com/ZoneMinder/zmNinja/issues/602)
- event banner display motion zone [\#593](https://github.com/ZoneMinder/zmNinja/issues/593)
- Feature: delete events by swiping from the left and clicking a delete button. In events list view [\#547](https://github.com/ZoneMinder/zmNinja/issues/547)
- Feature: ability to delete an event from footage view [\#546](https://github.com/ZoneMinder/zmNinja/issues/546)
- NFR: Persistent timeline view scale and zoom level [\#361](https://github.com/ZoneMinder/zmNinja/issues/361)
- Add watch app extensions for live camera streams [\#221](https://github.com/ZoneMinder/zmNinja/issues/221)
- evaluate what it takes to implement client certificates [\#3](https://github.com/ZoneMinder/zmNinja/issues/3)

**Fixed bugs:**

- downloading MP4s on android don't work [\#621](https://github.com/ZoneMinder/zmNinja/issues/621)
- clean up event handlers \(memory leaks\) [\#611](https://github.com/ZoneMinder/zmNinja/issues/611)
- On resume, we often get "Event server connection error" [\#604](https://github.com/ZoneMinder/zmNinja/issues/604)
- Sometimes on start, authentication fails [\#603](https://github.com/ZoneMinder/zmNinja/issues/603)
- The resolution of \#553 breaks on some phones - window reload [\#598](https://github.com/ZoneMinder/zmNinja/issues/598)
- Wizard transforms basic auth credentials to lowercase when entered as part of portal URL [\#591](https://github.com/ZoneMinder/zmNinja/issues/591)
- increased CPU and/or memory usage over time [\#553](https://github.com/ZoneMinder/zmNinja/issues/553)
- 'camera disconnected' graphic changes thumbnail resolution in 'Montage' view, causing overlap. [\#528](https://github.com/ZoneMinder/zmNinja/issues/528)

**Closed issues:**

- Add basic auth token for apache mod\_header foo [\#618](https://github.com/ZoneMinder/zmNinja/issues/618)
- clean up neighbor event navigation and add video support for navigation [\#614](https://github.com/ZoneMinder/zmNinja/issues/614)
- remove basic auth user:password in URLs and convert to Authorization header [\#613](https://github.com/ZoneMinder/zmNinja/issues/613)
- cleanup streaming - big time [\#606](https://github.com/ZoneMinder/zmNinja/issues/606)
- New thumbnails don't load in Events List and 24hr Preview [\#599](https://github.com/ZoneMinder/zmNinja/issues/599)
- jesus christ [\#597](https://github.com/ZoneMinder/zmNinja/issues/597)
- testing probotsentiment [\#596](https://github.com/ZoneMinder/zmNinja/issues/596)
- bullshit issue - testing request info bot [\#595](https://github.com/ZoneMinder/zmNinja/issues/595)
- Live view not working in zmNinja Pro but is working in web browser and another APP [\#594](https://github.com/ZoneMinder/zmNinja/issues/594)
- Event listing time is incorrect  [\#592](https://github.com/ZoneMinder/zmNinja/issues/592)
- PTZ issues ... was working but doesn't seem to be now [\#590](https://github.com/ZoneMinder/zmNinja/issues/590)
- take out explicit SSL toggle switch in settings [\#589](https://github.com/ZoneMinder/zmNinja/issues/589)
- Allow playing recorded feed for in progress events from events view \(if possible\) [\#587](https://github.com/ZoneMinder/zmNinja/issues/587)
- Req: Android Wear [\#516](https://github.com/ZoneMinder/zmNinja/issues/516)
- Req: Picture-in-Picture [\#515](https://github.com/ZoneMinder/zmNinja/issues/515)
- zmNinja for Apple tvOS [\#449](https://github.com/ZoneMinder/zmNinja/issues/449)
- Improve event montage view [\#186](https://github.com/ZoneMinder/zmNinja/issues/186)

## [v1.2.515](https://github.com/ZoneMinder/zmNinja/tree/v1.2.515) (2018-01-11)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.513...v1.2.515)

**Implemented enhancements:**

- Introduce a new feature to give a 24 hr image only preview [\#570](https://github.com/ZoneMinder/zmNinja/issues/570)
- external app launch for monitor live view or event ID view [\#569](https://github.com/ZoneMinder/zmNinja/issues/569)
- play event on tap after new alarm notification received [\#563](https://github.com/ZoneMinder/zmNinja/issues/563)

**Fixed bugs:**

- if event server goes down, zmNinja keeps spawning new connections in "pending auth" state [\#579](https://github.com/ZoneMinder/zmNinja/issues/579)
- timeline tap/double-tap doesn't work well on mobile devices [\#577](https://github.com/ZoneMinder/zmNinja/issues/577)
- cleanup events page - avoid reloading view for filters & pullup footer often shows no entries  [\#576](https://github.com/ZoneMinder/zmNinja/issues/576)
- Saving event server settings is erratic + push received for monitors that are unchecked [\#499](https://github.com/ZoneMinder/zmNinja/issues/499)

**Closed issues:**

- Visibility icon is too close to Menu icon [\#582](https://github.com/ZoneMinder/zmNinja/issues/582)
- undefined Push notification error - Cannot save event server settings [\#572](https://github.com/ZoneMinder/zmNinja/issues/572)
- migrate from ng-websocket to angular-websocket [\#565](https://github.com/ZoneMinder/zmNinja/issues/565)
- UWP app in the works? [\#521](https://github.com/ZoneMinder/zmNinja/issues/521)

## [v1.2.513](https://github.com/ZoneMinder/zmNinja/tree/v1.2.513) (2017-12-11)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.511...v1.2.513)

## [v1.2.511](https://github.com/ZoneMinder/zmNinja/tree/v1.2.511) (2017-12-10)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.510...v1.2.511)

## [v1.2.510](https://github.com/ZoneMinder/zmNinja/tree/v1.2.510) (2017-12-10)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.507...v1.2.510)

**Implemented enhancements:**

- migrate push to firebase for a server less APNS/FCM solution [\#562](https://github.com/ZoneMinder/zmNinja/issues/562)
- Support new zms multiport feature \(isaac fork only, for now\) [\#561](https://github.com/ZoneMinder/zmNinja/issues/561)
- Thumbs in event page \(needs API update\) [\#91](https://github.com/ZoneMinder/zmNinja/issues/91)

**Closed issues:**

- locale-hu.json help-hu.html update [\#558](https://github.com/ZoneMinder/zmNinja/issues/558)

## [v1.2.507](https://github.com/ZoneMinder/zmNinja/tree/v1.2.507) (2017-11-06)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.504...v1.2.507)

**Implemented enhancements:**

- Add finger print auth for android \(already exists for iOS\) [\#555](https://github.com/ZoneMinder/zmNinja/issues/555)
- Re-orient the PTZ UI for limited space orientations [\#554](https://github.com/ZoneMinder/zmNinja/issues/554)

**Fixed bugs:**

- Selecting Timeline in zmNinja IOS app causes application freeze [\#551](https://github.com/ZoneMinder/zmNinja/issues/551)
- "the connection to the server was unsuccessful file ///android\_asset/www/index.html" [\#550](https://github.com/ZoneMinder/zmNinja/issues/550)
- zmninja 1.2.35D \(desktop\) for macos hangs with white screen [\#441](https://github.com/ZoneMinder/zmNinja/issues/441)

**Closed issues:**

- Login Auth Sucess but api failed Issue [\#552](https://github.com/ZoneMinder/zmNinja/issues/552)
- Lag when left in Full Screen Montage [\#526](https://github.com/ZoneMinder/zmNinja/issues/526)

## [v1.2.504](https://github.com/ZoneMinder/zmNinja/tree/v1.2.504) (2017-10-09)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.503...v1.2.504)

**Fixed bugs:**

- 1.2.503 broke timeline in Android & Desktop [\#549](https://github.com/ZoneMinder/zmNinja/issues/549)

**Closed issues:**

- System edit privileges required to permit non-admin to change camera mode [\#548](https://github.com/ZoneMinder/zmNinja/issues/548)
- Support for multiple screens \(desktop\) [\#543](https://github.com/ZoneMinder/zmNinja/issues/543)

## [v1.2.503](https://github.com/ZoneMinder/zmNinja/tree/v1.2.503) (2017-10-01)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.44...v1.2.503)

**Implemented enhancements:**

- Allow running multiple, different instances of zmNinja \(desktop\) [\#542](https://github.com/ZoneMinder/zmNinja/issues/542)
- Abstract zmNinja out from ZM specifics [\#318](https://github.com/ZoneMinder/zmNinja/issues/318)

**Fixed bugs:**

- German language - JSON corrupted -affects 1.2.500 [\#545](https://github.com/ZoneMinder/zmNinja/issues/545)

**Closed issues:**

- make it easier to make desktop builds [\#541](https://github.com/ZoneMinder/zmNinja/issues/541)
- Explore upgrading electron wrapper to solve white screen issues [\#539](https://github.com/ZoneMinder/zmNinja/issues/539)
- All monitors view refresh rate 0 or very low on my PC/Windows installation of ZMNinja [\#527](https://github.com/ZoneMinder/zmNinja/issues/527)

**Merged pull requests:**

- kEmailNotConfigured [\#540](https://github.com/ZoneMinder/zmNinja/pull/540) ([maymaymay](https://github.com/maymaymay))
- New string kCycleMontageInterval [\#532](https://github.com/ZoneMinder/zmNinja/pull/532) ([florie1706](https://github.com/florie1706))

## [v1.2.44](https://github.com/ZoneMinder/zmNinja/tree/v1.2.44) (2017-09-25)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.41...v1.2.44)

**Implemented enhancements:**

- Montage Cycle - customize timer [\#530](https://github.com/ZoneMinder/zmNinja/issues/530)
- New language: Hungarian/Magyar [\#529](https://github.com/ZoneMinder/zmNinja/issues/529)

**Fixed bugs:**

- zmNinja incorrectly reports invalid API [\#537](https://github.com/ZoneMinder/zmNinja/issues/537)
- Crosswalk build no longer works on newer android phones [\#536](https://github.com/ZoneMinder/zmNinja/issues/536)
- Fixes for IOS11 and iPhone X [\#534](https://github.com/ZoneMinder/zmNinja/issues/534)
- Many presets in live view results in the screen overflowing [\#517](https://github.com/ZoneMinder/zmNinja/issues/517)

**Closed issues:**

- Mac screen sleep issue [\#538](https://github.com/ZoneMinder/zmNinja/issues/538)
- Update code base to work with new ionic dev env [\#535](https://github.com/ZoneMinder/zmNinja/issues/535)
- zmNinja fails against ZM 1.31.1  [\#533](https://github.com/ZoneMinder/zmNinja/issues/533)
- 1.30.4 API not connecting [\#523](https://github.com/ZoneMinder/zmNinja/issues/523)
- Does 1.3 work with zmninja [\#522](https://github.com/ZoneMinder/zmNinja/issues/522)
- Feature request: possibility to select a run state from zmNinja [\#520](https://github.com/ZoneMinder/zmNinja/issues/520)
- Stability problem on zmNinja on Windows 10 x64 after adding a fourth monitor [\#519](https://github.com/ZoneMinder/zmNinja/issues/519)
- fit/fill screen option issue [\#514](https://github.com/ZoneMinder/zmNinja/issues/514)
- Any chance of A10 Allwinder cpu suport? [\#513](https://github.com/ZoneMinder/zmNinja/issues/513)

**Merged pull requests:**

- Email not configured [\#544](https://github.com/ZoneMinder/zmNinja/pull/544) ([florie1706](https://github.com/florie1706))
-  \#530 - allow you to customize timer for montage cycle [\#531](https://github.com/ZoneMinder/zmNinja/pull/531) ([maymaymay](https://github.com/maymaymay))
- update language spanish language with new keys [\#525](https://github.com/ZoneMinder/zmNinja/pull/525) ([fxrnando](https://github.com/fxrnando))
- Create CODE\_OF\_CONDUCT.md [\#524](https://github.com/ZoneMinder/zmNinja/pull/524) ([ZoneMinder](https://github.com/ZoneMinder))
- Update locale-fr.json [\#518](https://github.com/ZoneMinder/zmNinja/pull/518) ([cryptage21](https://github.com/cryptage21))
- Added new strings according to v1.2.41 [\#512](https://github.com/ZoneMinder/zmNinja/pull/512) ([florie1706](https://github.com/florie1706))

## [v1.2.41](https://github.com/ZoneMinder/zmNinja/tree/v1.2.41) (2017-04-11)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.40...v1.2.41)

**Implemented enhancements:**

- Implement concept of 'default profile' & 'workspace' in Montage [\#509](https://github.com/ZoneMinder/zmNinja/issues/509)
- Support Amcrest PTZ in zmNinja [\#508](https://github.com/ZoneMinder/zmNinja/issues/508)
- Allow for montage scaling at increments of 5% \(currently 10%\) [\#505](https://github.com/ZoneMinder/zmNinja/issues/505)
- In monitor list \(Montage screen\) make the color of disabled monitors more prominent [\#503](https://github.com/ZoneMinder/zmNinja/issues/503)

**Fixed bugs:**

- Montage profile showing new monitors automatically [\#504](https://github.com/ZoneMinder/zmNinja/issues/504)
- Video playback \(h264\) breaks on iOS with a config.xml setting [\#501](https://github.com/ZoneMinder/zmNinja/issues/501)

**Closed issues:**

- Add support for manual disable/enable alarms [\#507](https://github.com/ZoneMinder/zmNinja/issues/507)
- When zoneminder is in contineous record mode zmNinja shows no events [\#502](https://github.com/ZoneMinder/zmNinja/issues/502)
- 2 Monitors - But only only one show up in "Event List" [\#500](https://github.com/ZoneMinder/zmNinja/issues/500)
- Google independent zmNinja via F-Droid  or downloadable packages \(apk\) [\#498](https://github.com/ZoneMinder/zmNinja/issues/498)
- iOS app frozen after being in background [\#482](https://github.com/ZoneMinder/zmNinja/issues/482)

**Merged pull requests:**

- montage profile save - show existing list too [\#511](https://github.com/ZoneMinder/zmNinja/pull/511) ([maymaymay](https://github.com/maymaymay))

## [v1.2.40](https://github.com/ZoneMinder/zmNinja/tree/v1.2.40) (2017-03-19)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v/1.2.40...v1.2.40)

## [v/1.2.40](https://github.com/ZoneMinder/zmNinja/tree/v/1.2.40) (2017-03-19)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.39...v/1.2.40)

**Fixed bugs:**

- Problem with notifications. [\#468](https://github.com/ZoneMinder/zmNinja/issues/468)
- Login denied for user "" when not using ZM authentication [\#459](https://github.com/ZoneMinder/zmNinja/issues/459)

**Closed issues:**

- Timezone incorrect [\#492](https://github.com/ZoneMinder/zmNinja/issues/492)

**Merged pull requests:**

-  \#509 - default profile for all monitors and "workspace" [\#510](https://github.com/ZoneMinder/zmNinja/pull/510) ([maymaymay](https://github.com/maymaymay))
- Update locale-de.json [\#497](https://github.com/ZoneMinder/zmNinja/pull/497) ([florie1706](https://github.com/florie1706))
- Update locale-fr 1.2.39 [\#495](https://github.com/ZoneMinder/zmNinja/pull/495) ([cryptage21](https://github.com/cryptage21))
- Buttons in this view were the wrong way around [\#494](https://github.com/ZoneMinder/zmNinja/pull/494) ([florie1706](https://github.com/florie1706))
- Change languages to their mother tongue [\#493](https://github.com/ZoneMinder/zmNinja/pull/493) ([florie1706](https://github.com/florie1706))

## [v1.2.39](https://github.com/ZoneMinder/zmNinja/tree/v1.2.39) (2017-03-04)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.38...v1.2.39)

**Implemented enhancements:**

- French Translation [\#469](https://github.com/ZoneMinder/zmNinja/issues/469)
- New language: German [\#466](https://github.com/ZoneMinder/zmNinja/issues/466)

**Fixed bugs:**

- \(timeout\) "Zoneminder Authentication Failed" even though Zoneminder's logs says authentication was successful [\#487](https://github.com/ZoneMinder/zmNinja/issues/487)
- Can't get out of fullscreen mode \(confirmed on win64\) [\#473](https://github.com/ZoneMinder/zmNinja/issues/473)

**Closed issues:**

- Update source build to use new versions of Cordova/Ionic [\#491](https://github.com/ZoneMinder/zmNinja/issues/491)
- Launch zmNinja via iOS app URL scheme [\#467](https://github.com/ZoneMinder/zmNinja/issues/467)
- zmNinja complied from sources for Android and push notification [\#464](https://github.com/ZoneMinder/zmNinja/issues/464)
- \[Desktop/Windows\]Window placement and size is not preserved across multiple sessions. [\#462](https://github.com/ZoneMinder/zmNinja/issues/462)
- Cycle Montage [\#460](https://github.com/ZoneMinder/zmNinja/issues/460)
- view streaming video inside ionic with iOS 10.2.1? [\#458](https://github.com/ZoneMinder/zmNinja/issues/458)
- \[Desktop\] Resize cameras in full screen freely? [\#457](https://github.com/ZoneMinder/zmNinja/issues/457)
- missing event only shown with Filters [\#445](https://github.com/ZoneMinder/zmNinja/issues/445)
- FAB action buttons are confusing [\#204](https://github.com/ZoneMinder/zmNinja/issues/204)

**Merged pull requests:**

- \#487 - devoption added to increase HTTP timeouts [\#490](https://github.com/ZoneMinder/zmNinja/pull/490) ([florie1706](https://github.com/florie1706))
- \#487 - devoption added to increase HTTP timeouts [\#489](https://github.com/ZoneMinder/zmNinja/pull/489) ([cryptage21](https://github.com/cryptage21))
-  \#487 - devoption added to increase HTTP timeouts [\#488](https://github.com/ZoneMinder/zmNinja/pull/488) ([maymaymay](https://github.com/maymaymay))
- Fixes for some bad German translations [\#486](https://github.com/ZoneMinder/zmNinja/pull/486) ([florie1706](https://github.com/florie1706))
- zmNinja removed from translation [\#485](https://github.com/ZoneMinder/zmNinja/pull/485) ([florie1706](https://github.com/florie1706))
- clarified menu option [\#481](https://github.com/ZoneMinder/zmNinja/pull/481) ([florie1706](https://github.com/florie1706))
- clarified menu option [\#480](https://github.com/ZoneMinder/zmNinja/pull/480) ([maymaymay](https://github.com/maymaymay))
- French Language - Update 1 [\#479](https://github.com/ZoneMinder/zmNinja/pull/479) ([cryptage21](https://github.com/cryptage21))
- Update locale-de.json [\#478](https://github.com/ZoneMinder/zmNinja/pull/478) ([florie1706](https://github.com/florie1706))
- more fixes [\#474](https://github.com/ZoneMinder/zmNinja/pull/474) ([florie1706](https://github.com/florie1706))
- Fixed some translations for a better understanding [\#472](https://github.com/ZoneMinder/zmNinja/pull/472) ([florie1706](https://github.com/florie1706))
- wrong wording [\#471](https://github.com/ZoneMinder/zmNinja/pull/471) ([florie1706](https://github.com/florie1706))
- fixed some typos [\#470](https://github.com/ZoneMinder/zmNinja/pull/470) ([florie1706](https://github.com/florie1706))
- Create locale-de.json [\#465](https://github.com/ZoneMinder/zmNinja/pull/465) ([florie1706](https://github.com/florie1706))
- spanish update [\#463](https://github.com/ZoneMinder/zmNinja/pull/463) ([fxrnando](https://github.com/fxrnando))
- android and iOS ports now allow for strict SSL checks... [\#461](https://github.com/ZoneMinder/zmNinja/pull/461) ([maymaymay](https://github.com/maymaymay))

## [v1.2.38](https://github.com/ZoneMinder/zmNinja/tree/v1.2.38) (2017-02-17)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.37...v1.2.38)

**Implemented enhancements:**

- SSL - add an option that either requires self signed certs installed on phones or will only work with real certs [\#455](https://github.com/ZoneMinder/zmNinja/issues/455)
- Allow users to hide MP4/GIF buttons [\#454](https://github.com/ZoneMinder/zmNinja/issues/454)
- make MP4 playback speed configurable \(and persistent\) [\#453](https://github.com/ZoneMinder/zmNinja/issues/453)

**Merged pull requests:**

- let's make GIF and MP4 an option in Dev Settings \#454 [\#456](https://github.com/ZoneMinder/zmNinja/pull/456) ([maymaymay](https://github.com/maymaymay))

## [v1.2.37](https://github.com/ZoneMinder/zmNinja/tree/v1.2.37) (2017-02-11)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.36...v1.2.37)

**Implemented enhancements:**

- Add ability to view server logs [\#452](https://github.com/ZoneMinder/zmNinja/issues/452)
- Add ability to reflow montage without resetting size [\#448](https://github.com/ZoneMinder/zmNinja/issues/448)

**Fixed bugs:**

- wizard often does not detect cgi-bin [\#451](https://github.com/ZoneMinder/zmNinja/issues/451)
- fs command line option not working [\#450](https://github.com/ZoneMinder/zmNinja/issues/450)

**Closed issues:**

- Montage Image Scale not Saving on Win x64 [\#447](https://github.com/ZoneMinder/zmNinja/issues/447)
- Side menu scroll feature locks after switching servers OR displaying liveview in landscape [\#337](https://github.com/ZoneMinder/zmNinja/issues/337)

**Merged pull requests:**

- Translations [\#446](https://github.com/ZoneMinder/zmNinja/pull/446) ([maymaymay](https://github.com/maymaymay))

## [v1.2.36](https://github.com/ZoneMinder/zmNinja/tree/v1.2.36) (2017-02-06)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.35...v1.2.36)

**Implemented enhancements:**

- Add ability to hide grey buttons in single monitor view [\#443](https://github.com/ZoneMinder/zmNinja/issues/443)
- Desktop app opening maximized, in full screen montage view [\#436](https://github.com/ZoneMinder/zmNinja/issues/436)
- Adding Dutch Language Files [\#433](https://github.com/ZoneMinder/zmNinja/issues/433)
- Allow for archived events to be displayed or hidden \(based on toggle switch\) [\#432](https://github.com/ZoneMinder/zmNinja/issues/432)
- Enhancement: Add event names to Event list view [\#431](https://github.com/ZoneMinder/zmNinja/issues/431)
- server settings - confirm deletion [\#423](https://github.com/ZoneMinder/zmNinja/issues/423)
- Add ability to view zones as overlays on live monitor feed [\#420](https://github.com/ZoneMinder/zmNinja/issues/420)
- Add ability to cycle between montage profiles [\#419](https://github.com/ZoneMinder/zmNinja/issues/419)
- Adding Dutch language [\#387](https://github.com/ZoneMinder/zmNinja/issues/387)
- Hide credentials of simple auth in display [\#363](https://github.com/ZoneMinder/zmNinja/issues/363)

**Fixed bugs:**

- switching from full screen to regular causes header alignment issues\(iOS only\) [\#429](https://github.com/ZoneMinder/zmNinja/issues/429)
- when bulk frames are present, frame view while viewing footage goes wrong [\#428](https://github.com/ZoneMinder/zmNinja/issues/428)
- display cgi-bin error if a wrong cgi path is set in login even if you don't tap save [\#427](https://github.com/ZoneMinder/zmNinja/issues/427)
- Fallback Server Hangup [\#424](https://github.com/ZoneMinder/zmNinja/issues/424)
- Cannot delete events [\#422](https://github.com/ZoneMinder/zmNinja/issues/422)
- restricted users for event notification not working [\#391](https://github.com/ZoneMinder/zmNinja/issues/391)

**Closed issues:**

- Hard coded text found [\#440](https://github.com/ZoneMinder/zmNinja/issues/440)
- Hard coded text alert found [\#437](https://github.com/ZoneMinder/zmNinja/issues/437)
- invalid api [\#426](https://github.com/ZoneMinder/zmNinja/issues/426)
- Typo in Validating-if-APIs-work-on-ZM page \(events instead of events.json\): [\#421](https://github.com/ZoneMinder/zmNinja/issues/421)
- event server settings - Strange Behaviour [\#414](https://github.com/ZoneMinder/zmNinja/issues/414)

**Merged pull requests:**

- 440 hard coded text found  [\#442](https://github.com/ZoneMinder/zmNinja/pull/442) ([steelyard-nl](https://github.com/steelyard-nl))
- sorted keys \#437 [\#439](https://github.com/ZoneMinder/zmNinja/pull/439) ([maymaymay](https://github.com/maymaymay))
- 437 hard coded text alert found [\#438](https://github.com/ZoneMinder/zmNinja/pull/438) ([steelyard-nl](https://github.com/steelyard-nl))
- 433 adding dutch language files [\#435](https://github.com/ZoneMinder/zmNinja/pull/435) ([steelyard-nl](https://github.com/steelyard-nl))
-  you can now toggle a dev option to hide/unhide archived \(flagged\) ev… [\#434](https://github.com/ZoneMinder/zmNinja/pull/434) ([maymaymay](https://github.com/maymaymay))
- Translation update to \#423 [\#425](https://github.com/ZoneMinder/zmNinja/pull/425) ([maymaymay](https://github.com/maymaymay))

## [v1.2.35](https://github.com/ZoneMinder/zmNinja/tree/v1.2.35) (2016-12-31)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.34...v1.2.35)

**Implemented enhancements:**

- Add ability to show motion outlines in alarm frames \(if enabled in ZM\) [\#417](https://github.com/ZoneMinder/zmNinja/issues/417)
- Archive selected events [\#388](https://github.com/ZoneMinder/zmNinja/issues/388)

**Merged pull requests:**

- Eci peci z tłumaczeniem ;\) Happy New Year!!! [\#418](https://github.com/ZoneMinder/zmNinja/pull/418) ([maymaymay](https://github.com/maymaymay))
- Translation update [\#416](https://github.com/ZoneMinder/zmNinja/pull/416) ([maymaymay](https://github.com/maymaymay))

## [v1.2.34](https://github.com/ZoneMinder/zmNinja/tree/v1.2.34) (2016-12-24)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.33...v1.2.34)

**Implemented enhancements:**

- Add ability to launch app via URL for external integration [\#411](https://github.com/ZoneMinder/zmNinja/issues/411)
- Allow for pinning and hiding monitors during rearranging in montage [\#409](https://github.com/ZoneMinder/zmNinja/issues/409)

**Fixed bugs:**

- First time users - app gets locked if APIs are not configured \[Mostly Android\] [\#415](https://github.com/ZoneMinder/zmNinja/issues/415)

**Closed issues:**

- Missing translations Russian [\#412](https://github.com/ZoneMinder/zmNinja/issues/412)
- Missing translations for popup buttons [\#410](https://github.com/ZoneMinder/zmNinja/issues/410)
- Mobile unable to connect to the event server [\#403](https://github.com/ZoneMinder/zmNinja/issues/403)
- Download events as avi,mov, even mp4 videos [\#334](https://github.com/ZoneMinder/zmNinja/issues/334)

**Merged pull requests:**

- New items [\#413](https://github.com/ZoneMinder/zmNinja/pull/413) ([BoskSpb](https://github.com/BoskSpb))

## [v1.2.33](https://github.com/ZoneMinder/zmNinja/tree/v1.2.33) (2016-12-09)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.32...v1.2.33)

## [v1.2.32](https://github.com/ZoneMinder/zmNinja/tree/v1.2.32) (2016-12-09)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.31...v1.2.32)

**Implemented enhancements:**

- Montage Camera Groups [\#397](https://github.com/ZoneMinder/zmNinja/issues/397)
- Multiple selectable/saveable 'Montage' views within a server profile  [\#390](https://github.com/ZoneMinder/zmNinja/issues/390)

**Fixed bugs:**

- In some cases, events screen shows no events - even though there are events [\#408](https://github.com/ZoneMinder/zmNinja/issues/408)

**Closed issues:**

- Translation issue [\#400](https://github.com/ZoneMinder/zmNinja/issues/400)

**Merged pull requests:**

- translation updates [\#407](https://github.com/ZoneMinder/zmNinja/pull/407) ([maymaymay](https://github.com/maymaymay))
- Updated Portuguese Translation [\#406](https://github.com/ZoneMinder/zmNinja/pull/406) ([ljpinho](https://github.com/ljpinho))
- spanish language update translations and modifying an instruction lin… [\#404](https://github.com/ZoneMinder/zmNinja/pull/404) ([fxrnando](https://github.com/fxrnando))
- Updated 3 missing keys [\#402](https://github.com/ZoneMinder/zmNinja/pull/402) ([maymaymay](https://github.com/maymaymay))
- Translation update [\#399](https://github.com/ZoneMinder/zmNinja/pull/399) ([maymaymay](https://github.com/maymaymay))
- Translation updates [\#396](https://github.com/ZoneMinder/zmNinja/pull/396) ([maymaymay](https://github.com/maymaymay))
-  Translation adjustments. [\#393](https://github.com/ZoneMinder/zmNinja/pull/393) ([maymaymay](https://github.com/maymaymay))
- Translation updates to \#383 [\#392](https://github.com/ZoneMinder/zmNinja/pull/392) ([maymaymay](https://github.com/maymaymay))

## [v1.2.31](https://github.com/ZoneMinder/zmNinja/tree/v1.2.31) (2016-12-02)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.30...v1.2.31)

**Fixed bugs:**

- \[H.264\] Cue position: player reports incorrect length [\#395](https://github.com/ZoneMinder/zmNinja/issues/395)
- hardcoded phrases in code \(not using translation files\) [\#394](https://github.com/ZoneMinder/zmNinja/issues/394)

**Closed issues:**

- rewrite GIFcreation to be able to handle much larger images [\#398](https://github.com/ZoneMinder/zmNinja/issues/398)

## [v1.2.30](https://github.com/ZoneMinder/zmNinja/tree/v1.2.30) (2016-11-26)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.29...v1.2.30)

**Implemented enhancements:**

- Add ability to download mp4 files: if using feature-264 [\#383](https://github.com/ZoneMinder/zmNinja/issues/383)
- \[H264\] Playback speed in event player [\#382](https://github.com/ZoneMinder/zmNinja/issues/382)
- \[h264\] add cue points in video player for alarmed frames [\#381](https://github.com/ZoneMinder/zmNinja/issues/381)
- Add ability to save animated gif version of event \(alarm frames only\) [\#379](https://github.com/ZoneMinder/zmNinja/issues/379)

**Closed issues:**

- \[BUG\] Window title does not change to 'Events' when in events view [\#389](https://github.com/ZoneMinder/zmNinja/issues/389)
- adding spanish language [\#384](https://github.com/ZoneMinder/zmNinja/issues/384)
- Monitor configuration change hangs on FreeBSD-11 [\#373](https://github.com/ZoneMinder/zmNinja/issues/373)

**Merged pull requests:**

- Translation updates. [\#386](https://github.com/ZoneMinder/zmNinja/pull/386) ([maymaymay](https://github.com/maymaymay))
- 384 spanish trans [\#385](https://github.com/ZoneMinder/zmNinja/pull/385) ([fxrnando](https://github.com/fxrnando))
- more minor fixes [\#378](https://github.com/ZoneMinder/zmNinja/pull/378) ([maymaymay](https://github.com/maymaymay))
- minor fixes [\#377](https://github.com/ZoneMinder/zmNinja/pull/377) ([maymaymay](https://github.com/maymaymay))
- minor fixes [\#376](https://github.com/ZoneMinder/zmNinja/pull/376) ([maymaymay](https://github.com/maymaymay))

## [v1.2.29](https://github.com/ZoneMinder/zmNinja/tree/v1.2.29) (2016-11-16)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.28...v1.2.29)

**Implemented enhancements:**

- New language: Polish \(credit @maymaymay\) [\#372](https://github.com/ZoneMinder/zmNinja/issues/372)
- \[NFR\] Add button 'Now' to timeline screen [\#371](https://github.com/ZoneMinder/zmNinja/issues/371)
- Add Russian language \(credit @BoskSpb\) [\#366](https://github.com/ZoneMinder/zmNinja/issues/366)
- \[H264\] Time overlay during playback [\#362](https://github.com/ZoneMinder/zmNinja/issues/362)
- Option to fit to screen on H264 event playback [\#358](https://github.com/ZoneMinder/zmNinja/issues/358)

**Fixed bugs:**

- On certain samsung phones, autocorrect makes it hard to enter text in input configuration [\#367](https://github.com/ZoneMinder/zmNinja/issues/367)
- When navigating events using prev/next or gapless, it shows all events including ones with 0 alarms [\#113](https://github.com/ZoneMinder/zmNinja/issues/113)

**Closed issues:**

- Timeline dynamic updates issue [\#369](https://github.com/ZoneMinder/zmNinja/issues/369)

**Merged pull requests:**

- Polish language name modyfication [\#375](https://github.com/ZoneMinder/zmNinja/pull/375) ([maymaymay](https://github.com/maymaymay))
- added the enhancement label [\#374](https://github.com/ZoneMinder/zmNinja/pull/374) ([maymaymay](https://github.com/maymaymay))
- Create help-pl.html [\#370](https://github.com/ZoneMinder/zmNinja/pull/370) ([maymaymay](https://github.com/maymaymay))
- Create locale-pl.json [\#368](https://github.com/ZoneMinder/zmNinja/pull/368) ([maymaymay](https://github.com/maymaymay))
- Adding Russian language in App [\#365](https://github.com/ZoneMinder/zmNinja/pull/365) ([BoskSpb](https://github.com/BoskSpb))

## [v1.2.28](https://github.com/ZoneMinder/zmNinja/tree/v1.2.28) (2016-11-08)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v/1.2.28...v1.2.28)

## [v/1.2.28](https://github.com/ZoneMinder/zmNinja/tree/v/1.2.28) (2016-11-08)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.26...v/1.2.28)

**Implemented enhancements:**

- \[DESKTOP\] \(H264\) Automatic playback? [\#359](https://github.com/ZoneMinder/zmNinja/issues/359)
- Remember last state of application \(desktops\) [\#357](https://github.com/ZoneMinder/zmNinja/issues/357)
- Allow option for timeline view to get dynamically updated as new events occur [\#356](https://github.com/ZoneMinder/zmNinja/issues/356)
- Differentiate between server timezone and local timezone  \(needs ZM API Update \#1655\) [\#353](https://github.com/ZoneMinder/zmNinja/issues/353)

**Fixed bugs:**

- Cancel timeline custom range settings leads to indefinitely 'working on graph data'  [\#360](https://github.com/ZoneMinder/zmNinja/issues/360)
- alarm frame navigation while watching event footage shows incorrect frames [\#354](https://github.com/ZoneMinder/zmNinja/issues/354)
- iOS Websockets stopped working with latest updates [\#352](https://github.com/ZoneMinder/zmNinja/issues/352)
- Android \< 5.0 has SSL cert issues [\#351](https://github.com/ZoneMinder/zmNinja/issues/351)
- Try and solve the montage overlapping when the image doesn't fully load [\#350](https://github.com/ZoneMinder/zmNinja/issues/350)

**Closed issues:**

- view=view\_video mode is not working \(requires ZM patch\) [\#364](https://github.com/ZoneMinder/zmNinja/issues/364)
- Can't load as a web page on Android since d76cf1c commit [\#355](https://github.com/ZoneMinder/zmNinja/issues/355)

## [v1.2.26](https://github.com/ZoneMinder/zmNinja/tree/v1.2.26) (2016-10-13)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.24...v1.2.26)

**Implemented enhancements:**

- simplify event montage UX [\#348](https://github.com/ZoneMinder/zmNinja/issues/348)
- Show actual \(server\) time in visible in full screen \(desktop\) [\#346](https://github.com/ZoneMinder/zmNinja/issues/346)
- Implement "shrinking headers" as you scroll to get more real estate [\#342](https://github.com/ZoneMinder/zmNinja/issues/342)
- Add Montage Awesomeness to Event Montage [\#201](https://github.com/ZoneMinder/zmNinja/issues/201)

**Fixed bugs:**

- Make events list work with system font size [\#339](https://github.com/ZoneMinder/zmNinja/issues/339)
- IOS 10 - crash on image save to photo albums [\#338](https://github.com/ZoneMinder/zmNinja/issues/338)

**Closed issues:**

- Video broken when viewed through non-standard port [\#345](https://github.com/ZoneMinder/zmNinja/issues/345)
- Montage Not working [\#343](https://github.com/ZoneMinder/zmNinja/issues/343)
- Show an error message if event server connection fail [\#341](https://github.com/ZoneMinder/zmNinja/issues/341)
- Android - show notifications in system tray [\#279](https://github.com/ZoneMinder/zmNinja/issues/279)
- adding download button for video events [\#235](https://github.com/ZoneMinder/zmNinja/issues/235)

## [v1.2.24](https://github.com/ZoneMinder/zmNinja/tree/v1.2.24) (2016-09-24)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.19...v1.2.24)

**Implemented enhancements:**

- Arabic language implementation \(credit @aljabr\) [\#336](https://github.com/ZoneMinder/zmNinja/issues/336)
- enable low bandwidth mode for zmN [\#321](https://github.com/ZoneMinder/zmNinja/issues/321)

**Fixed bugs:**

- Yellow Event Summary Window \(Ionic pullup footer\) displays no data when dragged up. [\#333](https://github.com/ZoneMinder/zmNinja/issues/333)
- No live view \(via monitor, not montage\) after switching between servers. [\#329](https://github.com/ZoneMinder/zmNinja/issues/329)
- languages with non-english numbers break events/timeline feeds [\#325](https://github.com/ZoneMinder/zmNinja/issues/325)
- "Error - unable to save snapshot" on Android V6 [\#322](https://github.com/ZoneMinder/zmNinja/issues/322)

**Closed issues:**

- Syntax error: newline unexpected [\#335](https://github.com/ZoneMinder/zmNinja/issues/335)
- v [\#332](https://github.com/ZoneMinder/zmNinja/issues/332)
- Validate From/To date in Event Filter [\#330](https://github.com/ZoneMinder/zmNinja/issues/330)
- IOS status bar [\#324](https://github.com/ZoneMinder/zmNinja/issues/324)
- ZMNinja for Kodi [\#311](https://github.com/ZoneMinder/zmNinja/issues/311)
- zmNinja for Windows Mobile [\#299](https://github.com/ZoneMinder/zmNinja/issues/299)

## [v1.2.19](https://github.com/ZoneMinder/zmNinja/tree/v1.2.19) (2016-09-04)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.18...v1.2.19)

**Implemented enhancements:**

- Cycle monitors [\#319](https://github.com/ZoneMinder/zmNinja/issues/319)

**Fixed bugs:**

- Switching servers without saving first causes the app to freeze \(android/ios\) [\#320](https://github.com/ZoneMinder/zmNinja/issues/320)

## [v1.2.18](https://github.com/ZoneMinder/zmNinja/tree/v1.2.18) (2016-09-02)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.17...v1.2.18)

**Implemented enhancements:**

- for all event related views \(event list, footage, analyze\) show "relative time from now" like "1 day ago" or "2 hours ago" [\#317](https://github.com/ZoneMinder/zmNinja/issues/317)

## [v1.2.17](https://github.com/ZoneMinder/zmNinja/tree/v1.2.17) (2016-09-01)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.13...v1.2.17)

**Implemented enhancements:**

- Add ability to perform monitor config changes for all monitors \(credit @sctt\) [\#316](https://github.com/ZoneMinder/zmNinja/issues/316)
- enable/disable sound and vibration push notifications [\#314](https://github.com/ZoneMinder/zmNinja/issues/314)
- Add Wake/Sleep/Reset  to PTZ functions \(credit: @sctt\) [\#306](https://github.com/ZoneMinder/zmNinja/issues/306)

**Fixed bugs:**

- clean up event server flow - its been a bloody mess for a while [\#312](https://github.com/ZoneMinder/zmNinja/issues/312)
- Add option to disable nativeTransitions [\#310](https://github.com/ZoneMinder/zmNinja/issues/310)
- app freezes when adding more than 2 profiles  [\#304](https://github.com/ZoneMinder/zmNinja/issues/304)
- saving a server profile removes the "Add" button while in the same view [\#303](https://github.com/ZoneMinder/zmNinja/issues/303)
- 1.2.0 seems to have routing issues and xwalk issues [\#302](https://github.com/ZoneMinder/zmNinja/issues/302)
- zmNinja fails to log in over open internet on first invocation [\#126](https://github.com/ZoneMinder/zmNinja/issues/126)
- it seems in some cases monitor intervals don't get transmitted to zmeventserver [\#112](https://github.com/ZoneMinder/zmNinja/issues/112)

**Closed issues:**

- ZMninja API issue with zoneminder 1.30 [\#300](https://github.com/ZoneMinder/zmNinja/issues/300)

## [v1.2.13](https://github.com/ZoneMinder/zmNinja/tree/v1.2.13) (2016-08-18)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.2.0...v1.2.13)

**Closed issues:**

- modal close via back action on Android - make  sure all timers re-start/resources released [\#305](https://github.com/ZoneMinder/zmNinja/issues/305)

## [v1.2.0](https://github.com/ZoneMinder/zmNinja/tree/v1.2.0) (2016-08-10)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/vv1.2.0...v1.2.0)

## [vv1.2.0](https://github.com/ZoneMinder/zmNinja/tree/vv1.2.0) (2016-08-10)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.1.96...vv1.2.0)

**Implemented enhancements:**

- Allow frame navigation when you tap on alarms  view within the modal  [\#301](https://github.com/ZoneMinder/zmNinja/issues/301)
- When viewing alarmed frames in events view, allow option to only show frames that differ in time [\#296](https://github.com/ZoneMinder/zmNinja/issues/296)
- Encrypt user profile for more security [\#294](https://github.com/ZoneMinder/zmNinja/issues/294)
- Portuguese language support  [\#290](https://github.com/ZoneMinder/zmNinja/issues/290)
- Allow frame navigation when you tap on a thumbnail image  [\#288](https://github.com/ZoneMinder/zmNinja/issues/288)
- tapping on graphs should show a nice event list - current doesn't do anything useful [\#18](https://github.com/ZoneMinder/zmNinja/issues/18)

**Fixed bugs:**

- Password appears in log as plain text [\#293](https://github.com/ZoneMinder/zmNinja/issues/293)
- server settings get deleted, especially on iOS [\#292](https://github.com/ZoneMinder/zmNinja/issues/292)
- Tweak montage layout to avoid overlaps and gaps  [\#286](https://github.com/ZoneMinder/zmNinja/issues/286)
- Focus! Solve that damn "go to login screen" issue that some users are facing [\#193](https://github.com/ZoneMinder/zmNinja/issues/193)

**Closed issues:**

- license doc typos [\#297](https://github.com/ZoneMinder/zmNinja/issues/297)
- Having issues setting up Real Time Notifications with ZM ninja and ZM server [\#295](https://github.com/ZoneMinder/zmNinja/issues/295)
- zmNinja via VPN on iOS [\#265](https://github.com/ZoneMinder/zmNinja/issues/265)
- rework event graphs in event page, make event navigation easier [\#233](https://github.com/ZoneMinder/zmNinja/issues/233)
- PTZ support could be improved [\#207](https://github.com/ZoneMinder/zmNinja/issues/207)

## [v1.1.96](https://github.com/ZoneMinder/zmNinja/tree/v1.1.96) (2016-07-13)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.1.94...v1.1.96)

**Implemented enhancements:**

- Make sure zmNinja plays ball with new user roles in APIs [\#93](https://github.com/ZoneMinder/zmNinja/issues/93)

**Fixed bugs:**

- Slash screen PIN entry text error on zmN 1.1.94b [\#284](https://github.com/ZoneMinder/zmNinja/issues/284)
- build for android broke - uglify is messing up release builds [\#282](https://github.com/ZoneMinder/zmNinja/issues/282)
- ZMNinja back button issue [\#281](https://github.com/ZoneMinder/zmNinja/issues/281)
- Modify montage filtering to make sure maxLimit does not include disabled monitors [\#277](https://github.com/ZoneMinder/zmNinja/issues/277)
- Some Android phones seem to have SSL issues with self-signed certs [\#273](https://github.com/ZoneMinder/zmNinja/issues/273)

**Closed issues:**

- Multi-server not video from cameras [\#283](https://github.com/ZoneMinder/zmNinja/issues/283)

## [v1.1.94](https://github.com/ZoneMinder/zmNinja/tree/v1.1.94) (2016-07-09)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.1.93...v1.1.94)

**Implemented enhancements:**

- Allow to  navigate to live stream on notification tap [\#278](https://github.com/ZoneMinder/zmNinja/issues/278)
- Allow upto 10 monitors to be arranged per row  in montage [\#276](https://github.com/ZoneMinder/zmNinja/issues/276)

**Fixed bugs:**

- Playback of events fails using view=video mode [\#275](https://github.com/ZoneMinder/zmNinja/issues/275)
- zmNinja does not launch on iOS 10 [\#271](https://github.com/ZoneMinder/zmNinja/issues/271)

**Closed issues:**

- zmNinja-I can only see one camera in the app in montage view, but I can see my 2 cameras in browser [\#280](https://github.com/ZoneMinder/zmNinja/issues/280)
- Swipe to next event for the same monitor id not working [\#274](https://github.com/ZoneMinder/zmNinja/issues/274)

## [v1.1.93](https://github.com/ZoneMinder/zmNinja/tree/v1.1.93) (2016-06-16)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.1.92...v1.1.93)

**Implemented enhancements:**

- Implement language translations [\#261](https://github.com/ZoneMinder/zmNinja/issues/261)
- Italian Language [\#260](https://github.com/ZoneMinder/zmNinja/issues/260)
- Improve desktop mouse-wheel scrolling in the event view [\#258](https://github.com/ZoneMinder/zmNinja/issues/258)

**Fixed bugs:**

- Allow special characters in password to work in wizard  [\#264](https://github.com/ZoneMinder/zmNinja/issues/264)
- if you open a footage modal and exit before 5 seconds, the app keeps checking for event status  [\#257](https://github.com/ZoneMinder/zmNinja/issues/257)
- Montage and Live View no longer working [\#256](https://github.com/ZoneMinder/zmNinja/issues/256)
- 1.1.9 for Android broke pinch and zoom [\#255](https://github.com/ZoneMinder/zmNinja/issues/255)

**Closed issues:**

- Fix android permissions [\#268](https://github.com/ZoneMinder/zmNinja/issues/268)
- Validate language coverage [\#267](https://github.com/ZoneMinder/zmNinja/issues/267)
- Update project to work with ionic@2 tools [\#259](https://github.com/ZoneMinder/zmNinja/issues/259)
- switch to non parsed zms for montage - see if it helps packery [\#254](https://github.com/ZoneMinder/zmNinja/issues/254)

## [v1.1.92](https://github.com/ZoneMinder/zmNinja/tree/v1.1.92) (2016-05-21)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.1.9...v1.1.92)

## [v1.1.9](https://github.com/ZoneMinder/zmNinja/tree/v1.1.9) (2016-05-20)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.1.7...v1.1.9)

**Implemented enhancements:**

- Add ability to jump to specific timeframe during event playback [\#252](https://github.com/ZoneMinder/zmNinja/issues/252)
- Allow users to specify a minimum alarm frame count for the events page [\#250](https://github.com/ZoneMinder/zmNinja/issues/250)
- Implement new color scheme  [\#249](https://github.com/ZoneMinder/zmNinja/issues/249)
- Show recording state in monitors \(alert/alarm/recording/idle\) [\#248](https://github.com/ZoneMinder/zmNinja/issues/248)
- add ability to force trigger alarms \(needs API upgrade\) [\#245](https://github.com/ZoneMinder/zmNinja/issues/245)
- support multi-server feeds and the new server API [\#241](https://github.com/ZoneMinder/zmNinja/issues/241)
- Write a configuration wizard [\#234](https://github.com/ZoneMinder/zmNinja/issues/234)

**Fixed bugs:**

- Fix keyboard jump on certain fields/iOS [\#251](https://github.com/ZoneMinder/zmNinja/issues/251)
- clean up buttons so they don't overlap in many views [\#246](https://github.com/ZoneMinder/zmNinja/issues/246)
- Switching between profiles fails to discover monitors [\#244](https://github.com/ZoneMinder/zmNinja/issues/244)
- Event Graphs issue [\#239](https://github.com/ZoneMinder/zmNinja/issues/239)
- Event server customization [\#238](https://github.com/ZoneMinder/zmNinja/issues/238)
- Push notification issue [\#237](https://github.com/ZoneMinder/zmNinja/issues/237)
- Fix the monitor orientation code for rotated cameras [\#232](https://github.com/ZoneMinder/zmNinja/issues/232)
- protocol bug - cgi-bin discover [\#231](https://github.com/ZoneMinder/zmNinja/issues/231)

**Closed issues:**

- . [\#253](https://github.com/ZoneMinder/zmNinja/issues/253)
- clean up monitorCtrl - remove Event crap - we now have different controllers [\#247](https://github.com/ZoneMinder/zmNinja/issues/247)
- switching between fid mode playback \(api 1.30+\) and path mode causes issues if I don't restart app [\#243](https://github.com/ZoneMinder/zmNinja/issues/243)
- video .mp4 event issue [\#242](https://github.com/ZoneMinder/zmNinja/issues/242)
- check if android is exiting on background [\#240](https://github.com/ZoneMinder/zmNinja/issues/240)
- Enhancement: zmNinja as surveillance solution [\#236](https://github.com/ZoneMinder/zmNinja/issues/236)
- Application not recorvering from connection errors [\#199](https://github.com/ZoneMinder/zmNinja/issues/199)
- Event Montage unstable [\#183](https://github.com/ZoneMinder/zmNinja/issues/183)
- \[DESKTOP\] Playback control bar lost some features in 1.0.9 [\#176](https://github.com/ZoneMinder/zmNinja/issues/176)

## [v1.1.7](https://github.com/ZoneMinder/zmNinja/tree/v1.1.7) (2016-04-23)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.1.4...v1.1.7)

**Implemented enhancements:**

- Add option to tap on alarm events in events view to see a larger version [\#229](https://github.com/ZoneMinder/zmNinja/issues/229)
- Add a helper function to automatically detect cgi-bin [\#228](https://github.com/ZoneMinder/zmNinja/issues/228)
- PTZ zoom support [\#224](https://github.com/ZoneMinder/zmNinja/issues/224)

**Fixed bugs:**

- Not possible to control PTZ after swipe from non-PTZ camera [\#223](https://github.com/ZoneMinder/zmNinja/issues/223)
- PTZ with moveRel \(Axis PTZ as an example\) does not work when navigated from Montage view [\#222](https://github.com/ZoneMinder/zmNinja/issues/222)
- montage natural scrolling does not work  [\#218](https://github.com/ZoneMinder/zmNinja/issues/218)
- when dragging around in analyze graph, don't scroll the screen [\#217](https://github.com/ZoneMinder/zmNinja/issues/217)
- full screen in montage does not work [\#216](https://github.com/ZoneMinder/zmNinja/issues/216)

**Closed issues:**

- improve timeline taps - make a closest guess  [\#230](https://github.com/ZoneMinder/zmNinja/issues/230)
- iOS and Android: introduce native transitions and scrolling \[performance\] [\#226](https://github.com/ZoneMinder/zmNinja/issues/226)
- Email notifications with animated GIF attachements [\#225](https://github.com/ZoneMinder/zmNinja/issues/225)
- Add version number to help page [\#220](https://github.com/ZoneMinder/zmNinja/issues/220)
- Upgrade code-base to new plugins, ionic 1.2.4, etc. [\#219](https://github.com/ZoneMinder/zmNinja/issues/219)
- Error: Hook failed with error code ENOENT: [\#210](https://github.com/ZoneMinder/zmNinja/issues/210)

## [v1.1.4](https://github.com/ZoneMinder/zmNinja/tree/v1.1.4) (2016-04-05)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.1.3...v1.1.4)

## [v1.1.3](https://github.com/ZoneMinder/zmNinja/tree/v1.1.3) (2016-04-02)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.1.2...v1.1.3)

**Implemented enhancements:**

- new feature to analyze frames quickly from event list  [\#215](https://github.com/ZoneMinder/zmNinja/issues/215)
- re-introduce ability to hide monitors with new drag/drop montage [\#213](https://github.com/ZoneMinder/zmNinja/issues/213)
- Enhance timeline graph to allow for event frame scrubbing [\#209](https://github.com/ZoneMinder/zmNinja/issues/209)
- Allow ability to only browse alarm frames while in full screen footage view [\#206](https://github.com/ZoneMinder/zmNinja/issues/206)

**Fixed bugs:**

- zmNinja build from source does not load on iOS 9.x - hangs on splashscreen [\#212](https://github.com/ZoneMinder/zmNinja/issues/212)
- Some SSL users are facing issues with reachability returning no servers reachable [\#208](https://github.com/ZoneMinder/zmNinja/issues/208)

**Closed issues:**

- zmNinja 1.1.3 build from source - Push registration failed  [\#214](https://github.com/ZoneMinder/zmNinja/issues/214)
- No live view video playback, cgi path is set. [\#211](https://github.com/ZoneMinder/zmNinja/issues/211)
- Fix layout for first run when no layout config exists - check demo acct [\#205](https://github.com/ZoneMinder/zmNinja/issues/205)

## [v1.1.2](https://github.com/ZoneMinder/zmNinja/tree/v1.1.2) (2016-03-19)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.1.1...v1.1.2)

**Implemented enhancements:**

- Left drawer should open with swipe gesture in any view not just fullscreen [\#202](https://github.com/ZoneMinder/zmNinja/issues/202)
- Local and External Server configuration \[$5\] [\#133](https://github.com/ZoneMinder/zmNinja/issues/133)

**Fixed bugs:**

- quick scrub drag slider stopped working  [\#196](https://github.com/ZoneMinder/zmNinja/issues/196)

**Closed issues:**

- Add gesture to exit any fullscreen [\#203](https://github.com/ZoneMinder/zmNinja/issues/203)
- Demo Account Autocreating itself [\#200](https://github.com/ZoneMinder/zmNinja/issues/200)
- ionic state restore not creating platforms/android directory [\#198](https://github.com/ZoneMinder/zmNinja/issues/198)
- Compile for Windows 10 mobile [\#197](https://github.com/ZoneMinder/zmNinja/issues/197)
- Authentication Failed [\#195](https://github.com/ZoneMinder/zmNinja/issues/195)

## [v1.1.1](https://github.com/ZoneMinder/zmNinja/tree/v1.1.1) (2016-03-14)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.1.0...v1.1.1)

**Fixed bugs:**

- The new montage function resets montage layout if there are hidden or disabled monitors [\#194](https://github.com/ZoneMinder/zmNinja/issues/194)

**Closed issues:**

- Testing issue template \(dummy issue\) [\#192](https://github.com/ZoneMinder/zmNinja/issues/192)
- testing issue template [\#191](https://github.com/ZoneMinder/zmNinja/issues/191)
- decrease splash screen delay \(reduce startup delay\) [\#190](https://github.com/ZoneMinder/zmNinja/issues/190)
- Android build fails ref \#180 [\#184](https://github.com/ZoneMinder/zmNinja/issues/184)

## [v1.1.0](https://github.com/ZoneMinder/zmNinja/tree/v1.1.0) (2016-03-12)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.0.9...v1.1.0)

**Implemented enhancements:**

- Add a pre-configured demo account for people to test around with [\#187](https://github.com/ZoneMinder/zmNinja/issues/187)
- Add gesture to open left menu while in full screen live view [\#185](https://github.com/ZoneMinder/zmNinja/issues/185)
- Add touch gesture to exit live view [\#182](https://github.com/ZoneMinder/zmNinja/issues/182)
- add dynamic drag and drop and multiple size options to montage - make it awesome and more consistent [\#179](https://github.com/ZoneMinder/zmNinja/issues/179)
- Prev day/next day for timeline [\#177](https://github.com/ZoneMinder/zmNinja/issues/177)
- 12/24 hours scheme settings  [\#175](https://github.com/ZoneMinder/zmNinja/issues/175)

**Fixed bugs:**

- switching server profiles causes inconsistency if you go to developer options [\#189](https://github.com/ZoneMinder/zmNinja/issues/189)
- changing timeline limit does not go into effect until app restart [\#188](https://github.com/ZoneMinder/zmNinja/issues/188)
- Desktop \(possibly others\): Inescapable UI pattern [\#174](https://github.com/ZoneMinder/zmNinja/issues/174)

**Closed issues:**

- No image for monitors nor events [\#181](https://github.com/ZoneMinder/zmNinja/issues/181)
- Android build fails [\#180](https://github.com/ZoneMinder/zmNinja/issues/180)
- iPhone stopped working [\#178](https://github.com/ZoneMinder/zmNinja/issues/178)
- non-free license [\#173](https://github.com/ZoneMinder/zmNinja/issues/173)
- iOS: Montage View arrange views \(third icon from top-right\) does not function [\#172](https://github.com/ZoneMinder/zmNinja/issues/172)

## [v1.0.9](https://github.com/ZoneMinder/zmNinja/tree/v1.0.9) (2016-02-25)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.0.7...v1.0.9)

**Implemented enhancements:**

- Route event playback via ZMS [\#164](https://github.com/ZoneMinder/zmNinja/issues/164)
- Montage view zoom slider, ergonomy [\#163](https://github.com/ZoneMinder/zmNinja/issues/163)
- \[DESKTOP\] Zooming for non touch screen displays. [\#162](https://github.com/ZoneMinder/zmNinja/issues/162)
- Fix playback speed for long events [\#161](https://github.com/ZoneMinder/zmNinja/issues/161)

**Fixed bugs:**

- Desktop: Monitors Freeze when Exiting Full Screen [\#169](https://github.com/ZoneMinder/zmNinja/issues/169)
- changing to invalid credentials after valid credentials continues to work [\#167](https://github.com/ZoneMinder/zmNinja/issues/167)

**Closed issues:**

- iOS: Events--\>Filter by Date/Time does not work [\#171](https://github.com/ZoneMinder/zmNinja/issues/171)
- Desktop: Event Footage extremely low resolution [\#168](https://github.com/ZoneMinder/zmNinja/issues/168)
- ionic state restore failed [\#166](https://github.com/ZoneMinder/zmNinja/issues/166)
- Desktop: Montage places last image below rather than alongside previous [\#165](https://github.com/ZoneMinder/zmNinja/issues/165)
- \[DESKTOP\] Playback issue on windows platform [\#151](https://github.com/ZoneMinder/zmNinja/issues/151)

## [v1.0.7](https://github.com/ZoneMinder/zmNinja/tree/v1.0.7) (2016-02-09)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.0.6...v1.0.7)

**Implemented enhancements:**

- Refine montage history to accept from/to dates [\#160](https://github.com/ZoneMinder/zmNinja/issues/160)

**Closed issues:**

- Build is failing [\#156](https://github.com/ZoneMinder/zmNinja/issues/156)

## [v1.0.6](https://github.com/ZoneMinder/zmNinja/tree/v1.0.6) (2016-02-05)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.0.5...v1.0.6)

**Implemented enhancements:**

- Allow event server to work without SSL - requires zmeventserver upgrade  [\#159](https://github.com/ZoneMinder/zmNinja/issues/159)
- Introduce a montage timeline function  [\#154](https://github.com/ZoneMinder/zmNinja/issues/154)
- Addition Next frame/prev frame buttons when viewing event - for fine grained snapshot control. [\#150](https://github.com/ZoneMinder/zmNinja/issues/150)
- Notification icon and sound - add ability to play default sounds [\#135](https://github.com/ZoneMinder/zmNinja/issues/135)

**Closed issues:**

- Make exit buttons of live view and events view consistent [\#158](https://github.com/ZoneMinder/zmNinja/issues/158)
- Remove SSL cert requirement [\#157](https://github.com/ZoneMinder/zmNinja/issues/157)
- Closing data leaks - trying to bottle up areas which may result in chrome keeping TCP connections open in background [\#155](https://github.com/ZoneMinder/zmNinja/issues/155)
- xcode fails on linking [\#153](https://github.com/ZoneMinder/zmNinja/issues/153)
- installing ios-deploy ends with an error [\#152](https://github.com/ZoneMinder/zmNinja/issues/152)
- Progress bar is ignored in Event View when playback is paused. [\#149](https://github.com/ZoneMinder/zmNinja/issues/149)

## [v1.0.5](https://github.com/ZoneMinder/zmNinja/tree/v1.0.5) (2016-01-23)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.0.3...v1.0.5)

**Implemented enhancements:**

- Add ability to save a snapshot of an event playback to disk [\#148](https://github.com/ZoneMinder/zmNinja/issues/148)

**Fixed bugs:**

- 1.0.4 Broke basic auth  [\#147](https://github.com/ZoneMinder/zmNinja/issues/147)
- Basic auth only - no zm auth - app goes to login on restart and says auth fails - app works [\#140](https://github.com/ZoneMinder/zmNinja/issues/140)

**Closed issues:**

- montage display wrap got messed up in newer versions of Chrome [\#146](https://github.com/ZoneMinder/zmNinja/issues/146)
- Viewing events on slow connection basically doesn't work [\#145](https://github.com/ZoneMinder/zmNinja/issues/145)

## [v1.0.3](https://github.com/ZoneMinder/zmNinja/tree/v1.0.3) (2016-01-19)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.0.2...v1.0.3)

**Implemented enhancements:**

- Allow montage to flow as columns \(packed\) or rows \(not packed\)  [\#144](https://github.com/ZoneMinder/zmNinja/issues/144)
- Reduce android apk size  [\#142](https://github.com/ZoneMinder/zmNinja/issues/142)
- Improve timeline performance [\#129](https://github.com/ZoneMinder/zmNinja/issues/129)
- For Android only: Allow an exit option in menu [\#128](https://github.com/ZoneMinder/zmNinja/issues/128)
- Implement a mechanism to detect when network is on/off [\#127](https://github.com/ZoneMinder/zmNinja/issues/127)
- Add support for Pan/Tilt/Zoom Presets [\#116](https://github.com/ZoneMinder/zmNinja/issues/116)

**Fixed bugs:**

- Monitor order is different one can observe in ZM montage [\#143](https://github.com/ZoneMinder/zmNinja/issues/143)
- You can swipe to dead monitor [\#138](https://github.com/ZoneMinder/zmNinja/issues/138)
- switching networks should trigger authentication [\#134](https://github.com/ZoneMinder/zmNinja/issues/134)
- Excessive background data usage [\#131](https://github.com/ZoneMinder/zmNinja/issues/131)

**Closed issues:**

- \[Log in Failed\] Checking if reCaptcha is enabled in zm.. [\#141](https://github.com/ZoneMinder/zmNinja/issues/141)
- Swiping with ZMS is slower than swiping without zms [\#139](https://github.com/ZoneMinder/zmNinja/issues/139)
- Exit button on Android build  [\#137](https://github.com/ZoneMinder/zmNinja/issues/137)
- zmninja cannot talk to zmeventserver [\#136](https://github.com/ZoneMinder/zmNinja/issues/136)
- HTTP basic auth credentials not stored [\#132](https://github.com/ZoneMinder/zmNinja/issues/132)
- Android build fails [\#130](https://github.com/ZoneMinder/zmNinja/issues/130)
- \[DESKTOP\]\[QUESTION\] gconf [\#125](https://github.com/ZoneMinder/zmNinja/issues/125)
- CSS montage - implement a better reflow algorithm [\#124](https://github.com/ZoneMinder/zmNinja/issues/124)
- Auto upload successful build to testfairy [\#75](https://github.com/ZoneMinder/zmNinja/issues/75)
- Integrate with Travis [\#72](https://github.com/ZoneMinder/zmNinja/issues/72)
- When moving montage monitors around, remember to move the size  [\#16](https://github.com/ZoneMinder/zmNinja/issues/16)

## [v1.0.2](https://github.com/ZoneMinder/zmNinja/tree/v1.0.2) (2015-12-28)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v1.0.1...v1.0.2)

**Implemented enhancements:**

- Implement a way to only play alarmed frames [\#118](https://github.com/ZoneMinder/zmNinja/issues/118)

## [v1.0.1](https://github.com/ZoneMinder/zmNinja/tree/v1.0.1) (2015-12-27)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v0.87.3...v1.0.1)

**Implemented enhancements:**

- Add an option to play at real FPS in single monitor view [\#123](https://github.com/ZoneMinder/zmNinja/issues/123)
- Offer a server selection menu on app launch [\#122](https://github.com/ZoneMinder/zmNinja/issues/122)
- Add a stop button to PTZ [\#121](https://github.com/ZoneMinder/zmNinja/issues/121)
- Pack in the montage view better [\#119](https://github.com/ZoneMinder/zmNinja/issues/119)
- Truncate monitor name in montage if size of image is less [\#117](https://github.com/ZoneMinder/zmNinja/issues/117)

**Fixed bugs:**

- Developer setting for Frame Update allows decimals  [\#114](https://github.com/ZoneMinder/zmNinja/issues/114)

**Closed issues:**

- HTTP Basic authentication [\#120](https://github.com/ZoneMinder/zmNinja/issues/120)
- Cannot get video [\#115](https://github.com/ZoneMinder/zmNinja/issues/115)

## [v0.87.3](https://github.com/ZoneMinder/zmNinja/tree/v0.87.3) (2015-12-15)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v0.87...v0.87.3)

**Implemented enhancements:**

- Add ability to detect cgi-bin configuration issues \(experimental\) [\#110](https://github.com/ZoneMinder/zmNinja/issues/110)
- Allow 'show all/show alarmed' events to persist and show menu option in both Events and Timeline Views [\#108](https://github.com/ZoneMinder/zmNinja/issues/108)
- Make timeline items configurable instead of forcing 200 [\#104](https://github.com/ZoneMinder/zmNinja/issues/104)

**Fixed bugs:**

- popover "..." menu in event and timeline does not show in certain scenarios - so no menu [\#109](https://github.com/ZoneMinder/zmNinja/issues/109)
- Disabling event server does not disable push notifications via APNS/GCM [\#107](https://github.com/ZoneMinder/zmNinja/issues/107)
- Quick scrub on devices \(atleast iOS\) does not stop if you tap [\#106](https://github.com/ZoneMinder/zmNinja/issues/106)
- Bulk frames are causing problems with the scrub bar positioning of alarmed frames [\#102](https://github.com/ZoneMinder/zmNinja/issues/102)
- Gapless playback showing events from non-persisted monitors [\#86](https://github.com/ZoneMinder/zmNinja/issues/86)

**Closed issues:**

- Timeline on v0.87.2 shows only motion events [\#105](https://github.com/ZoneMinder/zmNinja/issues/105)

## [v0.87](https://github.com/ZoneMinder/zmNinja/tree/v0.87) (2015-11-20)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v0.87.2...v0.87)

## [v0.87.2](https://github.com/ZoneMinder/zmNinja/tree/v0.87.2) (2015-11-20)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v0.87.1...v0.87.2)

**Fixed bugs:**

- Tap to load events on push notification is broken [\#103](https://github.com/ZoneMinder/zmNinja/issues/103)
- Monitors in zmNinja should respect sequence of monitors in Zoneminder [\#100](https://github.com/ZoneMinder/zmNinja/issues/100)
- SavetoPhone not working [\#99](https://github.com/ZoneMinder/zmNinja/issues/99)
- 0.87.1 broke quick scrub thumbnail [\#98](https://github.com/ZoneMinder/zmNinja/issues/98)
- \[DESKTOP\] Image scaling issues [\#90](https://github.com/ZoneMinder/zmNinja/issues/90)

**Closed issues:**

- \[DESKTOP\] Timeline is UTC [\#101](https://github.com/ZoneMinder/zmNinja/issues/101)
- \[DESKTOP\] Lift 200 last entries limit for timeline [\#88](https://github.com/ZoneMinder/zmNinja/issues/88)

## [v0.87.1](https://github.com/ZoneMinder/zmNinja/tree/v0.87.1) (2015-11-18)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v0.86...v0.87.1)

**Breaking changes:**

- Breaking changes for this release: [\#97](https://github.com/ZoneMinder/zmNinja/issues/97)

**Implemented enhancements:**

- Event page is overcrowded for mocord users - add option to show only alarmed frames [\#89](https://github.com/ZoneMinder/zmNinja/issues/89)
- Ability to specify multiple ZM servers and switch between them [\#83](https://github.com/ZoneMinder/zmNinja/issues/83)
- add per monitor 'alarmed' status indicator to montage view [\#82](https://github.com/ZoneMinder/zmNinja/issues/82)

**Fixed bugs:**

- zmNinja adds cgi-bin on its own to cgi path. This is a problem for Centos  [\#92](https://github.com/ZoneMinder/zmNinja/issues/92)
- Can't toggle gapless playback when viewing timeline events  [\#85](https://github.com/ZoneMinder/zmNinja/issues/85)
- desktop app no video from timeline [\#70](https://github.com/ZoneMinder/zmNinja/issues/70)

**Closed issues:**

- Zoneminder specific notes for this release  [\#96](https://github.com/ZoneMinder/zmNinja/issues/96)
- Increase desktop limit of timeline to 2000 events instead of 200 [\#95](https://github.com/ZoneMinder/zmNinja/issues/95)
- Implement daily version check for Desktop versions [\#94](https://github.com/ZoneMinder/zmNinja/issues/94)
- eliminate duplicate code between timeline and event control for footage mode [\#87](https://github.com/ZoneMinder/zmNinja/issues/87)
- Non-persisted monitors showing in timeline, events views [\#84](https://github.com/ZoneMinder/zmNinja/issues/84)
- Clean up persistent data storage mechanism [\#81](https://github.com/ZoneMinder/zmNinja/issues/81)
- Remove external deps from codebase [\#80](https://github.com/ZoneMinder/zmNinja/issues/80)
- Update .gitignore to support osx [\#78](https://github.com/ZoneMinder/zmNinja/issues/78)
- Welcome message on first start [\#76](https://github.com/ZoneMinder/zmNinja/issues/76)
- add contributing guidelines [\#74](https://github.com/ZoneMinder/zmNinja/issues/74)
- Add License [\#73](https://github.com/ZoneMinder/zmNinja/issues/73)
- desktop app, can't export logs [\#71](https://github.com/ZoneMinder/zmNinja/issues/71)
- make email logs work in desktop mode by opening default client [\#69](https://github.com/ZoneMinder/zmNinja/issues/69)
- in quick scrub/footage mode - start playing without waiting for a tap [\#68](https://github.com/ZoneMinder/zmNinja/issues/68)
- make mouse wheel work in desktop mode [\#67](https://github.com/ZoneMinder/zmNinja/issues/67)

## [v0.86](https://github.com/ZoneMinder/zmNinja/tree/v0.86) (2015-11-06)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v0.85...v0.86)

**Implemented enhancements:**

- Make Back button to exit from live view [\#61](https://github.com/ZoneMinder/zmNinja/issues/61)
- ability to run all screens of zmNinja on a desktop without console errors [\#59](https://github.com/ZoneMinder/zmNinja/issues/59)
- In playback mode, add the ability to swipe to the next event of whichever monitor has the next event and/or initiate gapless playback of same. [\#49](https://github.com/ZoneMinder/zmNinja/issues/49)
- In playback mode, add the ability to swipe to the next event of the same monitor and/or initiate gapless playback. [\#48](https://github.com/ZoneMinder/zmNinja/issues/48)

**Fixed bugs:**

- tapping on events before they complete causes issues [\#44](https://github.com/ZoneMinder/zmNinja/issues/44)

**Closed issues:**

- If swiping is enabled, don't swipe if image is zoomed in -- causes pan/zoom conflicts [\#66](https://github.com/ZoneMinder/zmNinja/issues/66)
- getDiskStatus seems to be a performance bottleneck - disable for now in System State screen [\#65](https://github.com/ZoneMinder/zmNinja/issues/65)
- clean up non-reachable code during portal check [\#64](https://github.com/ZoneMinder/zmNinja/issues/64)
- Allow saving event videos to device. [\#63](https://github.com/ZoneMinder/zmNinja/issues/63)

## [v0.85](https://github.com/ZoneMinder/zmNinja/tree/v0.85) (2015-11-01)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v0.84...v0.85)

**Implemented enhancements:**

- video branch support for zmNinja  [\#60](https://github.com/ZoneMinder/zmNinja/issues/60)
- changing servers requires reload of monitors - should be automatically done [\#58](https://github.com/ZoneMinder/zmNinja/issues/58)

**Fixed bugs:**

- fix version check - in one part of the code, I'm not doing a \>= check resulting in new ZM versions failing [\#57](https://github.com/ZoneMinder/zmNinja/issues/57)
- notifications delivered while the app is running should also produce the same sound [\#55](https://github.com/ZoneMinder/zmNinja/issues/55)
- iOS notifications are not showing style and sound options [\#54](https://github.com/ZoneMinder/zmNinja/issues/54)

**Closed issues:**

- permissions on Android [\#56](https://github.com/ZoneMinder/zmNinja/issues/56)

## [v0.84](https://github.com/ZoneMinder/zmNinja/tree/v0.84) (2015-10-28)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/v0.83...v0.84)

**Implemented enhancements:**

- offer an option to force web sockets even if push is supported [\#53](https://github.com/ZoneMinder/zmNinja/issues/53)
- customize screen to load on push notification tap [\#47](https://github.com/ZoneMinder/zmNinja/issues/47)

**Fixed bugs:**

- Ssl toggle and https in login [\#52](https://github.com/ZoneMinder/zmNinja/issues/52)
- Swiping to the left should reveal next monitor, not prev monitor \(seen on iOS 9\) [\#51](https://github.com/ZoneMinder/zmNinja/issues/51)
- rev 0.83, event icon is a solid block [\#50](https://github.com/ZoneMinder/zmNinja/issues/50)
- Monitor view: events not showing for deselected monitors \(and should since the goal in monitor view is to see all monitors which would include their events\). 	 	 [\#46](https://github.com/ZoneMinder/zmNinja/issues/46)
- Montage view: swipe shows deselected monitors \(and should not\). [\#45](https://github.com/ZoneMinder/zmNinja/issues/45)
- Timeline more menu bonked again [\#43](https://github.com/ZoneMinder/zmNinja/issues/43)

**Closed issues:**

- custom range dates shown even if pullup overwrites them [\#37](https://github.com/ZoneMinder/zmNinja/issues/37)
- Latest Events panel doesn't initialize correctly on first use. [\#36](https://github.com/ZoneMinder/zmNinja/issues/36)
- Android client: System Status view returns HTTP error [\#32](https://github.com/ZoneMinder/zmNinja/issues/32)
- app causes ZM crash/bad behavior after it's been asleep for a while [\#30](https://github.com/ZoneMinder/zmNinja/issues/30)

## [v0.83](https://github.com/ZoneMinder/zmNinja/tree/v0.83) (2015-10-24)

[Full Changelog](https://github.com/ZoneMinder/zmNinja/compare/86e4e291bfda3365c0bb82bacb2b9990a86ce759...v0.83)

**Implemented enhancements:**

- ability to restrict monitors in all views - depending on some global selection [\#42](https://github.com/ZoneMinder/zmNinja/issues/42)
- make it optional to swipe between live view of monitors [\#41](https://github.com/ZoneMinder/zmNinja/issues/41)
- review security approach - switch to auth token instead of passing u+p in url [\#2](https://github.com/ZoneMinder/zmNinja/issues/2)

**Fixed bugs:**

- if apis can't be reached the app assumes version is 0.0.0 and moves app to low version screen [\#40](https://github.com/ZoneMinder/zmNinja/issues/40)
- Check multiple web sockets created in android -- seems old web sockets don't get deleted [\#39](https://github.com/ZoneMinder/zmNinja/issues/39)
- Background mode: Popover menus stick around [\#33](https://github.com/ZoneMinder/zmNinja/issues/33)

**Closed issues:**

- Monitor change makes enabled 0 [\#38](https://github.com/ZoneMinder/zmNinja/issues/38)
- Restarting ZM in state control results in client freezing [\#35](https://github.com/ZoneMinder/zmNinja/issues/35)
- radial menu is broken [\#34](https://github.com/ZoneMinder/zmNinja/issues/34)
- monitor buttons to navigate can overlap exit,zoom,refresh buttons [\#31](https://github.com/ZoneMinder/zmNinja/issues/31)
- pinch zoom on monitor too sensitive, detects false swipes [\#29](https://github.com/ZoneMinder/zmNinja/issues/29)
- Montage re-order does not work with large list of monitors [\#28](https://github.com/ZoneMinder/zmNinja/issues/28)
- investigate when timeline barfs with a "no parent" error [\#27](https://github.com/ZoneMinder/zmNinja/issues/27)
- app gets into weird state that prevents timeline from populating and syslog goes nuts from montage [\#26](https://github.com/ZoneMinder/zmNinja/issues/26)
- zmNinja should give a useful warning when the API is non-functional [\#25](https://github.com/ZoneMinder/zmNinja/issues/25)
- apk Download of zmNinja [\#22](https://github.com/ZoneMinder/zmNinja/issues/22)
- Add destroy to each view and cancel all view timers again there just to make sure [\#21](https://github.com/ZoneMinder/zmNinja/issues/21)
- Add random string recalc every 1 sec to monitor view [\#20](https://github.com/ZoneMinder/zmNinja/issues/20)
- Long press on android to increase individual montage size does not work [\#19](https://github.com/ZoneMinder/zmNinja/issues/19)
- white screen on idle during playback [\#17](https://github.com/ZoneMinder/zmNinja/issues/17)
- make sure image works if an autologin happens in the background [\#15](https://github.com/ZoneMinder/zmNinja/issues/15)
- settings UI - keep hints always on top [\#14](https://github.com/ZoneMinder/zmNinja/issues/14)
- skip disabled monitors in montage view [\#13](https://github.com/ZoneMinder/zmNinja/issues/13)
- how to install your application? [\#12](https://github.com/ZoneMinder/zmNinja/issues/12)
- Implement a way to do a sanity check on the input and inform the user if the paths are wrong [\#11](https://github.com/ZoneMinder/zmNinja/issues/11)
- come up with a clean input box to make sure I account for various API/base path install combos [\#10](https://github.com/ZoneMinder/zmNinja/issues/10)
- Implement event filtering for graph generation - last hr/week/month [\#9](https://github.com/ZoneMinder/zmNinja/issues/9)
- Android: Montage screen - scaling is not correct [\#8](https://github.com/ZoneMinder/zmNinja/issues/8)
- Android: Http problem [\#7](https://github.com/ZoneMinder/zmNinja/issues/7)
- When images are loaded over a slow connection, there is a white screen till it loads [\#6](https://github.com/ZoneMinder/zmNinja/issues/6)
- handle situations when zms does not respond to your commands for a while [\#5](https://github.com/ZoneMinder/zmNinja/issues/5)
- test product on Android - make sure all plugins work etc. [\#4](https://github.com/ZoneMinder/zmNinja/issues/4)
- we are only retrieving the first page of events - need to fix it to get all  [\#1](https://github.com/ZoneMinder/zmNinja/issues/1)



\* *This Changelog was automatically generated by [github_changelog_generator](https://github.com/github-changelog-generator/github-changelog-generator)*
