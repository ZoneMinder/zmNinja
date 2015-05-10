/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

// controller for Monitor View
// refer to comments in EventCtrl for the modal stuff. They are almost the same

angular.module('zmApp.controllers').controller('zmApp.MonitorCtrl', ['$scope', 'ZMDataModel', 'message', '$ionicSideMenuDelegate', '$ionicLoading', '$ionicModal', '$state',function ($scope, ZMDataModel, message, $ionicSideMenuDelegate, $ionicLoading, $ionicModal, $state) {

    $scope.monitors = [];


    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.reloadView = function () {
        console.log("*** Refreshing Modal view ***");
        $scope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
        $ionicLoading.show({
            template: "refreshed view",
            noBackdrop: true,
            duration: 2000
        });
    };

    $scope.isSimulated = function () {
        return ZMDataModel.isSimulated();
    };

    // same logic as EventCtrl.js
    $scope.finishedLoadingImage = function () {
        console.log("***Monitor image FINISHED Loading***");
        $ionicLoading.hide();
        /* $ionicLoading.show({
             template: "loading, please wait...",
             noBackdrop: true,
         });*/
    };



    $scope.$on('$ionicView.loaded', function () {
        console.log("**VIEW ** Monitor Ctrl Loaded");
    });

    $scope.$on('$ionicView.enter', function () {
        console.log("**VIEW ** Monitor Ctrl Entered");
    });

    $scope.$on('$ionicView.leave', function () {
        console.log("**VIEW ** Monitor Ctrl Left");
    });

    $scope.$on('$ionicView.unloaded', function () {
        console.log("**VIEW ** Monitor Ctrl Unloaded");
    });

    $scope.openModal = function (mid) {
        console.log("Open Monitor Modal");

        $scope.monitorId = mid;
        $scope.LoginData = ZMDataModel.getLogin();
        $scope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;

        // This is a modal to show the monitor footage
        $ionicModal.fromTemplateUrl('templates/monitors-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            })
            .then(function (modal) {
                $scope.modal = modal;

                $ionicLoading.show({
                    template: "please wait...",
                    noBackdrop: true,
                    duration: 15000
                });
                $scope.modal.show();
            });

    };
    $scope.closeModal = function () {
        console.log("Close & Destroy Monitor Modal");
        $scope.modal.remove();

    };
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function () {
        console.log("Destroy Monitor Modal");
        $scope.modal.remove();
    });



    console.log("***EVENTS: Waiting for Monitors to load before I proceed");

    $scope.monitors = message;

    $scope.doRefresh = function () {
        console.log("***Pull to Refresh");
        $scope.monitors = [];

        var refresh = ZMDataModel.getMonitors(1);
        refresh.then(function (data) {
            $scope.monitors = data;
            $scope.$broadcast('scroll.refreshComplete');
        });

    };

}]);
