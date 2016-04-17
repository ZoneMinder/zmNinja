/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,alert,PushNotification, moment ,ionic, URI, $*/


var appVersion = "0.0.0";


// core app start stuff
angular.module('zmApp', [
                            'ionic',
                            'ion-datetime-picker',
                            'ngIOS9UIWebViewPatch',
                            'tc.chartjs',
                            'zmApp.controllers',
                            'fileLogger',
                            'angular-carousel',
                            'angularAwesomeSlider',
                            'com.2fdevs.videogular',
			                 'com.2fdevs.videogular.plugins.controls',
                            'com.2fdevs.videogular.plugins.overlayplay',
                            'ionic-native-transitions'
                            


                        ])

// ------------------------------------------
// Various constants central repository
// Feel free to change them as you see fit
//------------------------------------------------

.constant('zm', {
    minAppVersion: '1.28.107', // if ZM is less than this, the app won't work
    recommendedAppVersion: '1.29',
    minEventServerVersion: '0.7',
    alarmFlashTimer: 20000, // time to flash alarm
    gcmSenderId: '710936220256',
    httpTimeout: 15000,
    largeHttpTimeout: 60000,
    logFile: 'zmNinjaLog.txt',
    authoremail: 'pliablepixels+zmNinja@gmail.com',
    logFileMaxSize: 20000, // after this limit log gets reset
    loginInterval: 300000, //5m*60s*1000 - ZM auto login after 5 mins
    //loginInterval: 30000,
    updateCheckInterval: 86400000, // 24 hrs
    loadingTimeout: 15000,
    safeMontageLimit: 10,
    safeImageQuality: 10,
    maxFPS: 30,
    defaultFPS: 3,
    maxMontageQuality: 70,
    defaultMontageQuality: 50,
    progressIntervalCheck: 5000, // used for progress indicator on event playback
    graphFillColor: 'rgba(151,187,205,0.5)',
    graphStrokeColor: 'rgba(151,187,205,0.8)',
    graphHighlightFill: 'rgba(0,163,124,0.5)',
    graphItemMax: 2000,
    graphDesktopItemMax: 2000,
    monitorCheckingColor: '#03A9F4',
    monitorNotRunningColor: '#F44336',
    monitorPendingColor: '#FF9800',
    monitorRunningColor: '#4CAF50',
    monitorErrorColor: '#795548',
    montageScaleFrequency: 300,
    eventsListDetailsHeight: 200.0,
    eventsListScrubHeight: 300,
    loginScreenString: "var currentView = 'login'", // Isn't there a better way?
    desktopUrl: "/zm",
    desktopApiUrl: "/api/zm",
    latestRelease: "https://api.github.com/repos/pliablepixels/zmNinja/releases/latest",
    blogUrl:"http://pliablepixels.github.io/feed.json",
    nphSwitchTimer:6000,
    eventHistoryTimer:10000,
    eventPlaybackQuery:3000,
    
    

})


// this can be used to route img-src through interceptors. Works well, but when
// nph-zms streams images it doesn't work as success is never received 
// (keeps reading data). Hence not using it now
//credit: http://stackoverflow.com/questions/34958575/intercepting-img-src-via-http-interceptor-as-well-as-not-lose-the-ability-to-kee
.directive('httpSrc', [
        '$http', 'imageLoadingDataShare', 'ZMDataModel',
        function ($http, imageLoadingDataShare, ZMDataModel) {
        var directive = {
            link: postLink,
            restrict: 'A'
        };
        return directive;

        function postLink(scope, element, attrs) {
            //console.log ("HELLO NEW");
            var requestConfig = {
                method: 'GET',
                //url: attrs.httpSrc,
                responseType: 'arraybuffer',
                cache: 'true'
            };

            function base64Img(data) {
                var arr = new Uint8Array(data);
                var raw = '';
                var i, j, subArray, chunk = 5000;
                for (i = 0, j = arr.length; i < j; i += chunk) {
                    subArray = arr.subarray(i, i + chunk);
                    raw += String.fromCharCode.apply(null, subArray);
                }
                return btoa(raw);
            }
            attrs.$observe('httpSrc', function (newValue) {
                requestConfig.url = newValue;
                //console.log ("requestConfig is " + JSON.stringify(requestConfig));
                imageLoadingDataShare.set(1);
                $http(requestConfig)
                    .success(function (data) {
                        //console.log ("Inside HTTP after Calling " + requestConfig.url);
                        //console.log ("data got " + JSON.stringify(data));
                    
                       
                        var b64 = base64Img(data);
                        attrs.$set('src', "data:image/jpeg;base64," + b64);
                        imageLoadingDataShare.set(0);
                    });
            });

        }
    }
])


