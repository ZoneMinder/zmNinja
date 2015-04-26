
angular.module('zmApp.controllers', ['ionic',   'googlechart', 'ngCordova' ])

.controller('zmApp.AppCtrl', function($scope, $ionicSideMenuDelegate) {
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  }
});
