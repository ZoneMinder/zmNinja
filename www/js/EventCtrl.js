/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,moment, MobileAccessibility */

// This is the controller for Event view. StateParams is if I recall the monitor ID.
// This was before I got access to the new APIs. FIXME: Revisit this code to see what I am doing with it
// and whether the new API has a better mechanism

angular.module('zmApp.controllers')

// alarm frames filter
.filter('selectFrames', function ($filter, $translate) {

    // Create the return function and set the required parameter name to **input**
    return function (input, typeOfFrames) {


        var out = [];

        angular.forEach(input, function (item) {


            if (typeOfFrames == $translate.instant('kShowTimeDiffFrames')) {
                if (item.type == $translate.instant('kShowTimeDiffFrames'))
                    out.push(item);
            } else
                out.push(item);

        });

        return out;
    };

})

.controller('zmApp.EventCtrl', ['$scope', '$rootScope', 'zm', 'NVRDataModel', 'message', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$ionicPlatform', '$ionicSlideBoxDelegate', '$ionicPosition', '$ionicPopover', '$ionicPopup', 'EventServer', '$sce', '$cordovaBadge', '$cordovaLocalNotification', '$q', 'carouselUtils', '$translate', function ($scope, $rootScope, zm, NVRDataModel, message, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $ionicPlatform, $ionicSlideBoxDelegate, $ionicPosition, $ionicPopover, $ionicPopup, EventServer, $sce, $cordovaBadge, $cordovaLocalNotification, $q, carouselUtils, $translate) {

    // events in last 5 minutes
    // TODO https://server/zm/api/events/consoleEvents/5%20minute.json

    //---------------------------------------------------
    // Controller main
    //---------------------------------------------------

    var loginData;
    var oldEvent;
    var scrollbynumber;
    var eventImageDigits = 5; // failsafe
    var eventsPage;
    var moreEvents;
    var pageLoaded;
    var enableLoadMore;
    var lData;
    var stackState;
    var ionRangeWatcher;
    var mycarouselWatcher;
    var nolangFrom;
    var nolangTo;
    
    $scope.typeOfFrames = $translate.instant('kShowTimeDiffFrames');
    var eventsListScrubHeight = eventsListScrubHeight;
    var eventsListDetailsHeight = eventsListDetailsHeight;


    //---------------------------------------------------
    // initial code
    //---------------------------------------------------

    
    $rootScope.$on("language-changed", function () {
        NVRDataModel.log(">>>>>>>>>>>>>>> language changed");
        doRefresh();
    });

    $scope.$on('$ionicView.afterEnter', function () {
        //console.log ("********* AFTER ENTER");
        $scope.events = [];
        getInitialEvents();
        setupWatchers();
        footerExpand();
    });

    
    
    $scope.$on('$ionicView.beforeEnter', function () {

        
        //console.log ("********* BEFORE ENTER");
        document.addEventListener("pause", onPause, false);
        //console.log("I got STATE PARAM " + $stateParams.id);
        $scope.id = parseInt($stateParams.id, 10);
        $scope.showEvent = $stateParams.playEvent || false;
        
        console.log (">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        
       
         NVRDataModel.log  ("EventCtrl called with: EID=" + $scope.id + " playEvent =  "+$scope.showEvent);
        
        // This is the only view that hardcodes row size due to
        // collection repeat, so lets re-get the text size if it has changed
        // note that there may be a delay as its a callback - so might involve
        // a UI jiggle 
        
        if ($rootScope.platformOS != "desktop")
            MobileAccessibility.getTextZoom(getTextZoomCallback);
        
        eventsListDetailsHeight = parseInt(zm.eventsListDetailsHeight * $rootScope.textScaleFactor);
        eventsListScrubHeight = parseInt(zm.eventsListScrubHeight * $rootScope.textScaleFactor);
        
        NVRDataModel.debug (">>>height of list/scrub set to " + eventsListDetailsHeight + " and " + eventsListScrubHeight);

        pageLoaded = false;
        enableLoadMore = true;

        $scope.mycarousel = {
            index: 0
        };

        $scope.ionRange = {
            index: 1
        };
        $scope.animationInProgress = false;

        $scope.hours = [];
        $scope.days = [];
        $scope.weeks = [];
        $scope.months = [];


        $scope.eventList = {
            showDelete: false
        };

        $scope.slides = []; // will hold scrub frames
        $scope.totalEventTime = 0; // used to display max of progress bar
        $scope.currentEventTime = 0;
        oldEvent = ""; // will hold previous event that had showScrub = true
        scrollbynumber = 0;
        $scope.eventsBeingLoaded = true;
        $scope.FrameArray = []; // will hold frame info from detailed Events API
        loginData = NVRDataModel.getLogin();
        NVRDataModel.getKeyConfigParams(0)
            .then(function (data) {
                //console.log ("***GETKEY: " + JSON.stringify(data));
                eventImageDigits = parseInt(data);
                NVRDataModel.log("Image padding digits reported as " + eventImageDigits);
            });


        $scope.showSearch = false;
        eventsPage = 1;
        moreEvents = true;
        $scope.viewTitle = {
            title: ""
        };
        $scope.search = {
            text: ""

        };
        $scope.myfilter = "";

        $scope.loginData = NVRDataModel.getLogin();
        $scope.playbackURL = $scope.loginData.url;

    });



    function getEventObject(eid)
    {
        
        var apiurl = NVRDataModel.getLogin().apiurl + '/events/'+eid+'.json';
        
        $http.get (apiurl)
        .success (function (data) {
        })
        .error (function (err) {
        });
        /*
        myevents[i].Event.humanizeTime = humanizeTime(myevents[i].Event.StartTime);
        myevents[i].Event.MonitorName = NVRDataModel.getMonitorName(myevents[i].Event.MonitorId);
        // now construct base path

        myevents[i].Event.streamingURL = NVRDataModel.getStreamingURL(myevents[i].Event.MonitorId);
        myevents[i].Event.baseURL = NVRDataModel.getBaseURL(myevents[i].Event.MonitorId);
        myevents[i].Event.imageMode = NVRDataModel.getImageMode(myevents[i].Event.MonitorId);
        // console.log ("***** MULTISERVER STREAMING URL FOR EVENTS " + myevents[i].Event.streamingURL);

        //  console.log ("***** MULTISERVER BASE URL FOR EVENTS " + myevents[i].Event.baseURL);

        myevents[i].Event.ShowScrub = false;
        myevents[i].Event.BasePath = computeBasePath(myevents[i]);
        myevents[i].Event.relativePath = computeRelativePath(myevents[i]);
        */
    }
    

    function getTextZoomCallback(tz)
    {
            $rootScope.textScaleFactor = parseFloat(tz+"%") / 100.0;
            NVRDataModel.debug ("text zoom factor is " + $rootScope.textScaleFactor);
    }
    



    // --------------------------------------------------------
    // Handling of back button in case modal is open should
    // close the modal
    // --------------------------------------------------------                               

    $ionicPlatform.registerBackButtonAction(function (e) {
        e.preventDefault();
        if ($scope.modal != undefined && $scope.modal.isShown()) {
            // switch off awake, as liveview is finished
            NVRDataModel.debug("Modal is open, closing it");
            NVRDataModel.setAwake(false);
            $scope.modal.remove();
        } else {
            NVRDataModel.debug("Modal is closed, so toggling or exiting");
            if (!$ionicSideMenuDelegate.isOpenLeft()) {
                $ionicSideMenuDelegate.toggleLeft();

            } else {
                navigator.app.exitApp();
            }

        }

    }, 1000);


    //--------------------------------------
    // monitor the slider for carousels
    //--------------------------------------
    function setupWatchers() {
        NVRDataModel.debug("Setting up carousel watchers");

        ionRangeWatcher = $scope.$watch('ionRange.index', function () {
            // console.log ("Watching index");
            $scope.mycarousel.index = parseInt($scope.ionRange.index) - 1;
            if (carouselUtils.getStop() == true)
                return;


            //console.log ("***ION RANGE CHANGED TO " + $scope.mycarousel.index);
        });



        mycarouselWatcher = $scope.$watch('mycarousel.index', function () {


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

    // --------------------------------------------------------
    // Handling of back button in case modal is open should
    // close the modal
    // --------------------------------------------------------      

    function getInitialEvents() {
        NVRDataModel.debug("getInitialEvents called");
        var lData = NVRDataModel.getLogin();

        var stackState = $ionicHistory.backTitle();

        // If you came from Monitors, disregard hidden monitors in montage
        if (lData.persistMontageOrder && stackState != "Monitors") {
            var tempMon = message;
            $scope.monitors = NVRDataModel.applyMontageMonitorPrefs(tempMon, 2)[0];
        } else
            $scope.monitors = message;


        if ($scope.monitors.length == 0) {
            var pTitle = $translate.instant('kNoMonitors');
            $ionicPopup.alert({
                title: pTitle,
                template: "{{'kCheckCredentials' | translate }}"
            });
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go("login", {
                "wizard": false
            });
            return;
        }

        $scope.events = [];

        // First get total pages and then
        // start from the latest. If this fails, nothing displays

        NVRDataModel.debug("EventCtrl: grabbing # of event pages");
        nolangFrom = "";
        nolangTo = "";
        if ($rootScope.fromString)
            nolangFrom = moment($rootScope.fromString).locale('en').format("YYYY-MM-DD HH:mm:ss");
        if ($rootScope.toString)
            nolangTo = moment($rootScope.toString).locale('en').format("YYYY-MM-DD HH:mm:ss");
        NVRDataModel.getEventsPages($scope.id, nolangFrom, nolangTo)
            .then(function (data) {
                eventsPage = data.pageCount;
                NVRDataModel.debug("EventCtrl: found " + eventsPage + " pages of events");

                pageLoaded = true;
                $scope.viewTitle.title = data.count;
                NVRDataModel.debug("EventCtrl: grabbing events for: id=" + $scope.id + " Date/Time:" + $rootScope.fromString +
                    "-" + $rootScope.toString);
                nolangFrom = "";
                nolangTo = "";
                if ($rootScope.fromString)
                    nolangFrom = moment($rootScope.fromString).locale('en').format("YYYY-MM-DD HH:mm:ss");
                if ($rootScope.toString)
                    nolangTo = moment($rootScope.toString).locale('en').format("YYYY-MM-DD HH:mm:ss");

                NVRDataModel.getEvents($scope.id, eventsPage, "", nolangFrom, nolangTo)
                    .then(function (data) {

                        var myevents = data;
                        NVRDataModel.debug("EventCtrl: success, got " + myevents.length + " events");
                        var loginData = NVRDataModel.getLogin();
                        for (var i = 0; i < myevents.length; i++) {

                            var idfound = true;
                            if (loginData.persistMontageOrder) {
                                idfound = false;
                                for (var ii = 0; ii < $scope.monitors.length; ii++) {
                                    if ($scope.monitors[ii].Monitor.Id == myevents[i].Event.MonitorId) {

                                        idfound = true;
                                        break;
                                    }
                                }
                            }


                            myevents[i].Event.humanizeTime = humanizeTime(myevents[i].Event.StartTime);
                            myevents[i].Event.streamingURL = NVRDataModel.getStreamingURL(myevents[i].Event.MonitorId);
                            myevents[i].Event.baseURL = NVRDataModel.getBaseURL(myevents[i].Event.MonitorId);
                            myevents[i].Event.imageMode = NVRDataModel.getImageMode(myevents[i].Event.MonitorId);

                            //console.log ("***** MULTISERVER STREAMING URL FOR EVENTS " + myevents[i].Event.streamingURL);

                            // console.log ("***** MULTISERVER BASE URL FOR EVENTS " + myevents[i].Event.baseURL);

                            myevents[i].Event.MonitorName = NVRDataModel.getMonitorName(myevents[i].Event.MonitorId);
                            myevents[i].Event.ShowScrub = false;
                            myevents[i].Event.height = eventsListDetailsHeight;
                            // now construct base path
                            myevents[i].Event.BasePath = computeBasePath(myevents[i]);
                            myevents[i].Event.relativePath = computeRelativePath(myevents[i]);


                            // in multiserver BasePath is login url for frames 
                            // http://login.url/index.php?view=frame&eid=19696772&fid=21

                            //  console.log ("COMPARING "+NVRDataModel.getLogin().url+ " TO " +myevents[i].Event.baseURL);
                            if (NVRDataModel.getLogin().url != myevents[i].Event.baseURL) {
                                //NVRDataModel.debug ("Multi server, changing base");
                                myevents[i].Event.baseURL = NVRDataModel.getLogin().url;

                            }

                            if (idfound) {
                                $scope.events.push(myevents[i]);
                            } else {
                                //console.log ("Skipping Event MID = " + myevents[i].Event.MonitorId);
                            }

                        } //for


                        //$scope.events = myevents;
                        // we only need to stop the template from loading when the list is empty
                        // so this can be false once we have _some_ content
                        // FIXME: check reload
                        $scope.eventsBeingLoaded = false;
                        // to avoid only few events being displayed
                        // if last page has less events
                        //console.log("**Loading Next Page ***");
                        if (myevents.length < 50) {
                            NVRDataModel.debug("EventCtrl:loading one more page just in case we don't have enough to display");
                            loadMore();
                        }
                    });

            });
    }



    //-------------------------------------------------------
    // Tapping on a frame shows this image
    //------------------------------------------------------

    function SaveSuccess() {
        $ionicLoading.show({
            template: $translate.instant('kDone'),
            noBackdrop: true,
            duration: 1000
        });
        NVRDataModel.debug("ModalCtrl:Photo saved successfuly");
    }

    function SaveError(e) {
        $ionicLoading.show({
            template: $translate.instant('kErrorSave'),
            noBackdrop: true,
            duration: 2000
        });
        NVRDataModel.log("Error saving image: " + e.message);
        //console.log("***ERROR");
    }


    function saveNow(imgsrc, r, f) {

        $ionicLoading.show({
            template: $translate.instant('kSavingSnapshot') + "...",
            noBackdrop: true,
            duration: zm.httpTimeout
        });
        var url = imgsrc;
        NVRDataModel.log("saveNow: File path to grab is " + url);

        var img = new Image();
        img.onload = function () {
            // console.log("********* ONLOAD");
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);

            var imageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
            var imageData = imageDataUrl.replace(/data:image\/jpeg;base64,/, '');

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


                var fname = r + f + ".png";
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

    $scope.showImage = function (p, r, f, fid, e, imode, id, parray, ndx) {
        var img;


        //console.log ("HERE");
        $scope.kFrame = $translate.instant('kFrame');
        $scope.kEvent = $translate.instant('kEvent');
        $scope.ndx = ndx;
        $scope.parray = parray;
        $scope.imode = imode;

        // note ndx may be incorrect if we are looking 
        // at unique frames;

        // NVRDataModel.debug("Hello");
        if ($scope.typeOfFrames == $translate.instant('kShowTimeDiffFrames')) {

            var ic;

            for (ic = 0; ic < $scope.parray.length; ic++) {
                if ($scope.parray[ic].frameid == fid)
                    break;
            }


            NVRDataModel.debug("Readjusting selected frame ID from:" + $scope.ndx + "  to actual frame ID of:" + ic);
            $scope.ndx = ic;
        } else {
            NVRDataModel.debug("No index adjustment necessary as we are using all frames");
        }




        // console.log ("Image Mode " + imode);
        // console.log ("parray :  " + JSON.stringify(parray));
        // console.log ("index: " + ndx);
        if ($scope.imode == 'path')

            $scope.imgsrc = p + "/index.php?view=image&path=" + r + $scope.parray[$scope.ndx].fname;
        else {
            $scope.imgsrc = p + "/index.php?view=image&fid=" + $scope.parray[$scope.ndx].id;

        }




        //$rootScope.zmPopup = $ionicPopup.alert({title: kFrame+':'+fid+'/'+kEvent+':'+e,template:img,  cssClass:'popup80'});

        $rootScope.zmPopup = $ionicPopup.show({
            template: '<center>' + $translate.instant('kFrame') + ':{{parray[ndx].frameid}}@{{prettifyTimeSec(parray[ndx].time)}}</center><br/><img src="{{imgsrc}}" width="100%"  />',
            title: $translate.instant('kImages') + " (" + $translate.instant($scope.typeOfFrames) + ")",
            subTitle: 'use left and right arrows to change',
            scope: $scope,
            cssClass: 'popup95',
            buttons: [

                {
                    text: '',
                    type: 'button-assertive button-small ion-camera',
                    onTap: function (e) {
                        e.preventDefault();
                        saveNow($scope.imgsrc, r, parray[$scope.ndx].fname);

                    }
                },

                {
                    // left 1
                    text: '',
                    type: 'button-small button-energized ion-chevron-left',
                    onTap: function (e) {
                        // look for next frame that matches the type of frame
                        // we are showing (all or diff timestamps);

                        // console.log ("TYPE OF FRAMES: " + $scope.typeOfFrames);
                        var nndx = null;
                        var alltype = $translate.instant('kShowAllFrames');
                        for (var i = $scope.ndx - 1; i >= 0; i--) {
                            if ($scope.parray[i].type == $scope.typeOfFrames || $scope.typeOfFrames == alltype) {
                                nndx = i;
                                break;
                            }
                        }
                        if (nndx == null) nndx = $scope.ndx;
                        $scope.ndx = nndx;

                        if ($scope.imode == 'path') {

                            $scope.imgsrc = p + "/index.php?view=image&path=" + r + $scope.parray[$scope.ndx].fname;
                        } else {
                            $scope.imgsrc = p + "/index.php?view=image&fid=" + $scope.parray[$scope.ndx].id;
                        }



                        e.preventDefault();


                    }
                },
                {
                    // right 1
                    text: '',
                    type: 'button-small button-energized ion-chevron-right',
                    onTap: function (e) {

                        // look for next frame that matches the type of frame
                        // we are showing (all or diff timestamps);

                        // console.log ("TYPE OF FRAMES: " + $scope.typeOfFrames);
                        var nndx = null;
                        var alltype = $translate.instant('kShowAllFrames');
                        for (var i = $scope.ndx + 1; i < $scope.parray.length; i++) {
                            //console.log ("Comparing: " +$scope.parray[i].type +" to " + $scope.typeOfFrames);
                            if ($scope.parray[i].type == $scope.typeOfFrames || $scope.typeOfFrames == alltype) {
                                nndx = i;
                                break;
                            }
                        }
                        if (nndx == null) nndx = $scope.ndx;
                        $scope.ndx = nndx;

                        if ($scope.imode == 'path') {

                            $scope.imgsrc = p + "/index.php?view=image&path=" + r + $scope.parray[$scope.ndx].fname;
                        } else {
                            $scope.imgsrc = p + "/index.php?view=image&fid=" + $scope.parray[$scope.ndx].id;
                        }

                        e.preventDefault();


                    }
                },



                {
                    text: '',
                    type: 'button-positive button-small ion-checkmark-round',
                    onTap: function (e) {


                    }
                }]
        });




    };






    $scope.toggleTypeOfAlarms = function () {
        //  "kShowAllFrames"             : "all",
        // "kShowTimeDiffFrames"        :  "different timestamps"

        if ($scope.typeOfFrames == $translate.instant('kShowAllFrames')) {
            $scope.typeOfFrames = $translate.instant('kShowTimeDiffFrames');
        } else {
            $scope.typeOfFrames = $translate.instant('kShowAllFrames');
        }
    };


    // not explictly handling error --> I have a default "No events found" message
    // displayed in the template if events list is null

    //--------------------------------------------------------------------------
    // This is what the pullup bar calls depending on what range is specified
    //--------------------------------------------------------------------------
    $scope.showEvents = function (val, unit, monitorId) {
        NVRDataModel.debug("ShowEvents called with val:" + val + " unit:" + unit + " for Monitor:" + monitorId);

        $ionicHistory.nextViewOptions({
            disableBack: true
        });

        var mToDate = moment();

        var mFromDate = moment().subtract(parseInt(val), unit);

        // console.log("Moment Dates:" + mFromDate.format() + " TO  " + mToDate.format());

        $rootScope.fromTime = mFromDate.toDate();
        $rootScope.toTime = mToDate.toDate();
        $rootScope.fromDate = $rootScope.fromTime;
        $rootScope.toDate = $rootScope.toTime;

        NVRDataModel.debug("From: " + $rootScope.fromTime);
        NVRDataModel.debug("To: " + $rootScope.toTime);

        //$rootScope.fromDate = fromDate.toDate();
        //$rootScope.toDate = toDate.toDate();
        $rootScope.isEventFilterOn = true;
        $rootScope.fromString = mFromDate
            .format("YYYY-MM-DD") + " " + mFromDate.format("HH:mm:ss");

        $rootScope.toString = mToDate
            .format("YYYY-MM-DD") + " " + mToDate
            .format("HH:mm:ss");


        // console.log("**************From String: " + $rootScope.fromString);
        //  console.log("**************To String: " + $rootScope.toString);

        // reloading - may solve https://github.com/pliablepixels/zmNinja/issues/36
        // if you are in the same mid event page $state.go won't work
        $state.go("events", {
            "id": monitorId,
            "playEvent":false
        }, {
            reload: true
        });
    };

    //----------------------------------------------------------------
    // Alarm notification handling
    //----------------------------------------------------------------
    $scope.handleAlarms = function () {
        $rootScope.isAlarm = !$rootScope.isAlarm;
        if (!$rootScope.isAlarm) {
            $rootScope.alarmCount = "0";
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go("events", {
                "id": 0,
                "playEvent":false
            }, {
                reload: true
            });
        }
    };

    //--------------------------------------------------------------------------
    // Takes care of deleting individual events
    //--------------------------------------------------------------------------
    $scope.deleteEvent = function (id, itemid) {
        //$scope.eventList.showDelete = false;
        //curl -XDELETE http://server/zm/api/events/1.json
        var loginData = NVRDataModel.getLogin();
        var apiDelete = loginData.apiurl + "/events/" + id + ".json";
        NVRDataModel.debug("DeleteEvent: ID=" + id + " item=" + itemid);
        NVRDataModel.log("Delete event " + apiDelete);

        $ionicLoading.show({
            template: "{{'kDeletingEvent' | translate}}...",
            noBackdrop: true,
            duration: zm.httpTimeout
        });

        $http.delete(apiDelete)
            .success(function (data) {
                $ionicLoading.hide();
                NVRDataModel.debug("delete success: " + JSON.stringify(data));
                NVRDataModel.displayBanner('info', [$translate.instant('kDeleteEventSuccess')], 2000, 2000);

                $scope.events.splice(itemid, 1);
                //doRefresh();

            })
            .error(function (data) {
                $ionicLoading.hide();
                NVRDataModel.debug("delete error: " + JSON.stringify(data));
                NVRDataModel.displayBanner('error', [$translate.instant('kDeleteEventError1'), $translate.instant('kDeleteEventError2')]);
            });


    };

    //------------------------------------------------
    // Tapping on the filter sign lets you reset it
    //-------------------------------------------------

    $scope.filterTapped = function () {
        //console.log("FILTER TAPPED");
        var myFrom = moment($rootScope.fromString).format("MMM/DD/YYYY " + NVRDataModel.getTimeFormat()).toString();
        var toString = moment($rootScope.toString).format("MMM/DD/YYYY " + NVRDataModel.getTimeFormat()).toString();

        $rootScope.zmPopup = $ionicPopup.confirm({
            title: $translate.instant('kFilterSettings'),
            template: $translate.instant('kFilterEventsBetween1') + ':<br/> <b>' + myFrom + "</b> " + $translate.instant('kTo') + " <b>" + toString + '</b><br/>' + $translate.instant('kFilterEventsBetween2')
        });
        $rootScope.zmPopup.then(function (res) {
            if (res) {
                NVRDataModel.log("Filter reset requested in popup");
                $rootScope.isEventFilterOn = false;
                $rootScope.fromDate = "";
                $rootScope.fromTime = "";
                $rootScope.toDate = "";
                $rootScope.toTime = "";
                $rootScope.fromString = "";
                $rootScope.toString = "";
                $ionicHistory.nextViewOptions({
                    disableBack: true
                });
                $state.go("events", {
                    "id": 0,
                    "playEvent":false
                });
            } else {
                NVRDataModel.log("Filter reset cancelled in popup");
            }
        });

    };

    //--------------------------------------------------------------------------
    // When the user pulls the pullup bar we call this to get the latest
    // data for events ranges summaries using the consolveEvents facility of ZM
    //--------------------------------------------------------------------------

    $scope.footerExpand = function () {
            footerExpand();

    };

    function footerExpand()
    {
                //https://server/zm/api/events/consoleEvents/5%20minute.json
        var ld = NVRDataModel.getLogin();

        var af =  "/AlarmFrames >=:" + (ld.enableAlarmCount ? ld.minAlarmCount : 0);

        var apiurl = ld.apiurl + "/events/consoleEvents/1%20hour" + af + ".json";
        NVRDataModel.debug("consoleEvents API:" + apiurl);


        $http.get(apiurl)
            .success(function (data) {
                NVRDataModel.debug(JSON.stringify(data));
                $scope.hours = [];
                var p = data.results;
                for (var key in data.results) {



                    if (p.hasOwnProperty(key)) {

                        var idfound = true;
                        if (ld.persistMontageOrder) {
                            idfound = false;
                            for (var ii = 0; ii < $scope.monitors.length; ii++) {
                                if ($scope.monitors[ii].Monitor.Id == key) {
                                    idfound = true;
                                    break;
                                }
                            }
                        }
                        //console.log(NVRDataModel.getMonitorName(key) + " -> " + p[key]);
                        if (idfound)
                            $scope.hours.push({
                                monitor: NVRDataModel.getMonitorName(key),
                                events: p[key],
                                mid: key
                            });

                    }
                }
            });


        apiurl = ld.apiurl + "/events/consoleEvents/1%20day" + af + ".json";
        NVRDataModel.debug("consoleEvents API:" + apiurl);
        $http.get(apiurl)
            .success(function (data) {
                NVRDataModel.debug(JSON.stringify(data));
                $scope.days = [];
                var p = data.results;
                for (var key in data.results) {
                    if (p.hasOwnProperty(key)) {
                        var idfound = true;
                        if (ld.persistMontageOrder) {
                            idfound = false;
                            for (var ii = 0; ii < $scope.monitors.length; ii++) {
                                if ($scope.monitors[ii].Monitor.Id == key) {
                                    idfound = true;
                                    break;
                                }
                            }
                        }
                        //console.log(NVRDataModel.getMonitorName(key) + " -> " + p[key]);
                        if (idfound)
                        //console.log(NVRDataModel.getMonitorName(key) + " -> " + p[key]);
                            $scope.days.push({
                            monitor: NVRDataModel.getMonitorName(key),
                            events: p[key],
                            mid: key
                        });

                    }
                }
            });



        apiurl = ld.apiurl + "/events/consoleEvents/1%20week" + af + ".json";
        NVRDataModel.debug("consoleEvents API:" + apiurl);
        $http.get(apiurl)
            .success(function (data) {
                NVRDataModel.debug(JSON.stringify(data));
                $scope.weeks = [];
                var p = data.results;
                for (var key in data.results) {
                    if (p.hasOwnProperty(key)) {

                        var idfound = true;
                        if (ld.persistMontageOrder) {
                            idfound = false;
                            for (var ii = 0; ii < $scope.monitors.length; ii++) {
                                if ($scope.monitors[ii].Monitor.Id == key) {
                                    idfound = true;
                                    break;
                                }
                            }
                        }
                        //console.log(NVRDataModel.getMonitorName(key) + " -> " + p[key]);
                        if (idfound)
                        //console.log(NVRDataModel.getMonitorName(key) + " -> " + p[key]);
                            $scope.weeks.push({
                            monitor: NVRDataModel.getMonitorName(key),
                            events: p[key],
                            mid: key
                        });

                    }
                }
            });


        apiurl = ld.apiurl + "/events/consoleEvents/1%20month" + af + ".json";
        NVRDataModel.debug("consoleEvents API:" + apiurl);
        $http.get(apiurl)
            .success(function (data) {
                NVRDataModel.debug(JSON.stringify(data));
                $scope.months = [];
                var p = data.results;
                for (var key in data.results) {
                    if (p.hasOwnProperty(key)) {

                        var idfound = true;
                        var ld = NVRDataModel.getLogin();
                        if (ld.persistMontageOrder) {
                            idfound = false;
                            for (var ii = 0; ii < $scope.monitors.length; ii++) {
                                if ($scope.monitors[ii].Monitor.Id == key) {
                                    idfound = true;
                                    break;
                                }
                            }
                        }
                        //console.log(NVRDataModel.getMonitorName(key) + " -> " + p[key]);
                        if (idfound)
                        //console.log(NVRDataModel.getMonitorName(key) + " -> " + p[key]);
                            $scope.months.push({
                            monitor: NVRDataModel.getMonitorName(key),
                            events: p[key],
                            mid: key
                        });

                    }
                }
            });

    }

    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.scrollPosition = function () {
        var scrl = parseFloat($ionicScrollDelegate.$getByHandle("mainScroll").getScrollPosition().top);
        var item = Math.round(scrl / eventsListDetailsHeight );
        if ($scope.events == undefined || !$scope.events.length || $scope.events[item] == undefined) {
            return "";
        } else {
            //return prettifyDate($scope.events[item].Event.StartTime);
            return ($scope.events[item].Event.humanizeTime);
        }
        //return Math.random();
    };

    //-------------------------------------------------------------------------
    // called when user switches to background
    //-------------------------------------------------------------------------
    function onPause() {
        NVRDataModel.debug("EventCtrl:onpause called");
        if ($scope.popover) $scope.popover.remove();

    }
    //-------------------------------------------------------------------------
    // Pads the filename with leading 0s, depending on  ZM_IMAGE_DIGITS
    //-------------------------------------------------------------------------
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


    //-------------------------------------------------------------------------
    // FIXME: Are we using this?
    //-------------------------------------------------------------------------
    $scope.disableSlide = function () {
        NVRDataModel.debug("EventCtrl:DisableSlide called");
        $ionicSlideBoxDelegate.$getByHandle("eventSlideBox").enableSlide(false);
    };




    //-------------------------------------------------------------------------
    // This function is called when a user enables or disables
    // scrub view for an event.
    //-------------------------------------------------------------------------

    $scope.toggleGroupScrub = function (event, ndx, frames) {
        $scope.groupType = "scrub";
        toggleGroup(event, ndx, frames, $scope.groupType);
    };

    $scope.toggleGroupAlarms = function (event, ndx, frames) {
        $scope.groupType = "alarms";
        toggleGroup(event, ndx, frames, $scope.groupType);
    };

    function toggleGroup(event, ndx, frames, groupType) {


        // If we are here and there is a record of a previous scroll
        // then we need to scroll back to hide that view
        if (scrollbynumber) {
            $ionicScrollDelegate.$getByHandle("mainScroll").scrollBy(0, -1 * scrollbynumber, true);
            scrollbynumber = 0;
        }

        if (oldEvent && event != oldEvent) {

            NVRDataModel.debug("EventCtrl:Old event scrub will hide now");
            oldEvent.Event.ShowScrub = false;
            oldEvent.Event.height = eventsListDetailsHeight ;
            oldEvent = "";
        }

        event.Event.ShowScrub = !event.Event.ShowScrub;
        // $ionicScrollDelegate.resize();

        //console.log ("GROUP TYPE IS " + groupType);

        if (event.Event.ShowScrub == true) // turn on display now
        {

            if (groupType == 'alarms') {
                $scope.alarm_images = [];
                event.Event.height = (eventsListDetailsHeight + eventsListScrubHeight);
                $ionicScrollDelegate.resize();
                var myurl = loginData.apiurl + '/events/' + event.Event.Id + ".json";
                NVRDataModel.log("API for event details" + myurl);
                $http.get(myurl)
                    .success(function (data) {
                        $scope.FrameArray = data.event.Frame;
                        //  $scope.slider_options.scale=[];

                        //$scope.slider_options.scale = [];

                        var i;
                        var timestamp = null;
                        for (i = 0; i < data.event.Frame.length; i++) {
                            if (data.event.Frame[i].Type == "Alarm") {

                                //console.log ("**ONLY ALARM AT " + i + "of " + data.event.Frame.length);
                                var atype;
                                if (timestamp != data.event.Frame[i].TimeStamp) {

                                    atype = $translate.instant('kShowTimeDiffFrames');
                                } else {
                                    atype = $translate.instant('kShowAllFrames');
                                }
                                $scope.alarm_images.push({
                                    type: atype,
                                    id: data.event.Frame[i].Id,
                                    frameid: data.event.Frame[i].FrameId,
                                    score: data.event.Frame[i].Score,
                                    fname: padToN(data.event.Frame[i].FrameId, eventImageDigits) + "-capture.jpg",
                                    time: data.event.Frame[i].TimeStamp
                                });
                                timestamp = data.event.Frame[i].TimeStamp;
                            }

                        }
                        oldEvent = event;

                        //console.log (JSON.stringify(data));
                    })
                    .error(function (err) {
                        NVRDataModel.log("Error retrieving detailed frame API " + JSON.stringify(err));
                        NVRDataModel.displayBanner('error', ['could not retrieve frame details', 'please try again']);
                    });

            } // end of groupType == alarms
            else // groupType == scrub
            {

                NVRDataModel.debug("EventCtrl: Scrubbing will turn on now");
                $scope.currentEvent = "";
                $scope.event = event;
                //$ionicScrollDelegate.freezeScroll(true);
                $ionicSideMenuDelegate.canDragContent(false);
                $scope.slider_options = {
                    from: 1,
                    to: event.Event.Frames,
                    realtime: true,
                    step: 1,
                    className: "mySliderClass",
                    callback: function (value, released) {
                        //console.log("CALLBACK"+value+released);
                        $ionicScrollDelegate.freezeScroll(!released);
                        //NVRDataModel.debug("EventCtrl: freezeScroll called with " + !released);


                    },
                    //modelLabels:function(val) {return "";},
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

                event.Event.height = (eventsListDetailsHeight + eventsListScrubHeight);
                $ionicScrollDelegate.resize();
                $scope.mycarousel.index = 0;
                $scope.ionRange.index = 1;
                //console.log("**Resetting range");
                $scope.slides = [];
                var i;

                if (event.Event.imageMode == 'path') {
                    NVRDataModel.debug("EventCtrl: found " + frames + " frames to scrub");



                    for (i = 1; i <= frames; i++) {
                        var fname = padToN(i, eventImageDigits) + "-capture.jpg";



                        $scope.slides.push({
                            id: i,
                            img: fname
                        });

                    }
                } else // we need fids
                {
                    var myurl_frames = loginData.apiurl + '/events/' + event.Event.Id + ".json";
                    NVRDataModel.log("API for event details" + myurl_frames);
                    $http.get(myurl_frames)
                        .success(function (data) {
                            $scope.FrameArray = data.event.Frame;
                            //  $scope.slider_options.scale=[];

                            //$scope.slider_options.scale = [];

                            var i;
                            for (i = 0; i < data.event.Frame.length; i++) {


                                //console.log ("**ONLY ALARM AT " + i + "of " + data.event.Frame.length);
                                $scope.slides.push({
                                    id: data.event.Frame[i].Id,
                                    frameid: data.event.Frame[i].FrameId,

                                });


                            }

                            //console.log (JSON.stringify(data));
                        })
                        .error(function (err) {
                            NVRDataModel.log("Error retrieving detailed frame API " + JSON.stringify(err));
                            NVRDataModel.displayBanner('error', [$translate.instant('kErrorFrameBanner'), $translate.instant('kErrorPleaseTryAgain')]);
                        });

                }



                // now get event details to show alarm frames
                loginData = NVRDataModel.getLogin();

                if (typeof event.Event.DefaultVideo === 'undefined')
                    event.Event.DefaultVideo = "";
                // grab video details
                event.Event.video = {};
                var videoURL;

                if (event.Event.imageMode == 'path')
                    videoURL = event.Event.baseURL + "/events/" + event.Event.relativePath + event.Event.DefaultVideo;
                else
                    videoURL = event.Event.baseURL + "/index.php?view=view_video&eid=" + event.Event.Id;

                console.log("************** VIDEO IS " + videoURL);
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


                var myurl2 = loginData.apiurl + '/events/' + event.Event.Id + ".json";
                NVRDataModel.log("API for event details" + myurl2);
                $http.get(myurl2)
                    .success(function (data) {
                        $scope.FrameArray = data.event.Frame;
                        //  $scope.slider_options.scale=[];
                        $scope.slider_options.scale = [];

                        var i;
                        for (i = 0; i < data.event.Frame.length; i++) {
                            if (data.event.Frame[i].Type == "Alarm") {

                                //console.log ("**ALARM AT " + i + "of " + data.event.Frame.length);
                                $scope.slider_options.scale.push({
                                    val: data.event.Frame[i].FrameId,
                                    label: ' '
                                });
                            } else {
                                //$scope.slider_options.scale.push(' ');
                            }

                        }

                        //console.log (JSON.stringify(data));
                    })
                    .error(function (err) {
                        NVRDataModel.log("Error retrieving detailed frame API " + JSON.stringify(err));
                        NVRDataModel.displayBanner('error', [$translate.instant('kErrorFrameBanner'), $translate.instant('kErrorPleaseTryAgain')]);
                    });


                oldEvent = event;
                $rootScope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
                var elem = angular.element(document.getElementById("item-" + ndx));
                var locobject = $ionicPosition.offset(elem);
                //console.log(JSON.stringify(locobject));
                var toplocation = parseInt(locobject.top);
                var objheight = parseInt(locobject.height);
                // console.log("top location is " + toplocation);
                var distdiff = parseInt($rootScope.devHeight) - toplocation - objheight;
                // console.log("*****Space at  bottom is " + distdiff);

                if (distdiff < eventsListScrubHeight) // size of the scroller with bars
                {
                    scrollbynumber = eventsListScrubHeight - distdiff;
                    $ionicScrollDelegate.$getByHandle("mainScroll").scrollBy(0, scrollbynumber, true);

                    // we need to scroll up to make space
                }

            } // end of groupType == scrub 
        } // end of ShowScrub == true
        else {
            // $ionicScrollDelegate.freezeScroll(false);
            $ionicSideMenuDelegate.canDragContent(true);
            event.Event.height = eventsListDetailsHeight;
            $ionicScrollDelegate.resize();

            if (scrollbynumber) {
                $ionicScrollDelegate.$getByHandle("mainScroll").scrollBy(0, -1 * scrollbynumber, true);
                scrollbynumber = 0;
            }
            // we are turning off, so scroll by back
        }

    }

    $scope.closeIfOpen = function (event) {
        if (event != undefined) {
            if (event.Event.ShowScrub)
                toggleGroup(event);

        }
    };

    $scope.isGroupShown = function (event) {
        //  console.log ("IS SHOW INDEX is " + ndx);
        //console.log ("SHOW GROUP IS " + showGroup);

        return (event == undefined) ? false : event.Event.ShowScrub;

    };

    //---------------------------------------------------
    // reload view
    //---------------------------------------------------
    $scope.reloadView = function () {
        // All we really need to do here is change the random token
        // in the image src and it will refresh. No need to reload the view
        // and if you did reload the view, it would go back to events list
        // which is the view - and when you are in the modal it will go away
        //console.log("*** Refreshing Modal view ***");
        //$state.go($state.current, {}, {reload: true});
        $rootScope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
        $ionicLoading.show({
            template: $translate.instant('kRefreshedView'),
            noBackdrop: true,
            duration: 3000
        });

    };

    //---------------------------------------------------
    // when you tap a list entry - to break search loop
    //---------------------------------------------------
    $scope.tapped = function () {
        // console.log("*** TAPPED ****");
        // if he tapped, the we are not infinite loading on ion-infinite
        if (enableLoadMore == false) {
            moreEvents = true;
            enableLoadMore = true;
            // console.log("REMOVING ARTIFICAL LOAD MORE BLOCK");
        }
    };

    $scope.$on('$ionicView.loaded', function () {
        //  console.log("**VIEW ** Events Ctrl Loaded");
    });

    //-------------------------------------------------------------------------
    // Lets make sure we set screen dim properly as we enter
    // The problem is we enter other states before we leave previous states
    // from a callback perspective in ionic, so we really can't predictably
    // reset power state on exit as if it is called after we enter another
    // state, that effectively overwrites current view power management needs
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
        //  console.log("**VIEW ** Events Ctrl Entered");
        NVRDataModel.setAwake(false);

        EventServer.sendMessage('push', {
            type: 'badge',
            badge: 0,
        });

        $ionicPopover.fromTemplateUrl('templates/events-popover.html', {
            scope: $scope,
        }).then(function (popover) {
            $scope.popover = popover;
        });



        //reset badge count
        if (window.cordova && window.cordova.plugins.notification) {
            $cordovaBadge.set(0).then(function () {
                // You have permission, badge set.
            }, function (err) {
                NVRDataModel.debug("app does not have badge permissions. Please check your phone notification settings");
                // You do not have permission.
            });

            $cordovaLocalNotification.clearAll();
        }

    });

    $scope.$on('$ionicView.leave', function () {
        //console.log("**VIEW ** Events Ctrl Left");
    });

    $scope.$on('$ionicView.unloaded', function () {
        //console.log("**VIEW ** Events Ctrl Unloaded");
        //console.log("*** MODAL ** Destroying modal too");
        if ($scope.modal !== undefined) {
            $scope.modal.remove();
        }

    });

    //---------------------------------------------------
    // used to hide loading image toast
    //---------------------------------------------------
    $scope.finishedLoadingImage = function (ndx) {
        //  console.log("*** Events image FINISHED loading index: "+ndx+"***");
        $ionicLoading.hide();
    };

    //---------------------------------------------------
    //
    //---------------------------------------------------
    $scope.clearSearch = function () {
        $scope.search.text = "";
    };

    //---------------------------------------------------
    // Called when user toggles search
    //---------------------------------------------------
    $scope.searchClicked = function () {
        $scope.showSearch = !$scope.showSearch;
        // this helps greatly in repeat scroll gets
        if ($scope.showSearch == false)
            $scope.search.text = "";

        //console.log("**** Setting search view to " + $scope.showSearch + " ****");
        if (enableLoadMore == false && $scope.showSearch == false) {
            moreEvents = true;
            enableLoadMore = true;
            //console.log("REMOVING ARTIFICAL LOAD MORE BLOCK");
        }
    };


    //--------------------------------------------------------
    // utility function
    //--------------------------------------------------------

    function computeRelativePath(event) {
        var relativePath = "";
        var loginData = NVRDataModel.getLogin();
        var str = event.Event.StartTime;
        var yy = moment(str).locale('en').format('YY');
        var mm = moment(str).locale('en').format('MM');
        var dd = moment(str).locale('en').format('DD');
        var hh = moment(str).locale('en').format('HH');
        var min = moment(str).locale('en').format('mm');
        var sec = moment(str).locale('en').format('ss');
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
        var loginData = NVRDataModel.getLogin();
        var str = event.Event.StartTime;
        var yy = moment(str).locale('en').format('YY');
        var mm = moment(str).locale('en').format('MM');
        var dd = moment(str).locale('en').format('DD');
        var hh = moment(str).locale('en').format('HH');
        var min = moment(str).locale('en').format('mm');
        var sec = moment(str).locale('en').format('ss');

        basePath = event.Event.baseURL + "/events/" +
            event.Event.MonitorId + "/" +
            yy + "/" +
            mm + "/" +
            dd + "/" +
            hh + "/" +
            min + "/" +
            sec + "/";
        return basePath;
    }

    $scope.modalGraph = function () {
        $ionicModal.fromTemplateUrl('templates/events-modalgraph.html', {
                scope: $scope, // give ModalCtrl access to this scope
                animation: 'slide-in-up',
                id: 'modalgraph',

            })
            .then(function (modal) {
                $scope.modal = modal;




                $scope.modal.show();

            });
    };

    $scope.analyzeEvent = function (ev) {
        $scope.event = ev;
        $ionicModal.fromTemplateUrl('templates/timeline-modal.html', {
                scope: $scope, // give ModalCtrl access to this scope
                animation: 'slide-in-up',
                id: 'analyze',
            })
            .then(function (modal) {
                $scope.modal = modal;




                $scope.modal.show();

            });
    };

    $scope.$on('modal.removed', function (e, m) {

        if (m.id != 'footage')
            return;
        NVRDataModel.debug("Rebinding watchers of eventCtrl");
        setupWatchers();

        //console.log ("************** FOOTAGE CLOSED");

    });

    //--------------------------------------------------------
    //This is called when we first tap on an event to see
    // the feed. It's important to instantiate ionicModal here
    // as otherwise you'd instantiate it when the view loads
    // and our "Please wait loading" technique I explained
    //earlier won't work
    //--------------------------------------------------------

    $scope.openModal = function (event) {

        NVRDataModel.debug("unbinding eventCtrl watchers as modal has its own");
        ionRangeWatcher();
        mycarouselWatcher();
        //NVRDataModel.debug("EventCtrl: Open Modal with Base path " + relativepath);

        $scope.event = event;

        NVRDataModel.setAwake(NVRDataModel.getKeepAwake());

        $scope.currentEvent = event;
        $scope.followSameMonitor = ($stateParams.id == "0") ? "0" : "1";



        $ionicModal.fromTemplateUrl('templates/events-modal.html', {
                scope: $scope,
                animation: 'slide-in-up',
                id: 'footage',
            })
            .then(function (modal) {
                $scope.modal = modal;

                $ionicLoading.show({
                    template: $translate.instant('kPleaseWait') + "...",
                    noBackdrop: true,
                    duration: 10000
                });

                $scope.modal.show();

                var ld = NVRDataModel.getLogin();



            });

    };

    //--------------------------------------------------------
    //We need to destroy because we are instantiating
    // it on open
    //--------------------------------------------------------
    $scope.closeModal = function () {
        NVRDataModel.debug(">>>EventCtrl:Close & Destroy Modal");
        NVRDataModel.setAwake(false);
        if ($scope.modal !== undefined) {
            $scope.modal.remove();
        }

    };

    //--------------------------------------------------------
    //Cleanup the modal when we're done with it
    // I Don't think it ever comes here
    //--------------------------------------------------------
    $scope.$on('$destroy', function () {
        //console.log("Destroy Modal");
        if ($scope.modal !== undefined) {
            $scope.modal.remove();
        }
        if ($scope.popover !== undefined)
            $scope.popover.remove();
    });

    //--------------------------------------------------------
    // used by infinite scrolling to see if we can get more
    //--------------------------------------------------------

    $scope.moreDataCanBeLoaded = function () {
        return moreEvents;
    };

    //--------------------------------------------------------
    // stop searching for more data
    //--------------------------------------------------------
    $scope.cancelSearch = function () {
        $ionicLoading.hide(); //Or whatever action you want to preform
        enableLoadMore = false;
        //console.log("**** CANCELLED ****");
        $ionicLoading.show({
            template: $translate.instant('kSearchCancelled'),
            animation: 'fade-in',
            showBackdrop: true,
            duration: 2000,
            maxWidth: 200,
            showDelay: 0
        });


    };

    //--------------------------------------------------------
    // loads next page of events
    //--------------------------------------------------------


    function loadMore() {
        // the events API does not return an error for anything
        // except greater page limits than reported

        // console.log("***** LOADING MORE INFINITE SCROLL ****");
        eventsPage--;
        if ((eventsPage <= 0) && (pageLoaded)) {
            moreEvents = false;
            //console.log("*** At Page " + eventsPage + ", not proceeding");
            return;
        }

        if (!enableLoadMore) {
            moreEvents = false; // Don't ion-scroll till enableLoadMore is true;
            $scope.$broadcast('scroll.infiniteScrollComplete');

            // console.log("**** LOADMORE ARTIFICALLY DISABLED");
            return;
        }

        var loadingStr = "";
        if ($scope.search.text != "") {
            var toastStr = $translate.instant('kToastSearchingPage') + eventsPage;
            $ionicLoading.show({
                maxwidth: 100,
                scope: $scope,
                template: '<button class="button button-clear icon-left ion-close-circled button-text-wrap" ng-click="cancelSearch()" >' + toastStr + '</button>'
            });

            loadingStr = "none";
        }

        nolangFrom = "";
        nolangTo = "";
        if ($rootScope.fromString)
            nolangFrom = moment($rootScope.fromString).locale('en').format("YYYY-MM-DD HH:mm:ss");
        if ($rootScope.toString)
            nolangTo = moment($rootScope.toString).locale('en').format("YYYY-MM-DD HH:mm:ss");

        NVRDataModel.getEvents($scope.id, eventsPage, loadingStr, nolangFrom, nolangTo)
            .then(function (data) {
                    var loginData = NVRDataModel.getLogin();
                    // console.log("Got new page of events with Page=" + eventsPage);
                    var myevents = data;

                    for (var i = 0; i < myevents.length; i++) {

                        var idfound = true;
                        var ld = NVRDataModel.getLogin();

                        if (ld.persistMontageOrder) {
                            idfound = false;
                            for (var ii = 0; ii < $scope.monitors.length; ii++) {
                                if ($scope.monitors[ii].Monitor.Id == myevents[i].Event.MonitorId) {

                                    //console.log ( $scope.monitors[ii].Monitor.Id + " MATCHES " + myevents[i].Event.MonitorId);
                                    idfound = true;

                                    break;
                                }
                            }
                        }


                        myevents[i].Event.humanizeTime = humanizeTime(myevents[i].Event.StartTime);
                        myevents[i].Event.MonitorName = NVRDataModel.getMonitorName(myevents[i].Event.MonitorId);
                        // now construct base path

                        myevents[i].Event.streamingURL = NVRDataModel.getStreamingURL(myevents[i].Event.MonitorId);
                        myevents[i].Event.baseURL = NVRDataModel.getBaseURL(myevents[i].Event.MonitorId);
                        myevents[i].Event.imageMode = NVRDataModel.getImageMode(myevents[i].Event.MonitorId);
                        // console.log ("***** MULTISERVER STREAMING URL FOR EVENTS " + myevents[i].Event.streamingURL);

                        //  console.log ("***** MULTISERVER BASE URL FOR EVENTS " + myevents[i].Event.baseURL);

                        myevents[i].Event.ShowScrub = false;
                        myevents[i].Event.BasePath = computeBasePath(myevents[i]);
                        myevents[i].Event.relativePath = computeRelativePath(myevents[i]);
                        myevents[i].Event.height = eventsListDetailsHeight;
                        if (idfound) $scope.events.push(myevents[i]);
                    }

                    //console.log("Got new page of events");
                    moreEvents = true;
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                },

                function (error) {
                    // console.log("*** No More Events to Load, Stop Infinite Scroll ****");
                    moreEvents = false;
                    $scope.$broadcast('scroll.infiniteScrollComplete');

                });
    }

    $scope.loadMore = function () {
        loadMore();

    };

    $scope.toggleMinAlarmFrameCount = function () {


        var ld = NVRDataModel.getLogin();

        console.log("Toggling " + ld.enableAlarmCount);
        ld.enableAlarmCount = !ld.enableAlarmCount;
        NVRDataModel.setLogin(ld);
        $scope.loginData = NVRDataModel.getLogin();
        doRefresh();
    };


    //--------------------------------------
    // formats events dates in a nice way
    //---------------------------------------


    function humanizeTime(str) {
        //console.log ("Time:"+str+" TO LOCAL " + moment(str).local().toString());
            return moment.tz(str, NVRDataModel.getTimeZoneNow()).fromNow();
    }

    $scope.prettifyDate = function (str) {
        if (NVRDataModel.getLogin().useLocalTimeZone)
            return moment.tz(str, NVRDataModel.getTimeZoneNow()).tz(moment.tz.guess()).format('MMM Do');
        else
            return moment(str).format('MMM Do');      
    };

    function prettifyDate(str) {
        if (NVRDataModel.getLogin().useLocalTimeZone)
            return moment.tz(str, NVRDataModel.getTimeZoneNow()).tz(moment.tz.guess()).format('MMM Do');
        else
            return moment(str).format('MMM Do');
    }

    $scope.prettifyTime = function (str) {
        if (NVRDataModel.getLogin().useLocalTimeZone)
            return moment.tz(str, NVRDataModel.getTimeZoneNow()).tz(moment.tz.guess()).format(NVRDataModel.getTimeFormat());
        else    
            return moment(str).format(NVRDataModel.getTimeFormat());
    };

    $scope.prettifyTimeSec = function (str) {
        if (NVRDataModel.getLogin().useLocalTimeZone)
            return moment.tz(str, NVRDataModel.getTimeZoneNow()).tz(moment.tz.guess()).format(NVRDataModel.getTimeFormatSec());
        else
            return moment(str).format(NVRDataModel.getTimeFormatSec());
    };


    $scope.prettify = function (str) {
        if (NVRDataModel.getLogin().useLocalTimeZone)
            return moment.tz(str, NVRDataModel.getTimeZoneNow()).tz(moment.tz.guess()).format(NVRDataModel.getTimeFormat() + ', MMMM Do YYYY');
        else    
            return moment(str).format(NVRDataModel.getTimeFormat() + ', MMMM Do YYYY');
    };
    //--------------------------------------------------------
    // For consistency we are keeping the refresher list
    // but its a dummy. The reason I deviated is because
    // refresh with infinite scroll is a UX problem - its
    // easy to pull to refresh when scrolling up with
    // a large list
    //--------------------------------------------------------

    $scope.dummyDoRefresh = function () {
        $scope.$broadcast('scroll.refreshComplete');
    };


    $scope.doRefresh = function () {
        doRefresh();
    }; //dorefresh

    function doRefresh() {
        // console.log("***Pull to Refresh");

        NVRDataModel.debug("Reloading monitors");
        var refresh = NVRDataModel.getMonitors(1);
        refresh.then(function (data) {

            var ld = NVRDataModel.getLogin();
            if (ld.persistMontageOrder) {
                var tempMon = data;
                $scope.monitors = NVRDataModel.applyMontageMonitorPrefs(tempMon, 2)[0];
            } else {
                $scope.monitors = data;
            }


            getInitialEvents();
            moreEvents = true;

        });
    }

}]);