zmNinja FAQ
```````````

What is the minimum supported version of ZoneMinder, Android and iOS?
---------------------------------------------------------------------

You need a minimum of ZM 1.32 with APIs working. You may get it to run
in previous versions, but I don't support them, so you are on your own.

zmNinja is supported  only on IOS 11+ and Android 5.0+

zmNinja Help
------------

All screens have annotated descriptions now. They are maintained in a google document, so I can easily edit it in future. Click `here <https://docs.google.com/document/d/e/2PACX-1vS9z-ANNUbPRMhCWbS-PFJtB_6y6O_vwrZfLE6-TjPo3O0bPQeMUjjeTSXFvILU_w4ZTgU01CM9Hz8p/pub>`__ for the document.


Asking for refunds
------------------

For iOS: To get a refund, Apple wants you to contact them directly 
using `this <https://support.apple.com/en-us/HT204084>`__ link. There used to be
a time when I could process a refund myself, but it seems Apple doesn't provide
that interface anymore.

For Android: If you're not happy with zmNinja and have bought the app,
please `send me an email <mailto:pliablepixels@gmail.com>`__ **with your
order id**.

Note that depending on how long ago you made the order, I may not be
able to refund. Its not my policy - The app/play stores disable the
refund option. For example, I could not refund an app a user purchased 2
years ago.

Also, please read `Things you should own up
to <#things-you-should-own-up-to>`__

Asking for apks
----------------

Every once in a while, I get a request from folks asking for the zmNinja APK.
Usually, it is because their devices don't have Google Play Store. And 
almost always, they offer to pay, just not via Google's Play store.

I'm sorry, I don't offer a non play store APK download mechanism.
This is why:

* The moment someone pays for the apk, there is an expectation that the app 
  will be updated as well. If you get the apk from me, it will be frozen in time.
  And I don't have the ability to supply updated apks on a regular basis. I know some
  of you think you will never need an update, but you will. Your OS may change, ZM may
  change and suddenly the app may have issues. 

