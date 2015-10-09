/* jshint -W041 */


/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

// Websockets

angular.module('zmApp.controllers')
    
.factory('EventServer', 
[  'ZMDataModel', '$rootScope','$websocket', '$ionicPopup', function 
 (  ZMDataModel, $rootScope, $websocket, $ionicPopup) {
     
     
    var ws;

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
 
         
                           
            ws.$on ('$open', function() {
                ZMDataModel.zmLog("Websocket open");
                 ws.$emit('auth',
                          {user:loginData.username,
                           password:loginData.password});
              
            });

           ws.$on ('$close', function() {
               ZMDataModel.zmLog ("Websocket closed");
               
            });

             ws.$on ('$message', function(str) {
                 ZMDataModel.zmLog("Real-time event: " + JSON.stringify(str));
                 if (str.status != 'Success')
                 {
                     ZMDataModel.zmLog ("Event Error: " + JSON.stringify(str));
                     ws.$close();
                     ZMDataModel.displayBanner('error',['Event server rejected credentials', 'Please re-check credentials'],2000,6000);
                    
                 }
                 if (str.status == 'Success' && str.events) // new events
                 {
                     var eventsToDisplay=[];
                     for (var iter=0; iter<str.events.length; iter++)
                     {
                         eventsToDisplay.push(str.events[iter].Name+": new event ("+str.events[iter].EventId+")");
                         
                         
                     }
                     // lets stack the display so they don't overwrite
                     if (eventsToDisplay.length > 0)
                     {
                        ZMDataModel.displayBanner('alarm', eventsToDisplay, 5000, 5000*eventsToDisplay.length);
                       
                     }
                      $rootScope.isAlarm = 1;
                     
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


