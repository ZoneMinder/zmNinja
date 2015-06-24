/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

// This is the controller for Event view. StateParams is if I recall the monitor ID.
// This was before I got access to the new APIs. FIXME: Revisit this code to see what I am doing with it
// and whether the new API has a better mechanism

angular.module('zmApp.controllers').controller('zmApp.EventCtrl', ['$ionicPlatform', '$scope', '$stateParams', 'message', 'ZMDataModel', '$ionicSideMenuDelegate', '$ionicModal', '$ionicLoading', '$http', '$state', '$window', '$interval', function ($ionicPlatform, $scope, $stateParams, message, ZMDataModel, $ionicSideMenuDelegate, $ionicModal, $ionicLoading, $http, $state, $window, $rootScope,$interval) {

    //---------------------------------------------------
    // Controller main
    //---------------------------------------------------

    console.log("I got STATE PARAM " + $stateParams.id);
    $scope.id = parseInt($stateParams.id, 10);
    $scope.connKey = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;


    // These are the commands ZM uses to move around
    // in ZMS
    var eventCommands = {
        next: "13",
        previous: "12",
        zoomin: "8",
        zoomout: "9",
        stop: "3",
        pause: "1",
        play: "2"
    };

    $scope.showSearch = false;
    var eventsPage = 1;
    var moreEvents = true;
    $scope.viewTitle = {
        title: ""
    };
    $scope.search = {text:""};
    $scope.myfilter="";
    $scope.eventCommands = eventCommands;


    // for some reason inifinite scroll is invoked
    // before I actually load the first page with page count
    // this makes scrolling stop as eventsPage is still 0
    // FIXME: This is a hack

    var pageLoaded = false;


    // FIXME: Hack or elegance?
    // to get rid of  full stack event get on search

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
    // FIXME: clean up error handling

    // FIXME: call loadMore once -- to fill up page. Its possible
    // last event page only has a few records

    ZMDataModel.getEventsPages($scope.id)
        .then(function (data) {
            eventsPage = data.pageCount;
            console.log("TOTAL EVENT PAGES IS " + eventsPage);
            pageLoaded = true;
            $scope.viewTitle.title = data.count;
            ZMDataModel.getEvents($scope.id, eventsPage,"")

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



    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

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
        $scope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
        $ionicLoading.show({
            template: "refreshed view",
            noBackdrop: true,
            duration: 3000
        });

    };

    //---------------------------------------------------
    // when you tap a list entry - to break search loop
    //---------------------------------------------------
    $scope.tapped = function()
    {
        console.log ("*** TAPPED ****");
        // if he tapped, the we are not infinite loading on ion-infinite
        if (  enableLoadMore == false )
        {
            moreEvents=true;
            enableLoadMore = true;
            console.log ("REMOVING ARTIFICAL LOAD MORE BLOCK");
        }
    };

    $scope.$on('$ionicView.loaded', function () {
        console.log("**VIEW ** Events Ctrl Loaded");
    });

    $scope.$on('$ionicView.enter', function () {
        console.log("**VIEW ** Events Ctrl Entered");
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
    $scope.clearSearch = function()
    {
        $scope.search.text="";
    };

    //---------------------------------------------------
    // Called when user toggles search
    //---------------------------------------------------
    $scope.searchClicked = function()
    {
        $scope.showSearch = !$scope.showSearch;
        // this helps greatly in repeat scroll gets
        if ($scope.showSearch == false)
                    $scope.search.text="";

        console.log ("**** Setting search view to "+$scope.showSearch+" ****");
        if (  enableLoadMore == false && $scope.showSearch == false)
        {
            moreEvents=true;
            enableLoadMore = true;
            console.log ("REMOVING ARTIFICAL LOAD MORE BLOCK");
        }
    };

    //--------------------------------------------------------
    // Not used - plan to use it to show event progress
    //--------------------------------------------------------
    this.pollEventsProgress = function()
    {
        console.log ("**************");
    };

    //--------------------------------------------------------
    // this routine handles skipping through events
    // in different event views
    //--------------------------------------------------------
    $scope.controlEventStream = function (cmd)
    {
        console.log("Command value " + cmd);

        $ionicLoading.hide();
        $ionicLoading.show({
            template: "please wait...",
            noBackdrop: true,
            duration: 15000,
        });

        var loginData = ZMDataModel.getLogin();
        // FIXME: CMD_SLOWFWD CMD_FASTFWD and REVs
        // Also read up CMD_QUERY as the stream is playing
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
            break;
        case "12":
            toast_blurb = "moving to ";
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
        }


        // You need to POST commands to control zms
        // Note that I am url encoding the parameters into the URL
        // If I leave it as JSON, it gets converted to OPTONS due
        // to CORS behaviour and ZM/Apache don't seem to handle it

        console.log("POST: " + loginData.url + '/index.php');

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
                console.log("****RETURNING " + foo);
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
            console.log(str);
           // $ionicLoading.hide();
            $ionicLoading.show({
                template: str,
                noBackdrop: true,
                duration: 2000
            });
        });

        req.error(function (resp) {
            console.log("ERROR: " + JSON.stringify(resp));
        });
    };

    //--------------------------------------------------------
    //This is called when we first tap on an event to see
    // the feed. It's important to instantiate ionicModal here
    // as otherwise you'd instantiate it when the view loads
    // and our "Please wait loading" technique I explained
    //earlier won't work
    //--------------------------------------------------------

    $scope.openModal = function (eid, ename, edur,eframes) {
        console.log("Open Modal");
        $scope.eventName = ename;
        $scope.eventId = eid;
        $scope.eventDur = Math.round(edur);
        $scope.loginData = ZMDataModel.getLogin();
        $scope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;

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

            });

           };

    //--------------------------------------------------------
    //We need to destroy because we are instantiating
    // it on open
    //--------------------------------------------------------
    $scope.closeModal = function () {
       // $interval.cancel(eventsInterval);
        console.log("Close & Destroy Modal");
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
     $scope.cancelSearch = function()
        {
            $ionicLoading.hide(); //Or whatever action you want to preform
            enableLoadMore = false;
            console.log ("**** CANCELLED ****");
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
    $scope.loadMore = function () {

        // the events API does not return an error for anything
        // except greater page limits than reported

        console.log("***** LOADING MORE INFINITE SCROLL ****");
        eventsPage--;
        if ((eventsPage <= 0) && (pageLoaded)) {
            moreEvents = false;
            console.log("*** At Page " + eventsPage + ", not proceeding");
            return;
        }

       if (!enableLoadMore)
       {
           moreEvents=false; // Don't ion-scroll till enableLoadMore is true;
           $scope.$broadcast('scroll.infiniteScrollComplete');

           console.log ("**** LOADMORE ARTIFICALLY DISABLED");
           return;
       }

        var loadingStr="";
        if ($scope.search.text != "")
        {
            var toastStr="Searching page "+eventsPage;
            $ionicLoading.show({ maxwidth:100, scope:$scope,
                                template: '<button class="button button-clear icon-left ion-close-circled button-text-wrap" ng-click="cancelSearch()" >'+toastStr+'</button>' });

            loadingStr="none";
        }
        ZMDataModel.getEvents($scope.id, eventsPage,loadingStr)
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
    };

    //--------------------------------------------------------
    // For consistency we are keeping the refresher list
    // but its a dummy. The reason I deviated is because
    // refresh with infinite scroll is a UX problem - its
    // easy to pull to refresh when scrolling up with
    // a large list
    //--------------------------------------------------------

    $scope.dummyDoRefresh= function()
    {
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
                ZMDataModel.getEvents($scope.id, eventsPage,"")

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

}]);
