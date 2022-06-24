zmNinja, Privacy and Your Data
==============================
￼
This policy will evolve based on feedback. Starting v1.3.008 of zmNinja, this policy will also be linked to via the app from the Main Menu/Help screen

￼
What is zmNinja?
----------------

zmNinja is an open source client app for the popular and open source ZoneMinder home security server. If you use ZoneMinder, zmNinja offers a convenient mobile first front end that allows you to view your security cameras via ZoneMinder, which is much more convenient that trying to open the ZoneMinder web portal on a device.
￼
Contact
-------

Feel free to contact the developers for any data/privacy related questions
zmNinja has an active github repo. I encourage you to post general issues to [github](https://github.com/ZoneMinder/zmNinja)
￼
Data collection, reporting & purpose
------------------------------------

Due to the way zmNinja needs to interact with ZoneMinder, it necessarily needs to store data about the following items of your ZoneMinder configuration: Portal URL, API URL, Cgi-bin URL, username, password (if you are using passwords) . Besides these parameters, other app related settings are also stored

zmNinja stores this user configuration in a sqlite database in iOS and an indexDB database in Android devices (I don’t use sqlite in Android due to this issue). Certain android devices don’t seem to work with indexDB due to which a fallback is to write to a localStorage DB. This database is encrypted, but please see Design Considerations note later

In addition to this data, zmNinja also stores the following cookies: ZMSESSID — used to indentify a session with ZoneMinder — this is created by ZoneMinder. zmCSS and zmSkin — the ZoneMinder style & skin that is used. zmNinja doesn’t use this, but ZoneMinder automatically sets this as zmNinja uses the web portal to login (there is no login API defined today in ZoneMinder)

User data storage (Mobile app) — Removing the app from the device automatically removes the data if you have disabled cloud sync. Starting version 1.3.021 of zmNinja you now have an option to sync your profile data with your Android or iOS personal cloud (GDrive or iCloud respectively). This option is enabled by default and can be turned off in Menu->Settings. While it is enabled, your login data will be synced with your personal cloud account using the platform backup service. This data is not accessible to me — it is your personal space that Android and iOS offers to their users. I’d recommend you leave this on because if the app gets deleted, you can recover the data from your cloud. It also has the benefit of retrieving the data when you install the app on another device using the same cloud login.

User data storage (Desktop app) — As far as the desktop version is concerned, the data is stored in a different location based on your OS, and you can manually remove it. The paths, typically, are: %APPDATA%/zmNinjaDesktop for Windows, $XDG_CONFIG_HOME/zmNinjaDesktop or ~/.config/zmNinjaDesktop for Linux and ~/Library/Application Support/zmNinjaDesktop for OSX

The push-plugin library that zmNinja uses for push notifications in turn uses the Firebase library that seems to collect advertising IDs, for the Android platform. zmNinja itself doesn’t use it for any purpose. Staring release 1.3.027 and beyond this will be disabled. Updated: Starting 1.6 of zmNinja, I now use an alternate plugin (firebasex) and zmNinja configures it with the following flags disabled:

"FIREBASE_ANALYTICS_COLLECTION_ENABLED": "false",
"FIREBASE_PERFORMANCE_COLLECTION_ENABLED": "false",
"FIREBASE_CRASHLYTICS_COLLECTION_ENABLED": "false",

zmNinja, by itself, DOES NOT collect any other analytics/telemetry information, trend information or usage information for its own purpose.
None of your ZM user profile information is transmitted to any 3rd party server — any and all user profile data lies strictly inside the app database and is only transmitted to the ZoneMinder server of your choice. That being said, if you are using zmNinja on mobile devices, any information collected by Google and Apple may be sent to their respective servers. Please see privacy policies of Google and Android below. Note however, if you are using my open source Event Server for push notification, some elements of information are sent out to an intermediary server which is necessary to make push work. Please read section on Push Notifications below. You will also see zmNinja connect to github.com on start. It retrieves the latest zmNinja version released on github to display in the menu.
Privacy Policies of Google and Apple: If you are not building zmNinja from source, and purchase the app from either Google or Apple, then you should know both Google and Apple may collect data about you. This is not unique to zmNinja, but applies to any app you may download from these stores. Read more about Google’s Privacy Policy and Apple’s Privacy Policy respectively.
zmNinja DOES NOT use any embedded advertising SDKs (please see firebase library note above).
￼
Data & transport security
-------------------------

To communicate with ZoneMinder, zmNinja uses either HTTP or HTTPS. Which protocol to use is configured by you. I strongly recommend that you use HTTPS
zmNinja does not use any other ports other than the port that is used to access ZoneMinder web console (the exception here is if you enable push notifications, in which case, see the Push Notifications section later)
Some users prefer to not use ZoneMinder authentication at all, and/or use tools such as OpenVPN to create a secure tunnel from the mobile app to the server. How you choose to set up transport security between zmNinja and ZoneMinder is upto you
While not related to zmNinja, when you first install ZoneMinder, it generates a self-signed certificate. I’d recommend you use a trusted SSL certificate instead. Let’s Encrypt offers a free SSL certificate
If you use basic-authentication with ZoneMinder then you should consider upgrading to zmNinja 1.3.0 or above. Earlier versions of zmNinja embedded basic credentials as part of the URL (example admin:password@yourZMurl). Starting 1.3.0, zmNinja properly converts basic authentication credentials to an Authorization header. Due to a platform limitation, however, zmNinja uses a query parameter to transmit the Authorization token when displaying images, if basic auth is used. Note that it is trivial to decode Authorization headers too, so SSL is strongly recommended anyway (And you should know, in general, basic authentication is not intended as a secure mechanism)
￼
Third party plugins & frameworks
--------------------------------

zmNinja relies on several 3rd party plugins for critical functionality. A complete list is provided here and here. In addition to these, zmNinja also uses some additional packages mentioned here (these are packages that are manually included and therefore not listed in the previous links)
zmNinja is as web app, and uses Ionic as a UI layer and Cordova to package the web app into an installable app
zmNinja Desktop uses Electron as an app wrapper
To the best of my knowledge none of these packages contact any 3rd party server not under your control during execution of the app, with the exception of phonegap-plugin-push that offers Push Notification functionality and necessarily needs to contact Google’s FCM servers for push (more on this later)
If you are compiling zmNinja from source, obviously, you will need other packages and dependencies that do involve contacting 3rd party services (such as npm registry, cordova, github and other sources as outlined in the link above)
￼
Logging
-------

Storing app logs is a critical part of being able to debug when things go wrong. The app logs are stored in a text file called zmNinjaLog.txt as part of the app data. The log file is not encrypted, but the code removes passwords before storing into the file
You can delete the logs at any time by going to the logs view and tapping on the “trash” icon on the top right
￼
Design considerations
---------------------

zmNinja is a web application. By nature, it is therefore possibe to decode or decompile the app if anyone had physical access to your phone and is able to access zmNinja. However, I already publish the source code for everyone, so I don’t consider this to be an issue
ZoneMinder today does not provide any token based login API. This is also why I need to store your username/password. This data is transmitted to ZoneMinder using an HTTPS or HTTP (depending on how you’ve configured ZoneMinder) POST method with the username and password as a data field
The database encryption uses a static cipher key. In other words, if someone adept at debugging were to access your phone, bypass any credentials of your phone, they will be able to extract your zmNinja database and decrypt it. I haven’t found a good mechanism to generate a portable device specific cipher key that works reliably across iOS and Android. Even if I did, if the goal is to decrypt the DB without prompting the user, and we can’t make assumptions about the presence of fingerprint or face auth, that cipher will need to be stored somewhere, so not sure how that will help. Therefore, the ciphering of the DB is only meant as a thin layer of protection so as not to store the user data in clear text. It is strongly recommended you use device specific password protection such as fingerprint auth/ password auth/face ID and similar means
￼
Push notifications
------------------

zmNinja works with my open source event notification server to deliver push notifications to iOS and Android devices (and any other consumers that register with it). If you enable this functionality, a unique token, generated by Google’s FCM server is exchanged between your server and Google Firebase. This is required to transmit push messages from your event server to your device. Please refer to this link to read about Firebase and FCM (Cloud Messaging) privacy guidelines from Google. If you are an iOS users, Google’s FCM will in turn proxy the message to Apple’s APNS servers so that your phone receives the message
The event notification server (zmeventnotification.pl) can be configured using secure web sockets or websockets. I’d strongly recommend secure web sockets. Please see its install guide for more details
The event notification server communicates with the following servers: a) With ZoneMinder over shared/mapped memory to access alarm details, b) (updated for ES 6) An intermediary Google Cloud function server I wrote as a push proxy and, c) Google FCM servers to send push notifications to your device. The details (including code) of the intermediary push server are here. Note that if you use push AND enable fcm_log_raw_message in zmeventnotification.ini (default is off), then the push message and its contents, WILL BE LOGGED on my server so you should ONLY USE THIS when I am debugging with you. Read the notes in zmeventnotification.ini
If you don’t use the event server, then this functionality is disabled and no data is transmitted or exchanged with the FCM servers or my intermediary server
Note that desktop zmNinja does not use FCM. It simply sets up a websocket connection directly between your installed zmeventnotification.pl and the zmNinja desktop app. No intermediate servers are used (which also means push notifications don’t get delivered if the desktop app is not running)
￼
App permissions
---------------

zmNinja mobile apps need the following permissions:

Read/Write storage — to save snapshots of events, save data
Network access — to access ZM, read connection type for low bandwidth switching
Send receive data over the network — basic operation, with ZM
Control Vibration — for push notifications
Prevent Device from Sleeping — to keep screen on in montage and other screens
You can see a comprehensive list here for Android. iOS is similar.

￼
Peace of mind
-------------

zmNinja is open source. Feel free to audit the code anytime you want
If you are so inclined, you can always build your own version of the app for all platforms and completely avoid downloading the app/play store version
If you run the desktop version, you can hit Ctrl+Alt+D to open a debug window and inspect the network or sources tabs to look at any external domains it is contacting/communicating with at any time (should only be your ZoneMinder server)

