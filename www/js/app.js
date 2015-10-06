/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,alert */


var appVersion = "0.0.0";

// core app start stuff
angular.module('zmApp', [
                            'ionic',
                            'ngIOS9UIWebViewPatch',
                            'tc.chartjs',
                            'zmApp.controllers',
                            'fileLogger',
                            'angular-carousel',
                            'angularAwesomeSlider',
    



                        ])

// ------------------------------------------
// Various constants central repository
// Feel free to change them as you see fit
//-----------------------------------------------

.constant('zm', {
    minAppVersion: '1.28.105',
    httpTimeout: 15000,
    largeHttpTimeout: 60000,
    logFile: 'zmNinjaLog.txt',
    authoremail: 'pliablepixels+zmNinja@gmail.com',
    logFileMaxSize: 50000, // after this limit log gets reset
    loginInterval: 300000, //5m*60s*1000 - ZM auto login after 5 mins
    loadingTimeout: 15000,
    safeMontageLimit: 10,
    maxFPS: 30,
    defaultFPS: 3,
    maxMontageQuality: 70,
    defaultMontageQuality: 50,
    progressIntervalCheck: 5000, // used for progress indicator on event playback
    graphFillColor: 'rgba(151,187,205,0.5)',
    graphStrokeColor: 'rgba(151,187,205,0.8)',
    graphHighlightFill: 'rgba(0,163,124,0.5)',
    graphItemMax: 200,
    monitorCheckingColor: '#03A9F4',
    monitorNotRunningColor: '#F44336',
    monitorPendingColor: '#FF9800',
    monitorRunningColor: '#4CAF50',
    monitorErrorColor: '#795548',
    montageScaleFrequency: 300,
    eventsListDetailsHeight: 200.0,
    eventsListScrubHeight: 300,
    loginScreenString: "var currentView = 'login'" // oh shit. Isn't there a better way?
})

//------------------------------------------------------------------
// I use this factory to share data between carousel and lazy load
// carousel will not progress autoslide till imageLoading is 0 or -1
//-------------------------------------------------------------------
.factory('imageLoadingDataShare', function () {
    var imageLoading = 0; // 0 = not loading, 1 = loading, -1 = error;
    return {
        'set': function (val) {
            imageLoading = val;
            //console.log ("** IMAGE  LOADING **"+val);
        },
        'get': function () {

            return imageLoading;
        }
    };
})

//------------------------------------------------------------------
// this directive will be load any time an image completes loading 
// via img tags where this directive is added (I am using this in
// events and monitor view to show a loader while the image is
// downloading from ZM
//------------------------------------------------------------------

.directive('imageonload', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.bind('load', function () {
                //call the function that was passed
                scope.$apply(attrs.imageonload);
            });
        }


    };
})



