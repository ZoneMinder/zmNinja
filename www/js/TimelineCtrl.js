/* jshint -W041 */
/* jshint -W083 */
/*This is for the loop closure I am using in line 143 */
/* jslint browser: true*/
/* global vis,cordova,StatusBar,angular,console,moment */

// This controller creates a timeline
// It uses the visjs library, but due to performance reasons
// I've disabled pan and zoom and used buttons instead
// also limits # of items to maxItems (currently 200)

angular.module('zmApp.controllers').controller('zmApp.TimelineCtrl', ['$ionicPlatform', '$scope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$rootScope', '$http', '$q', 'message', '$state', '$ionicLoading', '$ionicPopover', '$ionicScrollDelegate', '$ionicModal', '$timeout', '$ionicContentBanner', function ($ionicPlatform, $scope, zm, ZMDataModel, $ionicSideMenuDelegate, $rootScope, $http, $q, message, $state, $ionicLoading, $ionicPopover, $ionicScrollDelegate, $ionicModal, $timeout, $ionicContentBanner) {

    console.log("Inside Timeline controller");
    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.leftButtons = [{
        type: 'button-icon icon ion-navicon',
        tap: function (e) {
            $scope.toggleMenu();
        }
        }];

    $scope.prettify = function (str) {
        return moment(str).format('MMMM Do YYYY, h:mm:ssa');
    };


    $scope.calcMsTimer = function (frames, len) {
        var myframes, mylen;
        myframes = parseFloat(frames);
        mylen = parseFloat(len);
        //  console.log ("frames " + myframes + "length " + mylen);
        //  console.log ("*** MS COUNT " + (1000.0/(myframes/mylen)));
        return (Math.round(1000 / (myframes / mylen)));
    };

    function move(percentage)
    {
         var range = timeline.getWindow();
        var interval = range.end - range.start;

        timeline.setWindow({
            start: range.start.valueOf() - interval * percentage,
            end: range.end.valueOf() - interval * percentage
        });
    }

    function zoom (percentage)
    {
        var range = timeline.getWindow();
        var interval = range.end - range.start;

        timeline.setWindow({
            start: range.start.valueOf() - interval * percentage,
            end: range.end.valueOf() + interval * percentage
        });
    }

    $scope.move = function (percentage) {
        move(percentage);

    };

    $scope.zoom = function (percentage) {
        zoom(percentage);

    };


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


    //--------------------------------------------------------
    // To show a modal dialog with the event tapped on in timeline
    // FIXME : code repeat from Events
    //--------------------------------------------------------
    function openModal(eid, ename, edur, eframes, basepath, relativepath) {
        ZMDataModel.zmDebug("TimelineCtrl: Open Modal with path " + relativepath);
        $scope.eventName = ename;
        $scope.eventId = eid;
        $scope.eFramesNum = eframes;
        $scope.eventDur = Math.round(edur);
        $scope.loginData = ZMDataModel.getLogin();
        $scope.eventBasePath = basepath;
        $scope.relativePath = relativepath;
        $rootScope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;

        $scope.slider_modal_options = {
            from: 1,
            to: eframes,
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
        //console.log("**Resetting range");
        $scope.slides = [];
        var i;
        for (i = 1; i <= eframes; i++) {
            var fname = padToN(i, eventImageDigits) + "-capture.jpg";
            // console.log ("Building " + fname);
            $scope.slides.push({
                id: i,
                img: fname
            });
        }


        // now get event details to show alarm frames
        var loginData = ZMDataModel.getLogin();
        var myurl = loginData.apiurl + '/events/' + eid + ".json";
        ZMDataModel.zmLog("*** Constructed API for detailed events: " + myurl);
        $http.get(myurl)
            .success(function (data) {
                $scope.FrameArray = data.event.Frame;
                //  $scope.slider_options.scale=[];
                $scope.slider_modal_options.scale = [];
                //$scope.slider_options.modelLabels={2:'X'};
                //$scope.slider_options.dimension="arjun";
                var i;
                for (i = 0; i < data.event.Frame.length; i++) {
                    if (data.event.Frame[i].Type == "Alarm") {

                        // console.log ("**ALARM AT " + i);
                        $scope.slider_modal_options.scale.push({
                            val: i + 1,
                            label: ' '
                        });
                    } else {
                        //$scope.slider_options.scale.push(' ');
                    }

                }

                //console.log (JSON.stringify(data));
            })
            .error(function (err) {
                ZMDataModel.zmLog("Error retrieving detailed frame API " + JSON.stringify(err));
            ZMDataModel.displayBanner ('error', ['error retrieving event details', 'please try again']);
            });

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

            });

    }

    //--------------------------------------------------------
    //We need to destroy because we are instantiating
    // it on open
    //--------------------------------------------------------
    $scope.closeModal = function () {
        // $interval.cancel(eventsInterval);
        //$interval.cancel(segmentHandle);
        ZMDataModel.zmDebug("TimelineCtrl:Close & Destroy Modal");
        ZMDataModel.setAwake(false);
        if ($scope.modal !== undefined) {
            $scope.modal.remove();
        }

    };
    
    
           //-------------------------------------------------------------------------
        // called when user switches to background
        //-------------------------------------------------------------------------
        function onPause() {
            ZMDataModel.zmDebug ("TimelineCtrl:onpause called");
            console.log("*** Moving to Background ***"); // Handle the pause event
            
            if ($scope.popover) $scope.popover.remove();
    
        }


    //--------------------------------------------------------
    // This function is called by the graph ontapped function
    // which in turn calls openModal
    //--------------------------------------------------------

    function showEvent(start, mid, edur, eframes, eid, ename) {
        ZMDataModel.zmDebug ("TimelineCtrl/showevent called with start:" +
                            start + " monitorId:" + mid + " dur:" + edur + " frames:" + eframes + 
                             " eventId:" + eid + " eventName:" +ename);
        //console.log("Event STARTED WITH " + start);
        var str = start;
        var yy = moment(str).format('YY');
        var mm = moment(str).format('MM');
        var dd = moment(str).format('DD');
        var hh = moment(str).format('HH');
        var min = moment(str).format('mm');
        var sec = moment(str).format('ss');
        var relativepath =
            mid + "/" +
            yy + "/" +
            mm + "/" +
            dd + "/" +
            hh + "/" +
            min + "/" +
            sec + "/";
        console.log("PATH IS " + relativepath);

        openModal(eid, ename, edur, eframes, "", relativepath);

    }


    //-------------------------------------------------
    // Make sure we delete the timeline
    // This may be redundant as the root view gets
    // destroyed but no harm
    //-------------------------------------------------
    $scope.$on('$ionicView.leave', function () {
        //console.log("**Destroying Timeline");
        //timeline.destroy();
    });

    //-------------------------------------------------
    // FIXME: shitty hackery -- Im using a rootScope
    // to know if you just went to custom range
    // and back. Fix this, really.
    // So anyway, if you did select a custom range
    // then we "go back" to timeline, which is when
    // we come here - so make sure we update the
    // graph range
    //-------------------------------------------------
    $scope.$on('$ionicView.afterEnter', function () {
        console.log("***AFTER ENTER");

        if ($rootScope.customTimelineRange) {
            console.log("***** CUSTOM RANGE");
            if (moment($rootScope.fromString).isValid() &&
                moment($rootScope.toString).isValid()) {
                console.log("FROM & TO IS CUSTOM");
                fromDate = $rootScope.fromString;
                toDate = $rootScope.toString;
                $scope.fromDate = fromDate;
                $scope.toDate = toDate;
                drawGraph(fromDate, toDate, maxItems);
            } else {
                console.log("FROM & TO IS CUSTOM INVALID");
            }
        }
    });

    //-------------------------------------------------
    // Controller main
    //-------------------------------------------------

    // Make sure sliding for menu is disabled so it
    // does not interfere with graph panning
    $ionicSideMenuDelegate.canDragContent(false);
    
     document.addEventListener("pause", onPause, false);

    // FIXME: Timeline awake to avoid graph redrawing
     ZMDataModel.setAwake(ZMDataModel.getKeepAwake());

    $scope.$watch('ionRange.index', function () {
        // console.log ("***ION RANGE CHANGED");

        $scope.mycarousel.index = parseInt($scope.ionRange.index) - 1;
    });

    $scope.$watch('mycarousel.index', function () {

        $scope.ionRange.index = ($scope.mycarousel.index + 1).toString();
    });

    $scope.mycarousel = {
        index: 0
    };
    $scope.ionRange = {
        index: 1
    };

    var eventImageDigits = 5; // failsafe
    ZMDataModel.getKeyConfigParams(0)
        .then(function (data) {
            //console.log ("***GETKEY: " + JSON.stringify(data));
            eventImageDigits = parseInt(data);
            ZMDataModel.zmLog("Image padding digits reported as " + eventImageDigits);
        });

    // fromDate and toDate will be used to plot the range for the graph
    // We start in day mode
    var fromDate = moment().startOf('day').format("YYYY-MM-DD HH:mm:ss");
    var toDate = moment().endOf('day').format("YYYY-MM-DD HH:mm:ss");


  //Simulated data
    /*
    fromDate = "2015-08-18 00:00:00";
    toDate = "2015-08-18 23:59:59";
    */
    
    $scope.fromDate = fromDate;
    $scope.toDate = toDate;
    
  

    var maxItems = zm.graphItemMax; // THAT magic # --> 300 and ZM on my m/c cries
    $scope.maxItems = maxItems;
    $scope.graphLoaded = false;
    ZMDataModel.zmDebug("TimelineCtrl/drawGraph: graphLoaded is " + $scope.graphLoaded);

    //flat colors for graph - https://flatuicolors.com http://www.flatuicolorpicker.com
    var colors = ['#3498db', '#D2527F',  '#f39c12', '#9b59b6', '#e74c3c','#7A942E',];

    var container;
    container = angular.element(document.getElementById('visualization'));
    var timeline = "";

    $scope.monitors = message;
    $scope.navControls = false;
    var navControls = false;

    $ionicPopover.fromTemplateUrl('templates/timeline-popover.html', {
        scope: $scope,
    }).then(function (popover) {
        $scope.popover = popover;
    });


    drawGraph(fromDate, toDate, maxItems);
    //dummyDrawGraph(fromDate, toDate,maxItems);

    //-------------------------------------------------
    // Rest graph to sane state after you went
    // wild zooming and panning :-)
    //-------------------------------------------------
    $scope.fit = function () {
        timeline.fit();
    };

    $scope.toggleNav = function()
    {
        if (navControls == true)
        {
            navControls=!navControls;
            // give out animation time
            $timeout ( function()
            {
                $scope.navControls = navControls;
            },2000);
        }
        else
        {
            navControls=!navControls;
            $scope.navControls = navControls;
        }
        var element = angular.element(document.getElementById("timeline-ctrl"));

        if (navControls)
        {
         element.removeClass("animated bounceOutLeft");
         element.addClass("animated bounceInRight");
        }
        else
        {
           element.removeClass("animated bounceInRight");
           element.addClass("animated bounceOutLeft");
        }

    };

    //-------------------------------------------------
    // Called with day/week/month
    // so we can redraw the graph
    //-------------------------------------------------

    $scope.buttonClicked = function (index) {
        //console.log (index);
        if (index == 0) //month
        {
            ZMDataModel.zmLog("Month view");
            $rootScope.customTimelineRange = false;

            toDate = moment().format("YYYY-MM-DD HH:mm:ss");
            fromDate = moment().subtract(1, 'month').startOf('day').format("YYYY-MM-DD HH:mm:ss");
            $scope.fromDate = fromDate;
            $scope.toDate = toDate;
            drawGraph(fromDate, toDate, maxItems);
        } else if (index == 1) //week
        {
            $rootScope.customTimelineRange = false;
            ZMDataModel.zmLog("Week  view");
            toDate = moment().format("YYYY-MM-DD HH:mm:ss");
            fromDate = moment().subtract(1, 'week').startOf('day').format("YYYY-MM-DD HH:mm:ss");
            $scope.fromDate = fromDate;
            $scope.toDate = toDate;
            drawGraph(fromDate, toDate, maxItems);
        } else if (index == 2) //day
        {
            $rootScope.customTimelineRange = false;
            ZMDataModel.zmLog("Day view");
            toDate = moment().format("YYYY-MM-DD HH:mm:ss");
            fromDate = moment().subtract(1, 'day').startOf('day').format("YYYY-MM-DD HH:mm:ss");
            $scope.fromDate = fromDate;
            $scope.toDate = toDate;
            drawGraph(fromDate, toDate, maxItems);
        } else // custom
        {
            $rootScope.customTimelineRange = true;
            $state.go('events-date-time-filter');
        }

    };


    //-------------------------------------------------
    // This function draws the graph
    // So far struggling with mobile perf
    // Observations so far:
    // a) Just about acceptable performance with 100 items
    // b) Sometimes on panning CPU gets locked at 99%
    //    for over 3-4 seconds
    //-------------------------------------------------

    function drawGraph(fromDate, toDate, count) {

        $ionicLoading.show({
            template: "Loading graph...",
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0,
            duration: zm.loadingTimeout, //specifically for Android - http seems to get stuck at times
        });

        ZMDataModel.zmLog ("TimelineCtrl/drawgraph: from->"+fromDate+" to->"+toDate+" count:"+count);
        $scope.graphLoaded = false;
        ZMDataModel.zmDebug ("TimelineCtrl/drawgraph: graphLoaded:"+$scope.graphLoaded);

        if (timeline) 
        {
            ZMDataModel.zmDebug("TimelineCtrl/drawgraph: destroying timeline as it exists");
            timeline.destroy();
        }


        var groups = new vis.DataSet();
        var graphData = new vis.DataSet();
        //console.log ("AFTER VIS");


        var options = {

            editable: false,
            throttleRedraw:100,
            moveable: true,
            zoomable: true,
            selectable: true,
            start: fromDate,
            end: toDate,
            orientation: 'top',
            min: fromDate,
            max: toDate,
            zoomMin: 1 * 60 * 1000, // 1 min
            stack: false,
            format: {
                minorLabels: {
                    minute: "hh:mm a",
                    hour: 'hh:mm a',
                    second: 's',
                },
                majorLabels: {
                    second: "D MMM hh:mm a",
                }
            },

        };

        var graphIndex = 1; // will be used for graph ID

        ZMDataModel.getEventsPages(0, fromDate, toDate)
            .then(function (data) {
                var pages = parseInt(data.pageCount);
                var itemsPerPage = parseInt(data.limit);
                var iterCount;

                // The graph seems to get very slow
                // even with 200 items. My data comes in pages from
                // the server - so to make sure I don't exceed 200 items
                // I figure out how many items the server returns per API page
                // and divide the # of items I want (currently 200) with # of items per page
                // So iterCount is the # of HTTP calls I need to make
                iterCount = Math.round(count / itemsPerPage);
                ZMDataModel.zmDebug("TimelineCtrl/drawGraph: pages of data: " + pages + " items per page: " + itemsPerPage);
                ZMDataModel.zmDebug("TimelineCtrl/drawGraph: I will make " + iterCount + " HTTP Requests to get all graph data");

                // I've restructured this part. I was initially using vis DataSets
                // for dynamic binding which was easier, but due to performance reasons
                // I am waiting for the full data to load before I draw
                var promises = [];
                while ((pages > 0) && (iterCount > 0)) {
                    var promise = ZMDataModel.getEvents(0, pages, "none", fromDate, toDate);
                    promises.push(promise);
                    pages--;
                    iterCount--;

                }

                $q.all(promises)
                    .then(function (data) {
                         ZMDataModel.zmDebug ("TimelineCtrl/drawgraph: all pages of graph data received");
                        graphIndex = 0;
                        ZMDataModel.zmLog ("Creating " + $scope.monitors.length + " groups for the graph");
                        // create groups
                         for (var g = 0; g < $scope.monitors.length; g++) {
                            groups.add({
                                id: $scope.monitors[g].Monitor.Id,
                                content: ZMDataModel.getMonitorName($scope.monitors[g].Monitor.Id)
                            });
                              ZMDataModel.zmDebug ("TimelineCtrl/drawgraph:Adding group " +
                                                   ZMDataModel.getMonitorName($scope.monitors[g].Monitor.Id));
                        }
                    
                
                    
                        for (var j = 0; j < data.length; j++) {
                            var myevents = data[j];
                            
                             if (graphIndex > zm.graphItemMax)
                                {
                                    ZMDataModel.zmLog ("Exiting page count graph - reached limit of " + zm.graphItemMax);
                                    break;
                                    
                                }

                            for (var i = 0; i < myevents.length; i++) {

                                graphData.add({
                                    id: graphIndex,
                                    content: "<span class='my-vis-font'>"+ myevents[i].Event.Notes + "</span>",
                                    start: myevents[i].Event.StartTime,
                                    end: myevents[i].Event.EndTime,
                                    group: myevents[i].Event.MonitorId,
                                    //type: "range",
                                    style: "background-color:" + colors[parseInt(myevents[i].Event.MonitorId) % colors.length] + ";border-color:" + colors[parseInt(myevents[i].Event.MonitorId) % colors.length],
                                    myframes: myevents[i].Event.Frames,
                                    mydur: myevents[i].Event.Length,
                                    myeid: myevents[i].Event.Id,
                                    myename: myevents[i].Event.Name,

                                });
                                //console.log ("Added: Monitor:"+myevents[i].Event.MonitorId +
                                          //   " Start:" + myevents[i].Event.StartTime +
                                         //    " Stop:"+myevents[i].Event.EndTime);

                                graphIndex++;
                                
                                if (graphIndex > zm.graphItemMax)
                                {
                                    ZMDataModel.zmLog ("Exiting event graph - reached limit of " + zm.graphItemMax);
                                    break;
                                    
                                }

                            }
                        }

                        timeline = new vis.Timeline(container[0], null, options);

                        timeline.setItems(graphData);
                        timeline.setGroups(groups);
                        timeline.fit();

                        $ionicLoading.hide();
                        $scope.graphLoaded = true;
                        ZMDataModel.zmDebug ("graph loaded: " + $scope.graphLoaded);
                        $scope.navControls = false;
                        timeline.on('select', function (properties) {
                            if (properties.items && !isNaN(properties.items[0])) {
                                ZMDataModel.zmDebug("TimelineCtrl/drawGraph:You clicked on item " + properties.items);
                                var item = graphData.get(properties.items);
                                ZMDataModel.zmDebug("TimelineCtrl/drawGraph: clicked item details:" + JSON.stringify(item));
                                showEvent(item[0].start, item[0].group, item[0].mydur, item[0].myframes, item[0].myeid, item[0].myename);


                            } else {
                                  $ionicLoading.show({
                                    template: "Zoom in more to scrub events...",
                                    animation: 'fade-in',
                                    showBackdrop: true,
                                    maxWidth: 200,
                                    showDelay: 0,
                                    duration: 1500,
        });
                                console.log("Zoomed out too far to playback events");
                            }

                        });
                    },
                    function (error) {
                    ZMDataModel.displayBanner ('error', 'Timeline error', 'Please try again');
                    
                }
                         
                         
                         ); // get Events
            });
    }


        $scope.radialMenuOptions = {
        content: '',
        size:'small',

        background: '#982112',
        isOpen: false,
        toggleOnClick: false,
        button: {
            cssClass: 'fa  fa-compress fa-2x',
            size:'small',
            onclick: function() { console.log ("fitting");timeline.fit();}
        },
        items: [
            {
                content: '',
                cssClass: 'fa fa-minus-circle',
                empty: false,
                onclick: function () {
                    zoom(0.2);
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: true,
                onclick: function () {
                   // controlPTZ($scope.monitorId, 'DownLeft');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,

                onclick: function () {
                    //controlPTZ($scope.monitorId, 'Left');
                    move(0.2);
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
                empty: true,
                onclick: function () {
                    //controlPTZ($scope.monitorId, 'UpLeft');

                }
            },

            {
                content: '',
                cssClass: 'fa fa-plus-circle',
                empty: false,
                onclick: function () {
                    //controlPTZ($scope.monitorId, 'Up');
                    zoom(-0.2);
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: true,
                onclick: function () {
                    //controlPTZ($scope.monitorId, 'UpRight');

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
                    //controlPTZ($scope.monitorId, 'Right');
                    move(-0.2);
                }
            },


            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: true,
                onclick: function () {
                    //controlPTZ($scope.monitorId, 'DownRight');
                }
            },

            {
                content: 'K',
                empty: true,
                onclick: function () {
                    console.log('About');
                }
            },
    ]};
    
   



}]);
