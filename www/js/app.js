/* jshint -W041, -W093 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,alert,PushNotification, moment ,ionic, URI,Packery, ConnectSDK, CryptoJS, ContactFindOptions, localforage,$, Connection, MobileAccessibility, hello */



// core app start stuff
angular.module('zmApp', [
    'ionic',
    'ion-datetime-picker',
    'ngIOS9UIWebViewPatch',
    'zmApp.controllers',
    'fileLogger',
    'angular-carousel',
    'angularAwesomeSlider',
    'com.2fdevs.videogular', 
    'com.2fdevs.videogular.plugins.controls',
    'com.2fdevs.videogular.plugins.overlayplay',
    'mgo-angular-wizard',
    'pascalprecht.translate',
    'uk.ac.soton.ecs.videogular.plugins.cuepoints',
    'dcbImgFallback',
    'angular-websocket',
    'ngCookies',


  ])

  // ------------------------------------------
  // Various constants central repository
  // Feel free to change them as you see fit
  //------------------------------------------------

  .constant('zm', {
    minAppVersion: '1.28.107', // if ZM is less than this, the app won't work
    //minAppVersion:'1.44',
    minEventServerVersion: '6.0',
    castAppId: 'BA30FB4C',
    alarmFlashTimer: 20000, // time to flash alarm
    gcmSenderId: '710936220256',
    httpTimeout: 10000,
    largeHttpTimeout: 30000,
    logFile: 'zmNinjaLog.txt',
    authoremail: 'pliablepixels+zmNinja@gmail.com',
    logFileMaxSize: 100000, // after this limit log gets reset

    updateCheckInterval: 86400000, // 24 hrs
    loadingTimeout: 15000,
    slowLoadingTimeout: 60000,
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
    eventsListDetailsHeight: 230.0,
    eventsListScrubHeight: 330,
    loginScreenString1: "var currentView = 'console'", // Isn't there a better way?
    loginScreenString2: "var currentView = 'console'",
    desktopUrl: "/zm",
    desktopApiUrl: "/api/zm",
    latestRelease: "https://api.github.com/repos/pliablepixels/zmNinja/releases/latest",
    blogUrl: "https://medium.com/zmninja/latest?format=json",
    nphSwitchTimer: 3000,
    eventHistoryTimer: 5000,
    eventPlaybackQuery: 3000,
    eventPageRefresh: 30000, // 30s
    packeryTimer: 500,
    dbName: 'zmninja',
    cipherKey: 'sdf#@#%FSXSA_AR',
    minCycleTime: 5,

    loginInterval: 1800000, //30m*60s*1000 - ZM auto login after 30 mins
    //loginInterval: 20000, // testing 20sec
    loginIntervalLowBW: 1800000, //30m login
    eventPlaybackQueryLowBW: 6000,

    eventSingleImageQualityLowBW: 70,
    monSingleImageQualityLowBW: 70,
    montageQualityLowBW: 50,
    eventMontageQualityLowBW: 50,
    maxGifCount: 60,
    maxGifCount2: 100,
    maxGifWidth: 800.0,
    quantSample: 15,
    forceMontageReloadDelay: 4500000, // 1 hr 15m,
    //forceMontageReloadDelay: 10000, // testing 10s
    thumbWidth: 200,
    alarmStatusTime: 10000, // 10 sec
    streamQueryStatusTime: 10000, //10 sec
    streamQueryStatusTimeLowBW: 30000, // 30 sec
    eventCheckTime: 30000, // 30 seconds
    eventServerErrorDelay: 5000, // time to wait till I report initial connect errors
    zmVersionCheckNag: 60 * 24, // in hrs 
    waitTimeTillResume: 5, // in sec, for ES error
    versionWithLoginAPI: "1.31.47",
    androidBackupKey: "AEdPqrEAAAAIqF-OaHdwIzZhx2L1WOfAGTagBxm5a1R4wBW_Uw",
    accessTokenLeewayMin: 5,
    refreshTokenLeewayMin: 10,
   // defaultAccessTokenExpiresMs: 30000
   // defaultAccessTokenExpiresMs: 1800000 // half of 3600s

  })

  // to take care of electron changing
  // window title and going out of sync
  // seems to get stuck in mobile
  .controller('zmApp.appCtrl', function ($scope, $rootScope) {
    $scope.$on('$ionicView.afterEnter', function (ev, data) {
      if ($rootScope.platformOS == 'desktop') ev.stopPropagation();
    });
  })

  //http://stackoverflow.com/a/24519069/1361529
  .filter('trusted', ['$sce', function ($sce) {
    return function (url) {
      return $sce.trustAsResourceUrl(url);
    };
  }])


  // for events view
  .filter('eventListFilter', function (NVR) {
    return function (input) {
      var ld = NVR.getLogin();
      var out = [];
      angular.forEach(input, function (item) {
        if (item.Event.Archived == '0' || !ld.hideArchived) {
          out.push(item);
        }
      });
      return out;
    };

  })


  // filter for montage iteration
  .filter('onlyEnabledMoments', function () {

    // Create the return function and set the required parameter name to **input**
    return function (input) {

      var out = [];

      angular.forEach(input, function (item) {

        if (!item.Event.hide) {
          out.push(item);
        }

      });

      return out;

    };
  })

  // filter for montage iteration
  .filter('onlyEnabled', function () {

    // Create the return function and set the required parameter name to **input**
    return function (input) {

      var out = [];

      angular.forEach(input, function (item) {

        if ((item.Monitor.Function != 'None') &&
          (item.Monitor.Enabled != '0')
        ) {
          out.push(item);
        }

      });

      return out;
    };

  })

  // filter for EH iteration
  .filter('onlyEnabledAndEventHas', function () {

    // Create the return function and set the required parameter name to **input**
    return function (input) {

      var out = [];

      angular.forEach(input, function (item) {

        if ((item.Monitor.Function != 'None') && (item.Monitor.Enabled != '0') && (item.Monitor.eventUrl != 'img/noimage.png') && (item.Monitor.listDisplay != 'noshow')) {
          out.push(item);
        }

      });

      return out;
    };

  })




  //credit: http://stackoverflow.com/a/23931217/1361529
  .directive('hidepassword', function () {

    var modelSet = function (str) {

      return str;
    };

    var viewSet = function (str) {
      //https://github.com/garycourt/uri-js
      if (!str) return str;
      var c = URI.parse(str);
      //if (c.userinfo) c.userinfo="***:***";
      if (c.userinfo) c.userinfo = "\u2022\u2022\u2022:\u2022\u2022\u2022";

      var ostr = "";
      if (c.scheme) ostr = ostr + c.scheme + "://";
      if (c.userinfo) ostr = ostr + c.userinfo + "@";
      if (c.host) ostr = ostr + c.host;
      if (c.port) ostr = ostr + ":" + c.port;
      if (c.path) ostr = ostr + c.path;
      if (c.query) ostr = ostr + c.query;
      if (c.fragment) ostr = ostr + c.fragment;

      return ostr;
    };

    return {

      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attr, ngModel) {
        ngModel.$parsers.push(modelSet);
        ngModel.$formatters.push(viewSet);

        element.bind('blur', function () {
          element.val(viewSet(ngModel.$modelValue));
        });
        element.bind('focus', function () {
          element.val(ngModel.$modelValue);
        });

      }
    };
  })


  // credit https://gist.github.com/Zren/beaafd64f395e23f4604

  .directive('mouseWheelScroll', function ($timeout) {
    return {
      restrict: 'A',
      link: function ($scope, $element, $attrs) {
        var onMouseWheel, scrollCtrl;
        scrollCtrl = $element.controller('$ionicScroll');
        //console.log(scrollCtrl);
        if (!scrollCtrl) {
          return console.error('mouseWheelScroll must be attached to a $ionicScroll controller.');
        }
        onMouseWheel = function (e) {
          return scrollCtrl.scrollBy(0, -e.wheelDeltaY, false);
        };
        return scrollCtrl.element.addEventListener('wheel', onMouseWheel);
      }
    };
  })

  // this can be used to route img-src through interceptors. Works well, but when
  // nph-zms streams images it doesn't work as success is never received 
  // (keeps reading data). Hence not using it now
  //credit: http://stackoverflow.com/questions/34958575/intercepting-img-src-via-http-interceptor-as-well-as-not-lose-the-ability-to-kee
  .directive('httpSrc', [
    '$http', 'imageLoadingDataShare', 'NVR',
    function ($http, imageLoadingDataShare, NVR) {
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
            .then(function (data) {
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
        //console.log("*********** REPEAT SCROLL IS " + repeatDirective);

        element.attr(repeatDirective, element.attr('repeatsmart'));
        element.removeAttr('repeatsmart');
        $compile(element)(scope);
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

  /*.factory('qHttp', function($q, $http) {
      //credit: http://stackoverflow.com/a/29719693
        var queue = $q.when();

        return function queuedHttp(httpConf) {
          var f = function(data) {
            return $http(httpConf);
          };
          return queue = queue.then(f, f);
        };
  })*/

  //credit: http://stackoverflow.com/a/14468276
  .factory('qHttp', function ($q, $http) {

    var queue = [];
    var execNext = function () {
      var task = queue[0];
      //console.log ("qHTTP>>> Executing:"+JSON.stringify(task.c)+">>> pending:"+queue.length);

      $http(task.c).then(function (data) {
        queue.shift();
        task.d.resolve(data);
        if (queue.length > 0) execNext();
      }, function (err) {
        queue.shift();
        task.d.reject(err);
        if (queue.length > 0) execNext();
      });
    };
    return function (config) {
      var d = $q.defer();
      //config.headers.push({'X-qHttp':'enabled'});
      queue.push({
        c: config,
        d: d
      });
      if (queue.length === 1) {
        execNext();
      }
      //else
      //console.log ("qHTTP>>> Queuing:"+JSON.stringify(config));
      return d.promise;
    };
  })

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
  .directive('imageSpinnerSrc', ['$document', '$compile', 'imageLoadingDataShare', '$timeout', '$parse', 'NVR', '$rootScope',
    function ($document, $compile, imageLoadingDataShare, $timeout, $parse, NVR,  $rootScope) {
      return {
        restrict: 'A',
        scope: {
          imageSpinnerBackgroundImage: "@imageSpinnerBackgroundImage",
          imageOnError: '&'
        },
        link: function ($scope, $element, $attributes) {

          /*if ($attributes.imageSpinnerLoader) {
              var loader = $compile('<div class="image-loader-container"><ion-spinner  class="image-loader" icon="' + $attributes.imageSpinnerLoader + '"></ion-spinner></div>')($scope);
              $element.after(loader);
          }*/

          if ($attributes.imageSpinnerLoader) {
            var loader = $compile('<div class="image-loader-container"><ion-spinner  class="image-loader" icon="' + 'bubbles' + '"></ion-spinner></div>')($scope);
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
           
            loader.remove();


            var url = 'img/noimage.png';


            var w = $attributes.imgSpinnerW;
            var h = $attributes.imgSpinnerH;

            /*   $element.css({
                //width: w+'px',
               // height: h+'px',
                 display: ($attributes.imgSpinnerW && $attributes.imgSpinnerH? 'inline-block' : null),
                 background:'red',
                 objectFit: 'fill'
             });*/


            // console.log ("**********"+w+"X"+h);
            //  var hurl = "holder.js/2000x$2000?auto=yes&theme=sky&text=...";

            $attributes.$set('data-src', 'holder.js/' + w + 'x' + h + '?auto=yes&theme=industrial&text=...');
            Holder.run({
              images: $element[0],
              nocss: false
            });

            // $element.prop ('width', w+'px');
            // $element.prop ('height', h+'px');


            // $element.css({backgroundImage: 'url("' + url + '")'});
            //$attributes.$set('src', url);
            // $element.prop('data-src', hurl);

            imageLoadingDataShare.set(0);

            if ($attributes.imageOnError) {
              //console.log (">>>>  ERROR CBK");
              $scope.imageOnError();
             // fn($scope, {});
            }
            else {
              //console.log (">>>>>>>>>> NO ERROR CBK");
            }
              
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

                if ($attributes.imageonload) {
                 
                  $scope.$apply($attributes.imageonload);
                 // fn($scope, {});
                }
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

                //$element[0].style.backgroundImage = 'url(' + 'img/noimage.png'+ ')';

              };

              bgImg.src = $attributes.imageSpinnerSrc;

            } else {

              var ld = NVR.getLogin();
              if (ld.isUseAuth && $rootScope.authSession=='' ) {
                NVR.log ("waiting for authSession to have a value...");

              } else {
                $element[0].src = $attributes.imageSpinnerSrc; // set src 
              }
          

            }
          }

          function isInView() {
            return true;
          }

          $element.on('$destroy', function () {

          });

        }
      };
    }
  ])

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

      request: function (config) {
        if (!config) return config;
        if (!config.url) return config;
        nvr = $injector.get('NVR');
        if ($rootScope.basicAuthHeader) {

          config.headers.Authorization = $rootScope.basicAuthHeader;
        }

        var chdr = nvr.getCustomHeader();
        if (chdr) {
          config.headers['X-ZmNinja'] = chdr;
        }
        


        return config || $q.when(config);
      },

      responseError: function (rejection) {
        nvr = $injector.get('NVR');
//       console.log (JSON.stringify(rejection));
        if (rejection.status == 401 && !rejection.config.skipIntercept) {

         /* rejection.data && rejection.data.data && rejection.data.data.message.indexOf('Token revoked') != -1) */

         if (rejection && rejection.data && rejection.data.data) {

          console.log ("MESSAGE:"+rejection.data.data.message);
            if (rejection.data.data.message.indexOf('API Disabled') != -1) {
              $rootScope.apiValid = false;
              return $q.reject(rejection);
            }
         }
          

          
    
          nvr.log ("Browser Http intecepted 401, will try reauth");
          return nvr.proceedWithLogin({'nobroadcast':true, 'access':false, 'refresh':true})
          .then (function(succ) {
            nvr.log ("Interception proceedWithLogin completed, retrying old request with skipIntercept = true");
           // console.log ("OLD URL-"+rejection.config.url );
            rejection.config.url = rejection.config.url.replace(/&token=([^&]*)/, $rootScope.authSession);
            rejection.config.skipIntercept = true;
          //  console.log ("NEW URL-"+rejection.config.url );
            return $injector.get('$http')(rejection.config);
          }, function (err) {
            nvr.log ("Interception proceedWithLogin failed, NOT retrying old request");
            return $q.reject(err);
          });
        } 
        else {
          if (rejection.config.skipIntercept) nvr.log ("Not intercepting as skipIntercept true");
          return $q.reject(rejection);
        }
        
      },

      response: function (response) {
        nvr = $injector.get('NVR');
        var cookies = response.headers("Set-Cookie");
        if (cookies != null) {

          var zmSess = cookies.match("ZMSESSID=(.*?);");

          if (zmSess) {
            if (zmSess[1]) {

              //console.log ("***** SETTING COOKIE TO "  + zmCookie);
              $rootScope.zmCookie = zmSess[1];
            }
          }
        }

        //console.log ("HTTP response");


      
        if (response.data && typeof(response.data) == 'string' && (response.data.indexOf("<pre class=\"cake-error\">")==0)) {
            nvr.log ("cake error detected, attempting fix...");
            //console.log ("BAD = "+ JSON.stringify(response.data));
            response.data = JSON.parse(response.data.replace(/<pre class=\"cake-error\">[\s\S]*<\/pre>/,''));
           // console.log ("FIXED="+JSON.stringify(response.data));
        }
        //"data":"<pre class=\"cake-error\">
        return response || $q.when(response);
      }

    };
  }])

  //-----------------------------------------------------------------
  // This service automatically checks for new versions every 24 hrs
  //------------------------------------------------------------------
  .factory('zmCheckUpdates', function ($interval, $http, zm, $timeout, $localstorage, NVR, $rootScope, $translate) {
    var zmUpdateHandle;
    var zmUpdateVersion = "";

    function start() {
      checkUpdate();
      $interval.cancel(zmUpdateHandle);
      zmUpdateHandle = $interval(function () {
        checkUpdate();

      }, zm.updateCheckInterval);

      function checkUpdate() {
        var lastdateString = NVR.getLastUpdateCheck();
        var lastdate;
        if (!lastdateString) {

          lastdate = moment().subtract(2, 'day');

        } else {
          lastdate = moment(lastdateString);
        }
        var timdiff = moment().diff(lastdate, 'hours');
        if (timdiff < 24) {
          NVR.log("Checked for update " + timdiff + " hours ago. Not checking again");

          return;
        }
        NVR.log("Checking for new version updates...");

        $http.get(zm.latestRelease)
          .then(function (success) {

            NVR.setLastUpdateCheck(moment().toISOString());
            // $localstorage.set("lastUpdateCheck", moment().toISOString());
            //console.log ("FULL STRING " + success.data.tag_name);

            // console.log ("^^^^^^^^^^^^^ GOT: " + JSON.stringify(success));

            var res = success.data.tag_name.match("v(.*)");
            zmUpdateVersion = res[1];
            var currentVersion = NVR.getAppVersion();
            if ($rootScope.platformOS == "desktop") {
              zmUpdateVersion = zmUpdateVersion + "D";
            }
            //if (NVR.getAppVersion() != zmUpdateVersion) {
            if (NVR.versionCompare(NVR.getAppVersion(), zmUpdateVersion) == -1) {
              $rootScope.newVersionAvailable = "v" + zmUpdateVersion + " available";
            } else {
              $rootScope.newVersionAvailable = "";
            }
            NVR.debug("current version: " + currentVersion + " & available version " + zmUpdateVersion);
            //console.log ("Version compare returned: " + NVR.versionCompare(currentVersion, //zmUpdateVersion));
            // console.log ("Version compare returned: " + NVR.versionCompare(zmUpdateVersion, currentVersion));
            //console.log ("UPDATE " + zmVersion);
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

  .factory('zmAutoLogin', ['$interval', 'NVR', '$http', 'zm', '$timeout', '$q', '$rootScope', '$ionicLoading', '$ionicPopup', '$state', '$ionicContentBanner', 'EventServer', '$ionicHistory', '$translate', '$cookies',function ($interval, NVR, $http, zm, $timeout, $q, $rootScope, $ionicLoading, $ionicPopup, $state, $ionicContentBanner, EventServer, $ionicHistory, $translate, $cookies) {
    var zmAutoLoginHandle;

    //------------------------------------------------------------------
    // doLogin() emits this when there is an auth error in the portal
    //------------------------------------------------------------------

    $rootScope.$on("token-expiry", function () {
      if ($rootScope.loginInProgress) {
        NVR.log ('-----> got token expiry broadcast, but login in progress, not acting');
      } else {
        NVR.log ('-----> Access token is about to expire, re-doing login');
        _doLogin("");  
      }
     
    });

    $rootScope.$on("auth-error", function () {

      NVR.debug("zmAutoLogin: Inside auth-error broadcast");
      NVR.displayBanner('error', ['ZoneMinder authentication failed', 'Please check settings']);

    });

    //------------------------------------------------------------------
    // broadcasted after :
    // a) device is ready
    // b) language loaded
    // c) localforage data loaded
    //------------------------------------------------------------------

    $rootScope.$on("init-complete", function () {
      NVR.log("Inside init-complete in app.js: All init over, going to portal login");
      $ionicHistory.nextViewOptions({
        disableAnimate: true
      });
      $state.go("app.zm-portal-login");
      return;
    });






    //------------------------------------------------------------------
    // doLogin() emits this when our auth credentials work
    //------------------------------------------------------------------

    $rootScope.$on("auth-success", function () {

      $rootScope.isLoggedIn = true;

      var ld = NVR.getLogin();
      if (ld.isUseAuth || ld.isUseBasicAuth) {
        var contentBannerInstance = $ionicContentBanner.show({
          text: ['ZoneMinder ' + $translate.instant('kAuthSuccess')],
          interval: 2000,
          type: 'info',
          transition: 'vertical'
        });
  
        $timeout(function () {
          contentBannerInstance();
        }, 2000);
        NVR.debug("auth-success broadcast:Successful");

      }
      else {
        NVR.debug ("auth not being used, not creating banner");
      }
     

      // we need AUTH_HASH_LOGIN to be on for WKWebView /mobile
      if (ld.isUseAuth && $rootScope.platformOS != 'desktop') {
        NVR.getAuthHashLogin()
          .then(function (data) {

              if (data.data && data.data.config.Value != '1') {
                $ionicPopup.alert({
                  title: $translate.instant('kError'),
                  template: $translate.instant('kAuthHashDisabled')
                });
              }

            },
            function (err) {
            
             NVR.debug("Auth Hash error: " + JSON.stringify(err));
            });
      }



    });

    $rootScope.getProfileName = function () {
      var ld = NVR.getLogin();
      return (ld.serverName || '(none)');
    };

    $rootScope.getLocalTimeZone = function () {
      return moment.tz.guess();
    };

    $rootScope.getServerTimeZoneNow = function () {

      return NVR.getTimeZoneNow();

    };

    $rootScope.isTzSupported = function () {
      return NVR.isTzSupported();
    };

    //------------------------------------------------------------------
    // doLogin() is the function that tries to login to ZM
    // it also makes sure we are not back to the same page
    // which actually means auth failed, but ZM treats it as a success
    //------------------------------------------------------------------

    function _doLoginNoLogout (str) {
    
      return _doLogin(str);
    }

    function _doLogoutAndLogin(str) {
      NVR.debug ("_doLogoutAndLogin: Clearing cookies");

      if (window.cordova) {
        // we need to do this or ZM will send same auth hash
        // this was fixed in a PR dated Oct 18
       
        cordova.plugin.http.clearCookies();
      }
    /*  else {
       angular.forEach($cookies, function (v, k) {
         $cookies.remove(k);
        });
      }*/
    
      $rootScope.userCancelledAuth = false;
      return NVR.getReachableConfig(false)
      .then (
        function(data ) {
         
        return NVR.logout()
        .then(function (ans) {
          return _doLogin(str);

        });
        },
        function (err) {
          NVR.log('No reachable config: '+JSON.stringify(err));
          $ionicHistory.nextViewOptions({
            disableAnimate:true,
            disableBack: true
          });
          if (!$rootScope.userCancelledAuth)
            $state.go("app.invalidapi");
          return;
        }
      );
    
      
      
      
    }


    function _doLogin(str) {
     
    
      var d = $q.defer();
      $rootScope.loginInProgress = true;

      if ($rootScope.userCancelledAuth) {
        NVR.debug ('_doLogin - not proceeding as user cancelled auth');
        $rootScope.loginInProgress = false;
        d.reject(false);
        return d.promise;
      }
      var ld = NVR.getLogin();

      //var statename = $ionicHistory.currentStateName();
      NVR.debug ("Inside _doLogin()");

/*
      if (statename == "montage-history") {
        NVR.log("Skipping login process as we are in montage history. Re-logging will mess up the stream");
        d.resolve("success");
        return d.promise;

      }
*/
      NVR.isReCaptcha()
      .then(function (result) {
        if (result == true) {
          $ionicLoading.hide();
        
          NVR.displayBanner('error', ['reCaptcha must be disabled', ], "", 8000);
          var alertPopup = $ionicPopup.alert({
            title: 'reCaptcha enabled',
            template: $translate.instant('kRecaptcha'),
            okText: $translate.instant('kButtonOk'),
            cancelText: $translate.instant('kButtonCancel'),
          });

          // close it after 5 seconds
          $timeout(function () {

            alertPopup.close();
          }, 5000);

          $rootScope.loginInProgress = false;
          d.reject("Error-disable recaptcha");
          return (d.promise);
        }

      });

      NVR.debug("Resetting zmCookie...");
      $rootScope.zmCookie = '';
      // first try to login, if it works, good
      // else try to do reachability

      //console.log(">>>>>>>>>>>> CALLING DO LOGIN");
      NVR.proceedWithLogin()
        .then(function (success) {

            //NVR.debug("Storing login time as " + moment().toString());
            localforage.setItem("lastLogin", moment().toString());
            $rootScope.loginInProgress = false;
            d.resolve(success);
            return d.promise;
          },
          function (error)
          {
              $ionicLoading.hide();
              $rootScope.loginInProgress = false;
              d.reject(error);
              return d.promise;
          });

      return d.promise;

  

    }
    function start() {
      var ld = NVR.getLogin();
      // lets keep this timer irrespective of auth or no auth
      //$rootScope.loggedIntoZm = 0;
      var timeInterval = ld.isTokenSupported ? zm.defaultAccessTokenExpiresMs: zm.loginInterval;
      $interval.cancel(zmAutoLoginHandle);

      if (ld.isTokenSupported) {
        NVR.debug ("------> Not starting login timer for token. We will start a one time timer when we know how soon the access token will live");
        _doLogin("");

      } else {
        NVR.debug ('We will relogin every '+timeInterval/1000+' seconds, token supported='+ld.isTokenSupported);
      zmAutoLoginHandle = $interval(function () {
        _doLogin("");
      }, timeInterval); 

      }

    }

    function stop() {
      var ld = NVR.getLogin();

      $interval.cancel(zmAutoLoginHandle);
      // $rootScope.loggedIntoZm = 0;
      NVR.log("Cancelling zmAutologin timer");

    }

    return {
      start: start,
      stop: stop,
      doLogin: _doLogoutAndLogin,
      doLoginNoLogout: _doLoginNoLogout

    };
  }])

  //====================================================================
  // First run in ionic
  //====================================================================

  .run(function ($ionicPlatform, $ionicPopup, $rootScope, zm, $state, $stateParams, NVR, $cordovaSplashscreen, $http, $interval, zmAutoLogin, zmCheckUpdates, $fileLogger, $timeout, $ionicHistory, $window, $ionicSideMenuDelegate, EventServer, $ionicContentBanner, $ionicLoading, /* $ionicNativeTransitions,*/ $translate, $localstorage) {


    $ionicPlatform.ready(function () {

      //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>INSIDE RUN");

      $fileLogger.setStorageFilename(zm.logFile);
      $fileLogger.setTimestampFormat('MMM d, y ' + NVR.getTimeFormatMilliSec());

      $fileLogger.checkFile().then(function (resp) {
        if (parseInt(resp.size) > zm.logFileMaxSize) {
          //console.log("inside file logger");

          $fileLogger.deleteLogfile().then(function () {
            NVR.log("Deleting old log file as it exceeds " + zm.logFileMaxSize + " bytes");

          });
        }
      });


      NVR.log("******* app .run device ready");

      $rootScope.dpadId = 0;
      $rootScope.textScaleFactor = 1.0;
      $rootScope.isLoggedIn = false;
      $rootScope.apiValid = true;

      $rootScope.db = null;
      $rootScope.runMode = NVR.getBandwidth();

      $rootScope.platformOS = "desktop";
      NVR.log("Device is ready");

      NVR.log ("setting size");
      $timeout (function () {

        NVR.computeDeviceSize();

      },30);
      

      //console.log ("*************** PLATFORM IS: "+ionic.Platform.platform());
      var ua = navigator.userAgent.toLowerCase();
      NVR.debug ("UA is "+ua);
      // var ld = NVR.getLogin();
      if (($ionicPlatform.is('ios') || ionic.Platform.platform() == 'macintel') && ua.indexOf("electron") == -1)
        $rootScope.platformOS = "ios";
      if ($ionicPlatform.is('android'))
        $rootScope.platformOS = "android";

      NVR.log("You are running on " + $rootScope.platformOS);



      $rootScope.appName = "zmNinja";
      $rootScope.zmGlobalCookie = "";
      $rootScope.isEventFilterOn = false;
      $rootScope.fromDate = "";
      $rootScope.fromTime = "";
      $rootScope.toDate = "";
      $rootScope.toTime = "";
      $rootScope.fromString = "";
      $rootScope.toString = "";
      // $rootScope.loggedIntoZm = 0;
      $rootScope.apnsToken = '';
      $rootScope.tappedNotification = 0;
      $rootScope.tappedMid = 0;
      $rootScope.tappedEid = 0;
      //var eventsToDisplay=[];
      $rootScope.alarmCount = "0";

      $rootScope.currentServerGroup = "defaultServer";
      $rootScope.validMonitorId = "";
      $rootScope.newVersionAvailable = "";
      $rootScope.userCancelledAuth = false;
      $rootScope.online = true;
      $rootScope.showBlog = false;
      $rootScope.newBlogPost = "";
      $rootScope.apiVersion = "";

      // only for android
      $rootScope.exitApp = function () {
        NVR.log("user exited app");

        //window.stop();
        ionic.Platform.exitApp();
        //navigator.app.exitApp();

      };
 
      // This is a global exception interceptor
      $rootScope.exceptionMessage = function (error) {
        NVR.debug("**EXCEPTION**" + error.reason + " caused by " + error.cause);
      };

      // for .config block
      $rootScope.debug = function (msg) {
        NVR.debug(msg);
      };


      $rootScope.getLogin = function () {
        return NVR.getLogin();
      };


      $rootScope.proceedWithLogin = function(obj) {
        return NVR.proceedWithLogin(obj);
      };

     
      // DPAD Handler - disabled for now
      // when ready add ionic cordova plugin add https://github.com/pliablepixels/cordova-plugin-android-tv.git

      // console.log (JSON.stringify(ionic.Platform.device()));
      /*  if (0 && $ionicPlatform.is('android')) {
          window.addEventListener('keydown', dPadHandler, true);
        } else {
          NVR.log("Not registering D-PAD handler, as you are not on android");
        }*/


      function dPadHandler(evt) {

        var handled = false;

        var keyCodes = {
          MKEYB: 77,
          SELECT: 13,

          LEFT: 37,
          UP: 38,
          RIGHT: 39,
          DOWN: 40,

          PLAYPAUSE: 179,
          REWIND: 227,
          FORWARD: 228
        };

        $timeout(function () {
          var st = '#' + $rootScope.dpadState + '-move-';
          //  console.log ("IN STATE="+$rootScope.dpadState+ " with st="+st);
          var keyCode = evt.keyCode;
          var el, nextel;

          if (keyCode == keyCodes.REWIND) {
            if (!$ionicSideMenuDelegate.isOpen()) {
              $ionicSideMenuDelegate.toggleLeft();
              $rootScope.dpadState = "menu";
              $rootScope.dpadId = 0;

            } else {
              el = angular.element(document.querySelector(st + $rootScope.dpadId));
              if (el.length) el[0].classList.remove('dpadSelected');
              $ionicSideMenuDelegate.toggleLeft();
              $rootScope.dpadId = 0;
              $rootScope.dpadState = $state.current.name.replace('app.', "");
            }
            //console.log("dpad State is: " + $rootScope.dpadState);
            handled = true;
          } else if (keyCode == keyCodes.SELECT) { // select
            if ($rootScope.dpadId > 0) {
              el = angular.element(document.querySelector('#' + $rootScope.dpadState + '-move-' + $rootScope.dpadId));
              // if in menu, unselect
              if ($rootScope.dpadState == 'menu') {
                if (el.length) {
                  el[0].classList.remove('dpadSelected');
                  $rootScope.dpadId = 0;
                }
              }
              el.triggerHandler('click');

            }
            handled = true;
          }

          // arrows
          else if (keyCode >= keyCodes.LEFT && keyCode <= keyCodes.DOWN) {

            // might be open by mouse or other event, so check first
            if ($ionicSideMenuDelegate.isOpen() && $rootScope.dpadState != 'menu') {
              $rootScope.dpadState = "menu";
              $rootScope.dpadId = 0;
            }

            if ($rootScope.dpadId < 1) {
              // console.log ("First dpad usage with st="+st);
              $rootScope.dpadId = 1;

              //console.log ("looking for st="+st);
              el = angular.element(document.querySelector(st + '1'));
              if (el.length) {
                el[0].classList.add('dpadSelected');
                el[0].scrollIntoView();
              }

            } else {
              // unselect old
              //console.log ("looking for st="+st);
              el = angular.element(document.querySelector(st + $rootScope.dpadId));

              var nextId = (keyCode == keyCodes.LEFT || keyCode == keyCodes.UP) ? $rootScope.dpadId - 1 : $rootScope.dpadId + 1;
              nextel = angular.element(document.querySelector(st + nextId));
              if (nextel.length) {
                if (el.length) el[0].classList.remove('dpadSelected');
                nextel[0].classList.add('dpadSelected');
                nextel[0].scrollIntoView();
                $rootScope.dpadId = nextId;
              }
             // console.log("dpadID=" + $rootScope.dpadId + " with state=" + $rootScope.dpadState);
            }
            handled = true;
          }


          return handled;

        });
      }

      // register callbacks for online/offline
      // lets see if it really works
      $rootScope.online = navigator.onLine;

      // set up network state handlers after 3secs
      // android seems to howl about this at app start?
      $timeout (function() {

      NVR.log ("--------->Setting up network state handlers....");
      window.addEventListener("offline", onOffline, false);
      window.addEventListener("online", onOnline, false);

      NVR.log ("--------->Setting up global key handler...");
      if ($rootScope.platformOS == 'desktop') {
        window.addEventListener('keydown', keyboardHandler, true);
    
      }
      if ($rootScope.platformOS == 'desktop') {
        NVR.log ("---> Hacked up waked detection...");
        detectWake();
      }

      },3000);


      function keyboardHandler(evt) {
          if (evt.metaKey || evt.ctrlKey) {
              if (evt.keyCode == 76) {
                evt.preventDefault();
                NVR.log ("---> Lock pressed");
                if (!NVR.getLogin().usePin) {
                    NVR.log ("not using pin, ignoring");
                    return;
                }
                $ionicHistory.nextViewOptions({
                    disableAnimate: true
                  });
                if ($state.current.name != 'app.zm-portal-login') {
                    $rootScope.lastState = $state.current.name;
                    $rootScope.$stateParams = $stateParams;
                    $state.go ('app.zm-portal-login');
                }
                else {
                    NVR.log ("Already at portal, not going again");
                }
                
              }
          }
      }

      // credit: https://blog.alexmaccaw.com/javascript-wake-event
      function detectWake() {
        var TIMEOUT = 10000;
        var iter = 1;
        var lastTime = (new Date()).getTime();

        setInterval(function() {
          var currentTime = (new Date()).getTime();
          if (currentTime > (lastTime + TIMEOUT + 10000)) {
            // Wake!
            $rootScope.online = false;
            NVR.log ("********* YOU WOKE UP!!!!!");
            onOnline();
            iter = 1;
          } 
          else {
            //NVR.debug ("alive..."+iter);
            iter++;
          }
          lastTime = currentTime;
        }, TIMEOUT);
      }

      function onOffline() {
        $timeout(function () {
          $rootScope.online = false;
          NVR.log("************** Your network went offline");

          //$rootScope.$emit('network-change', "offline");

        });
      }

      

      function onOnline() {
        $timeout(function () {
          if ($rootScope.online == true) {
            NVR.log ("**** network online, but looks like it was not offline, not doing anything");
            return;
          }
          NVR.log("************ Your network came back online");

          $rootScope.online = true;
  
              var networkState = "browser not supported";
              if (navigator.connection) networkState = navigator.connection.type;
              NVR.debug("Detected network type as: " + networkState);
              var strState = NVR.getBandwidth();
              NVR.debug("getBandwidth() normalized it as: " + strState);
              $rootScope.runMode = strState;
              if ((NVR.getLogin().autoSwitchBandwidth == true) &&
                (NVR.getLogin().enableLowBandwidth == true)) {
                NVR.debug("Setting app state to: " + strState);
                $rootScope.$broadcast('bandwidth-change', strState);
              } else {
                NVR.debug("Not changing bandwidth state, as auto change is not on");
              }
              NVR.log("Your network is online, re-authenticating");
              zmAutoLogin.doLoginNoLogout($translate.instant('kReAuthenticating'));
    

        });

      }
      

      // This code takes care of trapping the Android back button
      // and takes it to the menu.
      //console.log (">>>>>>>>>>>>>>>>>>BACK BUTTON REGISTERED");
      $ionicPlatform.registerBackButtonAction(function (e) {

        //console.log ("******** back called with isOpenLeft: " + $ionicSideMenuDelegate.isOpenLeft());
        if (!$ionicSideMenuDelegate.isOpenLeft()) {
          e.preventDefault();
          $ionicSideMenuDelegate.toggleLeft();

          $rootScope.dState = "menu";
          $rootScope.dpadId = 0;
          //console.log("Status of SIDE MENU IS : " + $ionicSideMenuDelegate.isOpen());
        } else {

          window.stop();
          //ionic.Platform.exitApp();
          //navigator.app.exitApp();
        }
      }, 501);

      // this works reliably on both Android and iOS. The "onorientation" seems to reverse w/h in Android. Go figure.
      // http://stackoverflow.com/questions/1649086/detect-rotation-of-android-phone-in-the-browser-with-javascript

      var checkOrientation = function () {
        // give rotation time to actually rotate, or width/height will be bogus
        $timeout ( function() {
      
        NVR.computeDeviceSize();
        $rootScope.$broadcast('sizechanged');

        },100);
        

      };

      window.addEventListener("resize", checkOrientation, false);

      // we come here when a user forcibly cancels portal auth
      // useful when you know your auth won't succeed and you need to 
      // switch to another server
      $rootScope.cancelAuth = function () {
        $ionicLoading.hide();
        NVR.log("User cancelled login");
        $ionicHistory.nextViewOptions({
          disableAnimate: true,
          disableBack: true
        });
        $rootScope.userCancelledAuth = true;
        //window.stop();

        //console.log ("inside cancelAuth , calling wizard");
        //$ionicSideMenuDelegate.toggleLeft();
        $state.go("app.login", {
          "wizard": false
        });
        return;
      };

      //---------------------------------------------------------------------------
      // authorize state transitions
      //----------------------------------------------------------------------------

      $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {


        if (!$rootScope.initComplete && toState.name!= 'app.first-use') {
          NVR.debug ("---> Init not complete, ignoring state change request to "+toState.name);
          event.preventDefault();
          return;

        }

        var requireLogin = toState.data.requireLogin;

        $rootScope.dpadId = 0;



        if ($rootScope.apiValid == false && toState.name != 'app.invalidapi' && toState.data.requireLogin == true) {
          /*event.preventDefault();
          $rootScope.dpadState = "app.invalidapi";
          $state.transitionTo('app.invalidapi');*/
          NVR.log ('API not valid, not going to this state');
          return;

        }



        if ((NVR.hasLoginInfo() || toState.data.requireLogin == false) && toState.name != "app.invalidapi") {
          //console.log("State transition is authorized");

          if (toState.name != "app.refresh" &&
            toState.name != "app.first-use" &&
            toState.name != "app.zm-portal-login"
          ) {

           // NVR.debug("Setting last-desktop-state to:" + JSON.stringify(toState));
            localforage.setItem('last-desktop-state', {
              'name': toState.name,
              'params': toState.params
            });


          }
          $rootScope.dpadState = toState.name.replace("app.", "");
          return;

        } else {
          NVR.log("In Auth State trans: Not logged in, requested to go to " + JSON.stringify(toState));
          // event.preventDefault();
          // 

          $rootScope.dpadState = "login";
          $state.transitionTo('app.login');

        }

        if (requireLogin) {
      
          NVR.displayBanner('error', [$translate.instant('kCredentialsBody')]);

        /*  $ionicPopup.alert({
            title: $translate.instant('kCredentialsTitle'),
            template: $translate.instant('kCredentialsBody')
          });*/
          // for whatever reason, .go was resulting in digest loops.
          // if you don't prevent, states will stack
          event.preventDefault();
          $rootScope.dpadState = "login";
          
          $state.transitionTo('app.login');
          return;
        }

        // right about now, store last-state as the callback doesn't seem
        // to work in Windows


        //NVR.debug("Setting last-desktop-state to:" + JSON.stringify(toState) + " with params:" + JSON.stringify(toParams));
        localforage.setItem('last-desktop-state', {
          'name': toState,
          'params': toParams
        });

        return;

      });

      // credit http://stackoverflow.com/a/2091331/1361529
      function getQueryVariable(query, variable) {
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
          var pair = vars[i].split('=');
          if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
          }
        }
        return "";
        //console.log('Query variable %s not found', variable);
      }

      //---------------------------------------------------------------------
      // called when device is ready
      //---------------------------------------------------------------------

      function getTextZoomCallback(tz) {
        $rootScope.textScaleFactor = parseFloat(tz + "%") / 100.0;
        NVR.debug("text zoom factor is " + $rootScope.textScaleFactor);
      }

      // $ionicPlatform.ready(function () {





      // handles URL launches

      window.handleOpenURL = function (url) {
        $rootScope.tappedNotification = 2; // 1 is push
        $rootScope.tappedMid = 0;
        var c = URI.parse(url);
        //NVR.log ("***********launched with "+ JSON.stringify(c));
        if (c.query) {
          var qm = getQueryVariable(c.query, "mid");
          var qe = getQueryVariable(c.query, "eid");
          if (qe) $rootScope.tappedEid = parseInt(qe);
          if (qm) $rootScope.tappedMid = parseInt(qm);
          NVR.log("external URL called with MID=" + $rootScope.tappedMid + " and/or EID=" + $rootScope.tappedEid);
          //console.log (">>>>>>>>> EID="+getQueryVariable(c.query, "eid"));

        }



      };


      //console.log("Mobile acc");
     /* if (window.cordova)
        MobileAccessibility.getTextZoom(getTextZoomCallback);*/

      // $rootScope.lastState = "events";
      //$rootScope.lastStateParam = "0";

      //console.log("localforage config");
      NVR.configureStorageDB()
        .then(function () {
          NVR.log("localforage driver:" + localforage.driver());
          return NVR.cloudSync();
        })
        .then(function () {
          // this should alert "cordovaSQLiteDriver" when in an emulator or a device

          // Now lets import old data if it exists:
          NVR.log("Cloudsync operation complete, continuing...");
          var defaultServerName = $localstorage.get("defaultServerName");

          localforage.getItem("defaultServerName")
            .then(function (val) {
              //  console.log (">>>> localforage reported defaultServerName as " + val);
              // if neither, we are in first use, mates!
              if (!val && !defaultServerName) {
                continueInitialInit();
                /*  NVR.debug ("Neither localstorage or forage  - First use, showing warm and fuzzy...");
                      $ionicHistory.nextViewOptions({
                          disableAnimate: true,
                          disableBack: true
                      });
                      $state.go('first-use');*/
              } else if (!val && defaultServerName) {
                NVR.log(">>>>Importing data from localstorage....");

                var dsn = defaultServerName;
                var dl = $localstorage.get('defaultLang') || 'en';
                var ifu = ($localstorage.get('isFirstUse') == '0' ? false : true);
                var luc = $localstorage.get('lastUpdateCheck');
                var lbpc = $localstorage.get('latestBlogPostChecked');
                var sgl = $localstorage.getObject('serverGroupList');

                NVR.log(">>>Localstorage data found as below:");
                NVR.log("server name:" + dsn);
                NVR.log("default lang :" + dl);
                NVR.log("is first use:" + ifu);
                NVR.log("last update check:" + luc);
                NVR.log("latest blog post check:" + lbpc);
                NVR.log("server group list:" + JSON.stringify(sgl));

                localforage.setItem('defaultLang', dl)
                  .then(function () {

                    NVR.log(">>>>migrated defaultLang...");
                    NVR.setFirstUse(ifu);
                    NVR.log("migration: setting isFirstUse = " + ifu);
                    return localforage.setItem('isFirstUse', ifu);
                  })
                  .then(function () {
                    NVR.log(">>>>migrated isFirstUse...");
                    return localforage.setItem('lastUpdateCheck', ifu);
                  })
                  .then(function () {
                    NVR.log(">>>>migrated lastUpdateCheck...");
                    return localforage.setItem('latestBlogPostChecked', lbpc);
                  })
                  .then(function () {
                    NVR.log(">>>>migrated latestBlogPostChecked...");
                    // lets encrypt serverGroupList
                    NVR.log("server group list is " + JSON.stringify(sgl));
                    var ct = NVR.encrypt(sgl);
                   
                    NVR.log("encrypted server group list is " + ct);
                    ct = sgl;
                    return localforage.setItem('serverGroupList', ct);
                  })
                  .then(function () {
                    NVR.log(">>>>migrated serverGroupList...");
                    return localforage.setItem('defaultServerName', dsn);
                  })
                  .then(function () {
                    NVR.log(">>>>migrated defaultServerName...");
                    NVR.log(">>>>Migrated all values, continuing...");
                    //NVR.migrationComplete();
                    continueInitialInit();
                  })
                  .catch(function (err) {
                    NVR.log("Migration error : " + JSON.stringify(err));
                    continueInitialInit();
                  });

              } else {
                NVR.log(">>>>No data to import....");
                //NVR.migrationComplete();
                continueInitialInit();
              }

            });

        });

      function continueInitialInit() {
        //  console.log("continueinit");
        var pixelRatio = window.devicePixelRatio || 1;
        $rootScope.pixelRatio = pixelRatio;
        $rootScope.devWidth = ((window.innerWidth > 0) ? window.innerWidth : screen.width);
        $rootScope.devHeight = ((window.innerHeight > 0) ? window.innerHeight : screen.height);
        // for making sure we canuse $state.go with ng-click
        // needed for views that use popovers
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;

        if (window.cordova) {
          
          //window.cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
          // org.apache.cordova.statusbar required
          //  console.log("statusbar");
          NVR.log("Updating statusbar");
          StatusBar.styleDefault();
         

          StatusBar.backgroundColorByHexString("#2980b9");
        }

        if (window.cordova) {
          // console.log("Hiding splash");
          $cordovaSplashscreen.hide();



          // console.log("app version");
          cordova.getAppVersion.getVersionNumber().then(function (version) {
          
            NVR.log("App Version: " + version);
            NVR.setAppVersion(version);
          });
        }
        else {
         // custom header
         $rootScope.appVersion = NVR.getAppVersion();
        }
      


        // At this stage, NVR.init is not called yet
        // but I do need to know the language

        NVR.log("Retrieving language before init is called...");
        localforage.getItem("defaultLang")
          .then(function (val) {

            var lang = val;
            //console.log (">>>>>>>>>>>>>> LANG IS " + val);

            if (lang == undefined || lang == null) {
              NVR.log("No language set, switching to en");
              lang = "en";

            } else {
              NVR.log("Language stored as:" + lang);

            }

            NVR.setDefaultLanguage(lang, false)
              .then(function (success) {
                NVR.log(">>>>Language to be used:" + $translate.proposedLanguage());
                moment.locale($translate.proposedLanguage());

                // Remember this is before data Init
                // so I need to do a direct forage fetch
                localforage.getItem("isFirstUse")
                  .then(function (val) {
                    //console.log ("isFirstUse is " + val);
                    NVR.debug("isFirstUse returned: " + val);
                    if (val == null || val == true) {
                      NVR.log("First time detected ");
                      $rootScope.initComplete = true;
                      $state.go("app.first-use");
                      return;

                    } else {
                      continueRestOfInit();
                    }

                  });

              });
          });
      }

      function continueRestOfInit() {
        
        // use desktop state for mobile too as 
        // mobile now quits
        if ($rootScope.platformOS == 'desktop' || 1) {
          $rootScope.lastState = "";
          $rootScope.lastStateParam = {};

          localforage.getItem('last-desktop-state')
            .then(function (succ) {
             //console.log("FOUND  STATE" + JSON.stringify(succ) + ":" + succ);

             if (succ == null) succ = {name:"app.montage"};

              // sanitize this
              if (!succ.name || typeof succ.name !== 'string') {
                succ.name = "app.montage";
              }

              if (!succ.params) {
                succ.params = {};
              }
              if (succ) {
                if (succ.name == 'app.invalidapi' || succ.name == 'app.refresh' || succ.name == 'app.importantmessage' || succ.name == "app.first-use" || succ.name == "app.zm-portal-login" || !succ.name) {
                  succ.name = 'app.montage';
                  localforage.setItem('last-desktop-state', succ.name);
                }
                $rootScope.lastState = succ.name;
                if ($rootScope.lastState.indexOf("app.") == -1) {
                  $rootScope.lastState = "app." + $rootScope.lastState;


                }
                $rootScope.lastStateParam = succ.params;


                NVR.debug("last state=" + $rootScope.lastState + " param=" + $rootScope.lastStateParam);

                



              }
              loadServices();
            }, function (err) {
              
            //  console.log("ERR " + JSON.stringify(err));
              $rootScope.lastState = "app.montage";
              loadServices();
            });
        } 

        function loadServices() {
          NVR.log("Language file loaded, continuing with rest");
          NVR.init();
          zmCheckUpdates.start();
         // NVR.log("Setting up POST LOGIN timer");
          setupPauseAndResume();

        
    
        }

      }


      function setupPauseAndResume() {
        NVR.log("Setting up pause and resume handler AFTER language is loaded...");

        if ($rootScope.platformOS != 'android') {
          document.addEventListener("resume", function () {
            resumeHandler();
          }, false);

          document.addEventListener("pause", function () {
            pauseHandler();
          }, false);
        } else {
          NVR.debug("Android detected, using cordova-multiwindow plugin for onStop/onStart instead");
          window.MultiWindowPlugin.registerOnStop("app-pause", pauseHandler);
          window.MultiWindowPlugin.registerOnStart("app-resume", resumeHandler);


        }


        function resumeHandler() {
         
          NVR.setBackground(false);
          NVR.setJustResumed(true);
          $ionicPlatform.ready(function () {

            NVR.log("******* resumeHandler device ready");
            NVR.log("App is resuming from background");

            NVR.log ("-->Re-registering online/offine");
            document.addEventListener("offline", onOffline, false);
            document.addEventListener("online", onOnline, false);
            window.addEventListener("resize", checkOrientation, false);



            $rootScope.isDownloading = false;

            var ld = NVR.getLogin();


            // don't animate
            $ionicHistory.nextViewOptions({
              disableAnimate: true,
              disableBack: true
            });

            // remember the last state so we can 
            // go back there after auth
            if ($ionicHistory.currentView()) {
              $rootScope.lastState = $ionicHistory.currentView().stateName;
              $rootScope.lastStateParam =
                $ionicHistory.currentView().stateParams;
              //NVR.debug("Last State recorded:" +
                //JSON.stringify($ionicHistory.currentView()));

              if ($rootScope.lastState == "app.zm-portal-login") {
                NVR.debug("Last state was portal-login, so forcing montage");
                $rootScope.lastState = "app.montage";
              }

              NVR.debug("going to portal login");
              $ionicHistory.nextViewOptions({
                disableAnimate: true
              });
              $state.go("app.zm-portal-login");
              return;
            } else {
              $rootScope.lastState = "";
              $rootScope.lastStateParam = "";
              NVR.debug("reset lastState to null");
              $ionicHistory.nextViewOptions({
                disableAnimate: true
              });
              $state.go("app.zm-portal-login");
              return;
            }


          });
        }

        function pauseHandler() {

          NVR.log ("-->Clearing online/offine");
          document.removeEventListener("offline", onOffline, false);
          document.removeEventListener("online", onOnline, false);
          window.removeEventListener("resize", checkOrientation, false);


          NVR.setBackground(true);
          NVR.setJustResumed(false);
          // NVR.setJustResumed(true); // used for window stop

          NVR.log("ROOT APP:App is going into background");
          EventServer.disconnect();

          $interval.cancel($rootScope.eventQueryInterval);
          $interval.cancel($rootScope.intervalHandle);
          zmAutoLogin.stop();

          var ld = NVR.getLogin();


          if ($rootScope.platformOS == "android") {
            NVR.log(" force exiting app since its android");
            navigator.app.exitApp();
            $timeout(function () {
              if (NVR.isBackground()) {
                NVR.log("If this shows up, then the app did not exit...");
                window.stop();
              } else {
                NVR.log("window stop delay timeout called as part of pause, but app no longer in background");
              }


            }, 5000);
          }

          if ($rootScope.zmPopup)
            $rootScope.zmPopup.close();
        }

      }

      // URL interceptor


    }); //platformReady

  }) //run

  //------------------------------------------------------------------
  // Route configuration
  //------------------------------------------------------------------

  // My route map connecting menu options to their respective templates and controllers
  .config(function ($stateProvider, $urlRouterProvider, $httpProvider, $ionicConfigProvider, $provide, $compileProvider, /*$ionicNativeTransitionsProvider,*/ $logProvider, $translateProvider, $injector) {

    //$logProvider.debugEnabled(false);
    //$compileProvider.debugInfoEnabled(false);

    // This is an exception interceptor so it can show up in app logs 
    // if they occur. I suspect digest and other errors will be useful
    // for me to see
    //$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|cdvphotolibrary):/);
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|content|cdvphotolibrary|blob|unsafe|local):|data:image\//);
  
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


    // Wraps around $http that switches between browser XHR
    // or cordova-advanced-http based on if cordova is available 
    // credits:
    // a) https://www.exratione.com/2013/08/angularjs-wrapping-http-for-fun-and-profit/
    // b) https://gist.github.com/adamreisnz/354364e2a58786e2be71

    $provide.decorator('$http', ['$delegate', '$q', '$injector', function ($delegate, $q, $injector) {
      // create function which overrides $http function
      var $http = $delegate;
      var nvr = $injector.get("$rootScope");
    

      var wrapper = function () {
        var url;
        var method;

        url = arguments[0].url;
        method = arguments[0].method;
        var isOutgoingRequest = /^(http|https):\/\//.test(url);
        if (window.cordova && isOutgoingRequest) {



          var d = $q.defer();

          var skipIntercept = arguments[0].skipIntercept || false;

          var dataPayload = {};
          if (arguments[0].data !== undefined) {
            dataPayload = arguments[0].data;
          }

          var options = {
            method: method,
            data: dataPayload,
            headers: arguments[0].headers,
           // timeout: arguments[0].timeout, 
            responseType: arguments[0].responseType,
            skipIntercept:skipIntercept
          };

          if (arguments[0].timeout) options.timeout = arguments[0].timeout;


          // console.log ("**** -->"+method+"<-- using native HTTP with:"+encodeURI(url)+" payload:"+JSON.stringify(options));
         
         // nvr.debug ("cordova: got url "+url);
          //nvr.debug ("cordova: url after encode "+encodeURI(url));
          //cordova.plugin.http.sendRequest(encodeURI(url), options,

          if (!nvr.getLogin().httpCordovaNoEncode) {
            url = encodeURI(url);
            //nvr.debug("encoded URL="+url); 
          }
           

          cordova.plugin.http.sendRequest(url, options,
            function (succ) {
              // automatic JSON parse if no responseType: text
              // fall back to text if JSON parse fails too

                   // work around for cake-error leak

                  // console.log ("HTTP RESPONSE:" + JSON.stringify(succ.data));
                   if (succ.data && (succ.data.indexOf("<pre class=\"cake-error\">") == 0) ) {
                    nvr.debug ("**** Native: cake-error in message, trying fix...");
                    succ.data = JSON.parse(succ.data.replace(/<pre class=\"cake-error\">[\s\S]*<\/pre>/,''));
                  }

              if (options.responseType == 'text') {
                // don't parse into JSON
                d.resolve({
                  "data": succ.data
                });
                return d.promise;
              } else {

           

                try {
                  d.resolve({
                    "data": JSON.parse(succ.data)
                  });
                  return d.promise;
                } catch (e) {

                  //console.log ("*** Native HTTP response: JSON parsing failed for "+url+", returning text");
                  d.resolve({
                    "data": succ.data
                  });
                  return d.promise;
                }

              }
            },
            function (err) {
            
              nvr.debug("***  Inside native HTTP error for url:"+JSON.stringify(err));
              if (err.status == 401 && !options.skipIntercept && nvr.apiValid) {
                if (err.error && err.error.indexOf("API is disabled for user") != -1) {
                  nvr.apiValid = false;
                  nvr.debug ("Setting API to "+nvr.apiValid);
                  d.reject(err);
                  return d.promise;
                  
                  }
                nvr.debug ("** Native intercept: Got 401, going to try logging in");
                return nvr.proceedWithLogin({'nobroadcast':true, 'access':false, 'refresh':true})
                .then (function(succ) {
                          nvr.debug ("** Native, tokens generated, retrying old request with skipIntercept = true");
                          //console.log ("I GOT: "+ JSON.stringify(succ));
                          url = url.replace(/&token=([^&]*)/, nvr.authSession);
                          options.skipIntercept = true;
                         // nvr.debug ("cordova: intercept got url "+url);
                          //nvr.debug ("cordova: intercept url after encode "+encodeURI(url));
                          cordova.plugin.http.sendRequest(url, options, 
                          function (succ) {
                            d.resolve(succ);
                            return d.promise;
                          }, 
                          function (err) {
                            d.reject(err);
                            return d.promise;
                   
                          });
                          return d.promise;
                }, function (err) {d.reject(err); return d.promise;});
              }
              else {
                if (options.skipIntercept) {
                  nvr.debug ("Not intercepting as skipIntercept is true");
                }
                // not a 401, so pass on rejection
                d.reject(err);
                return d.promise;
              }
              
            });
          return d.promise;

        } else { // not cordova, so lets go back to default http
          // console.log ("**** "+method+" using XHR HTTP for "+url);
          return $http.apply($http, arguments);
        }

      };

      // wrap around all HTTP methods
      Object.keys($http).filter(function (key) {
        return (typeof $http[key] === 'function');
      }).forEach(function (key) {
        wrapper[key] = function () {
          return $http[key].apply($http, arguments);
        };
      });
      // wrap convenience functions
      $delegate.get = function (url, config) {
        return wrapper(angular.extend(config || {}, {
          method: 'get',
          url: url
        }));
      };

      $delegate.post = function (url, data, config) {
        return wrapper(angular.extend(config || {}, {
          method: 'post',
          url: url,
          data: data
        }));
      };

      $delegate.delete = function (url, config) {
        return wrapper(angular.extend(config || {}, {
          method: 'delete',
          url: url
        }));
      };

      return wrapper;
    }]);

    // If you do this, Allow Origin can't be *
    $httpProvider.defaults.withCredentials = true;
    $httpProvider.interceptors.push('timeoutHttpIntercept');
    $ionicConfigProvider.navBar.alignTitle('center');
    //$ionicConfigProvider.backButton.text('').icon('ion-chevron-left');
    //$ionicConfigProvider.backButton.text('').icon('ion-chevron-left').previousTitleText(false);
    // use overflow-scroll=false in ion-content
    // removing it here doesn't allow you to enable it per view
    // so it messes up scrolldelegate zoom and possibly others
    //$ionicConfigProvider.scrolling.jsScrolling(false);
    $compileProvider.debugInfoEnabled(false);
   

    /*$ionicNativeTransitionsProvider.setDefaultOptions({
      duration: 250,
    }); */

    $translateProvider.useStaticFilesLoader({
      prefix: 'lang/locale-',
      suffix: '.json'
    });

    //$translateProvider.useLocalStorage();

    $translateProvider.registerAvailableLanguageKeys(['en', 'ba', 'de', 'es', 'fr', 'it', 'ru', 'ja', 'ko', 'nl', 'pl', 'zh', 'zh_CN', 'zh_TW', 'pt', 'ar', 'hi', 'hu', 'se'], {
      'en_*': 'en',
      'ba_*': 'ba',
      'de_*': 'de',
      'es_*': 'es',
      'fr_*': 'fr',
      'it_*': 'it',
      'ru_*': 'ru',
      'ja_*': 'ja',
      'ko_*': 'ko',
      'nl_*': 'nl',
      'pt_*': 'pt',
      'pl_*': 'pl',
      'ar_*': 'ar',
      'hi_*': 'hi',
      'hu_*': 'hu',
      'se_*': 'se',
      'zh_CN': 'zh_CN',
      '*': 'en' // must be last
    });

    //$translateProvider.determinePreferredLanguage();
    //$translateProvider.preferredLanguage("en");
    $translateProvider.fallbackLanguage("en");
    $translateProvider.useSanitizeValueStrategy('escape');

    $stateProvider
      .state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'zmApp.appCtrl',
        cache: false,

        //controller: 'AppCtrl'
      })



      .state('app.login', {
        data: {
          requireLogin: false
        },
        url: "/login/:wizard",
        cache: false,
        templateUrl: "templates/login.html",
        controller: 'zmApp.LoginCtrl',

      })

      .state('app.help', {
        data: {
          requireLogin: false
        },
        url: "/help",
        cache: false,
        templateUrl: "templates/help.html",
        controller: 'zmApp.HelpCtrl',

      })

      .state('app.bookmark', {
        data: {
          requireLogin: false
        },
        url: "/bookmark",
        cache: false,
        templateUrl: "templates/bookmark.html",
        controller: 'zmApp.BookmarkCtrl',

      })

/*
      .state('app.news', {
        data: {
          requireLogin: false
        },
        url: "/news",
        cache: false,
        templateUrl: "templates/news.html",
        controller: 'zmApp.NewsCtrl',

      })
      */

      .state('app.monitors', {
        data: {
          requireLogin: true
        },
        /*resolve: {
          message: function (NVR) {
            // console.log("Inside app.montage resolve");
            return NVR.getMonitors(0);
          }
        },*/
        url: "/monitors",
        cache: false,
        templateUrl: "templates/monitors.html",
        controller: 'zmApp.MonitorCtrl',

      })

      .state('app.events', {
        data: {
          requireLogin: true
        },
        resolve: {
          message: function (NVR) {
            //console.log("Inside app.events resolve");
            return NVR.getMonitors(0);
          }
        },
        cache: false,
        url: "/events/:id/:playEvent/:lastCheckTime",
        templateUrl: "templates/events.html",
        controller: 'zmApp.EventCtrl',

      })

      .state('app.lowversion', {
        data: {
          requireLogin: false
        },

        url: "/lowversion/:ver",
        cache: false,
        templateUrl: "templates/lowversion.html",
        controller: 'zmApp.LowVersionCtrl',

      })


      .state('app.refresh', {
        data: {
          requireLogin: false
        },

        url: "/refresh/:view",
        cache: false,
        nativeTransitions: null,
        templateUrl: "templates/refresh.html",
        controller: 'zmApp.RefreshCtrl',

      })

      .state('app.importantmessage', {
        data: {
          requireLogin: false
        },

        cache: false,
        url: "/importantmessage",
        templateUrl: "templates/important_message.html",
        controller: 'zmApp.ImportantMessageCtrl',

      })

      .state('app.invalidapi', {
        data: {
          requireLogin: false
        },

        cache: false,
        url: "/invalidapi",
        templateUrl: "templates/invalidapi.html",
        controller: 'zmApp.InvalidApiCtrl',

      })

      .state('app.events-graphs', {
        data: {
          requireLogin: true
        },
        cache: false,
        url: "/events-graphs",
        templateUrl: "templates/events-graphs.html",
        controller: 'zmApp.EventsGraphsCtrl',

      })

      .state('app.events-date-time-filter', {
        data: {
          requireLogin: true
        },
        cache: false,
        url: "/events-date-time-filter",
        templateUrl: "templates/events-date-time-filter.html",
        controller: 'zmApp.EventDateTimeFilterCtrl',

      })

      .state('app.state', {
        data: {
          requireLogin: true
        },
        params: {
          shortcut: null
        },
        cache: false,
        url: "/state",
        templateUrl: "templates/state.html",
        controller: 'zmApp.StateCtrl',

      })


      .state('app.moment', {
        data: {
          requireLogin: true
        },
        resolve: {
          message: function (NVR) {
            //console.log("Inside app.events resolve");
            return NVR.getMonitors(0);
          }
        },
        cache: false,
        url: "/moment",
        templateUrl: "templates/moment.html",
        controller: 'zmApp.MomentCtrl',

      })

      .state('app.devoptions', {
        data: {
          requireLogin: false
        },
        url: "/devoptions",
        cache: false,
        templateUrl: "templates/devoptions.html",
        controller: 'zmApp.DevOptionsCtrl',
      })

      .state('app.timeline', {
        data: {
          requireLogin: true
        },
        resolve: {
          message: function (NVR) {
            //console.log("Inside app.events resolve");
            return NVR.getMonitors(0);
          }
        },
        url: "/timeline",
        cache: false,
        templateUrl: "templates/timeline.html",
        controller: 'zmApp.TimelineCtrl',

      })

      .state('app.eventserversettings', {
        data: {
          requireLogin: true
        },
        resolve: {
          message: function (NVR) {
            return NVR.getMonitors(0);
          }
        },
        url: "/eventserversettings",
        cache: false,
        templateUrl: "templates/eventserversettings.html",
        controller: 'zmApp.EventServerSettingsCtrl',

      })

      .state('app.log', {
        data: {
          requireLogin: false
        },
        url: "/log",
        cache: false,
        templateUrl: "templates/log.html",
        controller: 'zmApp.LogCtrl',

      })

      .state('app.wizard', {
        data: {
          requireLogin: false
        },
        url: "/wizard",
        cache: false,
        templateUrl: "templates/wizard.html",
        controller: 'zmApp.WizardCtrl',

      })

      .state('app.zm-portal-login', {
        data: {
          requireLogin: false
        },
        url: "/zm-portal-login",
        cache: false,
        templateUrl: "templates/zm-portal-login.html",
        controller: 'zmApp.PortalLoginCtrl',
        nativeTransitions: null // disable for speed

      })

      .state('app.first-use', {
        data: {
          requireLogin: false
        },
        url: "/first-use",
        cache: false,
        templateUrl: "templates/first-use.html",
        controller: 'zmApp.FirstUseCtrl',

      })

      .state('app.montage-history', {
        data: {
          requireLogin: true
        },
        resolve: {
          message: function (NVR) {
            //console.log("Inside app.events resolve");
            return NVR.getMonitors(0);
          }

        },
        cache: false,
        url: "/montage-history",
        templateUrl: "templates/montage-history.html",
        controller: 'zmApp.MontageHistoryCtrl',
        params: {
          minimal: false,
          isRefresh: false
        },

      })

      .state('app.montage', {
        data: {
          requireLogin: true
        },
        resolve: {
          message: function (NVR) {
            //console.log("Inside app.events resolve");
            NVR.regenConnKeys();
            return NVR.getMonitors(0);
          }

        },
        url: "/montage",
        cache: false,
        nativeTransitions: null,
        templateUrl: "templates/montage.html",
        controller: 'zmApp.MontageCtrl',
        params: {
          minimal: false,
          isRefresh: false
        },

      });

    // We are NOT going to default route. Routing to a view will start on 
    // a broadcast of "init-complete" 

  }); //config
