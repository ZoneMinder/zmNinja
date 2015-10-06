/* jshint -W041 */


/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

// Websockets

angular.module('zmApp.controllers')
    
.factory('EventServer', 
[  'ZMDataModel', '$rootScope','$websocket', function 
 (  ZMDataModel, $rootScope, $websocket) {
     
     
     
     function start()
     {
         if ($rootScope.websocketActive == 1)
            {
                ZMDataModel.zmDebug ("Connection established. Not doing WebSocketInit again...");
                return;
            }
         var loginData = ZMDataModel.getLogin();
         
      
         if (loginData.eventServer)
         {
             var evtsvrUrl=loginData.eventServer+'/?user='+
                  loginData.username+'&passwd='+loginData.password;
            // if (ws) ws.$close();
             ZMDataModel.zmLog("Event Server URL constructed as " + evtsvrUrl);
               var ws = $websocket.$new ({
                  url:evtsvrUrl,
                  reconnect:true,
                  reconnectInterval:5000
              });

            ws.$on ('$open', function() {
                ZMDataModel.zmLog("Websocket open");
                $rootScope.websocketActive=1;
            });

           ws.$on ('$close', function() {
               ZMDataModel.zmLog ("Websocket closed");
                $rootScope.websocketActive = 0;
            });

             ws.$on ('$message', function(str) {
                 ZMDataModel.zmLog("Real-time event: " + str);
                 var evt=str.split(":");
                 var evtStr = "New Alarm in " + evt[0]+" ("+evt[2]+")";
                 ZMDataModel.displayBanner('alarm',[evtStr],6000,6000);


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


