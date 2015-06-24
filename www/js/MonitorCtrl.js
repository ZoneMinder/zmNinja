/* jshint -W041, -W083 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

// controller for Monitor View
// refer to comments in EventCtrl for the modal stuff. They are almost the same

angular.module('zmApp.controllers').controller('zmApp.MonitorCtrl', ['$ionicPopup', '$scope', 'ZMDataModel', 'message', '$ionicSideMenuDelegate', '$ionicLoading', '$ionicModal', '$state', '$http', function ($ionicPopup, $scope, ZMDataModel, message, $ionicSideMenuDelegate, $ionicLoading, $ionicModal, $state, $http, $rootScope, $timeout) {


    //-----------------------------------------------------------------------
    // Controller Main
    //-----------------------------------------------------------------------

    console.log("***EVENTS: Waiting for Monitors to load before I proceed");
    $scope.monitors = [];
    $scope.monitors = message;
    var loginData = ZMDataModel.getLogin();
    monitorStateCheck();


    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };


    //-----------------------------------------------------------------------
    // All we do here is create a new random val for the URL so the
    // image regenerates
    //-----------------------------------------------------------------------
    $scope.reloadView = function () {
        console.log("*** Refreshing Modal view ***");
        $scope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
        $ionicLoading.show({
            template: "refreshed view",
            noBackdrop: true,
            duration: 2000
        });
    };

    //-----------------------------------------------------------------------
    // This function takes care of changing monitor parameters
    // For now, I've only limited it to enable/disable and change monitor mode
    // and changing monitor function
    //-----------------------------------------------------------------------
    $scope.changeConfig = function (monitorName, monitorId, enabled, func) {
        var checked = "false";
        console.log("called with " + monitorId + ":" + enabled + ":" + func);
        if (enabled == '1') checked = "true";

        $scope.monFunctions = [
            {
                text: "Modect",
                value: "Modect"
            },
            {
                text: "Mocord",
                value: "Mocord"
            },
            {
                text: "Record",
                value: "Record"
            },
            {
                text: "Nodect",
                value: "Nodect"
            },
            {
                text: "Monitor",
                value: "Monitor"
            },
            {
                text: "None",
                value: "None"
            }
        ];

        $scope.monfunc = {
            myfunc: func,
            myenabled: checked
        };

        var getConfig = $ionicPopup.show({
            scope: $scope,
            template: '<ion-toggle ng-model="monfunc.myenabled" ng-checked="{{monfunc.myenabled}}"  toggle-class="toggle-calm">Enabled</ion-toggle><ion-radio ng-repeat="item in monFunctions" ng-value="item.value" ng-model="monfunc.myfunc"> {{item.text}} </ion-radio>',


            title: 'Change Settings for ' + monitorName,

            buttons: [
                {
                    text: 'Cancel',

                },
                {
                    text: 'Save',
                    onTap: function (e) {
                        console.log("YOU SELECTED " + $scope.monfunc.myenabled + $scope.monfunc.myfunc);
                        var loginData = ZMDataModel.getLogin();
                        var apiRestart = loginData.apiurl + "/states/change/restart.json";
                        var apiMon = loginData.apiurl + "/monitors/" + monitorId + ".json";

                        console.log("VARS: " + apiRestart + ">>" + apiMon);

                        var isEnabled = "";
                        isEnabled = ($scope.monfunc.myenabled == true) ? '1' : '0';

                        $http({
                            url: apiMon,
                            method: 'post',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Accept': '*/*',
                            },
                            transformRequest: function (obj) {
                                var str = [];
                                for (var p in obj)
                                    str.push(encodeURIComponent(p) + "=" +
                                             encodeURIComponent(obj[p]));
                                var foo = str.join("&");
                                console.log("****RETURNING " + foo);
                                return foo;
                            },
                            data: {
                                'Monitor[Function]': $scope.monfunc.myfunc,
                                'Monitor[Enabled]': isEnabled,
                            }

                        })

                        // I am restarting ZM after monitor change
                        // do I need this? FIXME: Ask Kyle
                        .success(function () {

                                $ionicLoading.show({
                                    template:
                                    "Successfully changed Monitor. Please wait, restarting ZoneMinder...",
                                    noBackdrop: true,
                                    duration: 60000,
                                });
                                $http.post(apiRestart)
                                    .then(function (success) {
                                            $ionicLoading.hide();
                                            var refresh = ZMDataModel.getMonitors(1);
                                            refresh.then(function (data) {
                                                $scope.monitors = data;
                                                $scope.$broadcast('scroll.refreshComplete');
                                            });

                                        },
                                        function (error) {
                                            $ionicLoading.hide();

                                        }
                                    );

                            })
                            .error(function (data, status, headers, config) {
                                $ionicLoading.show({
                                    template: "Error changing Monitor. Please check ZM logs...",
                                    noBackdrop: true,
                                    duration: 3000,
                                });
                            });

                    }



                },
                ]
        });

    };



    // same logic as EventCtrl.js
    $scope.finishedLoadingImage = function () {
        console.log("***Monitor image FINISHED Loading***");
        $ionicLoading.hide();
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

    $scope.openModal = function (mid, controllable) {
        console.log("Open Monitor Modal with monitor Id=" + mid + " and Controllable:" + controllable);

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
                $scope.isControllable = controllable;
                $scope.showPTZ = false;
                $scope.modal.show();
            });

        // do a post login for PTZ
        var loginData = ZMDataModel.getLogin();
        console.log("*** MODAL PORTAL LOGIN ****");
        $http({
                method: 'POST',
                url: loginData.url + '/index.php',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" +
                            encodeURIComponent(obj[p]));
                    var foo = str.join("&");
                    console.log("****RETURNING " + foo);
                    return foo;
                },

                data: {
                    username: loginData.username,
                    password: loginData.password,
                    action: "login",
                    view: "console"
                }
            })
            .success(function (data) {
                console.log("**** PORTAL  LOGIN OK");
            })
            .error(function (error) {
                console.log("**** PORTAL LOGIN FAILED");
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

    $scope.togglePTZ = function () {
        $scope.showPTZ = !$scope.showPTZ;
    };

    function controlPTZ(monitorId, cmd) {

        console.log("Command value " + cmd + " with MID=" + monitorId);
        $ionicLoading.hide();
        $ionicLoading.show({
            template: "please wait...",
            noBackdrop: true,
            duration: 15000,
        });

        var loginData = ZMDataModel.getLogin();
        $ionicLoading.hide();
        $ionicLoading.show({
            template: "Sending PTZ..",
            noBackdrop: true,
            duration: 15000,
        });
        // console.log ("ANGULAR VERSION: "+JSON.stringify(angular.version));
        // console.log('Set-Cookie'+ header('Set-Cookie')); //

        var req = $http({
            method: 'POST',
            /*timeout: 15000,*/
            url: loginData.url + '/index.php',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            transformRequest: function (obj) {
                var str = [];
                for (var p in obj)
                    str.push(encodeURIComponent(p) + "=" +
                        encodeURIComponent(obj[p]));
                var foo = str.join("&");
                console.log("****RETURNING " + foo);
                return foo;
            },

            // FIXME: Refer to
            // zoneminder/skins/mobile/includes/control_functions.php
            // for move commands
            // logic - /zm/api/monitors/X.json, read ControlId = Y
            // then zm/api/controls/Y.json

            data: {
                view: "request",
                request: "control",
                id: monitorId,
                //connkey: $scope.connKey,
                control: "moveCon" + cmd,
                xge: "30",
                yge: "30",
                //user: loginData.username,
                //pass: loginData.password
            }

        });

        req.success(function (resp) {
            $ionicLoading.hide();
            console.log("SUCCESS: " + JSON.stringify(resp));

            // $ionicLoading.hide();

        });

        req.error(function (resp) {
            $ionicLoading.hide();
            console.log("ERROR: " + JSON.stringify(resp));
        });

    }


    function monitorStateCheck() {
        var apiMonCheck;

        // The status is provided by zmdc.pl
        // "not running", "pending", "running since", "Unable to connect"

        for (var i = 0; i < $scope.monitors.length; i++) {
            (function (j) {
                $scope.monitors[j].Monitor.isRunningText = "...";
                $scope.monitors[j].Monitor.isRunning = "...";
                $scope.monitors[j].Monitor.color = '#1E90FF';
                $scope.monitors[j].Monitor.char = "ion-checkmark-circled";
                apiMonCheck = loginData.apiurl + "/monitors/daemonStatus/id:" + $scope.monitors[j].Monitor.Id + "/daemon:zmc.json";
                console.log("**** ZMC CHECK " + apiMonCheck);
                $http.get(apiMonCheck)
                    .success(function (data) {
                        if (data.statustext.indexOf("not running") > -1) {
                            $scope.monitors[j].Monitor.isRunning = "false";
                            $scope.monitors[j].Monitor.color = 'red';
                            $scope.monitors[j].Monitor.char = "ion-close-circled";
                        } else if (data.statustext.indexOf("pending") > -1) {
                            $scope.monitors[j].Monitor.isRunning = "pending";
                            $scope.monitors[j].Monitor.color = 'orange';
                        } else if (data.statustext.indexOf("running since") > -1) {
                            $scope.monitors[j].Monitor.isRunning = "true";
                            $scope.monitors[j].Monitor.color = 'green';
                        } else if (data.statustext.indexOf("Unable to connect") > -1) {
                            $scope.monitors[j].Monitor.isRunning = "false";
                            $scope.monitors[j].Monitor.color = 'red';
                            $scope.monitors[j].Monitor.char = "ion-close-circled";
                        }


                        $scope.monitors[j].Monitor.isRunningText = data.statustext;
                    })
                    .error(function (data) {
                        $scope.monitors[j].Monitor.isRunning = "error";
                        $scope.monitors[j].Monitor.color = '#800000';
                        $scope.monitors[j].Monitor.char = "ion-help-circled";
                    });


            })(i);
        }
    }
    $scope.doRefresh = function () {
        console.log("***Pull to Refresh");
        $scope.monitors = [];

        var refresh = ZMDataModel.getMonitors(1);

        refresh.then(function (data) {
            $scope.monitors = data;
            monitorStateCheck();
            $scope.$broadcast('scroll.refreshComplete');
        });

    };

}]);
