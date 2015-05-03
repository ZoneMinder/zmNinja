// This is the controller for Event view. StateParams is if I recall the monitor ID.
// This was before I got access to the new APIs. FIXME: Revisit this code to see what I am doing with it
// and whether the new API has a better mechanism

angular.module('zmApp.controllers').controller('zmApp.EventCtrl', function ($ionicPlatform, $scope, $stateParams, message, ZMDataModel, $ionicSideMenuDelegate, $ionicModal, $ionicLoading, $http, $state, $window) {
    console.log("I got STATE PARAM " + $stateParams.id);
    $scope.id = parseInt($stateParams.id, 10);
    $scope.connKey = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;

    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    }

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

    }

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
        $scope.modal.remove();

    });


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
    }

    var eventsPage = 1;
    var moreEvents = true;

    // When loading images, it sometimes takes time -  the images can be quite
    // large. What practically was happening was you'd see a blank screen for a few
    // seconds. Not a good UX. So what I am doing is when the events modal or
    // monitor modal is loaded, I show an ionic loading. And then when the first frame
    // finishes loading, I take it away

    $scope.finishedLoadingImage = function () {
        console.log("*** Events image FINISHED loading ***");
        $ionicLoading.hide();
    }

    $scope.eventCommands = eventCommands;

    // this routine handles skipping through events
    // in different event views
    $scope.controlEventStream = function (cmd) {
        console.log("Command value " + cmd);

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
        };

        console.log("** POST URL " + loginData.url + 'zm/index.php');
        // You need to POST commands to control zms
        // Note that I am url encoding the parameters into the URL
        // If I leave it as JSON, it gets converted to OPTONS due
        // to CORS behaviour and ZM/Apache don't seem to handle it

        var req = $http({
            method: 'POST',
            /*timeout: 15000,*/
            url: loginData.url + '/zm/index.php',
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
            $ionicLoading.hide();
            $ionicLoading.show({
                template: str,
                noBackdrop: true,
                duration: 2000
            });
        });

        req.error(function (resp) {
            console.log("ERROR: " + JSON.stringify(resp));
        });
    }

    // This is called when we first tap on an event to see
    // the feed. It's important to instantiate ionicModal here
    // as otherwise you'd instantiate it when the view loads
    // and our "Please wait loading" technique I explained
    //earlier won't work

    $scope.openModal = function (eid, ename, edur) {
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
                })
                $scope.modal.show();

            })
    }

    // We need to destroy because we are instantiating
    // it on open
    $scope.closeModal = function () {
        console.log("Close & Destroy Modal");
        $scope.modal.remove();

    };
    //Cleanup the modal when we're done with it
    // I Don't think it ever comes here
    $scope.$on('$destroy', function () {
        console.log("Destroy Modal");
        $scope.modal.remove();
    });

    console.log("***CALLING EVENTS FACTORY");
    var lData = ZMDataModel.getLogin();
    $scope.monitors = message;

    // I am converting monitor ID to monitor Name
    // so I can display it along with Events
    // Is there a better way?
    console.log("Calling --> EventsPage = " + eventsPage);
    //$scope.events =
    $scope.events = [];
    ZMDataModel.getEvents($scope.id, eventsPage)
        .then(function (data) {
            console.log("EventCtrl Got events");
            //var events = [];
            var myevents = data;
            for (var i = 0; i < myevents.length; i++) {

                myevents[i].Event.MonitorName = ZMDataModel.getMonitorName(myevents[i].Event.MonitorId);
            }


            $scope.events = myevents;
        });

    $scope.moreDataCanBeLoaded = function () {
        return moreEvents;
    }

    $scope.loadMore = function () {
        console.log("***** LOADING MORE INFINITE SCROLL ****");
        eventsPage++;
        $scope.$broadcast('scroll.infiniteScrollComplete');
        ZMDataModel.getEvents($scope.id, eventsPage)
            .then(function (data) {
                    console.log("Got new page of events");
                    var myevents = data;
                    for (var i = 0; i < myevents.length; i++) {

                        myevents[i].Event.MonitorName = ZMDataModel.getMonitorName(myevents[i].Event.MonitorId);
                    }
                    $scope.events = $scope.events.concat(myevents);
                },

                function (error) {
                    console.log("*** No More Events to Load, Stop Infinite Scroll ****");
                    moreEvents = false;

                });

    }

    $scope.isSimulated = function () {
        return ZMDataModel.isSimulated();
    };


    $scope.doRefresh = function () {
        console.log("***Pull to Refresh");
        $scope.events = [];
        $scope.events = ZMDataModel.getEvents($scope.id, 1)
            .then(function (data) {
                console.log("EventCtrl Got events");
                //var events = [];
                var myevents = data;
                for (var i = 0; i < myevents.length; i++) {

                    myevents[i].Event.MonitorName = ZMDataModel.getMonitorName(myevents[i].Event.MonitorId);
                }

                moreEvents = true;
                $scope.events = myevents;
                $scope.$broadcast('scroll.refreshComplete');
            });
    }; //dorefresh

});
