/* jshint -W041 */
/* jshint -W083 */
/*This is for the loop closure I am using in line 143 */
/* jslint browser: true*/
/* global vis,cordova,StatusBar,angular,console,moment */
angular.module('zmApp.controllers').controller('zmApp.PortalLoginCtrl', ['$ionicPlatform', '$scope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$rootScope', '$http', '$q', '$state', '$ionicLoading', '$ionicPopover', '$ionicScrollDelegate', '$ionicModal', '$timeout', 'zmAutoLogin', '$ionicHistory',function ($ionicPlatform, $scope, zm, ZMDataModel, $ionicSideMenuDelegate, $rootScope, $http, $q, $state, $ionicLoading, $ionicPopover, $ionicScrollDelegate, $ionicModal, $timeout, zmAutoLogin, $ionicHistory) {
    
    // Main
    
    
    $ionicHistory.nextViewOptions({
    disableBack: true
  });
    
    var loginData = ZMDataModel.getLogin();

    if (ZMDataModel.isLoggedIn()) {
      ZMDataModel.zmLog ("User credentials are provided");
      // console.log("VALID CREDENTIALS. Grabbing Monitors");
        ZMDataModel.zmDebug("PortalLogin: Authenticating");
        zmAutoLogin.doLogin("authenticating...")
        .then (function(data) // success
               {
                 ZMDataModel.zmDebug("PortalLogin: auth success");
                 ZMDataModel.getKeyConfigParams(1);
                $state.go('montage');
        },
               // coming here means auth error
               // so go back to login
        function (error)
        {
                ZMDataModel.zmDebug("PortalLogin: error authenticating " + JSON.stringify(error));
                $state.go('login');
        }
              
              
              );
    }
    else
    {
        ZMDataModel.zmDebug("PortalLogin: Not logged in, so going to login");
        $state.go('login');
        
    }
    
    
    }]);