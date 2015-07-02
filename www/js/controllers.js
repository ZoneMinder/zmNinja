/* jshint -W041 */
/* jshint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers', ['ionic', 'ngCordova', 'ng-mfb','angularCircularNavigation' ])

.controller('zmApp.AppCtrl', function($scope, $ionicSideMenuDelegate) {
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };
});

