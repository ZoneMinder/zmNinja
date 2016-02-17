/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.LowVersionCtrl', ['$scope','$ionicSideMenuDelegate', 'zm', '$stateParams', function ($scope,$ionicSideMenuDelegate,zm, $stateParams) {
$scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };




    //-------------------------------------------------------------------------
    // Controller Main
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
        //console.log("**VIEW ** LowVersion Ctrl Entered");
        $ionicSideMenuDelegate.canDragContent(true);
        $scope.requiredVersion = zm.minAppVersion;
        $scope.currentVersion = $stateParams.ver;

    });

}]);
