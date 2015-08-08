// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,ionic */


angular.module('zmApp.controllers').controller('ModalCtrl', ['$scope', '$rootScope', 'zm','ZMDataModel', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', function ($scope, $rootScope,zm, ZMDataModel, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate) {


    console.log("**** INSIDE MODAL CTRL, recomputing rand *****");

    $scope.rand = Math.floor((Math.random() * 100000) + 1);
    //$state.go($state.current, {}, {reload: true});

    // This holds the PTZ menu control
    // Note that I hacked radialMenu
    // so please don't use the one you get from bower

    //var imageStyle=1;
    //$scope.imageAspect = "max-width: 100%;max-height: 100%;";
    $scope.imageFit=false;
    // FIXME: This is a hack - for some reason
    // the custom slider view is messed up till the image loads
    // in modal view
    $scope.showModalRangeSider = false;

    $timeout( function() {
        $scope.showModalRangeSider = true;
        console.log ("****SHOWING SLIDER");
    },2000);

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
    ]};





    //-------------------------------------------------------------
    // Send PTZ command to ZM
    // Note: PTZ fails on desktop, don't bother about it
    //-------------------------------------------------------------
    function controlPTZ(monitorId, cmd) {

    //curl -X POST "http://server.com/zm/index.php?view=request" -d
    //"request=control&user=admin&passwd=xx&id=4&control=moveConLeft"

        if (!$scope.ptzMoveCommand)
        {
            $ionicLoading.show({
            template: "Not Ready for PTZ",
            noBackdrop: true,
            duration: 2000,
        });
            return;
        }


        console.log("Command value " + cmd + " with MID=" + monitorId);
        $ionicLoading.hide();
        $ionicLoading.show({
            template: "please wait...",
            noBackdrop: true,
            duration: zm.loadingTimeout,
        });

        var loginData = ZMDataModel.getLogin();
        $ionicLoading.hide();
        $ionicLoading.show({
            template: "Sending PTZ..",
            noBackdrop: true,
            duration: zm.loadingTimeout,
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
            // NOTE: Refer to
            // zoneminder/skins/mobile/includes/control_functions.php
            // for move commands
            // logic - /zm/api/monitors/X.json, read ControlId = Y
            // then zm/api/controls/Y.json

            data: {
                view: "request",
                request: "control",
                id: monitorId,
                control: $scope.ptzMoveCommand + cmd,
                xge: "30", //wtf
                yge: "30", //wtf
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
            ZMDataModel.zmLog("Error sending PTZ:" + JSON.stringify(resp), "error");
        });
    }

    $scope.finishedLoadingImage = function () {
       // console.log("***Monitor image FINISHED Loading***");
        $ionicLoading.hide();

    };


   $scope.onSwipeLeft = function(m,d)
   {
       console.log ("SWIPED LEFT");
       console.log ("Next Monitor ID is " + ZMDataModel.getNextMonitor(m,d));
       $scope.monitorId = ZMDataModel.getNextMonitor(m,d);


        $ionicLoading.hide();
        $ionicLoading.show({
            template: "please wait...",
            noBackdrop: true,
            duration: zm.loadingTimeout,
        });

   };

    $scope.onSwipeRight = function(m,d)
   {
        console.log ("SWIPED RIGHT");
        console.log ("Next Monitor ID is " + ZMDataModel.getNextMonitor(m,d));
        $scope.monitorId = ZMDataModel.getNextMonitor(m,d);

         $ionicLoading.show({
            template: "please wait...",
            noBackdrop: true,
            duration: zm.loadingTimeout,
        });
   };

    //-----------------------------------------------------------------------
    // Sucess/Error handlers for saving a snapshot of the
    // monitor image to phone storage
    //-----------------------------------------------------------------------

      function SaveSuccess() {
        $ionicLoading.show({
            template: "done!",
            noBackdrop: true,
            duration: 1000
        });
        console.log("***SUCCESS");
    }

    function SaveError(e) {
        $ionicLoading.show({
            template: "error - could not save",
            noBackdrop: true,
            duration: 2000
        });
        ZMDataModel.zmLog("Error saving image: " + e.message);
        console.log("***ERROR");
    }

     //-----------------------------------------------------------------------
    // Saves a snapshot of the monitor image to phone storage
    //-----------------------------------------------------------------------


    $scope.saveImageToPhone = function (mid) {
        $ionicLoading.show({
            template: "saving snapshot...",
            noBackdrop: true,
            duration: zm.httpTimeout
        });

        console.log("IMAGE CAPTURE INSIDE MODAL");
        var canvas, context, imageDataUrl, imageData;
        var loginData = ZMDataModel.getLogin();
        var url = loginData.streamingurl +
            '/cgi-bin/zms?mode=single&monitor=' + mid +
            '&user=' + loginData.username +
            '&pass=' + loginData.password;
        ZMDataModel.zmLog("SavetoPhone:Trying to save image from " + url);

        var img = new Image();
        img.onload = function () {
            canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);
            try {
                imageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
                imageData = imageDataUrl.replace(/data:image\/jpeg;base64,/, '');
                cordova.exec(
                    SaveSuccess,
                    SaveError,
                    'Canvas2ImagePlugin',
                    'saveImageDataToLibrary', [imageData]
                );
            } catch (e) {

                SaveError(e.message);
            }
        };
        try {
            img.src = url;
        } catch (e) {
            SaveError(e.message);

        }
    };

 $scope.scaleImage = function() {
      console.log ("Switching image style");
      $scope.imageFit = !$scope.imageFit;
};


}]);
