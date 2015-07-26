/* jshint -W041 */
/* jshint browser: true*/
/* global cordova,StatusBar,angular,console */



angular.module('zmApp.controllers', ['ionic', 'ngCordova', 'ng-mfb','angularCircularNavigation','angular-carousel', 'angularAwesomeSlider' ])

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

         /*   $timeout ( function() {


               if ($ionicSideMenuDelegate.$getByHandle('sideMenu').isOpenLeft())
               {
                   console.log ("**** EXITING APP ****");
               }
               else
               {
                   console.log ("**** GOING TO SLIDE MENU");
                  // $ionicSideMenuDelegate.toggleLeft();
                    $ionicSideMenuDelegate.$getByHandle('sideMenu').toggleLeft();
               }


            },100);*/


}, 100);
});

