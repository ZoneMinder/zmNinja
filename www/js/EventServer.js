/* jshint -W041 */

/* jslint browser: true*/
/* global cordova,StatusBar,angular,console ,PushNotification*/

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

    var authState = connState.PENDING;




    //--------------------------------------------------------------------------
    // called when the websocket is opened
    //--------------------------------------------------------------------------
    function handleOpen(data) {

      isSocketReady = true;
      NVR.debug("EventSever: WebSocket open called with:" + JSON.stringify(data));
      var loginData = NVR.getLogin();
      NVR.log("EventSever: openHandshake: Websocket open, sending Auth");
      sendMessage("auth", {
        user: loginData.username,
        password: loginData.password,
        monlist: loginData.eventServerMonitors,
        intlist: loginData.eventServerInterval
      
      });


      if ($rootScope.apnsToken != '') {
        var plat = $ionicPlatform.is('ios') ? 'ios' : 'android';
        var ld = NVR.getLogin();
        var pushstate = "enabled";
        if (ld.disablePush == true)
          pushstate = "disabled";

        NVR.debug("EventSever: openHandShake: state of push is " + pushstate);
        // let's do this only if disabled. If enabled, I suppose registration
        // will be called?
        //if (ld.disablePush)
        //console.log ("HANDSHAKE MESSAGE WITH "+$rootScope.monstring);

        sendMessage("push", {
          type: 'token',
          platform: plat,
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
        NVR.debug ("EventSever: App closed socket, not reconnecting");
        iClosed = false;
        return;
      }

     // console.log("*********** WEBSOCKET CLOSE CALLED");

      if (!NVR.getLogin().isUseEventServer) return;

      if (!isTimerOn) {
        NVR.log("EventSever: Will try to reconnect in 10 sec..");
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
        NVR.log("EventSever: Will try to reconnect in 10 sec..");
        $timeout(init, 10000);
        isTimerOn = true;
      }
    }

    function handleMessage(smsg) {
      //NVR.debug ("Websocket received message:"+smsg);
      str = JSON.parse(smsg);
      NVR.debug("EventSever: Real-time event: " + JSON.stringify(str));



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

      if (str.status == 'Success' && (str.event == 'auth')) {
        authState = connState.SUCCESS;

        // Now handle pending messages in queue

        if (pendingMessages.length) {
          NVR.debug ("EventSever: Sending pending messages, as auth confirmation received");
          while (pendingMessages.length) {
            var p = pendingMessages.pop();
            sendMessage (p.type, p.obj);
          }
        } else {
          NVR.debug ("EventSever: auth confirmation received, no pendingMessages in queue");
        }
        
          
        

        if (str.version == undefined)
          str.version = "0.1";
        if (NVR.versionCompare(str.version, zm.minEventServerVersion) == -1) {
          $rootScope.zmPopup = $ionicPopup.alert({
            title: $translate.instant('kEventServerVersionTitle'),
            template: $translate.instant('kEventServerVersionBody1') + " " + str.version + ". " + $translate.instant('kEventServerVersionBody2') + " " +
              zm.minEventServerVersion,
            okText: $translate.instant('kButtonOk'),
            cancelText: $translate.instant('kButtonCancel'),
          });
        }

      }

      if (str.status == 'Success' && str.event == 'alarm') // new events
      {

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
          NVR.debug("EventSever: received supplementary event information over websockets");
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

            NVR.debug("EventSever: App is in foreground, displaying banner");
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
        }
      }


    }

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
        NVR.log("EventSever: No Event Server present. Not initializing");
        d.reject("false");
        return d.promise;
      }

      NVR.log("EventSever: Initializing Websocket with URL " +
        loginData.eventServer);

      pendingMessages = [];
      authState = connState.PENDING;
      isSocketReady = false;

      if ($rootScope.platformOS == 'desktop') {
        NVR.debug("EventSever: Using browser websockets...");
        return setupDesktopSocket();
      } else {
        NVR.debug("EventSever: Using native websockets...");
        return setupMobileSocket();

      }


    }


    function setupMobileSocket() {

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
          if (!pushInited) {
            NVR.debug("EventSever: Initializing FCM push");
            pushInit();
          }
          d.resolve(true);
          return d.promise;
        },
        function (error) {
          NVR.debug("EventSever: Failed to connect to WebSocket: " +
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

      NVR.log("EventSever: Clearing error/close cbk, disconnecting and deleting Event Server socket...");

      if ($rootScope.platformOS == 'desktop') {
        if (typeof ws === 'undefined') {
          NVR.log("EventSever: Event server socket is empty, nothing to disconnect");
          return;
        }


        ws.onmessage = null;
        iClosed = true;
        ws.close();
        ws = undefined;
      } else {
        if (nativeWebSocketId != -1) //native;
        {
          NVR.debug ("EventSever: Closing native websocket as websocket = "+nativeWebSocketId);
          iClosed = true;
          CordovaWebsocketPlugin.wsClose(nativeWebSocketId, 1000, "Connection closed");
          nativeWebSocketId = -1;
        }
        

      }


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

      var msg = {
        'event': type,
        'data': obj
      };

      var jmsg = JSON.stringify(msg);
      NVR.debug("EventSever: sendMessage: received->" + jmsg);


      var ld = NVR.getLogin();
      if (ld.isUseEventServer == false && isForce != 1) {
        NVR.debug("EventSever: Not sending WSS message as event server is off");
        return;
      }

      if (typeof ws === 'undefined' && nativeWebSocketId == -1) {
        NVR.debug("EventSever: not initalized, not sending message");
        return;
      }

      if (isSocketReady == false) {

        NVR.debug ("EventSever: Connection not yet ready, adding message to queue");
        pendingMessages.push ({type:type, obj:obj});
        return;
      }

      if (authState == connState.REJECT && type != 'auth') {
        NVR.debug ("EventSever: ERROR: ES rejected authentication, not sending message");
        return;
      }

      if ( authState == connState.PENDING && type != 'auth') {
        NVR.debug ("EventSever: Connection not yet authenticated, adding message to queue");
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
          NVR.debug ("EventSever: Exception sending ES message: "+JSON.stringify(e));
        }
        
      } else {
        if (nativeWebSocketId != -1)
          CordovaWebsocketPlugin.wsSend(nativeWebSocketId, jmsg);
        else
          NVR.debug("EventSever: ERROR:native websocket not initialized, can't send " + jmsg);
      }


    }

    //--------------------------------------------------------------------------
    // Called each time we resume 
    //--------------------------------------------------------------------------
    function refresh() {
      var loginData = NVR.getLogin();

      if ((!loginData.eventServer) || (loginData.isUseEventServer == false)) {
        NVR.log("EventSever: No Event Server configured, skipping refresh");

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
        NVR.debug("EventSever: Calling websocket init");
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
      NVR.log("EventSever: Setting up push registration");
      var push;
      var mediasrc;
      var media;
      var ld = NVR.getLogin();

      //var plat = $ionicPlatform.is('ios') ? 'ios' : 'android';
      var plat = $rootScope.platformOS;

      if ($rootScope.platformOS == 'desktop') {
       NVR.log ('Not setting up push as this is desktop.');
        return;
      }

      if (plat == 'ios') {
        mediasrc = "sounds/blop.mp3";
        push = PushNotification.init(

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

        );

      } else {
        mediasrc = "/android_asset/www/sounds/blop.mp3";
        var android_media_file = "blop";

        push = PushNotification.init(

          {
            "android": {
              // "senderID": zm.gcmSenderId,
              "icon": "ic_stat_notification",
              sound: "true",
              vibrate: ld.vibrateOnPush
              //"sound": android_media_file
            }
          }

        );

      }

      // console.log("*********** MEDIA BLOG IS " + mediasrc);
      media = $cordovaMedia.newMedia(mediasrc);


      push.on('registration', function (data) {
        pushInited = true;
        NVR.debug("EventSever: Push Notification registration ID received: " + JSON.stringify(data));
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
                NVR.debug("EventSever: loading saved monitor list and interval of " + monstring + ">>" + intstring);

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
              NVR.log("EventSever: Could not get monitors, can't send push reg");
            });

      });

      push.on('notification', function (data) {

        $ionicPlatform.ready(function () {
          NVR.log("EventSever: notification handler device ready");
          NVR.debug("EventSever: received push notification");

          var ld = NVR.getLogin();
          if (ld.isUseEventServer == false) {
            NVR.debug("EventSever: received push notification, but event server disabled. Not acting on it");
            return;
          }

          if (data.additionalData.foreground == false) {
            // This means push notification tap in background

            NVR.debug("EventSever: PUSH NOTF >>> " + JSON.stringify(data));

            // set tappedMid to monitor 
            //*** PUSH DATA>>>>{"sound":"blop","message":"Alarms: Basement (2854) ","additionalData":{"mid":"2","coldstart":false,"collapse_key":"do_not_collapse","foreground":false}}

            if (data.additionalData.dismissed != undefined || data.additionalData.coldstart == true || $rootScope.platformOS == 'ios') // user tapped on notification
            // in iOS case, since content-av is not there this notification won't be called unless you tap
            {
              NVR.debug("Notification Tapped");
              $rootScope.alarmCount = "0";
              $rootScope.isAlarm = 0;
              $rootScope.tappedNotification = 1;

              var mid;
              var eid;

              // we are using FCM on IOS too 
              /*  if ($rootScope.platformOS == 'ios') {
                    mid = data.additionalData.gcm.notification.mid;
                    eid = data.additionalData.gcm.notification.eid;

                }
                else {*/

              mid = data.additionalData.mid;
              eid = data.additionalData.eid;
              // }



              // if Multiple mids, take the first one
              var mi = mid.indexOf(',');
              if (mi > 0) {
                mid = mid.slice(0, mi);
              }
              mid = parseInt(mid);

              $rootScope.tappedMid = mid;
              $rootScope.tappedEid = eid;
              NVR.log("EventSever: Push notification: Tapped Monitor taken as:" + $rootScope.tappedMid);

              if ($rootScope.platformOS == 'ios') {

                NVR.debug("EventSever: iOS only: clearing background push");
                push.finish(function () {
                  NVR.debug("EventSever: processing of push data is finished");
                });
              }

            } else {
              NVR.debug("EventSever: App started via icon, not notification tap");
              $rootScope.tappedNotification = 0;
              $rootScope.tappedEid = 0;
              $rootScope.tappedMid = 0;
            }
            // keep this emit not broadcast
            // see Portal latch for reason

            //https://stackoverflow.com/a/22651128/1361529
            $timeout ( function () {
              NVR.debug ("EventServer: broadcasting process-push");
              $rootScope.$broadcast('process-push');
            },100);
          

          } else // app is foreground
          {

            // this flag honors the HW mute button. Go figure
            // http://ilee.co.uk/phonegap-plays-sound-on-mute/

            NVR.debug("EventSever: --> *** PUSH IN FOREGROUND");

            $rootScope.tappedNotification = 0;
            $rootScope.tappedEid = 0;
            $rootScope.tappedMid = 0;

            if (ld.soundOnPush) {
              media.play({
                playAudioWhenScreenIsLocked: false
              });
            }

            var str = data.message;
            // console.log ("***STRING: " + str + " " +str.status);
            var eventsToDisplay = [];

            NVR.displayBanner('alarm', [str], 0, 5000 * eventsToDisplay.length);

            $rootScope.isAlarm = 1;

            // Show upto a max of 99 when it comes to display
            // so aesthetics are maintained
            if ($rootScope.alarmCount == "99") {
              $rootScope.alarmCount = "99+";
            }
            if ($rootScope.alarmCount != "99+") {
              $rootScope.alarmCount = (parseInt($rootScope.alarmCount) + 1).toString();
            }

          

          }
        });
      });

      push.on('error', function (e) {
        NVR.debug("EventSever: Push error: " + JSON.stringify(e));
        // console.log("************* PUSH ERROR ******************");
      });
    }

    return {
      refresh: refresh,
      init: init,
      sendMessage: sendMessage,
      pushInit: pushInit,
      disconnect: disconnect

    };

  }]);
