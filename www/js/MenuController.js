/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('MenuController', ['$scope', '$ionicSideMenuDelegate', 'zm', '$stateParams', '$ionicHistory', '$state', 'NVRDataModel', '$rootScope', '$ionicPopup', '$translate', '$timeout', '$location', 'EventServer', 'zmAutoLogin', '$http', 'SecuredPopups', function ($scope, $ionicSideMenuDelegate, zm, $stateParams, $ionicHistory, $state, NVRDataModel, $rootScope, $ionicPopup, $translate, $timeout, $location, EventServer, zmAutoLogin, $http, SecuredPopups) {
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
    NVRDataModel.debug("Navigating view to: " + view);
    $ionicHistory.nextViewOptions({
      disableBack: true
    });
    $state.go(view, args);

    /*  $timeout (function() {
        window.stop();
        // after window stop executes, in next cycle
        // this _should_ ensure stop concludes before
        // exit/entry lifecycles kick in?
        $timeout (function() {$state.go(view,args);});
        
      });*/

  };

  function switchToServer(s) {

    $rootScope.alarmCount = 0;
    $rootScope.isAlarm = false;
    $rootScope.authSession = '';




    // First lets kill current stuf
    NVRDataModel.debug("** Resetting existing server");
    var cld = NVRDataModel.getLogin();
    if (cld.isUseEventServer) {
      NVRDataModel.debug("Stopping Event server");
      EventServer.disconnect();
    }


    NVRDataModel.debug("**Switching to new server...");

    NVRDataModel.clearZmsMultiPortSupport();
    var zmServers = NVRDataModel.getServerGroups();
    var loginData = zmServers[s];
    NVRDataModel.debug("Retrieved state for this profile:" + JSON.stringify(loginData));
    NVRDataModel.setLogin(loginData);



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
        NVRDataModel.debug("Cordova HTTP: configuring basic auth");
        cordova.plugin.http.useBasicAuth(loginData.basicAuthUser, loginData.basicAuthPassword);
      }

      if (!loginData.enableStrictSSL) {

        //alert("Enabling insecure SSL");
        NVRDataModel.log(">>>> Disabling strict SSL checking (turn off  in Dev Options if you can't connect)");
        cordova.plugin.http.setSSLCertMode('nocheck', function () {
          NVRDataModel.debug('--> SSL is permissive, will allow any certs. Use at your own risk.');
        }, function () {
          console.log('-->Error setting SSL permissive');
        });

        if ($rootScope.platformOS == 'android') {
          log (">>> Android: enabling inline image view for self signed certs");
          cordova.plugins.certificates.trustUnsecureCerts(true);
        }

      } else {

        NVRDataModel.log(">>>> Enabling strict SSL checking (turn off  in Dev Options if you can't connect)");

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
            NVRDataModel.debug("EventServer init failed");
          });


    }


    var apiurl = loginData.apiurl + '/host/getVersion.json';
    var portalurl = loginData.url + '/index.php';

    zmAutoLogin.doLogin("<button class='button button-clear' style='line-height: normal; min-height: 0; min-width: 0;  color:#fff;' ng-click='$root.cancelAuth()'><i class='ion-close-circled'></i>&nbsp;" + $translate.instant('kAuthenticating') + "...</button>")
      // Do the happy menu only if authentication works
      // if it does not work, there is an emitter for auth
      // fail in app.js that will be called to show an error
      // box

      .then(function (data) {


        // possible image digits changed between servers
        NVRDataModel.getKeyConfigParams(0);
        $rootScope.runMode = NVRDataModel.getBandwidth();
        NVRDataModel.log("Validating APIs at " + apiurl);
        $http.get(apiurl)
          .then(function (data) {

              data = data.data;
              NVRDataModel.getTimeZone(true);
              var loginStatus = $translate.instant('kExploreEnjoy') + " " + $rootScope.appName + "!";
              EventServer.refresh();

              // now grab and report PATH_ZMS
              NVRDataModel.getPathZms()
                .then(function (data) {
                  var ld = NVRDataModel.getLogin();
                  var zm_cgi = data.toLowerCase();

                  var user_cgi = (ld.streamingurl).toLowerCase();
                  NVRDataModel.log("ZM relative cgi-path: " + zm_cgi + ", you entered: " + user_cgi);

                  $http.get(ld.streamingurl + "/zms")
                    .then(function (data) {
                        data = data.data;
                        NVRDataModel.debug("Urk! cgi-path returned  success, but it should not have come here");
                        loginStatus = $translate.instant('kLoginStatusNoCgi');

                        NVRDataModel.debug("refreshing API version...");
                        NVRDataModel.getAPIversion()
                          .then(function (data) {
                              $rootScope.apiVersion = data;
                              var refresh = NVRDataModel.getMonitors(1)
                                .then(function () {


                                  $ionicHistory.nextViewOptions({
                                    disableBack: true
                                  });

                                  console.log("+++ state go after getMonitors force");
                                  $state.go('app.refresh', {
                                    "view": $state.current.name
                                  });
                                  return;
                                });


                            },
                            function (error) {
                              var refresh = NVRDataModel.getMonitors(1)
                                .then(function () {
                                  console.log("+++ state go after API version error: " + error);
                                  $rootScope.apiVersion = "0.0.0";
                                  NVRDataModel.debug("Error, failed API version, setting to " + $rootScope.apiVersion);

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

                        NVRDataModel.displayBanner((status < 500) ? 'error' : 'info', [loginStatus]);

                        NVRDataModel.debug("refreshing API version...");
                        NVRDataModel.getAPIversion()
                          .then(function (data) {
                              var refresh = NVRDataModel.getMonitors(1)
                                .then(function () {
                                  $rootScope.apiVersion = data;
                                  $ionicHistory.nextViewOptions({
                                    disableBack: true
                                  });

                                  console.log("+++ state go after 5xx");
                                  $state.go('app.refresh', {
                                    "view": $state.current.name
                                  });
                                  return;
                                });

                            },
                            function (error) {
                              var refresh = NVRDataModel.getMonitors(1)
                                .then(function () {
                                  $rootScope.apiVersion = "0.0.0";
                                  NVRDataModel.debug("Error, failed API version, setting to " + $rootScope.apiVersion);
                                  $ionicHistory.nextViewOptions({
                                    disableBack: true
                                  });
                                  console.log("+++ state go after API version force");
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
              NVRDataModel.displayBanner('error', [$translate.instant('kBannerAPICheckFailed'), $translate.instant('kBannerPleaseCheck')]);
              NVRDataModel.log("API login error " + JSON.stringify(error));

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
    $scope.avs = Object.keys(NVRDataModel.getServerGroups());

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
      subTitle: $translate.instant('kActive') + ': '+ NVRDataModel.getLogin().serverName,

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
            NVRDataModel.log("Server selected:" + $scope.newServer.val);
            if ($ionicSideMenuDelegate.isOpen()) {
              $ionicSideMenuDelegate.toggleLeft();

            }
            if (NVRDataModel.getLogin().serverName != $scope.newServer.val)
              switchToServer($scope.newServer.val);

            //$rootScope.$broadcast('server-changed');

            //return "OK";

          }
        }
      ]
    });



  };


  $scope.switchLang = function () {
    $scope.lang = NVRDataModel.getLanguages();
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
            NVRDataModel.log("Language selected:" + $scope.myopt.lang);
            NVRDataModel.setDefaultLanguage($scope.myopt.lang, true);
            $rootScope.$broadcast('language-changed');

            //return "OK";

          }
        }
      ]
    });

  };

}]);
