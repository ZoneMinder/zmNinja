/* jshint -W041 */
/* jshint browser: true*/
/* global cordova,StatusBar,angular,console */



angular.module('zmApp.controllers', ['ionic', 'ngCordova', 'ng-mfb','angularCircularNavigation', 'jett.ionic.content.banner' ])

.controller('zmApp.BaseController', function($scope, $ionicSideMenuDelegate, $ionicPlatform, $timeout, $rootScope) {
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

     $ionicPlatform.registerBackButtonAction(function (event) {
     console.log ("ANDROID BACK");
     $ionicSideMenuDelegate.toggleLeft();
     $timeout (function() {
            $rootScope.stateofSlide = $ionicSideMenuDelegate.isOpen() + new Date();
        },500);

        
}, 100);
});

