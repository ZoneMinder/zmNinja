// NOT USED ANYMORE. FIXME: DELETE THIS FILE

angular.module('zmApp.controllers').factory('ZMHttpFactory', ['$http', '$rootScope','$ionicLoading', '$ionicPopup','$timeout'
  function($http, $rootScope, $ionicLoading, $ionicPopup, $timeout) {



    return {
      getMonitors: function(loginData) {
        console.log ("Inside HTTP getMonitors");
        $ionicLoading.show({
            template: 'Loading ZoneMinder Monitors...',
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0
          });
                                                          
        var monitors = [];
                                            
        var apiurl = loginData.apiurl;
        var myurl = apiurl+"/monitors.jsona";
        
        return $http({
          url: myurl,
          method: 'get'
                  
        }) //http
        .then(function(response) {
              var data = response.data;
              //console.log("****YAY" + JSON.stringify(data));
          // $rootScope.$broadcast ('handleZoneMinderMonitorsUpdate',monitors);
            $ionicLoading.hide();
            console.log ("** Settings Monitors from HTTP");
            //ZMDataModel.setMonitors(data.monitors);
            
           // ZMDataModel.setMonitorsLoaded(1);
            monitors = data.monitors;
            console.log ("**** returning "+monitors.length+" monitors from HTTP");
            return monitors;
            },
            function (result)
            {
                console.log ("**** Error in HTTP");
                $ionicLoading.hide();
                //ZMDataModel.setMonitorsLoaded(1);
                //$ionicPopup.alert ({title: "Error", template:"Error retrieving Monitors. \nPlease check if your Settings are correct. "});
                //return  ZMDataModel.getMonitors();
                return monitors;
            }
        ); //then
      }, //getMonitors
        
    getEvents: function(loginData) {
  
        $ionicLoading.show({
            template: 'Loading ZoneMinder Events...',
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0
          });
                                                          
        var myevents = [];
         var apiurl = loginData.apiurl;
        //var myurl = $rootScope.loginData.url+'/zm/index.php?skin=xml';
        var myurl = apiurl + "/events.json"; 
        console.log("***MAKING REQUEST to "+ myurl);
        return $http({
          url: myurl,
          method: 'get',
          headers: {
            //'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': '*/*',
          }

        }) //http
        .then(function(response) {
              var data = response.data;
            // $rootScope.$broadcast ('handleZoneMinderMonitorsUpdate',monitors);
            $ionicLoading.hide();
            myevents = response.data;
            return myevents.events.reverse();
            },
            function (result)
            {
                console.log ("**** Error in HTTP");
                $ionicLoading.hide();
                //$ionicPopup.alert ({title: "Error", template:"Error retrieving Monitors. \nPlease check if your Settings are correct. "});
                return myevents;
            }
        ); //then
      }, //getEvents
    }
  }
]);
