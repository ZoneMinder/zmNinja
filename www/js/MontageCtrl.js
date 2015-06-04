// Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */


angular.module('zmApp.controllers').controller('zmApp.MontageCtrl', ['$scope', '$rootScope', 'ZMDataModel', 'message', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', function ($scope, $rootScope, ZMDataModel, message, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http) {

    var timestamp = new Date().getUTCMilliseconds();
    $scope.isMinimal = false;

    $scope.switchMinimal = function()
    {
        $scope.minimal = !$scope.minimal;
    };

      $scope.togglePTZ = function () {
        $scope.showPTZ = !$scope.showPTZ;
    };

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
        // console.log ("ANGULAR VERSION: "+JSON.stringify(angular.version));

        // console.log('Set-Cookie'+ header('Set-Cookie')); //


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

    };

    $scope.closeModal = function () {
        console.log("Close & Destroy Monitor Modal");
        $scope.modal.remove();

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

    var intervalHandle = $interval(function () {
        this.loadNotifications();
    }.bind(this), 1000);

    this.loadNotifications();

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



    $scope.LoginData = ZMDataModel.getLogin();
    $scope.monLimit = $scope.LoginData.maxMontage;
    console.log("********* Inside Montage Ctrl, MAX LIMIT=" + $scope.monLimit);

    // slider is tied to the view slider for montage
    //Remember not to use a variable. I'm using an object
    // so it's passed as a reference - otherwise it makes
    // a copy and the value never changes
    $scope.slider = {};
    $scope.slider.monsize = ZMDataModel.getMontageSize();
    $scope.$on('$ionicView.afterEnter', function () {
        // This rand is really used to reload the monitor image in img-src so it is not cached
        // I am making sure the image in montage view is always fresh
        // I don't think I am using this anymore FIXME: check and delete if needed
        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
    });

    // we are monitoring the slider for movement here
    // make sure this is an object - so its passed by reference from the template to the controller!
    $scope.$watch('slider.monsize', function () {
        console.log('Slider has changed');
        ZMDataModel.setMontageSize($scope.slider.monsize);
        console.log("Rootscope Montage is " + ZMDataModel.getMontageSize() + " and slider montage is " + $scope.slider.monsize);

    });

    $scope.monitors = [];
    console.log("Inside MontageCtrl waiting for monitors to load...");

    $scope.monitors = message;
    console.log("I have received the monitors inside Montage and there are " + $scope.monitors.length);

    $scope.doRefresh = function () {
        console.log("***Pull to Refresh");
        $scope.monitors = [];

        var refresh = ZMDataModel.getMonitors(1);
        refresh.then(function (data) {
            $scope.monitors = data;
            $scope.$broadcast('scroll.refreshComplete');
        });

    };
}]);
