/* jshint -W041 */


/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

    //--------------------------------------------------------------------------
    // This factory interacts with the ZM Event Server
    // over websockets and is responsible for rendering real time notifications
    //--------------------------------------------------------------------------

angular.module('zmApp.controllers')
    
.factory('EventServer', 
[  'ZMDataModel', '$rootScope','$websocket', '$ionicPopup', '$cordovaLocalNotification', '$cordovaBadge', function 
 (  ZMDataModel, $rootScope, $websocket, $ionicPopup,$cordovaLocalNotification, $cordovaBadge) {
     
     
    var ws;
     // Display a max of 5 local notifications
    var localNotificationId=5;

    //--------------------------------------------------------------------------
    // Called once at app start. Does a lazy definition of websockets open
    //--------------------------------------------------------------------------
     function init()
     {
         $rootScope.isAlarm = 0;
         $rootScope.alarmCount="0";
         
         var loginData = ZMDataModel.getLogin();
         
         if (loginData.isUseEventServer =='0' || !loginData.eventServer)
         {
             ZMDataModel.zmLog("No Event Server present. Not initializing");
             return;
         }
         
         
        ZMDataModel.zmLog("Initializing Websocket with URL " + 
                             loginData.eventServer+" , will connect later...");
           ws = $websocket.$new ({
                      url:loginData.eventServer,
                      reconnect:true,
                      reconnectInterval:5000,
                      lazy:true
                  });
 
         
            // Transmit auth information to server              
            ws.$on ('$open', function() {
                ZMDataModel.zmLog("Websocket open");
                 ws.$emit('auth',
                          {user:loginData.username,
                           password:loginData.password});
              
            });

           ws.$on ('$close', function() {
               ZMDataModel.zmLog ("Websocket closed");
               
            });

            // Handles responses back from ZM ES
             ws.$on ('$message', function(str) {
                 ZMDataModel.zmLog("Real-time event: " + JSON.stringify(str));
                 if (str.status != 'Success')
                 {
                     ZMDataModel.zmLog ("Event Error: " + JSON.stringify(str));
                     ws.$close();
                     ZMDataModel.displayBanner('error',['Event server rejected credentials', 'Please re-check credentials'],2000,6000);
                    
                 }
                 
                 var localNotText = "New Alarms: ";
                 if (str.status == 'Success' && str.events) // new events
                 {
                     var eventsToDisplay=[];
                     for (var iter=0; iter<str.events.length; iter++)
                     {
                           // lets stack the display so they don't overwrite
                         eventsToDisplay.push(str.events[iter].Name+": new event ("+str.events[iter].EventId+")");
                         localNotText = localNotText + str.events[iter].Name+",";
                         
                         
                     }
                     localNotText = localNotText.substring(0, localNotText.length - 1);
                   
                     // if we are in background, do a local notification, else do an in app display
                     if (!ZMDataModel.isBackground())
                     {
                         ZMDataModel.zmDebug("App is in foreground, displaying banner");
                         if (eventsToDisplay.length > 0)
                         {

                            ZMDataModel.displayBanner('alarm', eventsToDisplay, 5000, 5000*eventsToDisplay.length);

                         }
                     }
                     else
                     {
                         ZMDataModel.zmDebug("App is in background, displaying localNotification");
                        localNotificationId--;
                         
                         if ( localNotificationId == 0) // only show last 5
                         {
                             localNotificationId = 5;
                             
                         }
                         // This is how I am reusing local notifications
                         // I really don't want to stack local notififcations beyond 5
                         if ($cordovaLocalNotification.isPresent(localNotificationId))
                         {
                             ZMDataModel.zmDebug("Cancelling notification ID " + localNotificationId);
                             $cordovaLocalNotification.cancel(localNotificationId);
                         }
                        
                         ZMDataModel.zmDebug("Creating notification ID " + localNotificationId + " with " +localNotText);
                        $cordovaLocalNotification.schedule({
                            id: localNotificationId,
                            title: 'ZoneMinder Alarms',
                            text: localNotText,
                            sound:"file://sounds/blop.mp3"
                            
                          }).then(function (result) {
                            // do nothing for now
                          });
                         
                    
                     }
                           // lets set badge of app irrespective of background or foreground
                           $cordovaBadge.hasPermission().then(function(yes) {
                            
                             $cordovaBadge.set($rootScope.alarmCount).then(function() {
                                // You have permission, badge set.
                                 ZMDataModel.zmDebug("Setting badge to " + $rootScope.alarmCount);
                              }, function(err) {
                                // You do not have permission.
                                 ZMDataModel.zmDebug("Error Setting badge to " + $rootScope.alarmCount);
                              });

                             
                            // You have permission
                          }, function(no) {
                             ZMDataModel.zmDebug("zmNinja does not have badge permissions. Please check your phone notification settings");
                          });
                     
                     
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
         
         
     }
    
     //--------------------------------------------------------------------------
    // Called each time we resume 
    //--------------------------------------------------------------------------
     function refresh()
     {
          var loginData = ZMDataModel.getLogin();
         
         if ((!loginData.eventServer) || (loginData.isUseEventServer=="0"))
         {
             ZMDataModel.zmLog("No Event Server configured, skipping refresh");
             
             // Let's also make sure that if the socket was open 
             // we close it - this may happen if you disable it after using it
             
             if (typeof ws !== 'undefined')
             {
                 if (ws.$status() != ws.$CLOSED)
                 {
                        ZMDataModel.zmDebug("Closing open websocket as event server was disabled");
                        ws.$close();
                 }
             }
             
             return;
         }
         
         if (typeof ws === 'undefined')
         {
             ZMDataModel.zmDebug ("Calling websocket init");
             init();
         }
         
         // refresh is called when 
         // The following situations will close the socket
         // a) In iOS the client went to background -- we should reconnect
         // b) The Event Server died 
         // c) The network died
         // Seems to me in all cases we should give re-open a shot
        
     
         if (ws.$status() == ws.$CLOSED)
         {
             ZMDataModel.zmLog("Websocket was closed, trying to re-open");
             ws.$open();
         }
         
               

    
     }
     
     return {
         refresh:refresh,
         init:init
     };
        

}]);


