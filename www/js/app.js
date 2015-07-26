/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */


var appVersion = "0.0.0";
// core app start stuff
angular.module('zmApp', [
                            'ionic',
                            'tc.chartjs',
                            'zmApp.controllers',
                            'fileLogger'
                            //'angularAwesomeSlider'
                        ])

// ------------------------------------------
// Various constants central repository
// Feel free to change them as you see fit
//-----------------------------------------------

.constant('zm', {
    httpTimeout:15000,
    largeHttpTimeout:60000,
    logFile:'zmNinjaLog.txt',
    authoremail:'pliablepixels+zmNinja@gmail.com',
    logFileMaxSize: 50000, // after this limit log gets reset
    loginInterval:300000, //5m*60s*1000 - ZM auto login after 5 mins
    loadingTimeout:15000,
    safeMontageLimit:10,
    maxFPS:30,
    defaultFPS:3,
    maxMontageQuality:70,
    defaultMontageQuality:50,
    progressIntervalCheck:5000, // used for progress indicator on event playback
    graphFillColor:'rgba(151,187,205,0.5)',
    graphStrokeColor: 'rgba(151,187,205,0.8)',
    graphHighlightFill: 'rgba(0,163,124,0.5)',
    monitorCheckingColor:'#03A9F4',
    monitorNotRunningColor: '#F44336',
    monitorPendingColor: '#FF9800',
    monitorRunningColor: '#4CAF50',
    monitorErrorColor: '#795548',
    montageScaleFrequency:300,
    eventsListDetailsHeight:200,
    eventsListScrubHeight:300



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
.directive('imageSpinnerSrc', ['$document',  '$compile',
    function ($document , $compile) {
        return {
            restrict: 'A',
            scope: {
                imageSpinnerBackgroundImage: "@imageSpinnerBackgroundImage"
            },
            link: function ($scope, $element, $attributes) {

                if ($attributes.imageSpinnerLoader) {
                    var loader = $compile('<div class="image-loader-container"><ion-spinner style="position:fixed;top:5%;left:5%" class="image-loader" icon="' + $attributes.imageSpinnerLoader + '"></ion-spinner></div>')($scope);
                    $element.after(loader);
                }
                            loadImage();

                function loadImage() {
                    $element.bind("load", function (e) {
                        if ($attributes.imageSpinnerLoader) {
                            loader.remove();
                        }
                    });

                    if ($scope.imageSpinnerBackgroundImage == "true") {
                        var bgImg = new Image();
                        bgImg.onload = function () {
                            if ($attributes.imageSpinnerLoader) {
                                loader.remove();
                            }
                            $element[0].style.backgroundImage = 'url(' + $attributes.imageSpinnerSrc + ')'; // set style attribute on element (it will load image)
                        };
                        bgImg.src = $attributes.imageSpinnerSrc;
                    } else {
                        $element[0].src = $attributes.imageSpinnerSrc; // set src attribute on element (it will load image)
                    }
                }

                function isInView() {
		    return true;
                }

                $element.on('$destroy', function () {
                });

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
.factory('timeoutHttpIntercept', function ($rootScope, $q,zm) {
    return {
        'request': function (config) {
            if ( !(config.url.indexOf("/api/states/change/") > -1 ||
                config.url.indexOf("getDiskPercent.json") > -1 ))
            {
               config.timeout = 15000;
            }
            else
            {
                //console.log ("HTTP INTERCEPT:Skipping HTTP timeout for "+config.url);
            }
            return config;
        }


    };
})

//-----------------------------------------------------------------
// This service automatically logs into ZM at periodic intervals
//------------------------------------------------------------------

.factory('zmAutoLogin', function($interval, ZMDataModel, $http,zm)  {
    var zmAutoLoginHandle;
    function doLogin()
    {
        console.log ("**** ZM AUTO LOGIN CALLED");
        ZMDataModel.zmLog("zmAutologin timer started");
        var loginData = ZMDataModel.getLogin();
        $http({
            method:'POST',
            url:loginData.url + '/index.php',
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded',
               'Accept': 'application/json',
            },
            transformRequest: function (obj) {
                var str = [];
                for (var p in obj)
                    str.push(encodeURIComponent(p) + "=" +
                        encodeURIComponent(obj[p]));
                var foo = str.join("&");
                //console.log("****RETURNING " + foo);
                return foo;
            },

            data: {
                username:loginData.username,
                password:loginData.password,
                action:"login",
                view:"console"
            }
        })
        .success(function(data)
        {
            console.log ("**** ZM Login OK");
            ZMDataModel.zmLog("zmAutologin successfully logged into Zoneminder");
        })
        .error(function(error)
        {
            console.log ("**** ZM Login FAILED");
            ZMDataModel.zmLog ("zmAutologin Error " + JSON.stringify(error), "error");
        });
    }

    function start()
    {
        $interval.cancel(zmAutoLoginHandle);
        doLogin();
        zmAutoLoginHandle = $interval(function()
        {
            doLogin();

        },zm.loginInterval); // Auto login every 5 minutes
                      // PHP timeout is around 10 minutes
                      // should be ok?
    }
    function stop()
    {
        $interval.cancel(zmAutoLoginHandle);
        ZMDataModel.zmLog("Cancelling zmAutologin timer");

    }

    return {
        start: start,
        stop: stop
    };
})

/* For future use - does not work with img src intercepts
.factory ('httpAuthIntercept', function ($rootScope, $q)
{
    return {
    requestError: function (response) {
      console.log ("**** REJECT REQUEST: "+JSON.stringify(response));
      return $q.reject(response);
    },

    responseError: function (response) {
      console.log ("**** REJECT RESPONSE: "+JSON.stringify(response));
      return $q.reject(response);
    },
    response: function (response)
        {
            console.log("*******RESPONSE with status: "+response.status+"****************");
            if (response.status == 500)
            {
             console.log ("**** RESPONSE: "+JSON.stringify(response));
            }
                return (response);
        }
  };
})
*/

//------------------------------------------------------------------
// First run in ionic
//------------------------------------------------------------------

.run(function ($ionicPlatform, $ionicPopup, $rootScope, zm, $state, ZMDataModel, $cordovaSplashscreen, $http, $interval, zmAutoLogin, $fileLogger,$timeout, $ionicHistory, $window, $ionicSideMenuDelegate)
{



    ZMDataModel.init();
    var loginData = ZMDataModel.getLogin();

    if (ZMDataModel.isLoggedIn()) {
        ZMDataModel.zmLog ("User is logged in");
        console.log("VALID CREDENTIALS. Grabbing Monitors");
        ZMDataModel.getMonitors(0);
        ZMDataModel.getKeyConfigParams(1);

    }

    // This code takes care of trapping the Android back button
    // and takes it to the menu. FIXME: For some reason, isOpen of Side
    // MenuDelegate always returns False, so I don't know
    // when its on or off, so can't exit the app if its on






    // this works reliably on both Android and iOS. The "onorientation" seems to reverse w/h in Android. Go figure.
    // http://stackoverflow.com/questions/1649086/detect-rotation-of-android-phone-in-the-browser-with-javascript

    var checkOrientation = function () {
        var pixelRatio = window.devicePixelRatio || 1;
        $rootScope.devWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width);
        $rootScope.devHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height);
        console.log("********NEW Computed Dev Width & Height as" + $rootScope.devWidth + "*" + $rootScope.devHeight);
        //ZMDataModel.zmLog("Device orientation change: "+$rootScope.devWidth + "*" + $rootScope.devHeight);
    };

    window.addEventListener("resize", checkOrientation, false);

    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
        var requireLogin = toState.data.requireLogin;

        if (ZMDataModel.isLoggedIn()) {
            console.log("State transition is authorized");
            return;
        }

        if (requireLogin) {

            console.log("**** STATE from " + "**** STATE TO " + toState.name);

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

        // generates and error in desktops but works fine
        ZMDataModel.zmLog("Device is ready");
        console.log("**** DEVICE READY ***");

        $fileLogger.checkFile().then(function(resp) {
            if (parseInt(resp.size) > zm.logFileMaxSize)
            {
                console.log ("Deleting old log file as it exceeds 50K bytes");
                $fileLogger.deleteLogfile().then(function()
                {
                console.log('Logfile deleted');
                });
            }
            else
            {
                console.log ("Log file size is " + resp.size + " bytes");
            }


        });

         //fileLogger is an excellent cross platform library
         // that allows you to manage log files without worrying about
        // paths etc.https://github.com/pbakondy/filelogger
         $fileLogger.setStorageFilename(zm.logFile);

         if (window.cordova)
         {
            // getAppVersion is a handy library
            // that lets you extract the app version in config.xml
            // given that you are always changing versions while
            // uploading to app/play stores, this is very useful
            // to keep in sync and use within your app

            cordova.getAppVersion(function(version) {
                appVersion = version;
                ZMDataModel.zmLog ("zmNinja Version: " + appVersion);
                ZMDataModel.setAppVersion(appVersion);
            });

         }

        /*setTimeout(function () {
            if (window.cordova)
            {
                $cordovaSplashscreen.hide();
            }
            }, 1500);*/

        if(window.navigator && window.navigator.splashscreen) {
            window.navigator.splashscreen.hide();
            console.log ("Unlocking portrait mode after splash");
            window.plugins.orientationLock.unlock();
   }

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
            console.log("****The application is resuming from the background");
            ZMDataModel.zmLog("App is resuming from background");
            $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
            //$scope.rand = Math.floor((Math.random() * 100000) + 1);
            console.log("** generated Random of " + $rootScope.rand);
            $state.go($state.current, {}, {
                reload: true
            });
            //$window.location.reload(true);
            //$route.reload();

            // This sort of solves the problem of inactive windows
            // if you switch the screen off and on
            // not ideal as reload removes the Modal and shows the view
            // but better than an inactive/unresponsive screen
            // FIXME: see if we can get the modal back
            $window.location.reload();
            zmAutoLogin.stop(); //safety
            zmAutoLogin.start();
        }, false);


        document.addEventListener("pause", function () {
            console.log("****The application is going into  background");
            ZMDataModel.zmLog("App is going into background");
             zmAutoLogin.stop();

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

    //console.log ("Setting up POST LOGIN timer");
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
    //$httpProvider.interceptors.push('httpAuthIntercept');


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
    /*
    .state('app', {
      url: '/',
      abstract: true,
      templateUrl: 'index.html',
      //controller: 'AppCtrl'
    })*/


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

    .state('events-graphs', {
        data: {
            requireLogin: true
        },
        url: "/events-graphs",
        templateUrl: "templates/events-graphs.html",
        controller: 'zmApp.EventsGraphsCtrl',
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

    .state('log', {
        data: {
            requireLogin: false
        },
        url: "/log",
        templateUrl: "templates/log.html",
        controller: 'zmApp.LogCtrl',
    })

    .state('montage', {
        data: {
            requireLogin: true
        },
        resolve: {
            message: function (ZMDataModel) {
                console.log("Inside app.montage resolve");
                return ZMDataModel.getMonitors(0);
            }
        },
        url: "/montage",
        templateUrl: "templates/montage.html",
        controller: 'zmApp.MontageCtrl',
        params: {minimal:false, isRefresh:false}

    });


    // if none of the above states are matched, use this as the fallback
    var defaultState = "/montage";
    //var defaultState = "/login";
    // as it turns out I can't really inject a factory in config the normal way


    //$urlRouterProvider.otherwise(defaultState);

    // https://github.com/angular-ui/ui-router/issues/600
    // If I start using the urlRouterProvider above and the
    // first state is monitors it goes into a digest loop.

    $urlRouterProvider.otherwise(function ($injector, $location) {
        var $state = $injector.get("$state");
        $state.go("montage");
    });

}); //config
