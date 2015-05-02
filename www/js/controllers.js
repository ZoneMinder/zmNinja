
angular.module('zmApp.controllers', ['ionic',   'googlechart', 'ngCordova', 'ng-mfb' ])


.controller('zmApp.AppCtrl', function($scope, $ionicSideMenuDelegate) {
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  }
});
