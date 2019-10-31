/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,alert,URI, localforage */

angular.module('zmApp.controllers').controller('zmApp.LoginCtrl', ['$scope', '$rootScope', 'zm', '$ionicModal', 'NVR', '$ionicSideMenuDelegate', '$ionicPopup', '$http', '$q', '$ionicLoading', 'zmAutoLogin', '$cordovaPinDialog', 'EventServer', '$ionicHistory', '$state', '$ionicActionSheet', 'SecuredPopups', '$stateParams', '$translate', function ($scope, $rootScope, zm, $ionicModal, NVR, $ionicSideMenuDelegate, $ionicPopup, $http, $q, $ionicLoading, zmAutoLogin, $cordovaPinDialog, EventServer, $ionicHistory, $state, $ionicActionSheet, SecuredPopups, $stateParams, $translate) {

  var oldLoginData = ''; // used to track any changes    
  $scope.openMenu = function () {

    // if ($scope.loginData.serverName)
    //         saveItems(false);
    $ionicSideMenuDelegate.toggleLeft();

  };

  var oldName;
  var serverbuttons = [];
  var availableServers;



  document.addEventListener("pause", onPause, false);
  document.addEventListener("resume", onResume, false);

  function onResume() {
    // NVR.log("Login screen resumed");

  }

  function onPause() {
    NVR.log("Login screen going to background, saving data");
    localforage.setItem("settings-temp-data", $scope.loginData);

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
      $state.go("app.events", {
        "id": 0,
        "playEvent": false
      }, {
        reload: true
      });
      return;
    }

  };

  //----------------------------------------------------------------
  // Specifies a linked profile to try if this profile fails
  //----------------------------------------------------------------

  $scope.selectFallback = function () {
    var as = Object.keys(NVR.getServerGroups());
    if (as.length < 2) {
      $rootScope.zmPopup = SecuredPopups.show('alert', {
        title: $translate.instant('kError'),
        template: $translate.instant('kFallback2Configs'),
        okText: $translate.instant('kButtonOk'),
        cancelText: $translate.instant('kButtonCancel'),
      });
      return;

    }
    var ab = [{
      text: $translate.instant('kClear')
    }];
    var ld = NVR.getLogin();
    as.forEach(function (item) {
      if (item != ld.serverName) ab.push({
        text: item
      });
    });
    var sheet = $ionicActionSheet.show({
      buttons: ab,
      titleText: $translate.instant('kSelectFallback'),
      cancelText: $translate.instant('kButtonCancel'),
      cancel: function () {},
      buttonClicked: function (index) {
        //console.log ("YOU WANT " + ab[index].text + index);
        if (index == 0)
          $scope.loginData.fallbackConfiguration = "";
        else
          $scope.loginData.fallbackConfiguration = ab[index].text;
        NVR.setLogin($scope.loginData);
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

        if (serverbuttons[index].text == $translate.instant('kServerAdd') + "...") {

          $scope.loginData = angular.copy(NVR.getDefaultLoginObject());
          return true;
        }

        var zmServers = NVR.getServerGroups();
        $scope.loginData = zmServers[serverbuttons[index].text];

        //console.log ("NEW LOGIN OBJECT IS " + JSON.stringify($scope.loginData));


        NVR.debug("Retrieved state for this profile:" + JSON.stringify($scope.loginData));

        // lets make sure Event Server is loaded 
        // correctly

        // FIXME: But what happens if you don't save?
        // loginData gets written but auth is not done
        NVR.setLogin($scope.loginData);

        return true;
      },

      destructiveButtonClicked: function () {

        if (!$scope.loginData.serverName) {
          NVR.debug("cannot delete empty entry");
          return true;

        }
        $rootScope.zmPopup = SecuredPopups.show('confirm', {
          title: $translate.instant('kDelete'),
          template: $translate.instant('kDeleteProfile') + " " + $scope.loginData.serverName,
          okText: $translate.instant('kButtonOk'),
          cancelText: $translate.instant('kButtonCancel'),
        }).then(function (res) {

          if (res)
            actuallyDelete();

        });



        function actuallyDelete() {

          var zmServers = NVR.getServerGroups();
          //console.log ("YOU WANT TO DELETE " + $scope.loginData.serverName);
          //console.log ("LENGTH OF SERVERS IS " + Object.keys(zmServers).length);
          if (Object.keys(zmServers).length > 1) {

            NVR.log("Deleting " + $scope.loginData.serverName);
            delete zmServers[$scope.loginData.serverName];
            NVR.setServerGroups(zmServers);
            // point to first element
            // better than nothing
            // note this is actually unordered
            $scope.loginData = zmServers[Object.keys(zmServers)[0]];
            NVR.setLogin($scope.loginData);

            availableServers = Object.keys(NVR.getServerGroups());
            serverbuttons = [{
              text: $translate.instant('kServerAdd') + "..."
            }];
            for (var servIter = 0; servIter < availableServers.length; servIter++) {
              serverbuttons.push({
                text: availableServers[servIter]
              });
              //console.log("ADDING : " + availableServers[servIter]);
            }
            //console.log (">>>>>>>delete: server buttons " + JSON.stringify(serverbuttons));    
          } else {
            NVR.displayBanner('error', [$translate.instant('kBannerCannotDeleteNeedOne')]);
          }


        }

        return true;
      }

    });
  };

  //----------------------------------------------------------------
  // This is when you tap on event server settings
  //----------------------------------------------------------------

  $scope.eventServerSettings = function () {
    NVR.debug("Saving settings before going to Event Server settings");
    //console.log ( "My loginData saved " + JSON.stringify($scope.loginData));
    NVR.setLogin($scope.loginData);


    if (!$rootScope.isLoggedIn) {
      $rootScope.zmPopup = $ionicPopup.alert({
        title: $translate.instant('kError'),
        template: $translate.instant('kEventServerNotLoggedIn'),
        okText: $translate.instant('kButtonOk'),
        cancelText: $translate.instant('kButtonCancel'),
      });
      return;

    } else {
      $state.go("app.eventserversettings");
      return;
    }


  };

  //-------------------------------------------------------------------------
  // Lets make sure we set screen dim properly as we enter
  // The problem is we enter other states before we leave previous states
  // from a callback perspective in ionic, so we really can't predictably
  // reset power state on exit as if it is called after we enter another
  // state, that effectively overwrites current view power management needs
  //------------------------------------------------------------------------
  $scope.$on('$ionicView.beforeEnter', function () {

    var ld = NVR.getLogin();
    if (ld.isKiosk) {
      NVR.log ("You are in kiosk mode, cannot show login screen");
      $ionicHistory.nextViewOptions({
        disableAnimate:true,
        disableBack: true
      });
      $rootScope.importantMessageHeader = $translate.instant('kKioskErrorHeader');
      $rootScope.importantMessageSummary = $translate.instant('kKioskErrorMessage');
      $state.go('app.importantmessage');
      return;
    }
    
    $scope.$on ( "process-push", function () {
      NVR.debug (">> LoginCtrl: push handler. Not processing push, because you might be here due to login failure");
      /*var s = NVR.evaluateTappedNotification();
      NVR.debug("tapped Notification evaluation:"+ JSON.stringify(s));
      $ionicHistory.nextViewOptions({
        disableAnimate:true,
        disableBack: true
      });
      $state.go(s[0],s[1],s[2]);*/
    });

    
    oldLoginData = '';

    $scope.loginData = NVR.getLogin();

    //console.log (JSON.stringify($scope.loginData));
    //console.log("**VIEW ** LoginCtrl  Entered");
    NVR.setAwake(false);
    //$scope.basicAuthUsed = false;
    
    oldName = ld.serverName;

    availableServers = Object.keys(NVR.getServerGroups());
    serverbuttons = [{
      text: $translate.instant('kServerAdd') + "..."
    }];
    for (var servIter = 0; servIter < availableServers.length; servIter++) {
      serverbuttons.push({
        text: availableServers[servIter]
      });

      //console.log (">>>>>>>ionicview enter: server buttons " + JSON.stringify(serverbuttons));
    }

    NVR.debug("Does login need to hear the wizard? " + $stateParams.wizard);

    if ($stateParams.wizard == "true") {
      NVR.log("Creating new login entry for wizard");
      $scope.loginData = angular.copy(NVR.getDefaultLoginObject());

      $scope.loginData.serverName = $rootScope.wizard.serverName;
      $scope.loginData.url = $rootScope.wizard.loginURL;
      $scope.loginData.apiurl = $rootScope.wizard.apiURL;
      $scope.loginData.streamingurl = $rootScope.wizard.streamingURL;

      if ($rootScope.wizard.useauth && $rootScope.wizard.usezmauth) {
        $scope.loginData.username = $rootScope.wizard.zmuser;
        $scope.loginData.password = $rootScope.wizard.zmpassword;
        $scope.loginData.isUseAuth = true;


      } else {
        $scope.loginData.isUseAuth = false;
      }

      //  'isUseBasicAuth': false,
      //  'basicAuthUser': '',
      //  'basicAuthPassword': '',

      if ($rootScope.wizard.useauth && $rootScope.wizard.usebasicauth) {
        $scope.loginData.basicAuthUser = $rootScope.wizard.basicuser;
        $scope.loginData.basicAuthPassword = $rootScope.wizard.basicpassword;
        $scope.loginData.isUseBasicAuth = true;
      } else {
        $scope.loginData.isUseBasicAuth = false;
      }

      if ((/^https:\/\//i.test($scope.loginData.url))) {
        $scope.loginData.useSSL = true;
      }

    }

    oldLoginData = JSON.stringify($scope.loginData);

  });

  $scope.$on('$ionicView.beforeLeave', function () {
    //console.log("**VIEW ** LoginCtrl  Entered");
    var newLoginData = JSON.stringify($scope.loginData);
    if ($scope.loginData.serverName && newLoginData != oldLoginData) {
      NVR.log("Login data changed, saving...");
      saveItems(false);
    } else {
      NVR.log("Login data not changed, not saving");
    }




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
  /* Disabled - seems to crash with native transitions
    
  $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
      NVR.setAwake(false);
      var ld = NVR.getLogin();

      if (ld.serverName != oldName) {
          event.preventDefault();
          $rootScope.zmPopup = SecuredPopups.show('alert', {
              title: $translate.instant('kPleaseSave'),
              template: $translate.instant('kProfileChangeNotification', {
                  oldName: oldName,
                  newName: ld.serverName
              })

          });

      }
  });*/

  $scope.$on('$stateChangeSuccess', function () {
    $scope.ignoreDirty = false;
  });

  // Make a noble attempt at deciphering 

  //--------------------------------------------------------------------------
  // When PIN is enabled, this is called to specify a PIN
  // FIXME: Get rid of cordovaPinDialog. It's really not needed 
  //--------------------------------------------------------------------------

  $scope.pinPrompt = function (evt) {
     NVR.log ("use password:"+$scope.loginData.usePin);

      if (!$scope.loginData.usePin) {
          return;
      }

      if ($rootScope.platformOS == 'desktop') {
          desktopPinConfig();
      }
      else {
          mobilePinConfig();
      }
  };


  $scope.kioskPinConfig = function () {

    var ld = NVR.getLogin();
    $scope.data = {p1:ld.kioskPassword};     
    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      template: '<small>'+$translate.instant('kKioskPassword')+'</small><input type="password" ng-model="data.p1"><br/><small>'+$translate.instant('kKioskPasswordConfirm')+'</small><input type="password"  ng-model="data.p2">',
      title: $translate.instant('kPassword'),
      scope: $scope,
      buttons: [
        { text: $translate.instant('kButtonCancel'),
            type: 'button-assertive',
            onTap: function (e) {
                $scope.loginData.isKiosk = false;
            }
        },
        {
          text: '<b>'+$translate.instant('kButtonSave')+'</b>',
          type: 'button-positive',
          onTap: function(e) {
            if (!$scope.data.p1) {
              //don't allow the user to close unless he enters wifi password
              e.preventDefault();
            } else {
              if ($scope.data.p1 == $scope.data.p2) {
                NVR.log ("Kiosk code match");
                $scope.loginData.kioskPassword = $scope.data.p1;
                $scope.loginData.isKiosk = true;
                NVR.setLogin($scope.loginData);
                $ionicHistory.nextViewOptions({
                  disableBack: true
                });
                $state.go('app.montage');
                return;
              }
              else {
                    $ionicLoading.show({
                        template: $translate.instant('kBannerPinMismatch') + "...",
                        noBackdrop: true,
                        duration: 1500
                    });
                  NVR.log ("Kiosk code mistmatch");
                  $scope.loginData.isKiosk = false;
                  e.preventDefault();
              }
              
            }
          }
        }
      ]
    });
  };

  function desktopPinConfig() {

        $scope.data = {};     
        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
          template: '<small>'+$translate.instant('kPinProtect')+'</small><input type="password" ng-model="data.p1"><br/><small>'+$translate.instant('kReconfirmPin')+'</small><input type="password" ng-model="data.p2">',
          title: $translate.instant('kPinProtect'),
          scope: $scope,
          buttons: [
            { text: 'Cancel',
                type: 'button-assertive',
                onTap: function (e) {
                    $scope.loginData.usePin = false;
                }
            },
            {
              text: '<b>Save</b>',
              type: 'button-positive',
              onTap: function(e) {
                if (!$scope.data.p1) {
                  //don't allow the user to close unless he enters wifi password
                  e.preventDefault();
                } else {
                  if ($scope.data.p1 == $scope.data.p2) {
                    NVR.log ("Pin code match");
                    $scope.loginData.pinCode = $scope.data.p1;
                  }
                  else {
                        $ionicLoading.show({
                            template: $translate.instant('kBannerPinMismatch') + "...",
                            noBackdrop: true,
                            duration: 1500
                        });
                      NVR.log ("Pin code mistmatch match");
                      $scope.loginData.usePin = false;
                      e.preventDefault();
                  }
                  
                }
              }
            }
          ]
        });

   
}


function mobilePinConfig () {
    NVR.log("Password prompt");
    if ($scope.loginData.usePin) {
      $scope.loginData.pinCode = "";
      $cordovaPinDialog.prompt($translate.instant('kEnterPin'), $translate.instant('kPinProtect')).then(
        function (result1) {

          // console.log (JSON.stringify(result1));
          if (result1.input1 && result1.buttonIndex == 1) {
            $cordovaPinDialog.prompt($translate.instant('kReconfirmPin'), $translate.instant('kPinProtect'))
              .then(function (result2) {
                  if (result1.input1 == result2.input1) {
                    NVR.log("Pin code match");
                    $scope.loginData.pinCode = result1.input1;
                  } else {
                    NVR.log("Pin code mismatch");
                    $scope.loginData.usePin = false;
                    NVR.displayBanner('error', [$translate.instant('kBannerPinMismatch')]);
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
      NVR.debug("Password disabled");
    }
  }

  //-------------------------------------------------------------------------------
  // Makes input easier
  //-------------------------------------------------------------------------------

  $scope.portalKeypress = function (evt) {

    if (/^https:\/\//i.test($scope.loginData.url)) {
      $scope.loginData.useSSL = true;
    } else {
      $scope.loginData.useSSL = false;
    }

    if ($scope.loginData.url.slice(-1) == '/') {
      $scope.loginData.apiurl = $scope.loginData.url + "api";
      $scope.loginData.streamingurl = $scope.loginData.url + "cgi-bin";
    } else {
      $scope.loginData.apiurl = $scope.loginData.url + "/api";
      $scope.loginData.streamingurl = $scope.loginData.url + "/cgi-bin";
    }

    //$scope.basicAuthUsed = ($scope.loginData.url.indexOf('@') == -1) ? false:true;



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

    NVR.flushAPICache()
    .then (function() {
      _saveItems(showalert);
    })
    .catch (function(err) {
      NVR.debug ('Error clearing cache:'+JSON.stringify(err));
      _saveItems(showalert);
    });

  }
  function _saveItems(showalert) {

    //console.log ("*********** SAVE ITEMS CALLED ");
    //console.log('Saving login');

    NVR.debug("Inside save Items");

    $rootScope.alarmCount = 0;
    $rootScope.isAlarm = false;


    NVR.setFirstUse(false);
    NVR.setCurrentServerVersion('');
    NVR.setCurrentServerMultiPortSupported(false);

    // used for menu display

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

    /* if ($scope.loginData.useSSL)
     {
         // replace all http with https
         $scope.loginData.url = $scope.loginData.url.replace("http:", "https:");
         $scope.loginData.apiurl = $scope.loginData.apiurl.replace("http:", "https:");
         $scope.loginData.streamingurl = $scope.loginData.streamingurl.replace("http:", "https:");
         $scope.loginData.eventServer = $scope.loginData.eventServer.replace("ws:", "wss:");

     }
     else
     {
         // replace all https with http
         $scope.loginData.url = $scope.loginData.url.replace("https:", "http:");
         $scope.loginData.apiurl = $scope.loginData.apiurl.replace("https:", "http:");
         $scope.loginData.streamingurl = $scope.loginData.streamingurl.replace("https:", "http:");
         // don't do it for WSS - lets mandate that
     }*/

    var apiurl = $scope.loginData.apiurl + '/host/getVersion.json?'+$rootScope.authSession;
  
    // Check if isUseAuth is set make sure u/p have a dummy value
    if ($scope.loginData.isUseAuth) {
      if (!$scope.loginData.username) $scope.loginData.username = "x";
      if (!$scope.loginData.password) $scope.loginData.password = "x";
      //NVR.log("Authentication is disabled, setting dummy user & pass");
    }

    if (parseInt($scope.loginData.maxMontage) <= 0) {
      $scope.loginData.maxMontage = "100";
    }

    // do this before setLogin so message is sent

    if (!$scope.loginData.isUseEventServer) {
      $rootScope.isAlarm = 0;
      if ($rootScope.apnsToken) {
        NVR.log("Making sure we don't get push notifications");
        EventServer.sendMessage('push', {
          type: 'token',
          platform: $rootScope.platformOS,
          token: $rootScope.apnsToken,
          state: "disabled"
        }, 1);
      }
    }

    if (!$scope.loginData.isUseBasicAuth) {
      $rootScope.basicAuthHeader = '';
      $rootScope.basicAuthToken = '';
      // console.log ("CLEARING AUTH");
    } else {
      $rootScope.basicAuthToken = btoa($scope.loginData.basicAuthUser + ':' + $scope.loginData.basicAuthPassword);
      $rootScope.basicAuthHeader = 'Basic ' + $rootScope.basicAuthToken;

    }

    //console.log ("SAVING: "+JSON.stringify($scope.loginData));
    NVR.setLogin($scope.loginData);


    $rootScope.authSession = '';
    //console.log ("***** CLEARING AUTHSESSION IN SAVEITEMS");

    if ($rootScope.platformOS != 'desktop') {

      if ($scope.loginData.isUseBasicAuth) {
        NVR.debug("Cordova HTTP: configuring basic auth");
        cordova.plugin.http.useBasicAuth($scope.loginData.basicAuthUser, $scope.loginData.basicAuthPassword);
      }

      if (!$scope.loginData.enableStrictSSL) {

        //alert("Enabling insecure SSL");
        NVR.log(">>>> Disabling strict SSL checking (turn off  in Dev Options if you can't connect)");
        cordova.plugin.http.setSSLCertMode('nocheck', function () {
          NVR.debug('--> SSL is permissive, will allow any certs. Use at your own risk.');
        }, function () {
          NVR.log('-->Error setting SSL permissive');
        });

        if ($rootScope.platformOS == 'android') {
          NVR.log (">>> Android: enabling inline image view for self signed certs");
          cordova.plugins.certificates.trustUnsecureCerts(true);
        }

      } else {

        NVR.log(">>>> Enabling strict SSL checking (turn off  in Dev Options if you can't connect)");

      }

      if ($scope.loginData.saveToCloud) {
        NVR.debug("writing data to cloud");

        var serverGroupList = NVR.getServerGroups();
        serverGroupList[$scope.loginData.serverName] = angular.copy($scope.loginData);

        var ct = CryptoJS.AES.encrypt(JSON.stringify(serverGroupList), zm.cipherKey).toString();

        window.cordova.plugin.cloudsettings.save({
            'serverGroupList': ct,
            'defaultServerName': $scope.loginData.serverName
          },
          function () {
            NVR.debug("local data synced with cloud...");


          },
          function (err) {
            NVR.debug("error syncing cloud data..." + JSON.stringify(err));

          }, true);

      } else {
        NVR.debug("Clearing cloud settings...");
        window.cordova.plugin.cloudsettings.save({},
          function () {
            NVR.debug("cloud data cleared");

          },
          function (err) {
            NVR.debug("error clearing cloud data: " + err);

          }, true);
      }


    }


    $rootScope.runMode = NVR.getBandwidth();

    oldName = $scope.loginData.serverName;

    if ($scope.loginData.isUseEventServer) {
      EventServer.init()
        .then(function (succ) {
            if ($rootScope.apnsToken && $scope.loginData.disablePush != true) {
              NVR.log("Making sure we get push notifications");
              EventServer.sendMessage('push', {
                type: 'token',
                platform: $rootScope.platformOS,
                token: $rootScope.apnsToken,
                state: "enabled"
              }, 1);
            }
            EventServer.sendMessage("control", {
              type: 'filter',
              monlist: $scope.loginData.eventServerMonitors,
              intlist: $scope.loginData.eventServerInterval,
              token: $rootScope.apnsToken
            });
          },
          function (err) {
            NVR.log("Event server init failed");
          });


    }

    
    zmAutoLogin.doLogin("<button class='button button-clear' style='line-height: normal; min-height: 0; min-width: 0;  color:#fff;' ng-click='$root.cancelAuth()'><i class='ion-close-circled'></i>&nbsp;" + $translate.instant('kAuthenticating') + "...</button>")
      // Do the happy menu only if authentication works
      // if it does not work, there is an emitter for auth
      // fail in app.js that will be called to show an error
      // box

      .then(function (data) {

        //console.log ("DOLOGIN RETURNED "+ JSON.stringify(data));

        // Now let's validate if the API works

        // note that due to reachability, it might have switched to another server

        if ($scope.loginData.serverName != NVR.getLogin().serverName) {
          NVR.debug(">>> Server information has changed, likely a fallback took over!");
          $scope.loginData = NVR.getLogin();
          
          portalurl = $scope.loginData.url + '/index.php';
        }

        // possible image digits changed between servers
        NVR.getKeyConfigParams(0);
        console.log ('In loginCtrl, token is '+$rootScope.authSession);
        apiurl = $scope.loginData.apiurl + '/host/getVersion.json?'+$rootScope.authSession;
        
        NVR.log("Validating APIs at " + apiurl);
        $http.get(apiurl)
          .then(function (data) {

              data = data.data;
              NVR.getTimeZone(true);
              var loginStatus = $translate.instant('kExploreEnjoy') + " " + $rootScope.appName + "!";
              EventServer.refresh();

              NVR.debug("refreshing API version...");
              NVR.getAPIversion()
                .then(function (data) {
                    var refresh = NVR.getMonitors(1);
                    $rootScope.apiVersion = data;
                   // console.log ("ALERT="+showalert);
                    if (showalert) {
                      $rootScope.zmPopup = SecuredPopups.show('alert', {
                        title: $translate.instant('kLoginValidatedTitle'),
                        template: loginStatus,
                        okText: $translate.instant('kButtonOk'),
                        cancelText: $translate.instant('kButtonCancel'),
                      }).then(function (res) {

                        $ionicSideMenuDelegate.toggleLeft();
                        NVR.debug("Force reloading monitors...");

                      });
                    }

                  },
                  function (error) {
                    var refresh = NVR.getMonitors(1);
                    $rootScope.apiVersion = "0.0.0";
                    NVR.debug("Error, failed API version, setting to " + $rootScope.apiVersion);
                  });

            },
            function (error) {

              if ($rootScope.userCancelledAuth) {
                return;
              }

              NVR.displayBanner('error', [$translate.instant('kBannerAPICheckFailed'), $translate.instant('kBannerPleaseCheck')]);
              NVR.log("API login error " + JSON.stringify(error));

              $rootScope.zmPopup = SecuredPopups.show('alert', {
                title: $translate.instant('kLoginValidAPIFailedTitle'),
                template: $translate.instant('kBannerPleaseCheck'),
                okText: $translate.instant('kButtonOk'),
                cancelText: $translate.instant('kButtonCancel'),
              });
            });
      });

  }

  // ----------------------------------------------
  // Saves the current profile. Note that
  // calling saveItems also updates the defaultServer
  //-----------------------------------------------

  $scope.saveItems = function () {

    NVR.debug("User tapped save, calling SaveItems");
    NVR.clearZmsMultiPortSupport();
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
      availableServers = Object.keys(NVR.getServerGroups());
      serverbuttons = [{
        text: $translate.instant('kServerAdd') + "..."
      }];
      for (var servIter = 0; servIter < availableServers.length; servIter++) {
        serverbuttons.push({
          text: availableServers[servIter]
        });
      }
      //console.log (">>>>>>>ionicview save: server buttons " + JSON.stringify(serverbuttons));

    }

  };

}]);