//--------------------------------------------------------------------------------------------
// This directive is adapted from https://github.com/paveisistemas/ionic-image-lazy-load
// I've removed lazyLoad and only made it show a spinner when an image is loading
//--------------------------------------------------------------------------------------------
.directive('imageSpinnerSrc', ['$document', '$compile', 'imageLoadingDataShare',
    function ($document, $compile, imageLoadingDataShare) {
        return {
            restrict: 'A',
            scope: {
                imageSpinnerBackgroundImage: "@imageSpinnerBackgroundImage"
            },
            link: function ($scope, $element, $attributes) {

                if ($attributes.imageSpinnerLoader) {
                    // console.log ("DIRECTIVE: IMAGE SPINNER");
                    var loader = $compile('<div class="image-loader-container"><ion-spinner style="position:fixed;top:5%;left:5%" class="image-loader" icon="' + $attributes.imageSpinnerLoader + '"></ion-spinner></div>')($scope);
                    $element.after(loader);
                }
                imageLoadingDataShare.set(1);
                loadImage();

                $attributes.$observe('imageSpinnerSrc', function (value) {
                    //console.log ("DIRECTIVE SOURCE CHANGED");
                    imageLoadingDataShare.set(1);
                    loadImage();
                    //deregistration();

                });


                // show an image-missing image 
                $element.bind('error', function () {
                    // console.log ("DIRECTIVE: IMAGE ERROR");
                    loader.remove();
                    imageLoadingDataShare.set(0);

                    var url = 'img/novideo.png';
                    $element.prop('src', url);
                });

                function loadImage() {
                    $element.bind("load", function (e) {
                        if ($attributes.imageSpinnerLoader) {
                            // console.log ("DIRECTIVE: IMAGE LOADED");
                            loader.remove();
                            imageLoadingDataShare.set(0);
                        }
                    });




                    if ($scope.imageSpinnerBackgroundImage == "true") {
                        var bgImg = new Image();
                        bgImg.onload = function () {
                            if ($attributes.imageSpinnerLoader) {
                                loader.remove();
                            }
                            // set style attribute on element (it will load image)
                            $element[0].style.backgroundImage = 'url(' + $attributes.imageSpinnerSrc + ')';
                        };
                        bgImg.src = $attributes.imageSpinnerSrc;
                        //console.log ("DIRECTIVE: BGIMAGE SRC SET TO " + $attributes.imageSpinnerSrc);
                    } else {
                        $element[0].src = $attributes.imageSpinnerSrc; // set src attribute on element (it will load image)
                        //console.log ("DIRECTIVE: IMAGE SRC SET TO "+$attributes.imageSpinnerSrc);
                    }
                }

                function isInView() {
                    return true;
                }

                $element.on('$destroy', function () {
                    // console.log ("**************** DIRECTIVE DESTROY IMAGE: " + $element[0].src);
                });
                // $element[0].src = "img/novideo.png";

            }
        };
    }])



    

//------------------------------------------------------------------
// In Android, HTTP requests seem to get stuck once in a while
// It may be a crosswalk issue.
// To tackle this gracefully, I've set up a global interceptor
// If the HTTP request does not complete in 15 seconds, it cancels
// That way the user can try again, and won't get stuck
// Also remember you need to add it to .config
//------------------------------------------------------------------
.factory('timeoutHttpIntercept', function ($rootScope, $q, zm) {
    var zmCookie = "";

    return {
        'request': function (config) {
            // config.withCredentials = true;
            if (zmCookie) {
                config.headers.Cookie = "ZMSESSID=" + zmCookie;
            }
            if ((config.url.indexOf("/api/states/change/") > -1) ||
                (config.url.indexOf("getDiskPercent.json") > -1) ||
                (config.url.indexOf("daemonCheck.json") > -1) ||
                (config.url.indexOf("getLoad.json") > -1))


            {
                // these can take time, so lets bump up timeout
                config.timeout = zm.largeHttpTimeout;
                //ZMDataModel.zmDebug("timeoutHttpIntercept: HTTP request with long response time. Timeout set to "+config.timeout);

            } else {
                config.timeout = zm.httpTimeout;
            }
            return config;
        },

        'response': function (response) {
            var cookies = response.headers("Set-Cookie");
            if (cookies != null) {

                var zmSess = cookies.match("ZMSESSID=(.*?);");

                if (zmSess) {
                    if (zmSess[1]) {

                        zmCookie = zmSess[1];
                    }
                } else {
                    //  console.log ("WHOLE STRING " + cookies);
                }
            }
            return response;
        }


    };
})

//-----------------------------------------------------------------
// This service automatically logs into ZM at periodic intervals
//------------------------------------------------------------------

