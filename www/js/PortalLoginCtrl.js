/* jshint -W041 */
/* jshint -W083 */
/*This is for the loop closure I am using in line 143 */
/* jslint browser: true*/
/* global vis,cordova,StatusBar,angular,console,moment */
angular.module('zmApp.controllers').controller('zmApp.PortalLoginCtrl', ['$ionicPlatform', '$scope', 'zm', 'NVRDataModel', '$ionicSideMenuDelegate', '$rootScope', '$http', '$q', '$state', '$ionicLoading', '$ionicPopover', '$ionicScrollDelegate', '$ionicModal', '$timeout', 'zmAutoLogin', '$ionicHistory', '$cordovaTouchID', 'EventServer', '$translate', function ($ionicPlatform, $scope, zm, NVRDataModel, $ionicSideMenuDelegate, $rootScope, $http, $q, $state, $ionicLoading, $ionicPopover, $ionicScrollDelegate, $ionicModal, $timeout, zmAutoLogin, $ionicHistory, $cordovaTouchID, EventServer, $translate) {


    $scope.$on('$ionicView.enter',
        function () {

            NVRDataModel.debug("Inside Portal login Enter handler");
            loginData = NVRDataModel.getLogin();

            $ionicHistory.nextViewOptions({
                disableBack: true
            });


            $scope.pindata = {};
            if ($ionicSideMenuDelegate.isOpen()) {
                $ionicSideMenuDelegate.toggleLeft();
                NVRDataModel.debug("Sliding menu close");
            }


            $scope.pinPrompt = false; // if true, then PIN is displayed else skip 

            if (NVRDataModel.isLoggedIn()) {
                NVRDataModel.log("User credentials are provided");



                // You can login either via touch ID or typing in your code     
                if ($ionicPlatform.is('ios') && loginData.usePin) {
                    $cordovaTouchID.checkSupport()
                        .then(function () {
                            // success, TouchID supported
                            $cordovaTouchID.authenticate("")
                                .then(function () {
                                        NVRDataModel.log("Touch Success");
                                        // Don't assign pin as it may be alphanum
                                        unlock(true);

                                    },
                                    function () {
                                        NVRDataModel.log("Touch Failed");
                                    });
                        }, function (error) {
                            NVRDataModel.log("TouchID not supported");
                        });
                } else // touch was not used
                {
                    NVRDataModel.log("not checking for touchID");
                }

                if (loginData.usePin) {
                    // this shows the pin prompt on screen
                    $scope.pinPrompt = true;
                    // dont call unlock, let the user type in code

                } else // no PIN Code so go directly to auth
                {

                    unlock(true);
                }

            } else // login creds are not present
            {
                NVRDataModel.debug("PortalLogin: Not logged in, so going to login");
                if (NVRDataModel.isFirstUse()) {
                    NVRDataModel.debug("First use, showing warm and fuzzy...");
                    $ionicHistory.nextViewOptions({
                        disableAnimate: true,
                        disableBack: true
                    });
                    $state.go('first-use');
                } else {
                    if (!$rootScope.userCancelledAuth) {
                        $ionicHistory.nextViewOptions({
                            disableAnimate: true,
                            disableBack: true
                        });
                        $state.go("login", {
                            "wizard": false
                        });
                    } else {
                        // do this only once - rest for next time
                        $rootScope.userCancelledAuth = false;
                    }
                }
            }

        });

    //-------------------------------------------------------------------------------
    // remove status is pin is empty
    //-------------------------------------------------------------------------------

    $scope.pinChange = function () {
        if ($scope.pindata.pin == null) {
            $scope.pindata.status = "";
        }
    };

    //-------------------------------------------------------------------------------
    // unlock app if PIN is correct
    //-------------------------------------------------------------------------------
    $scope.unlock = function () {
        // call with false meaning check for pin
        unlock(false);
    };


    //------------------------------------------------------------------------
    // Aaron Lager hack - can't figure out why he gets a 401 after
    // successful login and then it works after resaving
    //------------------------------------------------------------------------
    function tryLoggingSecondTimeHack() {
        var d = $q.defer();

        zmAutoLogin.doLogin("<button class='button button-clear' style='line-height: normal; min-height: 0; min-width: 0;color:#fff;' ng-click='$root.cancelAuth()'><i class='ion-close-circled'></i>&nbsp;" + $translate.instant('kAuthenticating') + "...</button>")
            .then(function (data) // success
                {
                    NVRDataModel.debug("2nd auth login worked");
                    NVRDataModel.getAPIversion()
                        .then(function (data) {
                                NVRDataModel.getKeyConfigParams(1);
                                NVRDataModel.log("2nd auth:Got API version: " + data);
                                $rootScope.apiVersion = data;
                                var ld = NVRDataModel.getLogin();
                                if (NVRDataModel.versionCompare(data, zm.minAppVersion) == -1 && data != "0.0.0") {

                                    $state.go('lowversion', {
                                        "ver": data
                                    });
                                }

                                if (NVRDataModel.versionCompare(data, zm.recommendedAppVersion) == -1 && data != "0.0.0") {

                                    $state.go('importantmessage', {
                                        "ver": data
                                    });
                                }

                                if (data == "0.0.0") {

                                    NVRDataModel.log("2nd Auth:API getVersion succeeded but returned 0.0.0 " + JSON.stringify(data));
                                    NVRDataModel.displayBanner('error', ['ZoneMinder authentication failed']);
                                    $state.go("login", {
                                        "wizard": false
                                    });

                                }
                                // coming here means continue
                                EventServer.refresh();
                                var statetoGo = $rootScope.lastState ? $rootScope.lastState : 'montage';
                                //NVRDataModel.debug ("logging state transition");
                                NVRDataModel.debug("2nd Auth: Transitioning state to: " +
                                    statetoGo + " with param " + JSON.stringify($rootScope.lastStateParam));
                                $state.go(statetoGo, $rootScope.lastStateParam);

                            },
                            function (error) {
                                NVRDataModel.debug("2nd auth API failed, going to login");
                                d.reject("failed 2nd auth");
                                return (d.promise);

                            });


                },
                function (error) {
                    NVRDataModel.debug("2nd auth hack failed, going to login");
                    d.reject("failed 2nd auth");
                    return (d.promise);
                });

        return (d.promise);
    }

    function unlock(idVerified) {
        /*
        idVerified == true means no pin check needed
                   == false means check PIN
        */

        NVRDataModel.debug("unlock called with check PIN=" + idVerified);
        if (idVerified || ($scope.pindata.pin == loginData.pinCode)) {
            NVRDataModel.debug("PIN code entered is correct, or there is no PIN set");
            $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
            zmAutoLogin.stop(); //safety
            zmAutoLogin.start();

            // PIN is fine, or not set so lets login
            zmAutoLogin.doLogin("<button class='button button-clear' style='line-height: normal; min-height: 0; min-width: 0;color:#fff;' ng-click='$root.cancelAuth()'><i class='ion-close-circled'></i>&nbsp;" + $translate.instant('kAuthenticating') + "...</button>")
                .then(function (data) // success
                    {
                        NVRDataModel.debug("PortalLogin: auth success");
                        NVRDataModel.getKeyConfigParams(1);
                        NVRDataModel.getTimeZone();
                        // $state.go("login" ,{"wizard": false});
                        //login was ok, so get API details
                        NVRDataModel.getAPIversion()
                            .then(function (data) {
                                    NVRDataModel.log("Got API version: " + data);
                                    $rootScope.apiVersion = data;
                                    var ld = NVRDataModel.getLogin();
                                    if (NVRDataModel.versionCompare(data, zm.minAppVersion) == -1 && data != "0.0.0") {

                                        $state.go('lowversion', {
                                            "ver": data
                                        });
                                    }

                                    if (NVRDataModel.versionCompare(data, zm.recommendedAppVersion) == -1 && data != "0.0.0") {

                                        $state.go('importantmessage', {
                                            "ver": data
                                        });
                                    }

                                    if (data == "0.0.0") {

                                        NVRDataModel.log("API getVersion succeeded but returned 0.0.0 " + JSON.stringify(data));
                                        NVRDataModel.displayBanner('error', ['ZoneMinder authentication failed']);
                                        $state.go("login", {
                                            "wizard": false
                                        });

                                    }
                                    // coming here means continue
                                    EventServer.refresh();
                                    var statetoGo = $rootScope.lastState ? $rootScope.lastState : 'montage';
                                    NVRDataModel.debug("logging state transition");
                                    NVRDataModel.debug("Transitioning state to: " +
                                        statetoGo + " with param " + JSON.stringify($rootScope.lastStateParam));
                            
                                    
                                    $state.go(statetoGo, $rootScope.lastStateParam);
                                   
                                },
                                function (error) { // API Error
                                    NVRDataModel.log("API Error handler: going to login getAPI returned error: " + JSON.stringify(error));
                                    //NVRDataModel.displayBanner('error', ['ZoneMinder authentication failed']);

                                    NVRDataModel.debug("Doing the Aaron Hack after 1 sec....");
                                    $timeout(function () {
                                        tryLoggingSecondTimeHack()
                                            .then(function success(s) {
                                                    NVRDataModel.log("2nd time login hack worked!, nothing to do");
                                                    NVRDataModel.getTimeZone();
                                                },
                                                function error(e) {
                                                    $state.go("login", {
                                                        "wizard": false
                                                    });
                                                });

                                    }, 1000);

                                });


                        if ($rootScope.tappedNotification) {


                            var ld = NVRDataModel.getLogin();
                            NVRDataModel.log("Came via push tap. onTapScreen=" + ld.onTapScreen);
                            //console.log ("***** NOTIFICATION TAPPED  ");
                            $rootScope.tappedNotification = 0;
                            $ionicHistory.nextViewOptions({
                                disableBack: true
                            });

                            if (ld.onTapScreen == $translate.instant('kTapMontage')) {
                                NVRDataModel.debug("Going to montage");
                                $state.go("montage", {}, {
                                    reload: true
                                });

                                return;
                            } else if (ld.onTapScreen == $translate.instant('kTapEvents')) {
                                NVRDataModel.debug("Going to events");
                                $state.go("events", {
                                    "id": 0,
                                    "playEvent":false
                                }, {
                                    reload: true
                                });
                                return;
                            } else // we go to live
                            {
                                NVRDataModel.debug("Going to live view ");
                                $state.go("monitors", {}, {
                                    reload: true
                                });
                                return;
                            }
                        }


                    },
                    // coming here means auth error
                    // so go back to login
                    function (error) {
                        NVRDataModel.debug("PortalLogin: error authenticating " +
                            JSON.stringify(error));
                        if (!$rootScope.userCancelledAuth) {
                            NVRDataModel.displayBanner('error', ['ZoneMinder authentication failed', 'Please check API settings']);
                            $ionicHistory.nextViewOptions({
                                disableAnimate: true,
                                disableBack: true
                            });
                            $state.go("login", {
                                "wizard": false
                            });
                        } else {
                            // if user cancelled auth I guess we go to login
                            $rootScope.userCancelledAuth = false;
                            $state.go("login", {
                                "wizard": false
                            });
                        }
                    });
        } else {
            $scope.pindata.status = "Invalid PIN";

            // wobble the input box on error
            var element = angular.element(document.getElementById("pin-box"));

            element.addClass("animated shake")
                .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
                    function () {
                        element.removeClass("animated shake");
                    });
        }
    }

    //-------------------------------------------------------------------------------
    // Controller Main
    //-------------------------------------------------------------------------------
    // console.log("************* ENTERING PORTAL MAIN ");
    NVRDataModel.log("Entering Portal Main");
    var loginData;
    $ionicSideMenuDelegate.canDragContent(true);



    }]);