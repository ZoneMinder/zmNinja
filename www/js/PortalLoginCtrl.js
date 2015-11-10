/* jshint -W041 */
/* jshint -W083 */
/*This is for the loop closure I am using in line 143 */
/* jslint browser: true*/
/* global vis,cordova,StatusBar,angular,console,moment */
angular.module('zmApp.controllers').controller('zmApp.PortalLoginCtrl', ['$ionicPlatform', '$scope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$rootScope', '$http', '$q', '$state', '$ionicLoading', '$ionicPopover', '$ionicScrollDelegate', '$ionicModal', '$timeout', 'zmAutoLogin', '$ionicHistory', '$cordovaTouchID',  'EventServer', function ($ionicPlatform, $scope, zm, ZMDataModel, $ionicSideMenuDelegate, $rootScope, $http, $q, $state, $ionicLoading, $ionicPopover, $ionicScrollDelegate, $ionicModal, $timeout, zmAutoLogin, $ionicHistory, $cordovaTouchID,  EventServer) {


    $scope.$on('$ionicView.enter',
        function () {

            ZMDataModel.zmDebug("Inside Portal login Enter handler");


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
                } else {
                    ZMDataModel.zmLog("not checking for touchID");
                }

                if (loginData.usePin) {
                    $scope.pinPrompt = true;


                } else // no PIN Code so skip
                {

                    // don't get stuck in this state
                    // will happen if you switch to background in portal state
                    if ($rootScope.lastState == "zm-portal-login") {
                        ZMDataModel.zmDebug("Last state was portal-login, so forcing montage");
                        $rootScope.lastState = "montage";
                    }
                    ZMDataModel.zmDebug("PIN code not set");
                    $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
                    zmAutoLogin.stop(); //safety
                    zmAutoLogin.start();
                    zmAutoLogin.doLogin("authenticating...")
                        .then(function (data) // success
                            {
                                ZMDataModel.zmDebug("PortalLogin: auth success");
                                ZMDataModel.getKeyConfigParams(1);
                                ZMDataModel.zmDebug("Transitioning state to: " + 
                                                    $rootScope.lastState ? $rootScope.lastState : 'montage');
                        
                                ZMDataModel.getAPIversion()
                                .then (function(data) {
                                    ZMDataModel.zmLog("Got API version: " + data);
                                    var ld = ZMDataModel.getLogin();
                                     if (versionCompare(data,zm.minAppVersion)==-1 && (ld.url.indexOf("arjunrc.") == -1) && data !="0.0.0")
                                    //if (versionCompare(data,zm.minAppVersion))
                                    {
                                        
                                        $state.go('lowversion', {"ver":data});
                                    }
                                });
                                EventServer.refresh();
                        
                        if ($rootScope.tappedNotification)
                        {
                            var ld = ZMDataModel.getLogin();
                            
                            console.log ("***** NOTIFICATION TAPPED  ");
                            $rootScope.tappedNotification = 0;
                            $ionicHistory.nextViewOptions({disableBack: true});	
                            
                            if (ld.onTapScreen == 'montage' )
                            {
                                ZMDataModel.zmDebug("Going to montage");
                                $state.go("montage", {}, { reload: true });
                                
                                return;
                            }
                            else
                            {
                                ZMDataModel.zmDebug("Going to events");
                                $state.go("events", {"id": 0}, { reload: true });
                                return;
                            }
                        }
                        
                                $state.go($rootScope.lastState ? $rootScope.lastState : 'montage', $rootScope.lastStateParam);
                            },
                            // coming here means auth error
                            // so go back to login
                            function (error) {
                                ZMDataModel.zmDebug("PortalLogin: error authenticating " +
                                    JSON.stringify(error));
                                $state.go('login');
                            });
                }

            } else {
                ZMDataModel.zmDebug("PortalLogin: Not logged in, so going to login");
                if (ZMDataModel.isFirstUse())
                {
                    ZMDataModel.zmDebug ("First use, showing warm and fuzzy...");
                    $state.go('first-use');
                }
                else
                {
                    $state.go('login');
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
        unlock(false);
    };
    
    //credit: https://gist.github.com/alexey-bass/1115557
    function versionCompare(left, right) {
        if (typeof left + typeof right != 'stringstring')
            return false;

        var a = left.split('.');
        var  b = right.split('.');
        var i = 0;
        var len = Math.max(a.length, b.length);

        for (; i < len; i++) {
            if ((a[i] && !b[i] && parseInt(a[i]) > 0) || (parseInt(a[i]) > parseInt(b[i]))) {
                return 1;
            } else if ((b[i] && !a[i] && parseInt(b[i]) > 0) || (parseInt(a[i]) < parseInt(b[i]))) {
                return -1;
            }
        }

        return 0;
}
    
    

    function unlock(touchVerified) {
        ZMDataModel.zmDebug("Trying to unlock PIN");
        if (touchVerified || ($scope.pindata.pin == loginData.pinCode)) {
            ZMDataModel.zmDebug("PIN code entered is correct");
            $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
            zmAutoLogin.stop(); //safety
            zmAutoLogin.start();
            zmAutoLogin.doLogin("authenticating...")
                .then(function (data) // success
                    {
                        EventServer.refresh();
                        // don't get stuck in this state
                        // will happen if you switch to background in portal state
                        if ($rootScope.lastState == "zm-portal-login") {
                            ZMDataModel.zmDebug("Last state was portal-login, so forcing montage");
                            $rootScope.lastState = "montage";
                        }
                        ZMDataModel.zmDebug("PortalLogin: auth success");
                          ZMDataModel.getAPIversion()
                                .then (function(data) {
                                    var ld = ZMDataModel.getLogin();
                                    ZMDataModel.zmLog("Got API version: " + data);
                                    if ((versionCompare(data,zm.minAppVersion)==-1) && (ld.url.indexOf("arjunrc.") == -1) && data !="0.0.0")
                                    {
                                       
                                      
                                        $state.go('lowversion', {"ver":data});
                                    }
                                    
                              
                                });
                        ZMDataModel.getKeyConfigParams(1);
                
                        if ($rootScope.tappedNotification)
                        {
                            $rootScope.tappedNotification = 0;
                            $ionicHistory.nextViewOptions({disableBack: true});		
                               console.log ("***** NOTIFICATION TAPPED GOING TO EVENTS ");
                            $state.go("events", {"id": 0}, { reload: true });
                            return;
                            
                        }
                
                        if ($rootScope.lastState == 'lowversion') $rootScope.lastState = 'montage';
                        ZMDataModel.zmDebug("Transitioning state to: " + $rootScope.lastState ? $rootScope.lastState : 'montage');
                        console.log ("*********** GOING TO " + $rootScope.lastState);
                        $state.go($rootScope.lastState ? $rootScope.lastState : 'montage', $rootScope.lastStateParam);
                    },
                    // coming here means auth error
                    // so go back to login
                    function (error) {
                        ZMDataModel.zmDebug("PortalLogin: error authenticating " +
                            JSON.stringify(error));
                        $state.go('login');
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
    console.log("************* ENTERING PORTAL MAIN ");
    var loginData = ZMDataModel.getLogin();
     $ionicSideMenuDelegate.canDragContent(false);

        

    }]);