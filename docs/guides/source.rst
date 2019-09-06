Building from Source
`````````````````````

**NOTE** If you want to run it on your desktop, you can directly
download desktop binaries
`here <https://github.com/pliablepixels/releases>`__
and if you want it for Android/iOS you can get from the play/appstore.
This is only for those who *want* to run from source.

    Note: If you are building from source, you are mostly on your own. I
    have very limited time to debug environment differences/package
    differences between what I have and what you may have. I'm not a
    nodejs/grunt etc expert and stuff seems to change all the time.

Version note: The code is compiled using the following versions of
tools. **If you are using newer versions of ionic the code may not
compile - I don't have the time to upgrade yet. Finally, if you choose
to go the source route, I expect you to spend a lot of time yourself
debugging first before you create an issue. Even if you do create an
issue, I have very limited bandwidth to debug source compilation issues
for you.** Thanks.

Output of ``ionic info``

::

    Ionic:

       ionic (Ionic CLI) : 4.5.0 (/usr/local/lib/node_modules/ionic)
       Ionic Framework   : ionic1 1.3.5
       @ionic/v1-toolkit : 1.0.19

    Cordova:

       cordova (Cordova CLI) : 8.1.2 (cordova-lib@8.1.1)
       Cordova Platforms     : android 7.1.4, ios 5.0.0
       Cordova Plugins       : cordova-plugin-ionic-keyboard 2.1.3, cordova-plugin-ionic-webview 2.2.0,
    (and 30 other plugins)

    System:

       Android SDK Tools : 26.1.1 (/Users/pp/Library/Android/sdk/)
       ios-deploy        : 2.0.0
       ios-sim           : 7.0.0
       NodeJS            : v8.11.2 (/usr/local/bin/node)
       npm               : 5.6.0
       OS                : macOS Mojave
       Xcode             : Xcode 10.1 Build version 10B61

Install Dependencies - needed for all platforms
-----------------------------------------------

Install NodeJS
~~~~~~~~~~~~~~

Install NodeJS from `here <https://nodejs.org/en/download/>`__. As of
Dec 2018, I'm using Node ``v8.11.2``. I use
`n <https://github.com/tj/n>`__ to manage node versions and switch
between them.

Install cordova and ionic
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code:: bash

    npm install -g cordova ionic 
    npm install @ionic/v1-toolkit --save-dev

And some more:

.. code:: bash

    npm install -g gulp
    npm install node-sass
    npm install async
    npm install jshint

(Note you may need to do ``sudo`` depending on how your system is set
up. It's `better you
don't <https://johnpapa.net/how-to-use-npm-global-without-sudo-on-osx/>`__,
but if you must, well, you must)

If you get a newer version, you should adjust your cordova version to
the mentioned version above in order to be able to successfully compile
zmNinja. To change the version you can follow these instructions:
`change cordova
version <https://iphonedevlog.wordpress.com/2014/06/25/updating-and-reverting-to-different-cordova-phonegap-versions>`__

Download zmNinja
----------------

.. code:: bash

    git clone --depth 1 https://github.com/pliablepixels/zmNinja.git

Configure build configure zmNinja and get all required plugins
--------------------------------------------------------------

.. code:: bash


    cd zmNinja
    npm install
    ionic cordova platform add android (or ios)
    cordova prepare

Making an iOS build
-------------------

Note: You need to be doing this on a mac, with Xcode and the SDK
installed. You also need to have your developer certificates/etc. (I am
not going to detail this out - there are many internet resources on
this)

(Harder) If you need picture notification support in push
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
As of Mar 2019, cordova-ios does not support multiple targets, nor does 
it support automatic building of notification extensions. So there is manual work to be done:

- Open up ``platforms/ios/zmNinja.xcworkspace`` in XCode
- Go to ``File->Workspace Settings`` and select ``Legacy Build System``
- Go to ``Target->zmNinja->Build Settings`` and set "Swift Language Version" to ``Swift 4``
- Go to ``File->New->Target->Notification Service Extension``, select Objective C 
- In the "Product Name" put in ``zmNinjaNotification`` (your BundleID should now read  ``com.pliablepixels.zmninja-pro.zmNinjaNotification``)
- Say "Yes" to "Activate zmNinjaNotification scheme?" popup
- Now go to zmNinjaNotification target and make version and  build same as zmNinja
- Now in XCode Targets, select ``zmNinjaNotification``, and make sure you select a Team and make sure Deployment Target is 11 or above
- Change Deployment target to 11 or above (same as zmNinja target)
- ``cp etc/NotificationService.m platforms/ios/zmNinjaNotification/``
- ``cd platforms/ios/``
- ``pod install``

You can now do `build_ios.sh`. However, after you build, you will have to go back to XCode
after the build to make the following changes:

1. Sync notification version with app version
2. Change notification bundle ID back to com.pliablepixels.zmninja-pro.zmNinjaNotification (cordova removes the last word)


(Easier) If you don't need picture notification support in push
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

There are a few steps you need to take to get the iOS build working for
the first time. If you don't do this, you may get a compilation error
that says ``ld: library not found for -lGoogleToolboxForMac``

::

    cd platforms/ios
    pod install

This does not produce an iOS ready ipa. What you need to do then is to
open ``platforms/ios/zmNinja.xcworkspace`` in Xcode, and run.

To compile a debug build for iOS from command line, from zmNinja project
root: First edit ``./build-auto.json`` and change the
``developmentTeam`` id to yours. Then:

.. code:: bash

     ./build_ios.sh

To compile using XCode, open ``platforms/ios/zmNinja.xcworkspace`` - You
need to use "Legacy Build" system if you are on XCode 10+. You can
change this in XCode ``File->Workspace Settings`` and then build usual.
Also switch to the Capabilities tab and make sure "Remote Notifications"
is on in Background Modes and in iCloud section, Key-Value storage is
enabled. If you see a "Fix issue" there, clicking on that button
resolves everything.

Making an Android build
-----------------------

Note that you need the `Android
SDK <http://developer.android.com/sdk/index.html>`__ installed and
configured properly for this to work.

From the zmNinja project root:

.. code:: bash

     ./build_android.sh --debug (or --release)

If this complains of missing SDKs, you need to install the SDK version
it requests This should produce an APK file. To install it on your phone
over adb, you'd do something like

.. code:: bash

    adb install -r debug_files/android-debug.apk #if you did --debug
    or,
    adb install -r release_files/zmNinja.apk #if you did --release 

Making a desktop build
----------------------

I use `electron <https://electron.atom.io>`__ to build the desktop app.

For versions 1.3.018 and beyond
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

I've migrated to using
`electron-builder <https://github.com/electron-userland/electron-builder>`__
to automate the build process better.

Make sure you have all the dependencies
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Typically, just running

::

    npm install

Should have installed everything. Validate by checking you have
``electron`` installed by invoking it on the command line

You now have the following options:

::

    npm run dist-all # builds linux, mac and windows packages
    npm run dist-mac # only builds mac packages
    npm run dist-lin # only builds linux packages (32bit, 64bit, arm)
    npm run dist-win # only builds win packages (32bit, 64bit)

Your packages will be created in the ``dist`` folder


Troubleshooting
---------------

Lots of things can go wrong. 

* Please make sure you don't post issues about why your own build is not working - please figure it out
* Look carefully at error messages
