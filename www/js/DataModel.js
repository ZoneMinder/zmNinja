/* jshint -W041 */


/* jslint browser: true*/
/* global cordova,StatusBar,angular,console, URI, moment, localforage, CryptoJS, Connection */

// This is my central data respository and common functions
// that many other controllers use
// It's grown over time. I guess I may have to split this into multiple services in the future

angular.module('zmApp.controllers')

.service('NVRDataModel', ['$http', '$q', '$ionicLoading', '$ionicBackdrop', '$fileLogger', 'zm', '$rootScope', '$ionicContentBanner', '$timeout', '$cordovaPinDialog', '$ionicPopup', '$localstorage', '$state', '$ionicNativeTransitions', '$translate', '$cordovaSQLite',
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
        var migrationComplete = false;
        
        var tz = "";
        var isTzSupported = false;


        var languages = [
            {
                text: 'English',
                value: 'en'
            },
            {
                text: 'Italian',
                value: 'it'
            },
            {
                text: 'Portugese',
                value: 'pt'
            },
            {
                text: 'العربية',
                value: 'ar'
            },
           /* {
                text: 'Hindi',
                value: 'hi'
            }*/
        ];

        var serverGroupList = {};
        var defaultLang = 'en';
        var isFirstUse = true;
        var lastUpdateCheck = null;
        var latestBlogPostChecked = null;
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
            'singleImageQuality': "100", // event single streaming quality in %
            'monSingleImageQuality': "100", // live view quality
            'montageHistoryQuality': "50",
            'useSSL': false, // "1" if HTTPS
            'keepAwake': true, // don't dim/dim during live view
            'isUseAuth': true, // true if user wants ZM auth
            'isUseEventServer': false, // true if you configure the websocket event server
            'disablePush': false, // true if only websocket mode is desired
            'eventServerMonitors': '', // list of monitors to notify from ES
            'eventServerInterval': '', // list of intervals for all monitors
            'refreshSec': '2', // timer value for frame change in sec 
            'refreshSecLowBW': 8,
            'enableLogs': true,
            'enableDebug': true, // if enabled with log messages with "debug"
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
            'EHpackeryPositions': '',
            'packerySizes': '',
            'timelineModalGraphType': 'all',
            'resumeDelay': 0,
            'language': 'en',
            'reachability': true,
            'forceImageModePath': false,
            'disableNative': false,
            'vibrateOnPush': true,
            'soundOnPush': true,
            'cycleMonitors': false,
            'cycleMonitorsInterval':10, // 10sec
            'enableLowBandwidth':false,
            'autoSwitchBandwidth':false,
            'disableAlarmCheckMontage': false,
            'useLocalTimeZone': true,
            'fastLogin': true,



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

        function getBandwidth()
        {
            // if mode is not on always return high
                if (loginData.enableLowBandwidth == false)
                {
                    return "highbw";
                }
                // if mode is force on, return low
                if (loginData.enableLowBandwidth == true && loginData.autoSwitchBandwidth != true)
                {
                    return "lowbw";
                }
                if (loginData.enableLowBandwidth == true && loginData.autoSwitchBandwidth == true && $rootScope.platformOS == 'desktop')
                {
                    return "highbw";
                }
                // else return real state
            
                var networkState = navigator.connection.type; 
                var strState;
                switch (networkState)
                {

                    case Connection.WIFI: strState="highbw"; break;
                    case Connection.ETHERNET: strState="highbw"; break;
                    default: strState = "lowbw"; break;

                }
                return strState;
        }
        
        //--------------------------------------------------------------------------
        // uses fileLogger  to write logs to file for later investigation
        //--------------------------------------------------------------------------

        // separate out a debug so we don't do this if comparison for normal logs
        function debug(val) {
            if (loginData.enableDebug && loginData.enableLogs) {
                if (val !== undefined) {
                    var regex1 = /"password":".*?"/g;
                    var regex2 = /&pass=.*?(?=["&]|$)/g;

                    //console.log ("VAL IS " + val);
                    val = val.replace(regex1, "<password removed>");
                    val = val.replace(regex2, "<password removed>");
                }
                $fileLogger.debug(val);
                //console.log (val);
            }
        }

        function log(val, logtype) {
            if (loginData.enableLogs) {
                if (val !== undefined) {
                    var regex1 = /"password":".*?"/g;
                    var regex2 = /&pass=.*?(?=["&]|$)/g;

                    //console.log ("VAL IS " + val);
                    val = val.replace(regex1, "<password removed>");
                    val = val.replace(regex2, "<password removed>");

                }
                // make sure password is removed
                //"username":"zmninja","password":"xyz",
                //val = val.replace(/\"password:\",
                $fileLogger.log(logtype, val);
                // console.log (val);
            }
        }




        function setLogin(newLogin) {
            loginData = angular.copy(newLogin);
            serverGroupList[loginData.serverName] = angular.copy(loginData);

            var ct = CryptoJS.AES.encrypt(JSON.stringify(serverGroupList), zm.cipherKey).toString();

            //console.log ("****serverLogin was encrypted to " + ct);
            //$localstorage.setObject("serverGroupList", serverGroupList);
            localforage.setItem("serverGroupList", ct, function (err) {
                if (err) log("localforage store error " + JSON.stringify(err));
            });
            //$localstorage.set("defaultServerName", loginData.serverName);
            localforage.setItem("defaultServerName", loginData.serverName, function (err) {
                if (err) log("localforage store error " + JSON.stringify(err));
            });




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

            migrationComplete: function () {
                migrationComplete = true;
            },



            isEmpty: function (obj) {
                return isEmpty(obj);
            },

            log: function (val, type) {
                var logtype = 'info';
                if (type != undefined)
                    logtype = type;
                log(val, logtype);

            },

            debug: function (val) {


                debug(val);
            },

            setLastUpdateCheck: function (val) {
                lastUpdateCheck = val;
                localforage.setItem("lastUpdateCheck", lastUpdateCheck);
            },

            getLastUpdateCheck: function () {
                return lastUpdateCheck;
            },

            setLatestBlogPostChecked: function (val) {
                //console.log (">>>>>>>>>>>> Setting blog date: " + val);
                latestBlogPostChecked = val;
                localforage.setItem("latestBlogPostChecked", latestBlogPostChecked);
            },

            getLatestBlogPostChecked: function () {
                return latestBlogPostChecked;
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
                    log("Reachable: No server name configured, likely first use?");
                    d.reject("No servers");
                    return d.promise;
                }

                var chainURLs = [];
                var savedLoginData = angular.copy(loginData);

                //log ("Making sure " + loginData.serverName + " is reachable...");
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
                        log("Adding to chain stack: " + tLd.serverName + ">" + tLd.url);
                        chainURLs.push({
                            url: tLd.url + "/index.php",
                            server: tLd.serverName
                        });
                        log("Fallback of " + tLd.serverName + " is " + tLd.fallbackConfiguration);
                        if (tLd.fallbackConfiguration) {
                            tLd = serverGroupList[tLd.fallbackConfiguration];
                            if (tLd === undefined) {
                                // This can happen if the fallback profile was deleted
                                log("Looks like a server object was deleted, but is still in fallback");
                                keepBuilding = false;
                            }
                        } else {
                            log("reached end of chain loop");
                        }
                    } else {
                        log("detected loop when " + tLd.serverName + " fallsback to " + tLd.fallbackConfiguration);
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

                    log("Based on reachability, first serverName will be " + firstReachableUrl.server);
                    //console.log("set login Data to " + JSON.stringify(loginData));

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
                        log("Reachability test.." + urls[0].url);

                        if (loginData.reachability) {

                            //console.log ("************* AUGH");
                            return $http.get(urls[0].url).then(function () {
                                log("Success: reachability on " + urls[0].url);
                                $ionicLoading.hide();
                                return urls[0];
                            }, function (err) {
                                log("Failed reachability on " + urls[0].url + " with error " + JSON.stringify(err));
                                return findFirstReachableUrl(urls.slice(1));
                            });
                        } else {
                            log("Reachability is disabled in config, faking this test and returning success on " + urls[0]);
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







                log("ZMData init: checking for stored variables & setting up log file");

                latestBlogPostChecked = localforage.getItem("latestBlogPostChecked") || null;

                $ionicLoading.show({
                    template: "retrieving profile data..."
                });




                localforage.getItem("serverGroupList").then(function (val) {
                    // decrypt it now

                    var decodedVal;

                    if (typeof val == 'string') {
                        log("user profile encrypted, decoding...");
                        var bytes = CryptoJS.AES.decrypt(val.toString(), zm.cipherKey);
                        decodedVal = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

                    } else {
                        log("user profile not encrypted");
                        decodedVal = val;
                    }

                    //decodedVal = val;

                   // debug("user profile retrieved:" + JSON.stringify(decodedVal));

                    $ionicLoading.hide();
                    serverGroupList = decodedVal;


                    // console.log(">>>> DECRYPTED serverGroupList " + JSON.stringify(serverGroupList));
                    var demoServer = "{\"serverName\":\"zmNinjaDemo\",\"username\":\"zmninja\",\"password\":\"zmNinja$xc129\",\"url\":\"https://demo.zoneminder.com/zm\",\"apiurl\":\"https://demo.zoneminder.com/zm/api\",\"eventServer\":\"\",\"maxMontage\":\"40\",\"streamingurl\":\"https://demo.zoneminder.com/cgi-bin-zm\",\"maxFPS\":\"3\",\"montageQuality\":\"50\",\"singleImageQuality\":\"100\",\"montageHistoryQuality\":\"50\",\"useSSL\":true,\"keepAwake\":true,\"isUseAuth\":\"1\",\"isUseEventServer\":false,\"disablePush\":false,\"eventServerMonitors\":\"\",\"eventServerInterval\":\"\",\"refreshSec\":\"2\",\"enableDebug\":false,\"usePin\":false,\"pinCode\":\"\",\"canSwipeMonitors\":true,\"persistMontageOrder\":false,\"onTapScreen\":\"Events\",\"enableh264\":true,\"gapless\":false,\"montageOrder\":\"\",\"montageHiddenOrder\":\"\",\"montageArraySize\":\"0\",\"graphSize\":2000,\"enableAlarmCount\":true,\"montageSize\":\"3\",\"useNphZms\":true,\"useNphZmsForEvents\":true,\"packMontage\":false,\"exitOnSleep\":false,\"forceNetworkStop\":false,\"defaultPushSound\":false,\"enableBlog\":true,\"use24hr\":false, \"packeryPositions\":\"\"}";
                    var demoS = JSON.parse(demoServer);
                    //console.log("JSON parsed demo" + JSON.stringify(demoS));

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
                        debug("Pushing demo server config to server groups");
                        //serverGroupList.push(demoS);
                        serverGroupList[demoS.serverName] = angular.copy(demoS);
                    }

                    var sname;
                    $ionicLoading.show({
                        template: "retrieving profile data..."
                    });
                    localforage.getItem("defaultServerName")
                        .then(function (val) {
                            $ionicLoading.hide();
                            //console.log ("!!!!!!!!!!!!!!!!!!default server name is  "  + sname);
                            sname = val;
                            // console.log("!!!!!!!!!!!!!!!!!!!Got VAL " + sname);
                            var loadedData = serverGroupList[sname];
                            // console.log(">>>>>>>>>>> loadedData is: " + JSON.stringify(loadedData));
                            if (!isEmpty(loadedData)) {
                                loginData = loadedData;

                                // old version hacks for new variables

                                if (typeof loginData.enableAlarmCount === 'undefined') {
                                    debug("enableAlarmCount does not exist, setting to true");
                                    loginData.enableAlarmCount = true;
                                }

                                if (typeof loginData.onTapScreen == 'undefined') {
                                    loginData.onTapScreen = $translate.instant('kTapMontage');
                                }

                                if (loginData.onTapScreen != $translate.instant('kTapMontage') &&
                                    loginData.onTapScreen != $translate.instant('kTapEvents') &&
                                    loginData.onTapScreen != $translate.instant('kTapLiveMonitor')) {
                                    log("Invalid onTap setting found, resetting");
                                    loginData.onTapScreen = $translate.instant('kMontage');
                                }


                                if (typeof loginData.minAlarmCount === 'undefined') {
                                    debug("minAlarmCount does not exist, setting to true");
                                    loginData.minAlarmCount = 1;
                                }


                                if (typeof loginData.montageSize == 'undefined') {
                                    debug("montageSize does not exist, setting to 2 (2 per col)");
                                    loginData.montageSize = 2;
                                }


                                if (typeof loginData.useNphZms == 'undefined') {
                                    debug("useNphZms does not exist. Setting to true");
                                    loginData.useNphZms = true;
                                }



                                if (typeof loginData.useNphZmsForEvents == 'undefined') {
                                    debug("useNphZmsForEvents does not exist. Setting to true");
                                    loginData.useNphZmsForEvents = true;
                                }

                                if (typeof loginData.forceImageModePath == 'undefined') {
                                    debug("forceImageModePath does not exist. Setting to false");
                                    loginData.forceImageModePath = false;
                                }

                                if (typeof loginData.reachability == 'undefined') {
                                    debug("reachability does not exist. Setting to true");
                                    loginData.reachability = true;
                                }
                                // force it - this may not be the problem
                                loginData.reachability = true;

                                // and now, force enable it
                                loginData.useNphZms = true;
                                loginData.useNphZmsForEvents = true;

                                if (typeof loginData.packMontage == 'undefined') {
                                    debug("packMontage does not exist. Setting to false");
                                    loginData.packMontage = false;
                                }

                                if (typeof loginData.forceNetworkStop == 'undefined') {
                                    debug("forceNetwork does not exist. Setting to false");
                                    loginData.forceNetworkStop = false;
                                }

                                if (typeof loginData.enableLogs == 'undefined') {
                                    debug("enableLogs does not exist. Setting to true");
                                    loginData.enableLogs = true;
                                }



                                if (typeof loginData.defaultPushSound == 'undefined') {
                                    debug("defaultPushSound does not exist. Setting to false");
                                    loginData.defaultPushSound = false;
                                }



                                if (typeof loginData.exitOnSleep == 'undefined') {
                                    debug("exitOnSleep does not exist. Setting to false");
                                    loginData.exitOnSleep = false;
                                }

                                if (typeof loginData.enableBlog == 'undefined') {
                                    debug("enableBlog does not exist. Setting to true");
                                    loginData.enableBlog = true;

                                }

                                if (typeof loginData.packeryPositions == 'undefined') {
                                    debug("packeryPositions does not exist. Setting to empty");
                                    loginData.packeryPositions = "";

                                }
                                
                                
                                if (typeof loginData.EHpackeryPositions == 'undefined') {
                                    debug("EHpackeryPositions does not exist. Setting to empty");
                                    loginData.EHpackeryPositions = "";

                                }


                                if (typeof loginData.packerySizes == 'undefined') {
                                    debug("packerySizes does not exist. Setting to empty");
                                    loginData.packerySizes = "";

                                }

                                if (typeof loginData.use24hr == 'undefined') {
                                    debug("use24hr does not exist. Setting to false");
                                    loginData.use24hr = false;

                                }

                                if (typeof timelineModalGraphType == 'undefined') {
                                    debug("timeline graph type not set. Setting to all");
                                    loginData.timelineModalGraphType = $translate.instant('kGraphAll');
                                    //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + loginData.timelineModalGraphType);
                                }

                                if (typeof loginData.resumeDelay == 'undefined') {
                                    debug("resumeDelay does not exist. Setting to 0");
                                    loginData.resumeDelay = 0;

                                }
                                // override resumeDelay - it was developed on a wrong assumption
                                loginData.resumeDelay = 0;



                                if (typeof loginData.montageHistoryQuality == 'undefined') {
                                    debug("montageHistoryQuality does not exist. Setting to 50");
                                    loginData.montageHistoryQuality = "50";

                                }

                                if (typeof loginData.disableNative == 'undefined') {
                                    debug("disableNative not found, setting to false");
                                    loginData.disableNative = false;

                                }

                                if (typeof loginData.vibrateOnPush == 'undefined') {
                                    debug("vibrate on push not found, setting to true");
                                    loginData.vibrateOnPush = true;

                                }

                                if (typeof loginData.soundOnPush == 'undefined') {
                                    debug("sound on push not found, setting to true");
                                    loginData.soundOnPush = true;

                                }
                                
                                if (typeof loginData.cycleMonitors == 'undefined') {
                                    
                                    loginData.cycleMonitors = false;

                                }
                                
                                if (typeof loginData.cycleMonitorsInterval == 'undefined') {
                                    
                                    loginData.cycleMonitorsInterval = 10;

                                }

                                
                                if (typeof loginData.enableLowBandwidth == 'undefined') {

                                  
                                    loginData.enableLowBandwidth = false;

                                }
                                // wtf is wrong with this ternary?
                                //$rootScope.runMode = (loginData.enableLowBandwith==true)? "low": "normal";
                            
                                
                               
                                
                                if (typeof loginData.autoSwitchBandwidth == 'undefined') {

                                  
                                    loginData.autoSwitchBandwidth = false;

                                }
                                
                                $rootScope.runMode = getBandwidth();
                                log("Setting DataModel init bandwidth to: " +$rootScope.runMode);
                                
                                
                                    
                                
                                if (typeof loginData.refreshSecLowBW == 'undefined') {
                                    
                                    loginData.refreshSecLowBW = 8;

                                }
                                
                                if (typeof loginData.disableAlarmCheckMontage == 'undefined') {
                                    
                                    loginData.disableAlarmCheckMontage = false;

                                }
                                
                                
                                if (typeof loginData.useLocalTimeZone == 'undefined') {
                                    
                                    loginData.useLocalTimeZone = true;

                                }
                                
                                
                                if (typeof loginData.fastLogin == 'undefined') {
                                    
                                    loginData.fastLogin = true;

                                }
                                
                                
                                
                                
                                if (typeof loginData.monSingleImageQuality == 'undefined') {
                                    
                                    loginData.monSingleImageQuality = 100;

                                }

                                log("DataModel init recovered this loginData as " + JSON.stringify(loginData));
                            } else {
                                log("defaultServer configuration NOT found. Keeping login at defaults");
                            }
                        
                        
                        
                            // FIXME: HACK: This is the latest entry point into dataModel init, so start portal login after this
                            // not the neatest way
                            $rootScope.$emit('init-complete');
                        });

                    monitorsLoaded = 0;
                    //console.log("Getting out of NVRDataModel init");
                    $rootScope.showBlog = loginData.enableBlog;
                    //debug("loginData structure values: " + JSON.stringify(loginData));

                });

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
                    log(s + " Not calling window stop as we just resumed");
                    justResumed = false;
                } else {
                    log(s + " Calling window.stop()");
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
                defaultLang = l;
                var d = $q.defer();
                if (permanent) {
                    //window.localStorage.setItem("defaultLang", l);

                    //console.log("setting default lang");
                    localforage.setItem("defaultLang", l)
                        .then(function (val) {
                            log("Set language in localforage to: " + val);
                        });
                }

                //console.log("invoking translate use with " + l);
                $translate.use(l).then(function (data) {
                    log("Device Language is:" + data);
                    moment.locale(data);
                    $translate.fallbackLanguage('en');
                    d.resolve(data);
                    return d.promise;
                }, function (error) {
                    log("Device Language error: " + error);
                    $translate.use('en');
                    moment.locale('en');
                    d.resolve('en');
                    return d.promise;
                });
                return d.promise;
            },

            getDefaultLanguage: function () {
                return defaultLang;
                //return window.localStorage.getItem("defaultLang");

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
                // console.log("isFirstUse is " + isFirstUse);
                return isFirstUse;
                // return ((window.localStorage.getItem("isFirstUse") == undefined) ? true : false);

            },

            versionCompare: function (l, r) {
                return versionCompare(l, r);
            },

            //-----------------------------------------------------------------
            // Allow the option to reset first use if I need it in future
            //-----------------------------------------------------------------
            setFirstUse: function (val) {
                //window.localStorage.setItem("isFirstUse", val ? "1" : "0");
                //localforage.setItem("isFirstUse", val, 
                //   function(err) {if (err) log ("localforage error, //storing isFirstUse: " + JSON.stringify(err));});
                isFirstUse = val;
                localforage.setItem("isFirstUse", val);
                //console.log (">>>>>>setting isFirstUse to " + val);

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
                // log("Switching screen always on to " + val);
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
                debug("getAPIversion called");
                var d = $q.defer();
                var apiurl = loginData.apiurl + '/host/getVersion.json';
                $http.get(apiurl)
                    .then(function (success) {
                            if ( success.data.version) {
                                d.resolve(success.data.version);
                            } else {
                                d.resolve("0.0.0");
                            }
                            return (d.promise);

                        },
                        function (error) {
                            debug("getAPIversion error handler " + JSON.stringify(error));
                            d.reject("-1.-1.-1");
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
                log("Checking if reCaptcha is enabled in ZM...");
                $http.get(myurl)
                    .then(function (success) {
                        if (success.data.search("g-recaptcha") != -1) {
                            // recaptcha enable. zmNinja won't work
                            log("ZM has recaptcha enabled", "error");
                            displayBanner('error', ['Recaptcha must be disabled in Zoneminder', $rootScope.appName + ' will not work with recaptcha'], "", 8000);
                            d.resolve(true);
                            return (d.promise);


                        } else {
                            d.resolve(false);
                            log("ZM has recaptcha disabled - good");
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
                    log("Deferring auth key, as monitorId unknown");
                    d.resolve("");
                    return (d.promise);
                }

                // Skipping monitor number as I only need an auth key
                // so no need to generate an image
                var myurl = loginData.url + "/index.php?view=watch&mid=" + mid + "&connkey=" + ck;
                debug("DataModel: Getting auth from " + myurl + " with mid=" + mid);
                $http.get(myurl)
                    .then(function (success) {
                            // console.log ("**** RESULT IS " + JSON.stringify(success));
                            // Look for auth=
                            var auth = success.data.match("auth=(.*?)&");
                            if (auth && (auth[1] != null)) {
                                log("DataModel: Extracted a stream authentication key of: " + auth[1]);
                                d.resolve("&auth=" + auth[1]);
                            } else {
                                log("DataModel: Did not find a stream auth key, looking for user=");
                                auth = success.data.match("user=(.*?)&");
                                if (auth && (auth[1] != null)) {
                                    log("DataModel: Found simple stream auth mode (user=)");
                                    d.resolve("&user=" + loginData.username + "&pass=" + loginData.password);
                                } else {
                                    log("Data Model: Did not find any  stream mode of auth");
                                    d.resolve("");
                                }
                                return (d.promise);
                            }

                        },
                        function (error) {
                            log("DataModel: Error resolving auth key " + JSON.stringify(error));
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
                    debug("Config URL for digits is:" + myurl);
                    $http.get(myurl)
                        .success(function (data) {
                            log("ZM_EVENT_IMAGE_DIGITS is " + data.config.Value);
                            configParams.ZM_EVENT_IMAGE_DIGITS = data.config.Value;
                            d.resolve(configParams.ZM_EVENT_IMAGE_DIGITS);
                            return (d.promise);

                        })
                        .error(function (err) {
                            log("Error retrieving ZM_EVENT_IMAGE_DIGITS" + JSON.stringify(err), "error");
                            log("Taking a guess, setting ZM_EVENT_IMAGE_DIGITS to 5");
                            // FIXME: take a plunge and keep it at 5?
                            configParams.ZM_EVENT_IMAGE_DIGITS = 5;
                            d.resolve(configParams.ZM_EVENT_IMAGE_DIGITS);
                            return (d.promise);
                        });
                } else {
                    log("ZM_EVENT_IMAGE_DIGITS is already configured for " +
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
                debug("Config URL for ZMS PATH is:" + myurl);
                $http.get(myurl)
                    .success(function (data) {
                        configParams.ZM_PATH_ZMS = data.config.Value;
                        d.resolve(configParams.ZM_PATH_ZMS);
                        return (d.promise);
                    })
                    .error(function (error) {
                        log("Error retrieving ZM_PATH_ZMS: " + JSON.stringify(error));
                        d.reject("");
                        return (d.promise);
                    });
                return (d.promise);


            },
            //--------------------------------------------------------------------------
            // returns high or low BW mode
            //--------------------------------------------------------------------------
            getBandwidth: function () {
                return getBandwidth();
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

                    log("Stored montage order does not exist");
                } else
                // there is a saved order
                {
                    var myorder = loginData.montageOrder;
                    var myhiddenorder = loginData.montageHiddenOrder;


                    debug("MontageCtrl: Montage order is " + myorder);
                    debug("MontageCtrl: Hidden order is " + myhiddenorder);
                    if (myorder) montageOrder = myorder.split(",");
                    if (myhiddenorder) hiddenOrder = myhiddenorder.split(",");

                    //  handle add/delete monitors after the array has been 
                    // saved

                    if (monitors.length != montageOrder.length) {
                        log("Monitors array length different from stored hidden/order array. It's possible monitors were added/removed. Resetting...");
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
                        log("Monitor " + i + " is marked as hidden in montage");
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
                    //console.log("NVRDataModel: Invoking HTTP get to load monitors");
                    log((forceReload == 1) ? "getMonitors:Force reloading all monitors" : "getMonitors:Loading all monitors");
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
                            debug("Now trying to get multi-server data, if present");
                            $http.get(apiurl + "/servers.json")
                                .success(function (data) {
                                    // We found a server list API, so lets make sure
                                    // we get the hostname as it will be needed for playback
                                    log("multi server list loaded" + JSON.stringify(data));
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

                                            debug("Monitor " + monitors[i].Monitor.Id + " has a recording server hostname of " + multiservers[j].Server.Hostname);

                                            // Now here is the logic, I need to retrieve serverhostname,
                                            // and slap on the host protocol and path. Meh.

                                            var p = URI.parse(loginData.streamingurl);
                                            var s = URI.parse(multiservers[j].Server.Hostname);

                                            debug("recording server parsed is " + JSON.stringify(s));
                                            debug("portal  parsed is " + JSON.stringify(p));

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
                                            debug("API " + $rootScope.apiVersion + ": Monitor " + monitors[i].Monitor.Id + " will use " + monitors[i].Monitor.imageMode + " for direct image access");

                                            //debug ("Streaming URL for Monitor " + monitors[i].Monitor.Id  + " is " + monitors[i].Monitor.streamingURL );
                                            //debug ("Base URL for Monitor " + monitors[i].Monitor.Id  + " is " + monitors[i].Monitor.baseURL );


                                        } else {
                                            monitors[i].Monitor.listDisplay = 'show';
                                            monitors[i].Monitor.isAlarmed = false;
                                            monitors[i].Monitor.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
                                            monitors[i].Monitor.streamingURL = loginData.streamingurl;
                                            monitors[i].Monitor.baseURL = loginData.url;
                                            monitors[i].Monitor.imageMode = (versionCompare($rootScope.apiVersion, "1.30") == -1) ? "path" : "fid";


                                            // but now check if forced path 
                                            if (loginData.forceImageModePath) {
                                                debug("Overriding, setting image mode to true as you have requested force enable");
                                                monitors[i].Monitor.imageMode = 'path';
                                            }

                                            debug("API " + $rootScope.apiVersion + ": Monitor " + monitors[i].Monitor.Id + " will use " + monitors[i].Monitor.imageMode + " for direct image access");
                                        }
                                    }
                                    d.resolve(monitors);
                                })
                                .error(function (err) {
                                    log("multi server list loading error");
                                    multiservers = [];

                                    for (var i = 0; i < monitors.length; i++) {
                                        monitors[i].Monitor.listDisplay = 'show';
                                        monitors[i].Monitor.isAlarmed = false;
                                        monitors[i].Monitor.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
                                        monitors[i].Monitor.streamingURL = loginData.streamingurl;
                                        monitors[i].Monitor.baseURL = loginData.url;
                                        monitors[i].Monitor.imageMode = (versionCompare($rootScope.apiVersion, "1.30") == -1) ? "path" : "fid";
                                        debug("API " + $rootScope.apiVersion + ": Monitor " + monitors[i].Monitor.Id + " will use " + monitors[i].Monitor.imageMode + " for direct image access");




                                    }
                                    d.resolve(monitors);

                                });

                            $ionicLoading.hide();
                            log("Monitor load was successful, loaded " + monitors.length + " monitors");



                        })
                        .error(function (err) {
                            //console.log("HTTP Error " + err);
                            log("Monitor load failed " + JSON.stringify(err), "error");
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
                    log("Returning pre-loaded list of " + monitors.length + " monitors");
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
            
            processFastLogin: function() {
                var d = $q.defer();
                if (1)
                {
                    d.reject ("not implemented");
                    return d.promise;
                }
                console.log ("inside processFastLogin");
                if (!loginData.fastLogin)
                {
                    console.log ("Fast login not set");
                    d.reject ("fast login not enabled");
                    debug ("fast login not enabled");
                    return d.promise;
                    
                }
                else //fastlogin is on
                {
                    localforage.getItem("lastLogin")
                    .then (function(succ) {
                        console.log ("fast login DB found");
                        var dt = moment(succ);
                        
                        if (dt.isValid())
                        {   
                            debug ("Got last login as " + dt.toString());
                            if (moment.duration(moment().diff(dt)).asHours() >=2 ) {
                                d.reject ("duration since last login >=2hrs, need to relogin");
                                return d.promise;
                            }
                            else {
                                d.resolve ("fast login is valid, less then 2 hrs");
                                return d.promise;
                            }
                        }
                        else
                        {
                            console.log ("Invalid date found");
                            d.reject ("last-login invalid");
                            return d.promise;
                            
                        }
                    },
                           function (e) {
                            console.log ("fastlogin DB not found");
                            d.reject ("last-login not found, fastlogin rejected");
                            return d.promise;
                    });
                           
                }
                return d.promise;
            },
            
            //returns TZ value immediately (sync)
            
            getTimeZoneNow: function()
            {
               // console.log ("getTimeZoneNow: " + tz ? tz : moment.tz.guess());
                return tz ? tz : moment.tz.guess();
            },
            
            // returns server timezone, failing which local timezone
            // always resolves true
            
            isTzSupported: function()
            {
                return isTzSupported;
            },
            
            getTimeZone: function ()
            {
                
                var d = $q.defer();
                if (!tz)
                {
                    
                    log ("First invocation of TimeZone, asking server");
                    var apiurl = loginData.apiurl + '/host/getTimeZone.json';
                    $http.get(apiurl)
                        .then(function (success) {
                                tz = success.data.tz;
                                d.resolve(tz);
                                debug ("Timezone API response is:"+success.data.tz);
                                isTzSupported = true;
                                return (d.promise);

                            },
                            function (error) {
                                tz = moment.tz.guess();
                                debug("Timezone API error handler, guessing local:" + tz);
                                d.resolve(tz);
                                isTzSupported = false;
                                return (d.promise);
                            });
                    
                }
                else
                {
                    d.resolve(tz);
                    return d.promise;
                }
                
                return d.promise;
            },

            //-----------------------------------------------------------------------------
            // When I display events in the event controller, this is the first function I call
            // This returns the total number of pages
            // I then proceed to display pages in reverse order to display the latest events first
            // I also reverse sort them in NVRDataModel to sort by date
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
                        log("Error retrieving page count of events " + JSON.stringify(error), "error");
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
                        log("Error fetching events for page " + pageId + " Err: " + JSON.stringify(err), "error");
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
                    log("getNextMonitor could not find monitor " + monitorId);
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