//------------------------------------------------------------------
// switch between collection repeat or ng-repeat
//-------------------------------------------------------------------
.directive('repeatsmart', function ($compile, $rootScope) {
    return {
        restrict: 'A',
        priority: 2000,
        terminal: true,
        link: function (scope, element) {
            var repeatDirective = ($rootScope.platformOS == 'desktop') ? 'ng-repeat' : 'collection-repeat';
            console.log ("*********** REPEAT SCROLL IS " + repeatDirective);

            element.attr(repeatDirective, element.attr('repeatsmart'));
            element.removeAttr('repeatsmart');
            $compile(element)(scope);
        }
    };
})


.directive('detectGestures', function($ionicGesture) {
  return {
    restrict :  'A',

    link : function(scope, elem, attrs) {
      var gestureType = attrs.gestureType;

      switch(gestureType) {
        case 'pinchin':
          $ionicGesture.on('pinchin', scope.reportEvent, elem);
          break;
      }

    }
  };
})

.directive('tooltip', function () {
    return {
        restrict: 'C',
        link: function (scope, element, attrs) {
            if (attrs.title) {
                var $element = $(element);
                $element.attr("title", attrs.title);
                $element.tooltipster({
                    animation: attrs.animation,
                    trigger: "click",
                    position: "right",
                    positionTracker: true,
                    maxWidth: 500,
                    contentAsHTML: true
                });
            }
        }
    };
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

//-------------------------------------------------------
// Ability to share controllers with modals
// Credit: http://codepen.io/julianpaulozzi/pen/wBgpjM
//-------------------------------------------------------

.factory('appModalService', 
['$ionicModal', '$rootScope', '$q', '$injector', '$controller', function($ionicModal, $rootScope, $q, $injector, $controller) {
    
  return {
    show: show
  };

  function show(templateUrl, controller, parameters, options) {
    // Grab the injector and create a new scope
    var deferred = $q.defer(),
        ctrlInstance,
        modalScope = $rootScope.$new(),
        thisScopeId = modalScope.$id,
        defaultOptions = {
          animation: 'slide-in-up',
          focusFirstInput: false,
          backdropClickToClose: true,
          hardwareBackButtonClose: true,
          modalCallback: null
        };

    options = angular.extend({}, defaultOptions, options);

    $ionicModal.fromTemplateUrl(templateUrl, {
      scope: modalScope,
      animation: options.animation,
      focusFirstInput: options.focusFirstInput,
      backdropClickToClose: options.backdropClickToClose,
      hardwareBackButtonClose: options.hardwareBackButtonClose
    }).then(function (modal) {
      modalScope.modal = modal;

      modalScope.openModal = function () {
        modalScope.modal.show();
      };
      modalScope.closeModal = function (result) {
        deferred.resolve(result);
        modalScope.modal.hide();
      };
      modalScope.$on('modal.hidden', function (thisModal) {
        if (thisModal.currentScope) {
          var modalScopeId = thisModal.currentScope.$id;
          if (thisScopeId === modalScopeId) {
            deferred.resolve(null);
            _cleanup(thisModal.currentScope);
          }
        }
      });

      // Invoke the controller
      var locals = { '$scope': modalScope, 'parameters': parameters };
      var ctrlEval = _evalController(controller);
      ctrlInstance = $controller(controller, locals);
      if (ctrlEval.isControllerAs) {
        ctrlInstance.openModal = modalScope.openModal;
        ctrlInstance.closeModal = modalScope.closeModal;
      }

      modalScope.modal.show()
        .then(function () {
        modalScope.$broadcast('modal.afterShow', modalScope.modal);
      });

      if (angular.isFunction(options.modalCallback)) {
        options.modalCallback(modal);
      }

    }, function (err) {
      deferred.reject(err);
    });

    return deferred.promise;
  }

  function _cleanup(scope) {
    scope.$destroy();
    if (scope.modal) {
      scope.modal.remove();
    }
  }

  function _evalController(ctrlName) {
    var result = {
      isControllerAs: false,
      controllerName: '',
      propName: ''
    };
    var fragments = (ctrlName || '').trim().split(/\s+/);
    result.isControllerAs = fragments.length === 3 && (fragments[1] || '').toLowerCase() === 'as';
    if (result.isControllerAs) {
      result.controllerName = fragments[0];
      result.propName = fragments[2];
    } else {
      result.controllerName = ctrlName;
    }

    return result;
  }
 
}])

//credit: https://github.com/driftyco/ionic/issues/3131
.factory('SecuredPopups', [
    '$ionicPopup',
    '$q',
    function ($ionicPopup, $q) {

        var firstDeferred = $q.defer();
        firstDeferred.resolve();

        var lastPopupPromise = firstDeferred.promise;

        // Change this var to true if you want that popups will automaticly close before opening another
        var closeAndOpen = false;

        return {
            'show': function (method, object) {
                var deferred = $q.defer();
                var closeMethod = null;
                deferred.promise.isOpen = false;
                deferred.promise.close = function () {
                    if (deferred.promise.isOpen && angular.isFunction(closeMethod)) {
                        closeMethod();
                    }
                };

                if (closeAndOpen && lastPopupPromise.isOpen) {
                    lastPopupPromise.close();
                }

                lastPopupPromise.then(function () {
                    deferred.promise.isOpen = true;
                    var popupInstance = $ionicPopup[method](object);

                    closeMethod = popupInstance.close;
                    popupInstance.then(function (res) {
                        deferred.promise.isOpen = false;
                        deferred.resolve(res);
                    });
                });

                lastPopupPromise = deferred.promise;

                return deferred.promise;
            }
        };
    }
])


//------------------------------------------------------------------
// this directive will be called any time an image completes loading 
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
.directive('imageSpinnerSrc', ['$document', '$compile', 'imageLoadingDataShare', '$timeout',
    function ($document, $compile, imageLoadingDataShare, $timeout) {
        return {
            restrict: 'A',
            scope: {
                imageSpinnerBackgroundImage: "@imageSpinnerBackgroundImage"
            },
            link: function ($scope, $element, $attributes) {

                if ($attributes.imageSpinnerLoader) {
                    var loader = $compile('<div class="image-loader-container"><ion-spinner style="position:fixed;top:5%;right:5%" class="image-loader" icon="' + $attributes.imageSpinnerLoader + '"></ion-spinner></div>')($scope);
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


                    var url = 'img/novideo.png';
                    $element.prop('src', url);
                    imageLoadingDataShare.set(0);
                });

                function waitForFrame1() {
                    ionic.DomUtil.requestAnimationFrame(
                        function () {
                            imageLoadingDataShare.set(0);
                            //console.log ("IMAGE LOADED");
                        });

                }

                function loadImage() {
                    $element.bind("load", function (e) {
                        if ($attributes.imageSpinnerLoader) {
                            //console.log ("DIRECTIVE: IMAGE LOADED");
                            loader.remove();
                            //imageLoadingDataShare.set(0);
                            //console.log ("rendered");

                            // lets wait for 2 frames for animation
                            // to render - hoping this will improve tear 
                            // of images
                            ionic.DomUtil.requestAnimationFrame(
                                function () {
                                    waitForFrame1();
                                });

                        }
                    });




                    if ($scope.imageSpinnerBackgroundImage == "true") {
                        var bgImg = new Image();
                        bgImg.onload = function () {
                            if ($attributes.imageSpinnerLoader) {
                                loader.remove();
                            }
                            // set style attribute on element (it will load image)
                            if (imageLoadingDataShare.get() != 1)

                                $element[0].style.backgroundImage = 'url(' + $attributes.imageSpinnerSrc + ')';

                            //$element[0].style.backgroundImage = 'url(' + 'img/novideo.png'+ ')';

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
.factory('timeoutHttpIntercept', ['$rootScope', '$q', 'zm', '$injector', function ($rootScope, $q, zm, $injector) {
    $rootScope.zmCookie = "";

    return {
        
       
        
        'request': function (config) {

            
            // handle basic auth properly
            if (config.url.indexOf("@") > -1)
            {
               //console.log ("HTTP basic auth INTERCEPTOR URL IS "  + config.url);
                var components = URI.parse(config.url);
               // console.log ("Parsed data is " + JSON.stringify(components));
                var credentials = btoa(components.userinfo);
                //var authorization = {'Authorization': 'Basic ' + credentials};
               //config.headers.Authorization = 'Basic ' + credentials;
                
               // console.log ("Full headers: " + JSON.stringify(config.headers));
                
            }
            

            if ($rootScope.zmCookie) {
                config.headers.Cookie = "ZMSESSID=" + $rootScope.zmCookie;
            }
            
            else
            {
              //  console.log ("No cookie present in " + config.url);
            }
            
            if ((config.url.indexOf("/api/states/change/") > -1) ||
                (config.url.indexOf("getDiskPercent.json") > -1) ||
                (config.url.indexOf("daemonCheck.json") > -1) ||
                (config.url.indexOf("getLoad.json") > -1))


            {
                // these can take time, so lets bump up timeout
                config.timeout = zm.largeHttpTimeout;

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
                            
                       // console.log ("***** SETTING COOKIE TO "  + zmCookie);
                        $rootScope.zmCookie = zmSess[1];
                    }
                }
            }
            
            //console.log ("HTTP response");
            return response;
        }


    };
}])


//-----------------------------------------------------------------
// This service automatically checks for new versions every 24 hrs
//------------------------------------------------------------------
.factory('zmCheckUpdates', function ($interval, $http, zm, $timeout, $localstorage, ZMDataModel, $rootScope) {
    var zmUpdateHandle;
    var zmUpdateVersion = "";

    function start() {
        checkUpdate();
        $interval.cancel(zmUpdateHandle);
        zmUpdateHandle = $interval(function () {
            checkUpdate();

        }, zm.updateCheckInterval);


        function checkUpdate() {
            var lastdateString = $localstorage.get("lastUpdateCheck");
            var lastdate;
            if (!lastdateString) {

                lastdate = moment().subtract(2, 'day');

            } else {
                lastdate = moment(lastdateString);
            }
            var timdiff = moment().diff(lastdate, 'hours');
            if (timdiff < 24) {
                ZMDataModel.zmLog("Checked for update " + timdiff + " hours ago. Not checking again");

                return;
            }
            ZMDataModel.zmLog("Checking for new version updates...");


            $http.get(zm.latestRelease)
                .then(function (success) {


                    $localstorage.set("lastUpdateCheck", moment().toISOString());
                    //console.log ("FULL STRING " + success.data.tag_name);
                    var res = success.data.tag_name.match("v(.*)");
                    zmUpdateVersion = res[1];
                    var currentVersion = ZMDataModel.getAppVersion();
                    if ($rootScope.platformOS == "desktop") {
                        zmUpdateVersion = zmUpdateVersion + "D";
                    }
                    if (ZMDataModel.getAppVersion() != zmUpdateVersion) {
                        $rootScope.newVersionAvailable = "v" + zmUpdateVersion + " available";
                    } else {
                        $rootScope.newVersionAvailable = "";
                    }
                    //console.log ("UPDATE " + zmVersion);
                });
            
            ZMDataModel.zmLog ("Checking for news updates");
            $http.get(zm.blogUrl)
            .success (function (data) {
                $rootScope.newBlogPost = "";
                if (data.length <=0) 
                {
                    $rootScope.newBlogPost="";
                    return;
                }
                
                var lastDate = $localstorage.get("latestBlogPostChecked");
                if (!lastDate)
                {
                    
                    $rootScope.newBlogPost="(new post)";
                    return;
                }
                
                 var mLastDate = moment(lastDate);
                 var mItemDate = moment(data[0].date);
                
                if (mItemDate.diff(mLastDate) >0)
                {
                    ZMDataModel.zmDebug("New post dated " + data[0].date + " found");
                    if (data[0].level == "critical" )
                    {
                        $rootScope.newBlogPost = "(new post)";
                    }
                    else
                    {
                        ZMDataModel.zmDebug ("Not showing a notification in menu as this is not critical");
                    }
                }
                else
                {
                    ZMDataModel.zmDebug("Latest post dated " + data[0].date + " but you read " + lastDate);
                }
                
                
            });

        }
    }

    function getLatestUpdateVersion() {
        return (zmUpdateVersion == "") ? "(unknown)" : zmUpdateVersion;
    }

    return {
        start: start,
        getLatestUpdateVersion: getLatestUpdateVersion
            //stop: stop,

    };


})



//-----------------------------------------------------------------
// This service automatically logs into ZM at periodic intervals
//------------------------------------------------------------------

.factory('zmAutoLogin', function ($interval, ZMDataModel, $http, zm, $browser, $timeout, $q, $rootScope, $ionicLoading, $ionicPopup, $state, $ionicContentBanner, EventServer, $ionicHistory) {
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


    $rootScope.getProfileName = function()
    {
        var ld = ZMDataModel.getLogin();
        return (ld.serverName || '(none)');
    };

    //------------------------------------------------------------------
    // doLogin() is the function that tries to login to ZM
    // it also makes sure we are not back to the same page
    // which actually means auth failed, but ZM treats it as a success
    //------------------------------------------------------------------

    function doLogin(str) {
        
        
        
        var d = $q.defer();
        
          var statename = $ionicHistory.currentStateName();

            if (statename == "montage-history")
            {
                ZMDataModel.zmLog ("Skipping login process as we are in montage history. Re-logging will mess up the stream");
                d.resolve("success");
                return d.promise;
                
            }
        
        ZMDataModel.zmDebug ("Resetting zmCookie...");
        $rootScope.zmCookie='';
        // first try to login, if it works, good
        // else try to do reachability
        proceedWithLogin()
        .then (function (success)
               {
                    d.resolve (success);
                    return d.promise;
               },
               function (error)
               // login to main failed, so try others
               {
                    ZMDataModel.getReachableConfig(true)
                    .then (function (data)
                    {
                        proceedWithLogin()
                        .then (function(success)
                           { d.resolve(success); return d.promise;},
                           function(error)
                           {  d.reject(error); return d.promise;});
                        
                    },
                    function (error)
                    {
                        d.reject(error); return d.promise;
                    });
                        
                });
        
        /*ZMDataModel.getReachableConfig()
        .then (function (data)
               {
                    ZMDataModel.zmLog ("REACHABILITY SUCCESS " + JSON.stringify(data));
                    proceedWithLogin()
                    .then (function(success)
                           { d.resolve(success); return d.promise;},
                           function(error)
                           {  d.reject(error); return d.promise;});
                   
               },
               function (error)
               {
                    ZMDataModel.zmLog ("REACHABILITY ERROR " + JSON.stringify(error));
                    ZMDataModel.zmLog ("Still trying to proceed with " + ZMDataModel.getLogin().serverName);
                    
                    proceedWithLogin()
                    .then (function(success)
                           { d.resolve(success); return d.promise;},
                           function(error)
                           {  d.reject(error); return d.promise;});
                   
                    
               });*/
        return d.promise;
        
               
        function proceedWithLogin()
        {
                // recompute rand anyway so even if you don't have auth
            // your stream should not get frozen
            $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
            $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);

          

           // console.log ("***** STATENAME IS " + statename);

            var d = $q.defer();
            var ld = ZMDataModel.getLogin();
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

                        d.reject ("Error-disable recaptcha");
                    return (d.promise);
                    }



                });



            var loginData = ZMDataModel.getLogin();
            //ZMDataModel.zmDebug ("*** AUTH LOGIN URL IS " + loginData.url);
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

                    } else //  this means login error
                    {
                        $rootScope.loggedIntoZm = -1;
                        //console.log("**** ZM Login FAILED");
                        ZMDataModel.zmLog("zmAutologin Error: Bad Credentials ", "error");
                        $rootScope.$emit('auth-error', "incorrect credentials");

                        d.reject("Login Error");
                        return (d.promise);
                    }

                    // Now go ahead and re-get auth key 
                    // if login was a success
                    $rootScope.authSession = "undefined";
                    var ld = ZMDataModel.getLogin();
                    ZMDataModel.getAuthKey($rootScope.validMonitorId)
                        .then(function (success) {

                                //console.log(success);
                                $rootScope.authSession = success;
                                ZMDataModel.zmLog("Stream authentication construction: " +
                                    $rootScope.authSession);

                            },
                            function (error) {
                                //console.log(error);

                                ZMDataModel.zmLog("Modal: Error returned Stream authentication construction. Retaining old value of: " + $rootScope.authSession);
                                ZMDataModel.zmDebug("Error was: " + JSON.stringify(error));
                            });

                    return (d.promise);

                })
                .error(function (error, status) {
                    $ionicLoading.hide();

                    //console.log("**** ZM Login FAILED");

                    // FIXME: Is this sometimes results in null

                    ZMDataModel.zmLog("zmAutologin Error " + JSON.stringify(error) +  " and status " + status);
                    // bad urls etc come here
                    $rootScope.loggedIntoZm = -1;    
                    $rootScope.$emit('auth-error', error);

                    d.reject("Login Error");
                    return d.promise;
                });
            return d.promise;
        }
        

    }

    function start() {
        var ld = ZMDataModel.getLogin();
        // lets keep this timer irrespective of auth or no auth
            $rootScope.loggedIntoZm = 0;
            $interval.cancel(zmAutoLoginHandle);
            //doLogin();
            zmAutoLoginHandle = $interval(function () {
                doLogin("");

            }, zm.loginInterval); // Auto login every 5 minutes
            // PHP timeout is around 10 minutes
            // should be ok?
       
    }

    function stop() {
        var ld = ZMDataModel.getLogin();
       
            $interval.cancel(zmAutoLoginHandle);
            $rootScope.loggedIntoZm = 0;
            ZMDataModel.zmLog("Cancelling zmAutologin timer");
        
    }

    return {
        start: start,
        stop: stop,
        doLogin: doLogin
    };
})


