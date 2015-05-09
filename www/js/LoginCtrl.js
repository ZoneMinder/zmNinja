angular.module('zmApp.controllers').controller('zmApp.LoginCtrl', function ($scope, $rootScope, $ionicModal, ZMDataModel,$ionicSideMenuDelegate, $ionicPopup) {
$scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  }
    
    $scope.loginData = ZMDataModel.getLogin();



    // Perform the login action when the user submits the login form
    $scope.login = function () {
        console.log('Saving login');

        if (parseInt($scope.loginData.maxMontage) >10)
        {
           $ionicPopup.alert({
     title: 'Note',
     template: 'You have selected to view more than 10 monitors in the Montage screen. Note that this is very resource intensive and may load the server or cause issues in the application. If you are not sure, please consider limiting this value to 10'
   });
        }
        ZMDataModel.setLogin($scope.loginData);

    };


})
