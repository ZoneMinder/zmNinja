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
         var loginData = ZMDataModel.getLogin();
         if (loginData.eventServer)
         {
           ZMDataModel.zmLog("Initializing Websocket with URL " + 
                             loginData.eventServer+" , will connect later...");
           ws = $websocket.$new ({
                      url:loginData.eventServer,
                      reconnect:true,
                      reconnectInterval:5000,
                      lazy:true
                  });
         }
         else
         {
             ZMDataModel.zmLog("No Event Server configured. Skipping initialization");
         }
         
                           
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
                        ZMDataModel.displayBanner('alarm', eventsToDisplay, 5000, 5000*eventsToDisplay.length);
                     $rootScope.isAlarm = 1;
                 }
                 
                 
                 
                 
                 
            });
         
         
     }
     
     // FIXME: needs cleaninup up
     // on iOS this socket will die after switching to background (eventually)
     // on Android it will keep running
     // on Android  I need to see why websockets are getting duplicated on server
     // disconnect
     
     function refresh()
     {
          var loginData = ZMDataModel.getLogin();
         
         if (!loginData.eventServer)
         {
             ZMDataModel.zmLog("No Event Server configured, skipping refresh");
             return;
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