//====================================================================
// First run in ionic
//====================================================================


.run(function ($ionicPlatform, $ionicPopup, $rootScope, zm, $state, $stateParams, ZMDataModel, $cordovaSplashscreen, $http, $interval, zmAutoLogin, zmCheckUpdates, $fileLogger, $timeout, $ionicHistory, $window, $ionicSideMenuDelegate, EventServer, $ionicContentBanner, $ionicLoading, $ionicNativeTransitions) {



        $rootScope.zmGlobalCookie = "";
        $rootScope.isEventFilterOn = false;
        $rootScope.fromDate = "";
        $rootScope.fromTime = "";
        $rootScope.toDate = "";
        $rootScope.toTime = "";
        $rootScope.fromString = "";
        $rootScope.toString = "";
        $rootScope.loggedIntoZm = 0;
        $rootScope.apnsToken = '';
        $rootScope.tappedNotification = 0;
        //var eventsToDisplay=[];
        $rootScope.alarmCount = "0";
        $rootScope.platformOS = "desktop";
        $rootScope.currentServerGroup = "defaultServer";
        $rootScope.validMonitorId = "";
        $rootScope.newVersionAvailable = "";
        $rootScope.userCancelledAuth = false;
        $rootScope.online = true;
        $rootScope.showBlog = false;
        $rootScope.newBlogPost="";
        //$rootScope.minAlarmCount = "1";


        // only for android
        $rootScope.exitApp = function () {
            ZMDataModel.zmLog("user exited app");
            ionic.Platform.exitApp();
        };


        // This is a global exception interceptor
        $rootScope.exceptionMessage = function (error) {
            ZMDataModel.zmDebug("**EXCEPTION**" + error.reason + " caused by " + error.cause);
        };

        // register callbacks for online/offline
        // lets see if it really works
        $rootScope.online = navigator.onLine;
        $window.addEventListener("offline", function () {
            $rootScope.$apply(function () {
                $rootScope.online = false;
                ZMDataModel.zmLog("Your network went offline");
            });
        }, false);
        $window.addEventListener("online", function () {
            $rootScope.$apply(function () {
                $rootScope.online = true;
                ZMDataModel.zmLog("Your network is online, re-authenticating");
                zmAutoLogin.doLogin("re-authenticating");

            });
        }, false);

        // This code takes care of trapping the Android back button
        // and takes it to the menu.
        $ionicPlatform.registerBackButtonAction(function (e) {
            e.preventDefault();
            if (!$ionicSideMenuDelegate.isOpenLeft()) {
                $ionicSideMenuDelegate.toggleLeft();
               //console.log("Status of SIDE MENU IS : " + $ionicSideMenuDelegate.isOpen());
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
            //console.log("********NEW Computed Dev Width & Height as" + $rootScope.devWidth + "*" + $rootScope.devHeight);


        };

        window.addEventListener("resize", checkOrientation, false);


        // we come here when a user forcibly cancels portal auth
        // useful when you know your auth won't succeed and you need to 
        // switch to another server
        $rootScope.cancelAuth = function () {
            $ionicLoading.hide();
            ZMDataModel.zmLog("User cancelled login");
            $ionicHistory.nextViewOptions({
                disableAnimate: true,
                disableBack: true
            });
            $rootScope.userCancelledAuth = true;
            $state.go("login");

        };

        //---------------------------------------------------------------------------
        // authorize state transitions
        //----------------------------------------------------------------------------

        $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
            var requireLogin = toState.data.requireLogin;

            if (ZMDataModel.isLoggedIn()) {
                //console.log("State transition is authorized");

                return;
            } else {
                ZMDataModel.zmLog("Not logged in, requested to go to " + JSON.stringify(toState));
                // event.preventDefault();
                // $state.transitionTo('login');


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

            return;

        });


        //---------------------------------------------------------------------
        // called when device is ready
        //---------------------------------------------------------------------

        $ionicPlatform.ready(function () {
            
            
           $ionicNativeTransitions.enable(true, false);
            
                if (window.cordova) {
                    $cordovaSplashscreen.hide();
                }
          
            
            $rootScope.platformOS = "desktop";




            ZMDataModel.zmLog("Device is ready");
            var ld = ZMDataModel.getLogin();

            if ($ionicPlatform.is('ios'))
                $rootScope.platformOS = "ios";


            if ($ionicPlatform.is('android'))
                $rootScope.platformOS = "android";

            ZMDataModel.zmLog("You are running on " + $rootScope.platformOS);

            ZMDataModel.init();
            EventServer.init();
            //if ($rootScope.platformOS == "desktop")
            zmCheckUpdates.start();
            // for making sure we canuse $state.go with ng-click
            // needed for views that use popovers
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;

            // var loginData = ZMDataModel.getLogin();



            $fileLogger.checkFile().then(function (resp) {
                if (parseInt(resp.size) > zm.logFileMaxSize) {

                    $fileLogger.deleteLogfile().then(function () {
                        ZMDataModel.zmLog('Logfile deleted');

                    });
                } else {
                    //console.log("Log file size is " + resp.size + " bytes");
                }


            });



            //fileLogger is an excellent cross platform library
            // that allows you to manage log files without worrying about
            // paths etc.https://github.com/pbakondy/filelogger
            $fileLogger.setStorageFilename(zm.logFile);
            // easier tz reading
           // $fileLogger.setTimestampFormat('medium');
            $fileLogger.setTimestampFormat('MMM d, y '+ZMDataModel.getTimeFormat());

            ZMDataModel.zmLog("Deleting old log file as it exceeds " + zm.logFileMaxSize + " bytes");

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

            

            /*if(window.navigator && window.navigator.splashscreen) {
                window.navigator.splashscreen.hide();
                console.log ("Unlocking portrait mode after splash");
                window.plugins.orientationLock.unlock();
            }*/

            var pixelRatio = window.devicePixelRatio || 1;
            $rootScope.devWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width);
            $rootScope.devHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height);

            //console.log("********Computed Dev Width & Height as" + $rootScope.devWidth + "*" +
               // $rootScope.devHeight);

            // What I noticed is when I moved the app to the device
            // the montage screens were not redrawn after resuming from background mode
            // Everything was fine if I switched back to the montage screen
            // so as a global hack I'm just reloading the current state if you switch
            // from foreground to background and back
            document.addEventListener("resume", function () {
                ZMDataModel.zmLog("App is resuming from background");
                var forceDelay = ZMDataModel.getLogin().resumeDelay;
                ZMDataModel.zmLog (">>> Resume delayed for " + forceDelay + " ms, to wait for network stack...");
                
                $timeout (function () {
                    var ld = ZMDataModel.getLogin();


                    ZMDataModel.setBackground(false);
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

                        if ($rootScope.lastState == "zm-portal-login") {
                            ZMDataModel.zmDebug("Last state was portal-login, so forcing montage");
                            $rootScope.lastState = "montage";
                        }

                        ZMDataModel.zmDebug ("going to portal login");
                        $state.go("zm-portal-login");
                    } else {
                        $rootScope.lastState = "";
                        $rootScope.lastStateParam = "";
                        ZMDataModel.zmDebug ("reset lastState to null");
                    }
                }, forceDelay);
                
                
                //$ionicSideMenuDelegate.toggleLeft(false);
                //ZMDataModel.validatePin()

            }, false);


            document.addEventListener("pause", function () {
                ZMDataModel.setBackground(true);
                ZMDataModel.setJustResumed(true); // used for window stop
            
                ZMDataModel.zmLog("ROOT APP:App is going into background");
                
                $interval.cancel($rootScope.eventQueryInterval);
                $interval.cancel($rootScope.intervalHandle);

                
                ZMDataModel.zmLog("ROOT APP: Stopping network pull...");
                window.stop(); // dont call stopNetwork - we need to stop here 
            
                
                var ld = ZMDataModel.getLogin();
                
                if (ld.exitOnSleep && $rootScope.platformOS == "android")
                {
                    ZMDataModel.zmLog("user exited app");
                    ionic.Platform.exitApp();   
                }
                
                

                zmAutoLogin.stop();
                if ($rootScope.zmPopup)
                    $rootScope.zmPopup.close();
                
                
                
                
                //$ionicPopup.close();
                
                
               /* if ($rootScope.platformOS == 'android')
                {
                    ZMDataModel.zmLog("Android detected - calling stop");
                    window.stop();
                    //ionic.Platform.exitApp();
                }*/
            }, false);


            if (window.cordova && window.cordova.plugins.Keyboard) {
                //cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                // solves screen bouncing on form input
                // since I am using JS Scroll
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }

            // lets POST so we get a session ID right hre

            ZMDataModel.zmLog("Setting up POST LOGIN timer");
            zmAutoLogin.start();


        }); //platformReady

    }) //run