* There is absolutely no way for me to know or track what happens to the apks
  after I send them out. You may choose to host the apk on a file sharing
  site or send it to a colleague or family member who may make it available for
  everyone else to download. I know most of you have no such intentions, but I know
  for sure, a few do (I've had my apk show up on mediashare sites in the past).
  For everyone who has asked me to "make an exception only once", I'd do that only
  if I knew you. If I did not, I should be making the same exception to 
  everyone who has asked me.

* Technically, I suppose I could implement a different licensing server mechanism
  but that is exactly what the play store already provides. The reason I chose to 
  use the play store is to avoid all of this. Goes back to how I prefer to use my
  available time.

* The corollary to that is, as you know, the source code is on github and so
  are the build instructions. You are free to compile on your own to make your
  apk. 

So bottom line, your reasons are likely very legitimate, just that I can't support
a non play store channel given my lack of available time.


Things you should own up to
---------------------------

Read the app description
~~~~~~~~~~~~~~~~~~~~~~~~

Both the Apple and Android stores have a clearly visible note on the app
description that it requires a working API for ZoneMinder. If you are
not willing to ensure the API works, please save yourself and me time.
I'm sorry this is the first post, but I get emails from too many
entitled/rude folks about APIs not working. Not my problem. Read below.
Breathe.

Try before buy
~~~~~~~~~~~~~~

Some users legitimately look around for an option to try before they buy
and they are not savvy enough to `download the
code <https://github.com/pliablepixels/zmNinja>`__ and compile (:doc:`source`) for 
themselves. Fair enough. In that case, `download the Desktop
version <https://github.com/pliablepixels/zmNinja/releases>`__ of
zmNinja. It's free and is the same code as mobile. Make sure the desktop
version works before you buy the mobile version.

The reason I don't have a "trial mobile version" is that I find the
process too complex using in-app-purchases and chose not to do it to
make life simpler for me. As a substitute, I do make the full code
available for free and offer a desktop binary version free too.

zmNinja doesn't work. Actually, even ZoneMinder web console doesn't work. You should fix this!
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Yeah, look - I understand zmNinja won't work if ZoneMinder web console
doesn't work. That being said, I really don't have time to help you
debug ZoneMinder issues. I only develop the app (zmNinja). If you can't
set up ZoneMinder properly, please post your questions in the `ZM
forum <https://forums.zoneminder.com>`__. You'll find more qualified
people to help you. I don't develop nor control ZoneMinder. It's a
different set of folks. Now, I'll help you, but only after you have
spent sufficient time trying your best and provide sufficient logs of
what you have done. Also remember, if you buy zmNinja, **I'm happy to
refund it anytime - just send me an email.**

In short, I don't have the time to support ZoneMinder install issues -
sorry about that

zmNinja doesn't work. Zoneminder works, but I have no idea why APIs don't work. You should fix this!
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

*Sigh*. I don't maintain ZoneMinder. I only develop the app. *You* need
to make sure ZoneMinder APIs work. ZoneMinder web console doesn't use
APIs. Neither does zmView. zmNinja does. It says so in the description
of the app in the store. So feel free to fix your APIs, or ask me for a
refund. Just don't whine to me, please, if your APIs are broken. I'm
*not* going to fix them for you, especially if you act like its not your
problem. `I'm perfectly fine if you choose not to use my
app <https://medium.com/zmninja/no-soup-for-you-42ac0927952>`__, which
is why I refund, anytime.

I can't compile zmNinja, help me!
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

I put out the source code, so people who know how to compile are able to
do it themselves. I also hope this will encourage folks to PR changes
(though this has rarely happened). The problem however, is that
dependencies/libraries keep changing. I just don't have the time to help
debug. If it happens to me, I'll fix it. If it doesn't I have very
limited time to remotely debug your setup issues. I'd much appreciate if
you figured it out on your own. Feel free to create an issue after
you've tried enough, but I can't guarantee I'll spend a lot of time on
source code compile issues.

How to report errors
--------------------

-  I don't know why something is not working if you don't provide
   sufficient inputs. Start by creating a `GitHub
   issue <https://github.com/pliablepixels/zmNinja/issues>`__ and please
   fill in the template correctly. If you don't want to post debug logs
   in the issue, `email <mailto:pliablepixels+zmNinja@gmail.com>`__ them
   to me and mention in the issue you've emailed them (you can email by
   going to logs screen and tapping on the envelope button (mobile) or
   you can download logs (cloud icon, desktop version)

-  If zmNinja was working, but it stopped after you upgraded ZoneMinder
   be sure to mention which version was working and which was not. In
   this case, please make sure you have validated the APIs work

-  Before you create an issue, please make sure you have read the
   sections on `connection
   issues <#connectionauthentication-issues>`__
   and `streaming <#live-streaming-issues>`__
   issues and Step 6 of :doc:`validating-api`

-  Its often hard to infer a problem especially when its due to some
   unique apache/nginx mungling you might have done but haven't told me
   about it. In such cases, try and give me remote access to your ZM for
   a day. Configure a limited user with just one monitor. It will save
   hours of frustration (mostly on my side). Thanks

-  I have released the desktop version free - download it
   `here <https://github.com/pliablepixels/zmNinja/releases>`__. Its
   always easier to debug on the desktop version - give it a try. If you
   hit Shift+Cmd/Ctrl+D it brings up a debug window - it helps debugging

-  Always tell me what your ZoneMinder & zmNinja versions are

-  If your app suddenly stopped working:

   -  Send me DEBUG logs of the app
   -  tell me what changed (got to be something. You updated the app,
      you upgraded ZM)
   -  What exactly is not working?

If zmNinja does not start on your device
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
In this case, I'll need logs.


Case 1: The app does work, but it got stuck and you can't get out
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
In this case, it is easier to extract logs. If you are using Android, use one of the many free android file explorer applications (google for it and install the one that works for you) and extract the log file (``zmNinjaLog.txt``). A common place for it to reside is in ``/data/data/com.pliablepixels.zmninja_pro/files``.  If you are using iOS, you can use an app like `IExplorer <https://macroplant.com/iexplorer>`__ to connect to your phone. The app is paid for, but the demo license works just fine to extract the logs. In my case, logs were in ``Apps->zmNinja->Library->NoCloud->zmNinjaLog.txt``

Case 2: The app doesn't work at all and it gets stuck on the splash screen
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
There are some odd cases, where zmNinja does not start (or gets stuck in the splash screen) on specific devices.
It is very hard for me to know why it fails on certain devices, but I can try. Here is what you need to do:

You have to send me system logs of the device. To get system logs:

- You will have to install ``adb`` (Android Debug Bridge). `This XDA post <https://www.xda-developers.com/quickly-install-adb/>`__ describes the process of downloading and installing the tools.
- Once ADB is installed, connect the phone to the browser (make sure you have allowed debugging on the phone menu - it should ask) and type in ``adb logcat >result.txt`` and try to start the app. A lot of logs will be generated. Please `email them to me <mailto:pliablepixels@gmail.com>`__. Note that to just filter out zmNinja logs, you can use ``adb logcat | grep "filelogger.min.js"``.

- For iOS, use the method described in Case 1 above.

Profile information storage related
-----------------------------------

zmNinja is not saving my information. It keeps asking me to re-enter all my data
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

I've seen this happen in two cases: 

- You are running out of space.  Clean up some space and try again  
-  On specific Android devices, typically running Android OS less than 6.0, some (2-3) users have reported this issue. I still don't have a good answer. Please update to the latest app version and send me debug logs, please

I updated my zmNinja app and all my server settings were cleared. Why?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Sorry. I've made several releases where due to programming errors,
settings got wiped out. However, starting v1.3.021 for Android and
v1.3.025 for Android, I've introduced the facility to sync with the
cloud (Google Drive/iCloud). This is the settings option. It is enabled
by default. This means if you uninstall the app and install again, the
settings should get restored. Note that both in iOS and Android, backup
schedule is managed by the OS. You can force a backup going to settings
and forcing a backup, or wait till the OS backups (typically a few
hours/phone plugged in/not being used)

Do also note that 1.3.027 and beyond use a new WebView called WKWebView
(because iOS deprecated the old webview). If you disabled iCloud you
will have to re-enter your settings again (only once). This may not
affect Android, but I don't know for sure.

Connection/Authentication issues
--------------------------------

General tips
~~~~~~~~~~~~

.. important:: 
  Make sure you have the following settings in ZM:
  
  - ``AUTH_RELAY`` is set to hashed
  - A valid ``AUTH_HASH_SECRET`` is provided (not empty)
  - ``AUTH_HASH_IPS`` is disabled
  - ``OPT_USE_APIS`` is enabled
  - If you are using any version lower than ZM 1.34, ``OPT_USE_GOOG_RECAPTCHA`` is disabled
  - If you are NOT using authentication at all in ZM, that is ``OPT_USE_AUTH`` is disabled, then make sure you also disable authentication in zmNinja, otherwise it will keep waiting for auth keys.
  - I don't quite know why, but on some devices, connection issues are caused because ZoneMinder's CSRF code causes issues. See `this <https://forums.zoneminder.com/viewtopic.php?f=33&p=115422#p115422>`__ thread, for example. In this case, try turning off CSRF checks by going to  ``ZM->Options->System`` and disable "Enable CSRF magic". You will then have to delete zmNinja's API cache (``Menu->Clear API Cache``) and restart the app.

-  Disable server redirects like 302 and then try if using the mobile
   app
-  To make sure there are no connection issues, launch your **phone
   browser** and try to reach ZoneMinder. If that doesn't work, neither
   with zmNinja. Many users try to access ZoneMinder from a desktop
   browser and/or on the same server it is running and forget the phone
   is a different device!
-  Some phones need the SSL certificate installed in the device
-  Specific SSL settings can cause issues with Android or iOS
-  Don't use funky/special characters in passwords - try changing it to
   a complex password without funky characters and try
-  Use the wizard - I've seen many examples of typos when the user
   thinks they don't have a typo
-  If you are using basic authentication, make sure your credentials are
   correct. A good way to test is to first disable basic auth and enable
   it after you are sure things work without basic auth.
-  Please note zmNinja does NOT support Digest authentication. So please
   don't put in digest auth info when zmNinja asks for basic
   authentication
-  Look at your ZM logs and zmNinja logs - they help isolate the problem

Server Redirects
~~~~~~~~~~~~~~~~

If the Wizard fails to connect in the mobile app but works in the
desktop app, it may be that your server is sending redirects.
Unfortunately, the current mobile HTTP stack doesn't handle cookies with
redirects well. Till this bug is fixed by the plugin author Wizard won't
work. Note that if you are running ZM 1.32 or above, you can directly
enter your settings without using the wizard and it will work because it
will try and use the new ZM 1.32 ``login.json`` API first.

Self signed certs
~~~~~~~~~~~~~~~~~

A lot of people use self-signed certs. I'd strongly recommend you use
`LetsEncrypt <https://letsencrypt.org>`__ if you can. It's free. That
being said zmNinja does support self signed certs. Make sure "Enable
Strict SSL" is off in Developer settings. You will need to restart the
app.

SSL settings
~~~~~~~~~~~~

If you are getting ``SSL protocol/handshake errors`` in your logs, you
very likely have specific ssl settings enabled server side that your
device network stack does not support. Note that just because it works
with the device browser does not mean it will work with zmNinja as
zmNinja does not use the browser HTTP implementation in mobile devices.

One use reported that a setting of ``ssl_ecdh_curve secp384r1`` in his
nginx config was resulting in zmNinja Android not being able to connect
to the server. Changing it to
``ssl_ecdh_curve secp521r1:secp384r1:prime256v1;`` worked for him.

I'd strongly recommend you remove all special ssl settings except the
certificate and key file locations, make it work and then add the
settings back one by one and see what works/does not work.

Everything works when I use LAN IP, but I get "not authenticated" when I use WAN IP
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This is likely happening if you use self signed SSL certs. If you are
using self signed certificated, you should make sure the "common name"
matches the hostname (or public IP) of the server you are installing ZM
in. If not, zmNinja's SSL handshake will fail.

If you have used 'make-ssl-cert' or a similar tool that automatically
generates the cert for you, its very likely you have certificate that
uses the 'unix hostname' of your server. That will not work.

Assuming you are usin apache and have SSL enabled, here is how to
regenerate the certs (ubuntu specific, may need to tweak it for your
distro)

This will create a self-signed certificate/key pair and store it in
/etc/apache2/ssl (you may have to create that directory, or store it
elsewhere)

::

    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/apache2/ssl/zoneminder.key -out /etc/apache2/ssl/zoneminder.crt

Next up, edit your apache ssl config (example
/etc/apache2/sites-available/default-ssl.conf) And add/modify the
following lines:

::

    SSLCertificateFile /etc/apache2/ssl/zoneminder.crt
    SSLCertificateKeyFile /etc/apache2/ssl/zoneminder.key

restart apache

::

    sudo service apache2 restart

Live streaming issues
---------------------

Summary of Everything works, but I can't see live feed
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

*Please* be diligent in reviewing this list. You'd be surprised how many
times I've had users tell me 'they have checked this list' only to find
out later they skimmed details.

-  Please enable ``AUTH_HASH_LOGINS`` as well as set ``AUTH_RELAY`` to
   "hashed"

- If you are NOT using authentication in ZM, please turn OFF authentication in zmNinja too.
  If you don't, zmNinja will keep waiting for an authentication token. If this is the cause,
  you will see a "waiting for authSession to have a value" log in your zmNinja logs.

-  Your ``cgi-bin`` setting in zmNinja is incorrect. Please run the
   wizard. There are times when the wizard can fail. In those cases,
   open up ZM web console, go to view the monitor and do an "Inspect
   Source" in the browser. That will show you the cgi-bin link that you
   can use in zmNinja. **Special Note**: Many people miss looking closely 
   at cgi-bin. Your browser may show ``/cgi-bin/`` while your zmNinja may 
   be set to ``<domain>/zm/cgi-bin/``. So the solution here is to remove ``/zm`` 
   from zmNinja.

For example:

.. image:: img/inspect-source.png
   :width: 600

In the above case my zmNinja cgi-bin setting is
``https://myserver:myport/zm/cgi-bin``

- If you are using multi-server, please make sure the user account has 
  "System View" permissions. This is needed to get access to the server API. 
  If zmNinja is unable to read the API, it will use the default portal URL, which
  may fail.

-  You think your APIs are working, but they are really not. If you open
   a browser and type in ``https://yourserver/zm/api/monitors.json`` and
   you see some text on top followed by monitor data, your APIs are
   *not* working. You need to search the forums and figure out how to
   get rid of that text.

-  Your ZoneMinder live view from the web console doesn't work either.
   If this is the case, fix ZoneMinder first. Before you say "web
   console works fine", make sure you are running it from a different
   computer from where ZM is running.
-  The phone/computer running zmNinja does not have access to your ZM
   server. For example, many people test the web console on their LAN
   but test zmninja on a WAN connection
-  Always try with the `free desktop
   version <https://github.com/pliablepixels/zmNinja/releases>`__ first.
   Enable debug view by hitting Ctrl/Cmd+Shift+D and you can see debug
   logs in the console view. I can't emphasize enough how useful this
   is.
-  You are using Basic Authentication. See
   `here <#i-can-t-see-streams-i-use-basic-auth>`__
-  You have 'multi-server' configuration enabled and you have done it
   wrong. Go to ZM Web Console->Options->Servers - if you see any
   entries there and you don't know what multi-server is, or you don't
   use it, please disable multi-server
-  When trying to view live images, look at your *webserver* error logs
   - example Apache's ``error.log`` - see any image/jpg errors? That
   means you are missing libraries
-  You have set up a multi-server install of ZM without knowing you did
   See `here <#i-can-t-see-streams-multi-server-is-enabled>`__
-  Look at zmNinja, ZoneMinder and web server error logs at the time of
   error - one of them should give more clues. Please send me *all* the
   logs if you ask for help
-  On certain devices, Zoneminder's CSRF checks cause issues. Turn off CSRF in Zoneminder
   by going to ``Options->System`` and turn off ``ENABLE_CSRF_MAGIC``
-  Read the set of notes below

General note
~~~~~~~~~~~~

To debug streaming notes, always try with the free desktop version
first. When trying to stream simultaneously look at the debug logs of
zmNinja (``Ctrl/Cmd+Alt+D`` in desktop build, console and/or network
tab) and your webserver error logs.

I can't see stream: And I can't see streams in ZoneMinder webconsole either
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Check if streaming works in the web interface. If it does not work,
zmNinja won't work either. Fix ZM first

I can't see streams: I use basic auth
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Starting Chrome v59, the browser changed basic credential behavior. The
issue report is
`here <https://bugs.chromium.org/p/chromium/issues/detail?id=435547#c33>`__.
Here is the core issue: zmNinja constructs URLs as
``http://user:password@server`` when you have basic auth (and starting
v1.3 uses the ``Authorization`` header). However, since images are
rendered using ``<img src>`` there is no option but to put in a
``user:password`` in the URL. Chrome allows this format for direct
requests (such as API calls) but will strip out the ``user:password``
part for *embedded* requests (like ``<img src="">`` tags inside a page).
So what happens is your APIs work, but you won't see images. There is a
reason why Chrome does this - its bad to pass on a user :password in a
URL as its clear text (even if you are on HTTPS, as its in the URL). As
I said earlier, The *right* way to do this is to replace the
``user:pass`` with an ``Authorization`` header but there is no way to do
that with images that are rendered with ``<img src>`` (There are several
plugins that attempt to do this, but don't work with streaming MJPEG
images). Bottom line, this is a problem for apps like zmNinja and it
affects you.

