// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,ionic, moment, imagesLoaded */


/* FIXME for nph events
a) timers
b) sliders
c) photo save 
d) gapless

*/

angular.module('zmApp.controllers').controller('MonitorModalCtrl', ['$scope', '$rootScope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$q', '$sce', 'carouselUtils', '$ionicPopup', function ($scope, $rootScope, zm, ZMDataModel, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $q, $sce, carouselUtils, $ionicPopup) {


    // from parent scope
    var currentEvent = $scope.currentEvent;
    var nphTimer;
    var eventQueryHandle;
    var imgLoad;
    
    
   // $scope.currentEventLength = parseFloat($scope.currentEvent.Event.Length);  
    //console.log ("Current event duration is " + $scope.currentEventLength);
    
    
    //$scope.currentEventLength = $scope.event.Event.Length;  


    var eventImageDigits = 5; // failsafe
    ZMDataModel.getKeyConfigParams(0)
        .then(function (data) {
            //console.log ("***GETKEY: " + JSON.stringify(data));
            eventImageDigits = parseInt(data);
            ZMDataModel.zmLog("Image padding digits reported as " + eventImageDigits);
        });

    $scope.animationInProgress = false;
    $scope.imageFit = true;
    // FIXME: This is a hack - for some reason
    // the custom slider view is messed up till the image loads
    // in modal view
    $scope.showModalRangeSider = false;
    $scope.isModalActive = true;


    $timeout(function () {
        $scope.showModalRangeSider = true;

    }, 2000);

    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);

    $rootScope.authSession = "undefined";
    $ionicLoading.show({
        template: 'negotiating stream authentication...',
        animation: 'fade-in',
        showBackdrop: true,
        duration: zm.loadingTimeout,
        maxWidth: 300,
        showDelay: 0
    });
    var ld = ZMDataModel.getLogin();

    $scope.streamMode = ld.useNphZms ? "jpeg" : "single";
    $scope.currentStreamMode = 'single';
    ZMDataModel.zmLog("Using stream mode " + $scope.currentStreamMode);

    ZMDataModel.zmDebug ("ModalCtrl called from " + $ionicHistory.currentStateName());
    // This is not needed for event mode
    
    if (ld.useNphZms == true && 
        $ionicHistory.currentStateName() != 'events' && 
        $ionicHistory.currentStateName() != 'timeline' ) {
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



    ZMDataModel.zmDebug("Setting playback to " + $scope.streamMode);


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
    
    
    $rootScope.$on("auth-success", function () {

            ZMDataModel.zmDebug("MonitorModalCtrl: Re-login detected, resetting everything & re-generating connkey");
             ZMDataModel.stopNetwork("MonitorModal-auth success");
            $scope.connKey =  (Math.floor((Math.random() * 999999) + 1)).toString();
            
            
    });


    $scope.togglePTZ = function () {

        //console.log("PTZ");

        if ($scope.isControllable == '1') {
            //console.log ("iscontrollable is true");
            $scope.showPTZ = !$scope.showPTZ;
        } else {
            $ionicLoading.show({
                template: "PTZ not configured for this monitor",
                noBackdrop: true,
                duration: 3000,
            });
        }



    };


    $scope.radialMenuOptions = {
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


    $interval.cancel(intervalModalHandle);

    if (ld.useNphZms == false && $ionicHistory.currentStateName() != 'events' && 
        $ionicHistory.currentStateName() != 'timeline') {
        intervalModalHandle = $interval(function () {
            loadModalNotifications();
            //  console.log ("Refreshing Image...");
        }.bind(this), ld.refreshSec * 1000);

        loadModalNotifications();
    } else {
        ZMDataModel.zmLog("Using nph-zms or not live view, no timer needed");
        
            
    }
    
                                      

    function checkEvent()
    {
        subControlStream('99',$scope.connKey);
    }
    
    
    function subControlStream(cmd,connkey)
    {
        var loginData = ZMDataModel.getLogin();
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
                    //console.log("****SUB RETURNING " + foo);
                    return foo;
                },

                data: {
                    view: "request",
                    request: "stream",
                    connkey: connkey,
                    command: cmd,
                    auth: myauthtoken,
                   // user: loginData.username,
                   // pass: loginData.password
                }
            });
        
            req.success (function (resp) {
                ZMDataModel.zmDebug ("subControl success:"+JSON.stringify(resp));
                if (parseFloat(resp.status.progress) >=$scope.currentEventDuration)
                {
                    console.lof ("********** END OF EVENT PLAYBACK");
                }
            });
        
        
            req.error (function (resp) {
                ZMDataModel.zmDebug ("subControl error:"+JSON.stringify(resp));
            });
        
    }



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
            if (ld.useNphZms == false && $ionicHistory.currentStateName() != 'events' && 
        $ionicHistory.currentStateName() != 'timeline') {
                intervalModalHandle = $interval(function () {
                    loadModalNotifications();
                    //  console.log ("Refreshing Image...");
                }.bind(this), ld.refreshSec * 1000);
            } else {
                ZMDataModel.zmLog("using nph or not live view - no timers needed");
            }
            
            

            $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);

        }



    }


    function loadModalNotifications() {

        //console.log ("Inside Modal timer...");
        $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);

    }

    var intervalModalHandle;


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
    
    
    
    
    
    $scope.controlStream = function (cmd,disp,connkey,ndx)
    {
        controlStream(cmd,disp,connkey,ndx);
    };
    
    function controlStream(cmd, disp, connkey, ndx) {
            // console.log("Command value " + cmd);

            if (disp) {
                $ionicLoading.hide();
                $ionicLoading.show({
                    template: "please wait...",
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
            


            // You need to POST commands to control zms
            // Note that I am url encoding the parameters into the URL
            // If I leave it as JSON, it gets converted to OPTONS due
            // to CORS behaviour and ZM/Apache don't seem to handle it

            //console.log("POST: " + loginData.url + '/index.php');

            //console.log ("AUTH IS " + $rootScope.authSession);
        
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
                   // user: loginData.username,
                   // pass: loginData.password
                }
            });
            req.success(function (resp) {

                //console.log("SUCCESS FOR: " + JSON.stringify(resp));
               
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
                //var str = toast_blurb + "event:" + resp.status.event;
                // console.log(str);
                // $ionicLoading.hide();

               
                

            });

            req.error(function (resp) {
                //console.log("ERROR: " + JSON.stringify(resp));
                ZMDataModel.zmLog("Error sending event command " + JSON.stringify(resp), "error");
            });
        }



    
    
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
                template: "Not Ready for PTZ",
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
                //console.log("****RETURNING " + foo);
                return foo;
            },
            // NOTE: Refer to
            // zoneminder/skins/mobile/includes/control_functions.php
            // for move commands
            // logic - /zm/api/monitors/X.json, read ControlId = Y
            // then zm/api/controls/Y.json

            data: ptzData

        });

        req.success(function (resp) {
            $ionicLoading.hide();
            //console.log("SUCCESS: " + JSON.stringify(resp));

            // $ionicLoading.hide();

        });

        req.error(function (resp) {
            $ionicLoading.hide();
            //console.log("ERROR: " + JSON.stringify(resp));
            ZMDataModel.zmLog("Error sending PTZ:" + JSON.stringify(resp), "error");
        });
    }

    // lets switch to nph the moment snapshot succeeds

    $scope.finishedModalLoadingImage = function () {
        ZMDataModel.zmDebug("Monitor image loaded, switching to nph");
        $timeout.cancel(nphTimer);
        //console.log("***Monitor image FINISHED Loading***");
        $ionicLoading.hide();
        $scope.currentStreamMode = 'jpeg';

    };

    $scope.getZoomLevel = function () {
        //console.log("ON RELEASE");
        var zl = $ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition();
        //console.log(JSON.stringify(zl));
    };

    $scope.onTap = function (m, d) {

        moveToMonitor(m, d);
    };

    
     $scope.finishedModalLoadingImage = function () {
       // console.log("***Monitor image FINISHED Loading***");
        $ionicLoading.hide();
    };



    $scope.onSwipe = function (m, d) {
        var ld = ZMDataModel.getLogin();
        if (!ld.canSwipeMonitors) return;

        if ($ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom != 1) {
            //console.log("Image is zoomed in - not honoring swipe");
            return;
        }
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
        $ionicLoading.show({
            template: "please wait...",
            noBackdrop: true,
            duration: zm.loadingTimeout,
        });


    }



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
        ZMDataModel.zmDebug("ModalCtrl:Photo saved successfuly");
    }

    function SaveError(e) {
        $ionicLoading.show({
            template: "error - could not save",
            noBackdrop: true,
            duration: 2000
        });
        ZMDataModel.zmLog("Error saving image: " + e.message);
        //console.log("***ERROR");
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



    //-----------------------------------------------------------------------
    // Saves a snapshot of the monitor image to phone storage
    //-----------------------------------------------------------------------

    $scope.saveEventImageToPhone = function () {
        

        var curState = carouselUtils.getStop();
        carouselUtils.setStop(true);

        //console.log("Your index is  " + $scope.mycarousel.index);
        //console.log("Associated image is " + $scope.slides[$scope.mycarousel.index].img);

        ZMDataModel.zmDebug("ModalCtrl: SaveEventImageToPhone called");
        var canvas, context, imageDataUrl, imageData;
        var loginData = ZMDataModel.getLogin();

        var url = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&path=" + $scope.relativePath + $scope.slides[$scope.mycarousel.index].img;


        $scope.selectEventUrl = url;
        $scope.slideIndex = $scope.mycarousel.index;
        $scope.slideLastIndex = $scope.slides.length - 1;




        $rootScope.zmPopup = $ionicPopup.show({
            template: '<center>Frame: {{slideIndex+1}} of {{slideLastIndex+1}}</center><br/><img src="{{selectEventUrl}}" width="100%"  />',
            title: 'Select frame to save',
            subTitle: 'use left and right arrows to change',
            scope: $scope,
            cssClass: 'popup80',
            buttons: [
                {
                    // left 1
                    text: '',
                    type: 'button-small button-energized ion-chevron-left',
                    onTap: function (e) {
                        if ($scope.slideIndex > 0) $scope.slideIndex--;
                        $scope.selectEventUrl = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&path=" + $scope.relativePath + $scope.slides[$scope.slideIndex].img;
                        //ZMDataModel.zmLog("selected frame is " + $scope.slideIndex);

                        e.preventDefault();
                    }
                },
                {
                    // right 1
                    text: '',
                    type: 'button-small button-energized ion-chevron-right',
                    onTap: function (e) {
                        if ($scope.slideIndex < $scope.slideLastIndex) $scope.slideIndex++;
                        $scope.selectEventUrl = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&path=" + $scope.relativePath + $scope.slides[$scope.slideIndex].img;
                        //ZMDataModel.zmLog("selected frame is " + $scope.slideIndex);
                        e.preventDefault();
                    }
                },
                {
                    // left 10
                    text: '',
                    type: 'button-small button-energized ion-skip-backward',
                    onTap: function (e) {
                        var tempVar = $scope.slideIndex;
                        tempVar -= 10;
                        if (tempVar < 0) tempVar = 0;
                        $scope.slideIndex = tempVar;

                        $scope.selectEventUrl = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&path=" + $scope.relativePath + $scope.slides[$scope.slideIndex].img;
                        //ZMDataModel.zmLog("selected frame is " + $scope.slideIndex);

                        e.preventDefault();
                    }
                },
                {
                    // right 10
                    text: '',
                    type: 'button-small button-energized ion-skip-forward',
                    onTap: function (e) {
                        var tempVar = $scope.slideIndex;
                        tempVar += 10;
                        if (tempVar > $scope.slideLastIndex) tempVar = $scope.slideLastIndex;
                        $scope.slideIndex = tempVar;
                        if ($scope.slideIndex < $scope.slideLastIndex) $scope.slideIndex++;
                        $scope.selectEventUrl = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&path=" + $scope.relativePath + $scope.slides[$scope.slideIndex].img;
                        //ZMDataModel.zmLog("selected frame is " + $scope.slideIndex);
                        e.preventDefault();
                    }
                },

                {
                    text: '',
                    type: 'button-assertive button-small ion-close-round'
                },
                {
                    text: '',
                    type: 'button-positive button-small ion-checkmark-round',
                    onTap: function (e) {
                        saveNow();

                    }
                }]
        });

        function saveNow()
        {
            $ionicLoading.show({
             template: "saving snapshot...",
             noBackdrop: true,
             duration: zm.httpTimeout
            });
            var url = $scope.selectEventUrl;
            ZMDataModel.zmLog ("saveNow: File path to grab is " + url);

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
                        // carouselUtils.setStop(curState);
                     } catch (e) {

                         SaveError(e.message);
                        // carouselUtils.setStop(curState);
                     }
                 } else {


                     var fname = $scope.relativePath+$scope.slides[$scope.slideIndex].img + ".png";
                     fname = fname.replace(/\//,"-");
                      fname = fname.replace(/\.jpg/,'');

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
        }
    };





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
        //console.log("**VIEW ** ModalCtrl left");
        
        
        //ZMDataModel.zmLog ("ModalCtrl:Nullifying images..."");
        // make sure this is applied in scope digest to stop network pull
        // thats why we are doing it beforeLeave
        
        //window.stop();
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
        //console.log("**MODAL UNLOADED: Stopping modal timer");
        $interval.cancel(intervalModalHandle);

        //   console.log("Modal monitor left");
    });

    $scope.$on('modal.removed', function () {
        $scope.isModalActive = false;
        //console.log("**MODAL REMOVED: Stopping modal timer");
        $interval.cancel(intervalModalHandle);
        $interval.cancel(eventQueryHandle);
        ZMDataModel.zmDebug ("Modal removed - killing connkey");
        controlStream(17,"",$scope.connKey,-1);
        

        // Execute action
    });


    // Playback speed adjuster
    $scope.adjustSpeed = function (val) {
        switch (val) {

            case "super":
                $scope.eventSpeed = 20 / $scope.event.Event.Frames;
                carouselUtils.setDuration($scope.eventSpeed);
                break;
            case "normal":
                $scope.eventSpeed = $scope.event.Event.Length / $scope.event.Event.Frames;
                //$scope.eventSpeed = 5;
                carouselUtils.setDuration($scope.eventSpeed);

                break;
            case "faster":
                $scope.eventSpeed = $scope.eventSpeed / 2;
                if ($scope.eventSpeed < 20 / $scope.event.Event.Frames)
                    $scope.eventSpeed = 10 / $scope.event.Event.Frames;
                carouselUtils.setDuration($scope.eventSpeed);
                break;
            case "slower":
                $scope.eventSpeed = $scope.eventSpeed * 2;
                carouselUtils.setDuration($scope.eventSpeed);

                break;
            default:


        }
        ZMDataModel.zmDebug("Set playback speed to " + $scope.eventSpeed);

        $ionicLoading.show({
            template: 'playback interval: ' + $scope.eventSpeed.toFixed(3) + "ms",
            animation: 'fade-in',
            showBackdrop: false,
            duration: 1500,
            maxWidth: 300,
            showDelay: 0
        });


    };


    $scope.toggleGapless = function () {
       // console.log(">>>>>>>>>>>>>>GAPLESS TOGGLE INSIDE MODAL");
        $scope.loginData.gapless = !$scope.loginData.gapless;
        ZMDataModel.setLogin($scope.loginData);

    };


    // This function returns neighbor events if applicable
    function neighborEvents(eid) {
        var d = $q.defer();
        // now get event details to show alarm frames
        var loginData = ZMDataModel.getLogin();
        var myurl = loginData.apiurl + '/events/' + eid + ".json";
        var neighbors = {
            prev: "",
            next: ""
        };
        $http.get(myurl)
            .success(function (data) {

                // In Timeline view, gapless should stick to the same monitor
                if ($scope.followSameMonitor == "1") // we are viewing only one monitor
                {
                    ZMDataModel.zmDebug("Getting next event for same monitor Id ");
                    neighbors.prev = data.event.Event.PrevOfMonitor ? data.event.Event.PrevOfMonitor : "";
                    neighbors.next = data.event.Event.NextOfMonitor ? data.event.Event.NextOfMonitor : "";
                } else {
                    neighbors.prev = data.event.Event.Prev ? data.event.Event.Prev : "";
                    neighbors.next = data.event.Event.Next ? data.event.Event.Next : "";
                }
                ZMDataModel.zmDebug("Neighbor events of " + eid + "are Prev:" +
                    neighbors.prev + " and Next:" + neighbors.next);


                d.resolve(neighbors);
                return (d.promise);
            })
            .error(function (err) {
                ZMDataModel.zmLog("Error retrieving neighbors" + JSON.stringify(err));
                d.reject(neighbors);
                return (d.promise);


            });
        return (d.promise);

    }


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
    

    //--------------------------------------------------------
    //Navigate to next/prev event in full screen mode
    //--------------------------------------------------------

    $scope.onSwipeEvent = function (eid, dirn) {
        //console.log("HERE");
        var ld = ZMDataModel.getLogin();
        if (!ld.canSwipeMonitors) return;

        if ($ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom != 1) {
            //console.log("Image is zoomed in - not honoring swipe");
            return;
        }
        //console.log("JUMPING");
        jumpToEvent(eid, dirn);

    };

    $scope.jumpToEvent = function (eid, dirn) {
       // console.log("jumptoevent");

        jumpToEvent(eid, dirn);

    };

    function jumpToEvent(eid, dirn) {
        ZMDataModel.zmLog("Event jump called with:" + eid);
        if (eid == "") {
            $ionicLoading.show({
                template: "no more events",
                noBackdrop: true,
                duration: 2000
            });

            return;
        }

        var slidein;
        var slideout;
        if (dirn == 1) {
            slideout = "animated slideOutLeft";
            slidein = "animated slideInRight";
        } else {
            slideout = "animated slideOutRight";
            slidein = "animated slideInLeft";
        }
        var element = angular.element(document.getElementById("full-screen-event"));
        element.addClass(slideout).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', outWithOld);



        function outWithOld() {

            ZMDataModel.zmLog("ModalCtrl:Stopping network pull...");
             ZMDataModel.stopNetwork("MonitorModal-outwithOld");
            $scope.animationInProgress = true;
            // give digest time for image to swap
            // 100 should be enough
            $timeout(function () {
                element.removeClass(slideout);
                element.addClass(slidein)
                    .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', inWithNew);
                prepareModalEvent(eid);
            }, 200);
        }

        function inWithNew() {
            element.removeClass(slidein);
            $scope.animationInProgress = false;
            carouselUtils.setStop(false);
        }

    }

    //--------------------------------------------------------
    // utility function
    //--------------------------------------------------------

    function computeRelativePath(event) {
        var relativePath = "";
        var loginData = ZMDataModel.getLogin();
        var str = event.Event.StartTime;
        var yy = moment(str).format('YY');
        var mm = moment(str).format('MM');
        var dd = moment(str).format('DD');
        var hh = moment(str).format('HH');
        var min = moment(str).format('mm');
        var sec = moment(str).format('ss');
        relativePath = event.Event.MonitorId + "/" +
            yy + "/" +
            mm + "/" +
            dd + "/" +
            hh + "/" +
            min + "/" +
            sec + "/";
        return relativePath;

    }

    //--------------------------------------------------------
    // utility function
    //--------------------------------------------------------

    function computeBasePath(event) {
        var basePath = "";
        var loginData = ZMDataModel.getLogin();
        var str = event.Event.StartTime;
        var yy = moment(str).format('YY');
        var mm = moment(str).format('MM');
        var dd = moment(str).format('DD');
        var hh = moment(str).format('HH');
        var min = moment(str).format('mm');
        var sec = moment(str).format('ss');

        basePath = loginData.url + "/events/" +
            event.Event.MonitorId + "/" +
            yy + "/" +
            mm + "/" +
            dd + "/" +
            hh + "/" +
            min + "/" +
            sec + "/";
        return basePath;
    }


    //-------------------------------------------------------------------------
    // Called when rncarousel or video player finished playing event
    //-------------------------------------------------------------------------     

    $scope.playbackFinished = function () {
        playbackFinished();
    };

    function playbackFinished() {
        // currentEvent is updated with the currently playing event in prepareModalEvent()
        ZMDataModel.zmLog("Playback of event " + currentEvent.Event.Id + " is finished");

        if ($scope.loginData.gapless) {

            neighborEvents(currentEvent.Event.Id)
                .then(function (success) {

                        // lets give a second before gapless transition to the next event
                        $timeout(function () {
                            $scope.nextId = success.next;
                            $scope.prevId = success.prev;
                            ZMDataModel.zmDebug("Gapless move to event " + $scope.nextId);
                            jumpToEvent($scope.nextId, 1);
                        }, 1000);
                    },
                    function (error) {
                        ZMDataModel.zmDebug("Error in neighbor call " +
                            JSON.stringify(error));
                    });
        } else {
            ZMDataModel.zmDebug("not going to next event, gapless is off");
        }
    }


    //--------------------------------------------------------
    // Called by openModal as well as jump to event
    // what it basically does is get a detailed event API
    // for an event ID and constructs required playback
    // parameters
    // Note that openModal is called with the top level event
    // API. Some parameters are repeated across both
    //--------------------------------------------------------


    function prepareModalEvent(eid) {

        // Lets get the detailed event API
        var loginData = ZMDataModel.getLogin();
        var myurl = loginData.apiurl + '/events/' + eid + ".json";
        ZMDataModel.zmLog("*** Constructed API for detailed events: " + myurl);
        $http.get(myurl)
            .then(function (success) {



                    var event = success.data.event;
                    currentEvent = event;

                    event.Event.BasePath = computeBasePath(event);
                    event.Event.relativePath = computeRelativePath(event);


                    //console.log (JSON.stringify( success));
                    $scope.eventName = event.Event.Name;
                    $scope.eventId = event.Event.Id;
                    $scope.eFramesNum = event.Event.Frames;
                    $scope.eventDur = Math.round(event.Event.Length);
                    $scope.loginData = ZMDataModel.getLogin();

                    //console.log("**** VIDEO STATE IS " + event.Event.DefaultVideo);
                    if (typeof event.Event.DefaultVideo === 'undefined')
                        event.Event.DefaultVideo = "";

                    $scope.defaultVideo = event.Event.DefaultVideo;


                    neighborEvents(event.Event.Id)
                        .then(function (success) {
                                $scope.nextId = success.next;
                                $scope.prevId = success.prev;
                            },
                            function (error) {
                                //console.log(JSON.stringify(error));
                            });

                    $scope.nextId = "...";
                    $scope.prevId = "...";




                    event.Event.video = {};
                    var videoURL = $scope.loginData.url + "/events/" + event.Event.relativePath + event.Event.DefaultVideo;

                    //console.log("************** VIDEO IS " + videoURL);
                    event.Event.video.config = {
                        autoPlay: true,
                        sources: [
                            {
                                src: $sce.trustAsResourceUrl(videoURL),
                                type: "video/mp4"
                        }

                    ],

                        theme: "lib/videogular-themes-default/videogular.css",

                    };

                    $scope.videoObject = event.Event.video;

                    $scope.playbackURL = $scope.loginData.url;

                    /* we don't need this for electron
                    if ($rootScope.platformOS == "desktop") {
                        $scope.playbackURL = zm.desktopUrl;
                    } */

                    $scope.eventBasePath = event.Event.BasePath;
                    $scope.relativePath = event.Event.relativePath;
                    $rootScope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;

                    $scope.slider_modal_options = {
                        from: 1,
                        to: event.Event.Frames,
                        realtime: true,
                        step: 1,
                        className: "mySliderClass",
                        callback: function (value, released) {
                            //console.log("CALLBACK"+value+released);
                            $ionicScrollDelegate.freezeScroll(!released);


                        },
                        //modelLabels:function(val) {return "";},
                        smooth: false,
                        css: {
                            background: {
                                "background-color": "silver"
                            },
                            before: {
                                "background-color": "purple"
                            },
                            default: {
                                "background-color": "white"
                            }, // default value: 1px
                            after: {
                                "background-color": "green"
                            }, // zone after default value
                            pointer: {
                                "background-color": "red"
                            }, // circle pointer
                            range: {
                                "background-color": "red"
                            } // use it if double value
                        },
                        scale: []

                    };


                    $scope.mycarousel.index = 0;
                    $scope.ionRange.index = 1;
                    $scope.eventSpeed = $scope.event.Event.Length / $scope.event.Event.Frames;

                    //console.log("**Resetting range");
                    $scope.slides = [];
                    var i;
                    for (i = 1; i <= event.Event.Frames; i++) {
                        var fname = padToN(i, eventImageDigits) + "-capture.jpg";
                        // console.log ("Building " + fname);
                        $scope.slides.push({
                            id: i,
                            img: fname
                        });
                    }


                    // now get event details to show alarm frames

                    $scope.FrameArray = event.Frame;
                    //  $scope.slider_options.scale=[];
                    $scope.slider_modal_options.scale = [];


                    for (i = 0; i < event.Frame.length; i++) {

                        if (event.Frame[i].Type == "Alarm") {

                            $scope.slider_modal_options.scale.push({
                                val: event.Frame[i].FrameId,
                                label: ' '
                            });
                        } else {
                            //$scope.slider_options.scale.push(' ');
                        }


                    }
                    $scope.totalEventTime = Math.round(parseFloat(event.Event.Length)) - 1;
                    $scope.currentEventTime = 0;
                },
                function (err) {
                    ZMDataModel.zmLog("Error retrieving detailed frame API " + JSON.stringify(err));
                    ZMDataModel.displayBanner('error', ['could not retrieve frame details', 'please try again']);
                });


    }


    if (typeof $scope.ionRange !== 'undefined') {
        $scope.$watch('ionRange.index', function () {
            //  
            $scope.mycarousel.index = parseInt($scope.ionRange.index) - 1;
            
            if (carouselUtils.getStop() == true)
                return;

            
            //  console.log ("***ION RANGE CHANGED TO " + $scope.mycarousel.index);
        });
    }

    if (typeof $scope.mycarousel !== 'undefined') {
        $scope.$watch('mycarousel.index', function () {
            
            

            //console.log ("***ION MYCAROUSEL CHANGED");

            if (currentEvent && $scope.ionRange.index == parseInt(currentEvent.Event.Frames)) {
                playbackFinished();
            }
            // end of playback from quick scrub
            // so ignore gapless



            if ($scope.event && $scope.ionRange.index == parseInt($scope.event.Event.Frames) - 1) {
                if (!$scope.modal || $scope.modal.isShown() == false) {
                   // console.log("quick scrub playback over");
                    carouselUtils.setStop(true);
                    $scope.ionRange.index = 0;
                    $scope.mycarousel.index = 1;
                }

            }
            if (carouselUtils.getStop() == true)
                return;
            $scope.ionRange.index = ($scope.mycarousel.index + 1).toString();
            // console.log ("***IONRANGE RANGE CHANGED TO " + $scope.ionRange.index);


        });
    }

    function padToN(number, digits) {

        var i;
        var stringMax = "";
        var stringLeading = "";
        for (i = 1; i <= digits; i++) {
            stringMax = stringMax + "9";
            if (i != digits) stringLeading = stringLeading + "0";
        }
        var numMax = parseInt(stringMax);

        if (number <= numMax) {
            number = (stringLeading + number).slice(-digits);
        }
        //console.log ("PADTON: returning " + number);
        return number;
    }
    
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
        
        
                // if its controllable, lets get the control command
        if ($scope.isControllable == '1') {
           
           
        }
        
    }
    
   

    $scope.$on('modal.shown', function () {
      
        var ld = ZMDataModel.getLogin();
        currentEvent = $scope.currentEvent;
        $scope.connKey =  (Math.floor((Math.random() * 999999) + 1)).toString();
        console.log ("************* GENERATED CONNKEY " + $scope.connKey);
        $scope.currentFrame = 1;
        console.log ("CURRENT EVENT " + JSON.stringify($scope.currentEvent));
        //$scope.currentEventDuration = parseFloat($scope.currentEvent.Event.Length);
        //console.log ($scope.event.Event.Frames);
        if (currentEvent && currentEvent.Event)
            prepareModalEvent(currentEvent.Event.Id);
        
        if (ld.useNphZmsForEvents && ( $ionicHistory.currentStateName() == 'events' ||
                                   $ionicHistory.currentStateName() == 'timeline'))
            {
            checkEvent();
            ZMDataModel.zmLog ("Starting checkAllEvents timer");
            eventQueryHandle = $interval(function () {
                checkEvent();
                //  console.log ("Refreshing Image...");
            }.bind(this),zm.eventPlaybackQuery);
        }
        
        configurePTZ($scope.monitorId);

       // monitor.Monitor.Id, monitor.Monitor.Controllable, monitor.Monitor.ControlId
    
        
        
        
    });

}]);