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
    
    $scope.pindata = {};
    if ($ionicSideMenuDelegate.isOpen())
    {
        $ionicSideMenuDelegate.toggleLeft();
        ZMDataModel.zmDebug("Sliding menu close");
    }
    
    $scope.pinChange = function()
    {
        
        console.log ($scope.pindata.pin);
        if ($scope.pindata.pin == null)
        {
            console.log ("Empty");
            $scope.pindata.status="";
        }
    };
    
    $scope.unlock = function()
    {
        ZMDataModel.zmDebug("Trying to unlock PIN");
        if ($scope.pindata.pin == loginData.pinCode)
        {
            ZMDataModel.zmDebug ("PIN code entered is correct");
            $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
            zmAutoLogin.stop(); //safety
            zmAutoLogin.start();
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
                        ZMDataModel.zmDebug("PortalLogin: error authenticating " +
                                            JSON.stringify(error));
                        $state.go('login');
                });
        }
        else
        {
            $scope.pindata.status = "Invalid PIN";
        }
    };
    
    var loginData = ZMDataModel.getLogin();
    $scope.pinPrompt = false;

    if (ZMDataModel.isLoggedIn()) {
        ZMDataModel.zmLog ("User credentials are provided");
        
        if (loginData.usePin)
        {
            $scope.pinPrompt = true;
            
            
        }
        else{
            
            ZMDataModel.zmDebug ("PIN code not set");
            $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
            zmAutoLogin.stop(); //safety
            zmAutoLogin.start();
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
                        ZMDataModel.zmDebug("PortalLogin: error authenticating " +
                                            JSON.stringify(error));
                        $state.go('login');
                });
            
            
        }
        
        
    }
    else
    {
        ZMDataModel.zmDebug("PortalLogin: Not logged in, so going to login");
        $state.go('login');
        
    }
    
    
    }]);