How this affects you: 
-  If you are using HTTP Basic Authentication then your images won't show.

Possible Workarounds: 
- Configure your web server to skip basic authentication for ``nph-zms`` URLs 
- If you are using a ReverseProxy, you can insert the authorization header inside the apache proxy 
- Disable HTTP Basic auth for now 
- Downgrade Chrome (but this may no longer be an option, Chrome will not revert to the old behavior any more)


Skipping auth for ``nph-zms`` URLs
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Here is what I've used that works with basic-auth. This requires a basic
auth portal login and once logged in allows skipping of image URLs (the
idea comes from `Adam Outler <https://github.com/adamoutler>`__ - he
uses a different approach using reverse proxies, which I link to later)

.. code:: apache

      # this configuration assumes your server portal is server:port/zm
      # and cgi-path is /zm/cgi-bin. Please change it to your specific environment
      # Also requires Apache 2.4 or above

    <Location />
          SetEnvIf Request_URI ^/zm/cgi-bin/ noauth=1
          SetEnvIf Request_URI ^/zm/index.php noauth=1
          AuthType Basic
          AuthName "Auth Required"
          AuthUserFile "/etc/apache2/.htpasswd"
          <RequireAny>
              Require valid-user
              Require env noauth
          </RequireAny>
    </Location>

