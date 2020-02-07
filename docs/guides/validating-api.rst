Validating APIs
````````````````

Please make sure you go through this before you wonder why zmNinja is not working.
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

    Assumption: Your ZM server is accessible at ``http://server/zm`` ->
    replace this with your actual path

Make sure ZM APIs are working:
''''''''''''''''''''''''''''''

(Note - nginx users, if you are facing API issues, please see if `this
page <https://github.com/pliablepixels/zmNinja/wiki/How-to-configure-APIs-with-nginx>`__
helps)

-  Step 1: Open up a browser
-  Step 2: Log into ZM
-  Step 3: Open another tab in the same browser (**IMPORTANT**: Has to
   be from the same browser you logged into ZM)
-  Step 4: Type in ``http://server/zm/api/host/getVersion.json`` --> you
   should see a response like:

   .. code:: json

       {
       "version": "1.30.0",
       "apiversion": "1.0"
       }

   version/apiversion may be different. If you don't see such a
   response, your APIs are **not** working

-  Step 5:Make sure you can see monitors and events:

Type in ``http://server/zm/api/monitors.json`` --> you should see a
response like:

.. code:: jsonld

    {
        "monitors": [
            {
                "Monitor": {
                    /*lots of additional details*/
                },
                /*more monitor objects if you have more than one*/
            }]
    }

-  Step 6: (If you find your APIs show ok, but zmNinja has issues)

        -  Open a browser, log into ZM
        -  Open a new tab, enter ``http://server/zm/api/host/getVersion.json``
        -  Now, right click and do a ``View Source`` in your browser (different
           browsers may have different names for it). This brings up a full
           source code view of the page. Do you ONLY see the JSON output or do
           you see gobs of HTML on top like ``<pre class=`` and lots of cake
           related messages? If you do, you need to fix it.

if you find the page empty, your APIs/permissions have a problem. Please
post in the ZM forums (**please DON'T** contact me first as its not a
zmNinja bug)

Type in ``http://server/zm/api/events.json`` --> you should see a
response like: (this list may be an empty set if you don't have events
but you will still see the ``{"events":[]}`` text - if you find the page
empty, your APIs have a problem. Please post in the ZM forums (please
**DON'T** contact me first, as its not a zmNinja bug)

.. code:: jsonld

    {"events":[{"Event":{ /* many more details */ }}]}

*Top reasons why monitors and events API returns blank while getVersion
works:* \* You don't have monitor/event view permissions allocated to
the user \* You have an invalid camera definition (happens sometimes
when you remove and re-add cameras) \* If you are using non UTF8
characters in your monitor names/zone names this can cause issues. Edit
``/usr/share/zoneminder/www/api/app/Config/database.php`` (assuming ZM
is in /usr/share) and make sure ``'encoding' => 'utf8'`` is
*uncommented* (remove ``//``) around line 74. I've submitted a
`patch <https://github.com/ZoneMinder/ZoneMinder/pull/1635/commits/92d7cad5f154359a5b249d7a63fb5034f7d1b51a>`__
but till its merged, you might have to do it manually.

zmNinja API notes:
^^^^^^^^^^^^^^^^^^

-  Please make sure the user credentials you use has:
-  view or edit access to monitors
-  view or edit access to streams
-  view or edit access to system

-  If you are accessing zmNinja remotely, make sure you first access ZM
   remotely from your desktop browser, ensure it works and then use the
   same DNS/IP for zmNinja
