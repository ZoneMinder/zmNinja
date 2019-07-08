/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.ImportantMessageCtrl', ['$scope', '$ionicSideMenuDelegate', 'zm', '$stateParams', '$timeout', '$rootScope', function ($scope, $ionicSideMenuDelegate, zm, $stateParams, $timeout, $rootScope) {
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

  //-------------------------------------------------------------------------
  // Controller Main
  //------------------------------------------------------------------------
  $scope.$on('$ionicView.enter', function () {
    // console.log("**VIEW ** LowVersion Ctrl Entered");
    $ionicSideMenuDelegate.canDragContent(true);

  });

  $scope.openMenu = function () {
    $timeout(function () {
      $rootScope.stateofSlide = $ionicSideMenuDelegate.isOpen();
    }, 500);

    $ionicSideMenuDelegate.toggleLeft();
  };

}]);
