/* jshint -W041 */
/* jshint -W083 */
/*This is for the loop closure I am using in line 143 */
/* jslint browser: true*/
/* global vis,cordova,StatusBar,angular,console,moment */
angular.module('zmApp.controllers').controller('zmApp.PortalLoginCtrl', ['$ionicPlatform', '$scope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$rootScope', '$http', '$q', '$state', '$ionicLoading', '$ionicPopover', '$ionicScrollDelegate', '$ionicModal', '$timeout', 'zmAutoLogin', '$ionicHistory', '$cordovaTouchID',  'EventServer', '$translate',function ($ionicPlatform, $scope, zm, ZMDataModel, $ionicSideMenuDelegate, $rootScope, $http, $q, $state, $ionicLoading, $ionicPopover, $ionicScrollDelegate, $ionicModal, $timeout, zmAutoLogin, $ionicHistory, $cordovaTouchID,  EventServer, $translate) {


    $scope.$on('$ionicView.enter',
        function () 
        {

            ZMDataModel.zmDebug("Inside Portal login Enter handler");
            loginData = ZMDataModel.getLogin();

            $ionicHistory.nextViewOptions({
                disableBack: true
            });
        

            $scope.pindata = {};
            if ($ionicSideMenuDelegate.isOpen()) {
                $ionicSideMenuDelegate.toggleLeft();
                ZMDataModel.zmDebug("Sliding menu close");
            }


            $scope.pinPrompt = false; // if true, then PIN is displayed else skip 

            if (ZMDataModel.isLoggedIn()) {
                ZMDataModel.zmLog("User credentials are provided");
                
                

                // You can login either via touch ID or typing in your code     
                if ($ionicPlatform.is('ios') && loginData.usePin) {
                    $cordovaTouchID.checkSupport()
                        .then(function () {
                            // success, TouchID supported
                            $cordovaTouchID.authenticate("")
                                .then(function () {
                                        ZMDataModel.zmLog("Touch Success");
                                        // Don't assign pin as it may be alphanum
                                        unlock(true);

                                    },
                                    function () {
                                        ZMDataModel.zmLog("Touch Failed");
                                    });
                        }, function (error) {
                            ZMDataModel.zmLog("TouchID not supported");
                        });
                } 
                else // touch was not used
                {
                    ZMDataModel.zmLog("not checking for touchID");
                }

                if (loginData.usePin) {
                    // this shows the pin prompt on screen
                    $scope.pinPrompt = true;
                    // dont call unlock, let the user type in code

                } 
                else // no PIN Code so go directly to auth
                {
                    
                    unlock(true);
                }

            } 
            else // login creds are not present
            {
                ZMDataModel.zmDebug("PortalLogin: Not logged in, so going to login");
                if (ZMDataModel.isFirstUse())
                {
                    ZMDataModel.zmDebug ("First use, showing warm and fuzzy...");
                    $ionicHistory.nextViewOptions({
                        disableAnimate: true,
                        disableBack: true
                    });
                    $state.go('first-use');
                }
                else
                {
                    if (!$rootScope.userCancelledAuth)
                    {
                            $ionicHistory.nextViewOptions({
                                disableAnimate: true,
                            disableBack: true
                            });
                            $state.go("login" ,{"wizard": false});
                    }
                    else   
                    {
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
    
        
    

    function unlock(idVerified) {
        /*
        idVerified == true means no pin check needed
                   == false means check PIN
        */
        
        ZMDataModel.zmDebug("unlock called with check PIN="+idVerified);
        if (idVerified || ($scope.pindata.pin == loginData.pinCode)) 
        {
            ZMDataModel.zmDebug("PIN code entered is correct, or there is no PIN set");
            $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
            zmAutoLogin.stop(); //safety
            zmAutoLogin.start();
            
            // PIN is fine, or not set so lets login
            zmAutoLogin.doLogin("<button class='button button-clear' style='line-height: normal; min-height: 0; min-width: 0;color:#fff;' ng-click='$root.cancelAuth()'><i class='ion-close-circled'></i>&nbsp;"+$translate.instant('kAuthenticating')+"...</button>")
                .then(function (data) // success
                {
                    ZMDataModel.zmDebug("PortalLogin: auth success");
                    ZMDataModel.getKeyConfigParams(1);
                    
                    //login was ok, so get API details
                    ZMDataModel.getAPIversion()
                    .then (function(data) {
                        ZMDataModel.zmLog("Got API version: " + data);
                        $rootScope.apiVersion = data;
                        var ld = ZMDataModel.getLogin();
                         if (ZMDataModel.versionCompare(data,zm.minAppVersion)==-1 && data !="0.0.0")
                        {

                            $state.go('lowversion', {"ver":data});
                        }

                        if (ZMDataModel.versionCompare(data,zm.recommendedAppVersion)==-1 && data !="0.0.0")
                        {

                            $state.go('importantmessage', {"ver":data});
                        }
                    });
                    EventServer.refresh();

                    if ($rootScope.tappedNotification)
                    {
                        
                       
                        var ld = ZMDataModel.getLogin();
                         ZMDataModel.zmLog ("Came via push tap. onTapScreen="+ld.onTapScreen);
                        //console.log ("***** NOTIFICATION TAPPED  ");
                        $rootScope.tappedNotification = 0;
                        $ionicHistory.nextViewOptions({disableBack: true});	

                        if (ld.onTapScreen == $translate.instant('kTapMontage') )
                        {
                            ZMDataModel.zmDebug("Going to montage");
                            $state.go("montage", {}, { reload: true });

                            return;
                        }
                        else if (ld.onTapScreen == $translate.instant ('kTapEvents'))
                        {
                            ZMDataModel.zmDebug("Going to events");
                            $state.go("events", {"id": 0}, { reload: true });
                            return;
                        }
                        else // we go to live
                        {
                            ZMDataModel.zmDebug("Going to live view ");
                            $state.go("monitors", {}, { reload: true });
                            return;
                        }
                    }
                        ZMDataModel.zmDebug("Transitioning state to: " + 
                                        $rootScope.lastState ? $rootScope.lastState : 'montage');
                        $state.go($rootScope.lastState ? $rootScope.lastState : 'montage', $rootScope.lastStateParam);
                    
                },
                    // coming here means auth error
                    // so go back to login
                function (error) {
                    ZMDataModel.zmDebug("PortalLogin: error authenticating " +
                        JSON.stringify(error));
                    if (!$rootScope.userCancelledAuth)
                    {
                            ZMDataModel.displayBanner('error', ['ZoneMinder authentication failed', 'Please check API settings']);
                            $ionicHistory.nextViewOptions({
                                disableAnimate: true,
                            disableBack: true
                            });
                            $state.go("login" ,{"wizard": false});
                    }
                    else   
                    {
                        // if user cancelled auth I guess we go to login
                        $rootScope.userCancelledAuth = false;
                        $state.go("login" ,{"wizard": false});
                    }
                });
        } 
        else 
        {
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
    ZMDataModel.zmLog ("Entering Portal Main");
    var loginData;
     $ionicSideMenuDelegate.canDragContent(true);

        

    }]);