/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.EventServerSettingsCtrl', ['$scope','$ionicSideMenuDelegate', 'zm', '$stateParams','EventServer', '$ionicHistory', '$rootScope', '$state', 'message', 'ZMDataModel', function ($scope,$ionicSideMenuDelegate,zm, $stateParams, EventServer, $ionicHistory, $rootScope, $state, message, ZMDataModel) {
$scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };


     $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    
      //----------------------------------------------------------------
    // Alarm notification handling
    //----------------------------------------------------------------
    $scope.handleAlarms = function()
    {
        $rootScope.isAlarm=!$rootScope.isAlarm;
        if (!$rootScope.isAlarm)
        {
            $rootScope.alarmCount="0";
            $ionicHistory.nextViewOptions({disableBack: true});	
            
            
            $state.go("events", {"id": 0}, { reload: true });
        }
    };           

    
     $scope.$on('$ionicView.beforeLeave', function () {
         ZMDataModel.zmDebug("Saving Event Server data");
          var monstring="";
          for (var i=0; i < $scope.monitors.length; i++)
          {
              if ($scope.monitors[i].Monitor.isChecked)
              {
                  monstring = monstring + $scope.monitors[i].Monitor.Id+",";
              }
          }
         
         if (monstring.charAt(monstring.length - 1) == ',') 
            monstring = monstring.substr(0, monstring.length - 1);
         
         $scope.loginData.eventServerMonitors = monstring;
         
         $scope.loginData.isUseEventServer = ($scope.check.isUseEventServer) ? "1" : "0";
         
         ZMDataModel.setLogin($scope.loginData);
         console.log ("**** EVENT MONSTRING " + monstring);
        
        if ($scope.loginData.isUseEventServer)
        {
            EventServer.init()
            .then(function(data) {
                console.log ("Sending control filter");
                EventServer.sendMessage ("control", { type:'filter',monlist:monstring});
            });
        }
        
    });
    //-------------------------------------------------------------------------
    // Controller Main
    //------------------------------------------------------------------------
    $scope.monitors = [];
    $scope.monitors = message;
    
    $scope.loginData = ZMDataModel.getLogin();

    $scope.check = {
        isUseEventServer: ""
    };
    $scope.check.isUseEventServer = ($scope.loginData.isUseEventServer == '1') ? true : false;

    var res = $scope.loginData.eventServerMonitors.split(",");
    
    function isEnabled(id)
    {
        if ($scope.loginData.eventServerMonitors=="")
                return true;
        
        var isThere = false;
        for (var i=0; i<res.length; i++)
        {
            if (res[i]==id)
            {
                isThere = true;
                console.log ("isRes found: " + id);
                break;
            }
        }
        return isThere;
    }
    
   
    
    for (var i=0; i < $scope.monitors.length; i++)
    {
        if (!isEnabled($scope.monitors[i].Monitor.Id))
        {
            // if the filter list has IDs and this is not part of it, uncheck it
                $scope.monitors[i].Monitor.isChecked = false;
             console.log ("Marking false");
        }
        else
        {
            console.log ("Marking true");
             $scope.monitors[i].Monitor.isChecked = true;
        }
    }
    
    
    
    
   

}]);
