angular.module('zmApp.controllers').controller('zmApp.LoginCtrl', function ($scope, $rootScope, $ionicModal, ZMDataModel,$ionicSideMenuDelegate) {
$scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  }
    
    $scope.loginData = ZMDataModel.getLogin();


    // Perform the login action when the user submits the login form
    $scope.login = function () {
        console.log('Saving login');
        ZMDataModel.setLogin($scope.loginData);



    };
})