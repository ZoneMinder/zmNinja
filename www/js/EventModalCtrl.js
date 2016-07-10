// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,ionic, moment, Chart */




angular.module('zmApp.controllers').controller('EventModalCtrl', ['$scope', '$rootScope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$q', '$sce', 'carouselUtils', '$ionicPopup', '$translate', function ($scope, $rootScope, zm, ZMDataModel, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $q, $sce, carouselUtils, $ionicPopup, $translate) {


    // from parent scope
    var currentEvent = $scope.currentEvent;
    var nphTimer;
    var eventQueryHandle;
    $scope.loginData = ZMDataModel.getLogin();
    $scope.currentRate = '-';
    var timeFormat = 'MM/DD/YYYY HH:mm:ss';


    var framearray = {

        labels: [],
        datasets: [{
            //label: '# of Votes',
            backgroundColor: 'rgba(242, 12, 12, 0.5)',
            borderColor: 'rgba(242, 12, 12, 0.5)',
            data: [],
            }]
    };

    var frameoptions = [];


    var eventImageDigits = 5; // failsafe
    $scope.currentProgress = {
        progress: 0
    };
    $scope.sliderProgress = {
        progress: 0
    };
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
        template: $translate.instant('kNegotiatingStreamAuth'),
        animation: 'fade-in',
        showBackdrop: true,
        duration: zm.loadingTimeout,
        maxWidth: 300,
        showDelay: 0
    });
    var ld = ZMDataModel.getLogin();


    $scope.currentStreamMode = ld.gapless ? 'gapless' : 'single';
    ZMDataModel.zmLog("Using stream mode " + $scope.currentStreamMode);

    ZMDataModel.zmDebug("EventModalCtrl called from " + $ionicHistory.currentStateName());
    // This is not needed for event mode



    ZMDataModel.zmDebug("Setting playback to " + $scope.streamMode);


    $rootScope.validMonitorId = $scope.monitors[0].Monitor.Id;
    ZMDataModel.getAuthKey($rootScope.validMonitorId, (Math.floor((Math.random() * 999999) + 1)).toString())
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



    //-------------------------------------------------------
    // we use this to reload the connkey if authkey changed
    //------------------------------------------------------


    $rootScope.$on("auth-success", function () {

        ZMDataModel.zmDebug("EventModalCtrl: Re-login detected, resetting everything & re-generating connkey");
        ZMDataModel.stopNetwork("Auth-Success inside EventModalCtrl");
        $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
        //console.log ("********* OFFSET FROM AUTH SUCC");
        $timeout(function () {
            sendCommand('14', $scope.connKey, '&offset=' + $scope.currentProgress.progress);
        }, 500);
        //$timeout.cancel(eventQueryHandle);
        //eventQueryHandle  = $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);



    });

    //-------------------------------------------------------
    // tap to pause
    //------------------------------------------------------

    $scope.togglePause = function () {
        $scope.isPaused = !$scope.isPaused;
        ZMDataModel.zmDebug("Paused is " + $scope.isPaused);


        sendCommand($scope.isPaused ? '1' : '2', $scope.connKey);

    };




    //-------------------------------------------------------
    // This is what we call every zm.EventQueryInterval
    // it really only queries to get status to it can display
    // zms takes care of the display
    //------------------------------------------------------

    function checkEvent() {
        //console.log ("Event timer");
        //console.log ("Event timer");
        $scope.checkEventOn = true;
        if ($scope.defaultVideo !== undefined && $scope.defaultVideo != '') {
            console.log("playing video, not using zms, skipping event commands");
        } else {
            processEvent('99', $scope.connKey);
        }
    }


    function sendCommand(cmd, connkey, extras, rq) {
        var d = $q.defer();

        if ($scope.defaultVideo !== undefined && $scope.defaultVideo != '') {
            console.log("playing video, not using zms, skipping event commands");
            d.resolve(true);
            return (d.promise);
        }



        var loginData = ZMDataModel.getLogin();
        console.log("Sending CGI command to " + loginData.url);
        var rqtoken = rq ? rq : "stream";
        var myauthtoken = $rootScope.authSession.replace("&auth=", "");
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
                    if (extras) {
                        foo = foo + extras;
                        //console.log("EXTRAS****SUB RETURNING " + foo);
                    }
                    console.log("CGI subcommand=" + foo);
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
            .then(function (resp) {
                    ZMDataModel.zmDebug("sendCmd response:" + JSON.stringify(resp));
                    d.resolve(resp);
                    return (d.promise);


                },
                function (resp) {
                    ZMDataModel.zmDebug("sendCmd error:" + JSON.stringify(resp));
                    d.reject(resp);
                    return (d.promise);
                });

        return (d.promise);
    }


    function processEvent(cmd, connkey) {

        if ($scope.blockSlider) {
            console.log("Not doing ZMS Command as slider is depressed...");
            return;
        }

        var loginData = ZMDataModel.getLogin();
        console.log("sending process Event command to " + loginData.url);
        var myauthtoken = $rootScope.authSession.replace("&auth=", "");
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
                console.log("****processEvent subcommands RETURNING " + foo);
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
            // ZMDataModel.zmDebug ("processEvent success:"+JSON.stringify(resp));

            if (resp.result == "Ok") {

                $scope.currentProgress.progress = resp.status.progress;
                $scope.eventId = resp.status.event;
                $scope.d_eventId = $scope.eventId;
                $scope.currentRate = resp.status.rate;


                if ($scope.currentProgress.progress > $scope.currentEventDuration) $scope.currentProgress.progress = $scope.currentEventDuration;
                $scope.progressText = "At " + $scope.currentProgress.progress + "s of " + $scope.currentEventDuration + "s";

                $scope.sliderProgress.progress = $scope.currentProgress.progress;

                // lets not do this and use zms to move forward or back
                // as this code conflicts with fast rev etc
                //if (Math.floor(resp.status.progress) >=$scope.currentEventDuration)



                //$timeout (checkEvent(), zm.eventPlaybackQuery);
                //eventQueryHandle  =  $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);

            } else // resp.result was messed up

            {
                ZMDataModel.zmDebug("Hmm I found an error " + JSON.stringify(resp));
                //window.stop();
                $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();

                // console.log (JSON.stringify(resp));
                $timeout(function () {
                    sendCommand('14', $scope.connKey, '&offset=' + $scope.currentProgress.progress);
                }, 500);
                ZMDataModel.zmDebug("so I'm regenerating Connkey to " + $scope.connKey);
                //eventQueryHandle  =  $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);
            }
        });


        req.error(function (resp) {
            ZMDataModel.zmDebug("processEvent error:" + JSON.stringify(resp));
            //eventQueryHandle  =  $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);

        });

    }



    function onPause() {

        // $interval.cancel(modalIntervalHandle);

        // FIXME: Do I need to  setAwake(false) here?
        $interval.cancel(eventQueryHandle);
        ZMDataModel.zmLog("EventModalCtrl: paused, killing timer");

    }


    function onResume() {
        ZMDataModel.zmDebug("EventModalCtrl: Modal resume called");


        $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);

    }








    $scope.finishedLoadingImage = function () {
        // console.log("***Monitor image FINISHED Loading***");
        $ionicLoading.hide();

    };

    $scope.enableSliderBlock = function () {
        $scope.blockSlider = true;
    };

    $scope.youChangedSlider = function () {

        console.log("YOU changed " + $scope.sliderProgress.progress);
        $scope.currentProgress.progress = $scope.sliderProgress.progress;
        $timeout(function () {
            sendCommand('14', $scope.connKey, '&offset=' + $scope.currentProgress.progress);
        }, 500);
        // give this command some time to complete
        $timeout(function () {
            $scope.blockSlider = false;
        }, 1500);

    };





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


    $scope.jumpToOffsetInEvent = function () {
        // streamReq.send( streamParms+"&command="+CMD_SEEK+"&offset="+offset );
    };



    //-----------------------------------------------------------------------
    // Saves a snapshot of the monitor image to phone storage
    //-----------------------------------------------------------------------

    $scope.saveEventImageToPhone = function (onlyAlarms) {

        if ($scope.loginData.useNphZmsForEvents) {
            ZMDataModel.zmLog("Use ZMS stream to save to phone");
            saveEventImageToPhoneZms(onlyAlarms);


        } else {
            saveEventImageToPhone(onlyAlarms);
        }


    };

    function saveEventImageToPhoneZms(onlyAlarms) {
        // The strategy here is to build the array now so we can grab frames
        // $scope.currentProgress.progress is the seconds where we are
        // $scope.eventId is the event Id

        $scope.isPaused = true;

        $ionicLoading.show({
            template: $translate.instant('kPleaseWait'),
            noBackdrop: true,
            duration: zm.httpTimeout
        });
        sendCommand('1', $scope.connKey).
        then(function (resp) {

                // console.log ("PAUSE ANSWER IS " + JSON.stringify(resp));
                $scope.currentProgress.progress = resp.data.status.progress;
                // console.log ("STEP 0 progress is " + $scope.currentProgress.progress);
                $scope.slides = [];

                var apiurl = $scope.loginData.apiurl + "/events/" + $scope.eventId + ".json";
                ZMDataModel.zmDebug("prepared to get frame details using " + apiurl);
                $http.get(apiurl)
                    .then(function (success) {

                            var event = success.data.event;

                            event.Event.BasePath = computeBasePath(event);
                            event.Event.relativePath = computeRelativePath(event);
                            $scope.playbackURL = $scope.loginData.url;
                            $scope.eventBasePath = event.Event.BasePath;
                            $scope.relativePath = event.Event.relativePath;

                            // now lets get approx frame #

                            var totalTime = event.Event.Length;
                            var totalFrames = event.Event.Frames;

                            var myFrame = Math.round(totalFrames / totalTime * $scope.currentProgress.progress);

                            //  console.log ("STEP 0: playback " + $scope.playbackURL + " total time " + totalTime + " frames " + totalFrames);

                            if (myFrame > totalFrames) myFrame = totalFrames;

                            //  console.log ("STEP 0 myFrame is " + myFrame);
                            // console.log ("DUMPING " + JSON.stringify(event));
                            $scope.mycarousel.index = myFrame;
                            // console.log ("STEP 1 : Computed index as "+  $scope.mycarousel.index);
                            var i;
                            for (i = 1; i <= event.Frame.length; i++) {
                                var fname = padToN(i, eventImageDigits) + "-capture.jpg";
                                // console.log ("Building " + fname);

                                // console.log ("DUMPING ONE " + JSON.stringify(event.Frame[i-1]));
                                // onlyAlarms means only copy alarmed frames
                                if (onlyAlarms) {
                                    if (event.Frame[i - 1] && event.Frame[i - 1].Type == 'Alarm') {
                                        $scope.slides.push({
                                            id: i,
                                            img: fname,
                                        });
                                    }
                                } else // push all frames
                                {
                                    $scope.slides.push({
                                        id: i,
                                        img: fname,
                                    });
                                }
                            }
                            //  console.log ("STEP 2 : calling Save Event To Phone");
                            $ionicLoading.hide();
                            saveEventImageToPhone(onlyAlarms);


                        },
                        function (err) {
                            $ionicLoading.hide();
                            ZMDataModel.zmLog("snapshot API Error: Could not get frames " + JSON.stringify(err));

                            $ionicLoading.show({
                                template: $translate.instant('kErrorRetrievingFrames'),
                                noBackdrop: true,
                                duration: 4000
                            });
                        });
            },

            function (err) {
                ZMDataModel.zmDebug("Error pausing stream before snapshot " + JSON.stringify(err));
                $ionicLoading.hide();
            }

        ); // then


    }


    function saveEventImageToPhone(onlyAlarms) {
        var curState = carouselUtils.getStop();
        carouselUtils.setStop(true);

        //console.log("Your index is  " + $scope.mycarousel.index);
        //console.log("Associated image is " + $scope.slides[$scope.mycarousel.index].img);

        ZMDataModel.zmDebug("ModalCtrl: SaveEventImageToPhone called");
        var canvas, context, imageDataUrl, imageData;
        var loginData = ZMDataModel.getLogin();


        // for alarms only
        if (onlyAlarms) $scope.mycarousel.index = 0;
        var url = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&path=" + $scope.relativePath + $scope.slides[$scope.mycarousel.index].img;


        $scope.selectEventUrl = url;
        $scope.slideIndex = $scope.mycarousel.index;
        $scope.slideLastIndex = $scope.slides.length - 1;




        $rootScope.zmPopup = $ionicPopup.show({
            template: '<center>Frame: {{slideIndex+1}} / {{slideLastIndex+1}}</center><br/><img src="{{selectEventUrl}}" width="100%"  />',
            title: 'Select ' + (onlyAlarms ? 'Alarmed ' : '') + 'frame to save',
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

        function saveNow() {
            $ionicLoading.show({
                template: $translate.instant('kSavingSnapshot') + "...",
                noBackdrop: true,
                duration: zm.httpTimeout
            });
            var url = $scope.selectEventUrl;
            ZMDataModel.zmLog("saveNow: File path to grab is " + url);

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


                    var fname = $scope.relativePath + $scope.slides[$scope.slideIndex].img + ".png";
                    fname = fname.replace(/\//, "-");
                    fname = fname.replace(/\.jpg/, '');

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
    }


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
        //console.log (">>>>>>>>>>>>>>>>>>>> MODAL VIEW ENTER");



    });

    $scope.$on('modal.shown', function (e, m) {

        if (m.id != 'footage')

            return;

        $scope.videoIsReady = false;
        var ld = ZMDataModel.getLogin();
        $scope.loginData = ZMDataModel.getLogin();

        $scope.singleImageQuality = ld.singleImageQuality;
        $scope.blockSlider = false;
        $scope.checkEventOn = false;
        //$scope.singleImageQuality = 100;



        //$scope.commandURL = $scope.currentEvent.Event.baseURL+"/index.php";
        // ZMDataModel.zmLog (">>>>>>>>>>>>>>>>>>ZMS url command is " + $scope.commandURL);

        currentEvent = $scope.currentEvent;

        console.log("Current Event " + JSON.stringify(currentEvent));
        $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
        ZMDataModel.zmDebug("Generated Connkey:" + $scope.connKey);

        $scope.currentFrame = 1;
        $scope.isPaused = false;
        //console.log ("CURRENT EVENT " + JSON.stringify($scope.currentEvent));
        $scope.currentEventDuration = Math.floor($scope.currentEvent.Event.Length);
        //console.log ($scope.event.Event.Frames);
        if (currentEvent && currentEvent.Event) {
            //console.log ("************ CALLING PREPARE MODAL ***********");
            prepareModalEvent(currentEvent.Event.Id);
            if (ld.useNphZmsForEvents) {
                $timeout(function () {

                    if ($scope.modal != undefined && $scope.modal.isShown()) {
                        ZMDataModel.zmLog(">>>Starting checkAllEvents interval...");

                        //eventQueryHandle  = $timeout (checkEvent(), zm.eventPlaybackQuery);

                        $interval.cancel(eventQueryHandle);
                        eventQueryHandle = $interval(function () {
                            checkEvent();
                            //  console.log ("Refreshing Image...");
                        }.bind(this), zm.eventPlaybackQuery);
                    } else {
                        ZMDataModel.zmLog(">>>Modal was exited, not starting checkAllEvents");
                    }

                }, 5000);
            }

        }






    });

    //var current_data;
    function drawGraph() {


        var cv = document.getElementById("eventchart");
        var ctx = cv.getContext("2d");


        frameoptions = {
            responsive: true,
            legend: false,
            title: {
                display: false,
                text: ""
            },
            scales: {
                yAxes: [{
                    display: false,
                    scaleLabel: {
                        display: false,
                        labelString: 'value',
                    }

            }],
                xAxes: [{
                    type: 'time',
                    display: false,
                    time: {

                        format: timeFormat,
                        tooltipFormat: 'll HH:mm',
                        min: framearray.datasets[0].data[0].x,
                        max: framearray.datasets[0].data[framearray.datasets[0].data.length - 1].x,
                        displayFormats: {

                        }
                    },
                    scaleLabel: {
                        display: false,
                        labelString: ''
                    }

                }]
            }
        };


        $timeout(function () {


            var myChart = new Chart(ctx, {
                type: 'line',
                data: framearray,
                options: frameoptions,
            });

        });
    }


    $scope.$on('modal.removed', function (e, m) {
        $interval.cancel(eventQueryHandle);
        if (m.id != 'footage')
            return;


        $scope.isModalActive = false;

        ZMDataModel.zmDebug("Modal removed - killing connkey");
        sendCommand(17, $scope.connKey);
        //$timeout (function(){ZMDataModel.stopNetwork("Modal removed inside EventModalCtrl");},400);

        // Execute action
    });


    // Playback speed adjuster
    $scope.adjustSpeed = function (val) {

        if ($scope.defaultVideo !== undefined && $scope.defaultVideo != '') {

            $ionicLoading.show({
                template: $translate.instant('kUseVideoControls'),
                noBackdrop: true,
                duration: 3000
            });
            return;
        }

        var ld = ZMDataModel.getLogin();

        if (ld.useNphZmsForEvents) {

            var cmd;
            $scope.isPaused = false;
            switch (val) {
                case 'ff':
                    cmd = 4;
                    break;
                case 'fr':
                    cmd = 7;
                    break;
                case 'np':
                    cmd = 2;
                    break;
                case 'p':
                    cmd = 1;
                    $scope.isPaused = true;
                    break;
                default:
                    cmd = 0;
            }

            $ionicLoading.show({
                template: $translate.instant('kPleaseWait') + "...",
                noBackdrop: true,
                duration: zm.httpTimeout
            });

            sendCommand(cmd, $scope.connKey)
                .then(function (success) {
                        $ionicLoading.hide();

                    },
                    function (err) {
                        $ionicLoading.hide();
                        ZMDataModel.zmDebug("Error in adjust speed: " + JSON.stringify(err));
                    }
                );


        } else // not using nph
        {

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
                template: $translate.instant('kPlaybackInterval') + ': ' + $scope.eventSpeed.toFixed(3) + "ms",
                animation: 'fade-in',
                showBackdrop: false,
                duration: 1500,
                maxWidth: 300,
                showDelay: 0
            });
        }



    };


    $scope.toggleGapless = function () {
        // console.log(">>>>>>>>>>>>>>GAPLESS TOGGLE INSIDE MODAL");
        $scope.loginData.gapless = !$scope.loginData.gapless;
        ZMDataModel.setLogin($scope.loginData);

        ZMDataModel.zmDebug("EventModalCtrl: gapless has changed resetting everything & re-generating connkey");
        ZMDataModel.stopNetwork("EventModalCtrl-toggle gapless");
        ZMDataModel.zmDebug("Regenerating connkey as gapless has changed");
        // console.log ("********* OFFSET FROM TOGGLE GAPLESS");
        $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
        $timeout(function () {
            sendCommand('14', $scope.connKey, '&offset=' + $scope.currentProgress.progress);
        }, 500);
        //$timeout.cancel(eventQueryHandle);
        //eventQueryHandle  = $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);


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


    $scope.zoomImage = function (val) {
        var zl = parseInt($ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom);
        if (zl == 1 && val == -1) {
            ZMDataModel.zmDebug("Already zoomed out max");
            return;
        }


        zl += val;
        ZMDataModel.zmDebug("Zoom level is " + zl);
        $ionicScrollDelegate.$getByHandle("imgscroll").zoomTo(zl, true);

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

        if (ld.useNphZmsForEvents) {
            ZMDataModel.zmLog("using zms to move ");
            jumpToEventZms($scope.connKey, dirn);
            // sendCommand ( dirn==1?'13':'12',$scope.connKey);

        } else {
            jumpToEvent(eid, dirn);
        }

        //console.log("JUMPING");


    };

    $scope.jumpToEvent = function (eid, dirn) {
        // console.log("jumptoevent");
        var ld = ZMDataModel.getLogin();
        if (ld.useNphZmsForEvents) {
            ZMDataModel.zmLog("using zms to move ");
            jumpToEventZms($scope.connKey, dirn);
            // sendCommand ( dirn==1?'13':'12',$scope.connKey);

        } else {
            jumpToEvent(eid, dirn);
        }

    };

    function jumpToEvent(eid, dirn) {
        ZMDataModel.zmLog("Event jump called with:" + eid);
        if (eid == "") {
            $ionicLoading.show({
                template: $translate.instant('kNoMoreEvents'),
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
            ZMDataModel.stopNetwork("EventModalCtrl-out with old");
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


        if ($scope.defaultVideo !== undefined && $scope.defaultVideo != '') {

            $ionicLoading.show({
                template: $translate.instant('kEventNavVidFeeds'),
                noBackdrop: true,
                duration: 3000
            });
            return;

        }
        var cmd = dirn == 1 ? '13' : '12';
        $scope.d_eventId = "...";
        ZMDataModel.zmDebug("Sending " + cmd + " to " + connkey);

        $ionicLoading.show({
            template: $translate.instant('kSwitchingEvents') + "...",
            noBackdrop: true,
            duration: zm.httpTimeout
        });

        console.log("Send command connkey: " + connkey);
        sendCommand(cmd, connkey)
            .then(
                function (success) {
                    //console.log ("jump success " + JSON.stringify(success));
                    $ionicLoading.hide();
                },
                function (error) {

                    ZMDataModel.zmDebug("Hmm jump  error " + JSON.stringify(error));
                    ZMDataModel.stopNetwork("EventModalCtrl-jumptoEventZms error");
                    $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
                    //  console.log ("********* OFFSET FROM JUMPTOEVENTZMS ERROR");
                    $timeout(function () {
                        sendCommand('14', $scope.connKey, '&offset=' + $scope.currentProgress.progress);
                    }, 500);
                    ZMDataModel.zmDebug("so I'm regenerating Connkey to " + $scope.connKey);
                    //$timeout.cancel(eventQueryHandle);
                    // eventQueryHandle  =  $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);
                    $ionicLoading.hide();
                });
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

                    event.Event.streamingURL = ZMDataModel.getStreamingURL(event.Event.MonitorId);
                    //  event.Event.baseURL = ZMDataModel.getBaseURL (event.Event.MonitorId);
                    event.Event.baseURL = loginData.url;
                    event.Event.imageMode = ZMDataModel.getImageMode(event.Event.MonitorId);

                    //console.log (JSON.stringify( success));
                    $scope.eventName = event.Event.Name;
                    $scope.eventId = event.Event.Id;
                    $scope.d_eventId = $scope.eventId;
                    $scope.eFramesNum = event.Event.Frames;
                    $scope.eventDur = Math.round(event.Event.Length);
                    $scope.loginData = ZMDataModel.getLogin();

                    //console.log("**** VIDEO STATE IS " + event.Event.DefaultVideo);
                    if (typeof event.Event.DefaultVideo === 'undefined')
                        event.Event.DefaultVideo = "";

                    $scope.defaultVideo = event.Event.DefaultVideo;

                    console.log("loginData is " + JSON.stringify($scope.loginData));
                    console.log("Event ID is " + $scope.eventId);
                    console.log("video is " + $scope.defaultVideo);


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
                    var videoURL;

                    if (event.Event.imageMode == 'path')
                        videoURL = event.Event.baseURL + "/events/" + event.Event.relativePath + event.Event.DefaultVideo;
                    else
                        videoURL = event.Event.baseURL + "/index.php?view=view_video&eid=" + event.Event.Id;

                    // hack
                    //  videoURL = "http://static.videogular.com/assets/videos/videogular.mp4";

                    $scope.video_url = videoURL;

                    //  console.log("************** VIDEO IS " + videoURL);

                    ZMDataModel.zmDebug("Video url passed to player is: " + videoURL);

                    // console.log (">>>>>>>>>>>>>"+loginData.url+"-VS-"+event.Event.baseURL);

                    //console.log("************** VIDEO IS " + videoURL);


                    $scope.videoObject = {
                        config: {
                            autoPlay: true,
                            sources: [
                                {
                                    src: $sce.trustAsResourceUrl(videoURL),
                                    type: "video/mp4"
                                }

                            ],

                            theme: "lib/videogular-themes-default/videogular.css",
                        }
                    };

                    // $scope.videoObject = angular.copy(event.Event.video);

                    $scope.playbackURL = $scope.loginData.url;

                    $scope.videoIsReady = true;

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

                    //$scope.FrameArray = event.Frame;
                    //  $scope.slider_options.scale=[];
                    // $scope.slider_modal_options.scale = [];

                    // lets 
                    framearray.datasets[0].data = [];
                    for (i = 0; i < event.Frame.length; i++) {

                        var ts = moment(event.Frame[i].TimeStamp).format(timeFormat);

                        //console.log ("pushing s:" + event.Frame[i].Score+" t:"+ts);

                        framearray.datasets[0].data.push({
                            x: ts,
                            y: event.Frame[i].Score
                        });
                        framearray.labels.push("");


                    }
                    $scope.totalEventTime = Math.round(parseFloat(event.Event.Length)) - 1;
                    $scope.currentEventTime = 0;

                    $timeout(function () {
                        drawGraph();
                    }, 500);
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


            //console.log ("***ION RANGE CHANGED TO " + $scope.mycarousel.index);
        });
    }

    if (typeof $scope.mycarousel !== 'undefined') {
        $scope.$watch('mycarousel.index', function () {

            if (currentEvent && $scope.ionRange.index == parseInt(currentEvent.Event.Frames - 1)) {
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