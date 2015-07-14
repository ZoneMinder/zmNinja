/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,moment */

// This is the controller for Event view. StateParams is if I recall the monitor ID.
// This was before I got access to the new APIs. FIXME: Revisit this code to see what I am doing with it
// and whether the new API has a better mechanism

angular.module('zmApp.controllers').controller('zmApp.EventCtrl', ['$scope', '$rootScope', 'ZMDataModel', 'message', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$ionicPlatform', function ($scope, $rootScope, ZMDataModel, message, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate) {


    //---------------------------------------------------
    // Controller main
    //---------------------------------------------------


    var segmentHandle = 0; // holds timer for progress bar
    $scope.totalEventTime = 0; // used to display max of progress bar
    $scope.currentEventTime = 0;
    $scope.imageStyle=true;



    document.addEventListener("pause", onPause, false);
    console.log("I got STATE PARAM " + $stateParams.id);
    $scope.id = parseInt($stateParams.id, 10);
    $scope.connKey = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
    //var segmentHandle = 0;


    // These are the commands ZM uses to move around
    // in ZMS
    var eventCommands = {
        next: "13",
        previous: "12",
        zoomin: "8",
        zoomout: "9",
        stop: "3",
        pause: "1",
        play: "2",
        fastFwd: "4",
        slowFwd: "5",
        fastRev: "7",
        slowRev: "6"
    };

    $scope.showSearch = false;
    var eventsPage = 1;
    var moreEvents = true;
    $scope.viewTitle = {
        title: ""
    };
    $scope.search = {
        text: ""
    };
    $scope.myfilter = "";
    $scope.eventCommands = eventCommands;


    // for some reason inifinite scroll is invoked
    // before I actually load the first page with page count
    // this makes scrolling stop as eventsPage is still 0
    // FIXME: This is a hack

    var pageLoaded = false;
    var enableLoadMore = true;

    // When loading images, it sometimes takes time -  the images can be quite
    // large. What practically was happening was you'd see a blank screen for a few
    // seconds. Not a good UX. So what I am doing is when the events modal or
    // monitor modal is loaded, I show an ionic loading. And then when the first frame
    // finishes loading, I take it away

    console.log("***CALLING EVENTS FACTORY");
    var lData = ZMDataModel.getLogin();
    $scope.monitors = message;

    // I am converting monitor ID to monitor Name
    // so I can display it along with Events
    // Is there a better way?

    $scope.events = [];

    // First get total pages and then
    // start from the latest. If this fails, nothing displays

    ZMDataModel.getEventsPages($scope.id)
        .then(function (data) {
            eventsPage = data.pageCount;
            console.log("TOTAL EVENT PAGES IS " + eventsPage);
            pageLoaded = true;
            $scope.viewTitle.title = data.count;
            ZMDataModel.getEvents($scope.id, eventsPage, "")

            .then(function (data) {
                console.log("EventCtrl Got events");
                //var events = [];
                var myevents = data;
                for (var i = 0; i < myevents.length; i++) {

                    myevents[i].Event.MonitorName = ZMDataModel.getMonitorName(myevents[i].Event.MonitorId);
                }


                $scope.events = myevents;
                // to avoid only few events being displayed
                // if last page has less events
                console.log ("**Loading Next Page ***");
                loadMore();
            });

        });

    // not explictly handling error --> I have a default "No events found" message
    // displayed in the template if events list is null


    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };


    function onPause() {
        console.log("*** Moving to Background ***"); // Handle the pause event
        console.log("*** CANCELLING INTERVAL ****");
        $interval.cancel(segmentHandle);
        // FIXME: Do I need to  setAwake(false) here?
    }

    //---------------------------------------------------
    // reload view
    //---------------------------------------------------
    $scope.reloadView = function () {
        // All we really need to do here is change the random token
        // in the image src and it will refresh. No need to reload the view
        // and if you did reload the view, it would go back to events list
        // which is the view - and when you are in the modal it will go away
        console.log("*** Refreshing Modal view ***");
        //$state.go($state.current, {}, {reload: true});
        $rootScope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
        $ionicLoading.show({
            template: "refreshed view",
            noBackdrop: true,
            duration: 3000
        });

    };

    //---------------------------------------------------
    // when you tap a list entry - to break search loop
    //---------------------------------------------------
    $scope.tapped = function () {
        console.log("*** TAPPED ****");
        // if he tapped, the we are not infinite loading on ion-infinite
        if (enableLoadMore == false) {
            moreEvents = true;
            enableLoadMore = true;
            console.log("REMOVING ARTIFICAL LOAD MORE BLOCK");
        }
    };

    $scope.$on('$ionicView.loaded', function () {
        console.log("**VIEW ** Events Ctrl Loaded");
    });

    //-------------------------------------------------------------------------
    // Lets make sure we set screen dim properly as we enter
    // The problem is we enter other states before we leave previous states
    // from a callback perspective in ionic, so we really can't predictably
    // reset power state on exit as if it is called after we enter another
    // state, that effectively overwrites current view power management needs
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
        console.log("**VIEW ** Events Ctrl Entered");
        ZMDataModel.setAwake(false);
    });

    $scope.$on('$ionicView.leave', function () {
        console.log("**VIEW ** Events Ctrl Left");
    });

    $scope.$on('$ionicView.unloaded', function () {
        console.log("**VIEW ** Events Ctrl Unloaded");
        console.log("*** MODAL ** Destroying modal too");
        if ($scope.modal !== undefined) {
            $scope.modal.remove();
        }

    });

    //---------------------------------------------------
    // used to hide loading image toast
    //---------------------------------------------------
    $scope.finishedLoadingImage = function () {
        console.log("*** Events image FINISHED loading ***");
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

        console.log("**** Setting search view to " + $scope.showSearch + " ****");
        if (enableLoadMore == false && $scope.showSearch == false) {
            moreEvents = true;
            enableLoadMore = true;
            console.log("REMOVING ARTIFICAL LOAD MORE BLOCK");
        }
    };

    //--------------------------------------------------------
    // Not used - plan to use it to show event progress
    //--------------------------------------------------------
    function segmentCheck() {
        if ($scope.totalEventTime == 0) {

            console.log("No events to play");
            return;
        }
        if ($scope.currentEventTime >= $scope.totalEventTime) {
            console.log("Total event duration reached");
            $scope.currentEventTime = $scope.totalEventTime;
            return;
        }

        // false == don't show ionic loadings, a query is a background job
        controlEventStream("99", false);
        //console.log("Duration: " + $scope.currentEventTime + " of " + $scope.totalEventTime);


        // ./skins/classic/views/event.php panelSection
    }

    //--------------------------------------------------------
    // this routine handles skipping through events
    // in different event views
    //--------------------------------------------------------

    function controlEventStream(cmd, disp) {
        // console.log("Command value " + cmd);

        if (disp) {
            $ionicLoading.hide();
            $ionicLoading.show({
                template: "please wait...",
                noBackdrop: true,
                duration: 15000,
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
        var CMD_QUERY = 99;
        */
        var toast_blurb = "";
        switch (cmd) {
            case "13":
                toast_blurb = "moving to ";
                $scope.totalEventTime = 0;


                break;
            case "12":
                toast_blurb = "moving to ";
                $scope.totalEventTime = 0;
                break;
            case "8":
                toast_blurb = "zoomed into ";
                break;
            case "9":
                toast_blurb = "zoomed out of ";
                break;
            case "3":
                toast_blurb = "stopping playback for ";

                break;
            case "2":
                toast_blurb = "resuming playback for ";

                break;
            case "1":
                toast_blurb = "pausing playback for ";

                break;
            case "4":
                toast_blurb = "fast forward ";

                break;
            case "5":
                toast_blurb = "slow forward ";
                break;
            case "6":
                toast_blurb = "slow rewind ";
                break;
            case "7":
                toast_blurb = "fast rewind ";
                break;
        }


        // You need to POST commands to control zms
        // Note that I am url encoding the parameters into the URL
        // If I leave it as JSON, it gets converted to OPTONS due
        // to CORS behaviour and ZM/Apache don't seem to handle it

        //console.log("POST: " + loginData.url + '/index.php');

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
                // console.log("****RETURNING " + foo);
                return foo;
            },

            data: {
                view: "request",
                request: "stream",
                connkey: $scope.connKey,
                command: cmd,
                user: loginData.username,
                pass: loginData.password
            }
        });
        req.success(function (resp) {

            console.log("SUCCESS: " + JSON.stringify(resp));
            var str = toast_blurb + "event:" + resp.status.event;
            // console.log(str);
            // $ionicLoading.hide();

            if (disp == true) {
                $ionicLoading.show({
                    template: str,
                    noBackdrop: true,
                    duration: 2000
                });
            }

            // 99 is CMD_QUERY its a convenient way to know where I am in the event playback
            // takes care of speed etc so I don't have to worry about it
            if (cmd == '99') {
                $scope.currentEventTime = Math.round(parseFloat(resp.status.progress));
            }

            if (cmd == '12' || cmd == '13') {
                console.log("New event, so recomputing");
                var newevent = resp.status.event;
                console.log("**** EXTRACTED EVENT ****" + newevent);
                var ld = ZMDataModel.getLogin();
                var myurl = ld.apiurl + "/events/" + newevent + ".json";
                $http.get(myurl)
                    .success(function (data) {
                        $scope.totalEventTime = Math.round(parseFloat(data.event.Event.Length)) - 1;
                        $scope.currentEventTime = 0;



                    })
                    .error(function (err) {
                        console.log("Error : " + JSON.stringify(err));
                        ZMDataModel.zmLog("Error getting timing info for new event " + newevent + ":" + JSON.stringify(err));
                        $scope.totalEventTime = 0;

                    });
            }

        });

        req.error(function (resp) {
            console.log("ERROR: " + JSON.stringify(resp));
            ZMDataModel.zmLog("Error sending event command " + JSON.stringify(resp), "error");
        });
    }


    $scope.controlEventStream = function (cmd) {
        controlEventStream(cmd, true);
    };

    //--------------------------------------------------------
    //This is called when we first tap on an event to see
    // the feed. It's important to instantiate ionicModal here
    // as otherwise you'd instantiate it when the view loads
    // and our "Please wait loading" technique I explained
    //earlier won't work
    //--------------------------------------------------------

    $scope.openModal = function (eid, ename, edur, eframes) {
        console.log("Open Modal");
        $scope.eventName = ename;
        $scope.eventId = eid;
        $scope.eventDur = Math.round(edur);
        $scope.loginData = ZMDataModel.getLogin();
        $rootScope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;

        $scope.totalEventTime = Math.round(parseFloat(edur)) - 1;
        $scope.currentEventTime = 0;

        ZMDataModel.setAwake(ZMDataModel.getKeepAwake());

        $ionicModal.fromTemplateUrl('templates/events-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            })
            .then(function (modal) {
                $scope.modal = modal;

                $ionicLoading.show({
                    template: "please wait...",
                    noBackdrop: true,
                    duration: 10000
                });

                $scope.modal.show();

                var ld = ZMDataModel.getLogin();

                // how many seconds this event will take
                //evtSegments = eframes / ld.maxFPS + 3;
                //evtCurSegment = 0;
                // console.log ("**** I SET SEGMENTS TO " + evtSegments);

                // call on progress indicator every 5 seconds
                // don't want to overload
                segmentHandle = $interval(function () {
                    segmentCheck();
                }, 5000);
                segmentCheck();


            });

    };

    //--------------------------------------------------------
    //We need to destroy because we are instantiating
    // it on open
    //--------------------------------------------------------
    $scope.closeModal = function () {
        // $interval.cancel(eventsInterval);
        $interval.cancel(segmentHandle);
        console.log("Close & Destroy Modal");
        ZMDataModel.setAwake(false);
        if ($scope.modal !== undefined) {
            $scope.modal.remove();
        }

    };

    //--------------------------------------------------------
    //Cleanup the modal when we're done with it
    // I Don't think it ever comes here
    //--------------------------------------------------------
    $scope.$on('$destroy', function () {
        console.log("Destroy Modal");
        if ($scope.modal !== undefined) {
            $scope.modal.remove();
        }
        $interval.cancel(segmentHandle);
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
        console.log("**** CANCELLED ****");
        $ionicLoading.show({
            template: 'Search Cancelled',
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


    function loadMore()
    {
               // the events API does not return an error for anything
        // except greater page limits than reported

        console.log("***** LOADING MORE INFINITE SCROLL ****");
        eventsPage--;
        if ((eventsPage <= 0) && (pageLoaded)) {
            moreEvents = false;
            console.log("*** At Page " + eventsPage + ", not proceeding");
            return;
        }

        if (!enableLoadMore) {
            moreEvents = false; // Don't ion-scroll till enableLoadMore is true;
            $scope.$broadcast('scroll.infiniteScrollComplete');

            console.log("**** LOADMORE ARTIFICALLY DISABLED");
            return;
        }

        var loadingStr = "";
        if ($scope.search.text != "") {
            var toastStr = "Searching page " + eventsPage;
            $ionicLoading.show({
                maxwidth: 100,
                scope: $scope,
                template: '<button class="button button-clear icon-left ion-close-circled button-text-wrap" ng-click="cancelSearch()" >' + toastStr + '</button>'
            });

            loadingStr = "none";
        }
        ZMDataModel.getEvents($scope.id, eventsPage, loadingStr)
            .then(function (data) {
                    console.log("Got new page of events with Page=" + eventsPage);
                    var myevents = data;
                    for (var i = 0; i < myevents.length; i++) {

                        myevents[i].Event.MonitorName = ZMDataModel.getMonitorName(myevents[i].Event.MonitorId);
                    }
                    $scope.events = $scope.events.concat(myevents);
                    console.log("Got new page of events");
                    moreEvents = true;
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                },

                function (error) {
                    console.log("*** No More Events to Load, Stop Infinite Scroll ****");
                    moreEvents = false;
                    $scope.$broadcast('scroll.infiniteScrollComplete');

                });
    }

    $scope.loadMore = function () {
        loadMore();

    };

    //--------------------------------------
    // formats events dates in a nice way
    //---------------------------------------

    $scope.prettify = function (str) {
        return moment(str).format('h:mm:ssa on MMMM Do YYYY');
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
        console.log("***Pull to Refresh");
        $scope.events = [];
        moreEvents = true;
        ZMDataModel.getEventsPages($scope.id)
            .then(function (data) {
                eventsPage = data.pageCount;
                console.log("TOTAL EVENT PAGES IS " + eventsPage);
                pageLoaded = true;
                $scope.viewTitle.title = data.count;
                ZMDataModel.getEvents($scope.id, eventsPage, "")

                .then(function (data) {
                    console.log("EventCtrl Got events");
                    //var events = [];
                    var myevents = data;
                    for (var i = 0; i < myevents.length; i++) {

                        myevents[i].Event.MonitorName = ZMDataModel.getMonitorName(myevents[i].Event.MonitorId);
                    }
                    $scope.events = myevents;
                });

            });
    }; //dorefresh

        $scope.scaleImage = function() {
       console.log ("Switching image style");
        $scope.imageStyle = !$scope.imageStyle;

    };

}]);