Authorization with a ReverseProxy
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Simple starter
''''''''''''''

**STEP 1**: Enable "Append basic auth tokens in images" option in
zmNinja->Developer Settings and save. What this does is that image URLs
will append a "basicauth" token parameter with your basic authentication
credentials. This token can then be parsed by Apache and inserted as a
valid Authorization header. Don't enable this option if you are not
using HTTPS because the request-URI will be transmitted without
encryption and it will contain your basic auth credentials, encoded in
base64, which is trivial to decode.

**STEP 2 (Apache)**: Use mod\_rewrite and mod\_header to convert the
token into an authorization in your Apache config. Add this to the
relevant section (``VirtualHost`` or others)

.. code:: apache

         RewriteEngine on
         RewriteCond %{QUERY_STRING} (?:^|&)basicauth=([^&]+)
         RewriteRule (.*) - [E=QS_TOKEN:%1]
         RequestHeader set Authorization "Basic %{QS_TOKEN}e" env=QS_TOKEN

**STEP 2 (Nginx)**: Thanks to user `@ysammy <https://github.com/ysammy>`__

.. code:: nginx

     location /zm/cgi-bin/nph-zms {
        proxy_pass http://<IP>:<PORT>/zm/cgi-bin/nph-zms;
        proxy_set_header Authorization "Basic $arg_basicauth";
      }

