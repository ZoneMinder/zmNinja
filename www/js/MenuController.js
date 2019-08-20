/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('MenuController', ['$scope', '$ionicSideMenuDelegate', 'zm', '$stateParams', '$ionicHistory', '$state', 'NVR', '$rootScope', '$ionicPopup', '$translate', '$timeout', '$location', 'EventServer', 'zmAutoLogin', '$http', 'SecuredPopups', '$ionicLoading', function ($scope, $ionicSideMenuDelegate, zm, $stateParams, $ionicHistory, $state, NVR, $rootScope, $ionicPopup, $translate, $timeout, $location, EventServer, zmAutoLogin, $http, SecuredPopups, $ionicLoading) {
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

  //----------------------------------------------------------------
  // This controller sits along with the main app to  bring up 
  // the language menu from the main 
  //----------------------------------------------------------------


  $scope.go = function (p) {


    $ionicHistory.nextViewOptions({
      historyRoot: true,
      disableAnimate: true,
      expire: 300
    });
    $ionicSideMenuDelegate.toggleLeft();
    $location.path(p);
  };

  $scope.navigateView = function (view, args) {

    if (view == $state.current.name) return;
    NVR.debug("Navigating view to: " + view);
    $ionicHistory.nextViewOptions({
      disableBack: true
    });
    $state.go(view, args);

    /*  $timeout (function() {
        window.stop();
        // after window stop executes, in next cycle
        // this _should_ ensure stop concludes before
        // exit/entry lifecycles kick in?z
        
        $timeout (function() {$state.go(view,args);});
        
      });*/

  };

  $scope.exitKiosk = function() {
    $scope.data = {};     
    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      template: '<small>'+$translate.instant('kKioskPassword')+'</small><input type="password" ng-model="data.p1"><br/><small>',
      title: $translate.instant('kPassword'),
      scope: $scope,
      buttons: [
        { text: $translate.instant('kButtonCancel'),
            type: 'button-assertive',
            onTap: function (e) {
              $ionicSideMenuDelegate.toggleLeft();
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
              var ld = NVR.getLogin();
              if ($scope.data.p1 == ld.kioskPassword) {
                ld.isKiosk = false;
                NVR.setLogin(ld);
              }
              else {
                    $ionicLoading.show({
                        template: $translate.instant('kBannerPinMismatch') + "...",
                        noBackdrop: true,
                        duration: 1500
                    });
                  NVR.log ("Kiosk code mistmatch");
                 // $scope.loginData.isKiosk = false;
                  e.preventDefault();
              }
              
            }
          }
        }
      ]
    });


   

  };

  function switchToServer(s) {

    $rootScope.alarmCount = 0;
    $rootScope.isAlarm = false;
    $rootScope.authSession = '';
    //console.log ("******************* AUTHSESSION RESET!!!!!!");



    // First lets kill current stuf
    NVR.debug("** Resetting existing server");
    var cld = NVR.getLogin();
    if (cld.isUseEventServer) {
      NVR.debug("Stopping Event server");
      EventServer.disconnect();
    }


    NVR.debug("**Switching to new server...");

    NVR.clearZmsMultiPortSupport();
    var zmServers = NVR.getServerGroups();
    var loginData = zmServers[s];
    NVR.debug("Retrieved state for this profile:" + JSON.stringify(loginData));
    NVR.checkInitSanity(loginData);
    NVR.setLogin(loginData);



    if (!loginData.isUseBasicAuth) {
      $rootScope.basicAuthHeader = '';
      $rootScope.basicAuthToken = '';
      // console.log ("CLEARING AUTH");
    } else {
      $rootScope.basicAuthToken = btoa(loginData.basicAuthUser + ':' + loginData.basicAuthPassword);
      $rootScope.basicAuthHeader = 'Basic ' + $rootScope.basicAuthToken;

    }


    if (window.cordova) {

      if (loginData.isUseBasicAuth) {
        NVR.debug("Cordova HTTP: configuring basic auth");
        cordova.plugin.http.useBasicAuth(loginData.basicAuthUser, loginData.basicAuthPassword);
      }

      if (!loginData.enableStrictSSL) {

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

    }


    if (loginData.isUseEventServer) {
      EventServer.init()
        .then(function (succ) {
            EventServer.sendMessage("control", {
              type: 'filter',
              monlist: loginData.eventServerMonitors,
              intlist: loginData.eventServerInterval,
              token: $rootScope.apnsToken
            });
          },
          function (err) {
            NVR.debug("EventServer init failed");
          });


    }


    

    //var portalurl = loginData.url + '/index.php';

    zmAutoLogin.doLogin("<button class='button button-clear' style='line-height: normal; min-height: 0; min-width: 0;  color:#fff;' ng-click='$root.cancelAuth()'><i class='ion-close-circled'></i>&nbsp;" + $translate.instant('kAuthenticating') + "...</button>")
      // Do the happy menu only if authentication works
      // if it does not work, there is an emitter for auth
      // fail in app.js that will be called to show an error
      // box

      .then(function (data) {
        zmAutoLogin.start();
        // possible image digits changed between servers
        NVR.getKeyConfigParams(0);
        $rootScope.runMode = NVR.getBandwidth();
        //console.log ("HERE");
        var apiurl = loginData.apiurl + '/host/getVersion.json?'+$rootScope.authSession;

    //console.log ("****** MENU CONTROLLER:"+apiurl);

        NVR.log("Validating APIs at " + apiurl);
        $http.get(apiurl)
          .then(function (data) {

              data = data.data;
              NVR.getTimeZone(true);
              var loginStatus = $translate.instant('kExploreEnjoy') + " " + $rootScope.appName + "!";
              EventServer.refresh();

              // now grab and report PATH_ZMS
              NVR.getPathZms()
                .then(function (data) {
                  var ld = NVR.getLogin();
                  var zm_cgi = data.toLowerCase();

                  var user_cgi = (ld.streamingurl).toLowerCase();
                  NVR.log("ZM relative cgi-path: " + zm_cgi + ", you entered: " + user_cgi);

                  $http.get(ld.streamingurl + "/zms")
                    .then(function (data) {
                        data = data.data;
                        NVR.debug("Urk! cgi-path returned  success, but it should not have come here");
                        loginStatus = $translate.instant('kLoginStatusNoCgi');

                        NVR.debug("refreshing API version...");
                        NVR.getAPIversion()
                          .then(function (data) {
                              $rootScope.apiVersion = data;
                              var refresh = NVR.getMonitors(1)
                                .then(function () {


                                  $ionicHistory.nextViewOptions({
                                    disableBack: true
                                  });

                                  //console.log("+++ state go after getMonitors force");
                                  $state.go('app.refresh', {
                                    "view": $state.current.name
                                  });
                                  return;
                                });


                            },
                            function (error) {
                              var refresh = NVR.getMonitors(1)
                                .then(function () {
                                  //console.log("+++ state go after API version error: " + error);
                                  $rootScope.apiVersion = "0.0.0";
                                  NVR.debug("Error, failed API version, setting to " + $rootScope.apiVersion);

                                  $ionicHistory.nextViewOptions({
                                    disableBack: true
                                  });


                                  $state.go('app.refresh', {
                                    "view": $state.current.name
                                  });
                                  return;

                                });



                            });

                      },
                      function (error, status) {
                        // If its 5xx, then the cgi-bin path is valid
                        // if its 4xx then the cgi-bin path is not valid

                        if (status < 500) {
                          loginStatus = $translate.instant('kLoginStatusNoCgiAlt');
                        }

                        NVR.displayBanner((status < 500) ? 'error' : 'info', [loginStatus]);

                        NVR.debug("refreshing API version...");
                        NVR.getAPIversion()
                          .then(function (data) {
                              var refresh = NVR.getMonitors(1)
                                .then(function () {
                                  $rootScope.apiVersion = data;
                                  $ionicHistory.nextViewOptions({
                                    disableBack: true
                                  });

                                  //console.log("+++ state go after 5xx");
                                  $state.go('app.refresh', {
                                    "view": $state.current.name
                                  });
                                  return;
                                });

                            },
                            function (error) {
                              var refresh = NVR.getMonitors(1)
                                .then(function () {
                                  $rootScope.apiVersion = "0.0.0";
                                  NVR.debug("Error, failed API version, setting to " + $rootScope.apiVersion);
                                  $ionicHistory.nextViewOptions({
                                    disableBack: true
                                  });
                                  //console.log("+++ state go after API version force");
                                  $state.go('app.refresh', {
                                    "view": $state.current.name
                                  });
                                  return;

                                });

                            });

                      });
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

  $scope.switchProfiles = function () {

    $scope.newServer = {
      val: ""
    };
    $scope.avs = Object.keys(NVR.getServerGroups());

    $scope.avs = $scope.avs.filter(function () {
      return true;
    });

    if ($scope.avs.length <= 1) {
      return;
    }

    $rootScope.zmPopup = $ionicPopup.show({
      scope: $scope,
      template: '<ion-radio-fix ng-if="item" ng-repeat="item in avs" ng-value="item" ng-model="newServer.val" > {{item}} </ion-radio-fix>',

      title: $translate.instant('kSelect'),
      subTitle: $translate.instant('kActive') + ': '+ NVR.getLogin().serverName,

      buttons: [{
          text: $translate.instant('kButtonCancel'),
          onTap: function (e) {
            if ($ionicSideMenuDelegate.isOpen()) {
              $ionicSideMenuDelegate.toggleLeft();

            }
          }

        },
        {
          text: $translate.instant('kButtonOk'),
          onTap: function (e) {
            NVR.log("Server selected:" + $scope.newServer.val);
            if ($ionicSideMenuDelegate.isOpen()) {
              $ionicSideMenuDelegate.toggleLeft();

            }
            if (NVR.getLogin().serverName != $scope.newServer.val)
              switchToServer($scope.newServer.val);

            //$rootScope.$broadcast('server-changed');

            //return "OK";

          }
        }
      ]
    });



  };


  $scope.switchLang = function () {
    $scope.lang = NVR.getLanguages();
    $scope.myopt = {
      lang: ""
    };

    $rootScope.zmPopup = $ionicPopup.show({
      scope: $scope,
      template: '<ion-radio-fix ng-repeat="item in lang" ng-value="item.value" ng-model="myopt.lang"> {{item.text}} </ion-radio-fix>',

      title: $translate.instant('kSelectLanguage'),

      buttons: [{
          text: $translate.instant('kButtonCancel'),
          onTap: function (e) {
            //return "CANCEL";
          }

        },
        {
          text: $translate.instant('kButtonOk'),
          onTap: function (e) {
            NVR.log("Language selected:" + $scope.myopt.lang);
            NVR.setDefaultLanguage($scope.myopt.lang, true);
            $rootScope.$broadcast('language-changed');

            //return "OK";

          }
        }
      ]
    });

  };

}]);
