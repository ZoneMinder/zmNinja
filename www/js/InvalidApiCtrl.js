/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.InvalidApiCtrl', ['$scope', '$ionicSideMenuDelegate', 'zm', '$stateParams', '$timeout', '$rootScope', function ($scope, $ionicSideMenuDelegate, zm, $stateParams, $timeout, $rootScope) {
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

  //-------------------------------------------------------------------------
  // Controller Main
  //------------------------------------------------------------------------
  $scope.$on('$ionicView.enter', function () {
    // console.log("**VIEW ** InvalidAPI Ctrl Entered");
    $ionicSideMenuDelegate.canDragContent(true);
  });

  $scope.openMenu = function () {
    $timeout(function () {
      $rootScope.stateofSlide = $ionicSideMenuDelegate.isOpen();
    }, 500);

    $ionicSideMenuDelegate.toggleLeft();
  };

  $scope.readFAQ = function () {
    window.open('https://github.com/zoneminder/zmninja/wiki/Validating-if-APIs-work-on-ZM', '_blank', 'location=yes');
    return false;
  };

}]);
