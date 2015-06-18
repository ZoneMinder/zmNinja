// Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,ionic */


angular.module('zmApp.controllers').controller('zmApp.MontageCtrl', ['$scope', '$rootScope', 'ZMDataModel', 'message', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams','$ionicHistory','$ionicScrollDelegate', function ($scope, $rootScope, ZMDataModel, message, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http,$state, $stateParams, $ionicHistory,$ionicScrollDelegate) {


    // Triggered when you enter/exit full screen
    $scope.switchMinimal = function()
    {
        $scope.minimal = !$scope.minimal;
        console.log ("Hide Statusbar");
        ionic.Platform.fullScreen($scope.minimal,!$scope.minimal);
         $interval.cancel(intervalHandle); //we will renew on reload
        // We are reloading this view, so we don't want entry animations
        $ionicHistory.nextViewOptions({
              disableAnimate: true,
              disableBack: true
            });
      $state.go("montage", {minimal: $scope.minimal,
                            isRefresh:true});
      //$state.reload();
    };

      // Show/Hide PTZ control
      $scope.togglePTZ = function () {
        $scope.showPTZ = !$scope.showPTZ;
    };

     // This holds the PTZ menu control
     // Note that I hacked radialMenu
     // so please don't use the one you get from bower
      $scope.radialMenuOptions = {
        content: '',

        background: '#2F4F4F',
        isOpen: false,
        toggleOnClick: false,
        button: {
            cssClass: "fa  fa-arrows-alt",
        },
        items: [
            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, 'Down');
                }
    },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, 'DownLeft');
                }
    },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,

                onclick: function () {
                    controlPTZ($scope.monitorId, 'Left');
                }
    },
            {
                content: 'D',
                empty: true,

                onclick: function () {
                    console.log('About');
                }
    },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, 'UpLeft');
                }
    },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, 'Up');
                }
    },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, 'UpRight');
                }
    },

            {
                content: 'H',
                empty: true,
                onclick: function () {
                    console.log('About');
                }
    },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, 'Right');
                }
    },


            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, 'DownRight');
                }
    },

            {
                content: 'K',
                empty: true,
                onclick: function () {
                    console.log('About');
                }
    },


  ]
    };

    // Send PTZ command to ZM
    // FIXME: moveCon is hardcoded - won't work with
    // cams that don't use moveCon.
    // Need to grab control ID and then control API
    function controlPTZ(monitorId, cmd) {

        //curl -X POST "http://server.com/zm/index.php?view=request" -d "request=control&user=admin&passwd=xx&id=4&control=moveConLeft"

        console.log("Command value " + cmd + " with MID=" + monitorId);

        if (ZMDataModel.isSimulated()) {
            var str = "simulation mode. no action taken";
            $ionicLoading.show({
                template: str,
                noBackdrop: true,
                duration: 3000
            });
            return;
        }

        $ionicLoading.hide();
        $ionicLoading.show({
            template: "please wait...",
            noBackdrop: true,
            duration: 15000,
        });

        var loginData = ZMDataModel.getLogin();

        /*  $http({
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
                  console.log("****RETURNING " + foo);
                  return foo;
              },

              data: {
                  username:loginData.username,
                  password:loginData.password,
                  action:"login",
                  view:"console"
              }
          })
          .success (function(data,status,header,config)
          {*/
        $ionicLoading.hide();
        $ionicLoading.show({
            template: "Sending PTZ..",
            noBackdrop: true,
            duration: 15000,
        });


        var req = $http({
            method: 'POST',
            /*timeout: 15000,*/
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
                var foo = str.join("&");
                console.log("****RETURNING " + foo);
                return foo;
            },

            data: {
                view: "request",
                request: "control",
                id: monitorId,
                //connkey: $scope.connKey,
                control: "moveCon" + cmd,
                xge: "30",
                yge: "30",
                //user: loginData.username,
                //pass: loginData.password
            }

        });

        req.success(function (resp) {
            $ionicLoading.hide();
            console.log("SUCCESS: " + JSON.stringify(resp));

            // $ionicLoading.hide();

        });

        req.error(function (resp) {
            $ionicLoading.hide();
            console.log("ERROR: " + JSON.stringify(resp));
        });

        //});
    }



    // same logic as EventCtrl.js
    $scope.finishedLoadingImage = function () {
        console.log("***Monitor image FINISHED Loading***");
        $ionicLoading.hide();
        /* $ionicLoading.show({
             template: "loading, please wait...",
             noBackdrop: true,
         });*/
    };


    $scope.openModal = function (mid, controllable) {
        console.log("Open Monitor Modal");

        $scope.monitorId = mid;
        $scope.LoginData = ZMDataModel.getLogin();
        $scope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;

        // This is a modal to show the monitor footage
        $ionicModal.fromTemplateUrl('templates/monitors-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            })
            .then(function (modal) {
                $scope.modal = modal;

                $ionicLoading.show({
                    template: "please wait...",
                    noBackdrop: true,
                    duration: 15000
                });
            $scope.isControllable = controllable;
                $scope.showPTZ = false;
                $scope.modal.show();
            });

             // do a post login for PTZ
        var loginData = ZMDataModel.getLogin();
        console.log("*** MODAL PORTAL LOGIN ****");
        $http({
                method: 'POST',
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
                    var foo = str.join("&");
                    console.log("****RETURNING " + foo);
                    return foo;
                },

                data: {
                    username: loginData.username,
                    password: loginData.password,
                    action: "login",
                    view: "console"
                }
            })
            .success(function (data) {
                console.log("**** PORTAL  LOGIN OK");
            })
            .error(function (error) {
                console.log("**** PORTAL LOGIN FAILED");
            });

    };

    $scope.closeModal = function () {
        console.log("Close & Destroy Monitor Modal");
        $scope.modal.remove();

    };

    function scaleMontage()
    {
        var index = montageIndex;
        console.log (" MONTAGE INDEX === " + montageIndex);
        console.log ("Scaling Monitor " + index);
       if ($scope.monitorSize[index] == 6)
            $scope.scaleDirection[index] = -1;

        if ($scope.monitorSize[index] == 1)
            $scope.scaleDirection[index] = 1;

        $scope.monitorSize[index] += $scope.scaleDirection[index] ;

        console.log ("Changed size to "+$scope.monitorSize[index]);

        var monsizestring = "";
        var i;
        for ( i = 0; i<$scope.monitors.length; i++)
        {
            monsizestring = monsizestring + $scope.monitorSize[i]+':';
        }
        monsizestring = monsizestring.slice(0,-1); // kill last :
        console.log ("Setting monsize string:"+monsizestring);
        window.localStorage.setItem("montageArraySize", monsizestring);
    }

    $scope.onHold = function (index)
    {
        montageIndex = index;
        isLongPressActive = true;
            intervalHandleMontage = $interval(function () {
            scaleMontage();

        }.bind(this), 200);

    };

    $scope.onRelease = function (index)
    {
        console.log ("Press release on " + index);
        isLongPressActive = false;
        $interval.cancel(intervalHandleMontage);
    };




    // In Android, the app runs full steam while in background mode
    // while in iOS it gets suspended unless you ask for specific resources
    // So while this view, we DON'T want Android to keep sending 1 second
    // refreshes to the server for images we are not seeing!

    function onPause() {
        console.log("*** Moving to Background ***"); // Handle the pause event
        console.log("*** CANCELLING INTERVAL ****");
        $interval.cancel(intervalHandle);
    }

    document.addEventListener("pause", onPause, false);

    // I was facing a lot of problems with Chrome/crosswalk getting stuck with
    // pending HTTP requests after a while. There is a problem with chrome handling
    // multiple streams of always open HTTP get's (image streaming). This problem
    // does not arise when the image is streamed for a single monitor - just multiple

    // To work around this I am taking a single snapshot of ZMS and have implemented a timer
    // to reload the snapshot every 1 second. Seems to work reliably even thought its a higer
    // load. Will it bonk with many monitors? Who knows. I have tried with 5 and 1280x960@32bpp


    this.loadNotifications = function () {
        // randomval is appended to img src, so after each interval the image reloads
        $scope.randomval = (new Date()).getTime();
        //console.log ("**** NOTIFICATION with rand="+$scope.randomval+"*****");
    };


    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.$on('$destroy', function () {
        console.log("*** CANCELLING INTERVAL ****");
        $interval.cancel(intervalHandle);
    });


    $scope.$on('$ionicView.loaded', function () {
        console.log("**VIEW ** Montage Ctrl Loaded");
    });

    $scope.$on('$ionicView.enter', function () {
        console.log("**VIEW ** Montage Ctrl Entered");
    });

    $scope.$on('$ionicView.leave', function () {
        console.log("**VIEW ** Montage Ctrl Left");
    });

    $scope.$on('$ionicView.unloaded', function () {
        console.log("**VIEW ** Montage Ctrl Unloaded");
    });


    $scope.isSimulated = function () {
        return ZMDataModel.isSimulated();
    };



    // slider is tied to the view slider for montage
    //Remember not to use a variable. I'm using an object
    // so it's passed as a reference - otherwise it makes
    // a copy and the value never changes

    $scope.sliderChanged = function ()
    {
       console.log('Slider has changed');
        ZMDataModel.setMontageSize($scope.slider.monsize);
        console.log("Rootscope Montage is " + ZMDataModel.getMontageSize() + " and slider montage is " + $scope.slider.monsize);
        // Now go ahead and reset sizes of entire monitor array
        var monsizestring="";
        var i;
        for ( i = 0; i<$scope.monitors.length; i++)
        {

            $scope.monitorSize[i] = parseInt(ZMDataModel.getMontageSize());
            console.log ("Resetting Monitor "+i+" size to " +$scope.monitorSize[i]);
            $scope.scaleDirection[i] = 1;
            monsizestring = monsizestring + $scope.monitorSize[i]+':';
        }
        monsizestring = monsizestring.slice(0,-1); // kill last :
        console.log ("Setting monsize string:"+monsizestring);
        window.localStorage.setItem("montageArraySize", monsizestring);

    };

    $scope.$on('$ionicView.afterEnter', function () {
        // This rand is really used to reload the monitor image in img-src so it is not cached
        // I am making sure the image in montage view is always fresh
        // I don't think I am using this anymore FIXME: check and delete if needed
        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
    });



    $scope.doRefresh = function () {
        console.log("***Pull to Refresh");
        $scope.monitors = [];

        var refresh = ZMDataModel.getMonitors(1);
        refresh.then(function (data) {
            $scope.monitors = data;
            $scope.$broadcast('scroll.refreshComplete');
        });

    };

    var timestamp = new Date().getUTCMilliseconds();
    $scope.minimal = $stateParams.minimal;
    $scope.isRefresh = $stateParams.isRefresh;

    var isLongPressActive = false;
    var intervalHandleMontage; // will hold image resize timer on long press
    var montageIndex = 0; // will hold monitor ID to scale in timer

   // don't init here -will mess up scrolling
   $scope.monitorSize = []; // array with montage sizes per monitor
   $scope.scaleDirection = []; // 1 = increase -1 = decrease

    $scope.slider = {};
    $scope.slider.monsize = ZMDataModel.getMontageSize();

     //$scope.monitors = [];
    console.log ("********  HAVE ALL MONITORS");
    $scope.monitors = message;


    // Do we have a saved montage array size? No?
    if (window.localStorage.getItem("montageArraySize") == undefined)
    {

        for ( var i = 0; i<$scope.monitors.length; i++)
        {
            $scope.monitorSize.push(ZMDataModel.getMontageSize() );
           $scope.scaleDirection.push(1);
        }
    }
    else // recover previous settings
    {
        var msize = window.localStorage.getItem("montageArraySize");
        console.log ("MontageArrayString is=>"+msize);
        $scope.monitorSize= msize.split(":");
        var j;

        for (  j = 0; j<$scope.monitorSize.length; j++)
        {
            // convert to number other wise adding to it concatenates :-)
            $scope.monitorSize[j] = parseInt($scope.monitorSize[j]);
            $scope.scaleDirection.push(1);
            console.log ("Montage size for monitor " + j + " is " + $scope.monitorSize[j]);

        }

    }
    console.log ("********  SETTING VARS");
   // $scope.monitorSize = monitorSize;
   // $scope.scaleDirection = scaleDirection;

    $scope.LoginData = ZMDataModel.getLogin();
    $scope.monLimit = $scope.LoginData.maxMontage;
    console.log("********* Inside Montage Ctrl, MAX LIMIT=" + $scope.monLimit);


    var intervalHandle = $interval(function () {
        this.loadNotifications();
       //  console.log ("Refreshing Image...");
    }.bind(this), 1000);

    this.loadNotifications();
}]);