.factory('zmAutoLogin', function ($interval, ZMDataModel, $http, zm, $browser, $timeout, $q, $rootScope, $ionicLoading, $ionicPopup, $state, $ionicContentBanner, EventServer) {
    var zmAutoLoginHandle;

    //------------------------------------------------------------------
    // doLogin() emits this when there is an auth error in the portal
    //------------------------------------------------------------------

    $rootScope.$on("auth-error", function () {

        ZMDataModel.zmDebug("zmAutoLogin: Inside auth-error emit");
        ZMDataModel.displayBanner('error', ['ZoneMinder authentication failed', 'Please check settings']);

    });

    //------------------------------------------------------------------
    // doLogin() emits this when our auth credentials work
    //------------------------------------------------------------------


    $rootScope.$on("auth-success", function () {
        var contentBannerInstance = $ionicContentBanner.show({
            text: ['ZoneMinder authentication success'],
            interval: 2000,
            type: 'info',
            transition: 'vertical'
        });

        $timeout(function () {
            contentBannerInstance();
        }, 2000);
        ZMDataModel.zmDebug("auth-success emit:Successful");
      });




    //------------------------------------------------------------------
    // doLogin() is the function that tries to login to ZM
    // it also makes sure we are not back to the same page
    // which actually means auth failed, but ZM treats it as a success
    //------------------------------------------------------------------

    function doLogin(str) {
        var d = $q.defer();
        var ld = ZMDataModel.getLogin();
        if (ld.isUseAuth == "0") {
            $ionicLoading.hide();
            ZMDataModel.zmLog("Authentication is disabled. Skipping login");
            d.resolve("Login success - no auth");
            return d.promise;
        }

        ZMDataModel.zmLog("zmAutologin called");

        if (str) {
            $ionicLoading.show({
                template: str,
                noBackdrop: true,
                duration: zm.httpTimeout
            });
        }

        ZMDataModel.isReCaptcha()
            .then(function (result) {
                if (result == true) {
                    $ionicLoading.hide();
                    ZMDataModel.displayBanner('error', ['reCaptcha must be disabled',
                                        ], "", 8000);
                    var alertPopup = $ionicPopup.alert({
                        title: 'reCaptcha enabled',
                        template: 'Looks like you have enabled reCaptcha. It needs to be turned off for zmNinja to work'
                    });

                    // close it after 5 seconds
                    $timeout(function () {

                        alertPopup.close();
                    }, 5000);
                }

            });



        var loginData = ZMDataModel.getLogin();
        $http({
                method: 'POST',
                //withCredentials: true,
                url: loginData.url + '/index.php',
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
                    username: loginData.username,
                    password: loginData.password,
                    action: "login",
                    view: "console"
                }
            })
            .success(function (data, status, headers) {
                $ionicLoading.hide();

                // Coming here does not mean success
                // it could also be a bad login, but
                // ZM returns you to login.php and returns 200 OK
                // so we will check if the data has
                // <title>ZM - Login</title> -- it it does then its the login page

                
                if (data.indexOf(zm.loginScreenString) == -1) {
                     //eventServer.start();
                    $rootScope.loggedIntoZm = 1;
                   
                    ZMDataModel.zmLog("zmAutologin successfully logged into Zoneminder");

                    d.resolve("Login Success");

                    $rootScope.$emit('auth-success', data);
                    $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
                } else //  this means login error
                {
                    $rootScope.loggedIntoZm = -1;
                    console.log("**** ZM Login FAILED");
                    ZMDataModel.zmLog("zmAutologin Error: Bad Credentials ", "error");
                    $rootScope.$emit('auth-error', "incorrect credentials");

                    d.reject("Login Error");
                }

                // Now go ahead and re-get auth key 
                $rootScope.authSession = "undefined";
                var ld = ZMDataModel.getLogin();
                ZMDataModel.getAuthKey()
                    .then(function (success) {

                            console.log(success);
                            $rootScope.authSession = success;
                            ZMDataModel.zmLog("Stream authentication construction: " +
                                $rootScope.authSession);

                        },
                        function (error) {
                            console.log(error);
                            
                            ZMDataModel.zmLog("Modal: Error returned Stream authentication construction. Retaining old value of: " + $rootScope.authSession);
                        });

                return (d.promise);

            })
            .error(function (error) {
                $ionicLoading.hide();
                $rootScope.loggedIntoZm = -1;
                console.log("**** ZM Login FAILED");
                ZMDataModel.zmLog("zmAutologin Error " + JSON.stringify(error), 
                                  "error, but not calling auth-error emit");
                // bad urls etc come here
                $rootScope.$emit('auth-error', error);

                d.reject("Login Error");
                return d.promise;
            });
        return d.promise;

    }

    function start() {
        var ld = ZMDataModel.getLogin();
        if (ld.isUseAuth == '1') {
            $rootScope.loggedIntoZm = 0;
            $interval.cancel(zmAutoLoginHandle);
            //doLogin();
            zmAutoLoginHandle = $interval(function () {
                doLogin("");

            }, zm.loginInterval); // Auto login every 5 minutes
            // PHP timeout is around 10 minutes
            // should be ok?
        } else {
            ZMDataModel.zmLog("Authentication not enabled. Skipping Timer");
        }
    }

    function stop() {
        var ld = ZMDataModel.getLogin();
        if (ld.isUseAuth == '1') {
            $interval.cancel(zmAutoLoginHandle);
            $rootScope.loggedIntoZm = 0;
            ZMDataModel.zmLog("Cancelling zmAutologin timer");
        } else {
            ZMDataModel.zmLog("No need to cancel zmAutologin timer. Auth is off");
        }
    }

    return {
        start: start,
        stop: stop,
        doLogin: doLogin
    };
})