//------------------------------------------------------------------
// Route configuration
//------------------------------------------------------------------

// My route map connecting menu options to their respective templates and controllers
.config(function ($stateProvider, $urlRouterProvider, $httpProvider, $ionicConfigProvider, $provide,$compileProvider, $ionicNativeTransitionsProvider) {


    // This is an exception interceptor so it can show up in app logs 
    // if they occur. I suspect digest and other errors will be useful
    // for me to see

    $provide.decorator("$exceptionHandler", ['$delegate', '$injector', function ($delegate, $injector) {
        return function (exception, cause) {


            var $rootScope = $injector.get("$rootScope");
            $rootScope.exceptionMessage({
                reason: exception,
                cause: cause
            });

            $delegate(exception, cause);

        };
    }]);

    // If you do this, Allow Origin can't be *
    //$httpProvider.defaults.withCredentials = true;
    $httpProvider.interceptors.push('timeoutHttpIntercept');
    $ionicConfigProvider.navBar.alignTitle('center');
    // use overflow-scroll=false in ion-content
    // removing it here doesn't allow you to enable it per view
    // so it messes up scrolldelegate zoom and possibly others
    //$ionicConfigProvider.scrolling.jsScrolling(false);
    $compileProvider.debugInfoEnabled(false);
    
     $ionicNativeTransitionsProvider.setDefaultOptions({
         duration: 250,
     });
    

    $stateProvider
    .state('app', {
        url: '/',
        abstract: true,
        templateUrl: 'index.html',
        cache: false,
        
        //controller: 'AppCtrl'
    })

    
    
        .state('login', {
            data: {
                requireLogin: false
            },
            url: "/login",
            templateUrl: "templates/login.html",
            controller: 'zmApp.LoginCtrl',
        
        })

   
    .state('help', {
            data: {
                requireLogin: false
            },
            url: "/help",
            templateUrl: "templates/help.html",
            controller: 'zmApp.HelpCtrl',
       
    })
    
    .state('news', {
            data: {
                requireLogin: false
            },
            url: "/news",
            templateUrl: "templates/news.html",
            controller: 'zmApp.NewsCtrl',
        
    })

    

    .state('monitors', {
        data: {
            requireLogin: true
        },
        resolve: {
            message: function (ZMDataModel) {
               // console.log("Inside app.montage resolve");
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
                //console.log("Inside app.events resolve");
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
    
    .state('importantmessage', {
        data: {
            requireLogin: false
        },

        url: "/importantmessage/:ver",
        templateUrl: "templates/important_message.html",
        controller: 'zmApp.ImportantMessageCtrl',
        

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
                //console.log("Inside app.events resolve");
                return ZMDataModel.getMonitors(0);
            }
        },
        url: "/timeline",
        templateUrl: "templates/timeline.html",
        controller: 'zmApp.TimelineCtrl',
        
    })

    .state('eventserversettings', {
        data: {
            requireLogin: true
        },
        resolve: {
            message: function (ZMDataModel) {
                return ZMDataModel.getMonitors(0);
            }
        },
        url: "/eventserversettings",
        templateUrl: "templates/eventserversettings.html",
        controller: 'zmApp.EventServerSettingsCtrl',
        
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

    .state('first-use', {
        data: {
            requireLogin: false
        },
        url: "/first-use",
        templateUrl: "templates/first-use.html",
        controller: 'zmApp.FirstUseCtrl',
        
    })
    
    .state('montage-history', {
        data: {
            requireLogin: true
        },
        resolve: {
            message: function (ZMDataModel) {
                //console.log("Inside app.events resolve");
                return ZMDataModel.getMonitors(0);
            }

        },
        url: "/montage-history",
        templateUrl: "templates/montage-history.html",
        controller: 'zmApp.MontageHistoryCtrl',
        params: {
            minimal: false,
            isRefresh: false
        },
        

    })

    .state('montage', {
        data: {
            requireLogin: true
        },
        resolve: {
            message: function (ZMDataModel) {
                //console.log("Inside app.events resolve");
                return ZMDataModel.getMonitors(0);
            }

        },
        url: "/montage",
        templateUrl: "templates/montage.html",
        controller: 'zmApp.MontageCtrl',
        params: {
            minimal: false,
            isRefresh: false
        },
        

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