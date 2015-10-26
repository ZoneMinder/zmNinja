/* jshint -W041 */


/* jslint browser: true*/
/* global cordova,StatusBar,angular,console ,PushNotification*/

//--------------------------------------------------------------------------
// This factory interacts with the ZM Event Server
// over websockets and is responsible for rendering real time notifications
//--------------------------------------------------------------------------

angular.module('zmApp.controllers')

.factory('EventServer', ['ZMDataModel', '$rootScope', '$websocket', '$ionicPopup', '$timeout', '$q', 'zm', '$ionicPlatform', function
    (ZMDataModel, $rootScope, $websocket, $ionicPopup, $timeout, $q, zm, $ionicPlatform, $cordovaBadge) {


        var ws;

        var localNotificationId = 0;

       
        //--------------------------------------------------------------------------
        // used to compare versions of event server 
        //--------------------------------------------------------------------------
        
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
        // called when the websocket is opened
        //--------------------------------------------------------------------------
        function openHandshake() {
            var loginData = ZMDataModel.getLogin();
            if (loginData.isUseEventServer == "0" || loginData.eventServer == "") {
                ZMDataModel.zmLog("openHandShake: no event server");
                return;
            }

            ZMDataModel.zmLog("openHandshake: Websocket open");
            ws.$emit('auth', {
                user: loginData.username,
                password: loginData.password
            });

            if ($rootScope.apnsToken != '') {
                var plat = $ionicPlatform.is('ios') ? 'ios':'android';
                
                ws.$emit('push', {
                    type: 'token',
                    platform: plat,
                    token: $rootScope.apnsToken
                });
            }

        }
        
        
        




        //--------------------------------------------------------------------------
        // Called once at app start. Does a lazy definition of websockets open
        //--------------------------------------------------------------------------
        function init() {
            $rootScope.isAlarm = 0;
            $rootScope.alarmCount = "0";

            var d = $q.defer();

            var loginData = ZMDataModel.getLogin();

            if (loginData.isUseEventServer == '0' || !loginData.eventServer) {
                ZMDataModel.zmLog("No Event Server present. Not initializing");
                d.reject("false");
                return d.promise;
            }
            
            if (!$rootScope.apnsToken)
                pushInit();


            
            if (typeof ws !== 'undefined') {
                ZMDataModel.zmDebug("Event server already initialized");
                d.resolve("true");
                return d.promise;
            }


            ZMDataModel.zmLog("Initializing Websocket with URL " +
                loginData.eventServer + " , will connect later...");
            ws = $websocket.$new({
                url: loginData.eventServer,
                reconnect: true,
                reconnectInterval: 5000,
                lazy: true
            });



            // Transmit auth information to server              
            ws.$on('$open', openHandshake);

            ws.$on('$close', function () {
                ZMDataModel.zmLog("Websocket closed");

            });

            // Handles responses back from ZM ES

            ws.$on('$message', function (str) {
                ZMDataModel.zmLog("Real-time event: " + JSON.stringify(str));

                // Error messages
                if (str.status != 'Success') {
                    ZMDataModel.zmLog("Event Error: " + JSON.stringify(str));

                    if (str.reason == 'APNSDISABLED') {
                        ws.$close();
                        ZMDataModel.displayBanner('error', ['Event Server: APNS disabled'], 2000, 6000);
                        $rootScope.apnsToken = "";
                    }

                }

                if (str.status == 'Success' && (str.event == 'auth')) {
                    if (str.version == undefined)
                        str.version = "0.1";
                    if (versionCompare(str.version, zm.minEventServerVersion) == -1) {
                        $ionicPopup.alert({
                            title: 'Event Server version not supported',
                            template: 'You are running version ' + str.version + ". Please upgrade to " +
                            zm.minEventServerVersion
                        });
                    }

                }




                if (str.status == 'Success' && str.event == 'alarm') // new events
                {
                    var localNotText = "Latest Alarms: ";
                    $rootScope.isAlarm = 1;

                    // Show upto a max of 99 when it comes to display
                    // so aesthetics are maintained
                    if ($rootScope.alarmCount == "99") {
                        $rootScope.alarmCount = "99+";
                    }
                    if ($rootScope.alarmCount != "99+") {
                        $rootScope.alarmCount = (parseInt($rootScope.alarmCount) + 1).toString();
                    }


                    var eventsToDisplay = [];
                    for (var iter = 0; iter < str.events.length; iter++) {
                        // lets stack the display so they don't overwrite
                        eventsToDisplay.push(str.events[iter].Name + ": latest new alarm (" + str.events[iter].EventId + ")");
                        localNotText = localNotText + str.events[iter].Name + ",";


                    }
                    localNotText = localNotText.substring(0, localNotText.length - 1);

                    // if we are in background, do a local notification, else do an in app display
                    if (!ZMDataModel.isBackground()) {
                        ZMDataModel.zmDebug("App is in foreground, displaying banner");
                        if (eventsToDisplay.length > 0) {

                            if (eventsToDisplay.length == 1) {
                                console.log("Single Display: " + eventsToDisplay[0]);
                                ZMDataModel.displayBanner('alarm', [eventsToDisplay[0]], 5000, 5000);
                            } else {
                                ZMDataModel.displayBanner('alarm', eventsToDisplay, 5000, 5000 * eventsToDisplay.length);
                            }

                        }
                    } 
                    
                   /* if (!$ionicPlatform.is('ios') ) 
                    {
                        // this is only used for local notifications which is not
                        // used for iOS
                        // lets set badge of app irrespective of background or foreground
                        $cordovaBadge.hasPermission().then(function (yes) {

                            $cordovaBadge.set($rootScope.alarmCount).then(function () {
                                // You have permission, badge set.
                                ZMDataModel.zmDebug("Setting badge to " + $rootScope.alarmCount);
                            }, function (err) {
                                // You do not have permission.
                                ZMDataModel.zmDebug("Error Setting badge to " + $rootScope.alarmCount);
                            });


                            // You have permission
                        }, function (no) {
                            ZMDataModel.zmDebug("zmNinja does not have badge permissions. Please check your phone notification settings");
                        });
                    }*/

                } //end of success handler





            });
            d.resolve("true");
            return (d.promise);

        }

        //--------------------------------------------------------------------------
        // Send an arbitrary object to the Event Serve
        // currently planned to use it for device token
        //--------------------------------------------------------------------------
        function sendMessage(type, obj) {
            var ld = ZMDataModel.getLogin();
            if (ld.isUseEventServer == "0") {
                ZMDataModel.zmDebug("Not sending WSS message as event server is off");
                return;
            }


            if (typeof ws === 'undefined') {
                ZMDataModel.zmDebug("Event server not initalized, not sending message");
                return;
            }


            if (ws.$status() == ws.$CLOSED) {
                ZMDataModel.zmLog("Websocket was closed, trying to re-open");
                ws.$un('$open');
                //ws.$on ('$open', openHandshake);
                ws.$open();


                ws.$on('$open', openHandshake, function () {

                    console.log(" sending " + type + " " +
                        JSON.stringify(obj));
                    ws.$emit(type, obj);

                    ws.$un('$open');
                    ws.$on('$open', openHandshake);


                });


            } else {
                ws.$emit(type, obj);
                console.log("sending " + type + " " + JSON.stringify(obj));
            }



        }

        //--------------------------------------------------------------------------
        // Called each time we resume 
        //--------------------------------------------------------------------------
        function refresh() {
            var loginData = ZMDataModel.getLogin();

            if ((!loginData.eventServer) || (loginData.isUseEventServer == "0")) {
                ZMDataModel.zmLog("No Event Server configured, skipping refresh");

                // Let's also make sure that if the socket was open 
                // we close it - this may happen if you disable it after using it

                if (typeof ws !== 'undefined') {
                    if (ws.$status() != ws.$CLOSED) {
                        ZMDataModel.zmDebug("Closing open websocket as event server was disabled");
                        ws.$close();
                    }
                }

                return;
            }

            if (typeof ws === 'undefined') {
                ZMDataModel.zmDebug("Calling websocket init");
                init();
            }

            // refresh is called when 
            // The following situations will close the socket
            // a) In iOS the client went to background -- we should reconnect
            // b) The Event Server died 
            // c) The network died
            // Seems to me in all cases we should give re-open a shot


            if (ws.$status() == ws.$CLOSED) {
                ZMDataModel.zmLog("Websocket was closed, trying to re-open");
                ws.$open();
            }


        }
        
    function pushInit()
    {
        ZMDataModel.zmLog ("Setting up push registration");
                 var push = PushNotification.init(
                    { "android": 
                     {"senderID":zm.gcmSenderId,
                      "icon":"ic_stat_notification"
                     }
                    },
                     
                     { "ios": 
                     {"alert": "true", 
                      "badge": "true", 
                      "sound": "true"}
                    }  
                     
                );
           
            
    
                push.on('registration', function(data) {
                    ZMDataModel.zmDebug("Push Notification registration ID received: "  + JSON.stringify(data));
                    $rootScope.apnsToken = data.registrationId;
                    
                    var plat = $ionicPlatform.is('ios') ? 'ios':'android';
                    
                    sendMessage('push', 
                                            {
                                             type:'token',
                                             platform:plat, 
                                             token:$rootScope.apnsToken});
                    
       
                });
                
                
                 push.on('notification', function(data) {
                     
                     var ld = ZMDataModel.getLogin();
                     if (ld.isUseEventServer=="0")
                     {
                         ZMDataModel.zmDebug("received push notification, but event server disabled. Not acting on it");
                         return;
                     }
                     console.log ("************* PUSH RECEIVED ******************");
                    console.log (JSON.stringify(data));
                     
                    // data.message,
                    // data.title,
                    // data.count,
                    // data.sound,
                    // data.image,
                    // data.additionalData
                     
                     if (data.additionalData.foreground == false)
                     {
                         // This means push notification tap in background
                         
                         ZMDataModel.zmDebug("**** NOTIFICATION TAPPED SETTING TAPPED TO 1 ****");
                        $rootScope.alarmCount="0";
                        $rootScope.isAlarm = 0;
                        $rootScope.tappedNotification = 1;
                     }
                     else
                     {
                         // alarm received in foregroun
                         //var str=data.additionalData.alarm_details;
                         var str = data.message;
                       // console.log ("***STRING: " + str + " " +str.status);
                         var eventsToDisplay=[];

                         /*console.log ("PUSH IS " + JSON.stringify(str.events));
                         var alarmtext = "";
                         for (var iter=0; iter<str.events.length; iter++)
                         {
                               // lets stack the display so they don't overwrite
                             console.log ("PUSHING " + str.events[iter].Name+": new event ("+str.events[iter].EventId+")"); 
                             
                             var evtstr  = str.events[iter].Name+": new event ("+str.events[iter].EventId+")";
                            eventsToDisplay.push(evtstr);
                             
                         }*/
                         
       
                            ZMDataModel.displayBanner('alarm', [str], 0, 5000*eventsToDisplay.length);
                        

                         $rootScope.isAlarm = 1;

                         // Show upto a max of 99 when it comes to display
                         // so aesthetics are maintained
                         if ($rootScope.alarmCount == "99")
                         {
                             $rootScope.alarmCount="99+";
                         }
                         if ($rootScope.alarmCount != "99+")
                         {
                            $rootScope.alarmCount = (parseInt($rootScope.alarmCount)+1).toString();
                         }
                     }
                });

                push.on('error', function(e) {
                     console.log ("************* PUSH ERROR ******************");
                });
    }

        return {
            refresh: refresh,
            init: init,
            sendMessage: sendMessage,
            pushInit:pushInit
            
        };


}]);