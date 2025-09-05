/* jshint -W041 */

/* jslint browser: true*/
/* global cordova,StatusBar,angular,console ,PushNotification, FirebasePlugin*/

//--------------------------------------------------------------------------
// This factory interacts with the ZM Event Server
// over websockets and is responsible for rendering real time notifications
//--------------------------------------------------------------------------

angular.module('zmApp.controllers')
  .factory('EventServer', ['NVR', '$rootScope', '$websocket', '$ionicPopup', '$timeout', '$q', 'zm', '$ionicPlatform', '$cordovaMedia', '$translate', function (NVR, $rootScope, $websocket, $ionicPopup, $timeout, $q, zm, $ionicPlatform, $cordovaMedia, $translate) {

    var ws;

    var localNotificationId = 0;
    var pushInited = false;
    var isTimerOn = false;
    var nativeWebSocketId = -1;
    var iClosed = false;
    var isSocketReady = false;
    var pendingMessages = [];
    var connState = {
        PENDING: 0,
        SUCCESS: 1,
        REJECT: 2
    };
    var connText = ['Pending Auth', 'Connected', 'Rejected'];

    var authState = connState.PENDING;


    //--------------------------------------------------------------------------
    // called when the websocket is opened
    //--------------------------------------------------------------------------
    function handleOpen(data) {
      isSocketReady = true;
      NVR.debug("EventServer: WebSocket open called with:" + JSON.stringify(data));
      var loginData = NVR.getLogin();
      NVR.log("EventServer: openHandshake: Websocket open, sending Auth");
      sendMessage("auth", {
        user: loginData.username,
        password: loginData.password,
        monlist: loginData.eventServerMonitors,
        intlist: loginData.eventServerInterval
      });

      if ($rootScope.apnsToken != '') {
       // var plat = $ionicPlatform.is('ios') ? 'ios' : 'android';
        var ld = NVR.getLogin();
        var pushstate = ld.disablePush == true ? "disabled" : "enabled";

        NVR.debug("EventServer: openHandShake: state of push is " + pushstate);
        // let's do this only if disabled. If enabled, I suppose registration
        // will be called?
        //if (ld.disablePush)
        //console.log ("HANDSHAKE MESSAGE WITH "+$rootScope.monstring);

        sendMessage("push", {
          type: 'token',
          platform: $rootScope.platformOS,
          token: $rootScope.apnsToken,
          monlist: $rootScope.monstring,
          intlist: $rootScope.intstring,
          state: pushstate
        });
      }
    }

    function handleClose(event) {
      isSocketReady = false;
      pendingMessages = [];
      authState = connState.PENDING;

      if (iClosed) {
        NVR.debug("EventServer: App closed socket, not reconnecting");
        iClosed = false;
        return;
      }

     // console.log("*********** WEBSOCKET CLOSE CALLED");

      if (!NVR.getLogin().isUseEventServer) return;

      if (!isTimerOn) {
        NVR.log("EventServer: Will try to reconnect in 10 sec..");
        $timeout(init, 10000);
        isTimerOn = true;
      }
    }

    function handleError(event) {
     // console.log("*********** WEBSOCKET ERROR CALLED");
      if (!NVR.getLogin().isUseEventServer) return;

      isSocketReady = false;
      pendingMessages = [];
      authState = connState.PENDING;

      if (!isTimerOn) {
        NVR.log("EventServer: Will try to reconnect in 10 sec..");
        $timeout(init, 10000);
        isTimerOn = true;
      }
    }

    function handleMessage(smsg) {
      //NVR.debug ("Websocket received message:"+smsg);
      str = JSON.parse(smsg);
      NVR.debug("EventServer: Real-time event: " + JSON.stringify(str));

      // Error messages
      if (str.status != 'Success') {
        NVR.log("EventServer: Error: " + JSON.stringify(str));

        if (str.reason == 'APNSDISABLED') {
          console.log("FORCE CLOSING");
          iClosed=true;
          ws.close();
          NVR.displayBanner('error', ['Event Server: APNS disabled'], 2000, 6000);
          $rootScope.apnsToken = "";
        }
      }

      if (str.status == 'Success' ) {
        if (str.event == 'auth') {
          authState = connState.SUCCESS;

          // Now handle pending messages in queue

          if (pendingMessages.length) {
            NVR.debug("EventServer: Sending pending messages, as auth confirmation received");
            while (pendingMessages.length) {
              var p = pendingMessages.pop();
              sendMessage(p.type, p.obj);
            }
          } else {
            NVR.debug("EventServer: auth confirmation received, no pendingMessages in queue");
          }

          if (str.version == undefined)
            str.version = "0.1";
          //console.log ('************* COMPARING '+str.version+'to '+zm.minEventServerVersion);
          if (NVR.versionCompare(str.version, zm.minEventServerVersion) == -1) {
            $rootScope.zmPopup = $ionicPopup.alert({
              title: $translate.instant('kEventServerVersionTitle'),
              template: $translate.instant('kEventServerVersionBody1') + " " + str.version + ". " + $translate.instant('kEventServerVersionBody2') + " " +
              zm.minEventServerVersion,
              okText: $translate.instant('kButtonOk'),
              cancelText: $translate.instant('kButtonCancel'),
            });
          }
        } else if (str.event == 'alarm') {
          // new events

          var localNotText;
          // ZMN specific hack for Event Server
          if (str.supplementary != 'true') {
            new Audio('sounds/blop.mp3').play();
            localNotText = "";
            $rootScope.isAlarm = 1;

            // Show upto a max of 99 when it comes to display
            // so aesthetics are maintained
            if ($rootScope.alarmCount == "99") {
              $rootScope.alarmCount = "99+";
            }
            if ($rootScope.alarmCount != "99+") {
              $rootScope.alarmCount = (parseInt($rootScope.alarmCount) + 1).toString();
            }

          } else {
            NVR.debug("EventServer: received supplementary event information over websockets");
          }
          var eventsToDisplay = [];
          var listOfMonitors = [];
          for (var iter = 0; iter < str.events.length; iter++) {
            // lets stack the display so they don't overwrite
            //eventsToDisplay.push(str.events[iter].Name + ": latest new alarm (" + str.events[iter].EventId + ")");
            var txt = str.events[iter].EventId;
            if (str.events[iter].Cause) {
              txt = str.events[iter].Cause;
            }
            eventsToDisplay.push(str.events[iter].Name + ": " + txt);
            localNotText = localNotText + str.events[iter].Name + ": " + txt + ",";
            listOfMonitors.push(str.events[iter].MonitorId);
          }
          localNotText = localNotText.substring(0, localNotText.length - 1);

          // if we are in background, do a local notification, else do an in app display
          if (!NVR.isBackground()) {
            //emit alarm details - this is when received over websockets
            $rootScope.$broadcast('alarm', {
              message: listOfMonitors
            });

            if (str.supplementary != 'true') {
              NVR.debug("EventServer: App is in foreground, displaying banner");
              if (eventsToDisplay.length > 0) {
                if (eventsToDisplay.length == 1) {
                  //console.log("Single Display: " + eventsToDisplay[0]);
                  NVR.displayBanner('alarm', [eventsToDisplay[0]], 5000, 5000);
                } else {
                  NVR.displayBanner('alarm', eventsToDisplay,
                    5000, 5000 * eventsToDisplay.length);
                }
              }
            }
          } // end if ! NVR.isBackground
        } // end if type == alarm | auth
      } // end if status == success
    } // end function handleMessage

    //--------------------------------------------------------------------------
    // Called once at app start. Does a lazy definition of websockets open
    //--------------------------------------------------------------------------
    function init() {
      $rootScope.isAlarm = 0;
      $rootScope.alarmCount = "0";
      isTimerOn = false;

      var d = $q.defer();
      var loginData = NVR.getLogin();

      if (loginData.isUseEventServer == false || !loginData.eventServer) {
        NVR.log("EventServer: No Event Server present. Not initializing");
        d.reject("false");
        return d.promise;
      }

      NVR.log("EventServer: Initializing Websocket with URL " +
        loginData.eventServer);

      pendingMessages = [];
      authState = connState.PENDING;
      isSocketReady = false;

      if ($rootScope.platformOS == 'desktop') {
        NVR.debug("EventServer: Using browser websockets...");
        return setupDesktopSocket();
      } else {
        NVR.debug("EventServer: Using native websockets...");
        return setupMobileSocket();
      }
    } // end function init()


    function setupMobileSocket() {
      if (!pushInited) {
        NVR.debug("Calling pushInit()");
        pushInit();
      } else {
        NVR.debug("pushInit() already done");
      }

      var loginData = NVR.getLogin();
      var d = $q.defer();

      var wsOptions = {
        url: loginData.eventServer,
        acceptAllCerts: !loginData.enableStrictSSL
      };

      CordovaWebsocketPlugin.wsConnect(wsOptions,
        function (recvEvent) {
          //console.log("Received callback from WebSocket: " + recvEvent.callbackMethod);
          if (recvEvent.callbackMethod == 'onMessage') {
            handleMessage(recvEvent.message);
          } else if (recvEvent.callbackMethod == 'onClose') {
            handleClose();
          } else if (recvEvent.callbackMethod == 'onFail') {
            handleError();
          }
        },
        function (success) {
         // console.log("Connected to WebSocket with id: " + success.webSocketId);
          nativeWebSocketId = success.webSocketId;
          handleOpen(success);
          d.resolve(true);
          return d.promise;
        },
        function (error) {
          NVR.debug("EventServer: Failed to connect to WebSocket: " +
            "code: " + error.code +
            ", reason: " + error.reason +
            ", exception: " + error.exception);
          d.resolve(false);
          return d.promise;
        }
      );
      return d.promise;
    }
    
    function setupDesktopSocket() {
      var loginData = NVR.getLogin();
      var d = $q.defer();
      ws = new WebSocket(loginData.eventServer);

      ws.onopen = function (event) {
        handleOpen(event.data);
        if (!pushInited) {
          NVR.debug("Initializing FCM push");
          pushInit();
        }
        d.resolve("true");
        return d.promise;
      };

      ws.onclose = function (event) {
        handleClose(event);
        d.reject("error");
        return d.promise;
      };

      ws.onerror = function (event) {
        handleError(event);
        d.reject("error");
        return d.promise;
      };

      ws.onmessage = function (event) {
        var smsg = event.data;
        handleMessage(smsg);
      };

      return d.promise;
    }

    function disconnect() {
      authState = connState.PENDING;
      pendingMessages = [];
      isSocketReady = false;

      NVR.log("EventServer: Clearing error/close cbk, disconnecting and deleting Event Server socket...");

      if ($rootScope.platformOS == 'desktop') {
        if (typeof ws === 'undefined') {
          NVR.log("EventServer: Event server socket is empty, nothing to disconnect");
          return;
        }

        ws.onmessage = null;
        iClosed = true;
        ws.close();
        ws = undefined;
      } else {
        if (nativeWebSocketId != -1) //native;
        {
          NVR.debug ("EventServer: Closing native websocket as websocket = "+nativeWebSocketId);
          iClosed = true;
          CordovaWebsocketPlugin.wsClose(nativeWebSocketId, 1000, "Connection closed");
          nativeWebSocketId = -1;
        }
      }
    }

    function getState() {
      if (!NVR.getLogin().isUseEventServer) return "disabled";
      return connText[authState];
    }

    //--------------------------------------------------------------------------
    // Send an arbitrary object to the Event Serve
    // currently planned to use it for device token
    // isForce =1 when you need to send the message even
    // if config says ES is off. This may happen when 
    // you turn off ES and then we need sendMessage to
    // let ZMES know not to send us messages
    //--------------------------------------------------------------------------
    function sendMessage(type, obj, isForce) {

      obj.appversion = NVR.getAppVersion();
      var msg = {
        'event': type,
        'data': obj,
        'token': $rootScope.apnsToken
      };

      var jmsg = JSON.stringify(msg);
      NVR.debug("EventServer: sendMessage: received->" + jmsg);

      var ld = NVR.getLogin();
      if (ld.isUseEventServer == false && isForce != 1) {
        NVR.debug("EventServer: Not sending WSS message as event server is off");
        return;
      }

      if (typeof ws === 'undefined' && nativeWebSocketId == -1) {
        NVR.debug("EventServer: not initalized, not sending message");
        return;
      }

      if (isSocketReady == false) {
        NVR.debug("EventServer: Connection not yet ready, adding message to queue");
        pendingMessages.push ({type:type, obj:obj});
        return;
      }

      if (($rootScope.platformOS != 'desktop') && (!$rootScope.apnsToken) ) {
        NVR.debug('Mobile platform does not have a token yet, adding message to queue');
        pendingMessages.push ({type:type, obj:obj});
        return;
      }

      if (authState == connState.REJECT && type != 'auth') {
        NVR.debug("EventServer: ERROR: ES rejected authentication, not sending message");
        return;
      }

      if (authState == connState.PENDING && type != 'auth') {
        NVR.debug("EventServer: Connection not yet authenticated, adding message to queue");
        pendingMessages.push ({type:type, obj:obj});
        return;
      }
      // console.log (">>>>>>>>>>>>>>>>>EVENT SERVER SENDING: type="+type+" DATA="+JSON.stringify(obj));

      NVR.debug("EventServer: ok to send message");
  
      if ($rootScope.platformOS == 'desktop') {
        try {
          ws.send(jmsg);
        }
        catch (e)  {
          NVR.debug ("EventServer: Exception sending ES message: "+JSON.stringify(e));
        }
      } else {
        if (nativeWebSocketId != -1)
          CordovaWebsocketPlugin.wsSend(nativeWebSocketId, jmsg);
        else
          NVR.debug("EventServer: ERROR:native websocket not initialized, can't send " + jmsg);
      }
    } // end function sendMessage(type, obj, isForce)

    //--------------------------------------------------------------------------
    // Called each time we resume 
    //--------------------------------------------------------------------------
    function refresh() {
      var loginData = NVR.getLogin();

      if ((!loginData.eventServer) || (loginData.isUseEventServer == false)) {
        NVR.log("EventServer: No Event Server configured, skipping refresh");

        // Let's also make sure that if the socket was open 
        // we close it - this may happen if you disable it after using it

        if (typeof ws !== 'undefined') {
          /*(if (ws.$status() != ws.$CLOSED)
          {
              NVR.debug("Closing open websocket as event server was disabled");
              ws.$close();
          }*/
        }

        return;
      }

      if (typeof ws === 'undefined') {
        NVR.debug("EventServer: Calling websocket init");
        init();
      }

      // refresh is called when 
      // The following situations will close the socket
      // a) In iOS the client went to background -- we should reconnect
      // b) The Event Server died 
      // c) The network died
      // Seems to me in all cases we should give re-open a shot

      /*if (ws.$status() == ws.$CLOSED)
      {
          NVR.log("Websocket was closed, trying to re-open");
          ws.$open();
      }*/
    }

    function pushInit() {
      NVR.log("EventServer: Setting up push registration");
      var push;
      var mediasrc;
      var media;
      var ld = NVR.getLogin();

      //var plat = $ionicPlatform.is('ios') ? 'ios' : 'android';
      var plat = $rootScope.platformOS;

      if ($rootScope.platformOS == 'desktop') {
        NVR.log('push: Not setting up push as this is desktop.');
        return;
      }
     
      if (!window.FirebasePlugin) {
        NVR.log('ERROR: Firebase is not included.');
        return;
      }
      // get permission if we need it
      window.FirebasePlugin.hasPermission(function(hasPermission){
        if (!hasPermission) {
          window.FirebasePlugin.grantPermission(function(hasPermission){
            if (hasPermission) {
              NVR.debug ('push: permission granted, waiting for token');
            } else {
              NVR.log('ERROR: push: Permission not granted for push');
            }
          });
        } else {
          NVR.debug('push: permissions are already enabled');
        }
      });

      if ($rootScope.platformOS == 'android') {
        // Define custom  channel - all keys are except 'id' are optional.
        var channel  = {
          // channel ID - must be unique per app package
          id: "zmninja",
          // Channel description. Default: empty string
          description: "zmNinja push",
          // Channel name. Default: empty string
          name: "zmNinja",
          //The sound to play once a push comes. Default value: 'default'
          //Values allowed:
          //'default' - plays the default notification sound
          //'ringtone' - plays the currently set ringtone
          //'false' - silent; don't play any sound
          //filename - the filename of the sound file located in '/res/raw' without file extension (mysound.mp3 -> mysound)
          sound: "default",

          //Vibrate on new notification. Default value: true
          //Possible values:
          //Boolean - vibrate or not
          //Array - vibration pattern - e.g. [500, 200, 500] - milliseconds vibrate, milliseconds pause, vibrate, pause, etc.
          vibration: true,
          // Whether to blink the LED
          light: true,
          //LED color in ARGB format - this example BLUE color. If set to -1, light color will be default. Default value: -1.
          lightColor: parseInt("FF0000FF", 16).toString(),
          //Importance - integer from 0 to 4. Default value: 4
          //0 - none - no sound, does not show in the shade
          //1 - min - no sound, only shows in the shade, below the fold
          //2 - low - no sound, shows in the shade, and potentially in the status bar
          //3 - default - shows everywhere, makes noise, but does not visually intrude
          //4 - high - shows everywhere, makes noise and peeks
          importance: 4,

          //Show badge over app icon when non handled pushes are present. Default value: true
          badge: true,

          //Show message on locked screen. Default value: 1
          //Possible values (default 1):
          //-1 - secret - Do not reveal any part of the notification on a secure lockscreen.
          //0 - private - Show the notification on all lockscreens, but conceal sensitive or private information on secure lockscreens.
          //1 - public - Show the notification in its entirety on all lockscreens.
          visibility: 1
        };

        // Create the channel
        window.FirebasePlugin.createChannel(channel, function(){
          NVR.debug('push: Channel created: ' + channel.id);
        },
        function(error){
          NVR.debug('push: Create channel error: ' + error);
        });
      }

      if ($rootScope.platformOS == 'ios') {
        if (ld.isUseEventServer) {
          NVR.debug ('push: ios, setting badge alarm count at start');
          window.FirebasePlugin.getBadgeNumber(function(cnt) {
            if (cnt) {
              NVR.debug('push: ios, badge is:'+cnt);
              $rootScope.isAlarm = 1;
              $rootScope.alarmCount = cnt;
              if ($rootScope.alarmCount > 99) {
                $rootScope.alarmCount = '99+';
              }
            }
          });
        }
      } // ios
      //
      // called when token is assigned
      window.FirebasePlugin.onTokenRefresh(
        function (token) {
          NVR.debug("push: got token:"+token);
          $rootScope.apnsToken = token;
          NVR.debug ('push: setting up onMessageReceived...');
          window.FirebasePlugin.onMessageReceived(function(message) {
            $ionicPlatform.ready(function () {

              NVR.debug("push: EventServer: received push notification with payload:"+JSON.stringify(message));

              if ($rootScope.platformOS != 'desktop') {
                NVR.debug ("push: clearing badge");
                window.FirebasePlugin.setBadgeNumber(0);
              }
              
              var ld = NVR.getLogin();
              if (ld.isUseEventServer == false) {
                NVR.debug("push: EventServer: received push notification, but event server disabled. Not acting on it");
                return;
              }
              NVR.debug('push: Message type received is:'+message.messageType);
              
              sendMessage('push', {
                type: 'badge',
                badge: 0,
              });
              var mid;
              var eid = message.eid;
              if (message.mid) {
                mid = message.mid;
                var mi = mid.indexOf(',');
                if (mi > 0) {
                  mid = mid.slice(0, mi);
                }
                mid = parseInt(mid);
              }
              
              if (message.tap=='foreground') {
                console.log ('push: Foreground');
                $rootScope.tappedNotification = 0;
                $rootScope.tappedEid = 0;
                $rootScope.tappedMid = 0;

                if (ld.soundOnPush) {
                  media.play({
                    playAudioWhenScreenIsLocked: false
                  });
                }
                if ($rootScope.alarmCount == "99") {
                  $rootScope.alarmCount = "99+";
                }
                if ($rootScope.alarmCount != "99+") {
                  $rootScope.alarmCount = (parseInt($rootScope.alarmCount) + 1).toString();
                }
                $rootScope.isAlarm = 1;

              } else if (message.tap == 'background') {
                $rootScope.alarmCount = "0";
                $rootScope.isAlarm = 0;
                $rootScope.tappedNotification = 1;
                $rootScope.tappedMid = mid;
                $rootScope.tappedEid = eid;
                NVR.log("EventServer: Push notification: Tapped Monitor taken as:" + $rootScope.tappedMid);
  
                $timeout ( function () {
                  NVR.debug ("EventServer: broadcasting process-push");
                  $rootScope.$broadcast('process-push');
                },100);
  
              } else {
                NVR.debug ("push: message tap not defined");
                $rootScope.tappedNotification = 0;
                $rootScope.tappedEid = 0;
                $rootScope.tappedMid = 0;
              }

            }); // ready
          });
        }, 
        function (err) {
          NVR.debug ('push: Error getting token:'+err);
        });

      if (plat == 'ios') {
        mediasrc = "sounds/blop.mp3";
       /* push = PushNotification.init(

          {
            "ios": {
              "alert": "true",
              "badge": "true",
              "sound": "true",
              //"sound": "true",
              "clearBadge": "true",
              //"fcmSandbox": "true"
            }
          }

        );*/

      } else {
        mediasrc = "/android_asset/www/sounds/blop.mp3";
        var android_media_file = "blop";

       /* push = PushNotification.init(

          {
            "android": {
              // "senderID": zm.gcmSenderId,
              "icon": "ic_stat_notification",
              sound: "true",
              vibrate: "true",
              //"sound": android_media_file
            }
          }

        );*/

      }

     /* PushNotification.hasPermission(function (succ) {
        NVR.debug ("Push permission returned: "+JSON.stringify(succ));
      }, function (err) {
        NVR.debug ("Push permission error returned: "+JSON.stringify(err));
      });*/
      // console.log("*********** MEDIA BLOG IS " + mediasrc);

      try {
        media = $cordovaMedia.newMedia(mediasrc);  
      }
      catch (err) {
        NVR.debug ("Media init error:"+JSON.stringify(err));
      }

      /*
      push.on('registration', function (data) {
        pushInited = true;
        NVR.debug("EventServer: Push Notification registration ID received: " + JSON.stringify(data));
        $rootScope.apnsToken = data.registrationId;

        var plat = $rootScope.platformOS;
        var ld = NVR.getLogin();
        var pushstate = "enabled";
        if (ld.disablePush == true)
          pushstate = "disabled";

        // now at this stage, if this is a first registration
        // zmeventserver will have no record of this token
        // so we need to make sure we send it a legit list of 
        // monitors otherwise users will get notifications for monitors
        // their login is not supposed to see. Refer #391

        var monstring = '';
        var intstring = '';
        NVR.getMonitors()
          .then(function (succ) {
              var mon = succ;

              if (ld.eventServerMonitors != '') {
                // load previous monlist and intlist
                // so we don't overwrite 
                monstring = ld.eventServerMonitors;
                intstring = ld.eventServerInterval;
                NVR.debug("EventServer: loading saved monitor list and interval of " + monstring + ">>" + intstring);

              } else { // build new list

                for (var i = 0; i < mon.length; i++) {
                  monstring = monstring + mon[i].Monitor.Id + ",";
                  intstring = intstring + '0,';
                }
                if (monstring.charAt(monstring.length - 1) == ',')
                  monstring = monstring.substr(0, monstring.length - 1);

                if (intstring.charAt(intstring.length - 1) == ',')
                  intstring = intstring.substr(0, intstring.length - 1);

              }

              $rootScope.monstring = monstring;
              $rootScope.intstring = intstring;

              sendMessage('push', {
                type: 'token',
                platform: plat,
                token: $rootScope.apnsToken,
                monlist: monstring,
                intlist: intstring,
                state: pushstate
              }, 1);

            },
            function (err) {
              NVR.log("EventServer: Could not get monitors, can't send push reg");
            });

      }); */
      
      // add push code here
    
    }

    return {
      refresh: refresh,
      init: init,
      sendMessage: sendMessage,
      getState:getState,
      pushInit: pushInit,
      disconnect: disconnect
    };
  }]);
