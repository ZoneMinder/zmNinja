# Change Log

## [v0.87.2](https://github.com/pliablepixels/zmNinja/tree/v0.87.2) (2015-11-20)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v0.87.1...v0.87.2)

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
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v0.87...v0.87.1)

**Implemented enhancements:**

- Event page is overcrowded for mocord users - add option to show only alarmed frames [\#89](https://github.com/pliablepixels/zmNinja/issues/89)

**Fixed bugs:**

- zmNinja adds cgi-bin on its own to cgi path. This is a problem for Centos  [\#92](https://github.com/pliablepixels/zmNinja/issues/92)
- Can't toggle gapless playback when viewing timeline events  [\#85](https://github.com/pliablepixels/zmNinja/issues/85)

**Closed issues:**

- Breaking changes for this release: [\#97](https://github.com/pliablepixels/zmNinja/issues/97)
- Zoneminder specific notes for this release  [\#96](https://github.com/pliablepixels/zmNinja/issues/96)
- Increase desktop limit of timeline to 2000 events instead of 200 [\#95](https://github.com/pliablepixels/zmNinja/issues/95)
- Implement daily version check for Desktop versions [\#94](https://github.com/pliablepixels/zmNinja/issues/94)
- eliminate duplicate code between timeline and event control for footage mode [\#87](https://github.com/pliablepixels/zmNinja/issues/87)
- Non-persisted monitors showing in timeline, events views [\#84](https://github.com/pliablepixels/zmNinja/issues/84)

## [v0.87](https://github.com/pliablepixels/zmNinja/tree/v0.87) (2015-11-15)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v0.86...v0.87)

**Implemented enhancements:**

- Ability to specify multiple ZM servers and switch between them [\#83](https://github.com/pliablepixels/zmNinja/issues/83)
- add per monitor 'alarmed' status indicator to montage view [\#82](https://github.com/pliablepixels/zmNinja/issues/82)

**Fixed bugs:**

- desktop app no video from timeline [\#70](https://github.com/pliablepixels/zmNinja/issues/70)

**Closed issues:**

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