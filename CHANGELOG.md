# Change Log

## [Unreleased](https://github.com/pliablepixels/zmNinja/tree/HEAD)

[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v0.85...HEAD)

**Implemented enhancements:**

- video branch support for zmNinja  [\#60](https://github.com/pliablepixels/zmNinja/issues/60)
- ability to run all screens of zmNinja on a desktop without console errors [\#59](https://github.com/pliablepixels/zmNinja/issues/59)

## [v0.85](https://github.com/pliablepixels/zmNinja/tree/v0.85) (2015-11-01)
[Full Changelog](https://github.com/pliablepixels/zmNinja/compare/v0.84...v0.85)

**Implemented enhancements:**

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