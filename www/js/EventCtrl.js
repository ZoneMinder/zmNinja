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


    // This is a modal to show the event footage


    var eventCommands = {
        next: "13",
        previous: "12",
        zoomin: "8",
        zoomout: "9",
        stop: "3",
        pause: "1",
        play: "2"
    }

    


    $scope.finishedLoadingImage = function()
    {
        console.log ("*** Events image FINISHED loading ***");
         $ionicLoading.hide();
       // alert ("IMAGE LOADED");
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
                duration: 10000,
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

        console.log ("** POST URL " +loginData.url+ 'zm/index.php');
        var req = $http({
            method: 'POST',
            timeout: 10000,
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
                duration:10000
        })
             $scope.modal.show();

        })
    }


    $scope.closeModal = function () {
        console.log("Close & Destroy Modal");
        $scope.modal.remove();

    };
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function () {
        console.log("Destroy Modal");
        $scope.modal.remove();
    });

    console.log("***CALLING EVENTS FACTORY");
    var lData = ZMDataModel.getLogin();
    console.log("ZM Service Username = " + lData.username);
    $scope.monitors = message;
    $scope.events = ZMDataModel.getEvents($scope.id)
        .then(function (data) {
            console.log("EventCtrl Got events");
            //var events = [];
            var myevents = data;
            for (var i = 0; i < myevents.length; i++) {

                myevents[i].Event.MonitorName = ZMDataModel.getMonitorName(myevents[i].Event.MonitorId);
            }


            $scope.events = myevents;
        });

    $scope.isSimulated = function () {
        return ZMDataModel.isSimulated();
    };


    $scope.doRefresh = function () {
        console.log("***Pull to Refresh");
        $scope.events = [];
        $scope.events = ZMDataModel.getEvents($scope.id)
            .then(function (data) {
                console.log("EventCtrl Got events");
                //var events = [];
                var myevents = data;
                for (var i = 0; i < myevents.length; i++) {

                    myevents[i].Event.MonitorName = ZMDataModel.getMonitorName(myevents[i].Event.MonitorId);
                }


                $scope.events = myevents;
                $scope.$broadcast('scroll.refreshComplete');
            });
    }; //dorefresh

});
