/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console, Masonry, URI */

angular.module('zmApp.controllers').controller('zmApp.WizardCtrl', ['$scope', '$rootScope', '$ionicModal', 'NVR', '$ionicSideMenuDelegate', '$ionicHistory', '$state', '$ionicPopup', 'SecuredPopups', '$http', '$q', 'zm', '$ionicLoading', 'WizardHandler', '$translate', '$cookies', function ($scope, $rootScope, $ionicModal, NVR, $ionicSideMenuDelegate, $ionicHistory, $state, $ionicPopup, SecuredPopups, $http, $q, zm, $ionicLoading, WizardHandler, $translate, $cookies) {
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

  //--------------------------------------------------------------------------
  // logs into ZM
  //--------------------------------------------------------------------------

  function login(u, zmu, zmp) {
    var d = $q.defer();
    $http({
        method: 'post',
        //withCredentials: true,
        url: u,
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
          //console.log ("PARAMS in login:"+params);
          return params;
        },

        data: {
          username: zmu,
          password: zmp,
          action: "login",
          view: "console"
        }
      })
      .then(function (data, status, headers) {
          data = data.data;
          //console.log("LOOKING FOR " + zm.loginScreenString);
          //console.log("DATA RECEIVED " + JSON.stringify(data));
          if (data.indexOf(zm.loginScreenString1) == -1 && 
              data.indexOf(zm.loginScreenString2) == -1 ) {

            $scope.wizard.loginURL = $scope.wizard.fqportal;
            $scope.wizard.portalValidText = $translate.instant('kPortal') + ": " + $scope.wizard.loginURL;
            $scope.wizard.portalColor = "#16a085";
            d.resolve(true);
            return d.promise;
          } else {
            //console.log("************ERROR");
            $scope.wizard.portalValidText = $translate.instant('kPortalDetectionFailed');
            $scope.wizard.portalColor = "#e74c3c";
           // NVR.debug("Login response form was invalid,I am going to try JSON login");



            d.reject(false);
            return d.promise;
          }
        },
        function (error) {
          // console.log("************ERROR:"+ JSON.stringify(error));
          NVR.debug ("Login error returned: "+JSON.stringify(error));
          $scope.wizard.portalValidText = $translate.instant('kPortalDetectionFailed');
          $scope.wizard.portalColor = "#e74c3c";
          d.reject(false);
          return d.promise;

        });

    return d.promise;

  }

  //--------------------------------------------------------------------------
  // we need a monitor ID to do cgi-bin detection - if you don't have 
  // monitors configured, cgi-bin won't work
  //--------------------------------------------------------------------------

  function getFirstMonitor() {
    var d = $q.defer();
    $http.get($scope.wizard.apiURL + "/monitors.json?"+$rootScope.authSession)
      .then(function (success) {
          // console.log("getfirst monitor success: " + JSON.stringify(success));
          if (success.data.monitors.length > 0) {
            var foundMid = -1;
            for (var i = 0; i < success.data.monitors.length; i++) {
              if (success.data.monitors[i].Monitor.Function != 'None' &&
                success.data.monitors[i].Monitor.Enabled == '1') {
                foundMid = success.data.monitors[i].Monitor.Id;
                break;
              }
            }

            if (foundMid != -1) {
              NVR.debug("zmWizard - getFirstMonitor returned " + foundMid);
              d.resolve(foundMid);
              return d.promise;
            } else {
              d.reject(false);
              return d.promise;
            }

          } else {
            d.reject(false);
            return d.promise;
          }
        },
        function (error) {
          //console.log("getfirst monitor error: " + JSON.stringify(error));
          d.reject(false);
          return d.promise;
        });
    return d.promise;
  }

  //--------------------------------------------------------------------------
  // Utility function - iterates through a list of URLs 
  // Don't put loginData.reachability here --> we are using this to iterate
  // through multiple options - not the same as fallback
  //--------------------------------------------------------------------------

  function findFirstReachableUrl(urls, tail) {
    var d = $q.defer();
    if (urls.length > 0) {
      var t = "";
      if (tail) t = tail;
      //$ionicLoading.show({template: 'trying ' + urls[0].server});
      NVR.log("zmWizard test.." + urls[0] + t);
       return $http.get(urls[0] + t).then(function (succ) {
        NVR.log("Success:  on " + urls[0] + t);
        //NVR.log (JSON.stringify(succ));
        //$ionicLoading.hide();
        d.resolve(urls[0]);
        return d.promise;
        //return urls[0];
      }, function (err) {
        NVR.log("zmWizard:Failed on " + urls[0] + t + " with error " + JSON.stringify(err));
        // this is actually a success - I might get empty status
        // or something
        if (err.status < 300) {
          NVR.log("A 2xx is a success, I think - " + urls[0]);
          d.resolve(urls[0]);
          return d.promise;
        }


        return findFirstReachableUrl(urls.slice(1), tail);
      });
    } else {
      // $ionicLoading.hide();
      NVR.log("zmWizard: findFirst returned no success");
      d.reject("No reachable URL");
      return d.promise;

    }

    return d.promise;

  }

  //--------------------------------------------------------------------------
  // removes proto scheme from string
  //--------------------------------------------------------------------------

  function stripProto(u) {
    if (u.indexOf('://') != -1)
      return u.substr(u.indexOf('://') + 3);
    else
      return u;
  }

  //--------------------------------------------------------------------------
  // tries to detect cgi-bin
  //--------------------------------------------------------------------------

  function detectcgi() {
    var d = $q.defer();
    var c = URI.parse($scope.wizard.loginURL);
    var p1, p2;
    p1 = "";
    p2 = "";

    if (c.userinfo)
      p1 = c.userinfo + "@";
    if (c.port)
      p2 = ":" + c.port;

    var baseUri = c.scheme + "://" + p1 + c.host + p2;

    NVR.log("zmWizard CGI: baseURL is " + baseUri);

    var a5 = baseUri + "/zmcgi"; // mageia
    var a4 = baseUri + "/cgi-bin/zm"; // another one I found with a CentOS 6 guy
    var a1 = baseUri + "/zm/cgi-bin"; // ubuntu/debian
    var a2 = baseUri + "/cgi-bin-zm"; //fedora/centos/rhel
    var a3 = baseUri + "/cgi-bin"; // doofus

    var urls = [a1, a2, a3, a4, a5];

    // can't use getPathZms as loginData is not inited yet
    $http.get($scope.wizard.apiURL + "/configs/viewByName/ZM_PATH_ZMS.json?"+$rootScope.authSession)
      //NVR.getPathZms() // what does ZM have stored in PATH_ZMS?
      .then(function (data) {
          // remove zms or nph-zms
          var str = data.data.config.Value;
          var path = str.trim();
          path = path.replace("/nph-zms", "");
          path = path.replace("/zms", "");
          urls.push(baseUri.trim() + path);
          NVR.log("zmWizard: getPathZMS succeeded, adding " + baseUri + path + " to things to try");
          continueCgi(urls);
        },
        function (error) {
          NVR.log("zmWizard: getPathZMS failed, but continuing...");
          continueCgi(urls);
        });

    // Well, PATH_ZMS or not, lets call this function and brute force it
    function continueCgi(urls) {
      $ionicLoading.show({
        template: $translate.instant('kDiscovering') + "...",
        noBackdrop: true,
        duration: zm.httpTimeout
      });
      getFirstMonitor()
        .then(function (success) {
            $ionicLoading.hide();
            var tail = "/nph-zms?mode=single&monitor=" + success;//+ $rootScope.authSession;
            if ($scope.wizard.useauth && $scope.wizard.usezmauth) {

              var ck = Math.floor(Math.random() * (50000 - 10000 + 1)) + 10000;
              NVR.getAuthKey(success, ck)
                .then(function (success) {
                    if (success == "") {
                      NVR.log("getAuthKey returned null, so going user=&pwd= way");
                      tail += "&user=" + $scope.wizard.zmuser + "&pass=" + $scope.wizard.zmpassword;
                    } else {
                      tail += success;
                    }
                    NVR.log("auth computed is : " + tail);
                    proceedwithCgiAfterAuth(urls, tail);
                  },
                  function (error) {
                    NVR.log("Should never come here, getAuthKey doesn't return error");

                  });

              //console.log ("****CDING " + tail);
            } else // no auth case
            {
              proceedwithCgiAfterAuth(urls, tail);
            }

            function proceedwithCgiAfterAuth(urls, tail) {

              $ionicLoading.show({
                template: $translate.instant('kDiscovering') + "...",
                noBackdrop: true,
                duration: zm.httpTimeout
              });

              findFirstReachableUrl(urls, tail)
                .then(function (success) {
                    $ionicLoading.hide();
                    NVR.log("Valid cgi-bin found with: " + success);
                    $scope.wizard.streamingURL = success;
                    $scope.wizard.streamingValidText = "cgi-bin: " + $scope.wizard.streamingURL;
                    $scope.wizard.streamingColor = "#16a085";
                    d.resolve(true);
                    return d.promise;

                  },
                  function (error) {
                    $ionicLoading.hide();
                    NVR.debug("No cgi-bin found: " + JSON.stringify(error));
                    $scope.wizard.streamingValidText = $translate.instant('kPortalCgiBinFailed');
                    $scope.wizard.streamingColor = "#e74c3c";
                    d.reject(false);
                    return (d.promise);
                  });
            }
          },
          function (error) {
            $ionicLoading.hide();
            $scope.wizard.streamingValidText = $translate.instant('kPortalCgiBinFailed') + " -" + $translate.instant('kPortalNoMonitorFound');
            $scope.wizard.streamingColor = "#e74c3c";
            d.reject(false);
            return (d.promise);

          });
    }

    // https://server/zm/cgi-bin/nph-zms?mode=single&monitor=1&user=admin&pass=cc

    return d.promise;

  }

  //--------------------------------------------------------------------------
  // Finds an appropriate API to use
  //--------------------------------------------------------------------------

  function detectapi() {
    var u = $scope.wizard.loginURL;
    var d = $q.defer();
    var api1 = u + "/api";
    var api3 = u + "/zm/api";
    var c = URI.parse(u);

    // lets also try without the path
    var api2 = c.scheme + "://";
    if (c.userinfo) api2 += c.userinfo + "@";
    api2 += c.host;
    if (c.port) api2 += ":" + c.port;
    api2 += "/api";

    // lets try both /zm/api and /api. What else is there?
    var apilist = [api1, api2, api3];

    findFirstReachableUrl(apilist, '/host/getVersion.json?'+$rootScope.authSession)
      .then(function (success) {
          NVR.log("Valid API response found with:" + success);
          $scope.wizard.apiURL = success;

          $scope.wizard.apiValidText = "API: " + $scope.wizard.apiURL;
          $scope.wizard.apiColor = "#16a085";
          d.resolve(true);
          return d.promise;
        },
        function (error) {
          //console.log("No APIs found: " + error);
          $scope.wizard.apiValidText = $translate.instant('kPortalAPIFailed');
          $scope.wizard.apiColor = "#e74c3c";
          d.reject(false);
          return (d.promise);
        });

    return d.promise;
  }

  //--------------------------------------------------------------------------
  // logs out of ZM
  //--------------------------------------------------------------------------

  function logout(u) {
    var d = $q.defer();
    NVR.debug ("Clearing cookies");
    if (window.cordova) {
      // we need to do this or ZM will send same auth hash
      // this was fixed in a PR dated Oct 18
     
        cordova.plugin.http.clearCookies();
        if ($scope.wizard.useauth && $scope.wizard.usebasicauth) {
          NVR.debug ("setting basic auth with "+$scope.wizard.basicuser+":"+$scope.wizard.basicpassword);
          cordova.plugin.http.useBasicAuth($scope.wizard.basicuser, $scope.wizard.basicpassword);
  
        }
      
     }
      else {
        angular.forEach($cookies, function (v, k) {
          $cookies.remove(k);
         });
      }

      


    $http({
        method: 'POST',
        url: u,
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
      .then(function (success) {
        $rootScope.zmCookie = "";
        //console.log("ZMlogout success, cookie removed");
        d.resolve(true);
        return d.promise;
      }, function (error) {
        //console.log("ZMlogout success");
        d.resolve(true);
        return d.promise;
      });

    return d.promise;

  }

  //--------------------------------------------------------------------------
  // clears all status updates in the verify results page - if you 
  // get back to it
  //--------------------------------------------------------------------------

  $scope.enterResults = function () {
    $scope.portalValidText = "";
    $scope.apiValidateText = "";
    $scope.streamingValidateText = "";
    $scope.wizard.fqportal = "";
    return true;
  };
  //--------------------------------------------------------------------------
  // tries to log into the portal and then discover api and cgi-bin
  //--------------------------------------------------------------------------

  
  function loginWebScrape(u,zmu,zmp) {
    var d = $q.defer();
    NVR.debug("Logging in using old web-scrape method");

   

    $ionicLoading.show({
      template: $translate.instant('kAuthenticatingWebScrape'),
      noBackdrop: true,
      duration: zm.httpTimeout
    });

    u=u+'/index.php?view=console';
    NVR.debug ("webscrape login to:"+u);
   
    //NVR.debug ("*** AUTH LOGIN URL IS " + loginData.url);
    $http({

        method: 'post',
        timeout: zm.httpTimeout,
        //withCredentials: true,
        url: u ,
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
          username: zmu,
          password: zmp,
          action: "login",
          view: "console"
        }
      })
      .then(function (data, status, headers) {
          // console.log(">>>>>>>>>>>>>> PARALLEL POST SUCCESS");
          data = data.data;
          $ionicLoading.hide();

         // console.log ("GOT "+data);

          if (data.indexOf(zm.loginScreenString1) >=0 || 
          data.indexOf(zm.loginScreenString2) >=0 ) {
            //eventServer.start();
            //$rootScope.loggedIntoZm = 1;

            NVR.log("zmAutologin successfully logged into Zoneminder");
            $scope.wizard.loginURL = $scope.wizard.fqportal;
            $scope.wizard.portalValidText = $translate.instant('kPortal') + ": " + $scope.wizard.loginURL;
            $scope.wizard.portalColor = "#16a085";
            d.resolve(true);
            return d.promise;

            // now go to authKey part, so don't return yet...

          } else //  this means login error
          {
            // $rootScope.loggedIntoZm = -1;
            //console.log("**** ZM Login FAILED");
            NVR.log("zmAutologin Error: Bad Credentials ", "error");
            $scope.wizard.portalValidText = $translate.instant('kPortalDetectionFailed');
            $scope.wizard.portalColor = "#e74c3c";
            d.reject("Login Error");
            return (d.promise);
            // no need to go to next code, so return above
          }

          // Now go ahead and re-get auth key 
          // if login was a success
         
         

        },
        function (error, status) {

          // console.log(">>>>>>>>>>>>>> PARALLEL POST ERROR");
          $ionicLoading.hide();

          //console.log("**** ZM Login FAILED");

          // FIXME: Is this sometimes results in null

          NVR.log("zmAutologin Error " + JSON.stringify(error) + " and status " + status);
          // bad urls etc come here
          //$rootScope.loggedIntoZm = -1;
          $scope.wizard.portalValidText = $translate.instant('kPortalDetectionFailed');
          $scope.wizard.portalColor = "#e74c3c";
        
          d.reject("Login Error");
          return d.promise;
        });
    return d.promise;
  }

  function wizardLogin(u,zmu,zmp) {

    var d = $q.defer();
    var loginAPI = u + '/api/host/login.json';
    NVR.debug ("Inside wizardLogin: will try "+loginAPI);

        $http({
            method: 'post',
            url: loginAPI,
            timeout: zm.httpTimeout,
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
              user: zmu,
              pass: zmp
            }
          })
          //$http.get(loginAPI)
          .then(function (textsucc) {

              $ionicLoading.hide();

              var succ;
              try {

                succ = JSON.parse(textsucc.data);

                if (!succ.version) {
                  NVR.debug("API login returned fake success, going back to webscrape");
                 

                  loginWebScrape(u,zmu,zmp)
                    .then(function (succ) {
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
                NVR.debug("API based login returned... ");
              //  console.log (JSON.stringify(succ));
                $ionicLoading.hide();
                //$rootScope.loggedIntoZm = 1;
                $rootScope.authSession = '';
                if (succ.access_token) {
                  NVR.debug ('Got token, using it');
                  $rootScope.authSession = "&token=" + succ.access_token; 
                }
                else if (succ.credentials) {
                  NVR.debug ('Got auth= not token, using it');
                  $rootScope.authSession = "&" + succ.credentials;
                  if (succ.append_password == '1') {
                    $rootScope.authSession = $rootScope.authSession +
                      loginData.password;
                  }
                }

              
                NVR.log("Stream authentication construction: " +
                  $rootScope.authSession);

                NVR.log("zmAutologin successfully logged into Zoneminder via API");


                $scope.wizard.loginURL = $scope.wizard.fqportal;
                $scope.wizard.portalValidText = $translate.instant('kPortal') + ": " + $scope.wizard.loginURL;
            $scope.wizard.portalColor = "#16a085";

                d.resolve("Login Success");


                return d.promise;

              } catch (e) {
                NVR.debug("Login API approach did not work...");
              
                loginWebScrape(u,zmu,zmp)
                  .then(function (succ) {

                    $scope.wizard.loginURL = $scope.wizard.fqportal;
                    $scope.wizard.portalValidText = $translate.instant('kPortal') + ": " + $scope.wizard.loginURL;
                    $scope.wizard.portalColor = "#16a085";

                      d.resolve("Login Success");
                      return d.promise;
                    },
                    function (err) {
                      $ionicLoading.hide();
                      $scope.wizard.portalValidText = $translate.instant('kPortalDetectionFailed');
                      $scope.wizard.portalColor = "#e74c3c";
                      d.reject("Login Error");
                      return (d.promise);
                    });
                return d.promise;

              }



            },
            function (err) {
              NVR.debug("******************* API login error " + JSON.stringify(err));
              $ionicLoading.hide();


              if (1) {
                //if (err  && err.data && 'success' in err.data) {
                NVR.log("API based login not supported, need to use web scraping...");
                
                loginWebScrape(u,zmu,zmp)
                  .then(function (succ) {
                      d.resolve("Login Success");
                      return d.promise;
                    },
                    function (err) {
                      d.reject("Login Error");
                      return (d.promise);
                    });


              } else {
                // $rootScope.loggedIntoZm = -1;
                //console.log("**** ZM Login FAILED");
                NVR.log("zmAutologin Error via API: some meta foo", "error");
                $rootScope.$broadcast('auth-error', "I'm confused why");

                d.reject("Login Error");
                return (d.promise);

              }


            }
          ); // post



        return d.promise;
      }

    


  function validateData() {
    //console.log ("***** CLEARING AUTHSESSION IN VALIDATEDATA");
    $rootScope.authSession = '';
    $rootScope.zmCookie = '';

    $scope.wizard.portalValidText = "";
    $scope.wizard.apiValidText = "";
    $scope.wizard.streamingValidText = "";
    $scope.wizard.fqportal = "";
    $scope.wizard.loginURL = "";
    $scope.wizard.apiURL = "";
    $scope.wizard.streamingURL = "";
    $scope.wizard.serverName = "";

    var d = $q.defer();

    var c = URI.parse($scope.wizard.portalurl);

    $scope.wizard.serverName = c.host;
    if (c.port)
      $scope.wizard.serverName += "-" + c.port;

    var b = "";
    if ($scope.wizard.useauth && $scope.wizard.usebasicauth) {
      // b = $scope.wizard.basicuser + ":" + $scope.wizard.basicpassword + "@";
      //console.log("B=" + b);
      $rootScope.basicAuthHeader = 'Basic ' + btoa($scope.wizard.basicuser + ':' + $scope.wizard.basicpassword);
      //console.log (">>>> WIZARD SET BASIC AUTH TO  " + $rootScope.basicAuthHeader);
    }
    var u = c.scheme + "://" + b + c.host;
    if (c.port) u += ":" + c.port;
    if (c.path) u += c.path;

    if (u.slice(-1) == '/') {
      u = u.slice(0, -1);

    }

    $scope.wizard.fqportal = u;

    //u = u + '/index.php?view=console';
    NVR.log("Wizard: login url is " + u);

    // now lets login

    var zmu = "x";
    var zmp = "x";
    if ($scope.wizard.usezmauth) {
      zmu = $scope.wizard.zmuser;
      zmp = $scope.wizard.zmpassword;
    }

    // logout first for the adventurers amongst us who must
    // use it even after logging in
    NVR.log("zmWizard: logging out");
    $ionicLoading.show({
      template: $translate.instant('kCleaningUp') + "...",
      noBackdrop: true,
      duration: zm.httpTimeout
    });
    logout(u)
      .then(function (ans) {
        // login now
        $ionicLoading.hide();
        NVR.log("zmWizard: logging in with " + u + " " + zmu);

        // The logic will be:
        // Login then do an api detect and cgi-detect together
        $ionicLoading.show({
          template: $translate.instant('kDiscoveringPortal') + "...",
          noBackdrop: true,
          duration: zm.httpTimeout
        });
        NVR.setCurrentServerVersion("");
        wizardLogin(u, zmu, zmp)
          .then(function (success) {
              $ionicLoading.hide();
              NVR.log("zmWizard: login succeeded");

              // API Detection
              $ionicLoading.show({
                template: $translate.instant('kDiscoveringAPI') + "...",
                noBackdrop: true,
                duration: zm.httpTimeout
              });
              detectapi()
                .then(function (success) {
                    $ionicLoading.hide();
                    NVR.log("zmWizard: API succeeded");

                    $ionicLoading.show({
                      template: $translate.instant('kDiscoveringCGI') + "...",
                      noBackdrop: true,
                      duration: zm.httpTimeout
                    });
                    // CGI detection
                    detectcgi()
                      .then(function (success) {
                          $ionicLoading.hide();
                          // return true here because we want to progress
                          return d.resolve(true);
                        },
                        function (error) {
                          $ionicLoading.hide();
                          // return true here because we want to progress
                          return d.resolve(true);
                        });
                  },
                  function (error) {
                    $ionicLoading.hide();
                    NVR.log("zmWizard: api failed");

                    // return true here because we want to progress
                    return d.resolve(true);
                  });

            },

            // if login failed, don't progress in the wizard
            function (error) {
              $ionicLoading.hide();
              NVR.log("zmWizard: login failed");
              $scope.wizard.portalValidText = $translate.instant('kPortalLoginUnsuccessful');
              $scope.wizard.portalColor = "#e74c3c";
              return d.resolve(true);

            });

      }); //finally
    return d.promise;
  }

  //--------------------------------------------------------------------------
  // checks for  a protocol
  //--------------------------------------------------------------------------
  function checkscheme(url) {

    if ((!/^(f|ht)tps?:\/\//i.test(url)) && (url != "")) {
      return false;
    } else
      return true;
  }

  //--------------------------------------------------------------------------
  // exit validator for auth wizard
  //--------------------------------------------------------------------------

  $scope.exitAuth = function () {
    NVR.log("Wizard: validating auth syntax");
    if ($scope.wizard.useauth) {
      if (!$scope.wizard.usezmauth && !$scope.wizard.usebasicauth) {
        $rootScope.zmPopup = SecuredPopups.show('show', {
          title: $translate.instant('kError'),
          template: $translate.instant('kOneAuth'),
          buttons: [{
            text: $translate.instant('kButtonOk')
          }]

        });
        return false;
      }
      if ($scope.wizard.usezmauth) {
        if ((!$scope.wizard.zmuser) || (!$scope.wizard.zmpassword)) {
          $rootScope.zmPopup = SecuredPopups.show('show', {
            title: $translate.instant('kError'),
            template: $translate.instant('kValidNameZMAuth'),
            buttons: [{
              text: $translate.instant('kButtonOk')
            }]

          });
          return false;
        }
      }

      if ($scope.wizard.usebasicauth) {
        if ((!$scope.wizard.basicuser) || (!$scope.wizard.basicpassword)) {
          $rootScope.zmPopup = SecuredPopups.show('show', {
            title: $translate.instant('kError'),
            template: $translate.instant('kValidNameBasicAuth'),
            buttons: [{
              text: $translate.instant('kButtonOk')
            }]

          });
          return false;
        }
      }
    }
    // Coming here means we can go to the next step
    // load the step
    WizardHandler.wizard().next();
    // start discovery;
    validateData();

  };

  //--------------------------------------------------------------------------
  // validator for portal url wizard
  //--------------------------------------------------------------------------

  $scope.exitPortal = function () {
    NVR.log("Wizard: validating portal url syntax");

    if (!$scope.wizard.portalurl) {
      $rootScope.zmPopup = SecuredPopups.show('show', {
        title: $translate.instant('kError'),
        template: $translate.instant('kPortalEmpty'),
        buttons: [{
          text: $translate.instant('kButtonOk')
        }]

      });
      return false;
    }

    if (!checkscheme($scope.wizard.portalurl)) {

      $scope.portalproto = [{
          text: "http",
          value: "http://"
        },
        {
          text: "https",
          value: "https://"
        }
      ];
      $scope.myproto = {
        proto: ""
      };

      $rootScope.zmPopup = $ionicPopup.show({
        title: $translate.instant('kPortalNoProto'),
        scope: $scope,
        template: $translate.instant('kPortalPleaseSelect') + ': <ion-radio-fix ng-repeat="item in portalproto" ng-value="item.value" ng-model="myproto.proto">{{item.text}}</ion-radio-fix>',
        buttons: [{
          text: $translate.instant('kButtonOk'),
          onTap: function (e) {
            NVR.debug("Protocol selected:" + $scope.myproto.proto);
            $scope.wizard.portalurl = $scope.myproto.proto + stripProto($scope.wizard.portalurl);
          }

        }]

      });
      return false;
    }

    //$scope.wizard.portalurl = $scope.wizard.portalurl.toLowerCase().trim();
    $scope.wizard.portalurl = $scope.wizard.portalurl.trim();

    NVR.log("Wizard: stripped url:" + $scope.wizard.portalurl);

    var c = URI.parse($scope.wizard.portalurl);

    if (!c.scheme) {
      $rootScope.zmPopup = SecuredPopups.show('show', {
        title: $translate.instant('kError'),
        template: $translate.instant('kPortalInvalidUrl'),
        buttons: [{
          text: $translate.instant('kButtonOk')
        }]

      });
      return false;
    }

    if (c.userinfo) // basic auth stuff in here, take it out and put it into the next screen
    {
      $scope.wizard.useauth = true;
      $scope.wizard.usebasicauth = true;
      var barray = c.userinfo.split(":", 2);
      $scope.wizard.basicuser = barray[0];
      $scope.wizard.basicpassword = barray[1];
    }

    $scope.wizard.portalurl = c.scheme + "://";
    if (c.host) $scope.wizard.portalurl += c.host;
    if (c.port) $scope.wizard.portalurl += ":" + c.port;
    if (c.path) $scope.wizard.portalurl += c.path;

    $scope.wizard.portalurl = $scope.wizard.portalurl.toLowerCase();
    NVR.log("Wizard: normalized url:" + $scope.wizard.portalurl);
    return true;
  };

  //--------------------------------------------------------------------------
  // part of auth wizard - toggles display of auth components
  //--------------------------------------------------------------------------
  $scope.toggleAuth = function () {

    if (!$scope.wizard.useauth) {
      $scope.wizard.usebasicauth = false;
      $scope.wizard.usezmauth = false;
    }
  };

  //--------------------------------------------------------------------------
  // global tip toggler for all wizard steps
  //--------------------------------------------------------------------------
  $scope.toggleTip = function () {
    $scope.wizard.tipshow = !$scope.wizard.tipshow;
    if ($scope.wizard.tipshow)
      $scope.wizard.tiptext = $translate.instant('kHideTip');
    else
      $scope.wizard.tiptext = $translate.instant('kShowTip');
  };

  $scope.gotoLoginState = function () {
    $rootScope.wizard = angular.copy($scope.wizard);
    $ionicHistory.nextViewOptions({
      disableBack: true
    });
    $state.go("app.login", {
      "wizard": true
    });
    return;
  };

  //--------------------------------------------------------------------------
  // initial
  //--------------------------------------------------------------------------
  $scope.$on('$ionicView.beforeEnter', function () {
    //console.log("**VIEW ** Help Ctrl Entered");

    var monId = -1;
    $scope.wizard = {
      tipshow: false,
      tiptext: $translate.instant('kShowTip'),
      useauth: false,
      usebasicauth: false,
      usezmauth: false,
      portalurl: "",
      basicuser: "",
      basicpassword: "",
      zmuser: "",
      zmpassword: "",
      ///////////////////////
      loginURL: "",
      apiURL: "",
      streamingURL: "",
      fqportal: "",
      portalValidText: "",
      portalColor: "",
      apiValidText: "",
      apiColor: "",
      streamingValidText: "",
      streamingColor: "",
      serverName: "",

    };

  });

}]);
