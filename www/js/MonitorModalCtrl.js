// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,ionic, moment, imagesLoaded, ConnectSDK */



angular.module('zmApp.controllers').controller('MonitorModalCtrl', ['$scope', '$rootScope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$q', '$sce', 'carouselUtils', '$ionicPopup', 'SecuredPopups', '$translate', function ($scope, $rootScope, zm, ZMDataModel, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $q, $sce, carouselUtils, $ionicPopup, SecuredPopups, $translate) {


 
 

    $scope.animationInProgress = false;
    $scope.imageFit = true;
    $scope.isModalActive = true;
    var intervalModalHandle;
    var nphTimer;
    var ld = ZMDataModel.getLogin();
    
    $rootScope.authSession = "undefined";
    
    $ionicLoading.show({
        template: $translate.instant('kNegotiatingStreamAuth')+'...',
        animation: 'fade-in',
        showBackdrop: true,
        duration: zm.loadingTimeout,
        maxWidth: 300,
        showDelay: 0
    });


    $scope.currentStreamMode = 'single';
    ZMDataModel.zmLog("Using stream mode " + $scope.currentStreamMode);

    ZMDataModel.zmDebug ("MonitorModalCtrl called from " + $ionicHistory.currentStateName());
 
    $rootScope.validMonitorId = $scope.monitors[0].Monitor.Id;
    ZMDataModel.getAuthKey($rootScope.validMonitorId, $scope.monitors[0].Monitor.connKey)
        .then(function (success) {
                $ionicLoading.hide();
                $rootScope.authSession = success;
                ZMDataModel.zmLog("Modal: Stream authentication construction: " + $rootScope.authSession);

            },
            function (error) {

                $ionicLoading.hide();
                ZMDataModel.zmDebug("ModalCtrl: Error details of stream auth:" + error);
                //$rootScope.authSession="";
                ZMDataModel.zmLog("Modal: Error returned Stream authentication construction. Retaining old value of: " + $rootScope.authSession);
            });
    
    
   
     $interval.cancel(intervalModalHandle);

    intervalModalHandle = $interval(function () {
        loadModalNotifications();
        //  console.log ("Refreshing Image...");
    }.bind(this), 5000);


   $timeout.cancel(nphTimer);
            nphTimer = $timeout(function () {
                $scope.currentStreamMode = 'jpeg';
                ZMDataModel.zmLog("Switching playback via nphzms");
            }, zm.nphSwitchTimer);
    
    // This is the PTZ menu

    $scope.ptzRadialMenuOptions = {
        content: '',

        background: '#2F4F4F',
        isOpen: true,
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
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'Down');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'DownLeft');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,

                onclick: function () {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'Left');
                }
            },
            {
                content: 'D',
                empty: true,

                onclick: function () {
                   // console.log('About');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'UpLeft');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'Up');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'UpRight');
                }
            },

            {
                content: 'H',
                empty: true,
                onclick: function () {
                    //console.log('About');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'Right');
                }
            },


            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'DownRight');
                }
            },

            {
                content: 'K',
                empty: true,
                onclick: function () {
                    //console.log('About');
                }
            },
    ]
    };

    //-------------------------------------------------------------
    // On re-auth, we need a new zms
    //-------------------------------------------------------------
   
      $rootScope.$on("auth-success", function () {

            ZMDataModel.zmDebug("MonitorModalCtrl: Re-login detected, resetting everything & re-generating connkey");
             ZMDataModel.stopNetwork("MonitorModal-auth success");
            $scope.connKey =  (Math.floor((Math.random() * 999999) + 1)).toString();
            
            
    });

    
     $scope.cast = function(mid, mon)
    {
         
         console.log ("PASSED WITH " + JSON.stringify(mon));
          //ConnectSDK.discoveryManager.startDiscovery();
         
         console.log ("Stopping");
         ConnectSDK.discoveryManager.stopDiscovery();
         
         console.log ("Starting");
         ConnectSDK.discoveryManager.startDiscovery();
         console.log ("picking");
          ConnectSDK.discoveryManager.pickDevice()
          .success(function (device) {
              //device.disconnect();
              function sendVideo (mid,mon) {
                    //device.getMediaPlayer().playMedia("http://media.w3.org/2010/05/sintel/trailer.mp4", "video/mp4");
                  
              //  var url = "http://www.connectsdk.com/files/9613/9656/8539/test_image.jpg";
                  
                //var url = mon.Monitor.streamingURL+"/nph-zms?mode=jpeg&monitor="+mid+$rootScope.authSession+"&rand="+$rootScope.modalRand;
                  
                  var ld = ZMDataModel.getLogin();
                  var url = mon.Monitor.streamingURL+"/nph-zms?mode=jpeg&monitor="+mid+"&user="+ld.username+"&pass="+ld.password+"&rand="+$rootScope.modalRand;
                  
                  console.log ("URL: " + url);
                var iconUrl = "http://www.connectsdk.com/files/9613/9656/8539/test_image.jpg";
                var mimeType = "image/jpeg";

                device.getMediaPlayer().displayImage(url, mimeType, {
                    title: "Monitor: "+mid,
                    description: "Monitor feed",
                }).success(function (launchSession, mediaControl) {
                    console.log("Image launch successful");
                }).error(function (err) {
                    console.log("error: " + err.message);
                });
                }

                if (device.isReady()) { // already connected
                    console.log (">>> device ready sending video");
                    sendVideo(mid,mon);
                } else {
                    device.on("ready", function() {sendVideo(mid,mon);});
                    console.log (">>> device not ready connecting");
                    device.connect();
                }
          })
          .error (
                function (error) {
                    console.log ("ERROR");
          });
    };
    
    //-------------------------------------------------------------
    // PTZ enable/disable
    //-------------------------------------------------------------
    
                      
     $scope.togglePTZ = function () {

        //console.log("PTZ");

        if ($scope.isControllable == '1') {
            //console.log ("iscontrollable is true");
            $scope.showPTZ = !$scope.showPTZ;
        } else {
            $ionicLoading.show({
                template: $translate.instant('kPTZnotConfigured'),
                noBackdrop: true,
                duration: 3000,
            });
        }

    };
    

   
    //-------------------------------------------------------------
    // Pause and resume handlers
    //-------------------------------------------------------------

    function onPause() {
        ZMDataModel.zmDebug("ModalCtrl: onpause called");
        $interval.cancel(intervalModalHandle);
        // $interval.cancel(modalIntervalHandle);

        // FIXME: Do I need to  setAwake(false) here?
    }


    function onResume() {
        ZMDataModel.zmDebug("ModalCtrl: Modal resume called");
        if ($scope.isModalActive) {
            ZMDataModel.zmLog("ModalCtrl: Restarting Modal timer on resume");

            $interval.cancel(intervalModalHandle);

            var ld = ZMDataModel.getLogin();
            
                intervalModalHandle = $interval(function () {
                    loadModalNotifications();
                }.bind(this),5000);
  
            $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);

        }

    }


    //-------------------------------------------------------------
    // Queries the 1.30 API for recording state of current monitor
    //-------------------------------------------------------------
    function loadModalNotifications() {
        
        if (ZMDataModel.versionCompare($rootScope.apiVersion,"1.30")==-1)
        {
            
            return;
        }

        var status = [$translate.instant('kMonIdle'), 
                      $translate.instant('kMonPreAlarm'),
                      $translate.instant('kMonAlarmed'),
                      $translate.instant('kMonAlert'),
                      $translate.instant('kMonRecord')
                     ];
        //console.log ("Inside Modal timer...");
        var apiurl = ZMDataModel.getLogin().apiurl;
        var alarmurl = apiurl+"/monitors/alarm/id:"+$scope.monitorId+"/command:status.json";
            ZMDataModel.zmLog ("Invoking " + alarmurl);
        
                
        $http.get(alarmurl)
            .then (function (data) {
               //  ZMDataModel.zmDebug ("Success in monitor alarmed status " + JSON.stringify(data));
                 
                 $scope.monStatus = status[parseInt(data.data.status)];
               
            }, 
                function (error) {
                
                
                     $scope.monStatus = "";
                     ZMDataModel.zmDebug ("Error in monitor alarmed status ");
            });
        

    }

    
    //-------------------------------------------------------------
    // Enable/Disable preset list
    //-------------------------------------------------------------

    $scope.togglePresets = function () {
        $scope.presetOn = !$scope.presetOn;
        //console.log("Changing preset to " + $scope.presetOn);

        var element = angular.element(document.getElementById("presetlist"));
        // bring it in
        if ($scope.presetOn) {
            element.removeClass("animated fadeOutUp");


        } else {
            element.removeClass("animated fadeInDown");
            element.addClass("animated fadeOutUp");
        }



    };


    //-------------------------------------------------------------
    // this is checked to make sure we are not pulling images
    // when app is in background. This is a problem with Android,
    // for example
    //-------------------------------------------------------------

    $scope.isBackground = function () {
        // console.log ("Is background called from ModalCtrl and returned " +    
        // ZMDataModel.isBackground());
        return ZMDataModel.isBackground();
    };
    
    
    
    
    
  
    //-------------------------------------------------------------
    // Send PTZ command to ZM
    // Note: PTZ fails on desktop, don't bother about it
    //-------------------------------------------------------------


    $scope.controlPTZ = function (monitorId, cmd) {
        controlPTZ(monitorId, cmd);
    };

    function controlPTZ(monitorId, cmd) {

        //presetGotoX
        //presetHome
        //curl -X POST "http://server.com/zm/index.php?view=request" -d
        //"request=control&user=admin&passwd=xx&id=4&control=moveConLeft"

        if (!$scope.ptzMoveCommand) {
            $ionicLoading.show({
                template: $translate.instant('kPTZNotReady'),
                noBackdrop: true,
                duration: 2000,
            });
            return;
        }

        var ptzData = "";
        if (cmd.lastIndexOf("preset", 0) === 0) {
            ZMDataModel.zmDebug("PTZ command is a preset, so skipping xge/lge");
            ptzData = {
                view: "request",
                request: "control",
                id: monitorId,
                control: cmd,
                //  xge: "30", //wtf
                //  yge: "30", //wtf
            };

        } else {

            ptzData = {
                view: "request",
                request: "control",
                id: monitorId,
                control: cmd,
                xge: "30", //wtf
                yge: "30", //wtf
            };
        }

        //console.log("Command value " + cmd + " with MID=" + monitorId);
        //console.log("PTZDATA is " + JSON.stringify(ptzData));
        $ionicLoading.hide();
        $ionicLoading.show({
            template: $translate.instant('kPleaseWait')+"...",
            noBackdrop: true,
            duration: zm.loadingTimeout,
        });

        var loginData = ZMDataModel.getLogin();
        $ionicLoading.hide();
        $ionicLoading.show({
            template: $translate.instant('kSendingPTZ')+"...",
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
                //console.log("****RETURNING " + foo);
                return foo;
            },
     
            data: ptzData

        });

        req.success(function (resp) {
            $ionicLoading.hide();
      
        });

        req.error(function (resp) {
            $ionicLoading.hide();
            //console.log("ERROR: " + JSON.stringify(resp));
            ZMDataModel.zmLog("Error sending PTZ:" + JSON.stringify(resp), "error");
        });
    }

 

    
    $scope.getZoomLevel = function () {
        //console.log("ON RELEASE");
        var zl = $ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition();
        //console.log(JSON.stringify(zl));
    };

    $scope.onTap = function (m, d) {

        moveToMonitor(m, d);
    };

    
    $scope.onSwipe = function (m, d) {
        var ld = ZMDataModel.getLogin();
        if (!ld.canSwipeMonitors) return;

        if ($ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom != 1) {
            //console.log("Image is zoomed in - not honoring swipe");
            return;
        }
        $scope.monStatus = "";
        moveToMonitor(m, d);



    };

    function moveToMonitor(m, d) {
        var curstate = $ionicHistory.currentStateName();
        var found = 0;
        var mid;
        mid = ZMDataModel.getNextMonitor(m, d);

        $scope.showPTZ = false;

        // FIXME: clean this up - in a situation where
        // no monitors are enabled, will it loop for ever?
        do {
            mid = ZMDataModel.getNextMonitor(m, d);
            m = mid;
            //console.log("Next Monitor is " + m);


            found = 0;
            for (var i = 0; i < $scope.monitors.length; i++) {
                if ($scope.monitors[i].Monitor.Id == mid &&
                    // if you came from monitors, then ignore noshow
                    ($scope.monitors[i].Monitor.listDisplay != 'noshow' || curstate == "monitors") &&
                    $scope.monitors[i].Monitor.Function != 'None' &&
                    $scope.monitors[i].Monitor.Enabled != '0') {
                    found = 1;
                    //console.log(mid + "is part of the monitor list");
                    ZMDataModel.zmDebug("ModalCtrl: swipe detected, moving to " + mid);
                    break;
                } else {
                    ZMDataModel.zmDebug("skipping " + $scope.monitors[i].Monitor.Id +
                        " listDisplay=" + $scope.monitors[i].Monitor.listDisplay +
                        " Function=" + $scope.monitors[i].Monitor.Function +
                        " Enabled=" + $scope.monitors[i].Monitor.Enabled);
                }
            }


        }
        while (found != 1);


        var slidein;
        var slideout;
        var dirn = d;
        if (dirn == 1) {
            slideout = "animated slideOutLeft";
            slidein = "animated slideInRight";
        } else {
            slideout = "animated slideOutRight";
            slidein = "animated slideInLeft";
        }

        var element = angular.element(document.getElementById("monitorimage"));
        element.addClass(slideout)
            .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', outWithOld);



        function outWithOld() {

            ZMDataModel.zmLog("ModalCtrl:Stopping network pull...");
            ZMDataModel.stopNetwork("MonitorModal-outwithOld");
            $scope.rand = Math.floor((Math.random() * 100000) + 1);
            $scope.animationInProgress = true;

            $timeout(function () {
                element.removeClass(slideout);
                element.addClass(slidein)
                    .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', inWithNew);
                $scope.monitorId = mid;
                $scope.monitorName = ZMDataModel.getMonitorName(mid);
                $scope.monitor = ZMDataModel.getMonitorObject(mid);
                configurePTZ($scope.monitorId);
            }, 200);
        }

        function inWithNew() {

            element.removeClass(slidein);
            $scope.animationInProgress = false;

            ZMDataModel.zmLog("New image loaded in");
            var ld = ZMDataModel.getLogin();
            carouselUtils.setStop(false);
            if (ld.useNphZms == true) {
                $scope.currentStreamMode = 'single';
                ZMDataModel.zmLog("Setting timer to play nph-zms mode");
                // first 5 seconds, load a snapshot, then switch to real FPS display
                // this is to avoid initial image load delay
                // FIXME: 5 seconds fair?
                $timeout.cancel(nphTimer);
                nphTimer = $timeout(function () {
                    $scope.currentStreamMode = 'jpeg';
                    ZMDataModel.zmLog("Switching playback via nphzms");
                }, zm.nphSwitchTimer);
            }

        }


        $ionicLoading.hide();
       

    }



    //-----------------------------------------------------------------------
    // Sucess/Error handlers for saving a snapshot of the
    // monitor image to phone storage
    //-----------------------------------------------------------------------

    function SaveSuccess() {
        $ionicLoading.show({
            template: $translate.instant('kDone'),
            noBackdrop: true,
            duration: 1000
        });
        ZMDataModel.zmDebug("ModalCtrl:Photo saved successfuly");
    }

    function SaveError(e) {
        $ionicLoading.show({
            template: $translate.instant('kErrorSave'),
            noBackdrop: true,
            duration: 2000
        });
        ZMDataModel.zmLog("Error saving image: " + e.message);
        //console.log("***ERROR");
    }


    //-------------------------------------------------------------
    // Turns on or off an alarm forcibly (mode true = on, false = off)
    //-------------------------------------------------------------
    $scope.enableAlarm = function(mid,mode)
    {
        
        if (mode) // trigger alarm
        {
             $rootScope.zmPopup = SecuredPopups.show('show',{
                    title: 'Confirm',
                    template: $translate.instant('kForceAlarmConfirm')+$scope.monitorName+"?",
                    buttons: [
                        {
                            text: $translate.instant('kButtonYes'),
                            onTap: function(e)
                            {
                                enableAlarm(mid, mode);
                            }
                        },
                        {
                            text: $translate.instant('kButtonNo'),
                            onTap: function (e)
                            {
                                return;
                            }
                        }
                    ]
                               
                    });
        }
        else
            enableAlarm(mid,mode);
        
        function enableAlarm(mid,mode)
        {
            var apiurl = ZMDataModel.getLogin().apiurl;
            var c = mode? "on":"off";
            var alarmurl = apiurl+"/monitors/alarm/id:"+mid+"/command:"+c+".json";
            ZMDataModel.zmLog ("Invoking " + alarmurl);
            
            var status = mode? $translate.instant('kForcingAlarm'): $translate.instant('kCancellingAlarm');
            $ionicLoading.show({
                            template: status,
                            noBackdrop: true,
                            duration: zm.largeHttpTimeout,
                        });
            
            $http.get(alarmurl)
            .then (function (data) {
                $ionicLoading.show({
                            template: $translate.instant('kSuccess'),
                            noBackdrop: true,
                            duration: 2000,
                        });
            }, 
                function (error) {
                
                $ionicLoading.show({
                            template: $translate.instant('kAlarmAPIError'),
                            noBackdrop: true,
                            duration: 3000,
                        });
                ZMDataModel.zmDebug ("Error in enableAlarm " + JSON.stringify(error));
            });
        }
        
        
        
    };
    
    
    //-----------------------------------------------------------------------
    // color for monitor state
    //-----------------------------------------------------------------------
    
    $scope.stateColor = function()
    {
        var status = [$translate.instant('kMonIdle'), 
                      $translate.instant('kMonPreAlarm'),
                      $translate.instant('kMonAlarmed'),
                      $translate.instant('kMonAlert'),
                      $translate.instant('kMonRecord')
                     ];
        //console.log ("***MONSTATUS**"+$scope.monStatus+"**");
        var color="";
        switch ($scope.monStatus)
        {
            case "":
                color="background-color:none";
                break;
            case status[0]:
                color="background-color:#4B77BE";
                break;
            case status[1]:
                color="background-color:#e67e22";
                break;
            case  status[2]:
                color="background-color:#D91E18";
                break;
            case status[3]:
                color="background-color:#e67e22";
                break;
            case status[4]:
                color="background-color:#26A65B";
                break;
        }
            
        return "padding-left:4px;padding-right:4px;"+color;
    };


    //-----------------------------------------------------------------------
    // Saves a snapshot of the monitor image to phone storage
    //-----------------------------------------------------------------------

    $scope.saveImageToPhone = function (mid) {
        $ionicLoading.show({
            template: $translate.instant('kSavingSnapshot')+'...',
            noBackdrop: true,
            duration: zm.httpTimeout
        });

        ZMDataModel.zmDebug("ModalCtrl: SaveImageToPhone called");
        var canvas, context, imageDataUrl, imageData;
        var loginData = ZMDataModel.getLogin();
        var url = loginData.streamingurl +
            '/zms?mode=single&monitor=' + mid +
            $rootScope.authSession;
        ZMDataModel.zmLog("SavetoPhone:Trying to save image from " + url);

        var img = new Image();
        img.onload = function () {
            // console.log("********* ONLOAD");
            canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);

            imageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
            imageData = imageDataUrl.replace(/data:image\/jpeg;base64,/, '');

            if ($rootScope.platformOS != "desktop") {
                try {

                    cordova.exec(
                        SaveSuccess,
                        SaveError,
                        'Canvas2ImagePlugin',
                        'saveImageDataToLibrary', [imageData]
                    );
                } catch (e) {

                    SaveError(e.message);
                }
            } else {


                var fname = $scope.monitorName + "-" +
                    moment().format('MMM-DD-YY_HH-mm-ss') + ".png";
                canvas.toBlob(function (blob) {
                    saveAs(blob, fname);
                    SaveSuccess();
                    
                });
            }
        };
        try {
            img.src = url;
            // console.log ("SAVING IMAGE SOURCE");
        } catch (e) {
            SaveError(e.message);

        }
    };




    //-------------------------------------------------------------
    //reloaads mon - do we need it?
    //-------------------------------------------------------------


    $scope.reloadView = function () {
        ZMDataModel.zmLog("Reloading view for modal view, recomputing rand");
        $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);
        $scope.isModalActive = true;
    };

    $scope.scaleImage = function () {

        $scope.imageFit = !$scope.imageFit;
       // console.log("Switching image style to " + $scope.imageFit);
    };

    $scope.$on('$ionicView.enter', function () {
            

    });

    $scope.$on('$ionicView.leave', function () {
       // console.log("**MODAL: Stopping modal timer");
        $scope.isModalActive = false;
        $interval.cancel(intervalModalHandle);
    });
    
    
    $scope.$on('$ionicView.beforeLeave', function () {
      
         ZMDataModel.zmLog ("Nullifying the streams...");
        
        
        var element = document.getElementById("singlemonitor");
        if (element)
        {
            ZMDataModel.zmDebug("Nullifying  " + element.src);
            element.src="";
        }
            
   
      
    });

    $scope.$on('$ionicView.unloaded', function () {
        $scope.isModalActive = false;
   
        $interval.cancel(intervalModalHandle);

    });

    $scope.$on('modal.removed', function () {
        $scope.isModalActive = false;
        //console.log("**MODAL REMOVED: Stopping modal timer");
        $interval.cancel(intervalModalHandle);
        
        ZMDataModel.zmDebug ("Modal removed - killing connkey");
        controlStream(17,"",$scope.connKey,-1);
        

        // Execute action
    });

    //-------------------------------------------------------------
    // called to kill connkey, not sure if we really need it
    // I think we are calling window.stop() which is a hammer
    // anyway 
    //-------------------------------------------------------------

    
    function controlStream(cmd, disp, connkey, ndx) {
            // console.log("Command value " + cmd);

            if (disp) {
                $ionicLoading.hide();
                $ionicLoading.show({
                    template: $translate.instant('kPleaseWait')+'...',
                    noBackdrop: true,
                    duration: zm.loadingTimeout,
                });
            }
            var loginData = ZMDataModel.getLogin();

            /*
            var CMD_NONE = 0;
            var CMD_PAUSE = 1;
            var CMD_PLAY = 2;
            var CMD_STOP = 3;
            var CMD_FASTFWD = 4;
            var CMD_SLOWFWD = 5;
            var CMD_SLOWREV = 6;
            var CMD_FASTREV = 7;
            var CMD_ZOOMIN = 8;
            var CMD_ZOOMOUT = 9;
            var CMD_PAN = 10;
            var CMD_SCALE = 11;
            var CMD_PREV = 12;
            var CMD_NEXT = 13;
            var CMD_SEEK = 14;
            var CMD_QUIT = 17;
            var CMD_QUERY = 99;
            */
       
            var myauthtoken = $rootScope.authSession.replace("&auth=","");
        //&auth=
            var req = $http({
                method: 'POST',
                /*timeout: 15000,*/
                url: loginData.url + '/index.php',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    //'Accept': '*/*',
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
                    view: "request",
                    request: "stream",
                    connkey: connkey,
                    command: cmd,
                    auth: myauthtoken,
               
                }
            });
            req.success(function (resp) {

                if (resp.result=="Ok" && ndx != -1)
                {   
                    var ld = ZMDataModel.getLogin();
                    var apiurl= ld.apiurl + "/events/"+resp.status.event+".json";
                    //console.log ("API " + apiurl);
                    $http.get (apiurl)
                    .success (function (data)
                    {
                        if ($scope.MontageMonitors[ndx].eventUrlTime!=data.event.Event.StartTime)
                        {
                            
                            var element = angular.element(document.getElementById($scope.MontageMonitors[ndx].Monitor.Id+"-timeline"));
                                    element.removeClass ('animated slideInRight');
                                    element.addClass('animated slideOutRight');
                                    $timeout (function() {
                                        element.removeClass ('animated slideOutRight');
                                         element.addClass('animated slideInRight');
                                        $scope.MontageMonitors[ndx].eventUrlTime=data.event.Event.StartTime;
                                    },300);
                               
                        }
                        
                    })
                    .error (function (data)
                    {
                        $scope.MontageMonitors[ndx].eventUrlTime="-";
                    });
                    
                }

            });

            req.error(function (resp) {
                //console.log("ERROR: " + JSON.stringify(resp));
                ZMDataModel.zmLog("Error sending event command " + JSON.stringify(resp), "error");
            });
        }


    //-------------------------------------------------------------
    // Zoom in and out via +- for desktops
    //-------------------------------------------------------------
    $scope.zoomImage = function (val)
    {
        var zl = parseInt($ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom);
        if (zl == 1 && val == -1)
        {
            ZMDataModel.zmDebug ("Already zoomed out max");
            return;
        }
        
        
        zl+=val;
        ZMDataModel.zmDebug ("Zoom level is " + zl); $ionicScrollDelegate.$getByHandle("imgscroll").zoomTo(zl,true);
        
    };
    

    //-------------------------------------------------------------
    // Retrieves PTZ state for each monitor
    //-------------------------------------------------------------
    // make sure following are correct:
    // $scope.isControllable 
    // $scope.controlid
    // 
    function configurePTZ(mid)
    {
        $scope.ptzMoveCommand = "";
        $scope.ptzStopCommand = "";
        
        $scope.zoomInCommand = "";
        $scope.zoomOutCommand = "";
        $scope.zoomStopCommand = "zoomStop";
        $scope.canZoom = false;
        
        $scope.presetOn = false;
        
        ZMDataModel.zmDebug ("configurePTZ: called with mid="+mid);
        var ld = ZMDataModel.getLogin();
        var url = ld.apiurl+"/monitors/"+mid+".json";
        $http.get (url)
        .success (function (data)
         {
            $scope.isControllable = data.monitor.Monitor.Controllable;
            // for testing only
            // $scope.isControllable = 1;
            $scope.controlid = data.monitor.Monitor.ControlId;
            if ($scope.isControllable=='1')
            {
                var apiurl = ZMDataModel.getLogin().apiurl;
                var myurl = apiurl + "/controls/" + $scope.controlid + ".json";
                ZMDataModel.zmDebug("configurePTZ : getting controllable data " + myurl);

                $http.get(myurl)
                    .success(function (data) {

                    $scope.ptzMoveCommand = "move"; // start with as move;
                    $scope.ptzStopCommand = "";
                
                    if (data.control.Control.CanZoom=='1')
                    {
                        $scope.canZoom = true;
                        if (data.control.Control.CanZoomCon == '1')
                        {
                            $scope.zoomInCommand = "zoomConTele";
                            $scope.zoomOutCommand = "zoomConWide";
                            
                        }
                        else if (data.control.Control.CanZoomRel == '1')
                        {
                            $scope.zoomInCommand = "zoomRelTele";
                            $scope.zoomOutCommand = "zoomRelWide";
                        }
                        
                        else if (data.control.Control.CanZoomAbs == '1')
                        {
                            $scope.zoomInCommand = "zoomRelAbs";
                            $scope.zoomOutCommand = "zoomRelAbs";
                        }
                    }

                
                    ZMDataModel.zmDebug("configurePTZ: control data returned " + JSON.stringify(data));
                
                    if (data.control.Control.CanMoveRel == '1')
                    {
                        
                        $scope.ptzMoveCommand = "moveRel";
                        $scope.ptzStopCommand = "moveStop";
                    }

                    // Prefer con over rel if both enabled
                    // I've tested con
                
                    if (data.control.Control.CanMoveCon == '1')
                    {
                        
                        $scope.ptzMoveCommand = "moveCon";
                        $scope.ptzStopCommand = "moveStop";
                    }
                
                
                
                // presets
                    ZMDataModel.zmDebug ("ConfigurePTZ Preset value is " +data.control.Control.HasPresets);
                
                    if (data.control.Control.HasPresets == '1')
                    {
                        $scope.ptzPresetCount = parseInt(data.control.Control.NumPresets);
                         
                        ZMDataModel.zmDebug ("ConfigurePTZ Number of presets is " + $scope.ptzPresetCount);
                        
                        $scope.ptzPresets = [];
                        for (var p=0; p<$scope.ptzPresetCount; p++)
                        {
                            $scope.ptzPresets.push ({name:(p+1).toString(), icon:'', cmd:"presetGoto"+(p+1).toString()});
                           // $scope.ptzPresets[p].name = "Arjun " + p;
                          //  console.log ("Name to " + $scope.ptzPresets[p].name);
                        }
                        
                        if (data.control.Control.HasHomePreset == '1')
                        {
                            $scope.ptzPresets.unshift({name:'', icon:"ion-ios-home", cmd:'presetHome'});
                            
                            $scope.ptzPresetCount++;
                        }
                        
                    }
                
                
                    ZMDataModel.zmLog("ConfigurePTZ Modal: ControlDB reports PTZ command to be " + $scope.ptzMoveCommand);
                })
                .error(function (data) {
                  //  console.log("** Error retrieving move PTZ command");
                    ZMDataModel.zmLog("ConfigurePTZ : Error retrieving PTZ command  " + JSON.stringify(data), "error");
                });
      
            }
            else
            {
                ZMDataModel.zmLog ("configurePTZ " + mid+" is not PTZ controllable");
            }
        })
        .error(function (data) {
            //  console.log("** Error retrieving move PTZ command");
            ZMDataModel.zmLog("configurePTZ : Error retrieving PTZ command  " + JSON.stringify(data), "error");
        });
        
        
       
    }
    
        
    $scope.$on('modal.shown', function () {
          
        $scope.monStatus = "";
        document.addEventListener("pause", onPause, false);
        document.addEventListener("resume", onResume, false);
        
        var ld = ZMDataModel.getLogin();
        //currentEvent = $scope.currentEvent;
        $scope.connKey =  (Math.floor((Math.random() * 999999) + 1)).toString();
        console.log ("************* GENERATED CONNKEY " + $scope.connKey);
        $scope.currentFrame = 1;
        $scope.monStatus = "";
       
        configurePTZ($scope.monitorId);

    });

}]);