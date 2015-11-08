![](http://www.pbase.com/arjunrc/image/160855207.jpg "icon") 

zmNinja is a multi platform (iOS, Android, Windows Desktop, Mac Desktop, Linux Desktop) client for ZoneMinder users.
ZoneMinder is an incredible open source camera monitoring system and is used
by many for home and commercial security monitoring. http://www.zoneminder.com

Video Demo
-------------
Check out a video demo of zmNinja here: https://youtu.be/prtA_mv68Ok

Mobile Platforms
---------------------------
zmNinja is  stable as of today and runs on a variety of Android and iOS platforms.
It also runs on the desktop (see below)

I have active testers today for both Android and iOS. If you want to test, please follow the instructions
[here](https://forums.zoneminder.com/viewtopic.php?f=33&t=23073) and send me an [email](mailto:pliablepixels@gmail.com) with your details.
You'll have zmNinja running right in your phone without compiling anything.

I can release it to App/Play Store but I'd rather wait for ZM 1.29 to be released so people don't make
my life miserable about missing APIs etc.


Desktop Platforms
-----------------
Treat this as Alpha. I'm using the awesome [Electron] packager (http://electron.atom.io) to auto-package my ionic apps to executables.

It may contain bugs. 

These files are hosted on Google Drive - when you click on them, look for the "download" button at the top so you download the ZIP

Windows: [Download] (https://drive.google.com/file/d/0B3iQz0D8vxltWDllSEdTUl9sNFk/view?usp=sharing)

Linux: [Download] (https://drive.google.com/open?id=0B3iQz0D8vxlteEg1M2VvelcyRWM)

Mac: [Download] (https://drive.google.com/file/d/0B3iQz0D8vxltQkRvbmp6ZlVfZUU/view?usp=sharing)


Key Features (just watch the video already)
--------------------------------------------
* H264 video branch support - if you are using the zoneminder video branch and have recorded videos they will automatically be used (you can disable it in developer settings). If an event has a recorded video, you will see a small video icon at the top of that event entry in events view

* Receive real time push notifications for alarms as they happen. You need to install my [Event Server](https://github.com/pliablepixels/zmeventserver) for this. You can even control monitors you want to be notified of and reporting intervals (if you defined your zones loosely you don't want pings every second, do you?)

* Runs on Android/iOS and now desktops too - in a browser 


* View live monitors and events 

* High speed event scrubbing and control

* Pullup handy views of activities based on time 

* Incredible zoom/pan timeline of alarms

* Control Zoneminder - restart, change states

* Swipe/pan between monitors


Thanks
------
To the zonemider community in general, and the awesome Stack Overflow community.
But specifically, [Andrew Bauer](https://github.com/knnniggett) (knnniggett) - he is a ZoneMinder maintainer and
helped me significantly in getting into ZoneMinder and also continues to help
me with my client goals. 

Important Notes
---------------
* zmNinja needs APIs enabled in ZoneMinder. See https://github.com/pliablepixels/zmNinja/wiki/Configuring-ZoneMinder-with-API

Objective
----------
I wanted to learn how to create a full fledged cross platform app for a long time.
I used this as an excuse to learn Angular JS, phoneGap and ionic and see if one could
use these modern tools to build high performance phonegap apps. I was very pleasantly
surprised -- for a large part, most people who complain about performance  probably
haven't spent time researching how to optimize. 

I'll keep refining it over time as I learn more of AngularJS and stuff.

Running from source
----------------------

Please follow [these](https://github.com/pliablepixels/zmNinja/wiki/Running-zmNinja-from-Source) instructions.

If you want to run zmNinja in an emulator, you will need to install the appropriate emulator tools.

* For iOS, you will need the latest version of XCode (available in the App Store) as well as the npm package `ios-sim`: `npm install -g ios-sim`
* For Android, you will need the latest [Android Studio](https://developer.android.com/sdk/index.html)

Now, you can launch the emulator:

```bash
$ ionic emulate ios
# - OR -
$ ionic emulate android
```


Screenshots:
------------

Menu:

![](http://www.pbase.com/arjunrc/image/160697727/medium.jpg "Menu")

Events List:

![](http://www.pbase.com/arjunrc/image/160697725/medium.jpg "Events List")

Event Quick Scrub:

![]
(http://www.pbase.com/arjunrc/image/160851403/medium.jpg "Events Scrub")

Timeline View:

![]
(http://www.pbase.com/arjunrc/image/160940106/medium.jpg "Timeline zoomout")

![]
(http://www.pbase.com/arjunrc/image/160940104/medium.jpg "Timeline zoomin")


Full Screen Events Footage View (with floating buttons)
![](http://www.pbase.com/arjunrc/image/160697734/medium.jpg "Events View")

Sliding Montage View 1:

![](http://www.pbase.com/arjunrc/image/160697821/medium.jpg "Sliding Montage View")

Sliding Montage View 2 (Different sizes):

![] (http://www.pbase.com/arjunrc/image/160697822/medium.jpg "Sliding Montage View again")


Montage Re-order and show/hide:

![] (http://www.pbase.com/arjunrc/image/160697740/medium.jpg "Montage re-order and hide")


Monitor View:

![](http://www.pbase.com/arjunrc/image/160697737/medium.jpg "Monitor View")

Graphs:

![] (http://www.pbase.com/arjunrc/image/160697738/medium.jpg "Graphs")

Control ZM custom states/start/stop/restart:

![] (http://www.pbase.com/arjunrc/image/160697735/medium.jpg "Control ZM")


Change Monitor Modes:

![] (http://www.pbase.com/arjunrc/image/160697731/medium.jpg "Monitor Modes")


Pan/Tilt/Zoom Mode:

![] (http://www.pbase.com/arjunrc/image/160171688/medium.jpg "PTZ")
