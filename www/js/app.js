/* jshint -W041, -W093 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,alert,PushNotification, moment ,ionic, URI,Packery, ConnectSDK, CryptoJS, ContactFindOptions, localforage,$, Connection, MobileAccessibility, hello */

// For desktop versions, this is replaced
// with actual app version from config.xml by the 
// ./make_desktop.sh script

// For mobile versions, I use cordova app version plugin
// to get it at run time

var appVersion = "0.0.0";



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
    'ionic-native-transitions',
    'mgo-angular-wizard',
    'pascalprecht.translate',
    'uk.ac.soton.ecs.videogular.plugins.cuepoints',
    'dcbImgFallback',
    'ngImageAppear',
    'angular-websocket'


  ])

  // ------------------------------------------
  // Various constants central repository
  // Feel free to change them as you see fit
  //------------------------------------------------

  .constant('zm', {
    minAppVersion: '1.28.107', // if ZM is less than this, the app won't work
    recommendedAppVersion: '1.32.0',
    minEventServerVersion: '1.0',
    castAppId: 'BA30FB4C',
    alarmFlashTimer: 20000, // time to flash alarm
    gcmSenderId: '710936220256',
    httpTimeout: 15000,
    largeHttpTimeout: 60000,
    logFile: 'zmNinjaLog.txt',
    authoremail: 'pliablepixels+zmNinja@gmail.com',
    logFileMaxSize: 30000, // after this limit log gets reset

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
    loginScreenString: "var currentView = 'login'", // Isn't there a better way?
    desktopUrl: "/zm",
    desktopApiUrl: "/api/zm",
    latestRelease: "https://api.github.com/repos/pliablepixels/zmNinja/releases/latest",
    blogUrl: "https://medium.com/zmninja/latest?format=json",
    nphSwitchTimer: 3000,
    eventHistoryTimer: 5000,
    eventPlaybackQuery: 3000,

    packeryTimer: 500,
    dbName: 'zmninja',
    cipherKey: 'sdf#@#%FSXSA_AR',
    minCycleTime: 5,

    loginInterval: 1800000, //30m*60s*1000 - ZM auto login after 30 mins
    //loginInterval: 60000, // testing 1 min
    eventPlaybackQueryLowBW: 6000,
    loginIntervalLowBW: 1800000, //30m login

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
    alarmStatusTime: 10000,
    eventServerErrorDelay: 5000, // time to wait till I report initial connect errors
    zmVersionCheckNag: 60 * 24, // in hrs 
    waitTimeTillResume: 5, // in sec, for ES error
    versionWithLoginAPI: "1.31.44"

  })

  // to take care of electron changing
  // window title and going out of sync
  // seems to get stuck in mobile
  .controller('zmApp.appCtrl', function ($scope, $rootScope) {
    $scope.$on('$ionicView.afterEnter', function(ev, data) { 
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
  .filter('eventListFilter', function (NVRDataModel) {
    return function (input) {
      var ld = NVRDataModel.getLogin();
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

        if ((item.Monitor.Function != 'None') && (item.Monitor.Enabled != '0') && (item.Monitor.eventUrl != 'img/noevent.png') && (item.Monitor.listDisplay != 'noshow')) {
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
    '$http', 'imageLoadingDataShare', 'NVRDataModel',
    function ($http, imageLoadingDataShare, NVRDataModel) {
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
  .directive('imageSpinnerSrc', ['$document', '$compile', 'imageLoadingDataShare', '$timeout',
    function ($document, $compile, imageLoadingDataShare, $timeout) {
      return {
        restrict: 'A',
        scope: {
          imageSpinnerBackgroundImage: "@imageSpinnerBackgroundImage"
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
            // console.log ("DIRECTIVE: IMAGE ERROR");
            loader.remove();


            var url = 'img/novideo.png';


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
    //console.log ("HHHHHHHHHHHHHH**************************");
    //console.log ("HERE TIMEOUT");
    return {

      'request': function (config) {
        if (!config) return config;
        if (!config.url) return config;



        if ($rootScope.basicAuthHeader) {
          // console.log ("BASIC AUTH="+$rootScope.basicAuthHeader);
          config.headers.Authorization = $rootScope.basicAuthHeader;
        }


        // handle basic auth properly
        if (config.url.indexOf("@") > -1) {

          NVRDataModel.debug(">>>>>>>>>> ERROR!!!!! url has a basic auth u:p!" + config.url);

          /* var components = URI.parse(config.url);
           var credentials = btoa(components.userinfo);
           var authorization = {'Authorization': 'Basic ' + credentials};
           config.headers.Authorization = 'Basic ' + credentials;
           console.log ("Full headers: " + JSON.stringify(config.headers));
           config.url = components.scheme + "://" + components.host;
           if (components.port) config.url = config.url + ":" + components.port;
           if (components.path) config.url = config.url + components.path;

           console.log ("REWRITING URL TO: "+config.url);} */



          //console.log (">>>>>>>>>>>>> INTERCEPT OBJECT " + JSON.stringify(config));

          // if ($rootScope.zmCookie) {
          //  config.headers.Cookie = "ZMSESSID=" + // $rootScope.zmCookie;
          // console.log (">>>>> WOOOT HAVE COOKIE AND USING: "+$rootScope.zmCookie);
          // } else {
          //  console.log ("No cookie present in " + config.url);
          //   }

          // if ($rootScope.apiAuth) {
          // console.log("********** API AUTH");
          /*if (config.url.indexOf("/api/") > -1) {
            config.url = config.url + "&auth=" + $rootScope.authSession;*/
          // console.log("********** API AUTH muggled to:" + config.url);

          //     }
        }

        if ((config.url.indexOf("/api/states/change/") > -1) ||
          (config.url.indexOf("getDiskPercent.json") > -1) ||
          (config.url.indexOf("daemonCheck.json") > -1) ||
          (config.url.indexOf("getLoad.json") > -1))

        {

          // these can take time, so lets bump up timeout
          config.timeout = zm.largeHttpTimeout;

        }

        return config;
      },

      'response': function (response) {
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
        return response;
      }

    };
  }])

  //-----------------------------------------------------------------
  // This service automatically checks for new versions every 24 hrs
  //------------------------------------------------------------------
  .factory('zmCheckUpdates', function ($interval, $http, zm, $timeout, $localstorage, NVRDataModel, $rootScope, $translate) {
    var zmUpdateHandle;
    var zmUpdateVersion = "";

    function start() {
      checkUpdate();
      $interval.cancel(zmUpdateHandle);
      zmUpdateHandle = $interval(function () {
        checkUpdate();

      }, zm.updateCheckInterval);

      function checkUpdate() {
        var lastdateString = NVRDataModel.getLastUpdateCheck();
        var lastdate;
        if (!lastdateString) {

          lastdate = moment().subtract(2, 'day');

        } else {
          lastdate = moment(lastdateString);
        }
        var timdiff = moment().diff(lastdate, 'hours');
        if (timdiff < 24) {
          NVRDataModel.log("Checked for update " + timdiff + " hours ago. Not checking again");

          return;
        }
        NVRDataModel.log("Checking for new version updates...");

        $http.get(zm.latestRelease)
          .then(function (success) {

            NVRDataModel.setLastUpdateCheck(moment().toISOString());
            // $localstorage.set("lastUpdateCheck", moment().toISOString());
            //console.log ("FULL STRING " + success.data.tag_name);
            var res = success.data.tag_name.match("v(.*)");
            zmUpdateVersion = res[1];
            var currentVersion = NVRDataModel.getAppVersion();
            if ($rootScope.platformOS == "desktop") {
              zmUpdateVersion = zmUpdateVersion + "D";
            }
            //if (NVRDataModel.getAppVersion() != zmUpdateVersion) {
            if (NVRDataModel.versionCompare(NVRDataModel.getAppVersion(), zmUpdateVersion) == -1) {
              $rootScope.newVersionAvailable = "v" + zmUpdateVersion + " available";
            } else {
              $rootScope.newVersionAvailable = "";
            }
            NVRDataModel.debug("current version: " + currentVersion + " & available version " + zmUpdateVersion);
            //console.log ("Version compare returned: " + NVRDataModel.versionCompare(currentVersion, //zmUpdateVersion));
            // console.log ("Version compare returned: " + NVRDataModel.versionCompare(zmUpdateVersion, currentVersion));
            //console.log ("UPDATE " + zmVersion);
          });

        NVRDataModel.log("Checking for news updates");
        $http.get(zm.blogUrl, {
            transformResponse: function (d, h) {
              var trunc = "])}while(1);</x>";
              if (d) {
                d = d.substr(trunc.length);
              }
              return d;
            }
          })

          .success(function (datastr) {

            var data = JSON.parse(datastr);
            $rootScope.newBlogPost = "";
            if (data.payload.posts.length <= 0) {
              $rootScope.newBlogPost = "";
              return;
            }

            var lastDate = NVRDataModel.getLatestBlogPostChecked();
            //console.log ("************ BLOG LAST DATE " + lastDate);
            if (!lastDate) {

              $rootScope.newBlogPost = "(" + $translate.instant('kNewPost') + ")";
              NVRDataModel.setLatestBlogPostChecked(moment().format("YYYY-MM-DD HH:mm:ss"));
              return;

            }
            var mLastDate = moment(lastDate);
            var mItemDate = moment(data.payload.posts[0].createdAt);

            if (mItemDate.diff(mLastDate, 'seconds') > 0) {
              /*console.log ("DIFF IS "+mItemDate.diff(mLastDate, 'seconds'));
              console.log ("DIFF mLastDate="+mLastDate);
              console.log ("DIFF mItemDate="+mItemDate);
              console.log ("FORMAT DIFF mLastDate="+mLastDate.format("YYYY-MM-DD HH:mm:ss") );
              console.log ("FORMAT DIFF mItemDate="+mItemDate.format("YYYY-MM-DD HH:mm:ss") );*/

              NVRDataModel.debug("New post dated " + mItemDate.format("YYYY-MM-DD HH:mm:ss") + " found, last date checked was " + mLastDate.format("YYYY-MM-DD HH:mm:ss"));

              $rootScope.newBlogPost = "(" + $translate.instant('kNewPost') + ")";
              NVRDataModel.setLatestBlogPostChecked(mItemDate.format("YYYY-MM-DD HH:mm:ss"));



            } else {
              NVRDataModel.debug("Latest post dated " + mItemDate.format("YYYY-MM-DD HH:mm:ss") + " but you read " + lastDate);
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

  .factory('zmAutoLogin', function ($interval, NVRDataModel, $http, zm, $browser, $timeout, $q, $rootScope, $ionicLoading, $ionicPopup, $state, $ionicContentBanner, EventServer, $ionicHistory, $translate) {
    var zmAutoLoginHandle;

    //------------------------------------------------------------------
    // doLogin() emits this when there is an auth error in the portal
    //------------------------------------------------------------------

    $rootScope.$on("auth-error", function () {

      NVRDataModel.debug("zmAutoLogin: Inside auth-error broadcast");
      NVRDataModel.displayBanner('error', ['ZoneMinder authentication failed', 'Please check settings']);

    });

    //------------------------------------------------------------------
    // broadcasted after :
    // a) device is ready
    // b) language loaded
    // c) localforage data loaded
    //------------------------------------------------------------------

    $rootScope.$on("init-complete", function () {
      NVRDataModel.log("Inside init-complete in app.js: All init over, going to portal login");
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
      var contentBannerInstance = $ionicContentBanner.show({
        text: ['ZoneMinder' + $translate.instant('kAuthSuccess')],
        interval: 2000,
        type: 'info',
        transition: 'vertical'
      });

      $timeout(function () {
        contentBannerInstance();
      }, 2000);
      NVRDataModel.debug("auth-success broadcast:Successful");
    });

    $rootScope.getProfileName = function () {
      var ld = NVRDataModel.getLogin();
      return (ld.serverName || '(none)');
    };

    $rootScope.getLocalTimeZone = function () {
      return moment.tz.guess();
    };

    $rootScope.getServerTimeZoneNow = function () {

      return NVRDataModel.getTimeZoneNow();

    };

    $rootScope.isTzSupported = function () {
      return NVRDataModel.isTzSupported();
    };

    //------------------------------------------------------------------
    // doLogin() is the function that tries to login to ZM
    // it also makes sure we are not back to the same page
    // which actually means auth failed, but ZM treats it as a success
    //------------------------------------------------------------------


    function doLogoutAndLogin(str) {
      return NVRDataModel.logout()
        .then(function (ans) {
          return doLogin(str);

        });
    }


    function doLogin(str) {
      var d = $q.defer();
      var ld = NVRDataModel.getLogin();

      var statename = $ionicHistory.currentStateName();

      if (statename == "montage-history") {
        NVRDataModel.log("Skipping login process as we are in montage history. Re-logging will mess up the stream");
        d.resolve("success");
        return d.promise;

      }

      if ($rootScope.isDownloading) {
        NVRDataModel.log("Skipping login process as we are downloading...");
        d.resolve("success");
        return d.promise;
      }

      NVRDataModel.debug("Resetting zmCookie...");
      $rootScope.zmCookie = '';
      // first try to login, if it works, good
      // else try to do reachability

      //console.log(">>>>>>>>>>>> CALLING DO LOGIN");
      proceedWithLogin()
        .then(function (success) {

            NVRDataModel.debug("Storing login time as " + moment().toString());
            localforage.setItem("lastLogin", moment().toString());
            d.resolve(success);
            return d.promise;
          },
          function (error)
          // login to main failed, so try others
          {
            NVRDataModel.debug(">>>>>>>>>>>> Failed  first login, trying reachability");
            NVRDataModel.getReachableConfig(true)
              .then(function (data) {
                  proceedWithLogin()
                    .then(function (success) {
                        d.resolve(success);
                        return d.promise;
                      },
                      function (error) {
                        d.reject(error);
                        return d.promise;
                      });

                },
                function (error) {
                  d.reject(error);
                  return d.promise;
                });

          });

      return d.promise;



      function proceedWithLogin() {
        // recompute rand anyway so even if you don't have auth
        // your stream should not get frozen
        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
        $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);

        // console.log ("***** STATENAME IS " + statename);

        var d = $q.defer();
        var ld = NVRDataModel.getLogin();
        NVRDataModel.log("zmAutologin called");


        // This is a good time to check if auth is used :-p
        if (!ld.isUseAuth) {
          NVRDataModel.log("Auth is disabled, setting authSession to empty");
          $rootScope.apiValid = true;
          $rootScope.authSession = '';
          d.resolve("Login Success");

          $rootScope.$broadcast('auth-success', 'no auth');
          return (d.promise);

        }

        if (str) {
          $ionicLoading.show({
            template: str,
            noBackdrop: true,
            duration: zm.httpTimeout
          });
        }

        //console.log(">>>>>>>>>>>>>> ISRECAPTCHA");

        var loginData = NVRDataModel.getLogin();
        var currentServerVersion = NVRDataModel.getCurrentServerVersion();


        //first login using new API
        var loginAPI = loginData.apiurl + '/host/login.json';

        $http({
          method:'POST',
          url: loginAPI,
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          transformRequest: function(obj) {
            var str = [];
            for(var p in obj)
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            return str.join("&");
          },
          data: {user: loginData.username, pass: loginData.password}
        })
        //$http.get(loginAPI)
          .then(function (succ) {

               
                if (!succ.data.version) {

                  NVRDataModel.debug ("API login returned fake success, going back to webscrape");
                  var ld = NVRDataModel.getLogin();
                  ld.loginAPISupported = false;
                  NVRDataModel.setLogin(ld);
            
                   loginWebScrape()
                   .then ( function (succ) {
                      d.resolve("Login Success");
                      return d.promise;
                   },
                  function (err) {
                    d.reject("Login Error");
                    return (d.promise);
                  });
                  return d.promise;
                }
                NVRDataModel.debug ("API based login returned... ");
                NVRDataModel.setCurrentServerVersion(succ.data.version);
                $ionicLoading.hide();
                $rootScope.loggedIntoZm = 1;
                $rootScope.authSession = ''; 

                if (succ.data.credentials) {
                  $rootScope.authSession = "&" + succ.data.credentials;
                  if (succ.data.append_password == '1') {
                    $rootScope.authSession = $rootScope.authSession +
                      loginData.password;
                  }
                }
                
                var ldg = NVRDataModel.getLogin();
                ldg.loginAPISupported = true;
                NVRDataModel.setLogin(ldg);
                
                NVRDataModel.log("Stream authentication construction: " +
                $rootScope.authSession);

                NVRDataModel.log("zmAutologin successfully logged into Zoneminder via API");

              

                d.resolve("Login Success");

                $rootScope.$broadcast('auth-success', succ);

            },
            function (err) {
              console.log("******************* API login error " + JSON.stringify(err));
              $ionicLoading.hide();


              if ('success' in err.data) {
                console.log("API based login not supported, need to use web scraping...");
                // login using old web scraping
                var ld = NVRDataModel.getLogin();
                ld.loginAPISupported = false;
                NVRDataModel.setLogin(ld);
                loginWebScrape()
                .then ( function (succ) {
                   d.resolve("Login Success");
                   return d.promise;
                },
               function (err) {
                 d.reject("Login Error");
                 return (d.promise);
               });


              }  
              else {
                 $rootScope.loggedIntoZm = -1;
              //console.log("**** ZM Login FAILED");
              NVRDataModel.log("zmAutologin Error via API: some meta foo", "error");
              $rootScope.$broadcast('auth-error', "I'm confused why");

              d.reject("Login Error");
              return (d.promise);

              }

             
            }
          );



        return d.promise;
      }

      return d.promise;

    }

    function loginWebScrape() {
      var loginData = NVRDataModel.getLogin();
      var d = $q.defer();
      NVRDataModel.debug("Logging in using old web-scrape method");
      NVRDataModel.isReCaptcha()
        .then(function (result) {
          if (result == true) {
            $ionicLoading.hide();
            NVRDataModel.displayBanner('error', ['reCaptcha must be disabled', ], "", 8000);
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

            d.reject("Error-disable recaptcha");
            return (d.promise);
          }

        });

      var hDelay = loginData.enableSlowLoading ? zm.largeHttpTimeout : zm.httpTimeout;
      //NVRDataModel.debug ("*** AUTH LOGIN URL IS " + loginData.url);
      $http({

          method: 'POST',
          timeout: hDelay,
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
          // console.log(">>>>>>>>>>>>>> PARALLEL POST SUCCESS");
          $ionicLoading.hide();

          // Coming here does not mean success
          // it could also be a bad login, but
          // ZM returns you to login.php and returns 200 OK
          // so we will check if the data has
          // <title>ZM - Login</title> -- it it does then its the login page

          if (data.indexOf(zm.loginScreenString) == -1) {
            //eventServer.start();
            $rootScope.loggedIntoZm = 1;

            NVRDataModel.log("zmAutologin successfully logged into Zoneminder");
            $rootScope.apiValid = true;

            // now go to authKey part, so don't return yet...

          } else //  this means login error
          {
            $rootScope.loggedIntoZm = -1;
            //console.log("**** ZM Login FAILED");
            NVRDataModel.log("zmAutologin Error: Bad Credentials ", "error");
            $rootScope.$broadcast('auth-error', "incorrect credentials");

            d.reject("Login Error");
            return (d.promise);
            // no need to go to next code, so return above
          }

          // Now go ahead and re-get auth key 
          // if login was a success
          $rootScope.authSession = "undefined";
          var ld = NVRDataModel.getLogin();
          NVRDataModel.getAuthKey($rootScope.validMonitorId)
            .then(function (success) {

                //console.log(success);
                $rootScope.authSession = success;
                NVRDataModel.log("Stream authentication construction: " +
                  $rootScope.authSession);
                  d.resolve("Login Success");
                  $rootScope.$broadcast('auth-success', data);
                  return d.promise;

              },
              function (error) {
                //console.log(error);

                NVRDataModel.log("Modal: Error returned Stream authentication construction. Retaining old value of: " + $rootScope.authSession);
                NVRDataModel.debug("Error was: " + JSON.stringify(error));
                d.resolve("Login Success");
                $rootScope.$broadcast('auth-success', data);
              });

          return (d.promise);

        })
        .error(function (error, status) {

          // console.log(">>>>>>>>>>>>>> PARALLEL POST ERROR");
          $ionicLoading.hide();

          //console.log("**** ZM Login FAILED");

          // FIXME: Is this sometimes results in null

          NVRDataModel.log("zmAutologin Error " + JSON.stringify(error) + " and status " + status);
          // bad urls etc come here
          $rootScope.loggedIntoZm = -1;
          $rootScope.$broadcast('auth-error', error);

          d.reject("Login Error");
          return d.promise;
        });
        return d.promise;
    }

    function start() {
      var ld = NVRDataModel.getLogin();
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
      var ld = NVRDataModel.getLogin();

      $interval.cancel(zmAutoLoginHandle);
      $rootScope.loggedIntoZm = 0;
      NVRDataModel.log("Cancelling zmAutologin timer");

    }

    return {
      start: start,
      stop: stop,
      doLogin: doLogoutAndLogin
    };
  })

  //====================================================================
  // First run in ionic
  //====================================================================

  .run(function ($ionicPlatform, $ionicPopup, $rootScope, zm, $state, $stateParams, NVRDataModel, $cordovaSplashscreen, $http, $interval, zmAutoLogin, zmCheckUpdates, $fileLogger, $timeout, $ionicHistory, $window, $ionicSideMenuDelegate, EventServer, $ionicContentBanner, $ionicLoading, $ionicNativeTransitions, $translate, $localstorage) {


    $ionicPlatform.ready(function () {
      //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>INSIDE RUN");

      $fileLogger.setStorageFilename(zm.logFile);
      $fileLogger.setTimestampFormat('MMM d, y ' + NVRDataModel.getTimeFormatSec());

      $fileLogger.checkFile().then(function (resp) {
        if (parseInt(resp.size) > zm.logFileMaxSize) {
          //console.log("inside file logger");

          $fileLogger.deleteLogfile().then(function () {
            NVRDataModel.log("Deleting old log file as it exceeds " + zm.logFileMaxSize + " bytes");

          });
        }
      });




      $rootScope.dpadId = 0;
      $rootScope.textScaleFactor = 1.0;
      $rootScope.isLoggedIn = false;
      $rootScope.apiValid = false;

      $rootScope.db = null;
      $rootScope.runMode = NVRDataModel.getBandwidth();

      $rootScope.platformOS = "desktop";
      NVRDataModel.log("Device is ready");


      // var ld = NVRDataModel.getLogin();
      if ($ionicPlatform.is('ios'))
        $rootScope.platformOS = "ios";
      if ($ionicPlatform.is('android'))
        $rootScope.platformOS = "android";

      NVRDataModel.log("You are running on " + $rootScope.platformOS);

      if (1) {
        console.log ("Will deep code detect this?");
      }
      else {
        console.log ("You know it will never reach here");
        also add a syntax error;
      }


      /*if (window.cordova && $rootScope.platformOS == 'android') {

        cordova.plugins.diagnostic.isExternalStorageAuthorized(function (authorized) {
          if (!authorized) cordova.plugins.diagnostic.requestExternalStorageAuthorization(okperm, nopermerr);
        }, function (err) {
          console.log("diagnostic external storage error " + err);
        });


      }*/


      function nopermerr() {
        NVRDataModel.displayBanner('error', ['Storage permission must be allowed'], "", 4000);
      }

      function okperm() {
        //console.log("cool");
        NVRDataModel.displayBanner('success', ['Storage permission acquired'], "", 4000);
      }

      $rootScope.appName = "zmNinja";
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
        NVRDataModel.log("user exited app");

        //window.stop();
        ionic.Platform.exitApp();
        //navigator.app.exitApp();

      };

      // This is a global exception interceptor
      $rootScope.exceptionMessage = function (error) {
        NVRDataModel.debug("**EXCEPTION**" + error.reason + " caused by " + error.cause);
      };

      if ($rootScope.platformOS == 'desktop') {

        window.addEventListener('beforeunload', function (ev) {

          // This was causing android reload issues - holy palooza
          /* if ($rootScope.platformOS != 'desktop') {
             ev.returnValue = "true";
             return;
           }*/

          localforage.setItem('last-desktop-state', {
            'name': $ionicHistory.currentView().stateName,
            'params': $ionicHistory.currentView().stateParams
          }).then(function () {
            return localforage.getItem('last-desktop-state');
          }).then(function (value) {
            ev.returnValue = "true";
          }).catch(function (err) {
            ev.returnValue = "true";
          });

        });
      }

      // DPAD Handler - disabled for now
      // when ready add ionic cordova plugin add https://github.com/pliablepixels/cordova-plugin-android-tv.git

      // console.log (JSON.stringify(ionic.Platform.device()));
      /*  if (0 && $ionicPlatform.is('android')) {
          window.addEventListener('keydown', dPadHandler, true);
        } else {
          NVRDataModel.log("Not registering D-PAD handler, as you are not on android");
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
            console.log("dpad State is: " + $rootScope.dpadState);
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
              console.log("dpadID=" + $rootScope.dpadId + " with state=" + $rootScope.dpadState);
            }
            handled = true;
          }


          return handled;

        });
      }

      // register callbacks for online/offline
      // lets see if it really works
      $rootScope.online = navigator.onLine;

      document.addEventListener("offline", function () {
        //console.log ("OFFLINE------------------------------------");
        $timeout(function () {
          $rootScope.online = false;
          NVRDataModel.log("Your network went offline");

          //$rootScope.$emit('network-change', "offline");

        });
      }, false);

      document.addEventListener("online", function () {
        //console.log ("ONLINE------------------------------------");
        $timeout(function () {
          NVRDataModel.log("Your network came back online");

          $rootScope.online = true;

          $timeout(function () {
            var networkState = "browser not supported";
            if (navigator.connection) networkState = navigator.connection.type;
            NVRDataModel.debug("Detected network type as: " + networkState);
            var strState = NVRDataModel.getBandwidth();
            NVRDataModel.debug("getBandwidth() normalized it as: " + strState);
            $rootScope.runMode = strState;
            if ((NVRDataModel.getLogin().autoSwitchBandwidth == true) &&
              (NVRDataModel.getLogin().enableLowBandwidth == true)) {
              NVRDataModel.debug("Setting app state to: " + strState);
              $rootScope.$broadcast('bandwidth-change', strState);
            } else {
              NVRDataModel.debug("Not changing bandwidth state, as auto change is not on");
            }

          }, 1000); // need a time gap, seems network type registers late

          NVRDataModel.log("Your network is online, re-authenticating");
          zmAutoLogin.doLogin($translate.instant('kReAuthenticating'));

        });
      }, false);

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
        var pixelRatio = window.devicePixelRatio || 1;
        $rootScope.pixelRatio = pixelRatio;
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
        NVRDataModel.log("User cancelled login");
        $ionicHistory.nextViewOptions({
          disableAnimate: true,
          disableBack: true
        });
        $rootScope.userCancelledAuth = true;
        window.stop();

        //console.log ("inside cancelAuth , calling wizard");
        $state.go("app.login", {
          "wizard": false
        });
        return;
      };

      //---------------------------------------------------------------------------
      // authorize state transitions
      //----------------------------------------------------------------------------

      $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {
        var requireLogin = toState.data.requireLogin;

        $rootScope.dpadId = 0;

        //console.log("HERE");

        if ($rootScope.apiValid == false && toState.name != 'app.invalidapi' && toState.data.requireLogin == true) {
          event.preventDefault();
          $rootScope.dpadState = "app.invalidapi";
          $state.transitionTo('app.invalidapi');
          return;

        }

        if (NVRDataModel.hasLoginInfo() || toState.data.requireLogin == false) {
          //console.log("State transition is authorized");
          $rootScope.dpadState = toState.name.replace("app.", "");
          return;
        } else {
          NVRDataModel.log("In Auth State trans: Not logged in, requested to go to " + JSON.stringify(toState));
          // event.preventDefault();
          // 

          $rootScope.dpadState = "login";
          $state.transitionTo('login');

        }

        if (requireLogin) {

          $ionicPopup.alert({
            title: $translate.instant('kCredentialsTitle'),
            template: $translate.instant('kCredentialsBody')
          });
          // for whatever reason, .go was resulting in digest loops.
          // if you don't prevent, states will stack
          event.preventDefault();
          $rootScope.dpadState = "login";
          $state.transitionTo('app.login');
          return;
        }

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
        NVRDataModel.debug("text zoom factor is " + $rootScope.textScaleFactor);
      }

      // $ionicPlatform.ready(function () {





      // handles URL launches

      window.handleOpenURL = function (url) {
        $rootScope.tappedNotification = 2; // 1 is push
        $rootScope.tappedMid = 0;
        var c = URI.parse(url);
        //NVRDataModel.log ("***********launched with "+ JSON.stringify(c));
        if (c.query) {
          var qm = getQueryVariable(c.query, "mid");
          var qe = getQueryVariable(c.query, "eid");
          if (qe) $rootScope.tappedEid = parseInt(qe);
          if (qm) $rootScope.tappedMid = parseInt(qm);
          NVRDataModel.log("external URL called with MID=" + $rootScope.tappedMid + " and/or EID=" + $rootScope.tappedEid);
          //console.log (">>>>>>>>> EID="+getQueryVariable(c.query, "eid"));

        }



      };


      //console.log("Mobile acc");
      if (window.cordova)
        MobileAccessibility.getTextZoom(getTextZoomCallback);

      // $rootScope.lastState = "events";
      //$rootScope.lastStateParam = "0";

      //console.log("localforage config");
      NVRDataModel.configureStorageDB()
        .then(function () {
          // this should alert "cordovaSQLiteDriver" when in an emulator or a device
          NVRDataModel.log("localforage driver for storage:" + localforage.driver());

          // Now lets import old data if it exists:
          var defaultServerName = $localstorage.get("defaultServerName");

          localforage.getItem("defaultServerName")
            .then(function (val) {
              //  console.log (">>>> localforage reported defaultServerName as " + val);
              // if neither, we are in first use, mates!
              if (!val && !defaultServerName) {
                continueInitialInit();
                /*  NVRDataModel.debug ("Neither localstorage or forage  - First use, showing warm and fuzzy...");
                      $ionicHistory.nextViewOptions({
                          disableAnimate: true,
                          disableBack: true
                      });
                      $state.go('first-use');*/
              } else if (!val && defaultServerName) {
                NVRDataModel.log(">>>>Importing data from localstorage....");

                var dsn = defaultServerName;
                var dl = $localstorage.get('defaultLang') || 'en';
                var ifu = ($localstorage.get('isFirstUse') == '0' ? false : true);
                var luc = $localstorage.get('lastUpdateCheck');
                var lbpc = $localstorage.get('latestBlogPostChecked');
                var sgl = $localstorage.getObject('serverGroupList');

                NVRDataModel.log(">>>Localstorage data found as below:");
                NVRDataModel.log("server name:" + dsn);
                NVRDataModel.log("default lang :" + dl);
                NVRDataModel.log("is first use:" + ifu);
                NVRDataModel.log("last update check:" + luc);
                NVRDataModel.log("latest blog post check:" + lbpc);
                NVRDataModel.log("server group list:" + JSON.stringify(sgl));

                localforage.setItem('defaultLang', dl)
                  .then(function () {

                    NVRDataModel.log(">>>>migrated defaultLang...");
                    NVRDataModel.setFirstUse(ifu);
                    NVRDataModel.log("migration: setting isFirstUse = " + ifu);
                    return localforage.setItem('isFirstUse', ifu);
                  })
                  .then(function () {
                    NVRDataModel.log(">>>>migrated isFirstUse...");
                    return localforage.setItem('lastUpdateCheck', ifu);
                  })
                  .then(function () {
                    NVRDataModel.log(">>>>migrated lastUpdateCheck...");
                    return localforage.setItem('latestBlogPostChecked', lbpc);
                  })
                  .then(function () {
                    NVRDataModel.log(">>>>migrated latestBlogPostChecked...");
                    // lets encrypt serverGroupList
                    NVRDataModel.log("server group list is " + JSON.stringify(sgl));
                    var ct = CryptoJS.AES.encrypt(JSON.stringify(sgl), zm.cipherKey);
                    NVRDataModel.log("encrypted server group list is " + ct);
                    ct = sgl;
                    return localforage.setItem('serverGroupList', ct);
                  })
                  .then(function () {
                    NVRDataModel.log(">>>>migrated serverGroupList...");
                    return localforage.setItem('defaultServerName', dsn);
                  })
                  .then(function () {
                    NVRDataModel.log(">>>>migrated defaultServerName...");
                    NVRDataModel.log(">>>>Migrated all values, continuing...");
                    //NVRDataModel.migrationComplete();
                    continueInitialInit();
                  })
                  .catch(function (err) {
                    NVRDataModel.log("Migration error : " + JSON.stringify(err));
                    continueInitialInit();
                  });

              } else {
                NVRDataModel.log(">>>>No data to import....");
                //NVRDataModel.migrationComplete();
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

        if (window.cordova && window.cordova.plugins.Keyboard) {
          // console.log("no keyboard");
          // cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
          // org.apache.cordova.statusbar required
          //  console.log("statusbar");
          NVRDataModel.log("Updating statusbar");
          StatusBar.styleDefault();
          if ($rootScope.platformOS == 'ios') {
            // console.log ("<<<<<<<<<<<<<<<< OVERLAY");
            StatusBar.overlaysWebView(false);
          }

          StatusBar.backgroundColorByHexString("#2980b9");
        }

        if (window.cordova) {
          // console.log("Hiding splash");
          $cordovaSplashscreen.hide();



          // console.log("app version");
          cordova.getAppVersion.getVersionNumber().then(function (version) {
            appVersion = version;
            NVRDataModel.log("App Version: " + appVersion);
            NVRDataModel.setAppVersion(appVersion);
          });
        }

        // console.log("file logger");

        if (NVRDataModel.getLogin().disableNative) {
          NVRDataModel.log("Disabling native transitions...");
          $ionicNativeTransitions.enable(false);
        } else {
          NVRDataModel.log("Enabling native transitions...");
          $ionicNativeTransitions.enable(true);
        }
        // At this stage, DataModel.init is not called yet
        // but I do need to know the language

        NVRDataModel.log("Retrieving language before init is called...");
        localforage.getItem("defaultLang")
          .then(function (val) {

            var lang = val;
            //console.log (">>>>>>>>>>>>>> LANG IS " + val);

            if (lang == undefined || lang == null) {
              NVRDataModel.log("No language set, switching to en");
              lang = "en";

            } else {
              NVRDataModel.log("Language stored as:" + lang);

            }

            NVRDataModel.setDefaultLanguage(lang, false)
              .then(function (success) {
                NVRDataModel.log(">>>>Language to be used:" + $translate.proposedLanguage());
                moment.locale($translate.proposedLanguage());

                // Remember this is before data Init
                // so I need to do a direct forage fetch
                localforage.getItem("isFirstUse")
                  .then(function (val) {
                    //console.log ("isFirstUse is " + val);
                    NVRDataModel.debug("isFirstUse returned: " + val);
                    if (val == null || val == true) {
                      NVRDataModel.log("First time detected ");
                      $state.go("app.first-use");
                      return;
                      //continueRestOfInit();
                    } else {
                      continueRestOfInit();
                    }

                  });

              });
          });
      }

      function continueRestOfInit() {

        if ($rootScope.platformOS == 'desktop') {
          $rootScope.lastState = "";
          $rootScope.lastStateParam = {};

          localforage.getItem('last-desktop-state')
            .then(function (succ) {
              //console.log ("FOUND  STATE" + JSON.stringify(succ) + ":"+succ);
              if (succ) {
                if (succ.name == 'app.invalidapi' || succ.name == 'app.refresh' || succ.name == 'app.importantmessage') {
                  succ.name = 'app.montage';
                }
                $rootScope.lastState = succ.name;
                if ($rootScope.lastState.indexOf("app.") == -1) {
                  $rootScope.lastState = "app." + $rootScope.lastState;
                }
                $rootScope.lastStateParam = succ.params;


                NVRDataModel.debug("last state=" + $rootScope.lastState + " param=" + $rootScope.lastStateParam);

              }
              loadServices();
            }, function (err) {
              //console.log("ERR " + JSON.stringify(err));
              loadServices();
            });
        } else

        {

          loadServices();
        }

        function loadServices() {
          NVRDataModel.log("Language file loaded, continuing with rest");
          NVRDataModel.init();


          zmCheckUpdates.start();
          NVRDataModel.log("Setting up POST LOGIN timer");
          zmAutoLogin.start();
          setupPauseAndResume();



        }

      }


      function setupPauseAndResume() {
        NVRDataModel.log("Setting up pause and resume handler AFTER language is loaded...");
        //---------------------------------------------------------------------------
        // resume handler
        //----------------------------------------------------------------------------
        document.addEventListener("resume", function () {

          NVRDataModel.setBackground(false);
          NVRDataModel.setJustResumed(true);
          $ionicPlatform.ready(function () {
            NVRDataModel.log("App is resuming from background");
            $rootScope.isDownloading = false;

            var ld = NVRDataModel.getLogin();


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
              NVRDataModel.debug("Last State recorded:" +
                JSON.stringify($ionicHistory.currentView()));

              if ($rootScope.lastState == "app.zm-portal-login") {
                NVRDataModel.debug("Last state was portal-login, so forcing montage");
                $rootScope.lastState = "app.montage";
              }

              NVRDataModel.debug("going to portal login");
              $ionicHistory.nextViewOptions({
                disableAnimate: true
              });
              $state.go("app.zm-portal-login");
              return;
            } else {
              $rootScope.lastState = "";
              $rootScope.lastStateParam = "";
              NVRDataModel.debug("reset lastState to null");
              $ionicHistory.nextViewOptions({
                disableAnimate: true
              });
              $state.go("app.zm-portal-login");
              return;
            }


          });
        }, false);

        //---------------------------------------------------------------------------
        // background handler
        //----------------------------------------------------------------------------
        document.addEventListener("pause", function () {
          NVRDataModel.setBackground(true);
          NVRDataModel.setJustResumed(false);
          // NVRDataModel.setJustResumed(true); // used for window stop

          NVRDataModel.log("ROOT APP:App is going into background");
          EventServer.disconnect();

          $interval.cancel($rootScope.eventQueryInterval);
          $interval.cancel($rootScope.intervalHandle);
          zmAutoLogin.stop();



          // NVRDataModel.log("ROOT APP: Stopping network ");
          //NVRDataModel.stopNetwork("called from app.js");

          // dont call stopNetwork - we need to stop here 

          var ld = NVRDataModel.getLogin();


          if ($rootScope.platformOS == "android") {
            NVRDataModel.log(" force exiting app since its android");
            navigator.app.exitApp();
            $timeout(function () {
              if (NVRDataModel.isBackground()) {
                NVRDataModel.log("If this shows up, then the app did not exit...");
                window.stop();
              } else {
                NVRDataModel.log("window stop delay timeout called as part of pause, but app no longer in background");
              }


            }, 5000);
          }



          /* if (ld.exitOnSleep && $rootScope.platformOS == "android") {
             NVRDataModel.log("user exited app");
             navigator.app.exitApp();

             //  ionic.Platform.exitApp();
           }*/

          /*   if (NVRDataModel.getCurrentServerMultiPortSupported() && $rootScope.platformOS == "android" && !NVRDataModel.isMultiPortDisabled()) {
               NVRDataModel.log ("Multiport is active, killing app to make sure no streams continue in background...");
               navigator.app.exitApp();
             } else {
               NVRDataModel.debug ("Not exiting app because:");
               NVRDataModel.debug ("getCurrentServerMultiPortSupported:"+NVRDataModel.getCurrentServerMultiPortSupported());
               NVRDataModel.debug ("platform:"+$rootScope.platformOS);
               NVRDataModel.debug ("isMultiPortDisabled:"+NVRDataModel.isMultiPortDisabled());

             }*/

          if ($rootScope.zmPopup)
            $rootScope.zmPopup.close();

        }, false);

      }

      // URL interceptor


    }); //platformReady

  }) //run

  //------------------------------------------------------------------
  // Route configuration
  //------------------------------------------------------------------

  // My route map connecting menu options to their respective templates and controllers
  .config(function ($stateProvider, $urlRouterProvider, $httpProvider, $ionicConfigProvider, $provide, $compileProvider, $ionicNativeTransitionsProvider, $logProvider, $translateProvider) {

    //$logProvider.debugEnabled(false);
    //$compileProvider.debugInfoEnabled(false);

    // This is an exception interceptor so it can show up in app logs 
    // if they occur. I suspect digest and other errors will be useful
    // for me to see
    //$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|cdvphotolibrary):/);

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
    //$ionicConfigProvider.backButton.text('').icon('ion-chevron-left');
    //$ionicConfigProvider.backButton.text('').icon('ion-chevron-left').previousTitleText(false);
    // use overflow-scroll=false in ion-content
    // removing it here doesn't allow you to enable it per view
    // so it messes up scrolldelegate zoom and possibly others
    //$ionicConfigProvider.scrolling.jsScrolling(false);
    $compileProvider.debugInfoEnabled(false);

    $ionicNativeTransitionsProvider.setDefaultOptions({
      duration: 250,
    });

    $translateProvider.useStaticFilesLoader({
      prefix: 'lang/locale-',
      suffix: '.json'
    });

    //$translateProvider.useLocalStorage();

    $translateProvider.registerAvailableLanguageKeys(['en', 'de', 'es', 'fr', 'it', 'ru', 'ja', 'ko', 'nl', 'pl', 'zh', 'zh_CN', 'zh_TW', 'pt', 'ar', 'hi', 'hu'], {
      'en_*': 'en',
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


      .state('app.news', {
        data: {
          requireLogin: false
        },
        url: "/news",
        cache: false,
        templateUrl: "templates/news.html",
        controller: 'zmApp.NewsCtrl',

      })

      .state('app.monitors', {
        data: {
          requireLogin: true
        },
        resolve: {
          message: function (NVRDataModel) {
            // console.log("Inside app.montage resolve");
            return NVRDataModel.getMonitors(0);
          }
        },
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
          message: function (NVRDataModel) {
            //console.log("Inside app.events resolve");
            return NVRDataModel.getMonitors(0);
          }
        },
        cache: false,
        url: "/events/:id/:playEvent",
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
        url: "/importantmessage/:ver",
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
          message: function (NVRDataModel) {
            //console.log("Inside app.events resolve");
            return NVRDataModel.getMonitors(0);
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
          message: function (NVRDataModel) {
            //console.log("Inside app.events resolve");
            return NVRDataModel.getMonitors(0);
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
          message: function (NVRDataModel) {
            return NVRDataModel.getMonitors(0);
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
          message: function (NVRDataModel) {
            //console.log("Inside app.events resolve");
            return NVRDataModel.getMonitors(0);
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
          message: function (NVRDataModel) {
            //console.log("Inside app.events resolve");
            NVRDataModel.regenConnKeys();
            return NVRDataModel.getMonitors(0);
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
