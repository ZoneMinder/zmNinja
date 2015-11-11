/* jshint -W041 */
/* jshint browser: true*/
/* global cordova,StatusBar,angular,console */



angular.module('zmApp.controllers', ['ionic', 'ionic.utils', 'ngCordova', 'ng-mfb','angularCircularNavigation', 'jett.ionic.content.banner', 'ionic-pullup', 'ngWebsocket' ])

.controller('zmApp.BaseController', function($scope, $ionicSideMenuDelegate, $ionicPlatform, $timeout, $rootScope) {
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

     $ionicPlatform.registerBackButtonAction(function (event) {
     
     $ionicSideMenuDelegate.toggleLeft();
     $timeout (function() {
            $rootScope.stateofSlide = $ionicSideMenuDelegate.isOpen() + new Date();
        },500);

        
}, 100);

    // Added for electron build to stop title propagation
    $scope.$on('$ionicView.afterEnter', function(ev, data) { 
      ev.stopPropagation();
  });

});

