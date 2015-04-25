angular.module('zmApp.controllers', ['ionic',   'googlechart' ])

.controller('zmApp.AppCtrl', function($scope, $ionicSideMenuDelegate) {
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  }
});
//test