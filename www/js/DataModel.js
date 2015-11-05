/* jshint -W041 */


/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

// This is my central data respository and common functions
// that many other controllers use
// It's grown over time. I guess I may have to split this into multiple services in the future

angular.module('zmApp.controllers')
    
.service('ZMDataModel', 
['$http', '$q', '$ionicLoading', '$ionicBackdrop', '$fileLogger', 'zm','$rootScope','$ionicContentBanner', '$timeout','$cordovaPinDialog', '$ionicPopup', 
 function 
 ($http, $q, $ionicLoading, $ionicBackdrop,$fileLogger,
  zm, $rootScope,$ionicContentBanner, $timeout, $cordovaPinDialog, 
   $ionicPopup) {

    var zmAppVersion="unknown";
    var isBackground = false;
    var monitorsLoaded = 0;
    var montageSize = 3;
    var monitors = [];
    var oldevents = [];
     
    
     var loginData = {
        'username': '',
        'password': '',
        'url': '', // This is the ZM portal path
        'apiurl': '', // This is the API path
        'eventServer':'', //experimental Event server address
        'maxMontage': "10", //total # of monitors to display in montage
        'streamingurl': "",
        'maxFPS': "3", // image streaming FPS
        'montageQuality': "50", // montage streaming quality in %
        'singleImageQuality': "50", // single streaming quality in %
        'useSSL':false, // "1" if HTTPS
        'keepAwake':true, // don't dim/dim during live view
        'isUseAuth':true, // true if user wants ZM auth
        'isUseEventServer':false, // true if you configure the websocket event server
         'disablePush':false, // true if only websocket mode is desired
         'eventServerMonitors':'', // list of monitors to notify from ES
        'eventServerInterval':'', // list of intervals for all monitors
        'refreshSec':"2", // timer value for frame change in sec
        'enableDebug':false, // if enabled with log messages with "debug"
        'usePin':false,
        'pinCode':'',
        'canSwipeMonitors':true,
        'persistMontageOrder':false,
         'onTapScreen':'events',
         'enableh264':true,
         'gapless':false,
        
    };
     
     
     
    var configParams = {
        'ZM_EVENT_IMAGE_DIGITS':'-1',
        'ZM_PATH_ZMS':''
    };


    //--------------------------------------------------------------------------
    // uses fileLogger  to write logs to file for later investigation
    //--------------------------------------------------------------------------
    function zmLog(val,logtype)
    {
        $fileLogger.log(logtype, val);
    }
    
    // separate out a debug so we don't do this if comparison for normal logs
    function zmDebug(val)
    {
        if (loginData.enableDebug)
            $fileLogger.debug(val);
    }
    
   
    //--------------------------------------------------------------------------
    // Banner display of messages
    //--------------------------------------------------------------------------
     function displayBanner (mytype, mytext, myinterval, mytimer)
        {
            
            console.log ("FACTORY DISPLAY: " + JSON.stringify(mytext));
            console.log ("FACTTORY DISPLAY: interval:" + myinterval + " timer:" + mytimer);
            var contentBannerInstance =
            $ionicContentBanner.show({
              text: mytext || 'no text',
              interval: myinterval || 2000,
              //autoClose: mytimer || 6000,
              type: mytype || 'info',
              transition: 'vertical',
              //cancelOnStateChange: false
            });

            $timeout (function() {
                contentBannerInstance();
            },mytimer || 6000);
    }
        

    return {

        //-------------------------------------------------------------
        // used by various controllers to log messages to file
        //-------------------------------------------------------------
        
                
        zmLog: function (val,type) {
            var logtype = 'info';
           if (type != undefined)
                 logtype = type ;
             zmLog(val,logtype);

        },
        
        zmDebug: function (val)
        {
            
                zmDebug(val);
        },

        // This function is called when the app is ready to run
        // sets up various variables
        // including persistent login data for the ZM apis and portal
        // The reason I need both is because as of today, there is no way
        // to access images using the API and they are authenticated via
        // the ZM portal authentication, which is pretty messy. But unless
        // the ZM authors fix this and streamline the access of images
        // from APIs, I don't have an option
        
        // FIXME: Move all of this into a neat JSON object 
        
        init: function () {
            console.log("****** DATAMODEL INIT SERVICE CALLED ********");

            zmLog("ZMData init: checking for stored variables & setting up log file");
            
            if (window.localStorage.getItem("enableDebug") != undefined) {
                 var dbgvalue =  window.localStorage.getItem("enableDebug");
                loginData.enableDebug = (dbgvalue == "1") ? true:false;
                zmLog("enableDebug is ON");

            }
            else   
            {
                zmLog ("enableDebug is OFF");
            }
            if (window.localStorage.getItem("isUseAuth") != undefined) {
                loginData.isUseAuth =
                    window.localStorage.getItem("isUseAuth");
                

            }
            else
            {
                loginData.isUseAuth = "1"; // lets assume there is auth
                zmLog("I did not find isUseAuth. Older version of app, maybe.");
            }
            
            
            if (window.localStorage.getItem("isUseEventServer") != undefined) {
                loginData.isUseEventServer =
                    window.localStorage.getItem("isUseEventServer");
                

            }
            else
            {
                loginData.isUseEventServer = "0"; 
               
            }
            
            if (window.localStorage.getItem("disablePush") != undefined) {
                loginData.disablePush =
                    window.localStorage.getItem("disablePush");
                

            }
            else
            {
                loginData.disablePush = "0"; 
               
            }
            
            
            if (window.localStorage.getItem("username") != undefined) {
                loginData.username =
                    window.localStorage.getItem("username");

            }
            
            
            if (window.localStorage.getItem("refreshSec") != undefined) {
                loginData.refreshSec =
                    parseInt(window.localStorage.getItem("refreshSec"));
                    zmLog ("Refresh in seconds is " + loginData.refreshSec);

            }
            else{
                zmLog ("Refresh is not defined, using " + loginData.refreshSec);
            }


            if (window.localStorage.getItem("montageQuality") != undefined) {
                loginData.montageQuality =
                    window.localStorage.getItem("montageQuality");

            }
            
            if (window.localStorage.getItem("singleImageQuality") != undefined) {
                loginData.singleImageQuality =
                    window.localStorage.getItem("singleImageQuality");

            }

            if (window.localStorage.getItem("password") != undefined) {
                loginData.password =
                    window.localStorage.getItem("password");

            }

            if (window.localStorage.getItem("url") != undefined) {
                loginData.url =
                    window.localStorage.getItem("url");

            }
            
             if (window.localStorage.getItem("onTapScreen") != undefined) {
                loginData.onTapScreen =
                    window.localStorage.getItem("onTapScreen");

            }
            
            if (window.localStorage.getItem("eventServer") != undefined) {
                loginData.eventServer =
                    window.localStorage.getItem("eventServer");

            }
            
        
            
            if (window.localStorage.getItem("eventServerMonitors") != undefined) {
                loginData.eventServerMonitors =
                     window.localStorage.getItem("eventServerMonitors");
            }
            
            if (window.localStorage.getItem("eventServerInterval") != undefined) {
                loginData.eventServerInterval =
                     window.localStorage.getItem("eventServerInterval");
            }

            if (window.localStorage.getItem("apiurl") != undefined) {
                loginData.apiurl =
                    window.localStorage.getItem("apiurl");

            }


            if (window.localStorage.getItem("maxMontage") != undefined) {
                loginData.maxMontage =
                    window.localStorage.getItem("maxMontage");

            }

            if (window.localStorage.getItem("streamingurl") != undefined) {
                loginData.streamingurl =
                    window.localStorage.getItem("streamingurl");
                console.log("STREAMING URL " + loginData.streamingurl);

            }

            if (window.localStorage.getItem("maxFPS") != undefined) {
                loginData.maxFPS =
                    window.localStorage.getItem("maxFPS");
                console.log("maxFPS  " + loginData.maxFPS);

            }
            if (window.localStorage.getItem("montageQuality") != undefined) {
                loginData.montageQuality =
                    window.localStorage.getItem("montageQuality");
                console.log("montageQuality  " + loginData.montageQuality);

            }
            
            if (window.localStorage.getItem("singleImageQuality") != undefined) {
                loginData.singleImageQuality =
                    window.localStorage.getItem("singleImageQuality");
               

            }
            
             if (window.localStorage.getItem("useSSL") != undefined) {
                 var sslvalue =  window.localStorage.getItem("useSSL");
                loginData.useSSL = (sslvalue == "1") ? true:false;
                        console.log("useSSL  " + loginData.useSSL);

            }
            
            
            if (window.localStorage.getItem("canSwipeMonitors") != undefined) {
                var canSwipeValue = window.localStorage.getItem("canSwipeMonitors");
                loginData.canSwipeMonitors = (canSwipeValue == "1") ? true:false;
            }
            
            if (window.localStorage.getItem("persistMontageOrder") != undefined) {
                var persistMontageOrder = window.localStorage.getItem("persistMontageOrder");
                loginData.persistMontageOrder = (persistMontageOrder == "1") ? true:false;
            }
            
            
            if (window.localStorage.getItem("enableh264") != undefined) {
                var enableh264 = window.localStorage.getItem("enableh264");
                loginData.enableh264 = (enableh264 == "1") ? true:false;
            }
            
            if (window.localStorage.getItem("gapless") != undefined) {
                var gapless = window.localStorage.getItem("gapless");
                loginData.gapless = (gapless == "1") ? true:false;
            }
            
            if (window.localStorage.getItem("usePin") != undefined) {
                 var pinValue =  window.localStorage.getItem("usePin");
                loginData.usePin = (pinValue == "1") ? true:false;
                        console.log("usePin  " + loginData.usePin);

            }
            
            if (window.localStorage.getItem("pinCode") != undefined) {
                loginData.pinCode =
                    window.localStorage.getItem("pinCode");

            }

            if (window.localStorage.getItem("keepAwake") != undefined) {
                 var awakevalue =  window.localStorage.getItem("keepAwake");
                loginData.keepAwake = (awakevalue == "1") ? true:false;
                        console.log("keepAwake  " + loginData.keepAwake);

            }

            monitorsLoaded = 0;
            console.log("Getting out of ZMDataModel init");
            zmDebug ( "loginData structure values: " + JSON.stringify(loginData));

        },

        isLoggedIn: function () {
            
            if ( (loginData.username != "" && loginData.password != "" && loginData.url != "" &&
                  loginData.apiurl != "") || (loginData.isUseAuth !='1'))
            {
                return 1;
            } 
            else
            {
                
               
                    return 0;
               
            }
        },

        getLogin: function () {
            
            
            return loginData;
        },

        getKeepAwake: function () {
            return (loginData.keepAwake == '1') ? true:false;
        },

        setAppVersion:function(ver) {
            zmAppVersion = ver;
        },

        getAppVersion:function() {
            return(zmAppVersion);
        },
        
        setBackground:function(val) {
            isBackground = val;
        },
        
        isBackground: function() {
            return isBackground;
        },



        //------------------------------------------------------------------
        // switches screen to 'always on' or 'auto'
        //------------------------------------------------------------------
        setAwake: function(val)
        {


            console.log ("**** setAwake called with:" + val);
           // zmLog("Switching screen always on to " + val);
            if (val)
            {

                 if (window.cordova != undefined)
                 {
                    window.plugins.insomnia.keepAwake();
                 }
                 else
                 {
                     console.log ("Skipping insomnia, cordova does not exist");
                 }
            }
            else
            {
                if (window.cordova != undefined)
                 {
                    window.plugins.insomnia.allowSleepAgain();
                 }
                 else
                 {
                     console.log ("Skipping insomnia, cordova does not exist");
                 }


            }

        },

    //--------------------------------------------------------------------------
    // writes all params to local storage. FIXME: Move all of this into a JSON 
    // object
    //--------------------------------------------------------------------------
        setLogin: function (newLogin) {
            loginData = newLogin;
            zmLog("Saving all parameters to storage");
            zmDebug ("DataModel/setLogin: writing " + JSON.stringify(newLogin));
            
            window.localStorage.setItem("username", loginData.username);
            window.localStorage.setItem("password", loginData.password);
            window.localStorage.setItem("url", loginData.url);
            window.localStorage.setItem("apiurl", loginData.apiurl);
            window.localStorage.setItem("streamingurl", loginData.streamingurl);
            window.localStorage.setItem("eventServer", loginData.eventServer);
            window.localStorage.setItem("eventServerMonitors", loginData.eventServerMonitors);
                window.localStorage.setItem("eventServerInterval", loginData.eventServerInterval);
            
            
            
            
            window.localStorage.setItem("useSSL", loginData.useSSL?"1":"0");
            window.localStorage.setItem("usePin", loginData.usePin?"1":"0");
            window.localStorage.setItem("canSwipeMonitors", loginData.canSwipeMonitors?"1":"0");
            window.localStorage.setItem("persistMontageOrder", loginData.persistMontageOrder?"1":"0");
            
            window.localStorage.setItem("enableh264", loginData.enableh264?"1":"0");
            window.localStorage.setItem("gapless", loginData.gapless?"1":"0");
            
            window.localStorage.setItem("pinCode", loginData.pinCode);
            
            
            window.localStorage.setItem("enableDebug", loginData.enableDebug?"1":"0");
            window.localStorage.setItem("keepAwake", loginData.keepAwake?"1":"0");
            window.localStorage.setItem("maxMontage", loginData.maxMontage);
            window.localStorage.setItem("montageQuality", loginData.montageQuality);
              window.localStorage.setItem("singleImageQuality", loginData.singleImageQuality);
            window.localStorage.setItem("refreshSec", loginData.refreshSec);
            
            
            window.localStorage.setItem("isUseAuth", loginData.isUseAuth);
            window.localStorage.setItem("isUseEventServer", loginData.isUseEventServer);
            window.localStorage.setItem("disablePush", loginData.disablePush);
            window.localStorage.setItem("onTapScreen", loginData.onTapScreen);
              
            
            console.log ("***** SETTING ISUSEAUTH TO " + loginData.isUseAuth);


            if (loginData.maxFPS > 30) {
                console.log("MAXFPS Too high, maxing to 30");
                loginData.maxFPS = "30";
            }
            window.localStorage.setItem("maxFPS", loginData.maxFPS);

            if (!loginData.maxMontage) {
                console.log("INVALID MONTAGE NUM");
                loginData.maxMontage = "10";
            }

            if (parseInt(loginData.maxMontage) <= 0) {
                console.log("*** MAXMONTAGE TOO LOW ***");
                loginData.maxMontage = 1;
            }
        },
        
        //-------------------------------------------------------
        // returns API version or none 
        //-------------------------------------------------------
        getAPIversion: function()
        {
            zmDebug("getAPIversion called");
            var d=$q.defer();
            var apiurl = loginData.apiurl + '/host/getVersion.json';
            $http.get(apiurl)
            .then (function(success){
                if (success.data.version)
                {
                    d.resolve(success.data.version);
                }
                else
                {
                    d.resolve("0.0.0");
                }
                return (d.promise);
               
            },
            function(error){
                zmDebug("getAPIversion error handler " + JSON.stringify(error));
                d.resolve("0.0.0");
                return (d.promise);
            });
            return (d.promise);
               
            
        },
       
        displayBanner: function (mytype, mytext, myinterval, mytimer)
        {
            displayBanner (mytype, mytext, myinterval, mytimer);
        },
        
        isReCaptcha: function()
        {
            var d=$q.defer();
            var myurl =loginData.url;
            zmLog ("Checking if reCaptcha is enabled in ZM...");
            $http.get(myurl)
            .then (function (success) {
                if (success.data.search("g-recaptcha") != -1 )
                {
                    // recaptcha enable. zmNinja won't work
                    zmLog ("ZM has recaptcha enabled", "error");
                    displayBanner ('error', ['Recaptcha must be disabled in Zoneminder', 'zmNinja will not work with recaptcha'],"",8000);
                    d.resolve(true);
                    return (d.promise);
                    
                    
                }
                else
                {
                    d.resolve(false);
                    zmLog ("ZM has recaptcha disabled - good");
                    return (d.promise);
                }
            });
            return (d.promise);
        },
        
        //-----------------------------------------------------------------------------
        // Grabs the computed auth key for streaming
        // FIXME: Currently a hack - does a screen parse - convert to API based support
         //-----------------------------------------------------------------------------
        
        
        getAuthKey: function ()
        {
            var d=$q.defer();
            // Skipping monitor number as I only need an auth key
            // so no need to generate an image
            var myurl =loginData.url+"/index.php?view=watch";
            zmDebug ("DataModel: Getting auth from " + myurl);
            $http.get (myurl)
            .then (function (success) {
               // console.log ("**** RESULT IS " + JSON.stringify(success));
                // Look for auth=
                var auth = success.data.match ("auth=(.*?)&");
                if (auth && (auth[1] != null))
                {
                    zmLog ("DataModel: Extracted a stream authentication key of: " + auth[1]);
                    d.resolve("&auth="+auth[1]);
                }
                else
                {
                    zmLog ("DataModel: Did not find a stream auth key, looking for user=");
                    auth = success.data.match ("user=(.*?)&");
                    if (auth && (auth[1] != null))
                    {
                        zmLog ("DataModel: Found simple stream auth mode (user=)");
                        d.resolve("&user="+loginData.username+"&pass="+loginData.password);
                    }
                    else
                    {
                        zmLog ("Data Model: Did not find any  stream mode of auth");
                        d.resolve("");
                    }
                    return (d.promise);
                }
                
            },
            function (error) {
                zmLog ("DataModel: Error resolving auth key " + JSON.stringify(error));
                d.resolve ("");
                return (d.promise);
            });
            return (d.promise);
            
        },
        
        //-----------------------------------------------------------------------------
        // This function returns the numdigits for padding capture images
         //-----------------------------------------------------------------------------

        getKeyConfigParams: function (forceReload) {

            var d = $q.defer();

            if (forceReload ==1 || configParams.ZM_EVENT_IMAGE_DIGITS == '-1')
            {
                var apiurl = loginData.apiurl;
                var myurl = apiurl + '/configs/viewByName/ZM_EVENT_IMAGE_DIGITS.json';
                zmDebug ("Config URL for digits is:" + myurl);
                $http.get(myurl)
                .success(function(data) {
                    zmLog ("ZM_EVENT_IMAGE_DIGITS is " + data.config.Value);
                    configParams.ZM_EVENT_IMAGE_DIGITS = data.config.Value;
                    d.resolve(configParams.ZM_EVENT_IMAGE_DIGITS);
                    return (d.promise);

                })
                .error (function(err) {
                    zmLog ("Error retrieving ZM_EVENT_IMAGE_DIGITS" + JSON.stringify(err), "error");
                    zmLog ("Taking a guess, setting ZM_EVENT_IMAGE_DIGITS to 5");
                    // FIXME: take a plunge and keep it at 5?
                    configParams.ZM_EVENT_IMAGE_DIGITS = 5;
                    d.resolve(configParams.ZM_EVENT_IMAGE_DIGITS);
                    return (d.promise);
                });
            }
            else
            {
                zmLog ("ZM_EVENT_IMAGE_DIGITS is already configured for " +
                       configParams.ZM_EVENT_IMAGE_DIGITS);
                 d.resolve(configParams.ZM_EVENT_IMAGE_DIGITS);
            }
            return (d.promise);

        },
        
    //--------------------------------------------------------------------------
    // Useful to know what ZMS is using as its cgi-bin. If people misconfigure
    // the setting in the app, they can check their logs
    //--------------------------------------------------------------------------
        getPathZms: function()
        {
            var d = $q.defer();
            var apiurl = loginData.apiurl;
            var myurl = apiurl + '/configs/viewByName/ZM_PATH_ZMS.json';
            zmDebug ("Config URL for ZMS PATH is:" + myurl);
            $http.get(myurl)
            .success(function(data) {
                configParams.ZM_PATH_ZMS = data.config.Value;
                d.resolve(configParams.ZM_PATH_ZMS);
                return (d.promise);
            })
            .error (function(error) {
                zmLog("Error retrieving ZM_PATH_ZMS: " + JSON.stringify(error));
                d.resolve("");
                return (d.promise);
            });
            return (d.promise);
                    
            
        },
        
    //--------------------------------------------------------------------------
    // This is really a hack for now & is very ugly. I need to clean this up a lot
    // it re-arranges monitors based on montage and hidden order so that 
    // I can reuse this from events and timeline view if persist monitor states
    // is on
    //--------------------------------------------------------------------------
        applyMontageMonitorPrefs: function (mon, doOrder)
        {
            var montageOrder = []; // This array will keep the ordering in montage view
            var hiddenOrder = []; // 1 = hide, 0 = don't hide
            var monitors = mon;
            var orderedMonitors = [];


            // First let's check if the user already has a saved monitor order
            var i;
            if (window.localStorage.getItem("montageOrder") == undefined) {

                for (i = 0; i < monitors.length; i++) {
                    montageOrder[i] = i; // order to show is order ZM returns
                    hiddenOrder[i] = 0; // don't hide them
                }
                console.log("Order string is " + montageOrder.toString());
                console.log("Hiddent string is " + hiddenOrder.toString());

                zmLog("Stored montage order does not exist");
            } else
            // there is a saved order
            {
                var myorder = window.localStorage.getItem("montageOrder");
                var myhiddenorder = window.localStorage.getItem("montageHiddenOrder");


                zmDebug("MontageCtrl: Montage order is " + myorder);
                zmDebug("MontageCtrl: Hidden order is " + myhiddenorder);
                if (myorder) montageOrder = myorder.split(",");
                if (myhiddenorder) hiddenOrder = myhiddenorder.split(",");

                //  handle add/delete monitors after the array has been 
                // saved

                if (monitors.length != montageOrder.length) {
                    zmLog("Monitors array length different from stored hidden/order array. It's possible monitors were added/removed. Resetting...");
                    montageOrder = [];
                    hiddenOrder = [];
                    for (i = 0; i < monitors.length; i++) {
                        montageOrder[i] = i; // order to show is order ZM returns
                        hiddenOrder[i] = 0; // don't hide them
                    }
                    window.localStorage.setItem("montageOrder",
                        montageOrder.toString());
                    window.localStorage.setItem("montageHiddenOrder",
                        hiddenOrder.toString());


                }

            } // at this stage, the monitor arrangement is not matching
            // the montage order. Its in true order. Let us first process the hiddenOrder part
            // now

            for (i = 0; i < montageOrder.length; i++) {
                    montageOrder[i] = parseInt(montageOrder[i]);
                    hiddenOrder[i] = parseInt(hiddenOrder[i]);
                    //  $scope.monitors[i].Monitor.sortOrder = montageOrder[i];
                    // FIXME: This will briefly show and then hide
                    // disabled monitors
                    if (hiddenOrder[i] == 1) {
                        // $scope.monitors[i].Monitor.listDisplay='noshow';

                        if (monitors[i] !== undefined)
                            monitors[i].Monitor.listDisplay = 'noshow';
                        zmLog("Monitor " + i + " is marked as hidden in montage");
                    } 
                    else 
                    {
                        if (monitors[i] !== undefined)
                            monitors[i].Monitor.listDisplay = 'show';
                    }
            }
            
            
            if (doOrder)
            {
               for (i = 0; i < montageOrder.length; i++) {
                    for (var j = 0; j < montageOrder.length; j++) {
                        if (montageOrder[j] == i) {
                            // if 2 is passed, hidden elements are not recorded
                            if (doOrder == 2)
                            {
                                if (monitors[j].Monitor.listDisplay != 'noshow')
                                    orderedMonitors.push(monitors[j]);
                            }
                            else 
                                orderedMonitors.push(monitors[j]);
                        }   
                    }
                }
            }
            else
            {
                orderedMonitors = monitors;
            }
            
            

            return ([orderedMonitors,montageOrder, hiddenOrder]);

        },

        //-----------------------------------------------------------------------------
        // This function returns a list of monitors
        // if forceReload == 1 then it will force an HTTP API request to get a list of monitors
        // if 0. then it will return back the previously loaded monitor list if one exists, else
        // will issue a new HTTP API to get it

        // I've wrapped this function in my own promise even though http returns a promise.
        //-----------------------------------------------------------------------------

        getMonitors: function (forceReload) {
            console.log("** Inside ZMData getMonitors with forceReload=" + forceReload);
            
            
            
            $ionicLoading.show({
                template: 'loading monitors...',
                animation: 'fade-in',
                showBackdrop: true,
                duration: zm.loadingTimeout,
                maxWidth: 200,
                showDelay: 0
            });
            
        
                
            
            var d = $q.defer();
            if ((monitorsLoaded == 0) || (forceReload == 1)) // monitors are empty or force reload
            {
                console.log("ZMDataModel: Invoking HTTP get to load monitors");
                zmLog ( (forceReload==1)? "getMonitors:Force reloading all monitors" : "getMonitors:Loading all monitors");
                var apiurl = loginData.apiurl;
                var myurl = apiurl + "/monitors.json";
                $http.get(myurl /*,{timeout:15000}*/ )
                    .success(function (data) {
                        //console.log("HTTP success got " + JSON.stringify(data.monitors));
                        monitors = data.monitors;
                        console.log("promise resolved inside HTTP success");
                        monitorsLoaded = 1;
                        $ionicLoading.hide();
                        zmLog ("Monitor load was successful, loaded " + monitors.length + " monitors");

                        // FIXME: This really should not be here.
                        var i;

                        for ( i = 0; i< monitors.length; i++)
                        {
                            monitors[i].Monitor.listDisplay='show';
                           // monitors[i].Monitor.sortOrder=i;
                        }
                        d.resolve(monitors);
                    })
                    .error(function (err) {
                        console.log("HTTP Error " + err);
                        zmLog ("Monitor load failed " + JSON.stringify(err), "error");
                        // To keep it simple for now, I'm translating an error
                        // to imply no monitors could be loaded. FIXME: conver to proper error
                        monitors = [];
                        console.log("promise resolved inside HTTP fail");
                        displayBanner ('error', ['error retrieving monitor list', 'please try again']);
                        d.resolve(monitors);
                        $ionicLoading.hide();
                        monitorsLoaded = 0 ;
                    });
                return d.promise;

            } else // monitors are loaded
            {
                console.log("Returning pre-loaded list of " + monitors.length + " monitors");
                zmLog("Returning pre-loaded list of " + monitors.length + " monitors");
                d.resolve(monitors);
                $ionicLoading.hide();
                return d.promise;
            }

        },

        //-----------------------------------------------------------------------------
        //
        //-----------------------------------------------------------------------------
        setMonitors: function (mon) {
            console.log("ZMData setMonitors called with " + mon.length + " monitors");
            monitors = mon;
        },

        //-----------------------------------------------------------------------------
        // When I display events in the event controller, this is the first function I call
        // This returns the total number of pages
        // I then proceed to display pages in reverse order to display the latest events first
        // I also reverse sort them in ZMDataModel to sort by date
        // All this effort because the ZM APIs return events in sorted order, oldest first. Yeesh.
        //-----------------------------------------------------------------------------

        getEventsPages: function (monitorId,startTime, endTime) {
            console.log("********** INSIDE EVENTS PAGES ");
            var apiurl = loginData.apiurl;

            var myurl = apiurl + "/events/index";
            if (monitorId!=0)
                myurl = myurl + "/MonitorId:" + monitorId;
            if (startTime)
                myurl = myurl + "/StartTime >=:"+startTime;
            if (endTime)
                myurl = myurl + "/EndTime <=:"+endTime;
            myurl = myurl + ".json";
            console.log (">>>>>Constructed URL " + myurl);
            
            $ionicLoading.show({
                template: 'calculating events list size...',
                animation: 'fade-in',
                showBackdrop: true,
                duration: zm.loadingTimeout,
                maxWidth: 200,
                showDelay: 0
            });
            

            //var myurl = (monitorId == 0) ? apiurl + "/events.json?page=1" : apiurl + "/events/index/MonitorId:" + monitorId + ".json?page=1";
            var d = $q.defer();
            $http.get(myurl)
                .success(function (data) {
                    $ionicLoading.hide();
                    //console.log ("**** EVENTS PAGES I GOT "+JSON.stringify(data));
                    //console.log("**** PAGE COUNT IS " + data.pagination.pageCount);
                    d.resolve(data.pagination);
                    return d.promise;
                })
                .error(function (error) {
                    $ionicLoading.hide();
                    console.log("*** ERROR GETTING TOTAL PAGES ***");
                    zmLog ("Error retrieving page count of events " + JSON.stringify(error), "error");
                    displayBanner ('error', ['error retrieving event page count', 'please try again']);
                
                    d.reject(error);
                    return d.promise;
                });
            return d.promise;

        },

        //-----------------------------------------------------------------------------
        // This function returns events for  specific monitor or all monitors
        // You get here by tapping on events in the monitor screen or from
        // the menu events option
        // monitorId == 0 means all monitors (ZM starts from 1)
        //-----------------------------------------------------------------------------

        getEvents: function (monitorId, pageId, loadingStr, startTime, endTime) {

            console.log("ZMData getEvents called with ID=" + monitorId + "and Page=" + pageId);

            if (!loadingStr) {
                loadingStr = "loading events...";
            }
            //if (loadingStr) loa

            if (loadingStr != 'none') {
                $ionicLoading.show({
                    template: loadingStr,
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: 0,
                    duration: zm.loadingTimeout, //specifically for Android - http seems to get stuck at times
                });
            }

            var d = $q.defer();
            var myevents = [];
            var apiurl = loginData.apiurl;

           var myurl = apiurl + "/events/index";
            if (monitorId!=0)
                myurl = myurl + "/MonitorId:" + monitorId;
            if (startTime)
                myurl = myurl + "/StartTime >=:"+startTime;
            if (endTime)
                myurl = myurl + "/EndTime <=:"+endTime;
            myurl = myurl + ".json";


            if (pageId) {
                myurl = myurl + "?page=" + pageId;
            } else {
                console.log("**** PAGE WAS " + pageId);
            }
            
            // Simulated data
            
            // myurl = "https://api.myjson.com/bins/4jx44.json";
            
            console.log (">>>>>Constructed URL " + myurl);
            
            


            $http.get(myurl /*,{timeout:15000}*/ )
                .success(function (data) {
                    if (loadingStr != 'none') $ionicLoading.hide();
                    //myevents = data.events;
                    myevents = data.events.reverse();
                    if (monitorId == 0) {
                        oldevents = myevents;
                    }
                    //console.log (JSON.stringify(data));
                    console.log("DataModel Returning " + myevents.length + "events for page" + pageId);
                    d.resolve(myevents);
                    return d.promise;

                })
                .error(function (err) {
                    if (loadingStr != 'none') $ionicLoading.hide();
                   displayBanner ('error', ['error retrieving event list', 'please try again']);
                    console.log("HTTP Events error " + err);
                    zmLog("Error fetching events for page " + pageId + " Err: " + JSON.stringify(err), "error");
                    // I need to reject this as I have infinite scrolling
                    // implemented in EventCtrl.js --> and if it does not know
                    // it got an error going to the next page, it will get into
                    // an infinite loop as we are at the bottom of the list always

                    d.reject(myevents);

                    // FIXME: Check what pagination does to this logic
                    if (monitorId == 0) {
                        oldevents = [];
                    }
                    return d.promise;
                });
            return d.promise;
        },

        //-----------------------------------------------------------------------------
        //
        //-----------------------------------------------------------------------------
        getMontageSize: function () {
            return montageSize;
        },

        //-----------------------------------------------------------------------------
        //
        //-----------------------------------------------------------------------------
        setMontageSize: function (montage) {
            montageSize = montage;
        },



        //-----------------------------------------------------------------------------
        //
        //-----------------------------------------------------------------------------
        getMonitorsLoaded: function () {
            console.log("**** Inside promise function ");
            var deferred = $q.defer();
            if (monitorsLoaded != 0) {
                deferred.resolve(monitorsLoaded);
            }

            return deferred.promise;
        },

        //-----------------------------------------------------------------------------
        //
        //-----------------------------------------------------------------------------
        setMonitorsLoaded: function (loaded) {
            console.log("ZMData.setMonitorsLoaded=" + loaded);
            monitorsLoaded = loaded;
        },

        //-----------------------------------------------------------------------------
        // returns the next monitor ID in the list
        // used for swipe next
        //-----------------------------------------------------------------------------
        getNextMonitor: function(monitorId, direction)
        {
             var id = parseInt(monitorId);
             var foundIndex = -1;
             for (var i = 0; i < monitors.length; i++) {
                 if (parseInt(monitors[i].Monitor.Id) == id)
                 {
                    foundIndex = i;
                     break;
                 }
             }
            if (foundIndex != -1)
            {
                foundIndex = foundIndex + direction;
                // wrap around if needed
                if (foundIndex < 0) foundIndex = monitors.length - 1;
                if (foundIndex >= monitors.length) foundIndex = 0;
                return (monitors[foundIndex].Monitor.Id);
            }
            else
            {
                zmLog("getNextMonitor could not find monitor "+monitorId);
                return (monitorId);
            }


        },


        //-----------------------------------------------------------------------------
        // Given a monitor Id it returns the monitor name
        // FIXME: Can I do a better job with associative arrays?
        //-----------------------------------------------------------------------------
        getMonitorName: function (id) {
            var idnum = parseInt(id);
            for (var i = 0; i < monitors.length; i++) {
                if (parseInt(monitors[i].Monitor.Id) == idnum) {
                    // console.log ("Matched, exiting getMonitorname");
                    return monitors[i].Monitor.Name;
                }

            }
            return "(Unknown)";
        },

    };
}]);
