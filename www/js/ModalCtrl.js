// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,ionic */


angular.module('zmApp.controllers').controller('ModalCtrl', ['$scope', '$rootScope', 'ZMDataModel',  '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams','$ionicHistory','$ionicScrollDelegate', function ($scope, $rootScope, ZMDataModel, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http,$state, $stateParams, $ionicHistory,$ionicScrollDelegate) {


    console.log ("**** INSIDE MODAL CTRL *****");

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



       $scope.finishedLoadingImage = function () {
        console.log("***Monitor image FINISHED Loading***");
        $ionicLoading.hide();
        /* $ionicLoading.show({
             template: "loading, please wait...",
             noBackdrop: true,
         });*/
    };





    // In Android, the app runs full steam while in background mode
    // while in iOS it gets suspended unless you ask for specific resources
    // So while this view, we DON'T want Android to keep sending 1 second
    // refreshes to the server for images we are not seeing!


}]);
