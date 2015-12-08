/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.LoginCtrl', ['$scope', '$rootScope', 'zm', '$ionicModal', 'ZMDataModel', '$ionicSideMenuDelegate', '$ionicPopup', '$http', '$q', '$ionicLoading', 'zmAutoLogin', '$cordovaPinDialog', 'EventServer', '$ionicHistory', '$state', '$ionicActionSheet', function ($scope, $rootScope, zm, $ionicModal, ZMDataModel, $ionicSideMenuDelegate, $ionicPopup, $http, $q, $ionicLoading, zmAutoLogin, $cordovaPinDialog, EventServer, $ionicHistory, $state, $ionicActionSheet) {
    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };


    var serverbuttons = [];
    var availableServers;

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
                "id": 0
            }, {
                reload: true
            });
        }
    };

    $scope.loginData = ZMDataModel.getLogin();

    $scope.check = {
        isUseAuth: "",
        isUseEventServer: ""
    };

    $scope.check.isUseAuth = ($scope.loginData.isUseAuth == '1') ? true : false;
    $scope.check.isUseEventServer = ($scope.loginData.isUseEventServer == '1') ? true : false;

    console.log("*************************************************");


    availableServers = Object.keys(ZMDataModel.getServerGroups());
    serverbuttons = [];
    for (var servIter = 0; servIter < availableServers.length; servIter++) {
        serverbuttons.push({
            text: availableServers[servIter]
        });
        console.log("ADDING : " + availableServers[servIter]);
    }

    $scope.serverActionSheet = function () {
        var hideSheet = $ionicActionSheet.show({
            buttons: serverbuttons,
            destructiveText: 'Delete',
            titleText: 'Manage Server Groups',
            cancelText: 'Cancel',
            cancel: function () {
                // add cancel code..
            },
            buttonClicked: function (index) {
                // console.log ("YOU WANT " + serverbuttons[index].text + " INDEX " + index);
                var zmServers = ZMDataModel.getServerGroups();
                $scope.loginData = zmServers[serverbuttons[index].text];
                $scope.check.isUseAuth = ($scope.loginData.isUseAuth == '1') ? true : false;
                $scope.check.isUseEventServer = ($scope.loginData.isUseEventServer == '1') ? true : false;

                ZMDataModel.zmDebug("Retrieved state for this profile:" + JSON.stringify($scope.loginData));

                // lets make sure Event Server is loaded 
                // correctly

                // FIXME: But what happens if you don't save?
                // loginData gets written but auth is not done
                ZMDataModel.setLogin($scope.loginData);

                return true;
            },

            destructiveButtonClicked: function () {
                var zmServers = ZMDataModel.getServerGroups();
                //console.log ("YOU WANT TO DELETE " + $scope.loginData.serverName);
                //console.log ("LENGTH OF SERVERS IS " + Object.keys(zmServers).length);
                if (Object.keys(zmServers).length > 1) {
                    ZMDataModel.zmLog("Deleting " + $scope.loginData.serverName);
                    delete zmServers[$scope.loginData.serverName];
                    ZMDataModel.setServerGroups(zmServers);
                    // point to first element
                    // better than nothing
                    // note this is actually unordered
                    $scope.loginData = zmServers[Object.keys(zmServers)[0]];
                    ZMDataModel.setLogin($scope.loginData);

                    availableServers = Object.keys(ZMDataModel.getServerGroups());
                    serverbuttons = [];
                    for (var servIter = 0; servIter < availableServers.length; servIter++) {
                        serverbuttons.push({
                            text: availableServers[servIter]
                        });
                        console.log("ADDING : " + availableServers[servIter]);
                    }

                } else {
                    ZMDataModel.displayBanner('error', ['Cannot delete, need at least one']);
                }
                return true;
            }


        });
    };



    $scope.eventServerSettings = function () {
        ZMDataModel.zmDebug("Saving settings before going to Event Server settings");
        //console.log ( "My loginData saved " + JSON.stringify($scope.loginData));
        ZMDataModel.setLogin($scope.loginData);
        $state.go("eventserversettings");

    };

    //----------------------------------------------------------------
    // Save anyway when you exit
    //----------------------------------------------------------------

    $scope.$on('$ionicView.beforeLeave', function () {
        // Don't do this -- it will try to login to ZM
        // and go back to the menu
        //saveItems();


    });


    //-------------------------------------------------------------------------
    // Lets make sure we set screen dim properly as we enter
    // The problem is we enter other states before we leave previous states
    // from a callback perspective in ionic, so we really can't predictably
    // reset power state on exit as if it is called after we enter another
    // state, that effectively overwrites current view power management needs
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
        console.log("**VIEW ** LoginCtrl  Entered");
        ZMDataModel.setAwake(false);



    });


    //--------------------------------------------------------------------------
    // When PIN is enabled, this is called to specify a PIN
    // FIXME: Get rid of cordovaPinDialog. It's really not needed 
    //--------------------------------------------------------------------------
    $scope.pinPrompt = function (evt) {
        ZMDataModel.zmLog("Password prompt");
        if ($scope.loginData.usePin) {
            $scope.loginData.pinCode = "";
            $cordovaPinDialog.prompt('Enter PIN', 'PIN Protect').then(
                function (result1) {

                    // console.log (JSON.stringify(result1));
                    if (result1.input1 && result1.buttonIndex == 1) {
                        $cordovaPinDialog.prompt('Reconfirm PIN', 'PIN Protect')
                            .then(function (result2) {
                                    if (result1.input1 == result2.input1) {
                                        ZMDataModel.zmLog("Pin code match");
                                        $scope.loginData.pinCode = result1.input1;
                                    } else {
                                        ZMDataModel.zmLog("Pin code mismatch");
                                        $scope.loginData.usePin = false;
                                        ZMDataModel.displayBanner('error', ['Pin code mismatch']);
                                    }
                                },
                                function (error) {
                                    console.log("Error inside");
                                    $scope.loginData.usePin = false;
                                });
                    } else {
                        $scope.loginData.usePin = false;
                    }
                },
                function (error) {
                    console.log("Error outside");
                    $scope.loginData.usePin = false;
                });



        } else {
            ZMDataModel.zmDebug("Password disabled");
        }
    };

    //-------------------------------------------------------------------------------
    // Makes input easier
    //-------------------------------------------------------------------------------

    $scope.portalKeypress = function (evt) {

        if (/^https:\/\//i.test($scope.loginData.url)) {
            $scope.loginData.useSSL = true;
        }
        // if ($scope.loginData.streamingurl.indexOf($scope.loginData.url) !=0)
        $scope.loginData.streamingurl = $scope.loginData.url + "/cgi-bin";

        // Changed Sep 16 2015: Seems cgi-bin will now have /zm/cgi-bin by
        // default in packages instead of /cgi-bin
        //if ($scope.loginData.streamingurl.slice(-3).toLowerCase() == '/zm') {
        //$scope.loginData.streamingurl = $scope.loginData.streamingurl.slice(0, -3);
        //}


        // if ($scope.loginData.apiurl.indexOf($scope.loginData.url) !=0)
        $scope.loginData.apiurl = $scope.loginData.url + "/api";
    };
    //-------------------------------------------------------------------------------
    // Adds http to url if not present
    // http://stackoverflow.com/questions/11300906/check-if-a-string-starts-with-http-using-javascript
    //-------------------------------------------------------------------------------
    function addhttp(url) {

        if ((!/^(f|ht)tps?:\/\//i.test(url)) && (url != "")) {
            url = "http://" + url;
        }
        return url;
    }


    function addWsOrWss(url) {

        if ((!/^wss?:\/\//i.test(url)) && (url != "")) {
            url = "ws://" + url;
        }
        return url;
    }


    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    //-----------------------------------------------------------------------------
    // Perform the login action when the user submits the login form
    //-----------------------------------------------------------------------------

    function saveItems() {


        console.log('Saving login');
        ZMDataModel.setFirstUse(false);




        /*if (parseInt($scope.loginData.maxMontage) > zm.safeMontageLimit) {
            $ionicPopup.alert({
                title: 'Note',
                template: 'You have selected to view more than 10 monitors in the Montage screen. Note that this is very resource intensive and may load the server or cause issues in the application. If you are not sure, please consider limiting this value to 10'
            });
        }*/

        // lets so some basic sanitization of the data
        // I am already adding "/" so lets remove spurious ones
        // though webkit has no problems. Even so, this is to avoid
        // a deluge of folks who look at the error logs and say
        // the reason the login data is not working is because
        // the app is adding multiple "/" characters

        $scope.loginData.url = $scope.loginData.url.trim();
        $scope.loginData.apiurl = $scope.loginData.apiurl.trim();
        $scope.loginData.username = $scope.loginData.username.trim();
        $scope.loginData.streamingurl = $scope.loginData.streamingurl.trim();
        $scope.loginData.eventServer = $scope.loginData.eventServer.trim();



        $scope.loginData.isUseAuth = ($scope.check.isUseAuth) ? "1" : "0";
        $scope.loginData.isUseEventServer = ($scope.check.isUseEventServer) ? "1" : "0";

        if ($scope.loginData.url.slice(-1) == '/') {
            $scope.loginData.url = $scope.loginData.url.slice(0, -1);

        }

        if ($scope.loginData.apiurl.slice(-1) == '/') {
            $scope.loginData.apiurl = $scope.loginData.apiurl.slice(0, -1);

        }


        if ($scope.loginData.streamingurl.slice(-1) == '/') {
            $scope.loginData.streamingurl = $scope.loginData.streamingurl.slice(0, -1);

        }

        if ($scope.loginData.eventServer.slice(-1) == '/') {
            $scope.loginData.eventServer = $scope.loginData.eventServer.slice(0, -1);

        }
        // strip cgi-bin if it is there but only at the end
        // Nov 17 Don't mess with this path. centos uses zm-cgi-bin of all things

        /*if ($scope.loginData.streamingurl.slice(-7).toLowerCase() == 'cgi-bin') {
            $scope.loginData.streamingurl = $scope.loginData.streamingurl.slice(0, -7);
        }*/

        // check for protocol and if not put it in

        $scope.loginData.url = addhttp($scope.loginData.url);
        $scope.loginData.apiurl = addhttp($scope.loginData.apiurl);
        $scope.loginData.streamingurl = addhttp($scope.loginData.streamingurl);
        $scope.loginData.eventServer = addWsOrWss($scope.loginData.eventServer);

        if ($scope.loginData.useSSL) {
            // replace all http with https
            $scope.loginData.url = $scope.loginData.url.replace("http:", "https:");
            $scope.loginData.apiurl = $scope.loginData.apiurl.replace("http:", "https:");
            $scope.loginData.streamingurl = $scope.loginData.streamingurl.replace("http:", "https:");
            $scope.loginData.eventServer = $scope.loginData.eventServer.replace("ws:", "wss:");


        } else {
            // replace all https with http
            $scope.loginData.url = $scope.loginData.url.replace("https:", "http:");
            $scope.loginData.apiurl = $scope.loginData.apiurl.replace("https:", "http:");
            $scope.loginData.streamingurl = $scope.loginData.streamingurl.replace("https:", "http:");
            // don't do it for WSS - lets mandate that
        }

        var apiurl = $scope.loginData.apiurl + '/host/getVersion.json';
        var portalurl = $scope.loginData.url + '/index.php';



        // Check if isUseAuth is set make sure u/p have a dummy value
        if ($scope.check.isUseAuth) {
            if (!$scope.loginData.username) $scope.loginData.username = "x";
            if (!$scope.loginData.password) $scope.loginData.password = "x";
            ZMDataModel.zmLog("Authentication is disabled, setting dummy user & pass");
        }

        if (parseInt($scope.loginData.maxMontage) <= 0) {
            $scope.loginData.maxMontage = "10";
        }


        // do this before setLogin so message is sent

        if (!$scope.check.isUseEventServer) {
            $rootScope.isAlarm = 0;
            if ($rootScope.apnsToken) {
                ZMDataModel.zmLog("Making sure we don't get push notifications");
                EventServer.sendMessage('push', {
                    type: 'token',
                    platform: $rootScope.platformOS,
                    token: $rootScope.apnsToken,
                    state: "disabled"
                });
            }
        }

        ZMDataModel.setLogin($scope.loginData);

        if ($scope.check.isUseEventServer) {
            EventServer.init();
            if ($rootScope.apnsToken && $scope.loginData.disablePush != '1') {
                ZMDataModel.zmLog("Making sure we get push notifications");
                EventServer.sendMessage('push', {
                    type: 'token',
                    platform: $rootScope.platformOS,
                    token: $rootScope.apnsToken,
                    state: "enabled"
                });
            }
            EventServer.sendMessage("control", {
                type: 'filter',
                monlist: $scope.loginData.eventServerMonitors,
                intlist: $scope.loginData.eventServerInterval
            });

        }





        zmAutoLogin.doLogin("authenticating...")
            // Do the happy menu only if authentication works
            // if it does not work, there is an emitter for auth
            // fail in app.js that will be called to show an error
            // box

        .then(function (data) {

            // Now let's validate if the API works

            ZMDataModel.zmLog("Validating APIs at " + apiurl);
            $http.get(apiurl)
                .success(function (data) {

                    var loginStatus = "Please explore the menu and enjoy zmNinja!";
                    EventServer.refresh();



                    // now grab and report PATH_ZMS
                    ZMDataModel.getPathZms()
                        .then(function (data) {
                            var ld = ZMDataModel.getLogin();
                            var zm_cgi = data.toLowerCase();

                            var user_cgi = (ld.streamingurl).toLowerCase();
                            ZMDataModel.zmLog("ZM relative cgi-path: " + zm_cgi + ", you entered: " + user_cgi);

                            $http.get(ld.streamingurl + "/zms")
                                .success(function (data) {
                                    ZMDataModel.zmDebug("Urk! cgi-path returned  success, but it should not have come here");
                                    loginStatus = "Login validated, but could not validate cgi-path. If live streams don't work please check your cgi-bin path";
                                    $rootScope.zmPopup = $ionicPopup.alert({
                                        title: 'Login validated',
                                        template: loginStatus
                                    }).then(function (res) {
                                        $ionicSideMenuDelegate.toggleLeft();
                                        ZMDataModel.zmDebug("Force reloading monitors...");
                                        var refresh = ZMDataModel.getMonitors(1);
                                    });
                                })
                                .error(function (error, status) {
                                    // If its 5xx, then the cgi-bin path is valid
                                    // if its 4xx then the cgi-bin path is not valid

                                    if (status < 500) {
                                        loginStatus = "The cgi-bin path you entered may be wrong. I can't make sure, but if your live views don't work, please review your cgi path.";
                                    }

                                    $rootScope.zmPopup = $ionicPopup.alert({
                                        title: 'Login validated',
                                        template: loginStatus
                                    }).then(function (res) {
                                        $ionicSideMenuDelegate.toggleLeft();
                                        ZMDataModel.zmDebug("Force reloading monitors...");
                                        var refresh = ZMDataModel.getMonitors(1);
                                    });


                                });
                        });



                })
                .error(function (error) {
                    ZMDataModel.displayBanner('error', ['ZoneMinder API check failed', 'Please check API settings']);
                    ZMDataModel.zmLog("API login error " + JSON.stringify(error));
                    $rootScope.zmPopup= $ionicPopup.alert({
                        title: 'Login validated but API failed',
                        template: 'Please check your API settings'
                    });
                });



        });
    }

    $scope.saveItems = function () {

        if (!$scope.loginData.serverName) {
            $rootScope.zmPopup = $ionicPopup.alert({
                    title: 'Error',
                    template: 'Server Name cannot be empty',
                })
                .then(function (res) {
                    return;
                });
        } else {
            saveItems();
            availableServers = Object.keys(ZMDataModel.getServerGroups());
            serverbuttons = [];
            for (var servIter = 0; servIter < availableServers.length; servIter++) {
                serverbuttons.push({
                    text: availableServers[servIter]
                });
                // console.log ("ADDING : "+availableServers[servIter]);
            }

        }


    };


}]);