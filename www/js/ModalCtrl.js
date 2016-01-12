// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,ionic, moment */


angular.module('zmApp.controllers').controller('ModalCtrl', ['$scope', '$rootScope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$q', '$sce', 'carouselUtils', '$ionicPopup', function ($scope, $rootScope, zm, ZMDataModel, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $q, $sce, carouselUtils, $ionicPopup) {


    // from parent scope
    var currentEvent=$scope.currentEvent;
    
  
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
    
    $scope.streamMode = ld.useNphZms ? "jpeg":"single";
    ZMDataModel.zmDebug ("Setting playback to " + $scope.streamMode);
    
    
    $rootScope.validMonitorId = $scope.monitors[0].Monitor.Id;
    ZMDataModel.getAuthKey($rootScope.validMonitorId)
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


    $scope.togglePTZ = function () {
        
        console.log ("PTZ");
        
        if ($scope.isControllable=='1')
        {
            //console.log ("iscontrollable is true");
            $scope.showPTZ = !$scope.showPTZ;
        }
        else
        {
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
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand +'Down');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand +'DownLeft');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,

                onclick: function () {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand +'Left');
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
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand +'UpLeft');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand +'Up');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand +'UpRight');
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
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand +'Right');
                }
            },


            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function () {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand +'DownRight');
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


    $interval.cancel(intervalModalHandle);
    
    if (ld.useNphZms == false )
    {
        intervalModalHandle = $interval(function () {
            loadModalNotifications();
            //  console.log ("Refreshing Image...");
        }.bind(this), ld.refreshSec * 1000);

        loadModalNotifications();
    }
    else
    {
        ZMDataModel.zmLog("Using nph-zms, no timer needed");
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
            if (ld.useNphZms == false)
            {
                intervalModalHandle = $interval(function () {
                    loadModalNotifications();
                    //  console.log ("Refreshing Image...");
                }.bind(this), ld.refreshSec * 1000);
            }
            else
            {
                ZMDataModel.zmLog("using nph - no timers needed");
            }

            $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);

        }



    }


    function loadModalNotifications() {

        //console.log ("Inside Modal timer...");
        $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);

    }

    var intervalModalHandle;


