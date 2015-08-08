/* jshint -W041 */
/* jshint -W083 */
/*This is for the loop closure I am using in line 143 */
/* jslint browser: true*/
/* global vis,cordova,StatusBar,angular,console,moment */
angular.module('zmApp.controllers').controller('zmApp.PortalLoginCtrl', ['$ionicPlatform', '$scope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$rootScope', '$http', '$q', '$state', '$ionicLoading', '$ionicPopover', '$ionicScrollDelegate', '$ionicModal', '$timeout', 'zmAutoLogin', '$ionicHistory',function ($ionicPlatform, $scope, zm, ZMDataModel, $ionicSideMenuDelegate, $rootScope, $http, $q, $state, $ionicLoading, $ionicPopover, $ionicScrollDelegate, $ionicModal, $timeout, zmAutoLogin, $ionicHistory) {
    
    // Main
    
console.log ("***** INSIDE LOGIN CONTROLLER");
    
    $ionicHistory.nextViewOptions({
    disableBack: true
  });
    
    var loginData = ZMDataModel.getLogin();

    if (ZMDataModel.isLoggedIn()) {
      ZMDataModel.zmLog ("User credentials are provided");
      // console.log("VALID CREDENTIALS. Grabbing Monitors");
        zmAutoLogin.doLogin("Logging into ZoneMinder...")
        .then (function(data)
               {
               
                 ZMDataModel.getKeyConfigParams(1);
                $state.go('montage');
        });
    }
    else
    {
        $state.go('login');
        
    }
    
    
    }]);