A more complete and more secure option
''''''''''''''''''''''''''''''''''''''

User `Adam Outler <https://github.com/adamoutler>`__ has contributed the
following process: see
`HERE <https://github.com/pliablepixels/zmNinja/wiki/Apache-Proxy-Authorization-with-HTTPS,-Basic-Auth,-and-ProxyPass>`__.
Adam also has this to say about why proxies should be recommended for
HTTPS enabled ZoneMinder instances:

    A proxy server should be on the list of recommendations for
    Zoneminder. HTTPS requires processing to encrypt and decrypt. This
    takes processor cycles away from Zoneminder's recording. Since HTTPS
    is now basically a requirement, there should be a page dedicated to
    proxy, https, auth, and their nuances. I just picked up 2-4K cameras
    and processing suddenly became an issue :).

I can't see streams: Multi-server is enabled
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The chances are very high that you have enabled ZoneMinder's
`Multi-Server <http://zoneminder.readthedocs.io/en/stable/installationguide/multiserver.html>`__
option and you entered something like ``localhost`` in server settings.
**DON'T. You can't enter localhost**. If you are not using multi-server,
remove any server settings. If you are using multi-server, you need to
put in a valid server IP or hostname, not ``localhost``. BTW, if you did
put in ``localhost`` you will note that your ZM web console also won't
work if you try to launch your browser on a different machine from where
ZM is running.

