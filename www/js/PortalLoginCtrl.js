/* jshint -W041 */
/* jshint -W083 */
/*This is for the loop closure I am using in line 143 */
/* jslint browser: true*/
/* global vis,cordova,StatusBar,angular,console,moment */
angular.module('zmApp.controllers').controller('zmApp.PortalLoginCtrl', ['$ionicPlatform', '$scope', 'zm', 'NVR', '$ionicSideMenuDelegate', '$rootScope', '$http', '$q', '$state', '$ionicLoading', '$ionicPopover', '$ionicScrollDelegate', '$ionicModal', '$timeout', 'zmAutoLogin', '$ionicHistory', 'EventServer', '$translate', '$ionicPopup', function ($ionicPlatform, $scope, zm, NVR, $ionicSideMenuDelegate, $rootScope, $http, $q, $state, $ionicLoading, $ionicPopover, $ionicScrollDelegate, $ionicModal, $timeout, zmAutoLogin, $ionicHistory, EventServer, $translate, $ionicPopup) {

 
  var broadcastHandles = [];
  var processPush = false;
  var alreadyTransitioned = false;

  $scope.$on('$ionicView.beforeLeave', function () {
    processPush = false;
   
  });

  

  $scope.$on('$ionicView.beforeLeave', function () {
    //NVR.debug("Portal: Deregistering broadcast handles");
    for (var i = 0; i < broadcastHandles.length; i++) {
      //broadcastHandles[i]();
    }
    broadcastHandles = [];
  });


  $scope.$on('$ionicView.beforeEnter',
    function () {
      alreadyTransitioned = false;

      });


  $scope.$on('$ionicView.enter',
    function () {


      $scope.$on ( "process-push", function () {
        processPush = true;

        if (!alreadyTransitioned) {
          NVR.debug (">> PortalLogin: push handler, marking to resolve later");
        
        }
        else {
          NVR.debug (">> PortalLoginCtrl: push handler");
          processPush = false;
          var s = NVR.evaluateTappedNotification();
          NVR.debug("tapped Notification evaluation:"+ JSON.stringify(s));
          $ionicHistory.nextViewOptions({
            disableAnimate:true,
            disableBack: true
          });
          $state.go(s[0],s[1],s[2]);
          return;

        }
        
      });
    

      NVR.setJustResumed(false);

      NVR.debug("Inside Portal login Enter handler");
      loginData = NVR.getLogin();

      $ionicHistory.nextViewOptions({
        disableAnimate:true,
        disableBack: true
      });


    
      $scope.pindata = {};
      if ($ionicSideMenuDelegate.isOpen()) {
        $ionicSideMenuDelegate.toggleLeft();
        NVR.debug("Sliding menu close");
      }

      $scope.pinPrompt = false; // if true, then PIN is displayed else skip 

      if (NVR.hasLoginInfo()) {
        NVR.log("User credentials are provided");

        // You can login either via touch ID or typing in your code     

        var ld = NVR.getLogin();

        if (ld.reloadInMontage == true) {
          // we are in montage reload, so don't re-auth
          NVR.log("skipping validation, as this is montage reload");
          ld.reloadInMontage = false;
          NVR.setLogin(ld);
          unlock(true);

        } 
        
        else if ($rootScope.platformOS == 'desktop' && loginData.usePin) {

            $scope.passwdData = {};
            var myPopup = $ionicPopup.show({
                template: '<input type="password" ng-model="passwdData.pass">',
                title: $translate.instant('kPinProtect'),
                scope: $scope,
                buttons: [
                  
                  {
                    text: $translate.instant('kButtonOk'),
                    type: 'button-positive',
                    onTap: function(e) {
                      if (!$scope.passwdData.pass) {
                        //don't allow the user to close unless he enters wifi password
                        e.preventDefault();
                      } else {
                        if ($scope.passwdData.pass == loginData.pinCode) {
                          NVR.log ("Pin code match");
                          unlock(true);
                        }
                        else {
                              $ionicLoading.show({
                                  template: $translate.instant('kBannerPinMismatch') + "...",
                                  noBackdrop: true,
                                  duration: 1500
                              });
                            NVR.log ("Pin code mistmatch match");
                            e.preventDefault();
                        }
                        
                      }
                    }
                  }
                ]
              });
      


        }
        else if ($ionicPlatform.is('android') && loginData.usePin) {

          FingerprintAuth.isAvailable(function (result) {
              NVR.debug("FingerprintAuth available: " + JSON.stringify(result));
              if (result.isAvailable == true && result.hasEnrolledFingerprints == true) {
                var encryptConfig = {
                  clientId: "zmNinja",
                  username: "doesntmatter",
                  password: "doesntmatter",
                  maxAttempts: 5,
                  locale: "en_US",
                  dialogTitle: $translate.instant('kPleaseAuthenticate'),
                  dialogMessage: $translate.instant('kPleaseAuthenticate'),
                  dialogHint: "",
                }; // See config object for required parameters
                FingerprintAuth.encrypt(encryptConfig, function (succ) {
                  NVR.log("Touch success");
                  unlock(true);
                }, function (err) {
                  NVR.log("Touch Failed " + JSON.stringify(msg));
                });
              } // if available                            
            },
            function (err) {
              NVR.log("Fingerprint auth not available or not compatible with Android specs: " + JSON.stringify(err));
            }

          ); //isAvailable

        } else if ($ionicPlatform.is('ios') && loginData.usePin) {

          window.plugins.touchid.isAvailable(
            function () {
              window.plugins.touchid.verifyFingerprint(
                $translate.instant('kPleaseAuthenticate'), // this will be shown in the native scanner popup
                function (msg) {
                  NVR.log("Touch success");
                  unlock(true);
                }, // success handler: fingerprint accepted
                function (msg) {
                  NVR.log("Touch Failed " + JSON.stringify(msg));
                } // error handler with errorcode and localised reason
              );
            },
            function (err) {});

          /* $cordovaTouchID.checkSupport()
               .then(function()
               {
                   // success, TouchID supported
                   $cordovaTouchID.authenticate("")
                       .then(function()
                           {
                               NVR.log("Touch Success");
                               // Don't assign pin as it may be alphanum
                               unlock(true);

                           },
                           function()
                           {
                               NVR.log("Touch Failed");
                           });
               }, function(error)
               {
                   NVR.log("TouchID not supported");
               });*/
        } else // touch was not used
        {
          NVR.log("not checking for touchID");
        }

        if (loginData.usePin ) {
          // this shows the pin prompt on screen
          if ($rootScope.platformOS != 'desktop') {
              $scope.pinPrompt = true;
          }
          // dont call unlock, let the user type in code

        } else  // no PIN Code so go directly to auth
        {

          unlock(true);
        }

      } else // login creds are not present
      {
        NVR.debug("PortalLogin: Not logged in, so going to login");
        if (NVR.isFirstUse()) {
          NVR.debug("First use, showing warm and fuzzy...");
          $ionicHistory.nextViewOptions({
            disableAnimate: true,
            disableBack: true
          });
          $state.go('app.first-use');
          return;
        } else {
          if (!$rootScope.userCancelledAuth) {
            $ionicHistory.nextViewOptions({
              disableAnimate: true,
              disableBack: true
            });

            $state.go("app.login", {
              "wizard": false
            });
            return;
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
          NVR.debug("2nd auth login worked");
          NVR.getAPIversion()
            .then(function (data) {
                NVR.getKeyConfigParams(1);
                NVR.log("2nd auth:Got API version: " + data);
                $rootScope.apiVersion = data;
                var ld = NVR.getLogin();
                if (NVR.versionCompare(data, zm.minAppVersion) == -1 && data != "0.0.0") {

                  $rootScope.importantMessageHeader = $translate.instant('kImportant');
                  $rootScope.importantMessageSummary = $translate.instant('kVersionIncompatible', {currentVersion: data, minVersion: zm.minAppVersion});


                  $state.go('app.importantmessage');
                  return;
                }

           

                var statetoGo = $rootScope.lastState ? $rootScope.lastState : 'app.montage';
                if ($rootScope.LoginData.isKiosk) {
                  NVR.log ('>>> You are in kiosk mode');
                  statetoGo = 'app.montage';
                  $rootScope.lastStateParam='';

                }
                //NVR.debug ("logging state transition");
                NVR.debug("2nd Auth: Transitioning state to: " +
                  statetoGo + " with param " + JSON.stringify($rootScope.lastStateParam));

                alreadyTransitioned = true;
                $state.go(statetoGo, $rootScope.lastStateParam);
                return;

              },
              function (error) {
                NVR.debug("2nd auth API failed, going to login");
                d.reject("failed 2nd auth");
                return (d.promise);

              });

        },
        function (error) {
          NVR.debug("2nd auth hack failed, going to login");
          d.reject("failed 2nd auth");
          return (d.promise);
        });

    return (d.promise);
  }


  
  //broadcastHandles.push(pp);

  function unlock(idVerified) {
    /*
    idVerified == true means no pin check needed
               == false means check PIN
    */

    NVR.debug("unlock called with check PIN=" + idVerified);
    if (idVerified || ($scope.pindata.pin == loginData.pinCode)) {
      NVR.debug("PIN code entered is correct, or there is no PIN set");
      $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
      zmAutoLogin.stop(); //safety
      zmAutoLogin.start();

      // PIN is fine, or not set so lets login
      zmAutoLogin.doLogin("<button class='button button-clear' style='line-height: normal; min-height: 0; min-width: 0;color:#fff;' ng-click='$root.cancelAuth()'><i class='ion-close-circled'></i>&nbsp;" + $translate.instant('kAuthenticating') + "...</button>")
        .then(function (data) // success
          {
            NVR.debug("PortalLogin: auth success");


            // $state.go("login" ,{"wizard": false});
            //login was ok, so get API details
            NVR.getAPIversion()
              .then(function (data) {
                  NVR.log("Got API version: " + data);
                  $rootScope.apiVersion = data;
                  var ld = NVR.getLogin();
                  console.log (">>>>>>>> COMPARING "+data+" to "+zm.minAppVersion);
                  if (NVR.versionCompare(data, zm.minAppVersion) == -1 && data != "0.0.0") {

                    $rootScope.importantMessageHeader = $translate.instant('kImportant');
                    $rootScope.importantMessageSummary = $translate.instant('kVersionIncompatible', {currentVersion: data, minVersion: zm.minAppVersion});
                    $ionicHistory.nextViewOptions({
                      disableAnimate:true,
                      disableBack: true
                    });
                    $state.go('app.importantmessage');

                      return;
                  }

              

                  /*if (data == "0.0.0")
                  {

                      NVR.log("API getVersion succeeded but returned 0.0.0 " + JSON.stringify(data));
                      NVR.displayBanner('error', ['ZoneMinder authentication failed']);
                      $state.go("login",
                      {
                          "wizard": false
                      });
                      return;

                  }*/
                  // coming here means continue
                  // console.log (">>>>>>>>>>>>>>>>>>>>>>>>>NEVER");

                  NVR.getKeyConfigParams(1);
                  NVR.getTimeZone();
                  EventServer.init();

                  NVR.zmPrivacyProcessed()
                    .then(function (val) {
                    //  console.log(">>>>>>>>>>>>>>>>>>> PRIVACY PROCESSED:" + val);
                      if (!val) {
                        var alertPopup = $ionicPopup.alert({
                          title: $translate.instant('kNote'),
                          template: $translate.instant('kDataPrivacyZM'),
                          okText: $translate.instant('kButtonOk'),
                          cancelText: $translate.instant('kButtonCancel'),
                        });

                      }
                    });

                  // if push broadcast happens BEFORE this, then no 
                  // state change will occur here which is good

                  // if push happens AFTER this, then while going to
                  // lastState, it will interrupt and go to onTap
                  // (I HOPE...)
                
                    //console.log ("NOTIFICATION TAPPED INSIDE CHECK IS "+$rootScope.tappedNotification);
                    var statetoGo = $rootScope.lastState ? $rootScope.lastState : 'app.montage';
                    //  NVR.debug("logging state transition");

                    if (!processPush) {
                      alreadyTransitioned = true;

                      if ($rootScope.LoginData.isKiosk) {
                        NVR.log ('>>> You are in kiosk mode');
                        statetoGo = 'app.montage';
                        $rootScope.lastStateParam='';
      
                      }

                      NVR.debug("Transitioning state to: " +
                      statetoGo + " with param " + JSON.stringify($rootScope.lastStateParam));

                    

                    $state.go(statetoGo, $rootScope.lastStateParam);
                    return;
                    }
                    else {
                      NVR.debug ("Deferred handling of push:");
                      processPush = false;
                      var s = NVR.evaluateTappedNotification();
                      NVR.debug("tapped Notification evaluation:"+ JSON.stringify(s));
                      $ionicHistory.nextViewOptions({
                        disableAnimate:true,
                        disableBack: true
                      });
                      $state.go(s[0],s[1],s[2]);
                      return;
                    }
                   

               
                },
                function (error) { // API Error
                  NVR.log("API Error handler: going to login getAPI returned error: " + JSON.stringify(error));
                  //NVR.displayBanner('error', ['ZoneMinder authentication failed']);

                  NVR.debug("Doing the Aaron Hack after 1 sec....");
                  $timeout(function () {
                    tryLoggingSecondTimeHack()
                      .then(function success(s) {
                          NVR.log("2nd time login hack worked!, nothing to do");
                          NVR.getTimeZone();
                        },
                        function error(e) {

                          $ionicHistory.nextViewOptions({
                            disableAnimate:true,
                            disableBack: true
                          });

                          if ($rootScope.apiValid == true) {
                            $state.go("app.login", {
                              "wizard": false
                            });
                            return;
                          } else {
                            NVR.log ('Portal login:invalid api');
                            if (!$rootScope.userCancelledAuth)
                            $state.go("app.invalidapi");
                            return;
                          }

                        });

                    return;

                  }, 1000);

                });



          },
          // coming here means auth error
          // so go back to login
          function (error) {
            NVR.debug("PortalLogin: error authenticating " +
              JSON.stringify(error));
            if (!$rootScope.userCancelledAuth) {
              NVR.displayBanner('error', ['ZoneMinder authentication failed', 'Please check API settings']);
              $ionicHistory.nextViewOptions({
                disableAnimate: true,
                disableBack: true
              });
              $state.go("app.login", {
                "wizard": false
              });
              return;
            } else {
              // if user cancelled auth I guess we go to login
              $rootScope.userCancelledAuth = false;
              $state.go("app.login", {
                "wizard": false
              });
              return;
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
  NVR.log("Entering Portal Main");
  var loginData;
  $ionicSideMenuDelegate.canDragContent(true);


}]);
