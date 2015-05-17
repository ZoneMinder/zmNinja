![](http://www.pbase.com/arjunrc/image/159870143/original.jpg "icon") zmNinja is a multi platform client for ZoneMinder users.
ZoneMinder is an incredible open source camera monitoring system and is used
by many for home and commercial security monitoring. http://www.zoneminder.com

The ZoneMinder folks are implementing a new API based system and I decided to contribute
by developing a client that uses the new APIs. The APIs are evolving along with this client
so you can expect this to be in alpha/beta stage till the fine folks at ZM release a new
version with the APIs fully integrated. To that extent, some of the features of the app
won't work till Kyle Johnson @ ZM finishes his API work. If you are interested, you can track
https://github.com/ZoneMinder/ZoneMinder/issues/799 to keep a tab of the API status of ZM

Features
--------
Please see the [Wiki](https://github.com/arjunroychowdhury/zmNinja/wiki)

Thanks
------
To the zonemider community in general, and the awesome Stack Overflow community.
But specifically, [Andrew Bauer](https://github.com/knnniggett) (knnniggett) - he is a ZoneMinder maintainer and
helped me significantly in getting into ZoneMinder and also continues to help
me with my client goals. 


Objective
----------
Frankly, I wanted to learn how to create a full fledged cross platform app for a long time.
While I am aware of all these technologies theoretically (my day job needs me to be), there
is a big difference in understanding concepts at a high level vs. being able to create useful stuff.

I used this as an excuse to learn Angular JS, phoneGap and ionic and see if one could
use these modern tools to build high performance phonegap apps. I was very pleasantly
surprised -- for a large part, most people who complain about performance  probably
haven't spent time researching how to optimize. Not that phonegap apps will compare
or beat native performance for all apps, but that's not to say they can't compare. 

I'll keep refining it over time as I learn more of AngularJS and stuff.

Note that I am only currently testing on iOS as a platform for now
My plan is to make the iOS version work and then move to other platforms (Android).
Updated: Works great on Android too - integrated the ultra-fast crosswalk project

as I mentioned, expect to see many many changes over the next few weeks/months

Bugs/Issues
------------
* There are several right now, but the app works quite well. Like I said, I'll be working over the next few weeks to clean it up
* A lot of functionality is still missing - keep a tab
*  The ZM APIs are not fully functional. I unfortunately need to reply on ZM devs to fix them and that will depend on how soon they can address it. You can track ZM API issues here https://github.com/ZoneMinder/ZoneMinder/issues/799


Important Notes
---------------
* You need to have the latest ZM APIs installed. These apis are in the angular-ui branch of ZM.
* If you don't know what that means, then you will have to wait till ZM folks integrate their APIs
into the main stream (the current APIs in 1.28 are limited - and will not be sufficient for the client)
* Alternatively, just download the app and enable simulation mode


Screenshots:
------------

Menu:

![](http://www.pbase.com/arjunrc/image/159760951/medium.jpg "Menu")

Events List:

![](http://www.pbase.com/arjunrc/image/159760954/medium.jpg "Events List")

Full Screen Events Footage View (with floating buttons)
![](http://www.pbase.com/arjunrc/image/159892344/medium.jpg "Events View")

Sliding Montage View 1:

![](http://www.pbase.com/arjunrc/image/159760952/medium.jpg "Sliding Montage View")

Sliding Montage View 2:

![] (http://www.pbase.com/arjunrc/image/159760953/medium.jpg "Sliding Montage View again")

Monitor View:

![](http://www.pbase.com/arjunrc/image/159760955/medium.jpg "Monitor View")

Graphs:

![] (http://www.pbase.com/arjunrc/image/159760956/medium.jpg "Graphs")

Control ZM start/stop/restart:

![] (http://www.pbase.com/arjunrc/image/160096322/medium.jpg "Graphs")


Change Monitor Modes:

![] (http://www.pbase.com/arjunrc/image/160096314/medium.jpg "Graphs")