I can't see streams: you have cgi-bin issues
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-  Try to use the wizard. If it fails,
-  Go to zmNinja settings and fix your cgi-bin path. the automatic path
   that is filled in won't work. Here is a hint, go to
   zoneminder->options->paths and check the value of the cgi-bin path -
   your zmNinja path will be "base path of your server" + cgi-bin path.

I can't see some streams (some work): you have multi-server access issues
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If you are in a situation where some live streams work and some don't,
it is possible you are using multi-server. In this case, you need to make 
sure the user account has "view" privileges for "System". zmNinja uses the 
``/server.json`` API to get multi-server data so it can figure out which IP:port
is used for streaming for that server. If it fails, it will fallback to the portal
URL which will likely be wrong. 



zmNinja montage does not seem smooth - feeds seem a little delayed compared to ZM console
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

zmNinja does not use ``nph-zms`` to display live feeds in montage. This
is because Chrome only allows a maximum of 6 connections per (sub)domain
which means you can't have more than 6 active TCP connections to a
single domain at the same time. This also means that you can't display
more than 6 monitors together. To avoid this, I use the zoneminder
"snapshot" feature that displays a still from the monitor and then
refresh it every X seconds (by default X=2 unless you switch to low
bandwidth mode. You can change X in developer settings)

That being said, starting v1.3.0 of zmNinja onwards, I now support
multi-port (available in ZM 1.32 onwards) that lets you stream as many
monitors as you need. Read
`this <https://medium.com/zmninja/multi-port-storage-areas-and-more-d5836a336c93>`__
post for more details.

Event images/streaming related
------------------------------

General note
~~~~~~~~~~~~

To debug streaming notes, always try with the free desktop version
first. When trying to stream simultaneously look at the debug logs of
zmNinja (``Ctrl/Cmd+Alt+D`` in desktop build, console and/or network
tab) and your webserver error logs.

Also, Starting ZM 1.32 and beyond, please enable ``AUTH_HASH_LOGINS`` as
well as set ``AUTH_RELAY`` to "hashed"

I can't see events in zmNinja
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
- Make sure your APIs are working. An easy way to check is to try 
``https://yourserver/zm/api/events.json`` in your browser after logging into ZM

- By default, zmNinja only displays events with at least 1 alarmed frame. To view 
  all events, tap on the vertical "..." icon on the top right of the event view, and select
  "View all events". If you don't see "View all events" turn off "Only detected objects" option.


Event stream viewing does not work
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-  Look at apache error logs - it often gives you hints

Video Not Playable
~~~~~~~~~~~~~~~~~~
-  Your video may be using a codec that is not supported on mobile browsers.
   H265 is a good example. To work around this, use MJPEG for the monitor.
   Go to ``Menu->Monitors``, click on ``Configuration`` and enable "Force MJPEG"
-  Mobile devices have more restrictions to video playback than
   destkops. Make sure you first check if the video is playable in
   Chrome using the same phone you are using zmNinja on
-  There could be other reasons due to which the video is not playable:
-  There is an encoding issue in the video generated
-  The video resolution is too big (see `this
   thread <https://forums.zoneminder.com/viewtopic.php?f=33&p=108788#p108774>`__)
-  In general, to get to the root of what is going on, you'll need
   device logs using ADB (see
   `this <https://forums.zoneminder.com/viewtopic.php?f=33&p=108788#p108753>`__)

Event thumbnails/images don't show
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Starting zmNinja 1.3.26 and beyond, if you are using OPT\_AUTH you need
to enable AUTH\_HASH\_LOGINS or you won't be able to see image snapshots
and thumbnails. Only applicable for mobiles.

