/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

// controller for State View

angular.module('zmApp.controllers').controller('zmApp.StateCtrl', ['$ionicPopup', '$scope', 'ZMDataModel', '$ionicSideMenuDelegate', '$ionicLoading', '$ionicModal', '$state', '$http', function ($ionicPopup, $scope, ZMDataModel, $ionicSideMenuDelegate, $ionicLoading, $ionicModal, $state, $http, $rootScope) {

    $scope.zmRun = "loading...";
    $scope.zmLoad = "loading...";
    $scope.zmDisk = "loading...";
    $scope.color = "";
    $scope.showDanger = false;
    $scope.dangerText = ["Show ZoneMinder Controls", "Hide ZoneMinder Controls"];
    $scope.dangerButtonColor = ["button-positive", "button-assertive"];

    var loginData = ZMDataModel.getLogin();

    var apiRun = loginData.apiurl + "/host/daemonCheck.json";
    var apiLoad = loginData.apiurl + "/host/getLoad.json";
    var apiDisk = loginData.apiurl + "/host/getDiskPercent.json";

    var apiExec = loginData.apiurl + "/states/change/";

    var inProgress = 0;
    getRunStatus();
    getLoadStatus();
    getDiskStatus();

    function getDiskStatus() {
        $http.get(apiDisk)
            .then(
                function (success) {
                    var obj = success.data.usage;
                    var du = 0;
                    console.log("DISK:" + JSON.stringify(success));
                    for (var p in obj) {
                        if (obj.hasOwnProperty(p)) {
                            du += parseFloat(obj[p].space);

                        }
                    }
                    $scope.zmDisk = du.toFixed(1).toString() + "G";

                },
                function (error) {
                    $scope.zmDisk = "unknown";
                    console.log("ERROR:" + JSON.stringify(error));
                }
            );
    }

    function getRunStatus() {
        $http.get(apiRun)
            .then(
                function (success) {
                    switch (success.data.result) {
                    case 1:
                        $scope.zmRun = 'running';
                        $scope.color = 'color:green;';
                        break;
                    case 0:
                        $scope.zmRun = 'stopped';
                        $scope.color = 'color:red;';
                        break;
                    default:
                        $scope.zmRun = 'undetermined';
                        $scope.color = 'color:orange;';
                        break;
                    }


                    // console.log("X"+success.data.result+"X");
                },
                function (error) {
                    console.log("ERROR in getRun: " + JSON.stringify(error));
                    $scope.color = 'color:red;';
                    $scope.zmRun = 'undetermined';
                }
            );

    }


    function getLoadStatus() {
        $http.get(apiLoad)
            .then(
                function (success) {
                    //console.log(JSON.stringify(success));
                    // load returns 3 params - one in the middle is avg.
                    $scope.zmLoad = success.data.load[1];


                    // console.log("X"+success.data.result+"X");
                },
                function (error) {
                    console.log("ERROR in getLoad: " + JSON.stringify(error));
                    $scope.zmLoad = 'undetermined';
                }
            );
    }




    $scope.controlZM = function (str) {
        if (inProgress) {
            $ionicPopup.alert({
                title: "Operation in Progress",
                template: "The previous operation is still in progress. Please wait..."
            });
            return;
        }


        $ionicPopup.show({
            title: 'Please Confirm',
            template: 'Are you sure you want to ' + str + ' Zoneminder?',
            buttons: [
                {
                    text: 'Cancel',
                    type: 'button-positive'
                        },
                {
                    text: 'Yes, ' + str + ' Zoneminder',
                    type: 'button-assertive',
                    onTap: function (e) {
                        $scope.zmRun = "please wait...";
                        $scope.color = 'color:orange;';
                        console.log("Control command is " + apiExec + str + ".json");
                        inProgress = 1;
                        $http.post(apiExec + str + ".json")
                            .then(
                                function (success) {
                                    switch (str) {
                                    case "stop":
                                        $scope.zmRun = 'stopped';
                                        $scope.color = 'color:red;';
                                        break;
                                    case "start":
                                    case "restart":
                                        $scope.zmRun = 'running';
                                        $scope.color = 'color:green;';
                                        break;

                                    }
                                    inProgress = 0;
                                },
                                function (error) {
                                    //if (error.status) // it seems to return error with status 0 if ok
                                    // {
                                    console.log("ERROR in Change State:" + JSON.stringify(error));
                                    $scope.zmRun = 'undetermined';
                                    $scope.color = 'color:orange;';
                                    inProgress = 0;
                                    //   }
                                    /*else
                                    {
                                        switch (str)
                                        {
                                            case "stop":$scope.zmRun = 'stopped';
                                                $scope.color='color:red;'; break;
                                            case "start":
                                            case "restart":$scope.zmRun = 'running';
                                                $scope.color = 'color:green;';break;

                                        }
                                        inProgress = 0;
                                    }*/

                                }

                            );

                    }
                        }
                    ]
        });

    };

    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.$on('$ionicView.leave', function () {
        console.log("**VIEW ** State Ctrl Left");
        // FIXME not the best way...
        inProgress = 0;
    });

    $scope.reloadView = function () {
        console.log("*** Refreshing Modal view ***");
        inProgress = 0;
        $scope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
        $ionicLoading.show({
            template: "refreshed view",
            noBackdrop: true,
            duration: 2000
        });
    };

    $scope.doRefresh = function () {
        console.log("***Pull to Refresh");
        getRunStatus();
        getLoadStatus();
        getDiskStatus();
        $scope.$broadcast('scroll.refreshComplete');

    };

}]);