$scope.togglePresets = function()
{
    $scope.presetOn = !$scope.presetOn;
    console.log ("Changing preset to " + $scope.presetOn);
    
      var element = angular.element(document.getElementById("presetlist"));

        if (!$scope.presetOn) {
            element.removeClass("animated fadeInDown");
            element.addClass("animated fadeOutUp");
        } else {
            element.removeClass("animated fadeOutUp");
            element.addClass("animated fadeInDown");
        }

    
    
};
    
    //-------------------------------------------------------------
    // Send PTZ command to ZM
    // Note: PTZ fails on desktop, don't bother about it
    //-------------------------------------------------------------
    

    $scope.controlPTZ = function (monitorId, cmd)
    {
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
        if (cmd.lastIndexOf("preset", 0) === 0)
        {
            ZMDataModel.zmDebug("PTZ command is a preset, so skipping xge/lge");
            ptzData = {
                view: "request",
                request: "control",
                id: monitorId,
                control: cmd,
              //  xge: "30", //wtf
              //  yge: "30", //wtf
            };
            
        }
        else
        {
            
            ptzData = {
                view: "request",
                request: "control",
                id: monitorId,
                control: cmd,
                xge: "30", //wtf
                yge: "30", //wtf
            };
        }

        console.log("Command value " + cmd + " with MID=" + monitorId);
        console.log ("PTZDATA is " + JSON.stringify(ptzData));
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

            data: ptzData

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

    $scope.getZoomLevel = function () {
        console.log("ON RELEASE");
        var zl = $ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition();
        console.log(JSON.stringify(zl));
    };

    $scope.onTap = function (m, d) {

        moveToMonitor(m, d);
    };




    $scope.onSwipe = function (m, d) {
        var ld = ZMDataModel.getLogin();
        if (!ld.canSwipeMonitors) return;

        if ($ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom != 1) {
            console.log("Image is zoomed in - not honoring swipe");
            return;
        }
        moveToMonitor(m, d);



    };

    function moveToMonitor(m, d) {
        var curstate = $ionicHistory.currentStateName();
        var found = 0;
        var mid;
        mid = ZMDataModel.getNextMonitor(m, d);

        if (curstate != "monitors") {

            // FIXME: clean this up - in a situation where
            // no monitors are enabled, will it loop for ever?
            do {
                mid = ZMDataModel.getNextMonitor(m, d);
                m = mid;
                console.log("Next Monitor is " + m);


                found = 0;
                for (var i = 0; i < $scope.monitors.length; i++) {
                    if ($scope.monitors[i].Monitor.Id == mid && $scope.monitors[i].Monitor.listDisplay != 'noshow' && $scope.monitors[i].Monitor.Function !='None' && $scope.monitors[i].Monitor.Enabled != '0') {
                        found = 1;
                        console.log(mid + "is part of the monitor list");
                        ZMDataModel.zmDebug("ModalCtrl: swipe detected, moving to " + mid);
                        break;
                    }
                }


            }
            while (found != 1);
        }

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


            $scope.rand = Math.floor((Math.random() * 100000) + 1);
            $scope.animationInProgress = true;

            $timeout(function () {
                element.removeClass(slideout);
                element.addClass(slidein)
                    .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', inWithNew);
                $scope.monitorId = mid;
                $scope.monitorName = ZMDataModel.getMonitorName(mid);
            }, 200);
        }

        function inWithNew() {

            element.removeClass(slidein);
            $scope.animationInProgress = false;

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
    

      
    

    $scope.reloadView = function () {
        ZMDataModel.zmLog("Reloading view for modal view, recomputing rand");
        $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);
        $scope.isModalActive = true;
    };

    $scope.scaleImage = function () {
        
        $scope.imageFit = !$scope.imageFit;
        console.log("Switching image style to " + $scope.imageFit);
    };

    $scope.$on('$ionicView.enter', function () {



    });

    $scope.$on('$ionicView.leave', function () {
        console.log("**MODAL: Stopping modal timer");
        $scope.isModalActive = false;
        $interval.cancel(intervalModalHandle);
    });

    $scope.$on('$ionicView.unloaded', function () {
        $scope.isModalActive = false;
        console.log("**MODAL UNLOADED: Stopping modal timer");
        $interval.cancel(intervalModalHandle);

        //   console.log("Modal monitor left");
    });

    $scope.$on('modal.removed', function () {
        $scope.isModalActive = false;
        console.log("**MODAL REMOVED: Stopping modal timer");
        $interval.cancel(intervalModalHandle);

        // Execute action
    });
    
    
    // Playback speed adjuster
    $scope.adjustSpeed = function (val)
    {
        switch(val) {
        
            case "super":
                $scope.eventSpeed = 20/$scope.event.Event.Frames;
                carouselUtils.setDuration($scope.eventSpeed);
                break;
            case "normal":
               $scope.eventSpeed = $scope.event.Event.Length/$scope.event.Event.Frames;
                //$scope.eventSpeed = 5;
                carouselUtils.setDuration($scope.eventSpeed);
                
                break;
            case "faster":
                $scope.eventSpeed = $scope.eventSpeed / 2;
                if ($scope.eventSpeed <20/$scope.event.Event.Frames)
                        $scope.eventSpeed = 10/$scope.event.Event.Frames;
                carouselUtils.setDuration($scope.eventSpeed);
                break;
            case "slower":
                 $scope.eventSpeed = $scope.eventSpeed * 2;
                 carouselUtils.setDuration($scope.eventSpeed);
                
                break;
            default:
    
                
        }
        ZMDataModel.zmDebug("Set playback speed to "+$scope.eventSpeed);
        
        $ionicLoading.show({
        template: 'playback interval: '+$scope.eventSpeed.toFixed(3)+"ms",
        animation: 'fade-in',
        showBackdrop: false,
        duration: 1500,
        maxWidth: 300,
        showDelay: 0
    });
        
        
    };
    
    
    $scope.toggleGapless = function()
    {
            console.log (">>>>>>>>>>>>>>GAPLESS TOGGLE INSIDE MODAL");
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
                    if ($scope.followSameMonitor=="1") // we are viewing only one monitor
                    {
                        ZMDataModel.zmDebug ("Getting next event for same monitor Id ");
                        neighbors.prev = data.event.Event.PrevOfMonitor ? data.event.Event.PrevOfMonitor : "";
                        neighbors.next = data.event.Event.NextOfMonitor ? data.event.Event.NextOfMonitor : "";
                    }
                    else
                    {
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

       
      
        
        //--------------------------------------------------------
        //Navigate to next/prev event in full screen mode
        //--------------------------------------------------------

        $scope.onSwipeEvent = function(eid,dirn)
        {
            console.log ("HERE");
            var ld = ZMDataModel.getLogin();
            if (!ld.canSwipeMonitors) return;
            
            if 
   ($ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom!=1)
   {
       console.log("Image is zoomed in - not honoring swipe");
       return;
   }
            console.log ("JUMPING");
            jumpToEvent(eid,dirn);
            
        };
        
        $scope.jumpToEvent = function (eid, dirn) {
            console.log ("jumptoevent");
            
            jumpToEvent(eid, dirn);

        };
        
        function jumpToEvent (eid, dirn)
        {
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
            if (dirn==1)
            {
                slideout = "animated slideOutLeft";
                slidein = "animated slideInRight";
            }
            else
            {
                slideout = "animated slideOutRight";
                slidein = "animated slideInLeft";
            }
            var element = angular.element(document.getElementById("full-screen-event"));
            element.addClass(slideout).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', outWithOld);
            
            
            
            function outWithOld()
            {
                
                
                $scope.animationInProgress = true;
                // give digest time for image to swap
                // 100 should be enough
                $timeout(function()
                {
                    element.removeClass(slideout);
                    element.addClass(slidein)
                        .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', inWithNew );
                    prepareModalEvent(eid);
                },200);
            }
            
            function inWithNew()
            {
                element.removeClass(slidein);
                $scope.animationInProgress = false;
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
        
       $scope.playbackFinished = function()
       {
           playbackFinished();
       };

        function playbackFinished()
        {
            // currentEvent is updated with the currently playing event in prepareModalEvent()
            ZMDataModel.zmLog ("Playback of event " + currentEvent.Event.Id + " is finished");
            
            if ($scope.loginData.gapless)
            {
            
                neighborEvents(currentEvent.Event.Id)
                                .then(function (success) {

                                        // lets give a second before gapless transition to the next event
                                        $timeout ( function() {
                                        $scope.nextId = success.next;
                                        $scope.prevId = success.prev;
                                        ZMDataModel.zmDebug ("Gapless move to event " + $scope.nextId);
                                        jumpToEvent($scope.nextId, 1);
                                        },1000);
                                    },
                                    function (error) {
                                        ZMDataModel.zmDebug("Error in neighbor call " +
                                                            JSON.stringify(error));
                                    });
            }
            else
            {
                ZMDataModel.zmDebug ("not going to next event, gapless is off");
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
                                    console.log(JSON.stringify(error));
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
                        $scope.eventSpeed = $scope.event.Event.Length/$scope.event.Event.Frames;
                
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
    
    
    if (typeof $scope.ionRange !== 'undefined')
    {
         $scope.$watch('ionRange.index', function () {
          //  
            if (carouselUtils.getStop() == true)
                    return;
            $scope.mycarousel.index = parseInt($scope.ionRange.index) - 1;
           //  console.log ("***ION RANGE CHANGED TO " + $scope.mycarousel.index);
        });
    }
    
    if (typeof $scope.mycarousel !== 'undefined')
    {
        $scope.$watch('mycarousel.index', function () {
            
            //console.log ("***ION MYCAROUSEL CHANGED");
            
            if (currentEvent && $scope.ionRange.index == parseInt(currentEvent.Event.Frames))
            {
                playbackFinished();
            }
            // end of playback from quick scrub
            // so ignore gapless
            
            
            
            if ($scope.event && $scope.ionRange.index == parseInt($scope.event.Event.Frames)-1 )
                {
                    if (!$scope.modal ||  $scope.modal.isShown()==false)
                    {
                        console.log ("quick scrub playback over");
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
    
$scope.$on('modal.shown', function() {
    currentEvent=$scope.currentEvent;
    if (currentEvent && currentEvent.Event)
        prepareModalEvent(currentEvent.Event.Id);
});

}]);