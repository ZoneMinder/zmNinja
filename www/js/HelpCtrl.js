angular.module('zmApp.controllers').controller('zmApp.HelpCtrl', function ($scope, $rootScope, $ionicModal, ZMDataModel,$ionicSideMenuDelegate) {
$scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  }
console.log ("***** HELP ****");

})
