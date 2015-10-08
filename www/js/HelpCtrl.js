/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.HelpCtrl', ['$scope', '$rootScope', '$ionicModal', 'ZMDataModel','$ionicSideMenuDelegate', '$ionicHistory', '$state', function ($scope, $rootScope, $ionicModal, ZMDataModel,$ionicSideMenuDelegate, $ionicHistory, $state) {
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


     //-------------------------------------------------------------------------
    // Lets make sure we set screen dim properly as we enter
    // The problem is we enter other states before we leave previous states
    // from a callback perspective in ionic, so we really can't predictably
    // reset power state on exit as if it is called after we enter another
    // state, that effectively overwrites current view power management needs
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
        console.log("**VIEW ** Help Ctrl Entered");
        ZMDataModel.setAwake(false);

    });

}]);
