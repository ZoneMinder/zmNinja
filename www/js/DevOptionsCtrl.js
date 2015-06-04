/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.DevOptionsCtrl', ['$scope', '$rootScope', '$ionicModal', 'ZMDataModel', '$ionicSideMenuDelegate', '$ionicPopup', '$http', '$q', '$ionicLoading', function ($scope, $rootScope, $ionicModal, ZMDataModel, $ionicSideMenuDelegate, $ionicPopup, $http, $q, $ionicLoading) {
    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.loginData = ZMDataModel.getLogin();



    // Perform the login action when the user submits the login form
    $scope.saveDevOptions = function () {
        console.log('Saving Dev Options');

        if (parseInt($scope.loginData.maxMontage) > 10) {
            $ionicPopup.alert({
                title: 'Note',
                template: 'You have selected to view more than 10 monitors in the Montage screen. Note that this is very resource intensive and may load the server or cause issues in the application. If you are not sure, please consider limiting this value to 10'
            });
        }


        if ((parseInt($scope.loginData.maxFPS) <0) || (parseInt($scope.loginData.maxFPS)>30))
        {
            $scope.loginData.maxFPS='3';
        }


        ZMDataModel.setLogin($scope.loginData);
    };


}]);