//------------------------------------------------------------------
// First run in ionic
//------------------------------------------------------------------

.run(function ($ionicPlatform, $ionicPopup, $rootScope, zm, $state, $stateParams, ZMDataModel, $cordovaSplashscreen, $http, $interval, zmAutoLogin, $fileLogger, $timeout, $ionicHistory, $window, $ionicSideMenuDelegate, EventServer, $websocket) {

        $rootScope.zmGlobalCookie = "";
        $rootScope.isEventFilterOn = false;
        $rootScope.fromDate = "";
        $rootScope.fromTime = "";
        $rootScope.toDate = "";
        $rootScope.toTime = "";
        $rootScope.fromString = "";
        $rootScope.toString = "";
        $rootScope.loggedIntoZm = 0;
        $rootScope.websocketActive = 0;

        //console.log ("HERE");
        ZMDataModel.init();
        // for making sure we canuse $state.go with ng-click
        // needed for views that use popovers
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;

        var loginData = ZMDataModel.getLogin();

       

        // This code takes care of trapping the Android back button
        // and takes it to the menu.
        $ionicPlatform.registerBackButtonAction(function (e) {
            e.preventDefault();
            if (!$ionicSideMenuDelegate.isOpenLeft()) {
                $ionicSideMenuDelegate.toggleLeft();
                console.log("Status of SIDE MENU IS : " + $ionicSideMenuDelegate.isOpen());
            } else {
                navigator.app.exitApp();
            }
        }, 1000);


        // this works reliably on both Android and iOS. The "onorientation" seems to reverse w/h in Android. Go figure.
        // http://stackoverflow.com/questions/1649086/detect-rotation-of-android-phone-in-the-browser-with-javascript

        var checkOrientation = function () {
            var pixelRatio = window.devicePixelRatio || 1;
            $rootScope.devWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width);
            $rootScope.devHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height);
            console.log("********NEW Computed Dev Width & Height as" + $rootScope.devWidth + "*" + $rootScope.devHeight);


        };

        window.addEventListener("resize", checkOrientation, false);

        $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
            var requireLogin = toState.data.requireLogin;

            if (ZMDataModel.isLoggedIn()) {
                console.log("State transition is authorized");
                return;
            }

            if (requireLogin) {

                $ionicPopup.alert({
                    title: "Credentials Required",
                    template: "Please provide your ZoneMinder credentials"
                });
                // for whatever reason, .go was resulting in digest loops.
                // if you don't prevent, states will stack
                event.preventDefault();
                $state.transitionTo('login');
            }

        });



        $ionicPlatform.ready(function () {
            console.log("**** DEVICE READY ***");
            // generates and error in desktops but works fine
            ZMDataModel.zmLog("Device is ready");
            console.log("**** DEVICE READY ***");

            $fileLogger.checkFile().then(function (resp) {
                if (parseInt(resp.size) > zm.logFileMaxSize) {
                    console.log("Deleting old log file as it exceeds " + zm.logFileMaxSize + " bytes");
                    $fileLogger.deleteLogfile().then(function () {
                        console.log('Logfile deleted');
                    });
                } else {
                    console.log("Log file size is " + resp.size + " bytes");
                }


            });



            //fileLogger is an excellent cross platform library
            // that allows you to manage log files without worrying about
            // paths etc.https://github.com/pbakondy/filelogger
            $fileLogger.setStorageFilename(zm.logFile);
            // easier tz reading
            $fileLogger.setTimestampFormat('medium');

            if (window.cordova) {
                // getAppVersion is a handy library
                // that lets you extract the app version in config.xml
                // given that you are always changing versions while
                // uploading to app/play stores, this is very useful
                // to keep in sync and use within your app

                cordova.getAppVersion(function (version) {
                    appVersion = version;
                    ZMDataModel.zmLog("zmNinja Version: " + appVersion);
                    ZMDataModel.setAppVersion(appVersion);
                });

            }

            setTimeout(function () {
                if (window.cordova) {
                    $cordovaSplashscreen.hide();
                }
            }, 2000);

            /*if(window.navigator && window.navigator.splashscreen) {
                window.navigator.splashscreen.hide();
                console.log ("Unlocking portrait mode after splash");
                window.plugins.orientationLock.unlock();
            }*/

            var pixelRatio = window.devicePixelRatio || 1;
            $rootScope.devWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width);
            $rootScope.devHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height);

            console.log("********Computed Dev Width & Height as" + $rootScope.devWidth + "*" + $rootScope.devHeight);

            // What I noticed is when I moved the app to the device
            // the montage screens were not redrawn after resuming from background mode
            // Everything was fine if I switched back to the montage screen
            // so as a global hack I'm just reloading the current state if you switch
            // from foreground to background and back
            document.addEventListener("resume", function () {
                ZMDataModel.zmLog("App is resuming from background");
                // don't animate
                $ionicHistory.nextViewOptions({
                    disableAnimate: true,
                    disableBack: true
                });

                // remember the last state so we can 
                // go back there after auth
                if ($ionicHistory.currentView) {
                    $rootScope.lastState = $ionicHistory.currentView().stateName;
                    $rootScope.lastStateParam =
                        $ionicHistory.currentView().stateParams;
                    ZMDataModel.zmDebug("Last State recorded:" +
                        JSON.stringify($ionicHistory.currentView()));

                    $state.go("zm-portal-login");
                } else {
                    $rootScope.lastState = "";
                    $rootScope.lastStateParam = "";
                }
                //$ionicSideMenuDelegate.toggleLeft(false);
                //ZMDataModel.validatePin()

            }, false);


            document.addEventListener("pause", function () {
                console.log("****The application is going into  background");
                ZMDataModel.zmLog("App is going into background");

                zmAutoLogin.stop();
                if ($rootScope.zmPopup)
                        $rootScope.zmPopup.close();
                //$ionicPopup.close();

            }, false);


            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                // solves screen bouncing on form input
                // since I am using JS Scroll
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }



        }); //platformReady


        // lets POST so we get a session ID right hre

        console.log("Setting up POST LOGIN timer");
        zmAutoLogin.start();
    
        

    }) //run

