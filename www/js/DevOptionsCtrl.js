/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.DevOptionsCtrl', ['$scope', '$rootScope', '$ionicModal', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$ionicPopup', '$http', '$q', '$ionicLoading', '$ionicHistory','$state', 'SecuredPopups', '$translate', function ($scope, $rootScope, $ionicModal, zm, ZMDataModel, $ionicSideMenuDelegate, $ionicPopup, $http, $q, $ionicLoading, $ionicHistory, $state, SecuredPopups, $translate) {


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
        //console.log("**VIEW ** DevOptions Ctrl Entered");
        $scope.loginData = ZMDataModel.getLogin();
   
        ZMDataModel.setAwake(false);
    });

    //------------------------------------------------------------------
    // Perform the login action when the user submits the login form
    //------------------------------------------------------------------
    
    function saveDevOptions()
    {
        ZMDataModel.zmDebug("SaveDevOptions: called");

        

        if ((parseInt($scope.loginData.maxFPS) < 0) || (parseInt($scope.loginData.maxFPS) > zm.maxFPS)) {
            $scope.loginData.maxFPS = zm.defaultFPS.toString();
        }
        
        if (parseInt($scope.loginData.refreshSec) <= 0) {
            ZMDataModel.zmDebug("SaveDevOptions: refresh sec was too low at " + 
                                $scope.loginData.refreshSec + " reset to 1");
            $scope.loginData.refreshSec = 1;

        }


        if ((parseInt($scope.loginData.montageQuality) < zm.safeMontageLimit) ||
            (parseInt($scope.loginData.montageQuality) > 70)) {
            $scope.loginData.montageQuality = 70;
        }
        
        
        if ((parseInt($scope.loginData.singleImageQuality) < zm.safeImageQuality) ||
            (parseInt($scope.loginData.singleImageQuality) > 100)) {
            $scope.loginData.singleImageQuality = zm.safeImageQuality.toString();
        }


        ZMDataModel.zmDebug("SaveDevOptions: Saving to disk");
        ZMDataModel.setLogin($scope.loginData);
        ZMDataModel.getMonitors(1);

        
    }
    
    $scope.saveDevOptions = function () {
            
            saveDevOptions();
        // $rootScope.zmPopup.close();
        $rootScope.zmPopup= SecuredPopups.show('alert',{
            title: $translate.instant('kSettingsSaved'),
            template: "{{'kExploreEnjoy' | translate }} {{$root.appName}}"
        }).then(function (res) {
            $ionicSideMenuDelegate.toggleLeft();
        });
        
    };
    //------------------------------------------------------------------
    // controller main
    //------------------------------------------------------------------


    



}]);