/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.FirstUseCtrl', ['$scope','$ionicSideMenuDelegate', 'zm', '$stateParams', '$ionicHistory','$state', function ($scope,$ionicSideMenuDelegate,zm, $stateParams, $ionicHistory, $state) {
$scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };



    //-------------------------------------------------------------------------
    // Controller Main
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
        //console.log("**VIEW ** FirstUse Ctrl Entered");
        $ionicSideMenuDelegate.canDragContent(true);
    

    });
    
    $scope.goToLogin = function()
    {
        $ionicHistory.nextViewOptions({
                    disableAnimate: false,
                    disableBack: true
                });
        $state.go("login" ,{"wizard": false});
    };
    
    

}]);