//------------------------------------------------------------------
// Route configuration
//------------------------------------------------------------------

// My route map connecting menu options to their respective templates and controllers
.config(function ($stateProvider, $urlRouterProvider, $httpProvider) {
    // If you do this, Allow Origin can't be *
    //$httpProvider.defaults.withCredentials = true;
    $httpProvider.interceptors.push('timeoutHttpIntercept');

    $stateProvider
        .state('login', {
            data: {
                requireLogin: false
            },
            url: "/login",
            templateUrl: "templates/login.html",
            controller: 'zmApp.LoginCtrl',
        });

    $stateProvider
        .state('help', {
            data: {
                requireLogin: false
            },
            url: "/help",
            templateUrl: "templates/help.html",
            controller: 'zmApp.HelpCtrl',
        })

    .state('app', {
        url: '/',
        abstract: true,
        templateUrl: 'index.html',
        cache: false,
        //controller: 'AppCtrl'
    })


    .state('monitors', {
        data: {
            requireLogin: true
        },
        resolve: {
            message: function (ZMDataModel) {
                console.log("Inside app.montage resolve");
                return ZMDataModel.getMonitors(0);
            }
        },
        url: "/monitors",
        templateUrl: "templates/monitors.html",
        controller: 'zmApp.MonitorCtrl',

    })

    .state('events', {
        data: {
            requireLogin: true
        },
        resolve: {
            message: function (ZMDataModel) {
                console.log("Inside app.events resolve");
                return ZMDataModel.getMonitors(0);
            }
        },
        url: "/events/:id",
        templateUrl: "templates/events.html",
        controller: 'zmApp.EventCtrl',

    })

    .state('lowversion', {
        data: {
            requireLogin: false
        },
        
        url: "/lowversion/:ver",
        templateUrl: "templates/lowversion.html",
        controller: 'zmApp.LowVersionCtrl',

    })

    
    
    .state('events-graphs', {
        data: {
            requireLogin: true
        },
        url: "/events-graphs",
        templateUrl: "templates/events-graphs.html",
        controller: 'zmApp.EventsGraphsCtrl',
    })


    .state('events-date-time-filter', {
        data: {
            requireLogin: true
        },
        url: "/events-date-time-filter",
        templateUrl: "templates/events-date-time-filter.html",
        controller: 'zmApp.EventDateTimeFilterCtrl',
    })

    .state('state', {
        data: {
            requireLogin: true
        },
        url: "/state",
        templateUrl: "templates/state.html",
        controller: 'zmApp.StateCtrl',
    })

    .state('devoptions', {
        data: {
            requireLogin: true
        },
        url: "/devoptions",
        templateUrl: "templates/devoptions.html",
        controller: 'zmApp.DevOptionsCtrl',
    })

    .state('timeline', {
        data: {
            requireLogin: true
        },
        resolve: {
            message: function (ZMDataModel) {
                console.log("Inside app.events resolve");
                return ZMDataModel.getMonitors(0);
            }
        },
        url: "/timeline",
        templateUrl: "templates/timeline.html",
        controller: 'zmApp.TimelineCtrl',
    })


    .state('log', {
        data: {
            requireLogin: false
        },
        url: "/log",
        templateUrl: "templates/log.html",
        controller: 'zmApp.LogCtrl',
    })

    .state('zm-portal-login', {
        data: {
            requireLogin: false
        },
        url: "/zm-portal-login",
        templateUrl: "templates/zm-portal-login.html",
        controller: 'zmApp.PortalLoginCtrl',
    })

    .state('montage', {
        data: {
            requireLogin: true
        },
        resolve: {
            message: function (ZMDataModel) {
                console.log("Inside app.events resolve");
                return ZMDataModel.getMonitors(0);
            }

        },
        url: "/montage",
        templateUrl: "templates/montage.html",
        controller: 'zmApp.MontageCtrl',
        params: {
            minimal: false,
            isRefresh: false
        }

    });


    // if none of the above states are matched, use this as the fallback
    var defaultState = "/zm-portal-login";
    //var defaultState = "/login";
    // as it turns out I can't really inject a factory in config the normal way


    //$urlRouterProvider.otherwise(defaultState);

    // https://github.com/angular-ui/ui-router/issues/600
    // If I start using the urlRouterProvider above and the
    // first state is monitors it goes into a digest loop.

    $urlRouterProvider.otherwise(function ($injector, $location) {
        var $state = $injector.get("$state");
        $state.go("zm-portal-login");
    });

}); //config