// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,ionic, moment */


/* FIXME for nph events
a) timers
b) sliders
c) photo save 
d) gapless

*/

angular.module('zmApp.controllers').controller('EventModalCtrl', ['$scope', '$rootScope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$q', '$sce', 'carouselUtils', '$ionicPopup', function ($scope, $rootScope, zm, ZMDataModel, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $q, $sce, carouselUtils, $ionicPopup) {


    // from parent scope
    var currentEvent = $scope.currentEvent;
    var nphTimer;
    var eventQueryHandle;
    $scope.loginData = ZMDataModel.getLogin();
    
    
   // $scope.currentEventLength = parseFloat($scope.currentEvent.Event.Length);  
    //console.log ("Current event duration is " + $scope.currentEventLength);
    
    
    //$scope.currentEventLength = $scope.event.Event.Length;  


    var eventImageDigits = 5; // failsafe
    $scope.currentProgress = 0;
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

    ZMDataModel.zmDebug ("EventModalCtrl called from " + $ionicHistory.currentStateName());
    // This is not needed for event mode
    
    


    ZMDataModel.zmDebug("Setting playback to " + $scope.streamMode);


    $rootScope.validMonitorId = $scope.monitors[0].Monitor.Id;
    ZMDataModel.getAuthKey($rootScope.validMonitorId,(Math.floor((Math.random() * 999999) + 1)).toString())
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

            ZMDataModel.zmDebug("EventModalCtrl: Re-login detected, resetting everything & re-generating connkey");
            window.stop();
            $scope.connKey =  (Math.floor((Math.random() * 999999) + 1)).toString();
            $timeout( function () { sendCommand('14',$scope.connKey, '&offset='+$scope.currentProgress);},500);
            $timeout.cancel(eventQueryHandle);
            eventQueryHandle  = $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);
         
         
            
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


                                      

    function checkEvent()
    {
        console.log ("Event timer");
        processEvent('99',$scope.connKey);
    }
    
    
    function sendCommand(cmd,connkey,extras,rq)
    {
        var d = $q.defer();
         var loginData = ZMDataModel.getLogin();
        var rqtoken = rq? rq:"stream";
        var myauthtoken = $rootScope.authSession.replace("&auth=","");
        //&auth=
            $http({
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
                    if (extras)
                    {
                            foo = foo + extras;
                            //console.log("EXTRAS****SUB RETURNING " + foo);
                    }
                    return foo;
                        
                },

                data: {
                    view: "request",
                    request: rqtoken,
                    connkey: connkey,
                    command: cmd,
                    auth: myauthtoken,
                   // user: loginData.username,
                   // pass: loginData.password
                }
            })
            .then (function (resp) {
               // ZMDataModel.zmDebug ("sendCmd response:"+JSON.stringify(resp));
                d.resolve(resp);
                return (d.promise);
                
                
            },
                function (resp) {
                ZMDataModel.zmDebug ("sendCmd error:"+JSON.stringify(resp));
                d.reject (resp);
                return (d.promise);
            });
        
            return (d.promise);
    }
    
    
    function processEvent(cmd,connkey)
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
                ZMDataModel.zmDebug ("processEvent success:"+JSON.stringify(resp));
                
                if (resp.result=="Ok")
                {
                    
                    $scope.currentProgress = resp.status.progress;
                    $scope.eventId = resp.status.event;
                    
                    
                    if ($scope.currentProgress > $scope.currentEventDuration) $scope.currentProgress = $scope.currentEventDuration;
                    $scope.progressText = "At " + $scope.currentProgress + "s of " + $scope.currentEventDuration+"s";
                
                    if (Math.floor(resp.status.progress) >=$scope.currentEventDuration)
                    {
                        ZMDataModel.zmLog ("Reached end of event " + $scope.eventId);
                        
                        
                        
                        if (loginData.gapless)
                        {
                            ZMDataModel.zmLog ("STEP 1: Moving to nextevent as gapless is on");
                            sendCommand ('13',connkey) // next
                            .then (function (resp) // 13
                                   {
                                
                                        sendCommand('99',connkey) // query
                                        .then (function (resp) //99
                                        {
                                            console.log ("Output of next move afer query is " + JSON.stringify(resp));

                                            // now get duration;
                                            // $scope.currentEventDuration = Math.floor($scope.currentEvent.Event.Length);
                                            var apiurl = loginData.apiurl + "/events/" + resp.data.status.event + ".json";
                                            ZMDataModel.zmLog ("STEP 2:Getting details for " + apiurl);
                                            $http.get(apiurl)
                                            .then (function (data)
                                            {
                                                $scope.currentEventDuration = Math.floor(data.data.event.Event.Length);
                                                
                                                if (resp.data.status.event != $scope.eventId)
                                                    $scope.currentProgress = 0; // if = then we are at end
                                                
                                                $scope.eventId = resp.data.status.event;
                                                
                                                ZMDataModel.zmDebug ("STEP 3: New eid " + $scope.eventId + " duration " + $scope.currentEventDuration);
                                                eventQueryHandle  = $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);
                                            },
                                            function (err) //api
                                            {
                                                console.log ("Error " + JSON.stringify(err));
                                                eventQueryHandle  =  $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);

                                            });
                                               
                                        },
                                        function (err) // 99
                                        {
                                            eventQueryHandle  =  $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);
                                            
                                        });
                                    },
                                function(error) { //13
                                        console.log ("Error of next move is " + JSON.stringify(resp));
                                        eventQueryHandle  =  $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);
                                    } );

                             $scope.currentProgress = 0;
                      
                            
                        }
                        else // not gapless
                        {
                            // keep timer on if its switched to gapless
                            eventQueryHandle  = $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);
                        }
                        
                    }
                    else // not at end of playback
                    {
                        console.log ("all good, scheduling next iteration after " + zm.eventPlaybackQuery);
                       //$timeout (checkEvent(), zm.eventPlaybackQuery);
                        eventQueryHandle  =  $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);
                    }
                    
                   /* if ((resp.status.paused==1) && ($scope.currentProgress < $scope.currentEventDuration ) && !$scope.isPaused)
                    {
                        
                        //wtf? why?
                        
                        //No such file or directory
                        
                        ZMDataModel.zmDebug ("ZMS mysteriously paused at " + $scope.currentProgress+ "of " +$scope.currentEventDuration+"seconds , force resuming");
                        sendCommand (2,connkey);
                //         $timeout( function () { sendCommand('14',$scope.connKey, '&offset='+$scope.currentProgress);},500);
                    }*/
                }
                else
                    
                {
                   ZMDataModel.zmDebug("Hmm I found an error " + JSON.stringify(resp) + 
"so I can't tell if the playback ended");
                    $scope.connKey =  (Math.floor((Math.random() * 999999) + 1)).toString();
                     $timeout( function () { sendCommand('14',$scope.connKey, '&offset='+$scope.currentProgress);},500);
                    ZMDataModel.zmDebug ("so I'm regenerating Connkey to " + $scope.connKey);
                }
            });
        
        
            req.error (function (resp) {
                ZMDataModel.zmDebug ("processEvent error:"+JSON.stringify(resp));
                
            });
        
    }



    function onPause() {
       
        // $interval.cancel(modalIntervalHandle);

        // FIXME: Do I need to  setAwake(false) here?
    }


    function onResume() {
        ZMDataModel.zmDebug("EventModalCtrl: Modal resume called");
            

            $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);

    }



    
    
    
    

    $scope.finishedLoadingImage = function () {
        // console.log("***Monitor image FINISHED Loading***");
        $ionicLoading.hide();

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

    $scope.$on('modal.shown', function () {
        
        var ld = ZMDataModel.getLogin();
        $scope.loginData = ZMDataModel.getLogin();
        
        
        
        currentEvent = $scope.currentEvent;
        
        console.log ("Current Event " + JSON.stringify(currentEvent));
        $scope.connKey =  (Math.floor((Math.random() * 999999) + 1)).toString();
        console.log ("************* GENERATED CONNKEY " + $scope.connKey);
        
        $scope.currentFrame = 1;
        $scope.isPaused = false;
        //console.log ("CURRENT EVENT " + JSON.stringify($scope.currentEvent));
        $scope.currentEventDuration = Math.floor($scope.currentEvent.Event.Length);
        //console.log ($scope.event.Event.Frames);
        if (currentEvent && currentEvent.Event)
        {
            console.log ("************ CALLING PREPARE MODAL ***********");
            prepareModalEvent(currentEvent.Event.Id);
            if (ld.useNphZmsForEvents)
            {
           
                ZMDataModel.zmLog ("Starting checkAllEvents timer");
                
                eventQueryHandle  = $timeout (checkEvent(), zm.eventPlaybackQuery);
                /*eventQueryHandle = $interval(function () {
                    checkEvent();
                    //  console.log ("Refreshing Image...");
                }.bind(this),zm.eventPlaybackQuery);*/
            }
            
        }
        
        
    
        
        
        
    });
    

    $scope.$on('modal.removed', function () {
        $scope.isModalActive = false;
        //console.log("**MODAL REMOVED: Stopping modal timer");
                //$interval.cancel(eventQueryHandle);
                $timeout.cancel(eventQueryHandle);
        ZMDataModel.zmDebug ("Modal removed - killing connkey");
        sendCommand(17,$scope.connKey);
        

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
        
        if (ld.useNphZmsForEvents)
        {
            ZMDataModel.zmLog("using zms to move ");
            jumpToEventZms($scope.connKey, dirn);
           // sendCommand ( dirn==1?'13':'12',$scope.connKey);
            
        }
        else
        {
            jumpToEvent(eid, dirn);
        }
        
        //console.log("JUMPING");
        

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
            window.stop();
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

        
        
    function jumpToEventZms(connkey, dirn) {
        
        var cmd = dirn==1?'13':'12';
        
        ZMDataModel.zmDebug ("Sending " + cmd + " to " + connkey);
        
        $ionicLoading.show({
             template: "switching events..",
             noBackdrop: true,
             duration: zm.httpTimeout
            });
        
        sendCommand ( cmd,connkey)
        .then (function (success) {$ionicLoading.hide();}, function (error) {$ionicLoading.hide();});
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

            
            
            $timeout(function () {
                element.removeClass(slideout);
                element.addClass(slidein)
                    .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', inWithNew);
               
            }, 200);
        }

        function inWithNew() {
            element.removeClass(slidein);
            
            
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


                   // console.log ("DUCCESS::"+JSON.stringify(success));
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
                    
                    console.log ("loginData is " + JSON.stringify($scope.loginData));
                    console.log ("Event ID is " + $scope.eventId);
                    console.log ("video is " + $scope.defaultVideo);
            

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

    

}]);