When viewing individual frames, some event frames show, but some don't
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This can happen if you are using Video Storage (Passthru or X264 Encode)
and have disabled frame (JPEG) storage completely. What happens is
ZoneMinder uses ``ffmpeg`` to extract frames from timestamps and
sometimes it is unable to extract a frame for a specific timestamp,
resulting in this issue. If you see HTTP 404 messages for some frames,
but the video plays fine, then this is why.

zmNinja montage screen shows all my monitors, but in Event Montage, I only see 5?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You are likely using Chrome (Android or desktop version). Chrome allows
a total of 6 simultaneous connections to a domain/sub-domain. ZoneMinder
uses a long running TCP stream for each monitor display (keeps sending
jpeg images). This means you can only display 6 streams at a time in
Chrome. I work around this problem by *not* asking for live streams in
montages - I ask for 'snapshots' and keep refreshing snapshots every 2
seconds. This makes montage display non-realtime, but scales to as many
monitors you have. In Event Montage however, I am using zms to display
long running streams - trying to do snapshots in event montage is a lot
of work and I need to keep track of when the event ends, move to next
image etc. I limit this to 5 because I need 1 for control messages.

Other misc. issues
------------------

APIs seem to work in the browser but zmNinja says APIs don't work
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
There could be several reasons, but this one is common: look in the logs. If you see something like:

::

  DEBUG **EXCEPTION**SyntaxError: Unexpected token < in JSON at position 0 caused by undefined.

Then that means the ZM API layer is throwing warning messages which you don't see in your browser, but will show up
if you do an inspect source. The solution is to edit ``/usr/share/zoneminder/www/api/app/Config/core.php`` 
(or whichever path your ZM is installed in) and around line 34-ish, you'll see something like ``Configure::write('debug',2)``.
Change it to ``Configure::write('debug',0)``



I suddently see an error message saying I need to enable ZM\_AUTH\_HASH\_LOGINS. This wasn't there before
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Yes. Starting 1.3.027 onwards, due to a new UI web rendering engine that
enforces CORS, I've had to change my strategy on how network calls are
made. Briefly, on mobile devices, I now use a native HTTP stack and not
the browser HTTP stack. However, images are rendered using the browser
HTTP stack which causes this message. In short, you need to enable it,
and restart ZM.

zmNinja 1.2.515 and beyond says "Need API Upgrade" for the 24hr review feature. What does that mean?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

You need to update an API file in Zoneminder server. ZoneMinder folks
haven't yet (as of Apr 2018) made a release with that API change. To do
it manually,simply replace your ``EventsController.php`` (typically in
``/usr/share/zoneminder/www/api/app/Controller``) with `this
one <https://raw.githubusercontent.com/ZoneMinder/zoneminder/85b7baa13178a838fe9fae94405c99fe7d2c669c/web/api/app/Controller/EventsController.php>`__.

I upgraded ZoneMinder to 1.30.2 or above and zmNinja stopped working!
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

ZoneMinder changed API packaging with ZM 1.30.2 and above. You will have
to read your distro notes on how to **properly** update. Read
`this <https://forums.zoneminder.com/viewtopic.php?f=36&t=26002&start=30&hilit=api+broken>`__
thread. Before you think zmNinja is the problem, make sure your APIs
are working (see :doc:`validating-api`)

Summary of reasons why zmNinja might have stopped working: - You did not
check if your APIs are working after the upgrade - You did not upgrade
properly (just updating the ZM package without following distro
instructions with ZM is not sufficient) - You are missing some key
CakePHP modules, likely ``php5-apc`` which would have been installed if
you read all the package instructions. You can install it manually - You
might need to restart your system after upgrading (properly)

I am running ZM on a custom port. zmNinja is unable to reach my ZoneMinder server but I tried on a regular browser (Firefox/Opera/IE) and it I can reach it
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

zmNinja on Android and Desktops uses an embedded chrome browser. Chrome
marks certain ports as "unsafe" and won't allow connections to go out.
The list of ports to avoid are
`here <http://tech-stuff.org/which-ports-are-considered-unsafe-in-browsers/>`__

The Montage screen is causing issues with my ZM server - I get connection timeout issues or MySQL connection problems
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-  zmNinja uses a different approach to display montage than ZoneMinder.
   In zmNinja montage screen, I display a snapshot of each monitor and
   refresh it every few seconds. This results in many short TCP
   connections constantly being opened and closed. The reason I have to
   do this is Chrome only allows 6 connections to a domain, which means
   if I don't keep terminating TCP connections, I won't be able to show
   more than 6 monitors. Each time I open a new TCP connection for a
   snapshot, the ZM backend invokes mySQL to authenticate the request.
   You will need to increase mySQL ``max_connections`` in ``my.cnf`` if
   you are facing time\_wait/timeout issues.

