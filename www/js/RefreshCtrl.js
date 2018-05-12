/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.RefreshCtrl', ['$scope', '$ionicSideMenuDelegate', 'zm', '$stateParams', '$state', '$ionicHistory', function ($scope, $ionicSideMenuDelegate, zm, $stateParams, $state, $ionicHistory) {
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

  //-------------------------------------------------------------------------
  // Controller Main
  //------------------------------------------------------------------------
  $scope.$on('$ionicView.afterEnter', function () {
    //console.log("**VIEW ** LowVersion Ctrl Entered");
    $ionicSideMenuDelegate.canDragContent(false);
    //console.log ("jumping to: "+$stateParams.view);
    $ionicHistory.nextViewOptions({
      disableAnimate: true,
      disableBack: true
    });
    $state.go($stateParams.view);
    return;
  });

}]);
