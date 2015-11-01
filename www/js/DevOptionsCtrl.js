/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.DevOptionsCtrl', ['$scope', '$rootScope', '$ionicModal', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$ionicPopup', '$http', '$q', '$ionicLoading', '$ionicHistory','$state',  function ($scope, $rootScope, $ionicModal, zm, ZMDataModel, $ionicSideMenuDelegate, $ionicPopup, $http, $q, $ionicLoading, $ionicHistory, $state) {


    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
       // $scope.this.will.crash = 1;
        
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
    
    
    //----------------------------------------------------------------
    // Save anyway when you exit
    //----------------------------------------------------------------
    
     $scope.$on('$ionicView.beforeLeave', function () {
       saveDevOptions();


    });

    //-------------------------------------------------------------------------
    // Lets make sure we set screen dim properly as we enter
    // The problem is we enter other states before we leave previous states
    // from a callback perspective in ionic, so we really can't predictably
    // reset power state on exit as if it is called after we enter another
    // state, that effectively overwrites current view power management needs
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
        console.log("**VIEW ** DevOptions Ctrl Entered");
        ZMDataModel.setAwake(false);
    });

    //------------------------------------------------------------------
    // Perform the login action when the user submits the login form
    //------------------------------------------------------------------
    
    function saveDevOptions()
    {
        ZMDataModel.zmDebug("SaveDevOptions: called");

        if (parseInt($scope.loginData.maxMontage) > zm.safeMontageLimit) {
            $ionicPopup.alert({
                title: 'Note',
                template: 'You have selected to view more than 10 monitors in the Montage screen. Note that this is very resource intensive and may load the server or cause issues in the application. If you are not sure, please consider limiting this value to 10'
            });
            ZMDataModel.zmDebug("SaveDevOptions: " + $scope.loginData.maxMontage +
                " monitors for montage");
        }


        if ((parseInt($scope.loginData.maxFPS) < 0) || (parseInt($scope.loginData.maxFPS) > zm.maxFPS)) {
            $scope.loginData.maxFPS = zm.defaultFPS.toString();
        }

        if (parseInt($scope.loginData.refeshSec) <= 0) {
            ZMDataModel.zmDebug("SaveDevOptions: refresh sec was too low at " + 
                                $scope.loginData.refreshSec + " reset to 1");
            $scope.loginData.refreshSec = 1;

        }


        if ((parseInt($scope.loginData.montageQuality) < zm.safeMontageLimit) ||
            (parseInt($scope.loginData.montageQuality) > 70)) {
            $scope.loginData.montageQuality = zm.defaultMontageQuality.toString();
        }


        ZMDataModel.zmDebug("SaveDevOptions: Saving to disk");
        ZMDataModel.setLogin($scope.loginData);

        
    }
    
    $scope.saveDevOptions = function () {
            
            saveDevOptions();
        $ionicPopup.alert({
            title: 'Settings Saved',
            template: 'Please explore the menu and enjoy zmNinja!'
        }).then(function (res) {
            $ionicSideMenuDelegate.toggleLeft();
        });
        
    };
    //------------------------------------------------------------------
    // controller main
    //------------------------------------------------------------------


    $scope.loginData = ZMDataModel.getLogin();



}]);