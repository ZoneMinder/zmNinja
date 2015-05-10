/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.HelpCtrl', ['$scope', '$rootScope', '$ionicModal', 'ZMDataModel','$ionicSideMenuDelegate',function ($scope, $rootScope, $ionicModal, ZMDataModel,$ionicSideMenuDelegate) {
$scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };
console.log ("***** HELP ****");

}]);
