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
I used this as an excuse to learn Angular JS, phoneGap and ionic and see if one could
use these modern tools to build high performance phonegap apps. I was very pleasantly
surprised -- for a large part, most people who complain about performance  probably
haven't spent time researching how to optimize. Not that phonegap apps will always compare
or beat native performance for all apps, but web views have come a long way and while
coding this app, I realized if you use the right utilities and approaches, you get 
comparable performance to native code -- it obviously depends on what you are building.

I'll keep refining it over time as I learn more of AngularJS and stuff.


Important Notes
---------------
* You need to have the latest ZM APIs installed. These apis are in the angular-ui branch of ZM.
* If you don't know what that means, then you will have to wait till ZM folks integrate their APIs
into the main stream (proposed to be part of ZM 1.29)


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


