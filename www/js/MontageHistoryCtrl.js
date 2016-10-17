// Controller for the montage view
/* jshint -W041, -W093, -W083 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,ionic,Masonry,moment,Packery, Draggabilly, imagesLoaded, Chart */
// FIXME: This is a copy of montageCtrl - needs a lot of code cleanup
angular.module('zmApp.controllers').controller('zmApp.MontageHistoryCtrl', ['$scope', '$rootScope', 'NVRDataModel', 'message', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$ionicPopup', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$ionicPlatform', 'zm', '$ionicPopover', '$controller', 'imageLoadingDataShare', '$window', '$translate', 'qHttp', '$q', function ($scope, $rootScope, NVRDataModel, message, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $ionicPopup, $stateParams, $ionicHistory, $ionicScrollDelegate, $ionicPlatform, zm, $ionicPopover, $controller, imageLoadingDataShare, $window, $translate, qHttp, $q) {
    //--------------------------------------------------------------------------------------
    // Handles bandwidth change, if required
    //
    //--------------------------------------------------------------------------------------
    $rootScope.$on("bandwidth-change", function (e, data) {
        // nothing to do for now
        // eventUrl will use lower BW in next query cycle
    });
    //--------------------------------------
    // formats events dates in a nice way
    //---------------------------------------
    $scope.prettifyDateTimeFirst = function (str) {
        return moment(str).format(NVRDataModel.getTimeFormat() + '/MMM Do');
    };
    $scope.prettifyDate = function (str) {
        return moment(str).format('MMM Do, YYYY ' + NVRDataModel.getTimeFormat());
    };

    function prettifyDate(str) {
        return moment(str).format('MMM Do');
    }
    $scope.prettifyTime = function (str) {
        return moment(str).format('h:mm a');
    };
    $scope.prettify = function (str) {
        return moment(str).format(NVRDataModel.getTimeFormat() + ' on MMMM Do YYYY');
    };
    $scope.humanizeTime = function (str) {
        return moment(str).fromNow();
    };
    // if you change date in footer, change hrs
    $scope.dateChanged = function () {
        $scope.datetimeValueFrom.hrs = Math.round(moment.duration(moment().diff(moment($scope.datetimeValueFrom.value))).asHours());
    };
    // if you change hrs in footer, change date 
    $scope.hrsChanged = function () {
        $scope.datetimeValueFrom.value = moment().subtract($scope.datetimeValueFrom.hrs, 'hours').toDate();
        timefrom.toDate();
    };

    function orientationChanged() {
        NVRDataModel.debug("Detected orientation change, redoing packery resize");
        $timeout(function () {
            pckry.onresize();
        });
    }
    //--------------------------------------
    // pause/unpause nph-zms
    //---------------------------------------
    $scope.togglePause = function (mid) {
        //console.log ("TOGGLE PAUSE " + mid);
        var m = -1;
        for (var i = 0; i < $scope.MontageMonitors.length; i++) {
            if ($scope.MontageMonitors[i].Monitor.Id == mid) {
                m = i;
                break;
            }
        }
        if (m != -1) {

            $scope.MontageMonitors[m].Monitor.isPaused = !$scope.MontageMonitors[m].Monitor.isPaused;
            var cmd = 1;
            NVRDataModel.debug("Sending CMD:" + cmd + " for monitor " + $scope.MontageMonitors[m].Monitor.Name);
            controlEventStream(cmd, "", $scope.MontageMonitors[m].Monitor.connKey, -1);
        }
    };

    function sendCmd(mid, cmd, extra) {



        var m = -1;
        for (var i = 0; i < $scope.MontageMonitors.length; i++) {
            if ($scope.MontageMonitors[i].Monitor.Id == mid) {
                m = i;
                break;
            }
        }
        if (m != -1) {
            NVRDataModel.debug("Sending CMD:" + cmd + " for monitor " + $scope.MontageMonitors[m].Monitor.Name);
            return controlEventStream(cmd, "", $scope.MontageMonitors[m].Monitor.connKey, -1, extra);
        }

    }
    $scope.seek = function (mid, p) {
        NVRDataModel.debug("Slider called with mid=" + mid + " progress=" + p);

        var m = -1;
        for (var i = 0; i < $scope.MontageMonitors.length; i++) {
            if ($scope.MontageMonitors[i].Monitor.Id == mid) {
                m = i;
                break;
            }
        }
        if (m != -1) {
            $scope.MontageMonitors[i].Monitor.seek = true;
        }


        sendCmd(mid, '14', "&offset=" + p)
            .then(function (success) {
                    //console.log ("Removing seek status from "  + $scope.MontageMonitors[i].Monitor.Name);
                    $scope.MontageMonitors[i].Monitor.seek = false;

                },
                function (err) {
                    //console.log ("Removing seek status from "  + $scope.MontageMonitors[i].Monitor.Name);
                    $scope.MontageMonitors[i].Monitor.seek = false;
                });

    };
    $scope.moveFaster = function (mid) {
        sendCmd(mid, 4);
    };
    $scope.moveSlower = function (mid) {
        sendCmd(mid, 5);
    };
    $scope.movePlay = function (mid) {

        var m = -1;
        for (var i = 0; i < $scope.MontageMonitors.length; i++) {
            if ($scope.MontageMonitors[i].Monitor.Id == mid) {
                m = i;
                break;
            }
        }
        if (m != -1) {
            $scope.MontageMonitors[m].Monitor.isPaused = false;
            var cmd = 2;
            NVRDataModel.debug("Sending CMD:" + cmd + " for monitor " + $scope.MontageMonitors[m].Monitor.Name);
            controlEventStream(cmd, "", $scope.MontageMonitors[m].Monitor.connKey, -1);
        }
    };
    //--------------------------------------
    // Called when ion-footer collapses
    // note that on init it is also called
    //---------------------------------------
    $scope.footerExpand = function () {
        // console.log ("**************** EXPAND CALLED ***************");
        $ionicSideMenuDelegate.canDragContent(false);
    };
    $scope.footerCollapse = function () {
        footerCollapse();
    };
    /* Note this is also called when the view is first loaded */
    function footerCollapse() {
        if (readyToRun == false) {
            NVRDataModel.debug("fake call to footerCollapse - ignoring");
            return;
        }
        
        if ($scope.MontageMonitors == undefined)
        {
            NVRDataModel.debug("montage array is undefined and not ready");
            return;
        }

        $interval.cancel($rootScope.eventQueryInterval);
        $ionicLoading.show({
            template: $translate.instant('kPleaseWait'),
            noBackdrop: true,
            duration: zm.httpTimeout
        });

        $scope.dragBorder = "";
        $scope.isDragabillyOn = false;
        $ionicSideMenuDelegate.canDragContent(false);
        NVRDataModel.stopNetwork("MontageHistory-footerCollapse");
        var ld = NVRDataModel.getLogin();
        $scope.sliderVal.realRate = $scope.sliderVal.rate * 100;
        var TimeObjectFrom = moment($scope.datetimeValueFrom.value).format("YYYY-MM-DD HH:mm");
        var TimeObjectTo = moment().format('YYYY-MM-DD HH:mm');
        var apiurl;

        // release all active streams
        for (var i = 0; i < $scope.MontageMonitors.length; i++) {
            $scope.MontageMonitors[i].Monitor.selectStyle = "";
            $scope.MontageMonitors[i].Monitor.eid = "-1";
            // generate new connKeys if timeline changes
            if ($scope.MontageMonitors[i].Monitor.eventUrl != 'img/noevent.png') {
                // this means this mid was showing a message, now we need to change it
                // so kill prev. stream first
                NVRDataModel.log("footerCollapse: Calling kill with " + $scope.MontageMonitors[i].Monitor.connKey + " for Monitor:" + $scope.MontageMonitors[i].Monitor.Name);
                //var tmpCK = angular.copy($scope.MontageMonitors[i].Monitor.connKey);
                //timedControlEventStream(2500, 17, "", tmpCK, -1);
                controlEventStream(17, "", $scope.MontageMonitors[i].Monitor.connKey, -1);
                $scope.MontageMonitors[i].Monitor.eventUrl = "img/noevent.png";
                $scope.MontageMonitors[i].Monitor.eid = "-1";
                $scope.MontageMonitors[i].Monitor.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
                $scope.MontageMonitors[i].Monitor.noGraph = true;
                //console.log ("Generating connkey: " +$scope.MontageMonitors[i].Monitor.connKey);
            }
        }
        // grab events that start on or after the time 
        apiurl = ld.apiurl + "/events/index/StartTime >=:" + TimeObjectFrom + "/AlarmFrames >=:" + (ld.enableAlarmCount ? ld.minAlarmCount : 0) + ".json";
        NVRDataModel.log("Event timeline API is " + apiurl);
        // make sure there are no more than 5 active streams (noevent is ok)
        $scope.currentLimit = $scope.monLimit;
        //qHttp.get(apiurl)
        $http({
            method: 'get',
            url: apiurl
        }).then(function (succ) {
            var data = succ.data;
            var ld = NVRDataModel.getLogin();
            NVRDataModel.debug("Got " + data.events.length + "new history events...");
            var eid, mid, stime;
            for (i = 0; i < data.events.length; i++) {
                mid = data.events[i].Event.MonitorId;
                eid = data.events[i].Event.Id;
                stime = data.events[i].Event.StartTime;
                // only take the first one for each monitor
                for (var j = 0; j < $scope.MontageMonitors.length; j++) {
                    $scope.MontageMonitors[j].Monitor.isPaused = false;
                    // that's the earliest match and play gapless from there
                    if ($scope.MontageMonitors[j].Monitor.Id == mid) {
                        if ($scope.MontageMonitors[j].Monitor.eventUrl == 'img/noevent.png') {
                            // console.log ("Old value of event url " + $scope.MontageMonitors[j].eventUrl);
                            //console.log ("ldurl is " + ld.streamingurl);
                            var bw = NVRDataModel.getBandwidth() == "lowbw" ? zm.eventMontageQualityLowBW : ld.montageHistoryQuality;
                            $scope.MontageMonitors[j].Monitor.eventUrl = ld.streamingurl + "/nph-zms?source=event&mode=jpeg&event=" + eid + "&frame=1&replay=gapless&rate=" + $scope.sliderVal.realRate + "&connkey=" + $scope.MontageMonitors[j].Monitor.connKey + "&scale=" + bw + "&rand=" + $rootScope.rand;
                            //console.log ("Setting event URL to " +$scope.MontageMonitors[j].Monitor.eventUrl);
                            //   console.log ("SWITCHING TO " + $scope.MontageMonitors[j].eventUrl);
                            $scope.MontageMonitors[j].Monitor.eventUrlTime = stime;
                            $scope.MontageMonitors[j].Monitor.eid = eid;
                            $scope.MontageMonitors[j].Monitor.eventDuration = data.events[i].Event.Length;
                            $scope.MontageMonitors[j].Monitor.sliderProgress = {
                                progress: 0
                            };
                            //console.log(">>> Setting Event for " + $scope.MontageMonitors[j].Monitor.Name + " to " + eid);
                            // now lets get the API for that event for graphing
                            $scope.MontageMonitors[j].Monitor.noGraph = true;


                        }
                    }
                }
            }
            // make sure we do our best to get that duration for all monitors
            // in the above call, is possible some did not make the cut in the first page
            NVRDataModel.log("Making sure all monitors have a fair chance...");
            var promises = [];
            for (i = 0; i < $scope.MontageMonitors.length; i++) {
                //console.log("Fair chance check for " + $scope.MontageMonitors[i].Monitor.Name);
                if ($scope.MontageMonitors[i].Monitor.eventUrl == 'img/noevent.png') {
                    var indivGrab = ld.apiurl + "/events/index/MonitorId:" + $scope.MontageMonitors[i].Monitor.Id + "/StartTime >=:" + TimeObjectFrom + "/AlarmFrames >=:" + (ld.enableAlarmCount ? ld.minAlarmCount : 0) + ".json";
                    NVRDataModel.debug("Monitor " + $scope.MontageMonitors[i].Monitor.Id + ":" + $scope.MontageMonitors[i].Monitor.Name + " does not have events, trying " + indivGrab);
                    var p = getExpandedEvents(i, indivGrab);
                    promises.push(p);

                }

            }
            $q.all(promises).then(doPackery);

            // At this stage, we have both a general events grab, and specific event grabs for MIDS that were empty

            function doPackery() {
                // $ionicLoading.hide();
                //console.log("REDOING PACKERY & DRAG");
                NVRDataModel.debug("Re-creating packery and draggy");
                if (pckry !== undefined) {
                    // remove current draggies
                    draggies.forEach(function (drag) {
                        drag.destroy();
                    });
                    draggies = [];
                    // destroy existing packery object
                    pckry.destroy();
                    initPackery();

                    $rootScope.eventQueryInterval = $interval(function () {
                        checkAllEvents();
                    }.bind(this), zm.eventHistoryTimer);
                }
            }
        }, function (err) {
            NVRDataModel.debug("history  ERROR:" + JSON.stringify(err));
        });

        function getExpandedEvents(i, indivGrab) {
            var d = $q.defer();
            var ld = NVRDataModel.getLogin();
            // console.log ("Expanded API: " + indivGrab);
            $http({
                method: 'get',
                url: indivGrab
            }).then(function (succ) {
                    var data = succ.data;
                    // console.log ("EXPANDED DATA FOR MONITOR " + i + JSON.stringify(data));
                    if (data.events.length > 0) {
                        if (!NVRDataModel.isBackground()) {
                            var bw = NVRDataModel.getBandwidth() == "lowbw" ? zm.eventMontageQualityLowBW : ld.montageHistoryQuality;
                            $scope.MontageMonitors[i].Monitor.eventUrl = ld.streamingurl + "/nph-zms?source=event&mode=jpeg&event=" + data.events[0].Event.Id + "&frame=1&replay=gapless&rate=" + $scope.sliderVal.realRate + "&connkey=" + $scope.MontageMonitors[i].Monitor.connKey + "&scale=" + bw + "&rand=" + $rootScope.rand;
                            //console.log ("SWITCHING TO " + $scope.MontageMonitors[i].eventUrl);
                            $scope.MontageMonitors[i].Monitor.eventUrlTime = data.events[0].Event.StartTime;
                            $scope.MontageMonitors[i].Monitor.eid = data.events[0].Event.Id;
                            $scope.MontageMonitors[i].Monitor.noGraph = true;
                            $scope.MontageMonitors[i].Monitor.sliderProgress = {
                                progress: 0
                            };
                            $scope.MontageMonitors[i].Monitor.eventDuration = data.events[0].Event.Length;
                            //console.log(">>> Setting Event for " + $scope.MontageMonitors[i].Monitor.Name + " to " + data.events[0].Event.Id);
                            NVRDataModel.log("Found expanded event " + data.events[0].Event.Id + " for monitor " + $scope.MontageMonitors[i].Monitor.Id);
                        } else {
                            // $scope.MontageMonitors[i].eventUrl="img/noevent.png";
                            //    $scope.MontageMonitors[i].eventUrlTime = "";
                            //    NVRDataModel.log ("Setting img src to null as data received in background");
                        }
                    }
                    d.resolve(true);
                    return d.promise;
                },
                function (err) {
                    d.resolve(true);
                    return d.promise;
                }

            );
            return d.promise;
        }
    }
    //---------------------------------------------------------
    // This is periodically called to get the current playing 
    // event by zms. I use this to display a timestamp
    // Its a 2 step process - get event Id then go a Event
    // API call to get time stamp. Sucks
    //---------------------------------------------------------
    function checkAllEvents() {
        //console.log("Timer:Events are checked....");

        if (pckry && !$scope.isDragabillyOn) pckry.shiftLayout();

        for (var i = 0; i < $scope.MontageMonitors.length; i++) {
            // don't check for monitors that are not shown
            // because nph connkey won't exist and the response
            // will fail
            if ($scope.MontageMonitors[i].Monitor.eventUrl != "" && $scope.MontageMonitors[i].Monitor.eventUrl != 'img/noevent.png' && $scope.MontageMonitors[i].Monitor.connKey != '' && $scope.MontageMonitors[i].Monitor.Function != 'None' && $scope.MontageMonitors[i].Monitor.listDisplay != 'noshow' && $scope.MontageMonitors[i].Monitor.Enabled != '0') {
                // NVRDataModel.debug("Checking event status for " + $scope.MontageMonitors[i].Monitor.Name + ":" + $scope.MontageMonitors[i].Monitor.eventUrl + ":" + $scope.MontageMonitors[i].Monitor.Function + ":" + $scope.MontageMonitors[i].Monitor.listDisplay);
                // console.log ("Sending query 99 for " + $scope.MontageMonitors[i].Monitor.Name + " with ck="+$scope.MontageMonitors[i].Monitor.connKey);
                controlEventStream('99', '', $scope.MontageMonitors[i].Monitor.connKey, i);
            }
        }
    }
    //--------------------------------------------------------------
    //  Used to control zms for a connkey. If ndx is not -1,
    // then it also calls an event API for the returned eid
    // and stores its time in the montage monitors array
    //--------------------------------------------------------------
    $scope.controlEventStream = function (cmd, disp, connkey, ndx) {
        controlEventStream(cmd, disp, connkey, ndx);
    };

    function timedControlEventStream(mTime, cmd, disp, connkey, ndx) {
        var mMtime = mTime || 2000;
        NVRDataModel.debug("Deferring control " + cmd + " by " + mMtime);
        $timeout(function () {
            subControlStream(cmd, connkey);
        }, mMtime);
    }

    function subControlStream(cmd, connkey) {
        var loginData = NVRDataModel.getLogin();
        var myauthtoken = $rootScope.authSession.replace("&auth=", "");
        //&auth=
        var req = qHttp({
            method: 'POST',
            /*timeout: 15000,*/
            url: loginData.url + '/index.php',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', //'Accept': '*/*',
            },
            transformRequest: function (obj) {
                var str = [];
                for (var p in obj) str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                var foo = str.join("&");
                //console.log("****SUB RETURNING " + foo);
                return foo;
            },
            data: {
                view: "request",
                request: "stream",
                connkey: connkey,
                command: cmd,
                auth: myauthtoken, // user: loginData.username,
                // pass: loginData.password
            }
        });
        req.then(function (succ) {
            NVRDataModel.debug("subControl success:" + JSON.stringify(succ));
        }, function (err) {
            NVRDataModel.debug("subControl error:" + JSON.stringify(err));
        });
    }

    function controlEventStream(cmd, disp, connkey, ndx, extras) {
        // console.log("Command value " + cmd);

        var d = $q.defer();
        if (disp) {
            $ionicLoading.hide();
            $ionicLoading.show({
                template: $translate.instant('kPleaseWait') + "...",
                noBackdrop: true,
                duration: zm.loadingTimeout,
            });
        }
        var loginData = NVRDataModel.getLogin();
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
        // You need to POST commands to control zms
        // Note that I am url encoding the parameters into the URL
        // If I leave it as JSON, it gets converted to OPTONS due
        // to CORS behaviour and ZM/Apache don't seem to handle it
        //console.log("POST: " + loginData.url + '/index.php');
        //console.log ("AUTH IS " + $rootScope.authSession);
        var myauthtoken = $rootScope.authSession.replace("&auth=", "");
        //&auth=
        var req = qHttp({
            method: 'POST',
            /*timeout: 15000,*/
            url: loginData.url + '/index.php',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', //'Accept': '*/*',
            },
            transformRequest: function (obj) {
                var str = [];
                for (var p in obj) str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                var foo = str.join("&");
                if (extras) foo = foo + extras;
                //console.log("****RETURNING " + foo);
                return foo;
            },
            data: {
                view: "request",
                request: "stream",
                connkey: connkey,
                command: cmd,
                auth: myauthtoken, // user: loginData.username,
                // pass: loginData.password
            }
        });
        req.then(function (succ) {
            var resp = succ.data;

            //console.log ("zms response: " + JSON.stringify(resp));

            // move progress bar if event id is the same
            if (resp.result == "Ok" && ndx != -1 && (resp.status.event == $scope.MontageMonitors[ndx].Monitor.eid)) {
                if (!$scope.MontageMonitors[ndx].Monitor.seek) {
                    $scope.MontageMonitors[ndx].Monitor.sliderProgress.progress = resp.status.progress;
                } else {
                    NVRDataModel.debug("Skipping progress as seek is active for " + $scope.MontageMonitors[ndx].Monitor.Name);
                }
            }

            if (resp.result == "Ok" && ndx != -1 && ((resp.status.event != $scope.MontageMonitors[ndx].Monitor.eid) || $scope.MontageMonitors[ndx].Monitor.noGraph == true)) {
                $scope.MontageMonitors[ndx].Monitor.noGraph = false;
                // $scope.MontageMonitors[ndx].Monitor.sliderProgress.progress = 0;
                NVRDataModel.debug("Fetching details, as event changed for " + $scope.MontageMonitors[ndx].Monitor.Name + " from " + $scope.MontageMonitors[ndx].Monitor.eid + " to " + resp.status.event);
                var ld = NVRDataModel.getLogin();
                var apiurl = ld.apiurl + "/events/" + resp.status.event + ".json";
                //console.log ("API " + apiurl);
                qHttp({
                    method: 'get',
                    url: apiurl
                }).then(function (succ) {
                    var data = succ.data;
                    var currentEventTime = moment(data.event.Event.StartTime);
                    var maxTime = moment();
                    //NVRDataModel.debug ("Monitor: " + $scope.MontageMonitors[ndx].Monitor.Id + " max time="+maxTime + "("+$scope.datetimeValueTo.value+")"+ " current="+currentEventTime + "("+data.event.Event.StartTime+")");

                    NVRDataModel.debug("creating graph for " + $scope.MontageMonitors[ndx].Monitor.Name);
                    var framearray = {
                        labels: [],
                        datasets: [{
                            backgroundColor: 'rgba(242, 12, 12, 0.5)',
                            borderColor: 'rgba(242, 12, 12, 0.5)',
                            data: [],
                            }]
                    };
                    framearray.labels = [];
                    var ld = NVRDataModel.getLogin();
                    //console.log(">>>>> GRAPH");
                    for (i = 0; i < data.event.Frame.length; i++) {
                        var ts = moment(data.event.Frame[i].TimeStamp).format(timeFormat);
                        //console.log ("pushing s:" + event.Frame[i].Score+" t:"+ts);
                        framearray.datasets[0].data.push({
                            x: ts,
                            y: data.event.Frame[i].Score
                        });
                        framearray.labels.push("");
                    }
                    $timeout(function () {
                        drawGraph(framearray, $scope.MontageMonitors[ndx].Monitor.Id);
                    }, 100);
                    var element = angular.element(document.getElementById($scope.MontageMonitors[ndx].Monitor.Id + "-timeline"));
                    element.removeClass('animated flipInX');
                    element.addClass('animated flipOutX');
                    $timeout(function () {
                        element.removeClass('animated flipOutX');
                        element.addClass('animated flipInX');
                        $scope.MontageMonitors[ndx].Monitor.eventUrlTime = data.event.Event.StartTime;
                        var bw = NVRDataModel.getBandwidth() == "lowbw" ? zm.eventMontageQualityLowBW : ld.montageHistoryQuality;
                        $scope.MontageMonitors[ndx].Monitor.eventUrl = ld.streamingurl + "/nph-zms?source=event&mode=jpeg&event=" + data.event.Event.Id + "&frame=1&replay=gapless&rate=" + $scope.sliderVal.realRate + "&connkey=" + $scope.MontageMonitors[ndx].Monitor.connKey + "&scale=" + bw + "&rand=" + $rootScope.rand;
                        $scope.MontageMonitors[ndx].Monitor.eid = data.event.Event.Id;
                        $scope.MontageMonitors[ndx].Monitor.sliderProgress = {
                            progress: 0
                        };
                        $scope.MontageMonitors[ndx].Monitor.eventDuration = data.event.Event.Length;
                        //console.log(">>> Setting Event for " + $scope.MontageMonitors[ndx].Monitor.Name + " to " + data.event.Event.Id);
                    }, 700);


                }, function (err) {
                    NVRDataModel.debug("skipping graph as detailed API failed for " + $scope.MontageMonitors[ndx].Monitor.Name);
                    $scope.MontageMonitors[ndx].Monitor.eventUrlTime = "-";
                });
            }
            d.resolve(true);
            return d.promise;
        }, function (err) {
            d.reject(false);
            NVRDataModel.log("Error sending event command " + JSON.stringify(err), "error");
            return d.promise;
        });
        return d.promise;
    }
    $scope.isBackground = function () {
        return NVRDataModel.isBackground();
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
                "playEvent": false
            }, {
                reload: true
            });
        }
    };
    $scope.handleAlarmsWhileMinimized = function () {
        $rootScope.isAlarm = !$rootScope.isAlarm;
        $scope.minimal = !$scope.minimal;
        NVRDataModel.debug("MontageHistoryCtrl: switch minimal is " + $scope.minimal);
        ionic.Platform.fullScreen($scope.minimal, !$scope.minimal);
        $interval.cancel(intervalHandle);
        $interval.cancel($rootScope.eventQueryInterval);
        if (!$rootScope.isAlarm) {
            $rootScope.alarmCount = "0";
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go("events", {
                "id": 0,
                "playEvent": false,
            }, {
                reload: true
            });
        }
    };
    //-------------------------------------------------------------
    // this is checked to make sure we are not pulling images
    // when app is in background. This is a problem with Android,
    // for example
    //-------------------------------------------------------------
    $scope.isBackground = function () {
        //console.log ("Is background called from Montage and returned " +    
        //NVRDataModel.isBackground());
        return NVRDataModel.isBackground();
    };
    $scope.toggleControls = function () {
        $scope.showControls = !$scope.showControls;
    };
    $scope.toggleSelectItem = function (ndx) {
        if ($scope.MontageMonitors[ndx].Monitor.selectStyle !== "undefined" && $scope.MontageMonitors[ndx].Monitor.selectStyle == "dragborder-selected") {
            $scope.MontageMonitors[ndx].Monitor.selectStyle = "";
        } else {
            $scope.MontageMonitors[ndx].Monitor.selectStyle = "dragborder-selected";
        }
        //console.log ("Switched value to " + $scope.MontageMonitors[ndx].Monitor.selectStyle);
    };
    //---------------------------------------------------------------------
    // Called when you enable/disable dragging
    //---------------------------------------------------------------------
    $scope.dragToggle = function () {
        dragToggle();
    };

    function dragToggle() {
        var i;
        $scope.isDragabillyOn = !$scope.isDragabillyOn;
        $ionicSideMenuDelegate.canDragContent($scope.isDragabillyOn ? false : true);
        //$timeout(function(){pckry.reloadItems();},10);
        NVRDataModel.debug("setting dragabilly to " + $scope.isDragabillyOn);
        if ($scope.isDragabillyOn) {
            $scope.showSizeButtons = true;
            $scope.dragBorder = "dragborder";
            NVRDataModel.debug("Enabling drag for " + draggies.length + " items");
            for (i = 0; i < draggies.length; i++) {
                draggies[i].enable();
                draggies[i].bindHandles();
            }
            // reflow and reload as some may be hidden
            //  $timeout(function(){pckry.reloadItems();$timeout(function(){pckry.layout();},300);},100);
        } else {
            $scope.dragBorder = "";
            NVRDataModel.debug("Disabling drag for " + draggies.length + " items");
            for (i = 0; i < draggies.length; i++) {
                draggies[i].disable();
                draggies[i].unbindHandles();
            }
            for (i = 0; i < $scope.MontageMonitors.length; i++) {
                $scope.MontageMonitors[i].Monitor.selectStyle = "";
            }
            // reflow and reload as some may be hidden
            $timeout(function () {
                $timeout(function () {
                    pckry.shiftLayout();
                    /*var positions = pckry.getShiftPositions('data-item-id');
                    //console.log ("POSITIONS MAP " + JSON.stringify(positions));
                    var ld = NVRDataModel.getLogin();
                    ld.packeryPositions = JSON.stringify(positions);
                    NVRDataModel.setLogin(ld);*/
                }, 300);
            }, 100);
        }
    }
    //---------------------------------------------------------------------
    // Show/Hide PTZ control in monitor view
    //---------------------------------------------------------------------
    $scope.togglePTZ = function () {
        $scope.showPTZ = !$scope.showPTZ;
    };
    $scope.callback = function () {
        // console.log("dragging");
    };
    $scope.onDropComplete = function (index, obj, event) {
        //console.log("dragged");
        var otherObj = $scope.MontageMonitors[index];
        var otherIndex = $scope.MontageMonitors.indexOf(obj);
        $scope.MontageMonitors[index] = obj;
        $scope.MontageMonitors[otherIndex] = otherObj;
    };
    //---------------------------------------------------------------------
    // changes order of montage display
    //---------------------------------------------------------------------
    $scope.toggleMontageDisplayOrder = function () {
        $scope.packMontage = !$scope.packMontage;
        loginData.packMontage = $scope.packMontage;
        NVRDataModel.setLogin(loginData);
        //console.log ("Switching orientation");
    };
    //---------------------------------------------------------------------
    // In Android, the app runs full steam while in background mode
    // while in iOS it gets suspended unless you ask for specific resources
    // So while this view, we DON'T want Android to keep sending 1 second
    // refreshes to the server for images we are not seeing
    //---------------------------------------------------------------------
    function onPause() {
        NVRDataModel.debug("MontageHistoryCtrl: onpause called");
        $interval.cancel($rootScope.eventQueryInterval);
        $interval.cancel(intervalHandle);
        // $interval.cancel(modalIntervalHandle);
        // FIXME: Do I need to  setAwake(false) here?
    }

    function onResume() {}
    $scope.openMenu = function () {
        $timeout(function () {
            $rootScope.stateofSlide = $ionicSideMenuDelegate.isOpen();
        }, 500);
        $ionicSideMenuDelegate.toggleLeft();
    };
    $scope.$on('$destroy', function () {
        NVRDataModel.debug("Cancelling eventQueryInterval");
        $interval.cancel($rootScope.eventQueryInterval);
    });
    $scope.$on('$ionicView.loaded', function () {
        //console.log("**VIEW ** MontageHistoryCtrl Loaded");
    });
    $scope.$on('$ionicView.enter', function () {
        NVRDataModel.debug("**VIEW ** MontageHistory Ctrl Entered");
        var ld = NVRDataModel.getLogin();
        //console.log("Setting Awake to " + NVRDataModel.getKeepAwake());
        NVRDataModel.setAwake(NVRDataModel.getKeepAwake());
        NVRDataModel.debug("query timer started");
        $interval.cancel($rootScope.eventQueryInterval);
        //console.log ("****************** TIMER STARTED INSIDE ENTER");
        $rootScope.eventQueryInterval = $interval(function () {
            checkAllEvents();
        }.bind(this), zm.eventHistoryTimer);
    });
    /*$scope.$on ('$ionicView.unloaded', function() {
        console.log ("******** HISTORY UNLOADED KILLING WINDOW ************");
        window.stop();
    });*/
    $scope.$on('$ionicView.beforeEnter', function () {
        //  NVRDataModel.log ("Before Enter History: initing connkeys");
    });
    $scope.$on('$ionicView.beforeLeave', function () {
        //console.log("**VIEW ** Event History Ctrl Left, force removing modal");
        if ($scope.modal) $scope.modal.remove();
        NVRDataModel.log("BeforeLeave: Nullifying the streams...");
        for (i = 0; i < $scope.MontageMonitors.length; i++) {
            var element = document.getElementById("img-" + i);
            /*if (element)
            {
                NVRDataModel.debug("BeforeLeave: Nullifying  " + element.src);
                element.src="";
                //element.removeAttribute('src');
                
                //$scope.$apply(nullify(element));
                //element.src="";
            }*/
        }
        NVRDataModel.log("Cancelling event query timer");
        $interval.cancel($rootScope.eventQueryInterval);
        NVRDataModel.log("MontageHistory:Stopping network pull...");
        // make sure this is applied in scope digest to stop network pull
        // thats why we are doing it beforeLeave
        for (i = 0; i < $scope.MontageMonitors.length; i++) {
            if ($scope.MontageMonitors[i].Monitor.connKey != '' && $scope.MontageMonitors[i].Monitor.eventUrl != 'img/noevent.png' && $scope.MontageMonitors[i].Monitor.Function != 'None' && $scope.MontageMonitors[i].Monitor.lisDisplay != 'noshow' && $scope.MontageMonitors[i].Monitor.Enabled != '0') {
                NVRDataModel.log("Before leave: Calling kill with " + $scope.MontageMonitors[i].Monitor.connKey);
                var tmpCK = angular.copy($scope.MontageMonitors[i].Monitor.connKey);
                timedControlEventStream(2500, 17, "", tmpCK, -1);
            }
        }
        pckry.destroy();
        window.removeEventListener("resize", orientationChanged, false);
        NVRDataModel.log("Forcing a window.stop() here");
        NVRDataModel.stopNetwork("MontageHistory-beforeLeave");
    });
    $scope.$on('$ionicView.unloaded', function () {});
    $scope.sliderChanged = function (dirn) {
        //console.log("SLIDER CHANGED");
        if ($scope.sliderChanging) {
            // console.log ("too fast my friend");
            //$scope.slider.monsize = oldSliderVal;
            // return;
        }
        $scope.sliderChanging = true;
        var somethingReset = false;
        // this only changes items that are selected
        for (var i = 0; i < $scope.MontageMonitors.length; i++) {
            var curVal = parseInt($scope.MontageMonitors[i].Monitor.gridScale);
            curVal = curVal + (10 * dirn);
            if (curVal < 10) curVal = 10;
            if (curVal > 100) curVal = 100;
            //console.log ("For Index: " + i + " From: " + $scope.MontageMonitors[i].Monitor.gridScale + " To: " + curVal);
            if ($scope.isDragabillyOn) {
                // only do this for selected monitors
                if ($scope.MontageMonitors[i].Monitor.selectStyle == "dragborder-selected") {
                    $scope.MontageMonitors[i].Monitor.gridScale = curVal;
                    somethingReset = true;
                }
            } else {
                $scope.MontageMonitors[i].Monitor.gridScale = curVal;
                //somethingReset = true;
            }
        }
        // this changes all items if none were selected
        if (!somethingReset && $scope.isDragabillyOn) // nothing was selected
        {
            for (i = 0; i < $scope.MontageMonitors.length; i++) {
                var cv = parseInt($scope.MontageMonitors[i].Monitor.gridScale);
                cv = cv + (10 * dirn);
                if (cv < 10) cv = 10;
                if (cv > 100) cv = 100;
                $scope.MontageMonitors[i].Monitor.gridScale = cv;
            }
        }
        //pckry.reloadItems();
        pckry.once('layoutComplete', function () {
            /* $timeout(function () {
                 var positions = pckry.EHgetShiftPositions('eh-data-item-id');
                 //console.log ("POSITIONS MAP " + JSON.stringify(positions));
                 var ld = NVRDataModel.getLogin();
                 ld.EHpackeryPositions = JSON.stringify(positions);
                 NVRDataModel.setLogin(ld);
                 $ionicLoading.hide();
                 $scope.sliderChanging = false;
             }, zm.packeryTimer);*/
        });
        if (!somethingReset) {
            //console.log (">>>SOMETHING NOT RESET");
            $timeout(function () {
                pckry.layout();
            }, zm.packeryTimer);
        } else {
            //console.log (">>>SOMETHING  RESET");
            $timeout(function () {
                layout(pckry);
            }, zm.packeryTimer);
        }
    };

    function layout(pckry) {
        pckry.shiftLayout();
    }
    $scope.resetSizes = function () {
        var somethingReset = false;
        for (var i = 0; i < $scope.MontageMonitors.length; i++) {
            if ($scope.isDragabillyOn) {
                if ($scope.MontageMonitors[i].Monitor.selectStyle == "dragborder-selected") {
                    $scope.MontageMonitors[i].Monitor.gridScale = "50";
                    somethingReset = true;
                }
            } else {
                $scope.MontageMonitors[i].Monitor.gridScale = "50";
                // somethingReset = true;
            }
        }
        if (!somethingReset && $scope.isDragabillyOn) // nothing was selected
        {
            for (i = 0; i < $scope.MontageMonitors.length; i++) {
                $scope.MontageMonitors[i].Monitor.gridScale = "50";
            }
        }
        $timeout(function () {
            pckry.reloadItems();
            $timeout(function () {
                pckry.layout();
            }, zm.packeryTimer); // force here - no shiftlayout
        }, 100);
    };

    function isEmpty(obj) {
        for (var prop in obj) {
            return false;
        }
        return true;
    }
    // called by afterEnter to load Packery
    function initPackery() {
        $ionicLoading.show({
            template: $translate.instant('kArrangingImages'),
            noBackdrop: true,
            duration: zm.loadingTimeout
        });
        var progressCalled = false;
        draggies = [];
        var layouttype = true;
        var ld = NVRDataModel.getLogin();

        var elem = angular.element(document.getElementById("mygrid"));
        //console.log ("**** mygrid is " + JSON.stringify(elem));
        imagesLoaded(elem).on('progress', function (instance, img) {
            progressCalled = true;
            // if (layouttype) $timeout (function(){layout(pckry);},100);
        });
        imagesLoaded(elem).once('always', function () {
            //console.log("******** ALL IMAGES LOADED");
            $scope.$digest();
            NVRDataModel.debug("All images loaded");
            $ionicLoading.hide();

            layouttype = true;
            pckry = new Packery('.grid', {
                itemSelector: '.grid-item',
                percentPosition: true,
                columnWidth: '.grid-sizer',
                gutter: 0,
                initLayout: layouttype

            });
            pckry.reloadItems();
            if (!progressCalled) {
                NVRDataModel.log("***  PROGRESS WAS NOT CALLED");

            }


            $timeout(function () {

                pckry.getItemElements().forEach(function (itemElem) {
                    draggie = new Draggabilly(itemElem);
                    pckry.bindDraggabillyEvents(draggie);
                    draggies.push(draggie);
                    draggie.disable();
                    draggie.unbindHandles();
                });

                pckry.on('dragItemPositioned', itemDragged);



                /*if (!isEmpty(positions)) {
                    NVRDataModel.log("Arranging as per packery grid");

                    for (var i = 0; i < $scope.MontageMonitors.length; i++) {
                        for (var j = 0; j < positions.length; j++) {
                            if ($scope.MontageMonitors[i].Monitor.Id == positions[j].attr) {
                                $scope.MontageMonitors[i].Monitor.gridScale = positions[j].size;
                                $scope.MontageMonitors[i].Monitor.listDisplay = positions[j].display;
                                NVRDataModel.debug("Setting monitor ID: " + $scope.MontageMonitors[i].Monitor.Id + " to size: " + positions[j].size + " and display:" + positions[j].display);
                            }
                            //console.log ("Index:"+positions[j].attr+ " with size: " + positions[j].size);
                        }
                    }


                    NVRDataModel.debug("All images loaded, doing image layout");
                    $timeout(function () {
                        pckry.initShiftLayout(positions, 'data-item-id');
                    }, 0);
                }*/



                $timeout(function () {
                    NVRDataModel.log("Force calling resize");
                    pckry.layout();
                    $scope.packeryDone = true;
                }, zm.packeryTimer); // don't ask



            }, zm.packeryTimer);


        });

        function itemDragged(item) {
            NVRDataModel.debug("drag complete");
        }
    }
    $scope.$on('$ionicView.beforeEnter', function () {
        // This rand is really used to reload the monitor image in img-src so it is not cached
        // I am making sure the image in montage view is always fresh
        // I don't think I am using this anymore FIXME: check and delete if needed
        // $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
        $scope.showControls = true;
        $scope.packeryDone = false;
        readyToRun = false;
        $scope.MontageMonitors = message;
        

        doInitCode();




    });
    $scope.reloadView = function () {
        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
        NVRDataModel.log("User action: image reload " + $rootScope.rand);
    };
    $scope.doRefresh = function () {
        //console.log("***Pull to Refresh, recomputing Rand");
        NVRDataModel.log("Reloading view for montage view, recomputing rand");
        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
        $scope.MontageMonitors = [];
        imageLoadingDataShare.set(0);
        var refresh = NVRDataModel.getMonitors(1);
        refresh.then(function (data) {
            $scope.MontageMonitors = data.data;
            $scope.$broadcast('scroll.refreshComplete');
        });
    };

    function drawGraph(f, mid) {
        //console.log("Graphing on " + "eventchart-" + mid);
        var cv = document.getElementById("eventchart-" + mid);
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
                        min: f.datasets[0].data[0].x,
                        max: f.datasets[0].data[f.datasets[0].data.length - 1].x,
                        displayFormats: {}
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
                data: f,
                options: frameoptions,
            });
        });
    }
    //---------------------------------------------------------------------
    // Controller main
    //---------------------------------------------------------------------
    var intervalHandle;
    var modalIntervalHandle;
    var timeFormat;
    var curYear;
    var readyToRun;
    var frameoptions;
    var timeto, timefrom;
    var commonCss;
    var sizeInProgress;
    var ld;
    var pckry;
    var draggies;
    var i;
    var draggie;
    var loginData;
    var oldmonitors;
    var gridcontainer;
    var montageOrder, hiddenOrder;

    $scope.sliderVal = {
        rate: 2,
        realRate: 200,
        hideNoEvents: false,
        enableGapless: true,
        exactMatch: false,
        showTimeline: true
    };
    $scope.timeFormat = "yyyy-MM-dd " + NVRDataModel.getTimeFormat();
    $scope.displayDateTimeSliders = true;
    $scope.showtimers = true;
    $scope.loginData = NVRDataModel.getLogin();

    $scope.slider_modal_options_rate = {
        from: 1,
        to: 10,
        realtime: true,
        step: 1,
        className: "mySliderClass", //modelLabels:function(val) {return "";},
        smooth: false,
        css: commonCss,
        dimension: 'X'
    };

    $scope.datetimeValueFrom = {
        value: "",
        hrs: ""
    };
    $scope.datetimeValueTo = {
        value: ""
    };

    $rootScope.eventQueryInterval = "";

    function doInitCode()

    {

        $scope.isModalActive = false;

        $scope.hrsAgo = 4;
        window.addEventListener("resize", orientationChanged, false);
        document.addEventListener("pause", onPause, false);
        document.addEventListener("resume", onResume, false);

        timeFormat = 'MM/DD/YYYY HH:mm:ss';
        curYear = new Date().getFullYear();
        readyToRun = false;

        frameoptions = [];
        // default = start of day
        timeto = moment();
        timefrom = moment().startOf('day');
        $scope.datetimeValueTo.value = timeto.toDate();
        $scope.sliderVal.rate = 1;
        $scope.sliderVal.realRate = $scope.sliderVal.rate * 100;

        $scope.datetimeValueFrom.value = timefrom.toDate();
        $scope.datetimeValueFrom.hrs = Math.round(moment.duration(moment().diff(moment($scope.datetimeValueFrom.value))).asHours());

        commonCss = {
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
        };


        $scope.monitorSize = []; // array with montage sizes per monitor
        $scope.scaleDirection = []; // 1 = increase -1 = decrease
        // The difference between old and original is this:
        // old will have a copy of the last re-arranged monitor list
        // while original will have a copy of the order returned by ZM
        var oldMonitors = []; // To keep old order if user cancels after sort;
        // Montage display order may be different so don't
        // mangle monitors as it will affect other screens
        // in Montage screen we will work with this local copy
        //$scope.MontageMonitors = angular.copy ($scope.monitors);
        var montageOrder = []; // This array will keep the ordering in montage view
        var hiddenOrder = []; // 1 = hide, 0 = don't hide
        var tempMonitors = message;
        if (tempMonitors.length == 0) {
            $rootScope.zmPopup = $ionicPopup.alert({
                title: $translate.instant('kNoMonitors'),
                template: $translate.instant('kPleaseCheckCredentials')
            });
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go("login");
            return;
        }
        
        NVRDataModel.log("Inside MontageHistoryCtrl:We found " + $scope.MontageMonitors.length + " monitors");
        // $scope.MontageMonitors = NVRDataModel.applyMontageMonitorPrefs(message, 1)[0];
        var loginData = NVRDataModel.getLogin();
        // init monitors
        NVRDataModel.debug(">>Initializing connkeys and images...");
        for (i = 0; i < $scope.MontageMonitors.length; i++) {
            //$scope.MontageMonitors[i].Monitor.connKey='';
            $scope.MontageMonitors[i].Monitor.eid = "-1";
            $scope.MontageMonitors[i].Monitor.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
            $scope.MontageMonitors[i].Monitor.eventUrl = 'img/noevent.png';
            $scope.MontageMonitors[i].Monitor.eid = "-1";
            $scope.MontageMonitors[i].Monitor.eventUrlTime = "";
            $scope.MontageMonitors[i].Monitor.isPaused = false;
            $scope.MontageMonitors[i].Monitor.gridScale = "50";
            $scope.MontageMonitors[i].Monitor.selectStyle = "";
            $scope.MontageMonitors[i].Monitor.alarmState = 'color:rgba(0,0,0,0);';
            $scope.MontageMonitors[i].Monitor.sliderProgress = {
                progress: 0
            };
        }

        // --------------------------------------------------------
        // Handling of back button in case modal is open should
        // close the modal
        // --------------------------------------------------------                               
        $ionicPlatform.registerBackButtonAction(function (e) {
            e.preventDefault();
            if ($scope.modal && $scope.modal.isShown()) {
                // switch off awake, as liveview is finished
                NVRDataModel.debug("Modal is open, closing it");
                NVRDataModel.setAwake(false);
                $scope.modal.remove();
                $scope.isModalActive = false;
            } else {
                NVRDataModel.debug("Modal is closed, so toggling or exiting");
                if (!$ionicSideMenuDelegate.isOpenLeft()) {
                    $ionicSideMenuDelegate.toggleLeft();
                } else {
                    navigator.app.exitApp();
                }
            }
        }, 1000);
        $scope.isRefresh = $stateParams.isRefresh;
        sizeInProgress = false;
        $ionicSideMenuDelegate.canDragContent(false);
        $scope.LoginData = NVRDataModel.getLogin();
        $scope.monLimit = $scope.LoginData.maxMontage;
        $scope.currentLimit = $scope.LoginData.maxMontage;
        if ($rootScope.platformOS != 'ios') {
            NVRDataModel.log("Limiting montage to 5, thanks to Chrome's stupid connection limit");
            $scope.currentLimit = 5;
            $scope.monLimit = 5;
        }
        $rootScope.authSession = "undefined";
        $ionicLoading.show({
            template: $translate.instant('kNegotiatingStreamAuth'),
            animation: 'fade-in',
            showBackdrop: true,
            duration: zm.loadingTimeout,
            maxWidth: 300,
            showDelay: 0
        });
        ld = NVRDataModel.getLogin();
        //console.log ("MONITORS " + JSON.stringify($scope.monitors));
        $rootScope.validMonitorId = $scope.MontageMonitors[0].Monitor.Id;
        NVRDataModel.getAuthKey($rootScope.validMonitorId).then(function (success) {
            $ionicLoading.hide();
            //console.log(success);
            $rootScope.authSession = success;
            NVRDataModel.log("Stream authentication construction: " + $rootScope.authSession);
            $timeout(function () {
                initPackery();
                readyToRun = true;
                footerCollapse();
            }, zm.packeryTimer);

        }, function (error) {
            $ionicLoading.hide();
            NVRDataModel.debug("MontageHistoryCtrl: Error in authkey retrieval " + error);
            //$rootScope.authSession="";
            NVRDataModel.log("MontageHistoryCtrl: Error returned Stream authentication construction. Retaining old value of: " + $rootScope.authSession);
            $timeout(function () {
                initPackery();
                readyToRun = true;
                footerCollapse();
            }, zm.packeryTimer);
        });
    }

}]);