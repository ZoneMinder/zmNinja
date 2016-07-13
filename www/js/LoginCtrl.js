/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,alert,URI */

angular.module('zmApp.controllers').controller('zmApp.LoginCtrl', ['$scope', '$rootScope', 'zm', '$ionicModal', 'ZMDataModel', '$ionicSideMenuDelegate', '$ionicPopup', '$http', '$q', '$ionicLoading', 'zmAutoLogin', '$cordovaPinDialog', 'EventServer', '$ionicHistory', '$state', '$ionicActionSheet', 'SecuredPopups', '$localstorage', '$stateParams', '$translate', function ($scope, $rootScope, zm, $ionicModal, ZMDataModel, $ionicSideMenuDelegate, $ionicPopup, $http, $q, $ionicLoading, zmAutoLogin, $cordovaPinDialog, EventServer, $ionicHistory, $state, $ionicActionSheet, SecuredPopups, $localstorage, $stateParams, $translate) {
    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };


    var oldName;
    var serverbuttons = [];
    var availableServers;
    $scope.loginData = ZMDataModel.getLogin();

    $scope.check = {
        isUseAuth: false,
        isUseEventServer: false
    };

    $scope.check.isUseAuth = ($scope.loginData.isUseAuth ) ? true : false;
    $scope.check.isUseEventServer = ($scope.loginData.isUseEventServer == true) ? true : false;
    
    
    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);
    
    function onResume()
    {
        ZMDataModel.zmLog ("Login screen resumed");
        
    }
    
    function onPause()
    {
        ZMDataModel.zmLog ("Login screen going to background, saving data");
        $localstorage.setObject ("settings-temp-data",$scope.loginData);
        
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
                "id": 0
            }, {
                reload: true
            });
        }
    };

    //----------------------------------------------------------------
    // Specifies a linked profile to try if this profile fails
    //----------------------------------------------------------------
    
    $scope.selectFallback = function () 
    {
        var as = Object.keys(ZMDataModel.getServerGroups());
        if (as.length < 2)
        {
            $rootScope.zmPopup= SecuredPopups.show('alert',{
                                title: $translate.instant('kError'),
                                template: $translate.instant('kFallback2Configs')
                            });
            return;
            
        }
        var ab = [{text:$translate.instant('kClear')}];
        var ld = ZMDataModel.getLogin();
        as.forEach(function(item) { if (item != ld.serverName) ab.push({text:item});});
        var sheet = $ionicActionSheet.show({
            buttons: ab,
            titleText: $translate.instant('kSelectFallback'),
            cancelText: $translate.instant('kButtonCancel'),
            cancel: function() {},
            buttonClicked: function (index)
            {
                console.log ("YOU WANT " + ab[index].text + index);
                if (index==0)
                    $scope.loginData.fallbackConfiguration="";
                else
                    $scope.loginData.fallbackConfiguration = ab[index].text;
                ZMDataModel.setLogin($scope.loginData);
                return true;
            }
        });
            
        
        
    };
    
    //----------------------------------------------------------------
    // This is called when the user changes profiles
    //----------------------------------------------------------------

    $scope.serverActionSheet = function () {
        var hideSheet = $ionicActionSheet.show({
            buttons: serverbuttons,
            destructiveText: $translate.instant('kDelete'),
            titleText: $translate.instant('kManageServerGroups'),
            cancelText: $translate.instant('kButtonCancel'),
            cancel: function () {
                // add cancel code..
            },
            buttonClicked: function (index) {
                 //console.log ("YOU WANT " + serverbuttons[index].text + " INDEX " + index);
                
                if (serverbuttons[index].text == $translate.instant('kServerAdd')+"...")
                {
                    
                    $scope.loginData = angular.copy(ZMDataModel.getDefaultLoginObject());
                    return true;
                }
                
                var zmServers = ZMDataModel.getServerGroups();
                $scope.loginData = zmServers[serverbuttons[index].text];
                
                console.log ("NEW LOGIN OBJECT IS " + JSON.stringify($scope.loginData));
                
                
                $scope.check.isUseAuth = ($scope.loginData.isUseAuth) ? true : false;
                $scope.check.isUseEventServer = ($scope.loginData.isUseEventServer == true) ? true : false;

                ZMDataModel.zmDebug("Retrieved state for this profile:" + JSON.stringify($scope.loginData));

                // lets make sure Event Server is loaded 
                // correctly

                // FIXME: But what happens if you don't save?
                // loginData gets written but auth is not done
                ZMDataModel.setLogin($scope.loginData);

                return true;
            },

            destructiveButtonClicked: function () {
                
                
                if (!$scope.loginData.serverName)
                {
                    ZMDataModel.zmDebug("cannot delete empty entry");
                    return true;
                    
                    
                }
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
                    serverbuttons = [{text:$translate.instant('kServerAdd')+"..."}];
                    for (var servIter = 0; servIter < availableServers.length; servIter++) {
                        serverbuttons.push({
                            text: availableServers[servIter]
                        });
                        //console.log("ADDING : " + availableServers[servIter]);
                    }

                } else {
                    ZMDataModel.displayBanner('error', [$translate.instant('kBannerCannotDeleteNeedOne')]);
                }
                return true;
            }


        });
    };


    //----------------------------------------------------------------
    // This is when you tap on event server settings
    //----------------------------------------------------------------
    
    $scope.eventServerSettings = function () {
        ZMDataModel.zmDebug("Saving settings before going to Event Server settings");
        //console.log ( "My loginData saved " + JSON.stringify($scope.loginData));
        ZMDataModel.setLogin($scope.loginData);
        $state.go("eventserversettings");

    };

   

    //-------------------------------------------------------------------------
    // Lets make sure we set screen dim properly as we enter
    // The problem is we enter other states before we leave previous states
    // from a callback perspective in ionic, so we really can't predictably
    // reset power state on exit as if it is called after we enter another
    // state, that effectively overwrites current view power management needs
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
        //console.log("**VIEW ** LoginCtrl  Entered");
        ZMDataModel.setAwake(false);
        var ld = ZMDataModel.getLogin();
        oldName = ld.serverName;
        
        availableServers = Object.keys(ZMDataModel.getServerGroups());
        serverbuttons = [{text:$translate.instant('kServerAdd')+"..."}];
        for (var servIter = 0; servIter < availableServers.length; servIter++) {
            serverbuttons.push({
            text: availableServers[servIter]
        });
        
        }
        
        ZMDataModel.zmDebug ("Does login need to hear the wizard? "  + $stateParams.wizard);
        
        if ($stateParams.wizard == "true")
        {
            ZMDataModel.zmLog ("Creating new login entry for wizard");
            $scope.loginData = angular.copy(ZMDataModel.getDefaultLoginObject());
            $scope.loginData.serverName = $rootScope.wizard.serverName;
            $scope.loginData.url = $rootScope.wizard.loginURL;
            $scope.loginData.apiurl = $rootScope.wizard.apiURL;
            $scope.loginData.streamingurl = $rootScope.wizard.streamingURL;
            if ($rootScope.wizard.useauth && $rootScope.wizard.usezmauth)
            {
                $scope.loginData.username = $rootScope.wizard.zmuser;
                $scope.loginData.password = $rootScope.wizard.zmpassword;
            }
            else
            {
                $scope.loginData.isUseAuth = false;
            }
            
            if ((/^https:\/\//i.test($scope.loginData.url)))
            {
                $scope.loginData.useSSL = true;
            }
            
            
        }
        
        else
        {
            var savedData = $localstorage.getObject ("settings-temp-data");
            if (! ZMDataModel.isEmpty(savedData))
            {
                $scope.loginData = savedData;
                ZMDataModel.zmLog ("retrieved pre-stored loginData on past pause: "  + JSON.stringify($scope.loginData));
                $localstorage.setObject("settings-temp-data", {});
            }
            else 
            {
                ZMDataModel.zmLog ("Not recovering login data as its empty");
            }
        }
        
        
    });
    
    
    $scope.$on('$ionicView.beforeLeave', function () {
        //console.log("**VIEW ** LoginCtrl  Entered");
        
             
        
    });
    
    //----------------------------------------------------------------
    // We need to make sure that if the user changes a profile, that
    // its saved, which involves re-auth. Not doing this will mess 
    // up monitors. We can't automatically do it, because we really
    // don't want re-auth delays each time a user taps on a new profile
    // especially if they switch back
    //
    // So instead, if check if the profile name has changed - if it has
    // we block state change and ask the user to save
    //----------------------------------------------------------------
    
    // credit: http://stackoverflow.com/questions/33385610/ionic-prevent-navigation-on-leave
    $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) 
    {
        ZMDataModel.setAwake(false);
        var ld = ZMDataModel.getLogin();
        
        if(ld.serverName != oldName )
        {
            event.preventDefault();
            $rootScope.zmPopup = SecuredPopups.show('alert',{
                title: $translate.instant('kPleaseSave'),
                template: $translate.instant('kProfileChangeNotification', {oldName: oldName, newName:ld.serverName})
                
            });
            
        }
    });
    
    $rootScope.$on('$stateChangeSuccess', function(){
    $scope.ignoreDirty = false;
    });
    
    // Make a noble attempt at deciphering 

    
   
    //--------------------------------------------------------------------------
    // When PIN is enabled, this is called to specify a PIN
    // FIXME: Get rid of cordovaPinDialog. It's really not needed 
    //--------------------------------------------------------------------------
    $scope.pinPrompt = function (evt) {
        ZMDataModel.zmLog("Password prompt");
        if ($scope.loginData.usePin) {
            $scope.loginData.pinCode = "";
            $cordovaPinDialog.prompt($translate.instant('kEnterPin'), $translate.instant('kPinProtect')).then(
                function (result1) {

                    // console.log (JSON.stringify(result1));
                    if (result1.input1 && result1.buttonIndex == 1) {
                        $cordovaPinDialog.prompt($translate.instant('kReconfirmPin'), $translate.instant('kPinProtect'))
                            .then(function (result2) {
                                    if (result1.input1 == result2.input1) {
                                        ZMDataModel.zmLog("Pin code match");
                                        $scope.loginData.pinCode = result1.input1;
                                    } else {
                                        ZMDataModel.zmLog("Pin code mismatch");
                                        $scope.loginData.usePin = false;
                                        ZMDataModel.displayBanner('error', [$translate.instant('kBannerPinMismatch')]);
                                    }
                                },
                                function (error) {
                                    //console.log("Error inside");
                                    $scope.loginData.usePin = false;
                                });
                    } else {
                        $scope.loginData.usePin = false;
                    }
                },
                function (error) {
                    //console.log("Error outside");
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
        else
        {$scope.loginData.useSSL = false;}
   
        if ($scope.loginData.url.slice(-1)=='/')
        {
            $scope.loginData.apiurl = $scope.loginData.url + "api";
            $scope.loginData.streamingurl = $scope.loginData.url + "cgi-bin";
        }
        else
        {
            $scope.loginData.apiurl = $scope.loginData.url + "/api";
            $scope.loginData.streamingurl = $scope.loginData.url + "/cgi-bin";
        }
            
            
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

    function saveItems(showalert) {


        console.log ("*********** SAVE ITEMS CALLED ");
        //console.log('Saving login');
        ZMDataModel.setFirstUse(false);

        // lets so some basic sanitization of the data
        // I am already adding "/" so lets remove spurious ones
        // though webkit has no problems. Even so, this is to avoid
        // a deluge of folks who look at the error logs and say
        // the reason the login data is not working is because
        // the app is adding multiple "/" characters

        $scope.loginData.url = $scope.loginData.url.replace(/\s/g, "");
        $scope.loginData.apiurl = $scope.loginData.apiurl.replace(/\s/g, "");
        $scope.loginData.streamingurl = $scope.loginData.streamingurl.replace(/\s/g, "");
        $scope.loginData.eventServer = $scope.loginData.eventServer.replace(/\s/g, "");
        
        $scope.loginData.username = $scope.loginData.username.trim();
       



        $scope.loginData.isUseAuth = ($scope.check.isUseAuth) ? true:false;
        $scope.loginData.isUseEventServer = ($scope.check.isUseEventServer) ? true : false;

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
            //ZMDataModel.zmLog("Authentication is disabled, setting dummy user & pass");
        }

        if (parseInt($scope.loginData.maxMontage) <= 0) {
            $scope.loginData.maxMontage = "100";
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
        oldName = $scope.loginData.serverName;

        if ($scope.check.isUseEventServer) {
            EventServer.init();
            if ($rootScope.apnsToken && $scope.loginData.disablePush != true) {
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

        
        // lets logout
        ZMDataModel.zmDebug ("Logging out of current session...");
        $rootScope.authSession = "undefined";
        $http({
             method: 'POST',
                //withCredentials: true,
                url: $scope.loginData.url + '/index.php',
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
            .finally ( function (ans) 
            {
            
                zmAutoLogin.doLogin("<button class='button button-clear' style='line-height: normal; min-height: 0; min-width: 0;  color:#fff;' ng-click='$root.cancelAuth()'><i class='ion-close-circled'></i>&nbsp;"+$translate.instant('kAuthenticating')+"...</button>")
                    // Do the happy menu only if authentication works
                    // if it does not work, there is an emitter for auth
                    // fail in app.js that will be called to show an error
                    // box

                .then(function (data) {

                    // Now let's validate if the API works
                    
                    // note that due to reachability, it might have switched to another server
                    
                    if ($scope.loginData.serverName != ZMDataModel.getLogin().serverName)
                    {
                        ZMDataModel.zmDebug (">>> Server information has changed, likely a fallback took over!");
                        $scope.loginData = ZMDataModel.getLogin();
                        apiurl = $scope.loginData.apiurl + '/host/getVersion.json';
                        portalurl = $scope.loginData.url + '/index.php';
                    }
                    
                    // possible image digits changed between servers
                    ZMDataModel.getKeyConfigParams(0);
                    
                    ZMDataModel.zmLog("Validating APIs at " + apiurl);
                    $http.get(apiurl)
                        .success(function (data) {

                            var loginStatus = $translate.instant('kExploreEnjoy')+" "+$rootScope.appName+"!";
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
                                            loginStatus = $translate.instant('kLoginStatusNoCgi');
                                        
                                            ZMDataModel.zmDebug ("refreshing API version...");
                                            ZMDataModel.getAPIversion()
                                            .then (function (data) {
                                                var refresh = ZMDataModel.getMonitors(1);
                                                $rootScope.apiVersion = data;
                                            }, 
                                                   function (error) {
                                                    var refresh = ZMDataModel.getMonitors(1);
                                                    $rootScope.apiVersion = "0.0.0";
                                                    ZMDataModel.zmDebug ("Error, failed API version, setting to " +$rootScope.apiVersion);
                                            });
                                            
                                            if (showalert)
                                            {
                                                $rootScope.zmPopup = SecuredPopups.show('alert',{
                                                    title: $translate.instant('kLoginValidatedTitle'),
                                                    template: loginStatus
                                                }).then(function (res) {

                                                    $ionicSideMenuDelegate.toggleLeft();
                                                    ZMDataModel.zmDebug("Force reloading monitors...");

                                                });
                                            }
                                        })
                                        .error(function (error, status) {
                                            // If its 5xx, then the cgi-bin path is valid
                                            // if its 4xx then the cgi-bin path is not valid

                                            if (status < 500) {
                                                loginStatus = $translate.instant('kLoginStatusNoCgiAlt');
                                            }
                                            
                                            if (showalert)
                                            {
                                                $rootScope.zmPopup = SecuredPopups.show('alert',{
                                                    title: $translate.instant('kLoginValidatedTitle'),
                                                    template: loginStatus
                                                }).then(function (res) {

                                                    $ionicSideMenuDelegate.toggleLeft();
                                                    ZMDataModel.zmDebug("Force reloading monitors...");
                                                   
                                                });
                                            }
                                            ZMDataModel.zmDebug ("refreshing API version...");
                                            ZMDataModel.getAPIversion()
                                            .then (function (data) {
                                                var refresh = ZMDataModel.getMonitors(1);
                                                $rootScope.apiVersion = data;
                                            }, 
                                                   function (error) {
                                                    var refresh = ZMDataModel.getMonitors(1);
                                                    $rootScope.apiVersion = "0.0.0";
                                                    ZMDataModel.zmDebug ("Error, failed API version, setting to " +$rootScope.apiVersion);
                                            });

                                        });
                                });



                        })
                        .error(function (error) {
                            ZMDataModel.displayBanner('error', [$translate.instant('kBannerAPICheckFailed'), $translate.instant('kBannerPleaseCheck')]);
                            ZMDataModel.zmLog("API login error " + JSON.stringify(error));
                            
                            $rootScope.zmPopup= SecuredPopups.show('alert',{
                                title: $translate.instant('kLoginValidAPIFailedTitle'),
                                template: $translate.instant('kBannerPleaseCheck')
                            });
                        });
                });



        });
    }
    
    // ----------------------------------------------
    // Saves the current profile. Note that
    // calling saveItems also updates the defaultServer
    //-----------------------------------------------

    $scope.saveItems = function () {

        if (!$scope.loginData.serverName) {
            $rootScope.zmPopup = $ionicPopup.alert({
                    title: $translate.instant('kError'),
                    template: $translate.instant('kServerEmptyError'),
                })
                .then(function (res) {
                    return;
                });
        } else {
            saveItems(true);
            availableServers = Object.keys(ZMDataModel.getServerGroups());
            serverbuttons = [];
            for (var servIter = 0; servIter < availableServers.length; servIter++) {
                serverbuttons.push({
                    text: availableServers[servIter]
                });
            }

        }


    };


}]);