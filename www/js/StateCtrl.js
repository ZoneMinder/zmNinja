/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

// controller for State View

angular.module('zmApp.controllers').controller('zmApp.StateCtrl', ['$ionicPopup', '$scope', 'zm', 'NVRDataModel', '$ionicSideMenuDelegate', '$ionicLoading', '$ionicModal', '$state', '$http', '$rootScope', '$timeout', '$ionicHistory', '$translate', function (
    $ionicPopup, $scope, zm, NVRDataModel, $ionicSideMenuDelegate, $ionicLoading, $ionicModal, $state, $http, $rootScope, $timeout, $ionicHistory, $translate) {

    //----------------------------------------------------------------------
    // Controller main
    //----------------------------------------------------------------------
    $scope.zmRun = "...";
    $scope.zmLoad = "...";
    $scope.zmDisk = "...";
    $scope.color = "";
    $scope.showDanger = false;
    $scope.dangerText = [$translate.instant('kStateShowControls'), $translate.instant('kStateHideControls')];
    $scope.dangerButtonColor = ["button-positive", "button-assertive"];
    $scope.customState = "";
    $scope.allStateNames = [];

    $rootScope.zmPopup = "";



    var loginData = NVRDataModel.getLogin();

    var apiRun = loginData.apiurl + "/host/daemonCheck.json";
    var apiLoad = loginData.apiurl + "/host/getLoad.json";
    var apiDisk = loginData.apiurl + "/host/getDiskPercent.json";
    var apiCurrentState = loginData.apiurl + "/States.json";

    var apiExec = loginData.apiurl + "/states/change/";

    var inProgress = 0; // prevents user from another op if one is in progress
    getRunStatus();

    // Let's stagger this by 500ms each to see if Chrome lets these through
    // This may also help if your Apache is not configured to let multiple connections through

    $timeout(function () {
        NVRDataModel.debug("invoking LoadStatus...");
        getLoadStatus();
    }, 2000);

    $timeout(function () {
        NVRDataModel.debug("invoking CurrentState...");
        getCurrentState();
    }, 4000);

    /*
    $timeout(function () {
            NVRDataModel.debug("invoking DiskStatus...");
            getDiskStatus();
        }, 6000);
    */
    //-------------------------------------------------------------------------
    // Lets make sure we set screen dim properly as we enter
    // The problem is we enter other states before we leave previous states
    // from a callback perspective in ionic, so we really can't predictably
    // reset power state on exit as if it is called after we enter another
    // state, that effectively overwrites current view power management needs
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
        // console.log("**VIEW ** Montage Ctrl Entered");
        NVRDataModel.setAwake(false);
    });

    //---------------------------------------------------------
    // This gets the current run state custom name
    // if applicable
    //---------------------------------------------------------
    function getCurrentState() {
        NVRDataModel.debug("StateCtrl: getting state using " + apiCurrentState);
        $http.get(apiCurrentState)
            .then(
                function (success) {
                    NVRDataModel.debug("State results: " + JSON.stringify(success));
                    var customStateArray = success.data.states;
                    var i = 0;
                    var found = false;
                    $scope.allStateNames = [];
                    for (i = 0; i < customStateArray.length; i++) {
                        $scope.allStateNames.push(customStateArray[i].State.Name);
                        if (customStateArray[i].State.IsActive == '1') {
                            $scope.customState = customStateArray[i].State.Name;
                            found = true;
                        }
                    }
                    if (!found) $scope.customState = "";

                },
                function (error) {
                    NVRDataModel.debug("StateCtrl: Error retrieving state list " + JSON.stringify(error));
                    $scope.customState = "";

                }
            );

    }


    //----------------------------------------------------------------
    // Alarm notification handling
    //----------------------------------------------------------------
    $scope.handleAlarms = function () {
        $rootScope.isAlarm = !$rootScope.isAlarm;
        if (!$rootScope.isAlarm) {
            $rootScope.alarmCount = "0";
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go("events", {
                "id": 0,
                "playEvent":false
            }, {
                reload: true
            });
        }
    };

    //---------------------------------------------------------
    // Allows the user to select a custom run state
    //---------------------------------------------------------
    $scope.selectCustomState = function () {
        $scope.myopt = {
            selectedState: ""
        };
        //console.log(JSON.stringify($scope.allStateNames));
        NVRDataModel.log("List of custom states: " + JSON.stringify($scope.allStateNames));
        $rootScope.zmPopup = $ionicPopup.show({
            scope: $scope,
            template: '<ion-radio-fix ng-repeat="item in allStateNames" ng-value="item" ng-model="myopt.selectedState"> {{item}} </ion-radio-fix>',


            title: $translate.instant('kSelectRunState'),
            subTitle: $translate.instant('kCurrentState') + $scope.customState ? ($translate.instant('kCurrentState') + ": " + $scope.customState) : "",
            buttons: [
                {
                    text: $translate.instant('kButtonCancel'),
                    onTap: function (e) {
                        return "CANCEL";
                    }

                },
                {
                    text: $translate.instant('kButtonOk'),
                    onTap: function (e) {
                        return "OK";

                    }
               }
           ]
        });

        // It seems invoking a popup within a popup handler
        // causes issues. Doing this outside due to that reason
        $rootScope.zmPopup.then(function (res) {
            // console.log("GOT : " + JSON.stringify(res));
            if (res == "OK") {
                if ($scope.myopt.selectedState != "")
                    controlZM($scope.myopt.selectedState);
            }
        });
    };


    //----------------------------------------------------------------------
    // returns disk space in gigs taken up by events
    //----------------------------------------------------------------------
    function getDiskStatus() {
        NVRDataModel.debug("StateCtrl/getDiskStatus: " + apiDisk);
        $http.get(apiDisk)
            .then(
                function (success) {
                    NVRDataModel.debug("StateCtrl/getDiskStatus: success");
                    NVRDataModel.debug("Disk results: " + JSON.stringify(success));
                    var obj = success.data.usage;
                    if (obj.Total.space != undefined) {
                        $scope.zmDisk = parseFloat(obj.Total.space).toFixed(1).toString() + "G";
                    } else {
                        $scope.zmDisk = "unknown";
                        NVRDataModel.log("Error retrieving disk space, API returned null for obj.Total.space");
                    }

                },
                function (error) {
                    $scope.zmDisk = "unknown";
                    // console.log("ERROR:" + JSON.stringify(error));
                    NVRDataModel.log("Error retrieving DiskStatus: " + JSON.stringify(error), "error");
                }
            );
    }

    //----------------------------------------------------------------------
    // returns ZM running status
    //----------------------------------------------------------------------
    function getRunStatus() {
        NVRDataModel.debug("StateCtrl/getRunStatus: " + apiRun);
        $http.get(apiRun)
            .then(
                function (success) {
                    NVRDataModel.debug("StateCtrl/getRunStatus: success");
                    NVRDataModel.debug("Run results: " + JSON.stringify(success));
                    switch (success.data.result) {
                        case 1:
                            $scope.zmRun = $translate.instant('kZMRunning');
                            $scope.color = 'color:green;';
                            break;
                        case 0:
                            $scope.zmRun = $translate.instant('kZMStopped');
                            $scope.color = 'color:red;';
                            break;
                        default:
                            $scope.zmRun = $translate.instant('kZMUndetermined');
                            $scope.color = 'color:orange;';

                            break;
                    }


                    // console.log("X"+success.data.result+"X");
                },
                function (error) {
                    //console.log("ERROR in getRun: " + JSON.stringify(error));
                    NVRDataModel.log("Error getting RunStatus " + JSON.stringify(error), "error");
                    $scope.color = 'color:red;';
                    $scope.zmRun = $translate.instant('kZMUndetermined');
                }
            );

    }


    //----------------------------------------------------------------------
    // gets ZM load - max[0], avg[1], min[2]
    //----------------------------------------------------------------------
    function getLoadStatus() {
        NVRDataModel.debug("StateCtrl/getLoadStatus: " + apiLoad);
        $http.get(apiLoad)
            .then(
                function (success) {
                    NVRDataModel.debug("Load results: " + JSON.stringify(success));
                    //console.log(JSON.stringify(success));
                    // load returns 3 params - one in the middle is avg.
                    NVRDataModel.debug("StateCtrl/getLoadStatus: success");
                    $scope.zmLoad = success.data.load[1];


                    // console.log("X"+success.data.result+"X");
                },
                function (error) {
                    //console.log("ERROR in getLoad: " + JSON.stringify(error));
                    NVRDataModel.log("Error retrieving loadStatus " + JSON.stringify(error), "error");
                    $scope.zmLoad = 'undetermined';
                }
            );
    }


    //----------------------------------------------------------------------
    // start/stop/restart ZM
    //----------------------------------------------------------------------

    function performZMoperation(str) {


        NVRDataModel.debug("inside performZMoperation with " + str);


        $scope.zmRun = "...";
        $scope.color = 'color:orange;';
        $scope.customState = "";
        NVRDataModel.debug("StateCtrl/controlZM: POST Control command is " + apiExec + str + ".json");
        inProgress = 1;
        $http.post(apiExec + str + ".json")
            .then(
                function (success) {
                    NVRDataModel.debug("StateCtrl/controlZM: returned success");
                    inProgress = 0;
                    switch (str) {
                        case "stop":
                            $scope.zmRun = $translate.instant('kZMStopped');
                            $scope.color = 'color:red;';
                            break;
                        default:
                            $scope.zmRun = $translate.instant('kZMRunning');
                            $scope.color = 'color:green;';
                            getCurrentState();
                            break;

                    }

                },
                function (error) {
                    //if (error.status) // it seems to return error with status 0 if ok
                    // {
                    //console.log("ERROR in Change State:" + JSON.stringify(error));
                    NVRDataModel.debug("StateCtrl/controlZM: returned error");
                    NVRDataModel.log("Error in change run state:" + JSON.stringify(error), "error");
                    $scope.zmRun = $translate.instant('kZMUndetermined');
                    $scope.color = 'color:orange;';
                    inProgress = 0;

                });
    }


    function controlZM(str) {
        if (inProgress) {
            NVRDataModel.debug("StateCtrl/controlZM: operation in progress");
            $ionicPopup.alert({
                title: $translate.instant('kOperationInProgressTitle'),
                template: $translate.instant('kOperationInProgressBody') + '...'
            });
            return;
        }

        var statesearch = "startstoprestart";

        var promptstring = $translate.instant('kStateAreYouSure') + str + ' Zoneminder?';
        if (statesearch.indexOf(str) == -1) {
            promptstring = "Are you sure you want to change state to " + str;
        }


        $rootScope.zmPopup = $ionicPopup.show({
            title: 'Please Confirm',
            template: promptstring,
            buttons: [
                {
                    text: 'Cancel',
                    type: 'button-positive'
                        },
                {
                    text: 'Yes',
                    type: 'button-assertive',
                    onTap: function (e) {
                        performZMoperation(str);
                    }
                }
            ]
        });


    }

    // Binder so template can call controlZM
    $scope.controlZM = function (str) {
        controlZM(str);
    };


    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.$on('$ionicView.leave', function () {
        console.log("**VIEW ** State Ctrl Left");
        // FIXME not the best way...
        // If the user exits a view before its complete,
        // make sure he can come back in and redo
        inProgress = 0;
    });


    $scope.doRefresh = function () {
        console.log("***Pull to Refresh");
        NVRDataModel.debug("StateCtrl/refresh: calling getRun/Load/Disk/CurrentState");
        getRunStatus();
        $timeout(getLoadStatus, 2000);
        $timeout(getCurrentState, 4000);
        //$timeout (getDiskStatus,6000);
        $scope.$broadcast('scroll.refreshComplete');

    };

}]);