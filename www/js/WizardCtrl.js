/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console, Masonry, URI */

angular.module('zmApp.controllers').controller('zmApp.WizardCtrl', ['$scope', '$rootScope', '$ionicModal', 'ZMDataModel', '$ionicSideMenuDelegate', '$ionicHistory', '$state', '$ionicPopup', 'SecuredPopups', '$http', '$q', 'zm', '$ionicLoading', 'WizardHandler', '$translate', function ($scope, $rootScope, $ionicModal, ZMDataModel, $ionicSideMenuDelegate, $ionicHistory, $state, $ionicPopup, SecuredPopups, $http, $q, zm, $ionicLoading, WizardHandler, $translate) {
    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };


    //--------------------------------------------------------------------------
    // logs into ZM
    //--------------------------------------------------------------------------

    function login(u, zmu, zmp) {
        var d = $q.defer();

        $http({
                method: 'POST',
                //withCredentials: true,
                url: u,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" +
                            encodeURIComponent(obj[p]));
                    var params = str.join("&");
                    return params;
                },

                data: {
                    username: zmu,
                    password: zmp,
                    action: "login",
                    view: "console"
                }
            })
            .success(function (data, status, headers) {
                console.log("LOOKING FOR " + zm.loginScreenString);
                console.log("DATA RECEIVED " + JSON.stringify(data));
                if (data.indexOf(zm.loginScreenString) == -1) {

                    $scope.wizard.loginURL = $scope.wizard.fqportal;
                    $scope.wizard.portalValidText = $translate.instant('kPortal') + ": " + $scope.wizard.loginURL;
                    $scope.wizard.portalColor = "#16a085";
                    d.resolve(true);
                    return d.promise;
                } else {
                    console.log("************ERROR");
                    $scope.wizard.portalValidText = $translate.instant('kPortalDetectionFailed');
                    $scope.wizard.portalColor = "#e74c3c";
                    d.reject(false);
                    return d.promise;
                }
            })
            .error(function (error) {
                console.log("************ERROR");
                $scope.wizard.portalValidText = $translate.instant('kPortalDetectionFailed');
                $scope.wizard.portalColor = "#e74c3c";
                d.reject(false);
                return d.promise;

            });

        return d.promise;

    }

    //--------------------------------------------------------------------------
    // we need a monitor ID to do cgi-bin detection - if you don't have 
    // monitors configured, cgi-bin won't work
    //--------------------------------------------------------------------------

    function getFirstMonitor() {
        var d = $q.defer();
        $http.get($scope.wizard.apiURL + "/monitors.json")
            .then(function (success) {
                    console.log("getfirst monitor success: " + JSON.stringify(success));
                    if (success.data.monitors.length > 0) {
                        var foundMid = -1;
                        for (var i = 0; i < success.data.monitors.length; i++) {
                            if (success.data.monitors[i].Monitor.Function != 'None' &&
                                success.data.monitors[i].Monitor.Enabled == '1') {
                                foundMid = success.data.monitors[i].Monitor.Id;
                                break;
                            }
                        }

                        if (foundMid != -1) {
                            ZMDataModel.zmDebug("zmWizard - getFirstMonitor returned " + foundMid);
                            d.resolve(foundMid);
                            return d.promise;
                        } else {
                            d.reject(false);
                            return d.promise;
                        }



                    } else {
                        d.reject(false);
                        return d.promise;
                    }
                },
                function (error) {
                    console.log("getfirst monitor error: " + JSON.stringify(error));
                    d.reject(false);
                    return d.promise;
                });
        return d.promise;
    }

    //--------------------------------------------------------------------------
    // Utility function - iterates through a list of URLs 
    // Don't put loginData.reachability here --> we are using this to iterate
    // through multiple options - not the same as fallback
    //--------------------------------------------------------------------------

    function findFirstReachableUrl(urls, tail) {
        var d = $q.defer();
        if (urls.length > 0) {
            var t = "";
            if (tail) t = tail;
            //$ionicLoading.show({template: 'trying ' + urls[0].server});
            ZMDataModel.zmLog("zmWizard test.." + urls[0] + t);
            return $http.get(urls[0] + t).then(function () {
                ZMDataModel.zmLog("Success:  on " + urls[0] + t);
                //$ionicLoading.hide();
                return urls[0];
            }, function (err) {
                ZMDataModel.zmLog("zmWizard:Failed on " + urls[0] + t + " with error " + JSON.stringify(err));
                return findFirstReachableUrl(urls.slice(1), tail);
            });
        } else {
            // $ionicLoading.hide();
            ZMDataModel.zmLog("zmWizard: findFirst returned no success");
            d.reject("No reachable URL");
            return d.promise;

        }

        return d.promise;

    }

    //--------------------------------------------------------------------------
    // removes proto scheme from string
    //--------------------------------------------------------------------------

    function stripProto(u) {
        if (u.indexOf('://') != -1)
            return u.substr(u.indexOf('://') + 3);
        else
            return u;
    }

    //--------------------------------------------------------------------------
    // tries to detect cgi-bin
    //--------------------------------------------------------------------------

    function detectcgi() {
        var d = $q.defer();
        var c = URI.parse($scope.wizard.loginURL);
        var p1, p2;
        p1 = "";
        p2 = "";

        if (c.userinfo)
            p1 = c.userinfo + "@";
        if (c.port)
            p2 = ":" + c.port;

        var baseUri = c.scheme + "://" + p1 + c.host + p2;

        ZMDataModel.zmLog("zmWizard CGI: baseURL is " + baseUri);

        var a4 = baseUri + "/cgi-bin/zm"; // another one I found with a CentOS 6 guy
        var a3 = baseUri + "/zm/cgi-bin"; // ubuntu/debian
        var a2 = baseUri + "/cgi-bin-zm"; //fedora/centos/rhel
        var a1 = baseUri + "/cgi-bin"; // doofus


        var urls = [a1, a2, a3, a4];


        ZMDataModel.getPathZms() // what does ZM have stored in PATH_ZMS?
            .then(function (data) {
                    // remove zms or nph-zms
                    var path = data.trim();
                    path = path.replace("/nph-zms", "");
                    path = path.replace("/zms", "");
                    urls.push(baseUri.trim() + path);
                    ZMDataModel.zmLog("zmWizard: getPathZMS succeeded, adding " + baseUri + path + " to things to try");
                    continueCgi(urls);
                },
                function (error) {
                    ZMDataModel.zmLog("zmWizard: getPathZMS failed, but continuing...");
                    continueCgi(urls);
                });

        // Well, PATH_ZMS or not, lets call this function and brute force it
        function continueCgi(urls) {
            $ionicLoading.show({
                template: $translate.instant('kDiscovering') + "...",
                noBackdrop: true,
                duration: zm.httpTimeout
            });
            getFirstMonitor()
                .then(function (success) {
                        $ionicLoading.hide();
                        var tail = "/nph-zms?mode=single&monitor=" + success;
                        if ($scope.wizard.useauth && $scope.wizard.usezmauth) {

                            var ck = Math.floor(Math.random() * (50000 - 10000 + 1)) + 10000;
                            ZMDataModel.getAuthKey(success, ck)
                                .then(function (success) {
                                        if (success == "") {
                                            ZMDataModel.zmLog("getAuthKey returned null, so going user=&pwd= way");
                                            tail += "&user=" + $scope.wizard.zmuser + "&pass=" + $scope.wizard.zmpassword;
                                        } else {
                                            tail += success;
                                        }
                                        ZMDataModel.zmLog("auth computed is : " + tail);
                                        proceedwithCgiAfterAuth(urls, tail);
                                    },
                                    function (error) {
                                        ZMDataModel.zmLog("Should never come here, getAuthKey doesn't return error");

                                    });


                            //console.log ("****CDING " + tail);
                        } else // no auth case
                        {
                            proceedwithCgiAfterAuth(urls, tail);
                        }

                        function proceedwithCgiAfterAuth(urls, tail) {

                            $ionicLoading.show({
                                template: $translate.instant('kDiscovering') + "...",
                                noBackdrop: true,
                                duration: zm.httpTimeout
                            });

                            findFirstReachableUrl(urls, tail)
                                .then(function (success) {
                                        $ionicLoading.hide();
                                        ZMDataModel.zmLog("Valid cgi-bin found with: " + success);
                                        $scope.wizard.streamingURL = success;
                                        $scope.wizard.streamingValidText = "cgi-bin: " + $scope.wizard.streamingURL;
                                        $scope.wizard.streamingColor = "#16a085";
                                        d.resolve(true);
                                        return d.promise;

                                    },
                                    function (error) {
                                        $ionicLoading.hide();
                                        console.log("No cgi-bin found: " + error);
                                        $scope.wizard.streamingValidText = $translate.instant('kPortalCgiBinFailed');
                                        $scope.wizard.streamingColor = "#e74c3c";
                                        d.reject(false);
                                        return (d.promise);
                                    });
                        }
                    },
                    function (error) {
                        $ionicLoading.hide();
                        $scope.wizard.streamingValidText = $translate.instant('kPortalCgiBinFailed') + " -" + $translate.instant('kPortalNoMonitorFound');
                        $scope.wizard.streamingColor = "#e74c3c";
                        d.reject(false);
                        return (d.promise);

                    });
        }

        // https://server/zm/cgi-bin/nph-zms?mode=single&monitor=1&user=admin&pass=cc

        return d.promise;

    }


    //--------------------------------------------------------------------------
    // Finds an appropriate API to use
    //--------------------------------------------------------------------------

    function detectapi() {
        var u = $scope.wizard.loginURL;
        var d = $q.defer();
        var api1 = u + "/api";
        var api3 = u + "/zm/api";
        var c = URI.parse(u);

        // lets also try without the path
        var api2 = c.scheme + "://";
        if (c.userinfo) api2 += c.userinfo + "@";
        api2 += c.host;
        if (c.port) api2 += ":" + c.port;
        api2 += "/api";



        // lets try both /zm/api and /api. What else is there?
        var apilist = [api1, api2, api3];

        findFirstReachableUrl(apilist, '/host/getVersion.json')
            .then(function (success) {
                    ZMDataModel.zmLog("Valid API response found with:" + success);
                    $scope.wizard.apiURL = success;



                    $scope.wizard.apiValidText = "API: " + $scope.wizard.apiURL;
                    $scope.wizard.apiColor = "#16a085";
                    d.resolve(true);
                    return d.promise;
                },
                function (error) {
                    console.log("No APIs found: " + error);
                    $scope.wizard.apiValidText = $translate.instant('kPortalAPIFailed');
                    $scope.wizard.apiColor = "#e74c3c";
                    d.reject(false);
                    return (d.promise);
                });

        return d.promise;
    }

    //--------------------------------------------------------------------------
    // logs out of ZM
    //--------------------------------------------------------------------------


    function logout(u) {
        var d = $q.defer();

        $http({
                method: 'POST',
                url: u,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" +
                            encodeURIComponent(obj[p]));
                    var params = str.join("&");
                    return params;
                },

                data: {
                    action: "logout",
                    view: "login"
                }
            })
            .then(function (success) {
                $rootScope.zmCookie = "";
                console.log("ZMlogout success, cookie removed");
                d.resolve(true);
                return d.promise;
            }, function (error) {
                console.log("ZMlogout success");
                d.resolve(true);
                return d.promise;
            });


        return d.promise;

    }

    //--------------------------------------------------------------------------
    // clears all status updates in the verify results page - if you 
    // get back to it
    //--------------------------------------------------------------------------

    $scope.enterResults = function () {
        $scope.portalValidText = "";
        $scope.apiValidateText = "";
        $scope.streamingValidateText = "";
        $scope.wizard.fqportal = "";
        return true;
    };
    //--------------------------------------------------------------------------
    // tries to log into the portal and then discover api and cgi-bin
    //--------------------------------------------------------------------------

    function validateData() {
        $rootScope.authSession = 'undefined';
        $rootScope.zmCookie = '';

        $scope.wizard.portalValidText = "";
        $scope.wizard.apiValidText = "";
        $scope.wizard.streamingValidText = "";
        $scope.wizard.fqportal = "";
        $scope.wizard.loginURL = "";
        $scope.wizard.apiURL = "";
        $scope.wizard.streamingURL = "";
        $scope.wizard.serverName = "";

        var d = $q.defer();

        var c = URI.parse($scope.wizard.portalurl);

        $scope.wizard.serverName = c.host;
        if (c.port)
            $scope.wizard.serverName += "-" + c.port;

        var b = "";
        if ($scope.wizard.useauth && $scope.wizard.usebasicauth) {
            b = $scope.wizard.basicuser + ":" + $scope.wizard.basicpassword + "@";
            console.log("B=" + b);
        }
        var u = c.scheme + "://" + b + c.host;
        if (c.port) u += ":" + c.port;
        if (c.path) u += c.path;


        if (u.slice(-1) == '/') {
            u = u.slice(0, -1);

        }

        $scope.wizard.fqportal = u;

        u = u + '/index.php';
        ZMDataModel.zmLog("Wizard: login url is " + u);

        // now lets login

        var zmu = "x";
        var zmp = "x";
        if ($scope.wizard.usezmauth) {
            zmu = $scope.wizard.zmuser;
            zmp = $scope.wizard.zmpassword;
        }

        // logout first for the adventurers amongst us who must
        // use it even after logging in
        ZMDataModel.zmLog("zmWizard: logging out");
        $ionicLoading.show({
            template: $translate.instant('kCleaningUp') + "...",
            noBackdrop: true,
            duration: zm.httpTimeout
        });
        logout(u)
            .then(function (ans) {
                // login now
                $ionicLoading.hide();
                ZMDataModel.zmLog("zmWizard: logging in with " + u + " " + zmu + ":" + zmp);

                // The logic will be:
                // Login then do an api detect and cgi-detect together
                $ionicLoading.show({
                    template: $translate.instant('kDiscoveringPortal') + "...",
                    noBackdrop: true,
                    duration: zm.httpTimeout
                });
                login(u, zmu, zmp)
                    .then(function (success) {
                            $ionicLoading.hide();
                            ZMDataModel.zmLog("zmWizard: login succeeded");

                            // API Detection
                            $ionicLoading.show({
                                template: $translate.instant('kDiscoveringAPI') + "...",
                                noBackdrop: true,
                                duration: zm.httpTimeout
                            });
                            detectapi()
                                .then(function (success) {
                                        $ionicLoading.hide();
                                        ZMDataModel.zmLog("zmWizard: API succeeded");

                                        $ionicLoading.show({
                                            template: $translate.instant('kDiscoveringCGI') + "...",
                                            noBackdrop: true,
                                            duration: zm.httpTimeout
                                        });
                                        // CGI detection
                                        detectcgi()
                                            .then(function (success) {
                                                    $ionicLoading.hide();
                                                    // return true here because we want to progress
                                                    return d.resolve(true);
                                                },
                                                function (error) {
                                                    $ionicLoading.hide();
                                                    // return true here because we want to progress
                                                    return d.resolve(true);
                                                });
                                    },
                                    function (error) {
                                        $ionicLoading.hide();
                                        ZMDataModel.zmLog("zmWizard: api failed");

                                        // return true here because we want to progress
                                        return d.resolve(true);
                                    });


                        },

                        // if login failed, don't progress in the wizard
                        function (error) {
                            $ionicLoading.hide();
                            ZMDataModel.zmLog("zmWizard: login failed");
                            $scope.wizard.portalValidText = $translate.instant('kPortalLoginUnsuccessful');
                            $scope.wizard.portalColor = "#e74c3c";
                            return d.resolve(true);

                        });


            }); //finally
        return d.promise;
    }


    //--------------------------------------------------------------------------
    // checks for  a protocol
    //--------------------------------------------------------------------------
    function checkscheme(url) {

        if ((!/^(f|ht)tps?:\/\//i.test(url)) && (url != "")) {
            return false;
        } else
            return true;
    }



    //--------------------------------------------------------------------------
    // exit validator for auth wizard
    //--------------------------------------------------------------------------

    $scope.exitAuth = function () {
        ZMDataModel.zmLog("Wizard: validating auth syntax");
        if ($scope.wizard.useauth) {
            if (!$scope.wizard.usezmauth && !$scope.wizard.usebasicauth) {
                $rootScope.zmPopup = SecuredPopups.show('show', {
                    title: $translate.instant('kError'),
                    template: $translate.instant('kOneAuth'),
                    buttons: [{
                        text: $translate.instant('kButtonOk')
                    }]

                });
                return false;
            }
            if ($scope.wizard.usezmauth) {
                if ((!$scope.wizard.zmuser) || (!$scope.wizard.zmpassword)) {
                    $rootScope.zmPopup = SecuredPopups.show('show', {
                        title: $translate.instant('kError'),
                        template: $translate.instant('kValidNameZMAuth'),
                        buttons: [{
                            text: $translate.instant('kButtonOk')
                        }]

                    });
                    return false;
                }
            }

            if ($scope.wizard.usebasicauth) {
                if ((!$scope.wizard.basicuser) || (!$scope.wizard.basicpassword)) {
                    $rootScope.zmPopup = SecuredPopups.show('show', {
                        title: $translate.instant('kError'),
                        template: $translate.instant('kValidNameBasicAuth'),
                        buttons: [{
                            text: $translate.instant('kButtonOk')
                        }]

                    });
                    return false;
                }
            }
        }
        // Coming here means we can go to the next step
        // load the step
        WizardHandler.wizard().next();
        // start discovery;
        validateData();

    };

    //--------------------------------------------------------------------------
    // validator for portal url wizard
    //--------------------------------------------------------------------------

    $scope.exitPortal = function () {
        ZMDataModel.zmLog("Wizard: validating portal url syntax");

        if (!$scope.wizard.portalurl) {
            $rootScope.zmPopup = SecuredPopups.show('show', {
                title: $translate.instant('kError'),
                template: $translate.instant('kPortalEmpty'),
                buttons: [{
                    text: $translate.instant('kButtonOk')
                }]

            });
            return false;
        }

        if (!checkscheme($scope.wizard.portalurl)) {

            $scope.portalproto = [{
                text: "http",
                value: "http://"
            }, {
                text: "https",
                value: "https://"
            }];
            $scope.myproto = {
                proto: ""
            };



            $rootScope.zmPopup = $ionicPopup.show({
                title: $translate.instant('kPortalNoProto'),
                scope: $scope,
                template: $translate.instant('kPortalPleaseSelect') + ': <ion-radio-fix ng-repeat="item in portalproto" ng-value="item.value" ng-model="myproto.proto">{{item.text}}</ion-radio-fix>',
                buttons: [{
                    text: $translate.instant('kButtonOk'),
                    onTap: function (e) {
                        ZMDataModel.zmDebug("Protocol selected:" + $scope.myproto.proto);
                        $scope.wizard.portalurl = $scope.myproto.proto + stripProto($scope.wizard.portalurl);
                    }

                }]

            });
            return false;
        }

        $scope.wizard.portalurl = $scope.wizard.portalurl.toLowerCase().trim();

        ZMDataModel.zmLog("Wizard: stripped url:" + $scope.wizard.portalurl);

        var c = URI.parse($scope.wizard.portalurl);

        if (!c.scheme) {
            $rootScope.zmPopup = SecuredPopups.show('show', {
                title: $translate.instant('kError'),
                template: $translate.instant('kPortalInvalidUrl'),
                buttons: [{
                    text: $translate.instant('kButtonOk')
                }]

            });
            return false;
        }


        if (c.userinfo) // basic auth stuff in here, take it out and put it into the next screen
        {
            $scope.wizard.useauth = true;
            $scope.wizard.usebasicauth = true;
            var barray = c.userinfo.split(":", 2);
            $scope.wizard.basicuser = barray[0];
            $scope.wizard.basicpassword = barray[1];
        }

        $scope.wizard.portalurl = c.scheme + "://";
        if (c.host) $scope.wizard.portalurl += c.host;
        if (c.port) $scope.wizard.portalurl += ":" + c.port;
        if (c.path) $scope.wizard.portalurl += c.path;
        ZMDataModel.zmLog("Wizard: normalized url:" + $scope.wizard.portalurl);
        return true;
    };

    //--------------------------------------------------------------------------
    // part of auth wizard - toggles display of auth components
    //--------------------------------------------------------------------------
    $scope.toggleAuth = function () {

        if (!$scope.wizard.useauth) {
            $scope.wizard.usebasicauth = false;
            $scope.wizard.usezmauth = false;
        }
    };


    //--------------------------------------------------------------------------
    // global tip toggler for all wizard steps
    //--------------------------------------------------------------------------
    $scope.toggleTip = function () {
        $scope.wizard.tipshow = !$scope.wizard.tipshow;
        if ($scope.wizard.tipshow)
            $scope.wizard.tiptext = $translate.instant('kHideTip');
        else
            $scope.wizard.tiptext = $translate.instant('kShowTip');
    };

    $scope.gotoLoginState = function () {
        $rootScope.wizard = angular.copy($scope.wizard);
        $ionicHistory.nextViewOptions({
            disableBack: true
        });
        $state.go("login", {
            "wizard": true
        });
    };

    //--------------------------------------------------------------------------
    // initial
    //--------------------------------------------------------------------------
    $scope.$on('$ionicView.beforeEnter', function () {
        //console.log("**VIEW ** Help Ctrl Entered");

        var monId = -1;
        $scope.wizard = {
            tipshow: false,
            tiptext: $translate.instant('kShowTip'),
            useauth: false,
            usebasicauth: false,
            usezmauth: false,
            portalurl: "",
            basicuser: "",
            basicpassword: "",
            zmuser: "",
            zmpassword: "",
            ///////////////////////
            loginURL: "",
            apiURL: "",
            streamingURL: "",
            fqportal: "",
            portalValidText: "",
            portalColor: "",
            apiValidText: "",
            apiColor: "",
            streamingValidText: "",
            streamingColor: "",
            serverName: "",


        };

    });

}]);
