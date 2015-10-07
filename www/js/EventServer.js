/* jshint -W041 */


/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

// Websockets

angular.module('zmApp.controllers')
    
.factory('EventServer', 
[  'ZMDataModel', '$rootScope','$websocket', '$ionicPopup', function 
 (  ZMDataModel, $rootScope, $websocket, $ionicPopup) {
     
     
     var websocketActive = 0;
     var webSocketBadAuth = 0;
     var ws;
     
     function start()
     {
         if (websocketActive == 1)
            {
                ZMDataModel.zmDebug ("Connection established. Not doing WebSocketInit again...");
                return;
            }
         
         if (webSocketBadAuth == 1)
         {
             webSocketBadAuth = 0;
             ZMDataModel.zmLog("Retrying websocket auth");
             ws.$open();
             return;
         }
         var loginData = ZMDataModel.getLogin();
         
      
         if (loginData.eventServer)
         {
             var evtsvrUrl=loginData.eventServer;
            // if (ws) ws.$close();
             
             if (typeof ws === 'undefined' || ws.$status == ws.$CLOSED ) 
             {
                 ZMDataModel.zmLog ("%%%%%%%%%%%%%%%%%%%%%% NEW WEBSOCKET %%%%%%%%%%");
                 //console.log (">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"+ws.$status());
                 ZMDataModel.zmLog("Event Server URL constructed as " + evtsvrUrl);
                    ws = $websocket.$new ({
                      url:evtsvrUrl,
                      reconnect:true,
                      reconnectInterval:5000
                  });
             }

            ws.$on ('$open', function() {
                ZMDataModel.zmLog("Websocket open");
                 ws.$emit('auth',
                          {user:loginData.username,
                           password:loginData.password});
                // we will retry on resume of app
                // but since we called close, it won't retry on its own
                websocketActive=0;
            });

           ws.$on ('$close', function() {
               ZMDataModel.zmLog ("Websocket closed");
                websocketActive = 0;
            });

             ws.$on ('$message', function(str) {
                 ZMDataModel.zmLog("Real-time event: " + JSON.stringify(str));
                 if (str.status != 'Success')
                 {
                     ZMDataModel.zmLog ("Event Error: " + JSON.stringify(str));
                     ws.$close();
                     webSocketBadAuth = 1;
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
                        ZMDataModel.displayBanner('alarm', eventsToDisplay, 5000, 5000*eventsToDisplay.length);
                     $rootScope.isAlarm = 1;
                 }
                 
                 
                 
                 
                 
            });

         }
         else
         {
             ZMDataModel.zmLog("No Event Server configured, skipping");
         }
    
     }
     
     return {
         start:start
     };
        

}]);


