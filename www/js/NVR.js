/* jshint -W041 */

/* jslint browser: true*/
/* global cordova,StatusBar,angular,console, URI, moment, localforage, CryptoJS, Connection, LZString */

// This is my central data respository and common functions
// that many other controllers use
// It's grown over time. I guess I may have to split this into multiple services in the future

angular.module('zmApp.controllers')

  .service('NVR', ['$ionicPlatform', '$http', '$q', '$ionicLoading', '$ionicBackdrop', '$fileLogger', 'zm', '$rootScope', '$ionicContentBanner', '$timeout', '$cordovaPinDialog', '$ionicPopup', '$localstorage', '$state', '$translate', '$cordovaSQLite',
    function ($ionicPlatform, $http, $q, $ionicLoading, $ionicBackdrop, $fileLogger,
      zm, $rootScope, $ionicContentBanner, $timeout, $cordovaPinDialog,
      $ionicPopup, $localstorage, $state, $translate, $cordovaSQLite ) {

      var currentServerMultiPortSupported = false;
      var tokenExpiryTimer = null;

      /*
        DO NOT TOUCH zmAppVersion
        It is changed by sync_version.sh
      */
      var zmAppVersion = "1.4.003";
     
      var isBackground = false;
      var justResumed = false;
      var timeSinceResumed = -1;
      var monitorsLoaded = 0;
      var snapshotFrame = 1; // will be 'snapshot'
      // if ZM >= 1.31



      var monitors = [];
      var multiservers = [];

      var migrationComplete = false;

      var tz = "";
      var isTzSupported = false;

      var languages = [{
          text: 'English',
          value: 'en'
        },
        {
          text: 'العربية',
          value: 'ar'
        },
        {
          text: 'Bosnian',
          value: 'ba'
        },
        {
          text: '简体中文',
          value: 'zh_CN'
        },
        {
          text: 'Deutsch',
          value: 'de'
        },
        {
          text: 'Español',
          value: 'es'
        },

        {
          text: 'Français',
          value: 'fr'
        },

        {
          text: 'Italiano',
          value: 'it'
        },
        {
          text: 'Magyar',
          value: 'hu'
        },
        {
          text: 'Nederlands',
          value: 'nl'
        },
        {
          text: 'Polski',
          value: 'pl'
        },
        {
          text: 'Portugese',
          value: 'pt'
        },
        {
          text: 'Русский',
          value: 'ru'
        },
        {
          text: 'Swedish',
          value: 'se'
        },

      ];

      var serverGroupList = {};
      var defaultLang = 'en';
      var isFirstUse = true;
      var lastUpdateCheck = null;
      var latestBlogPostChecked = null;
      var loginData = {
        'serverName': '',
        'username': '',
        'password': '',
        'fallbackConfiguration': '',
        'url': '', // This is the ZM portal path
        'apiurl': '', // This is the API path
        'eventServer': '', //experimental Event server address
        'maxMontage': "100", //total # of monitors to display in montage
        'streamingurl': "",
        'maxFPS': "3", // image streaming FPS
        'montageQuality': "50", // montage streaming quality in %
        'singleImageQuality': "100", // event single streaming quality in %
        'monSingleImageQuality': "100", // live view quality
        'montageHistoryQuality': "50",
        'useSSL': false, // "1" if HTTPS --> not used #589
        'keepAwake': true, // don't dim/dim during live view
        'isUseAuth': true, // true if user wants ZM auth
        'isUseBasicAuth': false,
        'basicAuthUser': '',
        'basicAuthPassword': '',
        'isUseEventServer': false, // true if you configure the websocket event server
        'disablePush': false, // true if only websocket mode is desired
        'eventServerMonitors': '', // list of monitors to notify from ES
        'eventServerInterval': '', // list of intervals for all monitors
        'refreshSec': '2', // timer value for frame change in sec 
        'refreshSecLowBW': 8,
        'singleliveFPS':'',
        'montageliveFPS':'',
        'enableLogs': true,
        'enableDebug': true, // if enabled with log messages with "debug"
        'usePin': false,
        'pinCode': '',
        'canSwipeMonitors': true,
        'persistMontageOrder': false,
        'onTapScreen': "",
        'enableh264': true,
        'gapless': false,
        'montageOrder': '',
        'montageHiddenOrder': '',
        'montageArraySize': '0',
        'showMontageSubMenu': false,
        'graphSize': 2000,
        'enableAlarmCount': true,
        'minAlarmCount': 1,
        'montageSize': '3',
        'useNphZms': true,
        'useNphZmsForEvents': true,
        'packMontage': false,
        'exitOnSleep': false,
        'forceNetworkStop': false,
        'defaultPushSound': false,
        'enableBlog': true,
        'use24hr': false,
        'packeryPositions': '',
        'currentMontageProfile': '',
        'packeryPositionsArray': {},
        'EHpackeryPositions': '',
        'packerySizes': '',
        'timelineModalGraphType': 'all',
        'resumeDelay': 0,
        'language': 'en',
        'reachability': true,
        'forceImageModePath': false,
        'vibrateOnPush': true,
        'soundOnPush': true,
        'cycleMonitors': false,
        'cycleMontage': false,
        'cycleMontageInterval': 10, // 10sec
        'cycleMonitorsInterval': 10, // 10sec
        'enableLowBandwidth': false,
        'autoSwitchBandwidth': false,
        'disableAlarmCheckMontage': false,
        'useLocalTimeZone': true,
        'fastLogin': true,
        'followTimeLine': false,
        'timelineScale': -1,
        'hideArchived': false,
        'videoPlaybackSpeed': 2,
        'enableThumbs': true,
        'enableStrictSSL': false,
        'enableSlowLoading': false,
        'isFullScreen': false,
        'reloadInMontage': false,
        'momentGridSize': 40,
        'momentMonitorFilter': [],
        'enableMomentSubMenu': true,
        'momentShowIcons':false,
        'momentArrangeBy': 'StartTime',
        'showLiveForInProgressEvents': true,
        'disableSimulStreaming': false,
        'insertBasicAuthToken': false,
        'loginAPISupported': false,
        'montageResizeSteps': 5,
        'currentServerVersion': '',
        'saveToCloud': true,
        'montageReviewCollapse': true,
        'objectDetectionFilter': false,
        'enableEventRefresh': true,
        'lastEventCheckTimes': {},
        'enableMontageOverlays': true,
        'showMontageSidebars': false,
        'isTokenSupported': false,
        'accessTokenExpires': '',
        'refreshTokenExpires': '',
        'accessToken': '',
        'refreshToken': '',
        'isKiosk': false,
        'kioskPassword': '',
        'useAPICaching': true,
        'pauseStreams': false,
        'liveStreamBuffer': 10,
        'zmNinjaCustomId':undefined, // filled in init. custom header
        'obfuscationScheme': 'lzs', // or 'aes'
        'showAnimation': true

      };

      var defaultLoginData = angular.copy(loginData);

      var configParams = {
        'ZM_EVENT_IMAGE_DIGITS': '-1',
        'ZM_PATH_ZMS': '',
        'ZM_MIN_STREAMING_PORT': '-1'
      };


      /**
       * Allows/Disallows self signed certs
       * 
       * @returns 
       */
      function setCordovaHttpOptions() {
        if (loginData.isUseBasicAuth) {
          debug("Cordova HTTP: configuring basic auth");
          cordova.plugin.http.useBasicAuth(loginData.basicAuthUser, loginData.basicAuthPassword);
        }
        debug ("Setting cordova header X-ZmNinja to "+loginData.zmNinjaCustomId);
        // setup custom header
        cordova.plugin.http.setHeader('*', 'X-ZmNinja', loginData.zmNinjaCustomId);


        if (!loginData.enableStrictSSL) {

          //alert("Enabling insecure SSL");
          log(">>>> Disabling strict SSL checking (turn off  in Dev Options if you can't connect)");
          cordova.plugin.http.setSSLCertMode('nocheck', function () {
            debug('--> SSL is permissive, will allow any certs. Use at your own risk.');
          }, function () {
            NVR.log('-->Error setting SSL permissive');
          });

          if ($rootScope.platformOS == 'android') {
            log(">>> Android: enabling inline image view for self signed certs");
            cordova.plugins.certificates.trustUnsecureCerts(true);
          }

        } else {

          log(">>>> Enabling strict SSL checking (turn off  in Dev Options if you can't connect)");

        }
      }


      /**
       * Checks if a complex object is empty
       * 
       * @param {any} obj 
       * @returns 
       */
      function isEmpty(obj) {

        // null and undefined are "empty"
        if (obj == null) return true;

        // Assume if it has a length property with a non-zero value
        // that that property is correct.
        if (obj.length > 0) return false;
        if (obj.length === 0) return true;

        // Otherwise, does it have any properties of its own?
        // Note that this doesn't handle
        // toString and valueOf enumeration bugs in IE < 9
        for (var key in obj) {
          if (hasOwnProperty.call(obj, key)) return false;
        }

        return true;
      }

      function getBandwidth() {
        // if mode is not on always return high
        if (loginData.enableLowBandwidth == false) {
          return "highbw";
        }
        // if mode is force on, return low
        if (loginData.enableLowBandwidth == true && loginData.autoSwitchBandwidth != true) {
          return "lowbw";
        }
        if (loginData.enableLowBandwidth == true && loginData.autoSwitchBandwidth == true && $rootScope.platformOS == 'desktop') {
          return "highbw";
        }
        // else return real state

        var networkState = navigator.connection.type;
        var strState;
        switch (networkState) {

          case Connection.WIFI:
            strState = "highbw";
            break;
          case Connection.ETHERNET:
            strState = "highbw";
            break;
          default:
            strState = "lowbw";
            break;

        }
        return strState;
      }

      //--------------------------------------------------------------------------
      // uses fileLogger  to write logs to file for later investigation
      //--------------------------------------------------------------------------

      // separate out a debug so we don't do this if comparison for normal logs
      function debug(val) {
        if (loginData.enableDebug && loginData.enableLogs) {
          if (val !== undefined) {
            var regex1 = /"password":".*?"/g;
            var regex2 = /&pass=.*?(?=["&]|$)/g;
            var regex3 = /&token=([^&]*)/g;
            var regex4 = /&auth=([^&]*)/g;


            //console.log ("VAL IS " + val);
            val = val.replace(regex1, "<password removed>");
            val = val.replace(regex2, "<password removed>");
            val = val.replace (regex3, "&token=<removed>");
            val = val.replace (regex4, "&auth=<removed>");
          }

          $ionicPlatform.ready(function () {
            $fileLogger.debug(val);
          });
          //console.log (val);
        }
      }


      // custom caching function
      // as native http doesn't cache

      function delete_cache (key) {
        return localforage.removeItem(key);
      }

      function delete_all_caches() {
        debug ('CACHE: Flushing all network API caches...');
        return localforage.removeItem('cached_monitors')
        .then ( function () {return localforage.removeItem('cached_api_version');})
        .then ( function () {return localforage.removeItem('cached_multi_servers');})
        .then ( function () {return localforage.removeItem('cached_multi_port');})
        .then ( function () {return localforage.removeItem('cached_timezone');})
        .catch ( function (err) {debug ('Error removing all caches: '+JSON.stringify(err));});
        
      }

      function cache_or_http(url,key,doCrypt, expiry) {

      
        if (!loginData.useAPICaching) {
          debug ('CACHE: Not being used, as it is disabled');
          return $http.get(url);
        }
      
       // debug ('Inside cache_or_http with key:'+key+' crypt:'+doCrypt+'  exp:'+expiry);
        var d = $q.defer();
        
        if (!expiry) expiry = 3600;
        if (!doCrypt) doCrypt = false;

        localforage.getItem(key)
        .then (function (cache_data) {
            if (cache_data) {
              debug ('CACHE: found for key: '+key+' with expiry of:'+cache_data.expiry+'s');

              data = cache_data.data;
              t = moment(cache_data.time);
              diff = moment().diff(t,'seconds');
              
              if (diff >=cache_data.expiry) {
                debug ('CACHE: cached value for key:'+key+' has expired as '+diff+' >='+cache_data.expiry);
                localforage.removeItem (key)
                .then (function() {return cache_or_http(url, key, doCrypt, expiry);})
                .catch (function(err) {
                  debug ('CACHE: error deleting key, err:'+JSON.stringify(err)+' but still proceeding with another call to cache_or_http');
                  return cache_or_http(url, key, doCrypt, expiry);
                });
              }
              else {
                debug ('CACHE: cached value for key:'+key+' is good as '+diff+' <'+cache_data.expiry);
              }

              //data = JSON.parse(data);
              if (doCrypt) {
                debug ('CACHE: decryption requested');
                data = decrypt(data);
              }
              else
                data = JSON.parse(data);
              
              d.resolve(data);
              return (d.promise);
            } else {
              debug ('CACHE: NOT found for:'+key+ ' reverting to HTTP');
              return $http.get(url)
              .then ( function (data) {
                cache_entry = {
                  'data': null,
                  'time': null,
                  'expiry': expiry
                };
                debug ('CACHE: storing key data in cache now, with expiry of '+expiry);
                if (doCrypt) {
                  debug ('CACHE: encrypting request');
                  var ct = encrypt(data);
                  cache_entry.data = ct;
                }
                else {
                  cache_entry.data = JSON.stringify(data);
                }
                cache_entry.time = moment().toString();
                //debug ('Setting key:'+key+' data value to:'+cache_entry.data);
                localforage.setItem(key, cache_entry);
                d.resolve(data);
                return d.promise;
              })
              .catch ( function (err) {
                log ('CACHE: error with http get '+err);
                d.reject(err);
                return d.promise;
              });
            }
            
        })
        .catch ( function (err) {
          debug ('cache_or_http error:'+err);
          return $http.get(url);
        }) ;
        debug ('returning promise');
        return d.promise;
      }

      function getZmsMultiPortSupport(forceReload) {
        var d = $q.defer();
        if (configParams.ZM_MIN_STREAMING_PORT == -1 || forceReload) {
          log("Checking value of ZM_MIN_STREAMING_PORT for the first time");
          var apiurl = loginData.apiurl;
          var myurl = apiurl + '/configs/viewByName/ZM_MIN_STREAMING_PORT.json?' + $rootScope.authSession;
          cache_or_http(myurl,'cached_multi_port', false, 3600*24)
            .then(function (data) {
                data = data.data;
                //console.log ("GOT " + JSON.stringify(data));

                if (data.config && data.config.Value) {
                  configParams.ZM_MIN_STREAMING_PORT = data.config.Value;
                  setCurrentServerMultiPortSupported(true);
                  log("Got min streaming port value of: " + configParams.ZM_MIN_STREAMING_PORT);
                } else {
                  setCurrentServerMultiPortSupported(false);
                  log("ZM_MIN_STREAMING_PORT not configured, disabling");
                  configParams.ZM_MIN_STREAMING_PORT = 0;
                }


                d.resolve(configParams.ZM_MIN_STREAMING_PORT);
                return (d.promise);
              },
              function (err) {
                configParams.ZM_MIN_STREAMING_PORT = 0;
                log("ZM_MIN_STREAMING_PORT not supported");
                setCurrentServerMultiPortSupported(false);
                d.resolve(configParams.ZM_MIN_STREAMING_PORT);
                return (d.promise);
              });
        } else {
          log("sending stored ZM_MIN_STREAMING_PORT " +
            configParams.ZM_MIN_STREAMING_PORT);
          d.resolve(configParams.ZM_MIN_STREAMING_PORT);
          return (d.promise);

        }
        return (d.promise);

      }

      function proceedWithFreshLogin(noBroadcast) {

     
        // recompute rand anyway so even if you don't have auth
        // your stream should not get frozen
        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
        $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);
  
        // console.log ("***** STATENAME IS " + statename);
  
        var d = $q.defer();
              log("Doing fresh login to ZM");
        var httpDelay = loginData.enableSlowLoading ? zm.largeHttpTimeout : zm.httpTimeout;
  
      
        str =  "<a style='color:white; text-decoration:none' href='#' ng-click='$root.cancelAuth()' <i class='ion-close-circled'></i>&nbsp;" + $translate.instant('kAuthenticating')+"</a>";
        
       
  
        if (str) {
          $ionicLoading.show({
            template: str,
            noBackdrop: true,
            duration: httpDelay
          });
        }
  
  
        //first login using new API
        $rootScope.authSession = '';
        var loginAPI = loginData.apiurl + '/host/login.json';
      
  
        $http({
            method: 'post',
            url: loginAPI,
            timeout: httpDelay,
            skipIntercept: true,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            responseType: 'text',
            transformResponse: undefined,
            transformRequest: function (obj) {
              var str = [];
              for (var p in obj)
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
              return str.join("&");
            },
            data: {
              user: loginData.username,
              pass: loginData.password
            }
          })
          //$http.get(loginAPI)
          .then(function (textsucc) {
  
              $ionicLoading.hide();
              var succ;
              try {
  
                succ = JSON.parse(textsucc.data);
  
                if (!succ.version) {
                  debug("API login returned fake success, going back to webscrape");
                  
                  loginData.loginAPISupported = false;
                  setLogin(loginData);
  
                  loginWebScrape()
                    .then(function () {
                        d.resolve("Login Success");
                        return d.promise;
                      },
                      function () {
                        $ionicLoading.hide();
                        d.reject("Login Error");
                        return (d.promise);
                      });
                  return d.promise;
                }
                debug("API based login returned. ");
                console.log (JSON.stringify(succ));
                setCurrentServerVersion(succ.version);
                $ionicLoading.hide();
                //$rootScope.loggedIntoZm = 1;
                //console.log ("***** CLEARING AUTHSESSION IN LINE 466");
                $rootScope.authSession = '';
  
                if (succ.refresh_token) {
                  $rootScope.authSession = '&token='+succ.access_token;
                  log ("New refresh token retrieved: ..."+succ.refresh_token.substr(-5));
                  loginData.isTokenSupported = true;
              
                  loginData.accessToken = succ.access_token;
                  loginData.accessTokenExpires = moment.utc().add(succ.access_token_expires, 'seconds');
                  loginData.refreshToken = succ.refresh_token;
                  $rootScope.tokenExpires = succ.access_token_expires;

                  log ('----> Setting token re-login after '+succ.access_token_expires+' seconds');
                  if (tokenExpiryTimer) $timeout.cancel(tokenExpiryTimer);
                  //succ.access_token_expires = 30;
                  tokenExpiryTimer = $timeout ( function () {
                    $rootScope.$broadcast('token-expiry');
                  }, succ.access_token_expires * 1000);
                  
                
                  loginData.refreshTokenExpires = moment.utc().add(succ.refresh_token_expires, 'seconds');
              
                  log ("Current time is: UTC "+moment.utc().format("YYYY-MM-DD hh:mm:ss"));
                  log ("New refresh token expires on: UTC "+loginData.refreshTokenExpires.format("YYYY-MM-DD hh:mm:ss"));
                  log ("New access token expires on: UTC "+loginData.accessTokenExpires.format("YYYY-MM-DD hh:mm:ss"));
                  setLogin(loginData);
  
                }
                else {
                  if (succ.credentials != undefined) {
                    if (succ.credentials != '') {
                      log ("Could not recover token details, trying old auth credentials");
                      loginData.isTokenSupported = false;
                      setLogin(loginData);
                      $rootScope.authSession = "&" + succ.credentials;
                      if (succ.append_password == '1') {
                        $rootScope.authSession = $rootScope.authSession +
                          loginData.password;
                      }
                    } else {
                      // incase auth is turned off, but user said
                    // its on. 
                      $rootScope.authSession="&nonauth=none";
                      debug ('Your auth seems to be turned off, but you said yes');
                      
                    }
                    
                  }
                  else {
                    log ("Neither token nor old cred worked. Seems like an error");
                  }
                }
                
  
                
                loginData.loginAPISupported = true;
                setLogin(loginData);
  

                log("Stream authentication construction: " +
                  $rootScope.authSession);
  
                log("Successfully logged into Zoneminder via API");
  
  
  
                d.resolve("Login Success");
                if (!noBroadcast) $rootScope.$broadcast('auth-success', succ);
                return d.promise;
  
              } catch (e) {
                debug("Login API approach did not work...");
              
               
                loginData.loginAPISupported = false;
                loginData.isTokenSupported = false;
                setLogin(loginData);
                loginWebScrape()
                  .then(function () {
                      d.resolve("Login Success");
                      return d.promise;
                    },
                    function (err) {
                      $ionicLoading.hide();
                      d.reject("Login Error");
                      return (d.promise);
                    });
                return d.promise;
  
              }

            },
            function (err) {
              //console.log("******************* API login error " + JSON.stringify(err));
              $ionicLoading.hide();
              //if (err  && err.data && 'success' in err.data) {
              log("API based login not supported, need to use web scraping...");
              // login using old web scraping
              
              loginData.loginAPISupported = false;
              setLogin(loginData);
               loginWebScrape()
                .then(function () {
                    d.resolve("Login Success");
                    return d.promise;
                  },
                  function (err) {
                    d.reject("Login Error");
                    return (d.promise);
                  });
  
            }
          ); // post .then
  
        return d.promise;
        
      }

    function loginWebScrape(noBroadcast) {
     
      var d = $q.defer();
      if ($rootScope.userCancelledAuth) {
        debug ('NVR loginWebScrape: User cancelled auth, not proceeding');
        d.reject(true);
        return d.promise;
      }
      debug("Logging in using old web-scrape method");

      $ionicLoading.show({
       
        template: "<a style='color:white; text-decoration:none' href='#' ng-click='$root.cancelAuth()' <i class='ion-close-circled'></i>&nbsp;" + $translate.instant('kAuthenticatingWebScrape')+"</a>",
        noBackdrop: true,
        duration: httpDelay
      });


      
         

      var httpDelay = loginData.enableSlowLoading ? zm.largeHttpTimeout : zm.httpTimeout;
      //NVR.debug ("*** AUTH LOGIN URL IS " + loginData.url);
      $http({

          method: 'post',
          timeout: httpDelay,
          //withCredentials: true,
          url: loginData.url + '/index.php?view=console',
          skipIntercept:true,
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
        .then(function (data, status, headers) {
            // console.log(">>>>>>>>>>>>>> PARALLEL POST SUCCESS");
            data = data.data;
            $ionicLoading.hide();

            // Coming here does not mean success
            // it could also be a bad login, but
            // ZM returns you to login.php and returns 200 OK
            // so we will check if the data has
            // <title>ZM - Login</title> -- it it does then its the login page

            if (data.indexOf(zm.loginScreenString1) >=0) {
              //eventServer.start();
              //$rootScope.loggedIntoZm = 1;

              log("zmAutologin successfully logged into Zoneminder");
              $rootScope.apiValid = true;

              // now go to authKey part, so don't return yet...

            } else //  this means login error
            {
              // $rootScope.loggedIntoZm = -1;
              //console.log("**** ZM Login FAILED");
              log("zmAutologin Error: Bad Credentials ", "error");
              if (!noBroadcast) $rootScope.$broadcast('auth-error', "incorrect credentials");

              d.reject("Login Error");
              return (d.promise);
              // no need to go to next code, so return above
            }

            // Now go ahead and re-get auth key 
            // if login was a success
           // console.log ("***** CLEARING AUTHSESSION IN AUTHKEY");
            $rootScope.authSession = '';
            getAuthKey($rootScope.validMonitorId)
              .then(function (success) {

                  //console.log(success);
                  //console.log ("***** SETTING AUTHSESSION IN AUTHKEY"+success);
                  $rootScope.authSession = success;
                  log("Stream authentication construction: " +
                    $rootScope.authSession);
                  d.resolve("Login Success");
                  $rootScope.$broadcast('auth-success', data);
                  return d.promise;

                },
                function (error) {
                  //console.log(error);

                  log("Modal: Error returned Stream authentication construction. Retaining old value of: " + $rootScope.authSession);
                  debug("Error was: " + JSON.stringify(error));
                  d.resolve("Login Success");
                  if (!noBroadcast) $rootScope.$broadcast('auth-success', data);
                });

            return (d.promise);

          },
          function (error, status) {

            // console.log(">>>>>>>>>>>>>> PARALLEL POST ERROR");
            $ionicLoading.hide();

            //console.log("**** ZM Login FAILED");

            // FIXME: Is this sometimes results in null

            log("zmAutologin Error " + JSON.stringify(error) + " and status " + status);
            // bad urls etc come here
            //$rootScope.loggedIntoZm = -1;
            if (!noBroadcast) $rootScope.$broadcast('auth-error', error);

            d.reject("Login Error");
            return d.promise;
          });
      return d.promise;
    }

      function getAuthKey(mid, ck) {

        var d = $q.defer();
        var myurl;

        if (!loginData.isUseAuth) {
          $rootScope.authSession = "";
          d.resolve($rootScope.authSession);
          return d.promise;
        }

        if ($rootScope.authSession != '' && $rootScope.authSession != 'undefined') {
          log("We already have an auth key of:" + $rootScope.authSession);
          d.resolve($rootScope.authSession);
          return d.promise;
        }

        if (loginData.currentServerVersion && (versionCompare(loginData.currentServerVersion, zm.versionWithLoginAPI) != -1 || loginData.loginAPISupported)) {

          myurl = loginData.apiurl + '/host/login.json';
          debug("Server version " + loginData.currentServerVersion + " > 1.31.41, so using login API:" + myurl);
          $http.get(myurl)
            .then(function (s) {

                debug("Credentials API returned: " + JSON.stringify(s));
                if (!s.data || s.data.credentials == undefined) {
                  $rootScope.authSession = "";
                  d.resolve($rootScope.authSession);
                  debug("login() API Succeded, but did NOT return credentials key: " + JSON.stringify(s));
                  return d.promise;

                } else {
                  if (s.data.credentials != '') {
                    $rootScope.authSession = "&" + s.data.credentials;
                    if (s.data.append_password == '1') {
                      $rootScope.authSession = $rootScope.authSession +
                        loginData.password;
                    }
                  }
                  else {
                    // incase auth is turned off, but user said
                    // its on. 
                    $rootScope.authSession="&nonauth=none";
                    debug ('Your auth seems to be turned off, but you said yes');
                  }
                  
                  d.resolve($rootScope.authSession);
                  return d.promise;
                }

              },
              function (e) {

                //console.log ("***** CLEARING AUTHSESSION IN GETCREDENTIALS");
                $rootScope.authSession = "";
                d.resolve($rootScope.authSession);
                debug("AuthHash API Error: " + JSON.stringify(e));
                return d.promise;

              }
            );
          return d.promise;

        }
        //old way without login API

        var as = 'undefined';

        if (!mid && monitors && monitors.length > 0) {
          mid = monitors[0].Monitor.Id;
        }

        if (!mid) {
          log("Deferring auth key, as monitorId unknown");
          d.resolve("");
          $rootScope.authSession = as;
          return (d.promise);
        }

        // Skipping monitor number as I only need an auth key
        // so no need to generate an image
        myurl = loginData.url + "/index.php?view=watch&mid=" + mid;
        debug("NVR: Getting auth from " + myurl + " with mid=" + mid);
        $http.get(myurl)
          .then(function (success) {
              //console.log ("**** RESULT IS " + JSON.stringify(success));
              // Look for auth=
              var auth = success.data.match("auth=(.*?)&");
              if (auth && (auth[1] != null)) {
                log("NVR: Extracted a stream authentication key of: " + auth[1]);
                as = "&auth=" + auth[1];
                $rootScope.authSession = as;
                d.resolve(as);
              } else {
                log("NVR: Did not find a stream auth key, looking for user=");
                auth = success.data.match("user=(.*?)&");
                if (auth && (auth[1] != null)) {
                  log("NVR: Found simple stream auth mode (user=)");
                  as = "&user=" + loginData.username + "&pass=" + encodeURIComponent(loginData.password);
                  $rootScope.authSession = as;
                  d.resolve(as);
                } else {
                  log("Data Model: Did not find any  stream mode of auth");
                  as = "";
                  $rootScope.authSession = "";
                  d.resolve(as);
                  return d.promise;
                }

                return (d.promise);
              }

            },
            function (error) {
              log("NVR: Error resolving auth key " + JSON.stringify(error));
              d.resolve("");
              return (d.promise);
            });
        return (d.promise);

      }

      function log(val, logtype) {


        if (loginData.enableLogs) {
          if (val !== undefined) {
            var regex1 = /"password":".*?"/g;
            var regex2 = /&pass=.*?(?=["&]|$)/g;
            var regex3 = /&token=([^&]*)/g;
            var regex4 = /&auth=([^&]*)/g;


            //console.log ("VAL IS " + val);
            val = val.replace(regex1, "<password removed>");
            val = val.replace(regex2, "<password removed>");
            val = val.replace (regex3, "&token=<removed>");
            val = val.replace (regex4, "&auth=<removed>");

          }
          // make sure password is removed
          //"username":"zmninja","password":"xyz",
          //val = val.replace(/\"password:\",
          $ionicPlatform.ready(function () {
            $fileLogger.log(logtype, val);
          });
          // console.log (val);
        }
      }

      function reloadMonitorDisplayStatus() {
        debug("Loading hidden/unhidden status for profile:" + loginData.currentMontageProfile);

        var positionsStr = loginData.packeryPositions;
        //console.log ("positionStr="+positionsStr);
        var positions = {};
        if (loginData.packeryPositions != '' && loginData.packeryPositions != undefined) {
          // console.log("positions=" + loginData.packeryPositions);

          try {
            positions = JSON.parse(positionsStr);
          } catch (e) {
            debug("error parsing positions");
          }

          for (var m = 0; m < monitors.length; m++) {
            var positionFound = false;
            for (var p = 0; p < positions.length; p++) {
              if (monitors[m].Monitor.Id == positions[p].attr) {
                monitors[m].Monitor.listDisplay = positions[p].display;
                positionFound = true;
                //debug("NVR: Setting MID:" + monitors[m].Monitor.Id + " to " + monitors[m].Monitor.listDisplay);
              }

            }
            if (!positionFound) {
              if (loginData.currentMontageProfile != $translate.instant('kMontageDefaultProfile')) {
                monitors[m].Monitor.listDisplay = 'noshow';
                //console.log("*************DISABLE NEW MONITOR");
              } else // make sure we add it because its show all view
              {
                monitors[m].Monitor.listDisplay = 'show';
                //console.log("*************ENABLE NEW MONITOR");
              }


            }

          }

        } else // if there are no packery positions, make sure all are displayed! 
        {
          debug("no packery profile, making sure monitors are show");
          for (var m1 = 0; m1 < monitors.length; m1++) {
            monitors[m1].Monitor.listDisplay = 'show';

          }


        }
       
      }

      function setLogin(newLogin) {
        //var d = $q.defer();

        // if we are here, we should remove cache


        loginData = angular.copy(newLogin);
       // console.log ('****** SET LOGIN:'+JSON.stringify(loginData));
        $rootScope.LoginData = loginData;

        serverGroupList[loginData.serverName] = angular.copy(loginData);

        var ct = encrypt(serverGroupList);
      
        //debug ("Crypto is: " + ct);

        return localforage.setItem("serverGroupList", ct)
          .then(function () {

            return localforage.setItem("defaultServerName", loginData.serverName);
          })
          .then(function () {
            //debug("saving defaultServerName worked");
            return localforage.removeItem("settings-temp-data");
          })

          .catch(function (err) {
            log("SetLogin localforage store error " + JSON.stringify(err));
          });





      }

      //credit: https://gist.github.com/alexey-bass/1115557
      function versionCompare(left, right) {
        if (typeof left + typeof right != 'stringstring')
          return false;

        var a = left.split('.');
        var b = right.split('.');
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

      function _checkInitSanity(loginData) {
        // old version hacks for new variables

        // always true Oct 27 2016
        loginData.persistMontageOrder = true;
        loginData.enableh264 = true;

        if (typeof loginData.isUseBasicAuth === 'undefined') {
          loginData.isUseBasicAuth = false;
          loginData.basicAuthUser = '';
          loginData.basicAuthPassword = '';
          $rootScope.basicAuthHeader = '';
          $rootScope.basicAuthToken = '';
        }

        if (loginData.url.indexOf('@') != -1) {
          log(">> " + loginData.url);
          log(">>User/Password detected in URL, changing to new auth handling...");
          loginData.isUseBasicAuth = true;

          var components = URI.parse(loginData.url);
          loginData.url = components.scheme + "://" + components.host;
          if (components.port) loginData.url = loginData.url + ":" + components.port;
          if (components.path) loginData.url = loginData.url + components.path;

          components = URI.parse(loginData.streamingurl);
          loginData.streamingurl = components.scheme + "://" + components.host;
          if (components.port) loginData.streamingurl = loginData.streamingurl + ":" + components.port;
          if (components.path) loginData.streamingurl = loginData.streamingurl + components.path;


          components = URI.parse(loginData.apiurl);
          loginData.apiurl = components.scheme + "://" + components.host;
          if (components.port) loginData.apiurl = loginData.apiurl + ":" + components.port;
          if (components.path) loginData.apiurl = loginData.apiurl + components.path;

          $rootScope.basicAuthToken = btoa(components.userinfo);
          $rootScope.basicAuthHeader = 'Basic ' + $rootScope.basicAuthToken;
          //console.log (">>>> SET BASIC AUTH TO  " + $rootScope.basicAuthHeader);

          var up = components.userinfo.split(':');
          loginData.basicAuthPassword = up[1];
          loginData.basicAuthUser = up[0];
          //console.log ("SETTING "+loginData.basicAuthUser+" "+loginData.basicAuthPassword);

        }

        if (loginData.isUseBasicAuth) {
          $rootScope.basicAuthToken = btoa(loginData.basicAuthUser + ':' + loginData.basicAuthPassword);
          $rootScope.basicAuthHeader = 'Basic ' + $rootScope.basicAuthToken;
          debug("Basic authentication detected, constructing Authorization Header");

          // console.log ("BASIC AUTH SET TO:"+$rootScope.basicAuthHeader);

        }


        if (typeof loginData.enableAlarmCount === 'undefined') {
          debug("enableAlarmCount does not exist, setting to true");
          loginData.enableAlarmCount = true;
        }

        if (typeof loginData.onTapScreen == 'undefined') {
          loginData.onTapScreen = $translate.instant('kTapMontage');
        }

        if (loginData.onTapScreen != $translate.instant('kTapMontage') &&
          loginData.onTapScreen != $translate.instant('kTapEvents') &&
          loginData.onTapScreen != $translate.instant('kTapLiveMonitor')) {
          log("Invalid onTap setting found, resetting. I got " + loginData.onTapScreen);
          loginData.onTapScreen = $translate.instant('kMontage');
        }

        if (typeof loginData.minAlarmCount === 'undefined') {
          debug("minAlarmCount does not exist, setting to true");
          loginData.minAlarmCount = 1;
        }

        if (typeof loginData.montageSize == 'undefined') {
          debug("montageSize does not exist, setting to 2 (2 per col)");
          loginData.montageSize = 2;
        }

        if (typeof loginData.useNphZms == 'undefined') {
          debug("useNphZms does not exist. Setting to true");
          loginData.useNphZms = true;
        }

        if (typeof loginData.useNphZmsForEvents == 'undefined') {
          debug("useNphZmsForEvents does not exist. Setting to true");
          loginData.useNphZmsForEvents = true;
        }

        if (typeof loginData.forceImageModePath == 'undefined') {
          debug("forceImageModePath does not exist. Setting to false");
          loginData.forceImageModePath = false;
        }

        if (typeof loginData.reachability == 'undefined') {
          debug("reachability does not exist. Setting to true");
          loginData.reachability = true;
        }


        // force it - this may not be the problem
        loginData.reachability = true;

        // and now, force enable it
        loginData.useNphZms = true;
        loginData.useNphZmsForEvents = true;

        if (typeof loginData.packMontage == 'undefined') {
          debug("packMontage does not exist. Setting to false");
          loginData.packMontage = false;
        }

        if (typeof loginData.forceNetworkStop == 'undefined') {
          debug("forceNetwork does not exist. Setting to false");
          loginData.forceNetworkStop = false;
        }

        if (typeof loginData.enableLogs == 'undefined') {
          debug("enableLogs does not exist. Setting to true");
          loginData.enableLogs = true;
        }

        if (typeof loginData.defaultPushSound == 'undefined') {
          debug("defaultPushSound does not exist. Setting to false");
          loginData.defaultPushSound = false;
        }


        //console.log("INIT SIMUL=" + loginData.disableSimulStreaming);
        //console.log("INIT PLATFORM IS=" + $rootScope.platformOS);
        if (typeof loginData.disableSimulStreaming == 'undefined') {


          loginData.disableSimulStreaming = false;
          //console.log("INIT DISABLING SIMUL:" + loginData.disableSimulStreaming);
        }


        if (typeof loginData.exitOnSleep == 'undefined') {
          debug("exitOnSleep does not exist. Setting to false");
          loginData.exitOnSleep = false;
        }

        if (typeof loginData.enableBlog == 'undefined') {
          debug("enableBlog does not exist. Setting to true");
          loginData.enableBlog = true;

        }

        if (typeof loginData.packeryPositionsArray == 'undefined') {
          debug("packeryPositionsArray does not exist. Setting to empty");
          loginData.packeryPositionsArray = {};

        }


        if (typeof loginData.packeryPositions == 'undefined') {
          debug("packeryPositions does not exist. Setting to empty");
          loginData.packeryPositions = "";

        }

        if (typeof loginData.EHpackeryPositions == 'undefined') {
          //debug("EHpackeryPositions does not exist. Setting to empty");
          loginData.EHpackeryPositions = "";

        }

        if (typeof loginData.packerySizes == 'undefined') {
          //debug("packerySizes does not exist. Setting to empty");
          loginData.packerySizes = "";

        }

        if (typeof loginData.use24hr == 'undefined') {
          //debug("use24hr does not exist. Setting to false");
          loginData.use24hr = false;

        }

        if (typeof timelineModalGraphType == 'undefined') {
          //debug("timeline graph type not set. Setting to all");
          loginData.timelineModalGraphType = $translate.instant('kGraphAll');
          //console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + loginData.timelineModalGraphType);
        }

        if (typeof loginData.resumeDelay == 'undefined') {
          //debug("resumeDelay does not exist. Setting to 0");
          loginData.resumeDelay = 0;

        }
        // override resumeDelay - it was developed on a wrong assumption
        loginData.resumeDelay = 0;

        if (typeof loginData.montageHistoryQuality == 'undefined') {
          debug("montageHistoryQuality does not exist. Setting to 50");
          loginData.montageHistoryQuality = "50";

        }



        if (typeof loginData.vibrateOnPush == 'undefined') {
          debug("vibrate on push not found, setting to true");
          loginData.vibrateOnPush = true;

        }

        if (typeof loginData.isFullScreen == 'undefined') {

          loginData.isFullScreen = false;

        }

        if (typeof loginData.reloadInMontage == 'undefined') {

          loginData.reloadInMontage = false;

        }

        if (typeof loginData.soundOnPush == 'undefined') {
          debug("sound on push not found, setting to true");
          loginData.soundOnPush = true;

        }

        if (typeof loginData.cycleMonitors == 'undefined') {

          loginData.cycleMonitors = false;

        }

        if (typeof loginData.cycleMonitorsInterval == 'undefined') {

          loginData.cycleMonitorsInterval = 10;

        }

        if (typeof loginData.cycleMontage == 'undefined') {

          loginData.cycleMontage = false;

        }

        if (typeof loginData.cycleMontageInterval == 'undefined') {

          loginData.cycleMontageInterval = 10;

        }

        if (typeof loginData.enableLowBandwidth == 'undefined') {

          loginData.enableLowBandwidth = false;

        }
 

        if (typeof loginData.autoSwitchBandwidth == 'undefined') {

          loginData.autoSwitchBandwidth = false;

        }

        $rootScope.runMode = getBandwidth();
        log("Setting NVR init bandwidth to: " + $rootScope.runMode);

        if (typeof loginData.refreshSecLowBW == 'undefined') {

          loginData.refreshSecLowBW = 8;

        }

        if (typeof loginData.singleliveFPS == 'undefined') {

          loginData.singleliveFPS = '';

        }

        if (typeof loginData.montageliveFPS == 'undefined') {

          loginData.montageLiveFPS = '';

        }

        if (typeof loginData.disableAlarmCheckMontage == 'undefined') {

          loginData.disableAlarmCheckMontage = false;

        }

        if (typeof loginData.useLocalTimeZone == 'undefined') {

          loginData.useLocalTimeZone = true;

        }

        if (typeof loginData.fastLogin == 'undefined') {

          loginData.fastLogin = true;

        }

        if (typeof loginData.currentMontageProfile == 'undefined') {

          loginData.currentMontageProfile = '';

        }

        if (typeof loginData.followTimeLine == 'undefined') {

          loginData.followTimeLine = false;

        }

        if (typeof loginData.timelineScale == 'undefined') {

          loginData.timelineScale = -1;

        }


        if (typeof loginData.showMontageSubMenu == 'undefined') {

          loginData.showMontageSubMenu = false;

        }



        if (typeof loginData.monSingleImageQuality == 'undefined') {

          loginData.monSingleImageQuality = 100;

        }

        if (typeof loginData.hideArchived == 'undefined') {

          loginData.hideArchived = false;

        }

        if (typeof loginData.videoPlaybackSpeed == 'undefined') {

          loginData.videoPlaybackSpeed = 1;

        }



        if (typeof loginData.enableThumbs == 'undefined') {

          loginData.enableThumbs = true;

        }

        if (typeof loginData.enableSlowLoading == 'undefined') {

          loginData.enableSlowLoading = false;

        }


        if (typeof loginData.enableStrictSSL == 'undefined') {

          loginData.enableStrictSSL = false;

        }

        if (typeof loginData.momentGridSize == 'undefined') {

          loginData.momentGridSize = 40;

        }

        if (typeof loginData.enableMomentSubMenu == 'undefined') {

          loginData.enableMomentSubMenu = true;

        }

        if (typeof loginData.momentShowIcons == 'undefined') {

          loginData.momentShowIcons = false;

        }


        if (typeof loginData.momentMonitorFilter == 'undefined') {

          loginData.momentMonitorFilter = JSON.stringify([]);

        }


        if (typeof loginData.momentArrangeBy == 'undefined') {

          loginData.momentArrangeBy = "StartTime";

        }

        if (typeof loginData.insertBasicAuthToken == 'undefined') {

          loginData.insertBasicAuthToken = false;

        }


        if (typeof loginData.showLiveForInProgressEvents == 'undefined') {

          loginData.showLiveForInProgressEvents = true;

        }


        if (typeof loginData.loginAPISupported == 'undefined') {

          loginData.loginAPISupported = false;

        }

        if (typeof loginData.montageResizeSteps == 'undefined') {

          loginData.montageResizeSteps = 5;

        }

        if (typeof loginData.saveToCloud == 'undefined') {

          loginData.saveToCloud = true;

        }



        if (typeof loginData.montageReviewCollapse == 'undefined') {

          loginData.montageReviewCollapse = true;

        }

        if (typeof loginData.objectDetectionFilter == 'undefined') {

          loginData.objectDetectionFilter = false;

        }

        if (typeof loginData.enableEventRefresh == 'undefined') {

          loginData.enableEventRefresh = true;

        }



        if (typeof loginData.lastEventCheckTimes == 'undefined') {
          loginData.lastEventCheckTimes = {};

        }


        if (typeof loginData.enableMontageOverlays == 'undefined') {
          loginData.enableMontageOverlays = true;

        }

        if (typeof loginData.showMontageSidebars == 'undefined') {
          loginData.showMontageSidebars = false;

        }

        if (typeof loginData.isTokenSupported == 'undefined') {
          loginData.isTokenSupported = false;

        }

        if (typeof loginData.accessTokenExpires == 'undefined') {
          loginData.accessTokenExpires = '';

        }

        if (typeof loginData.refreshTokenExpires == 'undefined') {
          loginData.refreshTokenExpires = '';

        }

        if (typeof loginData.refreshToken == 'undefined') {
          loginData.refreshToken = '';

        }

        if (typeof loginData.accessToken == 'undefined') {
          loginData.accessToken = '';

        }

        if (typeof loginData.isKiosk == 'undefined') {
          loginData.isKiosk = false;

        }
        if (typeof loginData.useAPICaching == 'undefined') {
          loginData.useAPICaching = true;

        }

        if (typeof loginData.pauseStreams == 'undefined') {
          loginData.pauseStreams = false;

        }

        if (typeof loginData.liveStreamBuffer == 'undefined') {
          loginData.liveStreamBuffer = 10;
        }

        if ((typeof loginData.zmNinjaCustomId == 'undefined') || (loginData.zmNinjaCustomId == '')) {
          loginData.zmNinjaCustomId = 'zmNinja_'+zmAppVersion;
        }

        if (typeof loginData.obfuscationScheme == 'undefined')  {
          loginData.obfuscationScheme = 'lzs';
        }

        if (typeof loginData.showAnimation == 'undefined')  {
          loginData.showAnimation = true;
        }

        loginData.canSwipeMonitors = true;
        loginData.forceImageModePath = false;
        loginData.enableBlog = true;
        loginData.pauseStreams = true;

      }

      function regenConnKeys (mon) {
        var nowt = moment();
        if (mon) {
          debug ("NVR: Regnerating connkey for Monitor:"+mon.Monitor.Id + " at "+nowt);
          mon.Monitor.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
          mon.Monitor.regenTime = nowt;
          if (mon.Monitor.regenHandle) {
            //debug ("cancelling regen timer for Monitor:"+mon.Monitor.Id);
            $timeout.cancel(mon.Monitor.regenHandle);
            mon.Monitor.regenHandle = null;
          }
         
        } else {
          debug("NVR: Regenerating connkeys for all monitors at "+nowt);
          for (var i = 0; i < monitors.length; i++) {
            monitors[i].Monitor.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
            monitors[i].Monitor.rndKey = (Math.floor((Math.random() * 999999) + 1)).toString();
            monitors[i].Monitor.regenTime = nowt;
            if (monitors[i].Monitor.regenHandle) {
              $timeout.cancel(monitors[i].Monitor.regenHandle);
              monitors[i].Monitor.regenHandle = null;
            }
          }

        }
      }

      //--------------------------------------------------------------------------
      // Banner display of messages
      //--------------------------------------------------------------------------
      function displayBanner(mytype, mytext, myinterval, mytimer) {

        var contentBannerInstance =
          $ionicContentBanner.show({
            text: mytext || 'no text',
            interval: myinterval || 2000,
            //autoClose: mytimer || 6000,
            type: mytype || 'info',
            transition: 'vertical',
            //cancelOnStateChange: false
          });

        $timeout(function () {
          contentBannerInstance();
        }, mytimer || 6000);
      }

      function setCurrentServerMultiPortSupported(val) {
        debug("Setting multi-port to:" + val);
        currentServerMultiPortSupported = val;
      }

      function setCurrentServerVersion(val) {
        loginData.currentServerVersion = val;
        setLogin(loginData);
        debug("Setting server version to:" + val);
      }

      function encrypt(data) {

        var jsdata = JSON.stringify(data);
        var compress;

        if (loginData.obfuscationScheme == 'lzs') {
          compress = '--Z--'+LZString.compressToUTF16(jsdata);

        }
        else if (loginData.obfuscationScheme == 'aes') {
          compress = CryptoJS.AES.encrypt(jsdata, zm.cipherKey).toString();
        } else {
          log ('ERROR: obfuscation scheme:'+loginData.obfuscationScheme+' not recognized');
          return undefined;
        }
    
        debug ('obfuscate: original:'+jsdata.length+' obfuscated:'+compress.length+' scheme:'+loginData.obfuscationScheme);
        return compress;
      }

      function decrypt(data) {
        //debug ('-->deobfuscating '+data.length+' bytes using scheme:'+loginData.obfuscationScheme);
        var decodedVal;
        var scheme;
        if (data.substr(0,5) == '--Z--') {
          //debug ('unpacking');
          scheme = 'lzs';
          decodedVal = LZString.decompressFromUTF16(data.substr(5));
        } else {
          var bytes = CryptoJS.AES.decrypt(data.toString(), zm.cipherKey);
          decodedVal = bytes.toString(CryptoJS.enc.Utf8);
          scheme = 'aes';
        }
        
        //console.log ('-->decrypted ' + decodedVal);
        debug ('deobfuscate: before:'+data.length+' after:'+decodedVal.length+' scheme:'+scheme);
        var decodedJSON = JSON.parse(decodedVal);
       
        return (decodedJSON);
      }


      return {

        encrypt: function(data) {
          return encrypt(data);
        },

        decrypt: function(data) {
          return decrypt(data);
        },

        insertSpecialTokens: function () {

          var tokens = '';
          tokens+='&id='+loginData.zmNinjaCustomId;
          if (loginData.insertBasicAuthToken && $rootScope.basicAuthToken) {
            tokens += "&basicauth=" + $rootScope.basicAuthToken;
          }
          return tokens;
        },

        setCurrentServerMultiPortSupported: function (val) {
          setCurrentServerMultiPortSupported(val);
        },

        setCurrentServerVersion: function (val) {
          setCurrentServerVersion(val);
        },


        getCurrentServerMultiPortSupported: function () {
          return (currentServerMultiPortSupported);
        },

        isMultiPortDisabled: function () {
          return loginData.disableSimulStreaming;
        },

        getCurrentServerVersion: function () {
          return (loginData.currentServerVersion);
        },


        //-------------------------------------------------------------
        // used by various controllers to log messages to file
        //-------------------------------------------------------------

        migrationComplete: function () {
          migrationComplete = true;
        },

        isEmpty: function (obj) {
          return isEmpty(obj);
        },

        log: function (val, type) {
          var logtype = 'info';
          if (type != undefined)
            logtype = type;
          log(val, logtype);

        },

        debug: function (val) {

          debug(val);
        },

        evaluateTappedNotification: function () {

          var state = "";
          var stateParams1 = {};
          var stateParams2 = {};

          debug("Inside evaluateNotifications");

          if ($rootScope.LoginData.isKiosk) {
            NVR.log ('>>> evaluation: You are in kiosk mode, forcing transition to montage');
            state = "app.montage";
            $rootScope.tappedNotification = 0;
            return [state, stateParams1, stateParams2];
            

          }

          if ($rootScope.tappedNotification == 2) { // url launch
            debug("Came via app url launch with mid=" + $rootScope.tappedMid);
            debug("Came via app url launch with eid=" + $rootScope.tappedEid);


            if (parseInt($rootScope.tappedMid) > 0) {
              debug("Going to live view ");
              state = "app.monitors";

            } else if (parseInt($rootScope.tappedEid) > 0) {
              debug("Going to events with EID=" + $rootScope.tappedEid);
              state = "app.events";
              stateParams1 = {
                "id": 0,
                "playEvent": true
              };
              stateParams2 = {
                reload: true
              };

            }


          } // 2
          else if ($rootScope.tappedNotification == 1) // push
          {


            debug("Came via push tap. onTapScreen=" + loginData.onTapScreen);
            if (loginData.onTapScreen == $translate.instant('kTapMontage')) {
              debug("Going to montage");
              state = "app.montage";


            } else if (loginData.onTapScreen == $translate.instant('kTapEvents')) {
              debug("Going to events");
              state = "app.events";
              stateParams1 = {
                "id": 0,
                "playEvent": true
              };

            } else // we go to live
            {
              debug("Going to live view ");
              state = "app.monitors";

            }
          }
          $rootScope.tappedNotification = 0;
          return [state, stateParams1, stateParams2];
        },

        setLastUpdateCheck: function (val) {
          lastUpdateCheck = val;
          localforage.setItem("lastUpdateCheck", lastUpdateCheck);
        },

        getLastUpdateCheck: function () {
          return lastUpdateCheck;
        },

        setLatestBlogPostChecked: function (val) {
          //console.log(">>>>>>>>>>>> Setting blog date: " + val);
          latestBlogPostChecked = val;
          localforage.setItem("latestBlogPostChecked", latestBlogPostChecked);
        },

        getLatestBlogPostChecked: function () {
          return latestBlogPostChecked;
        },



        // This function is called when the app is ready to run
        // sets up various variables
        // including persistent login data for the ZM apis and portal
        // The reason I need both is because as of today, there is no way
        // to access images using the API and they are authenticated via
        // the ZM portal authentication, which is pretty messy. But unless
        // the ZM authors fix this and streamline the access of images
        // from APIs, I don't have an option



        // used when an empty server profile is created
        getDefaultLoginObject: function () {
          return angular.copy(defaultLoginData);
        },

        getReachableConfig: function (skipFirst) {
          var d = $q.defer();
          if (loginData.serverName == "") {
            log("Reachable: No server name configured, likely first use?");
            d.reject("No servers");
            return d.promise;
          }

          var chainURLs = [];
          var savedLoginData = angular.copy(loginData);

          //log ("Making sure " + loginData.serverName + " is reachable...");
          var tLd = serverGroupList[loginData.serverName];
          if (skipFirst && tLd.fallbackConfiguration) {
            tLd = serverGroupList[tLd.fallbackConfiguration];
            if (!tLd) {
              d.reject("No available severs");
              loginData = savedLoginData;
              return d.promise;

            }
          }

          var keepBuilding = true;
          while (keepBuilding == true && tLd) {
            if (arrayObjectIndexOf(chainURLs, tLd.url + "/index.php?view=console", "url") == -1 && tLd.url !== undefined && tLd.url != '') // no loop
            {
              log("Adding to chain stack: " + tLd.serverName + ">" + tLd.url);
              chainURLs.push({
                url: tLd.url + "/index.php?view=console",
                server: tLd.serverName
              });
              log("Fallback of " + tLd.serverName + " is " + tLd.fallbackConfiguration);
              if (tLd.fallbackConfiguration) {
                tLd = serverGroupList[tLd.fallbackConfiguration];
                if (tLd === undefined) {
                  // This can happen if the fallback profile was deleted
                  log("Looks like a server object was deleted, but is still in fallback");
                  keepBuilding = false;
                }
              } else {
                log("reached end of chain loop");
              }
            } else {
              if (tLd.fallbackConfiguration) {
                log("detected loop when " + tLd.serverName + " fallsback to " + tLd.fallbackConfiguration);
              }
              
              keepBuilding = false;
            }
          }
          
          if (chainURLs.length == 1) {
            log ('No need to do a reachability test, as there are no fallbacks');
            d.resolve("done");
            return d.promise;
          }

          console.log ('chainURLS:'+ chainURLs.length);
          //contactedServers.push(loginData.serverName);
          findFirstReachableUrl(chainURLs).then(function (firstReachableUrl) {
            d.resolve(firstReachableUrl);
            // also make sure loginData points to this now

            loginData = angular.copy(serverGroupList[firstReachableUrl.server]);

            setLogin(loginData);
            //$localstorage.set("defaultServerName",firstReachableUrl.server);

            log("Based on reachability, first serverName will be " + firstReachableUrl.server);
            //console.log("set login Data to " + JSON.stringify(loginData));

            return d.promise;
            // OK: do something with firstReachableUrl
          }, function () {
            d.reject("No servers reachable");
            loginData = savedLoginData;
            return d.promise;
            // KO: no url could be reached
          });

          function arrayObjectIndexOf(myArray, searchTerm, property) {
            for (var i = 0, len = myArray.length; i < len; i++) {
              if (myArray[i][property] === searchTerm)
                return i;
            }
            return -1;
          }

          function findFirstReachableUrl(urls) {
            if (urls.length > 0 && $rootScope.userCancelledAuth != true) {

             

              $ionicLoading.show({
                template: "<a style='color:white; text-decoration:none' href='#' ng-click='$root.cancelAuth()' <i class='ion-close-circled'></i>&nbsp;" + $translate.instant('kTrying')+ ' ' + urls[0].server+"</a>",
                noBackdrop: true,
              });
              log("Reachability test.." + urls[0].url);

              if (loginData.reachability) {

                //console.log ("************* AUGH");
                var hDelay = loginData.enableSlowLoading ? zm.largeHttpTimeout : zm.httpTimeout;
                return $http({
                  method: 'GET',
                  timeout: hDelay,
                  url: urls[0].url
                }).then(function () {
                  log("Success: reachability on " + urls[0].url);
                  $ionicLoading.hide();
                  return urls[0];
                }, function (err) {
                  log("Failed reachability on " + urls[0].url + " with error " + JSON.stringify(err));
                  return findFirstReachableUrl(urls.slice(1));
                });
              } else {
                log("Reachability is disabled in config, faking this test and returning success on " + urls[0]);
                return urls[0];
              }
            } else {
              $ionicLoading.hide();
              return $q.reject("No reachable URL");

            }

          }

          return d.promise;

        },
 
        cloudSync: function () {

          var d = $q.defer();
          if (!window.cordova) {
            log("Cloud settings plugin not found, skipping cloud sync...");
            d.resolve(true);
            return d.promise;
          }

          /*   window.cordova.plugin.cloudsettings.enableDebug(function(){
               console.log("Debug mode enabled");
           });*/

          log("CloudSync: Syncing with cloud if enabled...");

          var sgl = "";
          var decodedSgl = "";
          var dsn = "";

          localforage.getItem("serverGroupList")
            .then(function (_sgl) {
              sgl = _sgl;
              return localforage.getItem("defaultServerName");
            })
            .then(function (_dsn) {
              dsn = _dsn;
              return true;
            })
            .then(function () {
              if (sgl && dsn) {

                if (typeof sgl == 'string') {
                  log("user profile encrypted, decoding...");
                  decodedSgl = decrypt(sgl);
            

                } else {
                  decodedSgl = sgl;
                }


                var loadedData = decodedSgl[dsn];

                if (!isEmpty(loadedData)) {

                  if (!loadedData.saveToCloud) {
                    log("Cloud sync is disabled, exiting...");
                    d.resolve(true);
                    return d.promise;
                  }
                }
                log("Found valid local configuration, overwriting cloud settings...");
                //console.log (">>>>>>>>>>>>>>SAVING: " + sgl + dsn);
                window.cordova.plugin.cloudsettings.save({
                    'serverGroupList': sgl,
                    'defaultServerName': dsn
                  },
                  function () {
                    log("local data synced with cloud...");
                    d.resolve(true);
                    return d.promise;
                  },
                  function (err) {
                    log("error syncing cloud data..." + err);
                    d.resolve(true);
                    return d.promise;
                  }, true);

              }
              // bad or missing local config
              else {
                log("Did not find a valid local configuration, trying cloud...");

                window.cordova.plugin.cloudsettings.exists(function (exists) {

                  if (exists) {
                    log("A cloud configuration has been found");
                    window.cordova.plugin.cloudsettings.load(function (cloudData) {
                      //console.log("CLOUD DATA FOUND" + JSON.stringify(cloudData));
                      // debug("Cloud data retrieved is:" + JSON.stringify(cloudData));
                      if (cloudData && cloudData.defaultServerName && cloudData.serverGroupList) {
                        log("retrieved a valid cloud config with a defaultServerName of:" + cloudData.defaultServerName);
                        log("replacing local DB with cloud...");
                        localforage.setItem('isFirstUse', false)
                          .then(function () {
                            log("cleared first use");
                            return localforage.setItem("defaultServerName", cloudData.defaultServerName);
                          })
                          .then(function () {
                            log("saved defaultServerName");
                            return localforage.setItem("serverGroupList", cloudData.serverGroupList);
                          })
                          .then(function () {
                            log("saved serverGroupList, returning from cloudSync()");
                            d.resolve(true);
                            return d.promise;
                          });


                      }
                      // cloud did not have (useable)data
                      else {
                        log("Did not find a valid cloud config");
                        d.resolve(true);
                        return d.promise;
                      }

                    });
                  } else {
                    log("Cloud data does not exist");
                    d.resolve(true);
                    return d.promise;
                  }
                });

              }
            });


          return d.promise;

        },

        checkInitSanity: function (l) {
          _checkInitSanity(l);
        },

        init: function () {


          log("ZMData init: checking for stored variables & setting up log file");

          localforage.getItem("latestBlogPostChecked")
            .then(function (val) {
                latestBlogPostChecked = val;
              },
              function (err) {
                latestBlogPostChecked = null;
              });


          $ionicLoading.show({
            template: $translate.instant('kRetrievingProfileData'),
          });

          localforage.getItem("serverGroupList").then(function (val) {
            // decrypt it now

            var decodedVal;

            if (typeof val == 'string') {
              log("user profile encrypted, decoding...");
              decodedVal = decrypt(val);

            } else {
              log("user profile not encrypted");
              decodedVal = val;
            }

            //decodedVal = val;

            // debug("user profile retrieved:" + JSON.stringify(decodedVal));

            $ionicLoading.hide();
            serverGroupList = decodedVal;

            var sname;
            $ionicLoading.show({
              template: $translate.instant('kRetrievingProfileData'),
            });
            localforage.getItem("defaultServerName")
              .then(function (val) {
                $ionicLoading.hide();
                //console.log ("!!!!!!!!!!!!!!!!!!default server name is  "  + sname);
                sname = val;
                // console.log("!!!!!!!!!!!!!!!!!!!Got VAL " + sname);
                var loadedData = serverGroupList[sname];
                // console.log(">>>>>>>>>>> loadedData is: " + JSON.stringify(loadedData));
                if (!isEmpty(loadedData)) {
                  loginData = loadedData;
                  _checkInitSanity(loginData);
                  log("NVR init retrieved store loginData");
                } else {
                  log("defaultServer configuration NOT found. Keeping login at defaults");
                }


                // from local forage
                if (window.cordova) setCordovaHttpOptions();


                $rootScope.LoginData = loginData;
                $rootScope.$broadcast('init-complete');
              });

            monitorsLoaded = 0;
            //console.log("Getting out of NVR init");
            $rootScope.showBlog = loginData.enableBlog;
            //debug("loginData structure values: " + JSON.stringify(loginData));

          });

        },

        isForceNetworkStop: function () {
          return loginData.forceNetworkStop;
        },

        setJustResumed: function (val) {
          justResumed = val;
          if (val) {
            timeSinceResumed = moment();
          }
        },

        getTimeSinceResumed: function () {
          // will be -1 if never resumed
          return timeSinceResumed;
        },

        stopNetwork: function (str, dontDoIt) {
          var d = $q.defer();
          var s = "";
          if (str) s = str + ":";
          if (justResumed || dontDoIt) {
            // we don't call stop as we did stop on pause
            log(s + " Not calling window stop ");
            d.resolve(true);
            return (d.promise);

          } else {
            log(s + " stopNework: Calling window.stop()");
            $timeout(function () {
              window.stop();
              d.resolve(true);
              return (d.promise);
            });

          }
          return d.promise;
        },

        hasLoginInfo: function () {

          if ((loginData.username != "" && loginData.password != "" && loginData.url != "" &&
              loginData.apiurl != "") || (loginData.isUseAuth != '1')) {
            return 1;
          } else {

            return 0;

          }
        },

        getLanguages: function () {
          return languages;
        },

        setDefaultLanguage: function (l, permanent) {

          if (!l) l = 'en';
          defaultLang = l;
          var d = $q.defer();
          if (permanent) {
            //window.localStorage.setItem("defaultLang", l);

            //console.log("setting default lang");
            localforage.setItem("defaultLang", l)
              .then(function (val) {
                log("Set language in localforage to: " + val);
              });
          }

          //console.log("invoking translate use with " + l);
          $translate.use(l).then(function (data) {
            log("Device Language is:" + data);
            moment.locale(data);
            $translate.fallbackLanguage('en');
            d.resolve(data);
            return d.promise;
          }, function (error) {
            log("Device Language error: " + error);
            $translate.use('en');
            moment.locale('en');
            d.resolve('en');
            return d.promise;
          });
          return d.promise;
        },

        getDefaultLanguage: function () {
          return defaultLang;
          //return window.localStorage.getItem("defaultLang");

        },

        reloadMonitorDisplayStatus: function () {
          return reloadMonitorDisplayStatus();
        },

        getLogin: function () {

          return angular.copy(loginData);
        },

        getServerGroups: function () {
          return angular.copy(serverGroupList);
        },

        setServerGroups: function (sg) {
          serverGroupList = angular.copy(sg);
        },

        getKeepAwake: function () {
          return (loginData.keepAwake == '1') ? true : false;
        },

        setAppVersion: function (ver) {
          zmAppVersion = ver;
          $rootScope.appVersion = ver; // for custom header

          //console.log ('****** VER:'+$rootScope.appVersion);
        },

        getCustomHeader: function () {
          return loginData.zmNinjaCustomId;
        },

        getAppVersion: function () {
          return (zmAppVersion);
        },

        setBackground: function (val) {
          isBackground = val;
        },

        isBackground: function () {
          return isBackground;
        },

        isFirstUse: function () {
          // console.log("isFirstUse is " + isFirstUse);
          return isFirstUse;
          // return ((window.localStorage.getItem("isFirstUse") == undefined) ? true : false);

        },

        updateHrsSinceChecked: function (key) {
          var tnow = moment();
          debug("Updating " + key + " to " + JSON.stringify(tnow));
          localforage.setItem(key, JSON.stringify(tnow));
        },

        hrsSinceChecked: function (key) {
          var tnow = moment();
          var d = $q.defer();

          localforage.getItem(key)
            .then(function (val) {
                if (val == null) {
                  // doesn't exist
                  localforage.setItem(key, JSON.stringify(tnow));
                  debug(key + " doesn't exist, storing it as:" + tnow);
                  d.resolve(365 * 12 * 24);
                  return (d.promise);
                } else {
                  val = JSON.parse(val);
                  var duration = moment.duration(tnow.diff(val)).asHours().toFixed(1);
                  debug("It has been " + duration + " hours since " + key + " was checked");
                  d.resolve(duration);
                  return (d.promise);
                }
                return (d.promise);

              },
              function (err) {
                debug("Hmm? hrsSinceCheck failed");
                d.resolve(365 * 12 * 24);
                return d.promise;
              }
            );
          return d.promise;

        },

        versionCompare: function (l, r) {
          return versionCompare(l, r);
        },

        //-----------------------------------------------------------------
        // Allow the option to reset first use if I need it in future
        //-----------------------------------------------------------------
        setFirstUse: function (val) {
          //window.localStorage.setItem("isFirstUse", val ? "1" : "0");
          //localforage.setItem("isFirstUse", val, 
          //   function(err) {if (err) log ("localforage error, //storing isFirstUse: " + JSON.stringify(err));});
          isFirstUse = val;
          debug("Setting isFirstUse to:" + val);
          localforage.setItem("isFirstUse", val)
            .then(function (succ) {
              debug("Saved isFirstUse ok");
            })
            .catch(function (err) {
              debug("Error Saving isFirstUse:" + JSON.stringify(err));
            });
          //console.log (">>>>>>setting isFirstUse to " + val);

        },

        getTimeFormat: function () {
          return (loginData.use24hr ? "HH:mm" : "hh:mm a");
        },

        getTimeFormatSec: function () {
          return (loginData.use24hr ? "HH:mm:ss" : "hh:mm:ss a");
        },

        //------------------------------------------------------------------
        // switches screen to 'always on' or 'auto'
        //------------------------------------------------------------------
        setAwake: function (val) {

          //console.log ("**** setAwake called with:" + val);
          // log("Switching screen always on to " + val);
          if (val) {

            if (window.cordova != undefined) {
              window.plugins.insomnia.keepAwake();
            } else {
              //console.log ("Skipping insomnia, cordova does not exist");
            }
          } else {
            if (window.cordova != undefined) {
              window.plugins.insomnia.allowSleepAgain();
            } else {
              //console.log ("Skipping insomnia, cordova does not exist");
            }

          }

        },



        //--------------------------------------------------------------------------
        // writes all params to local storage. FIXME: Move all of this into a JSON 
        // object
        //--------------------------------------------------------------------------
        setLogin: function (newLogin) {

          $rootScope.showBlog = newLogin.enableBlog;
          return setLogin(newLogin);


        },



        //-------------------------------------------------------
        // returns API version or none 
        //-------------------------------------------------------
        getAPIversion: function () {

          var d = $q.defer();
          var apiurl = loginData.apiurl + '/host/getVersion.json?' + $rootScope.authSession;
          debug("getAPIversion called with " + apiurl);
          cache_or_http(apiurl,'cached_api_version',false, 3600*24)
            .then(function (success) {
                if (success.data.version) {
                  //console.log("API VERSION RETURNED: " + JSON.stringify(success));
                  $rootScope.apiValid = true;

                  if (versionCompare(success.data.version, '1.32.0') != -1) {
                    debug("snapshot  supported in image.php");
                    snapshotFrame = 'snapshot';
                  } else {
                    debug("snapshot NOT supported in image.php");
                    snapshotFrame = 1;
                  }
                  setCurrentServerVersion(success.data.version);
                  debug("getAPI version succeeded with " + success.data.version);
                  d.resolve(success.data.version);
                } 
                return (d.promise);

              },
              function (error) {
                debug("getAPIversion error handler " + JSON.stringify(error));
                d.reject("-1.-1.-1");
                setCurrentServerVersion("");
                $rootScope.apiValid = false;
                return (d.promise);
              });
          return (d.promise);

        },

        displayBanner: function (mytype, mytext, myinterval, mytimer) {
          displayBanner(mytype, mytext, myinterval, mytimer);
        },

        isReCaptcha: function () {
          // always resolves
          var d = $q.defer();
          if (loginData.isTokenSupported) {
            debug ('No need for re-captcha checks with tokens');
            d.resolve(false);
            return (d.promise);
          }

          var myurl = loginData.url;
          log("Checking if reCaptcha is enabled in ZM...");
          //          console.log ("Recaptcha: "+myurl);
          $http.get(myurl)
            .then(function (success) {
                //           console.log ("Inside recaptcha success");
                if (success.data.search("g-recaptcha") != -1) {
                  // recaptcha enable. zmNinja won't work
                  log("ZM has recaptcha enabled", "error");
                  displayBanner('error', ['Recaptcha must be disabled in Zoneminder', $rootScope.appName + ' will not work with recaptcha'], "", 8000);
                  d.resolve(true);
                  return (d.promise);

                } else {
                  d.resolve(false);
                  log("ZM has recaptcha disabled - good");
                  return (d.promise);
                }
              },
              function (err) {
                // for whatever reason recaptcha check failed
                //  console.log ("Inside recaptcha fail");
                d.resolve(false);
                log("Recaptcha failed, but assuming ZM has recaptcha disabled");
                return (d.promise);
              });
          return (d.promise);
        },

        //-----------------------------------------------------------------------------
        // Grabs the computed auth key for streaming
        // FIXME: Currently a hack - does a screen parse - convert to API based support
        //-----------------------------------------------------------------------------

        // need a mid as restricted users won't be able to get
        // auth with just &watch
        getAuthKey: function (mid, ck) {
          return getAuthKey(mid, ck);
        },

        //-----------------------------------------------------------------------------
        // This function tells is if this ZM version has ZMS multiport support
        //-----------------------------------------------------------------------------

        clearZmsMultiPortSupport: function () {
          debug("Clearing Multiport...");
          configParams.ZM_MIN_STREAMING_PORT = -1;
        },

        getZmsMultiPortSupport: function () {
          // 0 => not supported
          // >=1 => supported
          // -1 => haven't checked - should never be returned

          return getZmsMultiPortSupport();

        },


        //-----------------------------------------------------------------------------
        // This function returns the numdigits for padding capture images
        //-----------------------------------------------------------------------------


        getAuthHashLogin: function () {

          return $http.get(loginData.apiurl + '/configs/viewByName/ZM_AUTH_HASH_LOGINS.json?' + $rootScope.authSession);

        },

        getKeyConfigParams: function (forceReload) {

          var d = $q.defer();
          configParams.ZM_EVENT_IMAGE_DIGITS = 5;
          d.resolve(configParams.ZM_EVENT_IMAGE_DIGITS);
          return (d.promise);

          /*
          if (forceReload == 1 || configParams.ZM_EVENT_IMAGE_DIGITS == '-1') {
            var apiurl = loginData.apiurl;
            var myurl = apiurl + '/configs/viewByName/ZM_EVENT_IMAGE_DIGITS.json?' + $rootScope.authSession;
            //debug("Config URL for digits is:" + myurl);
            $http.get(myurl)
              .then(function (data) {
                data = data.data;
                log("ZM_EVENT_IMAGE_DIGITS is " + data.config.Value);
                configParams.ZM_EVENT_IMAGE_DIGITS = data.config.Value;
                d.resolve(configParams.ZM_EVENT_IMAGE_DIGITS);
                return (d.promise);

              }, function (err) {
                log("Error retrieving ZM_EVENT_IMAGE_DIGITS" + JSON.stringify(err), "error");
                log("Taking a guess, setting ZM_EVENT_IMAGE_DIGITS to 5");
                // FIXME: take a plunge and keep it at 5?
                configParams.ZM_EVENT_IMAGE_DIGITS = 5;
                d.resolve(configParams.ZM_EVENT_IMAGE_DIGITS);
                return (d.promise);
              });
          } else {
            // log("ZM_EVENT_IMAGE_DIGITS is already configured for " +
            // configParams.ZM_EVENT_IMAGE_DIGITS);
            d.resolve(configParams.ZM_EVENT_IMAGE_DIGITS);
            return (d.promise);
          }
          return (d.promise);
          */
        },

        //--------------------------------------------------------------------------
        // Useful to know what ZMS is using as its cgi-bin. If people misconfigure
        // the setting in the app, they can check their logs
        //--------------------------------------------------------------------------
        getPathZms: function () {
          var d = $q.defer();


          var apiurl = loginData.apiurl;
          var myurl = apiurl + '/configs/viewByName/ZM_PATH_ZMS.json?' + $rootScope.authSession;
          debug("Config URL for ZMS PATH is:" + myurl);
          $http.get(myurl)
            .then(function (data) {

                data = data.data;
                //console.log (">>>> GOT: "+JSON.stringify(data));
                configParams.ZM_PATH_ZMS = data.config.Value;
                d.resolve(configParams.ZM_PATH_ZMS);
                return (d.promise);
              },
              function (error) {
                log("Can't retrieving ZM_PATH_ZMS: " + JSON.stringify(error));
                d.resolve("");
                return (d.promise);
              });
          return (d.promise);

        },
        //--------------------------------------------------------------------------
        // returns high or low BW mode
        //--------------------------------------------------------------------------
        getBandwidth: function () {
          return getBandwidth();
        },

        getSnapshotFrame: function () {
          return snapshotFrame;
        },

        //-----------------------------------------------------------------------------
        // This function returns a list of monitors
        // if forceReload == 1 then it will force an HTTP API request to get a list of monitors
        // if 0. then it will return back the previously loaded monitor list if one exists, else
        // will issue a new HTTP API to get it

        // I've wrapped this function in my own promise even though http returns a promise.
        //-----------------------------------------------------------------------------
        //

        // returns a non promise version 
        // so if monitors is null, it will return null
        // As of now, this is only used by EventServer.js to 
        // send the right list of monitors after registration
        // token
        getMonitorsNow: function () {
          debug ('getMonitorsNow: returning '+monitors.length+' monitors');
          return monitors;
        },

        pauseLiveStream: function (ck, url, name) {
          if (!url) url = loginData.url;

          var myauthtoken = $rootScope.authSession.replace("&auth=", "");
          var req = url + '/index.php';
          req = req + "?view=request&request=stream";
          req = req + "&connkey=" + ck;
          req = req + "&auth=" + myauthtoken;
          // req = req + "&command=17";

          debug("NVR: Pausing live stream ck:" + ck + " for " + name + " url:" + url);
          return $http.get(req + "&command=1")
            .then(
              function (s) {
                //  debug("pause success for ck:" + ck );

              },
              function (e) {
                //     debug("pause error for ck:" + ck + " with:" + JSON.stringify(e));
              }
            );

        },

        resumeLiveStream: function (ck, url, name) {
          if (!url) url = loginData.url;

          var myauthtoken = $rootScope.authSession.replace("&auth=", "");
          var req = url + '/index.php';
          req = req + "?view=request&request=stream";
          req = req + "&connkey=" + ck;
          req = req + "&auth=" + myauthtoken;
          // req = req + "&command=17";

          debug("NVR: Resuming live stream ck:" + ck + " for " + name);
          return $http.get(req + "&command=2")
            .then(
              function (s) {
                //    debug("play success for ck:" + ck + " with:" + JSON.stringify(s));

              },
              function (e) {
                //    debug("play error for ck:" + ck + " with:" + JSON.stringify(e));
              }
            );

        },

        killLiveStream: function (ck, url, name) {

          if (!url) url = loginData.url;

          var myauthtoken = $rootScope.authSession.replace("&auth=", "");
          var req = url + '/index.php';
          req = req + "?view=request&request=stream";
          req = req + "&connkey=" + ck;
          req = req + "&auth=" + myauthtoken;
          // req = req + "&command=17";
          if (name == undefined) name = "";
          debug("NVR: killing " + name + " live stream ck:" + ck);
          return $http.get(req + "&command=17")
            .then(
              function (s) {
                //  debug ("kill success for ck:"+ck+" with:"+JSON.stringify(s));

              },
              function (e) { //debug ("kill success for ck:"+ck+" with:"+JSON.stringify(e));
              }
            );
        },

        regenConnKeys: function (mon) {

         return regenConnKeys (mon);
        },

        getMonitors: function (forceReload) {
          //console.log("** Inside ZMData getMonitors with forceReload=" + forceReload);

          
          $ionicLoading.show({
            template: $translate.instant('kLoadingMonitors'),
            animation: 'fade-in',
            showBackdrop: false,
            duration: zm.loadingTimeout,
            maxWidth: 200,
            showDelay: 0
          });

          var d = $q.defer();
          if ((monitorsLoaded == 0) || (forceReload == 1)) // monitors are empty or force reload
          {
            //console.log("NVR: Invoking HTTP get to load monitors");
            log((forceReload == 1) ? "getMonitors:Force reloading all monitors" : "getMonitors:Loading all monitors");
            var apiurl = loginData.apiurl;
            var myurl = apiurl + "/monitors";
            myurl += "/index/"+encodeURIComponent("Type !=:WebSite.json") + "?"+$rootScope.authSession;

            getZmsMultiPortSupport()
              .then(function (zmsPort) {

                var controlURL = "";

                debug("ZMS Multiport reported: " + zmsPort);
                debug("Monitor URL to fetch is:" + myurl);
                cache_or_http(myurl,'cached_monitors', true,3600*24)
                //$http.get(myurl /*,{timeout:15000}*/ )
                  .then(function (data) {
                      //  console.log("HTTP success got " + JSON.stringify(data.monitors));
                      data = data.data;
                      if (data.monitors) monitors = data.monitors;

                      // Now let's make sure we remove repeating monitors
                      // may happen in groups case

                      debug ("Before duplicate processing, we have: "+monitors.length+" monitors");
                      //console.log (JSON.stringify(monitors));
                      var monitorHash = {};
                      for (var mo in monitors) {
                        monitorHash[monitors[mo].Monitor.Id] = monitors[mo];
                      }
                      monitors = [];
                      for (mo in monitorHash) {
                        monitors.push(monitorHash[mo]);
                      }
                      debug ("After duplicate processing, we have: "+monitors.length+" monitors");
                      //console.log (JSON.stringify(monitors));
                      if ($rootScope.authSession == '') {
                        log("Now that we have monitors, lets get AuthKey...");
                        getAuthKey(monitors[0].Monitor.Id, (Math.floor((Math.random() * 999999) + 1)).toString());
                      }
                      monitors.sort(function (a, b) {
                        return parseInt(a.Monitor.Sequence) - parseInt(b.Monitor.Sequence);
                      });
                      //console.log("promise resolved inside HTTP success");
                      monitorsLoaded = 1;

                      reloadMonitorDisplayStatus();

                      debug("Inside getMonitors, will also regen connkeys");
                      debug("Now trying to get multi-server data, if present");
                      cache_or_http(apiurl + "/servers.json?" + $rootScope.authSession, 'cached_multi_servers', true, 3600*24)
                        .then(function (data) {
                            data = data.data;
                            // We found a server list API, so lets make sure
                            // we get the hostname as it will be needed for playback
                            log("multi server list loaded");
                            multiservers = data.servers;

                            var multiserver_scheme = "http://";
                            //console.log ("PORTAL URL IS:"+loginData.url);
                            if (loginData.url && (loginData.url.toLowerCase().indexOf("https://") != -1)) {
                              debug("Portal scheme is https, will use https for any multi-server without a protocol");
                              multiserver_scheme = "https://";
                            }
                            debug("default multi-server protocol will be:" + multiserver_scheme);

                            for (var i = 0; i < monitors.length; i++) {

                               // zm 1.33.15 prefixes 'ROTATE_' to orientation
                               monitors[i].Monitor.Orientation  = monitors[i].Monitor.Orientation.replace('ROTATE_','');

                              var recordingType = '';
                              if (monitors[i].Monitor.SaveJPEGs > 0) {
                                recordingType = $translate.instant('kImages');
                              }
                              if (monitors[i].Monitor.VideoWriter > 0) {
                                if (recordingType.length) recordingType += " + ";
                                recordingType = recordingType + $translate.instant('kVideo') + " (";
                                recordingType = recordingType + (monitors[i].Monitor.VideoWriter == 1 ? $translate.instant('kMonitorVideoEncode') : $translate.instant('kMonitorVideoPassThru')) + ")";
                              }

                              // in 1.30.4 these fields did not exist

                              monitors[i].Monitor.recordingType = recordingType ? recordingType : $translate.instant('kImages');
                              monitors[i].Monitor.listDisplay = 'show';
                              monitors[i].Monitor.isAlarmed = false;
                              monitors[i].Monitor.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
                              monitors[i].Monitor.rndKey = (Math.floor((Math.random() * 999999) + 1)).toString();

                              var serverFound = false;
                              for (var j = 0; j < multiservers.length; j++) {
                                //console.log ("Comparing " + multiservers[j].Server.Id + " AND " + monitors[i].Monitor.ServerId);
                                if (multiservers[j].Server.Id == monitors[i].Monitor.ServerId) {
                                  //console.log ("Found match");
                                  serverFound = true;
                                  break;
                                }

                              }
                              if (serverFound) {
                                // we found a monitor using a multi-server
                                if (!/^https?:\/\//i.test(multiservers[j].Server.Hostname)) {


                                  if (multiservers[j].Server.Protocol) {
                                    multiservers[j].Server.Hostname = multiservers[j].Server.Protocol +
                                      "://" + multiservers[j].Server.Hostname;
                                  } else {
                                    multiservers[j].Server.Hostname = multiserver_scheme + multiservers[j].Server.Hostname;
                                  }

                                }

                                //   debug("Monitor " + monitors[i].Monitor.Id + " has a recording server hostname of " + multiservers[j].Server.Hostname);



                                // Now here is the logic, I need to retrieve serverhostname,
                                // and slap on the host protocol and path. Meh.

                                var s = URI.parse(loginData.streamingurl);
                                var m = URI.parse(multiservers[j].Server.Hostname);
                                var p = URI.parse(loginData.url);


                                debug("recording server reported  is " + JSON.stringify(m));
                                //debug("portal  parsed is " + JSON.stringify(p));
                                //debug("streaming url  parsed is " + JSON.stringify(s));
                                debug("multi-port is:" + zmsPort);

                                var st = "";
                                var baseurl = "";
                                var streamingurl = "";


                                st += (m.scheme ? m.scheme : p.scheme) + "://"; // server scheme overrides 



                                // if server doesn't have a protocol, what we want is in path
                                if (!m.host) {
                                  m.host = m.path;
                                  m.path = undefined;
                                }

                                st += m.host;

                                //console.log ("STEP 1: ST="+st);

                                // now lets do port magic
                                if (multiservers[j].Server.Port) {
                                  debug("Found port inside multiserver: " + multiservers[j].Server.Id + ", using: " + multiservers[j].Server.Port);
                                  st += ":" + multiservers[j].Server.Port;
                                } else {
                                  debug("No port in serverId:" + multiservers[j].Server.Id);
                                  if (zmsPort <= 0 || loginData.disableSimulStreaming) {
                                    // no multiport so take from portal or multiserver if there
                                    if (p.port || m.port) {
                                      st += (m.port ? ":" + m.port : ":" + p.port);
                                      streamingurl = st;
                                      //console.log ("STEP 2 no ZMS: ST="+st);
                                    }
                                  } else {
                                    // we have multiserver
                                    var sport = parseInt(zmsPort) + parseInt(monitors[i].Monitor.Id);
                                    st = st + ':' + sport;
                                  }

                                }

                                baseurl = st;

                                controlURL = st;
                                controlURL += (p.path ? p.path : '');

                                st += (s.path ? s.path : p.path);
                                streamingurl += (s.path ? s.path : p.path);

                                //console.log ("STEP 3: ST="+st);


                                //console.log ("----------STREAMING URL PARSED AS " + st);

                                monitors[i].Monitor.streamingURL = st;
                                monitors[i].Monitor.baseURL = baseurl;
                                monitors[i].Monitor.controlURL = controlURL;
                                monitors[i].Monitor.recordingURL = controlURL;

                                debug("Storing baseurl=" + baseurl + " streamingURL=" + st + " recordingURL=" + controlURL);
                                //console.log ("** Streaming="+st+" **base="+baseurl);
                                // starting 1.30 we have fid=xxx mode to return images
                                monitors[i].Monitor.imageMode = (versionCompare($rootScope.apiVersion, "1.30") == -1) ? "path" : "fid";
                                //  debug("API " + $rootScope.apiVersion + ": Monitor " + monitors[i].Monitor.Id + " will use " + monitors[i].Monitor.imageMode + " for direct image access");

                                //debug ("Streaming URL for Monitor " + monitors[i].Monitor.Id  + " is " + monitors[i].Monitor.streamingURL );
                                //debug ("Base URL for Monitor " + monitors[i].Monitor.Id  + " is " + monitors[i].Monitor.baseURL );

                              } else {
                                // Non multiserver case
                                //monitors[i].Monitor.listDisplay = 'show';
                                debug("No servers matched, filling defaults...");
                                monitors[i].Monitor.isAlarmed = false;
                                monitors[i].Monitor.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
                                monitors[i].Monitor.rndKey = (Math.floor((Math.random() * 999999) + 1)).toString();

                                var st2 = loginData.streamingurl;
                                controlURL = loginData.url;

                                if (zmsPort > 0 && !loginData.disableSimulStreaming) {
                                  // we need to insert minport
                                  st2 = "";
                                  var p2 = URI.parse(loginData.streamingurl);
                                  var p3 = URI.parse(loginData.url);
                                  st2 += p2.scheme + "://";
                                  if (!p2.host) {
                                    p2.host = p2.path;
                                    p2.path = undefined;
                                  }
                                  st2 += p2.host;
                                  var sport2 = parseInt(zmsPort) + parseInt(monitors[i].Monitor.Id);
                                  st2 = st2 + ':' + sport2;

                                  controlURL = st2;

                                  if (p2.path) st2 += p2.path;
                                  if (p3.path) controlURL += p3.path;
                                }

                                debug("Storing streaming=" + st2 + " recording=" + controlURL);

                                monitors[i].Monitor.streamingURL = st2;
                                monitors[i].Monitor.controlURL = controlURL;
                                monitors[i].Monitor.recordingURL = controlURL;
                                //debug ("Streaming URL for Monitor " + monitors[i].Monitor.Id  + " is " + monitors[i].Monitor.streamingURL );
                                //console.log ("NO SERVER MATCH CONSTRUCTED STREAMING PATH="+st2);
                                monitors[i].Monitor.baseURL = loginData.url;
                                monitors[i].Monitor.imageMode = (versionCompare($rootScope.apiVersion, "1.30") == -1) ? "path" : "fid";


                              } // non multiserver end
                            }
                            // now get packery hide if applicable
                            reloadMonitorDisplayStatus();
                            d.resolve(monitors);
                          },
                          function (err) {
                            log("multi server list loading error");
                            multiservers = [];

                            for (var i = 0; i < monitors.length; i++) {
                              //monitors[i].Monitor.listDisplay = 'show';
                              // zm 1.33.15 prefixes 'ROTATE_' to orientation
                              monitors[i].Monitor.Orientation  = monitors[i].Monitor.Orientation.replace('ROTATE_','');
                              monitors[i].Monitor.isAlarmed = false;
                              monitors[i].Monitor.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
                              monitors[i].Monitor.rndKey = (Math.floor((Math.random() * 999999) + 1)).toString();
                              var st = loginData.streamingurl;
                              if (zmsPort > 0) {
                                // we need to insert minport
                                st = "";
                                var p = URI.parse(loginData.streamingurl);
                                st += p.scheme + "://";
                                if (!p.host) {
                                  p.host = p.path;
                                  p.path = undefined;
                                }
                                st += p.host;
                                var sport = parseInt(zmsPort) + parseInt(monitors[i].Monitor.Id);
                                st = st + ':' + sport;
                                if (p.path) st += p.path;



                              }

                              monitors[i].Monitor.streamingURL = st;
                              // console.log ("CONSTRUCTED STREAMING PATH="+st);
                              monitors[i].Monitor.baseURL = loginData.url;

                              monitors[i].Monitor.imageMode = (versionCompare($rootScope.apiVersion, "1.30") == -1) ? "path" : "fid";
                              //debug("API " + $rootScope.apiVersion + ": Monitor " + monitors[i].Monitor.Id + " will use " + monitors[i].Monitor.imageMode + " for direct image access");

                            }
                            d.resolve(monitors);

                          });

                      $ionicLoading.hide();
                      log("Monitor load was successful, loaded " + monitors.length + " monitors");

                    },
                    function (err) {
                      //console.log("HTTP Error " + err);
                      log("Monitor load failed " + JSON.stringify(err), "error");
                      // To keep it simple for now, I'm translating an error
                      // to imply no monitors could be loaded. FIXME: conver to proper error
                      monitors = [];
                      //console.log("promise resolved inside HTTP fail");
                      displayBanner('error', ['error retrieving monitor list', 'please try again']);
                      d.resolve(monitors);
                      $ionicLoading.hide();
                      monitorsLoaded = 0;
                    });
              });

            return d.promise;

          } else // monitors are loaded
          {
            //console.log("Returning pre-loaded list of " + monitors.length + " monitors");
            log("Returning pre-loaded list of " + monitors.length + " monitors");
            d.resolve(monitors);
            //console.log ("Returning"+JSON.stringify(monitors));
            $ionicLoading.hide();
            return d.promise;
          }

        },

        proceedWithLogin: function (obj) {

          var noBroadcast = false;
          var tryAccess = true;
          var tryRefresh = true;

          if (obj) {
            noBroadcast = obj.nobroadcast;
            tryAccess = obj.access;
            tryRefresh = obj.refresh;

          }

          var d = $q.defer();
        
           // This is a good time to check if auth is used :-p
           if (!loginData.isUseAuth) {
            log("Auth is disabled, setting authSession to empty");
            $rootScope.apiValid = true;
            $rootScope.authSession = '';
            d.resolve("Login Success");
  
            if (!noBroadcast) $rootScope.$broadcast('auth-success', 'no auth');
            return (d.promise);
  
          }
  
  
          // lets first try tokens and stored tokens
          if (loginData.isTokenSupported) 
          {
            log ("Detected token login supported");
            var now = moment.utc();
            var diff_access = moment.utc(loginData.accessTokenExpires).diff(now, 'minutes');
            var diff_refresh = moment.utc(loginData.refreshTokenExpires).diff(now, 'minutes');
  
            // first see if we can work with access token
            if (moment.utc(loginData.accessTokenExpires).isAfter(now) &&  diff_access  >=zm.accessTokenLeewayMin && tryAccess) {
              log ("Access token still has "+diff_access+" minutes left, using it");
              log ('----> Setting token re-login after '+diff_access*60+' seconds');
                  if (tokenExpiryTimer) $timeout.cancel(tokenExpiryTimer);
                  tokenExpiryTimer = $timeout ( function () {
                    $rootScope.$broadcast('token-expiry');
                  }, diff_access * 60  * 1000);
                  
              
              
              $rootScope.authSession = '&token='+loginData.accessToken;
              d.resolve("Login success via access token");
//              console.log ("**************** TOKEN SET="+$rootScope.authSession);
              if (!noBroadcast) $rootScope.$broadcast('auth-success', ''  );
              return d.promise;
            } 
            // then see if we have at least 30 mins left for refresh token
            else if (moment.utc(loginData.refreshTokenExpires).isAfter(now) &&  diff_refresh  >=zm.refreshTokenLeewayMin && tryRefresh) {
              log ("Refresh token still has "+diff_refresh+" minutes left, using it");
              var loginAPI = loginData.apiurl + '/host/login.json?token='+loginData.refreshToken;
              $http({
                method:'GET',
                url: loginAPI,
                skipIntercept:true,
              })
              .then (function (succ) {
                succ = succ.data;
                if (succ.access_token) {

                 // console.log ("**************** TOKEN SET="+succ.access_token);
                  $rootScope.authSession = '&token='+succ.access_token;
                  log ("New access token retrieved: ..."+succ.access_token.substr(-5));
                  loginData.accessToken = succ.access_token;
                  loginData.accessTokenExpires = moment.utc().add(succ.access_token_expires,'seconds');
                  //succ.access_token_expires = 30;
                  $rootScope.tokenExpires = succ.access_token_expires;
                  log ('----> Setting token re-login after '+succ.access_token_expires+' seconds');
                  if (tokenExpiryTimer) $timeout.cancel(tokenExpiryTimer);
                  tokenExpiryTimer = $timeout ( function () {
                    $rootScope.$broadcast('token-expiry');
                  }, succ.access_token_expires * 1000);
                  log ("Current time is: UTC "+moment.utc().format("YYYY-MM-DD hh:mm:ss"));
                  log ("New access token expires on: UTC "+loginData.accessTokenExpires.format("YYYY-MM-DD hh:mm:ss"));
                  log ("New access token expires on:"+loginData.accessTokenExpires.format("YYYY-MM-DD hh:mm:ss"));
                  loginData.isTokenSupported = true;
                  setLogin(loginData);
                  d.resolve("Login success via refresh token");
                  if (!noBroadcast) $rootScope.$broadcast('auth-success', ''  );
                  return d.promise;
                }
                else {
                  log ('ERROR:Trying to refresh with refresh token:'+JSON.stringify(succ));
                  return proceedWithFreshLogin(noBroadcast)
                  .then (function (succ) { 
                    d.resolve(succ); 
                    return (d.promise);
                  },
                  function(err) { 
                    d.resolve(err); 
                    return (d.promise);
                  });
  
                }
              },
              function (err) {
                  log ('access token login HTTP failed with: '+JSON.stringify(err));
                  return proceedWithFreshLogin(noBroadcast)
                  .then (function (succ) { 
                    d.resolve(succ); 
                    return (d.promise);
                  },
                  function(err) { 
                    d.resolve(err); 
                    return (d.promise);});
              });
            } // valid refresh
            else {
              log ('both access and refresh tokens are expired, using a fresh login');
              return proceedWithFreshLogin(noBroadcast)
              .then (function (succ) {
                 d.resolve(succ); 
                 return (d.promise);
                },
              function(err) { 
                d.resolve(err); 
                return (d.promise);
              });
            }
         
          } // is token supported
          else {
            log ("Token login not being used");
          // coming here means token reloads fell through
            return proceedWithFreshLogin(noBroadcast)
            .then (function (succ) { 
              d.resolve(succ); 
              return (d.promise);
            },
            function(err) { 
              d.resolve(err); 
              return (d.promise);
            });
          }
          return (d.promise);
        
        },
  
       
  

        zmPrivacyProcessed: function () {
          var apiurl = loginData.apiurl;
          var myurl = apiurl + '/configs/viewByName/ZM_SHOW_PRIVACY.json?' + $rootScope.authSession;
          var d = $q.defer();

          $http({
              url: myurl,
              method: 'GET',
              transformResponse: undefined,
              responseType: 'text',
            })
            // $http.get(myurl)
            .then(function (textsucc) {

                var succ;
                try {
                  //console.log(textsucc);
                  succ = JSON.parse(textsucc.data);
                  if (succ.data) succ = succ.data;
                  if (succ.config) {
                    if (succ.config.Value == '1') {
                      debug("Real value of PRIVACY is:" + succ.config.Value);
                      d.resolve(false);
                    } else {
                      debug("Real value of PRIVACY is:" + succ.config.Value);
                      d.resolve(true);
                    }
                    return d.promise;
                  } else {
                    debug("ZM_SHOW_PRIVACY likely does not exist");
                    d.resolve(true);
                    return d.promise;
                  }

                } catch (e) {
                  debug("ZM_SHOW_PRIVACY parsing error, assuming it doesn't exist");
                  d.resolve(true);
                  return d.promise;
                }

              },
              function (err) {
                debug("ZM_SHOW_PRIVACY returned an error, it likely doesn't exist");
                d.resolve(true);
                return d.promise;

              });
          return d.promise;
        },

        //-----------------------------------------------------------------------------
        //
        //-----------------------------------------------------------------------------
        setMonitors: function (mon) {
          //console.log("ZMData setMonitors called with " + mon.length + " monitors");
          monitors = mon;
        },

        processFastLogin: function () {
          var d = $q.defer();
          if (1) {
            d.reject("not implemented");
            return d.promise;
          }
          // console.log("inside processFastLogin");
          if (!loginData.fastLogin) {
            //console.log("Fast login not set");
            d.reject("fast login not enabled");
            debug("fast login not enabled");
            return d.promise;

          } else //fastlogin is on
          {
            localforage.getItem("lastLogin")
              .then(function (succ) {
                  //console.log("fast login DB found");
                  var dt = moment(succ);

                  if (dt.isValid()) {
                    debug("Got last login as " + dt.toString());
                    if (moment.duration(moment().diff(dt)).asHours() >= 2) {
                      d.reject("duration since last login >=2hrs, need to relogin");
                      return d.promise;
                    } else {
                      d.resolve("fast login is valid, less then 2 hrs");
                      return d.promise;
                    }
                  } else {
                    //console.log("Invalid date found");
                    d.reject("last-login invalid");
                    return d.promise;

                  }
                },
                function (e) {
                  //console.log("fastlogin DB not found");
                  d.reject("last-login not found, fastlogin rejected");
                  return d.promise;
                });

          }
          return d.promise;
        },
      

        // returns if this mid is hidden or not
        isNotHidden: function (mid) {
          var notHidden = true;
          for (var i = 0; i < monitors.length; i++) {
            if (monitors[i].Monitor.Id == mid) {
              notHidden = (monitors[i].Monitor.listDisplay == 'show') ? true : false;
              break;
            }

          }
          return notHidden;

        },

        getLocalTimeZoneNow: function () {
          return moment.tz.guess();
        },
        //returns TZ value immediately (sync)

        getTimeZoneNow: function () {
          // console.log ("getTimeZoneNow: " + tz ? tz : moment.tz.guess());
          return tz ? tz : moment.tz.guess();
        },

        // returns server timezone, failing which local timezone
        // always resolves true

        isTzSupported: function () {
          return isTzSupported;
        },

        flushAPICache: function () {
            return delete_all_caches();
        },

        getTimeZone: function (isForce) {

          var d = $q.defer();
          if (!tz || isForce) {

            log("First invocation of TimeZone, asking server");
            var apiurl = loginData.apiurl + '/host/getTimeZone.json?' + $rootScope.authSession;
            cache_or_http(apiurl, "cached_timezone", false, 3600*24)
              .then(function (success) {
                  tz = success.data.tz;
                  d.resolve(tz);
                  debug("Timezone API response is:" + success.data.tz);
                  if (success.data.tz !== undefined)
                    isTzSupported = true;
                  else
                    isTzSupported = false;
                  $rootScope.$broadcast('tz-updated');
                  return (d.promise);

                },
                function (error) {
                  tz = moment.tz.guess();
                  debug("Timezone API error handler, guessing local:" + tz);
                  d.resolve(tz);
                  isTzSupported = false;
                  return (d.promise);
                });

          } else {
            d.resolve(tz);
            return d.promise;
          }

          return d.promise;
        },

        //-----------------------------------------------------------------------------
        // When I display events in the event controller, this is the first function I call
        // This returns the total number of pages
        // I then proceed to display pages in reverse order to display the latest events first
        // I also reverse sort them in NVR to sort by date
        // All this effort because the ZM APIs return events in sorted order, oldest first. Yeesh.
        //-----------------------------------------------------------------------------

        getEventsPages: function (monitorId, startTime, endTime, noObjectFilter) {
          //console.log("********** INSIDE EVENTS PAGES ");

          var d = $q.defer();



          var apiurl = loginData.apiurl;

          var myurl = apiurl + "/events/index";
          if (monitorId != 0)
            myurl = myurl + "/"+encodeURIComponent("MonitorId:") + monitorId;
          if (startTime)
            myurl = myurl + "/"+encodeURIComponent("StartTime <=:") + endTime;
          if (endTime)
            myurl = myurl + "/"+encodeURIComponent("EndTime >=:") + startTime;

          myurl = myurl + "/"+encodeURIComponent("AlarmFrames >=:") + (loginData.enableAlarmCount ? loginData.minAlarmCount : 0);

          //https:///zm/api/events/index/Notes%20REGEXP:detected%3A.json
          if (loginData.objectDetectionFilter && !noObjectFilter) {
            myurl = myurl +'/'+ encodeURIComponent('Notes REGEXP:detected:');
          }


          myurl = myurl + ".json?" + $rootScope.authSession;
          //console.log (">>>>>Constructed URL " + myurl);

          $ionicLoading.show({
            template: $translate.instant('kCalcEventSize') + '...',
            animation: 'fade-in',
            showBackdrop: false,
            duration: zm.loadingTimeout,
            maxWidth: 200,
            showDelay: 0
          });

          //var myurl = (monitorId == 0) ? apiurl + "/events.json?page=1" : apiurl + "/events/index/MonitorId:" + monitorId + ".json?page=1";

          $http.get(myurl)
            .then(function (data) {
                data = data.data;
                $ionicLoading.hide();
                //console.log ("**** EVENTS PAGES I GOT "+JSON.stringify(data));
                //console.log("**** PAGE COUNT IS " + data.pagination.pageCount);
                d.resolve(data.pagination);
                return d.promise;
              },
              function (error) {
                $ionicLoading.hide();
                // console.log("*** ERROR GETTING TOTAL PAGES ***");
                log("Error retrieving page count of events " + JSON.stringify(error), "error");
                displayBanner('error', ['error retrieving event page count', 'please try again']);

                d.reject(error);
                return d.promise;
              });
          return d.promise;

        },

        //-----------------------------------------------------------------------------
        // This function returns events for  specific monitor or all monitors
        // You get here by tapping on events in the monitor screen or from
        // the menu events option
        // monitorId == 0 means all monitors (ZM starts from 1)
        //-----------------------------------------------------------------------------

        // new reminder
        // 
        //https:///zm/api/events.json?&sort=StartTime&direction=desc&page=1
        getEvents: function (monitorId, pageId, loadingStr, startTime, endTime, noObjectFilter, monListFilter) {



          if (!pageId) pageId = 1;
          //console.log("ZMData getEvents called with ID=" + monitorId + "and Page=" + pageId);

          if (!loadingStr) {
            loadingStr="<button class='button button-clear' style='line-height: normal; min-height: 0; min-width: 0;  color:#fff;' ng-click='$root.cancelAuth()'><i class='ion-close-circled'></i>&nbsp;" + $translate.instant('kLoadingEvents') + "...</button>";

            //loadingStr = $translate.instant('kLoadingEvents') + "...";
          }
          //if (loadingStr) loa

          if (loadingStr != 'none') {
            $ionicLoading.show({
              template: loadingStr,
              animation: 'fade-in',
              showBackdrop: false,
              maxWidth: 200,
              showDelay: 0,
              duration: zm.loadingTimeout, //specifically for Android - http seems to get stuck at times
            });
          }

          var d = $q.defer();
          var myevents = [];
          var apiurl = loginData.apiurl;

          var myurl = apiurl + "/events/index";
          if (monitorId != 0)
            myurl = myurl + "/"+encodeURIComponent("MonitorId:") + monitorId;
          if (startTime)
            myurl = myurl + "/"+encodeURIComponent("StartTime <=:") + endTime;
          if (endTime)
            myurl = myurl + "/"+encodeURIComponent("EndTime >=:") + startTime;

          myurl = myurl + "/"+encodeURIComponent("AlarmFrames >=:") + (loginData.enableAlarmCount ? loginData.minAlarmCount : 0);

          //console.log ('********* MON FILTER '+monListFilter);
          if (monListFilter) 
            myurl = myurl + monListFilter;

          // don't know why but adding page messes up Notes
          //https:///zm/api/events/index/Notes%20REGEXP: detected%3A.json
          if (loginData.objectDetectionFilter && !noObjectFilter) {
            myurl = myurl + '/'+encodeURIComponent('Notes REGEXP:detected:');
          }

      
          myurl = myurl + ".json?&sort=StartTime&direction=desc&page=" + pageId + $rootScope.authSession;


          debug("getEvents:" + myurl);
          //console.log ("LOG: "+myurl);
          // Simulated data

          // myurl = "https://api.myjson.com/bins/4jx44.json";

          //console.log (">>>>>Constructed URL " + myurl);

          $http.get(myurl /*,{timeout:15000}*/ )
            .then(function (data) {
                data = data.data;
                if (loadingStr != 'none') $ionicLoading.hide();
                //myevents = data.events;


                myevents = data;
                //console.log (myevents);


                d.resolve(myevents);
                return d.promise;

              },
              function (err) {
                if (loadingStr != 'none') $ionicLoading.hide();
                displayBanner('error', ['error retrieving event list', 'please try again']);
                //console.log("HTTP Events error " + err);
                log("Error fetching events for page " + pageId + " Err: " + JSON.stringify(err), "error");
                // I need to reject this as I have infinite scrolling
                // implemented in EventCtrl.js --> and if it does not know
                // it got an error going to the next page, it will get into
                // an infinite loop as we are at the bottom of the list always

                d.reject(myevents);


                return d.promise;
              });
          return d.promise;
        },

        //-----------------------------------------------------------------------------
        //
        //-----------------------------------------------------------------------------
        getMontageSize: function () {
          return loginData.montageSize;
        },

        //-----------------------------------------------------------------------------
        //
        //-----------------------------------------------------------------------------
        setMontageSize: function (montage) {
          loginData.montageSize = montage;
        },

        //-----------------------------------------------------------------------------
        //
        //-----------------------------------------------------------------------------
        getMonitorsLoaded: function () {
          // console.log("**** Inside promise function ");
          var deferred = $q.defer();
          if (monitorsLoaded != 0) {
            deferred.resolve(monitorsLoaded);
          }

          return deferred.promise;
        },

        //-----------------------------------------------------------------------------
        //
        //-----------------------------------------------------------------------------
        setMonitorsLoaded: function (loaded) {
          // console.log("ZMData.setMonitorsLoaded=" + loaded);
          monitorsLoaded = loaded;
        },

        //-----------------------------------------------------------------------------
        // returns the next monitor ID in the list
        // used for swipe next
        //-----------------------------------------------------------------------------
        getNextMonitor: function (monitorId, direction) {
          var id = parseInt(monitorId);
          var foundIndex = -1;
          for (var i = 0; i < monitors.length; i++) {
            if (parseInt(monitors[i].Monitor.Id) == id) {
              foundIndex = i;
              break;
            }
          }
          if (foundIndex != -1) {
            foundIndex = foundIndex + direction;
            // wrap around if needed
            if (foundIndex < 0) foundIndex = monitors.length - 1;
            if (foundIndex >= monitors.length) foundIndex = 0;
            return (monitors[foundIndex].Monitor.Id);
          } else {
            log("getNextMonitor could not find monitor " + monitorId);
            return (monitorId);
          }

        },

        //-----------------------------------------------------------------------------
        // Given a monitor Id it returns the monitor name
        // FIXME: Can I do a better job with associative arrays?
        //-----------------------------------------------------------------------------
        getMonitorName: function (id) {
          var idnum = parseInt(id);
          for (var i = 0; i < monitors.length; i++) {
            if (parseInt(monitors[i].Monitor.Id) == idnum) {
              // console.log ("Matched, exiting getMonitorname");
              return monitors[i].Monitor.Name;
            }

          }
          return "(Unknown)";
        },

        getMonitorObject: function (id) {
          var idnum = parseInt(id);
          for (var i = 0; i < monitors.length; i++) {
            if (parseInt(monitors[i].Monitor.Id) == idnum) {
              // console.log ("Matched, exiting getMonitorname");
              return monitors[i];
            }

          }
          return undefined;
        },

        getImageMode: function (id) {
          var idnum = parseInt(id);
          for (var i = 0; i < monitors.length; i++) {
            if (parseInt(monitors[i].Monitor.Id) == idnum) {
              // console.log ("Matched, exiting getMonitorname");
              return monitors[i].Monitor.imageMode;
            }

          }
          return "(Unknown)";
        },

        getStreamingURL: function (id) {
          var idnum = parseInt(id);
          for (var i = 0; i < monitors.length; i++) {
            // console.log ("Matched, exiting getMonitorname");
            if (parseInt(monitors[i].Monitor.Id) == idnum) {
              return monitors[i].Monitor.streamingURL;
            }

          }
          return "(Unknown)";
        },

        // tries to set up a DB
        // set/get a value and if it fails
        // goes back to localstorage
        // needed for some old Android phones where index setting works, but actually fails

        configureStorageDB: function () {

          debug("Inside configureStorageDB");
          var d = $q.defer();
          localforage.config({
            name: zm.dbName

          });

          if ($rootScope.platformOS == 'ios') {
            order = [window.cordovaSQLiteDriver._driver,
              localforage.INDEXEDDB,
              localforage.LOCALSTORAGE
            ];
          } else {
            // don't do SQL for Android
            // large keys hang on some devices
            // see https://github.com/litehelpers/Cordova-sqlite-storage/issues/533
            order = [
              localforage.INDEXEDDB,
              localforage.LOCALSTORAGE,
            ];
          }

          debug("configureStorageDB: trying order:" + JSON.stringify(order));

          localforage.defineDriver(window.cordovaSQLiteDriver).then(function () {
              return localforage.setDriver(
                // Try setting cordovaSQLiteDriver if available,
                // for desktops, it will pick the next one
                order
              );
            })
            .then(function (succ) {
              log("configureStorageDB:localforage driver for storage:" + localforage.driver());
              debug("configureStorageDB:Making sure this storage driver works...");
              return localforage.setItem('testPromiseKey', 'testPromiseValue');
            })
            .then(function (succ) {
              return localforage.getItem('testPromiseKey');
            })
            .then(function (succ) {
              if (succ != 'testPromiseValue') {
                log("configureStorageDB:this driver could not restore a test val, reverting to localstorage and hoping for the best...");
                return forceLocalStorage();
              } else {
                debug("configureStorageDB:test get/set worked, this driver is ok...");
                d.resolve(true);
                return d.promise;
              }
            })
            .catch(function (err) {
              log("configureStorageDB:this driver errored, reverting to localstorage and hoping for the best...: " + JSON.stringify(err));
              return forceLocalStorage();
            });

          return d.promise;

          function forceLocalStorage() {

            // var d = $q.defer();
            localforage.setDriver(localforage.LOCALSTORAGE)
              .then(function (succ) {
                  log("configureStorageDB:localforage forced setting to localstorage returned a driver of: " + localforage.driver());
                  d.resolve(true);
                  return d.promise;
                },
                function (err) {
                  log("*** configureStorageDB: Error setting localStorage too, zmNinja WILL NOT SAVE ***");
                  log("*** configureStorageDB: Dance, rejoice, keep re-configuring everytime you run ***");
                  d.resolve(true);
                  return d.promise;
                });
            return d.promise;

          }

        },


        getRecordingURL: function (id) {
          var idnum = parseInt(id);
          for (var i = 0; i < monitors.length; i++) {
            if (parseInt(monitors[i].Monitor.Id) == idnum) {
              // console.log ("Matched, exiting getMonitorname");
              //console.log ("!!!"+monitors[i].Monitor.controlURL);
              return monitors[i].Monitor.controlURL;
            }

          }
          return "(Unknown)";
        },

        getBaseURL: function (id) {
          var idnum = parseInt(id);
          for (var i = 0; i < monitors.length; i++) {
            if (parseInt(monitors[i].Monitor.Id) == idnum) {
              // console.log ("Matched, exiting getMonitorname");
              return monitors[i].Monitor.baseURL;
            }

          }
          return "(Unknown)";
        },

        logout: function () {
          var d = $q.defer();
          if ($rootScope.userCancelledAuth) {
            debug ('NVR logout: User cancelled auth, not proceeding');
            d.reject(true);
            return d.promise;
          }
          // always resolves
          if (!loginData.isUseAuth ||  loginData.isTokenSupported) {
            log("No need for logout!");
            d.resolve(true);
            return d.promise;
          }

         
         // $ionicLoading.show({ template: '<button class="button button-clear" style="line-height: normal; min-height: 0; min-width: 0;" ng-click="$root.cancel()"></button><i class="icon ion-chevron-up"></i> Loading...' });

        
          $ionicLoading.show({
            //template:$translate.instant('kCleaningUp'),
            template: "<a style='color:white; text-decoration:none' href='#' ng-click='$root.cancelAuth()' <i class='ion-close-circled'></i>&nbsp;" + $translate.instant('kCleaningUp')+"</a>",
            noBackdrop: true,

          });


          log(loginData.url + "=>Logging out of any existing ZM sessions...");
          $rootScope.authSession = "";


          // console.log("CURRENT SERVER: " + loginData.currentServerVersion);

          if (loginData.currentServerVersion && (versionCompare(loginData.currentServerVersion, zm.versionWithLoginAPI) != -1 || loginData.loginAPISupported)) {

            debug("Logging out using API method");
            $http.get(loginData.apiurl + '/host/logout.json', {
                timeout: 7000,
                transformResponse: undefined,
                // responseType:'text',
              })
              .then(function (s) {
                  debug("Logout returned... ");
                  d.resolve(true);
                  $ionicLoading.hide();
                  return d.promise;
                },
                function (e) {
                  debug("Logout errored but really don't worry, your ZM version may not support it");
                  $ionicLoading.hide();
                  d.resolve(true);
                  return d.promise;
                }
              );
            return d.promise;
          }


          // old logout mode
          debug("Logging out using Web method");
          $http({
              method: 'POST',
              timeout: 7000,
              //withCredentials: true,
              url: loginData.url + '/index.php?view=console',
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
                action: "logout",
                view: "login"
              }
            })
            .then(function (succ) {
                $ionicLoading.hide();
                d.resolve(true);
                return d.promise;
              },
              function (err) {
                $ionicLoading.hide();
                d.resolve(true);
                return d.promise;
              });
          return d.promise;
        }
      };
    }
  ]);
