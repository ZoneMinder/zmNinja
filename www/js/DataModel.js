/* jshint -W041 */


/* jslint browser: true*/
/* global cordova,StatusBar,angular,console, URI, moment*/

// This is my central data respository and common functions
// that many other controllers use
// It's grown over time. I guess I may have to split this into multiple services in the future

angular.module('zmApp.controllers')

.service('ZMDataModel', ['$http', '$q', '$ionicLoading', '$ionicBackdrop', '$fileLogger', 'zm', '$rootScope', '$ionicContentBanner', '$timeout', '$cordovaPinDialog', '$ionicPopup', '$localstorage', '$state', '$ionicNativeTransitions', '$translate',
 function
    ($http, $q, $ionicLoading, $ionicBackdrop, $fileLogger,
        zm, $rootScope, $ionicContentBanner, $timeout, $cordovaPinDialog,
        $ionicPopup, $localstorage, $state, $ionicNativeTransitions, $translate) {

        var zmAppVersion = "unknown";
        var isBackground = false;
        var justResumed = false;
        var monitorsLoaded = 0;
        //var montageSize = 3;
        var monitors = [];
        var multiservers = [];
        var oldevents = [];

        var languages = [
            {
                text: 'English',
                value: 'en'
            },
            {
                text: 'Italian',
                value: 'it'
            }
        ];

        var serverGroupList = {};

        var loginData = {
            'serverName': '',
            'username': '',
            'password': '',
            'fallbackConfiguration': '',
            'url': '', // This is the ZM portal path
            'apiurl': '', // This is the API path
            'eventServer': '', //experimental Event server address
            'maxMontage': "100", //total # of monitors to display in montage
            'streamingurl': "",
            'maxFPS': "3", // image streaming FPS
            'montageQuality': "50", // montage streaming quality in %
            'singleImageQuality': "100", // single streaming quality in %
            'montageHistoryQuality': "50",
            'useSSL': false, // "1" if HTTPS
            'keepAwake': true, // don't dim/dim during live view
            'isUseAuth': true, // true if user wants ZM auth
            'isUseEventServer': false, // true if you configure the websocket event server
            'disablePush': false, // true if only websocket mode is desired
            'eventServerMonitors': '', // list of monitors to notify from ES
            'eventServerInterval': '', // list of intervals for all monitors
            'refreshSec': '2', // timer value for frame change in sec 
            'enableLogs': true,
            'enableDebug': false, // if enabled with log messages with "debug"
            'usePin': false,
            'pinCode': '',
            'canSwipeMonitors': true,
            'persistMontageOrder': false,
            'onTapScreen': "",
            'enableh264': true,
            'gapless': false,
            'montageOrder': '',
            'montageHiddenOrder': '',
            'montageArraySize': '0',

            'graphSize': 2000,
            'enableAlarmCount': true,
            'minAlarmCount': 1,
            'montageSize': '3',
            'useNphZms': true,
            'useNphZmsForEvents': true,
            'packMontage': false,
            'exitOnSleep': false,
            'forceNetworkStop': false,
            'defaultPushSound': false,
            'enableBlog': true,
            'use24hr': false,
            'packeryPositions': '',
            'packerySizes': '',
            'timelineModalGraphType': 'all',
            'resumeDelay': 300,
            'language': 'en',
            'reachability': true,
            'forceImageModePath': false,



        };

        var defaultLoginData = angular.copy(loginData);



        var configParams = {
            'ZM_EVENT_IMAGE_DIGITS': '-1',
            'ZM_PATH_ZMS': ''
        };

        // credit: http://stackoverflow.com/questions/4994201/is-object-empty
        function isEmpty(obj) {

            // null and undefined are "empty"
            if (obj == null) return true;

            // Assume if it has a length property with a non-zero value
            // that that property is correct.
            if (obj.length > 0) return false;
            if (obj.length === 0) return true;

            // Otherwise, does it have any properties of its own?
            // Note that this doesn't handle
            // toString and valueOf enumeration bugs in IE < 9
            for (var key in obj) {
                if (hasOwnProperty.call(obj, key)) return false;
            }

            return true;
        }

        //--------------------------------------------------------------------------
        // uses fileLogger  to write logs to file for later investigation
        //--------------------------------------------------------------------------
        function zmLog(val, logtype) {
            if (loginData.enableLogs)
                $fileLogger.log(logtype, val);
        }


        function setLogin(newLogin) {
            loginData = angular.copy(newLogin);
            serverGroupList[loginData.serverName] = angular.copy(loginData);
            $localstorage.setObject("serverGroupList", serverGroupList);
            $localstorage.set("defaultServerName", loginData.serverName);
            // console.log ("SAVING " + loginData.serverName);
            // console.log ("DATA IS " + JSON.stringify(loginData));

        }

        // separate out a debug so we don't do this if comparison for normal logs
        function zmDebug(val) {
            if (loginData.enableDebug && loginData.enableLogs)
                $fileLogger.debug(val);
        }

        //credit: https://gist.github.com/alexey-bass/1115557
        function versionCompare(left, right) {
            if (typeof left + typeof right != 'stringstring')
                return false;

            var a = left.split('.');
            var b = right.split('.');
            var i = 0;
            var len = Math.max(a.length, b.length);

            for (; i < len; i++) {
                if ((a[i] && !b[i] && parseInt(a[i]) > 0) || (parseInt(a[i]) > parseInt(b[i]))) {
                    return 1;
                } else if ((b[i] && !a[i] && parseInt(b[i]) > 0) || (parseInt(a[i]) < parseInt(b[i]))) {
                    return -1;
                }
            }

            return 0;
        }


        //--------------------------------------------------------------------------
        // Banner display of messages
        //--------------------------------------------------------------------------
        function displayBanner(mytype, mytext, myinterval, mytimer) {

            var contentBannerInstance =
                $ionicContentBanner.show({
                    text: mytext || 'no text',
                    interval: myinterval || 2000,
                    //autoClose: mytimer || 6000,
                    type: mytype || 'info',
                    transition: 'vertical',
                    //cancelOnStateChange: false
                });

            $timeout(function () {
                contentBannerInstance();
            }, mytimer || 6000);
        }


        return {

            //-------------------------------------------------------------
            // used by various controllers to log messages to file
            //-------------------------------------------------------------

            isEmpty: function (obj)
            {
                return isEmpty(obj);
            },

            zmLog: function (val, type) {
                var logtype = 'info';
                if (type != undefined)
                    logtype = type;
                zmLog(val, logtype);

            },

            zmDebug: function (val) {

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


            zmStateGo: function (state, p1, p2) {
                if ($rootScope.platformOS == 'desktop')
                    $state.go(state, p1, p2);
                else
                    $ionicNativeTransitions.stateGo(state, p1, p2);
            },

            // used when an empty server profile is created
            getDefaultLoginObject: function () {
                return angular.copy(defaultLoginData);
            },


            getReachableConfig: function (skipFirst) {
                var d = $q.defer();
                if (loginData.serverName == "") {
                    zmLog("Reachable: No server name configured, likely first use?");
                    d.reject("No servers");
                    return d.promise;
                }

                var chainURLs = [];
                var savedLoginData = angular.copy(loginData);

                //zmLog ("Making sure " + loginData.serverName + " is reachable...");
                var tLd = serverGroupList[loginData.serverName];
                if (skipFirst && tLd.fallbackConfiguration) {
                    tLd = serverGroupList[tLd.fallbackConfiguration];
                    if (!tLd) {
                        d.reject("No available severs");
                        loginData = savedLoginData;
                        return d.promise;

                    }
                }



                var keepBuilding = true;
                while (keepBuilding == true && tLd) {
                    if (arrayObjectIndexOf(chainURLs, tLd.url + "/index.php", "url") == -1 && tLd.url !== undefined && tLd.url != '') // no loop
                    {
                        zmLog("Adding to chain stack: " + tLd.serverName + ">" + tLd.url);
                        chainURLs.push({
                            url: tLd.url + "/index.php",
                            server: tLd.serverName
                        });
                        zmLog("Fallback of " + tLd.serverName + " is " + tLd.fallbackConfiguration);
                        if (tLd.fallbackConfiguration) {
                            tLd = serverGroupList[tLd.fallbackConfiguration];
                            if (tLd === undefined) {
                                // This can happen if the fallback profile was deleted
                                zmLog("Looks like a server object was deleted, but is still in fallback");
                                keepBuilding = false;
                            }
                        } else {
                            zmLog("reached end of chain loop");
                        }
                    } else {
                        zmLog("detected loop when " + tLd.serverName + " fallsback to " + tLd.fallbackConfiguration);
                        keepBuilding = false;
                    }
                }



                //contactedServers.push(loginData.serverName);
                findFirstReachableUrl(chainURLs).then(function (firstReachableUrl) {
                    d.resolve(firstReachableUrl);
                    // also make sure loginData points to this now

                    loginData = angular.copy(serverGroupList[firstReachableUrl.server]);

                    setLogin(loginData);
                    //$localstorage.set("defaultServerName",firstReachableUrl.server);

                    zmLog("Based on reachability, first serverName will be " + firstReachableUrl.server);
                    console.log("set login Data to " + JSON.stringify(loginData));

                    return d.promise;
                    // OK: do something with firstReachableUrl
                }, function () {
                    d.reject("No servers reachable");
                    loginData = savedLoginData;
                    return d.promise;
                    // KO: no url could be reached
                });


                function arrayObjectIndexOf(myArray, searchTerm, property) {
                    for (var i = 0, len = myArray.length; i < len; i++) {
                        if (myArray[i][property] === searchTerm)
                            return i;
                    }
                    return -1;
                }

                function findFirstReachableUrl(urls) {
                    if (urls.length > 0 && $rootScope.userCancelledAuth != true) {
                        $ionicLoading.show({
                            template: $translate.instant('kTrying') + ' ' + urls[0].server
                        });
                        zmLog("Reachability test.." + urls[0].url);

                        if (loginData.reachability) {

                            //console.log ("************* AUGH");
                            return $http.get(urls[0].url).then(function () {
                                zmLog("Success: reachability on " + urls[0].url);
                                $ionicLoading.hide();
                                return urls[0];
                            }, function (err) {
                                zmLog("Failed reachability on " + urls[0].url + " with error " + JSON.stringify(err));
                                return findFirstReachableUrl(urls.slice(1));
                            });
                        } else {
                            zmLog("Reachability is disabled in config, faking this test and returning success on " + urls[0]);
                            return urls[0];
                        }
                    } else {
                        $ionicLoading.hide();
                        return $q.reject("No reachable URL");

                    }


                }

                return d.promise;


            },

            init: function () {
                // console.log("****** DATAMODEL INIT SERVICE CALLED ********");

                zmLog("ZMData init: checking for stored variables & setting up log file");

                serverGroupList = $localstorage.getObject("serverGroupList");

                var demoServer = "{\"serverName\":\"zmNinjaDemo\",\"username\":\"zmninja\",\"password\":\"zmNinja$xc129\",\"url\":\"https://demo.zoneminder.com/zm\",\"apiurl\":\"https://demo.zoneminder.com/zm/api\",\"eventServer\":\"\",\"maxMontage\":\"40\",\"streamingurl\":\"https://demo.zoneminder.com/cgi-bin-zm\",\"maxFPS\":\"3\",\"montageQuality\":\"50\",\"singleImageQuality\":\"100\",\"montageHistoryQuality\":\"50\",\"useSSL\":true,\"keepAwake\":true,\"isUseAuth\":\"1\",\"isUseEventServer\":false,\"disablePush\":false,\"eventServerMonitors\":\"\",\"eventServerInterval\":\"\",\"refreshSec\":\"2\",\"enableDebug\":false,\"usePin\":false,\"pinCode\":\"\",\"canSwipeMonitors\":true,\"persistMontageOrder\":false,\"onTapScreen\":\"Events\",\"enableh264\":true,\"gapless\":false,\"montageOrder\":\"\",\"montageHiddenOrder\":\"\",\"montageArraySize\":\"0\",\"graphSize\":2000,\"enableAlarmCount\":true,\"montageSize\":\"3\",\"useNphZms\":true,\"useNphZmsForEvents\":true,\"packMontage\":false,\"exitOnSleep\":false,\"forceNetworkStop\":false,\"defaultPushSound\":false,\"enableBlog\":true,\"use24hr\":false, \"packeryPositions\":\"\"}";
                var demoS = JSON.parse(demoServer);
                console.log("JSON parsed demo" + JSON.stringify(demoS));

                var isFoundDemo = false;
                var as = Object.keys(serverGroupList);
                for (var x = 0; x < as.length; x++) {
                    if (as[x] == 'zmNinjaDemo')
                        isFoundDemo = true;
                    //console.log ("************ FOUND SERVER NAME " + as[x]);
                    // if serverGroupList[x]
                }

                // Don't add the demo if there is another server
                // because this means the user deleted it 

                if (!isFoundDemo && as.length == 0) {
                    zmDebug("Pushing demo server config to server groups");
                    //serverGroupList.push(demoS);
                    serverGroupList[demoS.serverName] = angular.copy(demoS);
                }

                var sname =
                    $localstorage.get("defaultServerName");
                //console.log ("!!!!!!!!!!!!!!!!!!default server name is  "  + sname);

                var loadedData = serverGroupList[sname];
                if (!isEmpty(loadedData)) {
                    loginData = loadedData;

                    // old version hacks for new variables

                    if (typeof loginData.enableAlarmCount === 'undefined') {
                        zmDebug("enableAlarmCount does not exist, setting to true");
                        loginData.enableAlarmCount = true;
                    }
                    
                    if (typeof loginData.onTapScreen == 'undefined')
                    {
                        loginData.onTapScreen = $translate.instant('kTapMontage');
                    }
                    
                    if (loginData.onTapScreen != $translate.instant('kTapMontage') &&
                        loginData.onTapScreen != $translate.instant('kTapEvents') &&
                        loginData.onTapScreen != $translate.instant('kTapLiveMonitor'))
                    {
                        zmLog ("Invalid onTap setting found, resetting");
                        loginData.onTapScreen = $translate.instant('kMontage');
                    }
                    

                    if (typeof loginData.minAlarmCount === 'undefined') {
                        zmDebug("minAlarmCount does not exist, setting to true");
                        loginData.minAlarmCount = 1;
                    }


                    if (typeof loginData.montageSize == 'undefined') {
                        zmDebug("montageSize does not exist, setting to 2 (2 per col)");
                        loginData.montageSize = 2;
                    }


                    if (typeof loginData.useNphZms == 'undefined') {
                        zmDebug("useNphZms does not exist. Setting to true");
                        loginData.useNphZms = true;
                    }



                    if (typeof loginData.useNphZmsForEvents == 'undefined') {
                        zmDebug("useNphZmsForEvents does not exist. Setting to true");
                        loginData.useNphZmsForEvents = true;
                    }

                    if (typeof loginData.forceImageModePath == 'undefined') {
                        zmDebug("forceImageModePath does not exist. Setting to false");
                        loginData.forceImageModePath = false;
                    }

                    if (typeof loginData.reachability == 'undefined') {
                        zmDebug("reachability does not exist. Setting to true");
                        loginData.reachability = true;
                    }
                    // force it - this may not be the problem
                    loginData.reachability = true;

                    // and now, force enable it
                    loginData.useNphZms = true;
                    loginData.useNphZmsForEvents = true;

                    if (typeof loginData.packMontage == 'undefined') {
                        zmDebug("packMontage does not exist. Setting to false");
                        loginData.packMontage = false;
                    }

                    if (typeof loginData.forceNetworkStop == 'undefined') {
                        zmDebug("forceNetwork does not exist. Setting to false");
                        loginData.forceNetworkStop = false;
                    }

                    if (typeof loginData.enableLogs == 'undefined') {
                        zmDebug("enableLogs does not exist. Setting to true");
                        loginData.enableLogs = true;
                    }



                    if (typeof loginData.defaultPushSound == 'undefined') {
                        zmDebug("defaultPushSound does not exist. Setting to false");
                        loginData.defaultPushSound = false;
                    }



                    if (typeof loginData.exitOnSleep == 'undefined') {
                        zmDebug("exitOnSleep does not exist. Setting to false");
                        loginData.exitOnSleep = false;
                    }

                    if (typeof loginData.enableBlog == 'undefined') {
                        zmDebug("enableBlog does not exist. Setting to true");
                        loginData.enableBlog = true;

                    }

                    if (typeof loginData.packeryPositions == 'undefined') {
                        zmDebug("packeryPositions does not exist. Setting to empty");
                        loginData.packeryPositions = "";

                    }


                    if (typeof loginData.packerySizes == 'undefined') {
                        zmDebug("packerySizes does not exist. Setting to empty");
                        loginData.packerySizes = "";

                    }

                    if (typeof loginData.use24hr == 'undefined') {
                        zmDebug("use24hr does not exist. Setting to false");
                        loginData.use24hr = false;

                    }

                    if (typeof timelineModalGraphType == 'undefined') {
                        zmDebug("timeline graph type not set. Setting to all");
                        loginData.timelineModalGraphType = $translate.instant('kGraphAll');
                        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + loginData.timelineModalGraphType);
                    }

                    if (typeof loginData.resumeDelay == 'undefined') {
                        zmDebug("resumeDelay does not exist. Setting to 0");
                        loginData.resumeDelay = "0";

                    }



                    if (typeof loginData.montageHistoryQuality == 'undefined') {
                        zmDebug("montageHistoryQuality does not exist. Setting to 50");
                        loginData.montageHistoryQuality = "50";

                    }

                    zmLog("DataModel init recovered this loginData as " + JSON.stringify(loginData));
                } else {
                    zmLog("defaultServer configuration NOT found. Keeping login at defaults");
                }


                monitorsLoaded = 0;
                //console.log("Getting out of ZMDataModel init");
                $rootScope.showBlog = loginData.enableBlog;
                zmDebug("loginData structure values: " + JSON.stringify(loginData));

            },

            isForceNetworkStop: function () {
                return loginData.forceNetworkStop;
            },

            setJustResumed: function (val) {
                justResumed = true;
            },

            stopNetwork: function (str) {
                var s = "";
                if (str) s = str + ":";
                if (justResumed) {
                    // we don't call stop as we did stop on pause
                    zmLog(s + " Not calling window stop as we just resumed");
                    justResumed = false;
                } else {
                    zmLog(s + " Calling window.stop()");
                    window.stop();
                }
            },

            isLoggedIn: function () {

                if ((loginData.username != "" && loginData.password != "" && loginData.url != "" &&
                        loginData.apiurl != "") || (loginData.isUseAuth != '1')) {
                    return 1;
                } else {


                    return 0;

                }
            },

            getLanguages: function () {
                return languages;
            },

            setDefaultLanguage: function (l, permanent) {

                if (!l) l = 'en';
                var d = $q.defer();
                if (permanent)
                    window.localStorage.setItem("defaultLang", l);

                $translate.use(l).then(function (data) {
                    zmLog("Device Language is:" + data);
                    moment.locale(data);
                    $translate.fallbackLanguage('en');
                    d.resolve(data);
                    return d.promise;
                }, function (error) {
                    zmLog("Device Language error: " + error);
                    $translate.use('en');
                    moment.locale('en');
                    d.resolve('en');
                    return d.promise;
                });
                return d.promise;
            },

            getDefaultLanguage: function () {
                return window.localStorage.getItem("defaultLang");

            },


            getLogin: function () {


                return angular.copy(loginData);
            },

            getServerGroups: function () {
                return angular.copy(serverGroupList);
            },

            setServerGroups: function (sg) {
                serverGroupList = angular.copy(sg);
            },

            getKeepAwake: function () {
                return (loginData.keepAwake == '1') ? true : false;
            },

            setAppVersion: function (ver) {
                zmAppVersion = ver;
            },

            getAppVersion: function () {
                return (zmAppVersion);
            },

            setBackground: function (val) {
                isBackground = val;
            },

            isBackground: function () {
                return isBackground;
            },

            isFirstUse: function () {
                return ((window.localStorage.getItem("isFirstUse") == undefined) ? true : false);

            },

            versionCompare: function (l, r) {
                return versionCompare(l, r);
            },

            //-----------------------------------------------------------------
            // Allow the option to reset first use if I need it in future
            //-----------------------------------------------------------------
            setFirstUse: function (val) {
                window.localStorage.setItem("isFirstUse", val ? "1" : "0");

            },

            getTimeFormat: function () {
                return (loginData.use24hr ? "HH:mm" : "hh:mm a");
            },

            getTimeFormatSec: function () {
                return (loginData.use24hr ? "HH:mm:ss" : "hh:mm:ss a");
            },

            //------------------------------------------------------------------
            // switches screen to 'always on' or 'auto'
            //------------------------------------------------------------------
            setAwake: function (val) {


                //console.log ("**** setAwake called with:" + val);
                // zmLog("Switching screen always on to " + val);
                if (val) {

                    if (window.cordova != undefined) {
                        window.plugins.insomnia.keepAwake();
                    } else {
                        //console.log ("Skipping insomnia, cordova does not exist");
                    }
                } else {
                    if (window.cordova != undefined) {
                        window.plugins.insomnia.allowSleepAgain();
                    } else {
                        //console.log ("Skipping insomnia, cordova does not exist");
                    }


                }

            },

            //--------------------------------------------------------------------------
            // writes all params to local storage. FIXME: Move all of this into a JSON 
            // object
            //--------------------------------------------------------------------------
            setLogin: function (newLogin) {

                setLogin(newLogin);
                $rootScope.showBlog = newLogin.enableBlog;

            },

            //-------------------------------------------------------
            // returns API version or none 
            //-------------------------------------------------------
            getAPIversion: function () {
                zmDebug("getAPIversion called");
                var d = $q.defer();
                var apiurl = loginData.apiurl + '/host/getVersion.json';
                $http.get(apiurl)
                    .then(function (success) {
                            if (success.data.version) {
                                d.resolve(success.data.version);
                            } else {
                                d.resolve("0.0.0");
                            }
                            return (d.promise);

                        },
                        function (error) {
                            zmDebug("getAPIversion error handler " + JSON.stringify(error));
                            d.resolve("0.0.0");
                            return (d.promise);
                        });
                return (d.promise);


            },

            displayBanner: function (mytype, mytext, myinterval, mytimer) {
                displayBanner(mytype, mytext, myinterval, mytimer);
            },

            isReCaptcha: function () {
                var d = $q.defer();

                var myurl = loginData.url;
                zmLog("Checking if reCaptcha is enabled in ZM...");
                $http.get(myurl)
                    .then(function (success) {
                        if (success.data.search("g-recaptcha") != -1) {
                            // recaptcha enable. zmNinja won't work
                            zmLog("ZM has recaptcha enabled", "error");
                            displayBanner('error', ['Recaptcha must be disabled in Zoneminder', $rootScope.appName + ' will not work with recaptcha'], "", 8000);
                            d.resolve(true);
                            return (d.promise);


                        } else {
                            d.resolve(false);
                            zmLog("ZM has recaptcha disabled - good");
                            return (d.promise);
                        }
                    });
                return (d.promise);
            },

            //-----------------------------------------------------------------------------
            // Grabs the computed auth key for streaming
            // FIXME: Currently a hack - does a screen parse - convert to API based support
            //-----------------------------------------------------------------------------

            // need a mid as restricted users won't be able to get
            // auth with just &watch
            getAuthKey: function (mid, ck) {
                var d = $q.defer();

                if (!mid) {
                    zmLog("Deferring auth key, as monitorId unknown");
                    d.resolve("");
                    return (d.promise);
                }

                // Skipping monitor number as I only need an auth key
                // so no need to generate an image
                var myurl = loginData.url + "/index.php?view=watch&mid=" + mid + "&connkey=" + ck;
                zmDebug("DataModel: Getting auth from " + myurl + " with mid=" + mid);
                $http.get(myurl)
                    .then(function (success) {
                            // console.log ("**** RESULT IS " + JSON.stringify(success));
                            // Look for auth=
                            var auth = success.data.match("auth=(.*?)&");
                            if (auth && (auth[1] != null)) {
                                zmLog("DataModel: Extracted a stream authentication key of: " + auth[1]);
                                d.resolve("&auth=" + auth[1]);
                            } else {
                                zmLog("DataModel: Did not find a stream auth key, looking for user=");
                                auth = success.data.match("user=(.*?)&");
                                if (auth && (auth[1] != null)) {
                                    zmLog("DataModel: Found simple stream auth mode (user=)");
                                    d.resolve("&user=" + loginData.username + "&pass=" + loginData.password);
                                } else {
                                    zmLog("Data Model: Did not find any  stream mode of auth");
                                    d.resolve("");
                                }
                                return (d.promise);
                            }

                        },
                        function (error) {
                            zmLog("DataModel: Error resolving auth key " + JSON.stringify(error));
                            d.resolve("");
                            return (d.promise);
                        });
                return (d.promise);

            },

            //-----------------------------------------------------------------------------
            // This function returns the numdigits for padding capture images
            //-----------------------------------------------------------------------------

            getKeyConfigParams: function (forceReload) {

                var d = $q.defer();

                if (forceReload == 1 || configParams.ZM_EVENT_IMAGE_DIGITS == '-1') {
                    var apiurl = loginData.apiurl;
                    var myurl = apiurl + '/configs/viewByName/ZM_EVENT_IMAGE_DIGITS.json';
                    zmDebug("Config URL for digits is:" + myurl);
                    $http.get(myurl)
                        .success(function (data) {
                            zmLog("ZM_EVENT_IMAGE_DIGITS is " + data.config.Value);
                            configParams.ZM_EVENT_IMAGE_DIGITS = data.config.Value;
                            d.resolve(configParams.ZM_EVENT_IMAGE_DIGITS);
                            return (d.promise);

                        })
                        .error(function (err) {
                            zmLog("Error retrieving ZM_EVENT_IMAGE_DIGITS" + JSON.stringify(err), "error");
                            zmLog("Taking a guess, setting ZM_EVENT_IMAGE_DIGITS to 5");
                            // FIXME: take a plunge and keep it at 5?
                            configParams.ZM_EVENT_IMAGE_DIGITS = 5;
                            d.resolve(configParams.ZM_EVENT_IMAGE_DIGITS);
                            return (d.promise);
                        });
                } else {
                    zmLog("ZM_EVENT_IMAGE_DIGITS is already configured for " +
                        configParams.ZM_EVENT_IMAGE_DIGITS);
                    d.resolve(configParams.ZM_EVENT_IMAGE_DIGITS);
                }
                return (d.promise);

            },

            //--------------------------------------------------------------------------
            // Useful to know what ZMS is using as its cgi-bin. If people misconfigure
            // the setting in the app, they can check their logs
            //--------------------------------------------------------------------------
            getPathZms: function () {
                var d = $q.defer();
                var apiurl = loginData.apiurl;
                var myurl = apiurl + '/configs/viewByName/ZM_PATH_ZMS.json';
                zmDebug("Config URL for ZMS PATH is:" + myurl);
                $http.get(myurl)
                    .success(function (data) {
                        configParams.ZM_PATH_ZMS = data.config.Value;
                        d.resolve(configParams.ZM_PATH_ZMS);
                        return (d.promise);
                    })
                    .error(function (error) {
                        zmLog("Error retrieving ZM_PATH_ZMS: " + JSON.stringify(error));
                        d.reject("");
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
            applyMontageMonitorPrefs: function (mon, doOrder) {
                var montageOrder = []; // This array will keep the ordering in montage view
                var hiddenOrder = []; // 1 = hide, 0 = don't hide
                var monitors = mon;
                var orderedMonitors = [];


                // First let's check if the user already has a saved monitor order
                var i;
                if (loginData.montageOrder == '') {
                    //if (window.localStorage.getItem("montageOrder") == undefined) {

                    for (i = 0; i < monitors.length; i++) {
                        montageOrder[i] = i; // order to show is order ZM returns
                        hiddenOrder[i] = 0; // don't hide them
                    }
                    //console.log("Order string is " + montageOrder.toString());
                    //console.log("Hiddent string is " + hiddenOrder.toString());

                    zmLog("Stored montage order does not exist");
                } else
                // there is a saved order
                {
                    var myorder = loginData.montageOrder;
                    var myhiddenorder = loginData.montageHiddenOrder;


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

                        loginData.montageOrder = montageOrder.toString();
                        loginData.montageHiddenOrder = hiddenOrder.toString();
                        setLogin(loginData);
                        //window.localStorage.setItem("montageOrder",
                        //   montageOrder.toString());
                        //  window.localStorage.setItem("montageHiddenOrder",
                        //     hiddenOrder.toString());


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
                    } else {
                        if (monitors[i] !== undefined)
                            monitors[i].Monitor.listDisplay = 'show';
                    }
                }


                if (doOrder) {
                    for (i = 0; i < montageOrder.length; i++) {
                        for (var j = 0; j < montageOrder.length; j++) {
                            if (montageOrder[j] == i) {
                                // if 2 is passed, hidden elements are not recorded
                                if (doOrder == 2) {
                                    if (monitors[j].Monitor.listDisplay != 'noshow')
                                        orderedMonitors.push(monitors[j]);
                                } else
                                    orderedMonitors.push(monitors[j]);
                            }
                        }
                    }
                } else {
                    orderedMonitors = monitors;
                }



                return ([orderedMonitors, montageOrder, hiddenOrder]);

            },

            //-----------------------------------------------------------------------------
            // This function returns a list of monitors
            // if forceReload == 1 then it will force an HTTP API request to get a list of monitors
            // if 0. then it will return back the previously loaded monitor list if one exists, else
            // will issue a new HTTP API to get it

            // I've wrapped this function in my own promise even though http returns a promise.
            //-----------------------------------------------------------------------------

            getMonitors: function (forceReload) {
                //console.log("** Inside ZMData getMonitors with forceReload=" + forceReload);



                $ionicLoading.show({
                    template: $translate.instant('kLoadingMonitors'),
                    animation: 'fade-in',
                    showBackdrop: true,
                    duration: zm.loadingTimeout,
                    maxWidth: 200,
                    showDelay: 0
                });




                var d = $q.defer();
                if ((monitorsLoaded == 0) || (forceReload == 1)) // monitors are empty or force reload
                {
                    //console.log("ZMDataModel: Invoking HTTP get to load monitors");
                    zmLog((forceReload == 1) ? "getMonitors:Force reloading all monitors" : "getMonitors:Loading all monitors");
                    var apiurl = loginData.apiurl;
                    var myurl = apiurl + "/monitors.json";
                    //console.log ("API:"+myurl);
                    $http.get(myurl /*,{timeout:15000}*/ )
                        .success(function (data) {
                            //console.log("HTTP success got " + JSON.stringify(data.monitors));
                            monitors = data.monitors;
                            monitors.sort(function (a, b) {
                                return parseInt(a.Monitor.Sequence) - parseInt(b.Monitor.Sequence);
                            });
                            //console.log("promise resolved inside HTTP success");
                            monitorsLoaded = 1;
                            zmDebug("Now trying to get multi-server data, if present");
                            $http.get(apiurl + "/servers.json")
                                .success(function (data) {
                                    // We found a server list API, so lets make sure
                                    // we get the hostname as it will be needed for playback
                                    zmLog("multi server list loaded" + JSON.stringify(data));
                                    multiservers = data.servers;

                                    for (var i = 0; i < monitors.length; i++) {

                                        monitors[i].Monitor.listDisplay = 'show';
                                        monitors[i].Monitor.isAlarmed = false;
                                        monitors[i].Monitor.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();

                                        var serverFound = false;
                                        for (var j = 0; j < multiservers.length; j++) {
                                            //console.log ("Comparing " + multiservers[j].Server.Id + " AND " + monitors[i].Monitor.ServerId);
                                            if (multiservers[j].Server.Id == monitors[i].Monitor.ServerId) {
                                                //console.log ("Found match");
                                                serverFound = true;
                                                break;
                                            }

                                        }
                                        if (serverFound) {

                                            zmDebug("Monitor " + monitors[i].Monitor.Id + " has a recording server hostname of " + multiservers[j].Server.Hostname);

                                            // Now here is the logic, I need to retrieve serverhostname,
                                            // and slap on the host protocol and path. Meh.

                                            var p = URI.parse(loginData.streamingurl);
                                            var s = URI.parse(multiservers[j].Server.Hostname);

                                            zmDebug("recording server parsed is " + JSON.stringify(s));
                                            zmDebug("portal  parsed is " + JSON.stringify(p));

                                            var st = "";
                                            var baseurl = "";

                                            st += (s.scheme ? s.scheme : p.scheme) + "://"; // server scheme overrides 


                                            // if server doesn't have a protocol, what we want is in path
                                            if (!s.host) {
                                                s.host = s.path;
                                                s.path = undefined;
                                            }

                                            st += s.host;


                                            if (p.port || s.port) {
                                                st += (s.port ? ":" + s.port : ":" + p.port);

                                            }

                                            baseurl = st;

                                            st += (s.path ? s.path : p.path);
                                            monitors[i].Monitor.streamingURL = st;
                                            monitors[i].Monitor.baseURL = baseurl;
                                            // starting 1.30 we have fid=xxx mode to return images
                                            monitors[i].Monitor.imageMode = (versionCompare($rootScope.apiVersion, "1.30") == -1) ? "path" : "fid";
                                            zmDebug("API " + $rootScope.apiVersion + ": Monitor " + monitors[i].Monitor.Id + " will use " + monitors[i].Monitor.imageMode + " for direct image access");

                                            //zmDebug ("Streaming URL for Monitor " + monitors[i].Monitor.Id  + " is " + monitors[i].Monitor.streamingURL );
                                            //zmDebug ("Base URL for Monitor " + monitors[i].Monitor.Id  + " is " + monitors[i].Monitor.baseURL );


                                        } else {
                                            monitors[i].Monitor.listDisplay = 'show';
                                            monitors[i].Monitor.isAlarmed = false;
                                            monitors[i].Monitor.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
                                            monitors[i].Monitor.streamingURL = loginData.streamingurl;
                                            monitors[i].Monitor.baseURL = loginData.url;
                                            monitors[i].Monitor.imageMode = (versionCompare($rootScope.apiVersion, "1.30") == -1) ? "path" : "fid";


                                            // but now check if forced path 
                                            if (loginData.forceImageModePath) {
                                                zmDebug("Overriding, setting image mode to true as you have requested force enable");
                                                monitors[i].Monitor.imageMode = 'path';
                                            }

                                            zmDebug("API " + $rootScope.apiVersion + ": Monitor " + monitors[i].Monitor.Id + " will use " + monitors[i].Monitor.imageMode + " for direct image access");
                                        }
                                    }
                                    d.resolve(monitors);
                                })
                                .error(function (err) {
                                    zmLog("multi server list loading error");
                                    multiservers = [];

                                    for (var i = 0; i < monitors.length; i++) {
                                        monitors[i].Monitor.listDisplay = 'show';
                                        monitors[i].Monitor.isAlarmed = false;
                                        monitors[i].Monitor.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
                                        monitors[i].Monitor.streamingURL = loginData.streamingurl;
                                        monitors[i].Monitor.baseURL = loginData.url;
                                        monitors[i].Monitor.imageMode = (versionCompare($rootScope.apiVersion, "1.30") == -1) ? "path" : "fid";
                                        zmDebug("API " + $rootScope.apiVersion + ": Monitor " + monitors[i].Monitor.Id + " will use " + monitors[i].Monitor.imageMode + " for direct image access");




                                    }
                                    d.resolve(monitors);

                                });

                            $ionicLoading.hide();
                            zmLog("Monitor load was successful, loaded " + monitors.length + " monitors");



                        })
                        .error(function (err) {
                            //console.log("HTTP Error " + err);
                            zmLog("Monitor load failed " + JSON.stringify(err), "error");
                            // To keep it simple for now, I'm translating an error
                            // to imply no monitors could be loaded. FIXME: conver to proper error
                            monitors = [];
                            //console.log("promise resolved inside HTTP fail");
                            displayBanner('error', ['error retrieving monitor list', 'please try again']);
                            d.resolve(monitors);
                            $ionicLoading.hide();
                            monitorsLoaded = 0;
                        });
                    return d.promise;

                } else // monitors are loaded
                {
                    //console.log("Returning pre-loaded list of " + monitors.length + " monitors");
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
                //console.log("ZMData setMonitors called with " + mon.length + " monitors");
                monitors = mon;
            },

            //-----------------------------------------------------------------------------
            // When I display events in the event controller, this is the first function I call
            // This returns the total number of pages
            // I then proceed to display pages in reverse order to display the latest events first
            // I also reverse sort them in ZMDataModel to sort by date
            // All this effort because the ZM APIs return events in sorted order, oldest first. Yeesh.
            //-----------------------------------------------------------------------------

            getEventsPages: function (monitorId, startTime, endTime) {
                //console.log("********** INSIDE EVENTS PAGES ");
                var apiurl = loginData.apiurl;

                var myurl = apiurl + "/events/index";
                if (monitorId != 0)
                    myurl = myurl + "/MonitorId:" + monitorId;
                if (startTime)
                    myurl = myurl + "/StartTime >=:" + startTime;
                if (endTime)
                    myurl = myurl + "/EndTime <=:" + endTime;

                myurl = myurl + "/AlarmFrames >=:" + (loginData.enableAlarmCount ? loginData.minAlarmCount : 0);


                myurl = myurl + ".json";
                //console.log (">>>>>Constructed URL " + myurl);

                $ionicLoading.show({
                    template: $translate.instant('kCalcEventSize') + '...',
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
                        // console.log("*** ERROR GETTING TOTAL PAGES ***");
                        zmLog("Error retrieving page count of events " + JSON.stringify(error), "error");
                        displayBanner('error', ['error retrieving event page count', 'please try again']);

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

                //console.log("ZMData getEvents called with ID=" + monitorId + "and Page=" + pageId);

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
                if (monitorId != 0)
                    myurl = myurl + "/MonitorId:" + monitorId;
                if (startTime)
                    myurl = myurl + "/StartTime >=:" + startTime;
                if (endTime)
                    myurl = myurl + "/EndTime <=:" + endTime;

                myurl = myurl + "/AlarmFrames >=:" + (loginData.enableAlarmCount ? loginData.minAlarmCount : 0);
                myurl = myurl + ".json";


                if (pageId) {
                    myurl = myurl + "?page=" + pageId;
                } else {
                    //console.log("**** PAGE WAS " + pageId);
                }

                // Simulated data

                // myurl = "https://api.myjson.com/bins/4jx44.json";

                //console.log (">>>>>Constructed URL " + myurl);




                $http.get(myurl /*,{timeout:15000}*/ )
                    .success(function (data) {
                        if (loadingStr != 'none') $ionicLoading.hide();
                        //myevents = data.events;
                        myevents = data.events.reverse();
                        if (monitorId == 0) {
                            oldevents = myevents;
                        }
                        //console.log (JSON.stringify(data));
                        // console.log("DataModel Returning " + myevents.length + "events for page" + pageId);
                        d.resolve(myevents);
                        return d.promise;

                    })
                    .error(function (err) {
                        if (loadingStr != 'none') $ionicLoading.hide();
                        displayBanner('error', ['error retrieving event list', 'please try again']);
                        //console.log("HTTP Events error " + err);
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
                return loginData.montageSize;
            },

            //-----------------------------------------------------------------------------
            //
            //-----------------------------------------------------------------------------
            setMontageSize: function (montage) {
                loginData.montageSize = montage;
            },



            //-----------------------------------------------------------------------------
            //
            //-----------------------------------------------------------------------------
            getMonitorsLoaded: function () {
                // console.log("**** Inside promise function ");
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
                // console.log("ZMData.setMonitorsLoaded=" + loaded);
                monitorsLoaded = loaded;
            },

            //-----------------------------------------------------------------------------
            // returns the next monitor ID in the list
            // used for swipe next
            //-----------------------------------------------------------------------------
            getNextMonitor: function (monitorId, direction) {
                var id = parseInt(monitorId);
                var foundIndex = -1;
                for (var i = 0; i < monitors.length; i++) {
                    if (parseInt(monitors[i].Monitor.Id) == id) {
                        foundIndex = i;
                        break;
                    }
                }
                if (foundIndex != -1) {
                    foundIndex = foundIndex + direction;
                    // wrap around if needed
                    if (foundIndex < 0) foundIndex = monitors.length - 1;
                    if (foundIndex >= monitors.length) foundIndex = 0;
                    return (monitors[foundIndex].Monitor.Id);
                } else {
                    zmLog("getNextMonitor could not find monitor " + monitorId);
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

            getMonitorObject: function (id) {
                var idnum = parseInt(id);
                for (var i = 0; i < monitors.length; i++) {
                    if (parseInt(monitors[i].Monitor.Id) == idnum) {
                        // console.log ("Matched, exiting getMonitorname");
                        return monitors[i];
                    }

                }
                return "(Unknown)";
            },

            getImageMode: function (id) {
                var idnum = parseInt(id);
                for (var i = 0; i < monitors.length; i++) {
                    if (parseInt(monitors[i].Monitor.Id) == idnum) {
                        // console.log ("Matched, exiting getMonitorname");
                        return monitors[i].Monitor.imageMode;
                    }

                }
                return "(Unknown)";
            },

            getStreamingURL: function (id) {
                var idnum = parseInt(id);
                for (var i = 0; i < monitors.length; i++) {
                    if (parseInt(monitors[i].Monitor.Id) == idnum) {
                        // console.log ("Matched, exiting getMonitorname");
                        return monitors[i].Monitor.streamingURL;
                    }

                }
                return "(Unknown)";
            },

            getBaseURL: function (id) {
                var idnum = parseInt(id);
                for (var i = 0; i < monitors.length; i++) {
                    if (parseInt(monitors[i].Monitor.Id) == idnum) {
                        // console.log ("Matched, exiting getMonitorname");
                        return monitors[i].Monitor.baseURL;
                    }

                }
                return "(Unknown)";
            },


        };
}]);