The app works great - except it doesn't work on ONE Android phone - works in others!
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

zmNinja uses an embedded chrome browser in its app. If you have safe
browsing enabled, it may affect zmNinja. However, if you are facing this
problem, its likely you can't access ZM from a mobile web browser
either. The problem that might be occurring is that zmNinja is trying to
reach your ZM server and your settings prohibit it from reaching ZM, so
it fails. See
`this <https://forums.zoneminder.com/viewtopic.php?f=33&t=25946>`__
discussion

APIs are not working ! ZM console works fine.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

:doc:`validating-api`

I'm using mocord/record and I don't see events without alarms
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Tap on the "..." menu option and toggle "Show all events". By default,
it shows events with at least one alarm frame

Taking snapshots or downloading videos don't work in Android
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If you are unable to download/save, look at your logs. If you see
something like
``"exception":"java.security.cert.CertPathValidatorException: Trust anchor for certification path not found."``
, chances are you are using self-signed certs. You need to install the
certificate on your phone. Installing is as easy as emailing yourself
the ".crt" file and tapping on it from your device to install it. In
general, both Apple and Google have been incrementally tightening rules
for self signed certificates - they generally discourage usage of such
certs and over time both Chrome (Android) and WkWebView (iOS) have added
new restrictions/checks which affects usage.

Pan/Tilt/Zoom doesn't work
~~~~~~~~~~~~~~~~~~~~~~~~~~

Tilt/Zoom/Presets support has not been added. But for this to work, PTZ
needs to work in ZM first. Once it works in ZM, try it in ZMNinja. Also
note that you may need to disable CSRF in your Options in ZoneMinder -
it seems to cause all sorts of issues.

What is this Event Server?
--------------------------

The Event Server is a contribution I made to ZoneMinder that adds a
daemon to the existing list. It listens for new events using shared
memory (aka very efficient) and then sends notifications of events to
listeners (you can write your own app that listen as well as use
zmNinja). This is a chapter on its own, and I have a dedicated
page/project for this
`here <https://github.com/pliablepixels/zmeventserver>`__. I'd encourage
you to install and use it - its very nice.

It looks like you allow me to modify the frequency of push notifications. Very cool - will it send me all events that I missed if I make the frequency of a monitor event push to say, 600 seconds?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Nope. It only sends the latest events. What it does is before sending
push notifications, it checks if the last time a push was sent for this
monitor is < the time you specified. If it is, it does not send. That's
all.

When I switch languages, date/time inputs don't follow my locale in zmNinja Desktop
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
The only screen I am aware of where there is a date/time input is ``Events->Filter Events``. This happens because the desktop version uses an embedded chromium version which seems to default to ``en-us``. To work around this, you can start the desktop app with a ``--lang='<locale code>'`` option. Example ``--lang='ru'``. Note that you will have to do this each time and is completely related to any language you may choose in zmNinja. Thel language in zmNinja is only used to translate text strings. Nothing else. For an extended discussion see `this issue <https://github.com/pliablepixels/zmNinja/issues/875>`__. 

Is zmNinja free?
----------------

The source code is free, grab it, compile it, use it. The desktop ports
are free as of today. I may charge for it some day. The mobile ports are
in Appstore/Playstore for a fee.

Who are the developers behind this?
-----------------------------------

Me.

The code needs improvement
--------------------------

You are being nice. I know the code is terrible. I'm not a coder by
profession. This was my first project to learn how to write a mobile
app. So the app evolved from no knowledge to some knowledge. It
comprises of terrible to passable to reasonable code. There is a reason
why my `profile <https://github.com/pliablepixels>`__ says what it says.
But hey, if you can improve it, please PR!

Is zmNinja an official ZoneMinder product?
------------------------------------------

No. But the ZM developers are amazing people who have been very helpful.

I want to donate money
----------------------

You could either `donate to to
Zoneminder <https://www.bountysource.com/teams/zoneminder>`__ or `donate
to zmNinja <https://salt.bountysource.com/teams/zmninja>`__. Donations
to ZoneMinder don't contribute to zmNinja, but the ZoneMinder devs will
benefit from it, which is fine too.

How does zmNinja use my personal data?
--------------------------------------

Please read
`this <https://medium.com/zmninja/zmninja-privacy-and-your-data-5489a5974baf>`__

I want to donate time/expertise/code
------------------------------------

Great. Make sure you read the
`license <https://github.com/pliablepixels/zmNinja/blob/master/LICENSE>`__
, read the `contributing
guidelines <https://github.com/pliablepixels/zmNinja/blob/master/CONTRIBUTING.md>`__
and if it works for you, happy to see what you'd like to do.
