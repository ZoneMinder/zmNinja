/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.HelpCtrl', ['$scope', '$rootScope', '$ionicModal', 'ZMDataModel','$ionicSideMenuDelegate',function ($scope, $rootScope, $ionicModal, ZMDataModel,$ionicSideMenuDelegate) {
$scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
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
