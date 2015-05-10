/* jshint -W041 */
/* jshint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers', ['ionic',   'googlechart', 'ngCordova', 'ng-mfb' ])


.controller('zmApp.AppCtrl', function($scope, $ionicSideMenuDelegate) {
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };
});
