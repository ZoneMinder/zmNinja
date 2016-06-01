/* jshint -W041 */
/* jshint -W083 */
/*This is for the loop closure I am using in line 143 */
/* jslint browser: true*/
/* global vis,cordova,StatusBar,angular,console,moment */

// This controller creates a timeline
// It uses the visjs library, but due to performance reasons
// I've disabled pan and zoom and used buttons instead
// also limits # of items to maxItems 


// FIXME: too much redundant code between EventCtrl and Timeline 
// Move to ModalCtrl and see if it works

angular.module('zmApp.controllers').controller('zmApp.TimelineCtrl', ['$ionicPlatform', '$scope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$rootScope', '$http', '$q', 'message', '$state', '$ionicLoading', '$ionicPopover', '$ionicScrollDelegate', '$ionicModal', '$timeout', '$ionicContentBanner', '$ionicHistory', '$sce', '$stateParams', '$translate', function ($ionicPlatform, $scope, zm, ZMDataModel, $ionicSideMenuDelegate, $rootScope, $http, $q, message, $state, $ionicLoading, $ionicPopover, $ionicScrollDelegate, $ionicModal, $timeout, $ionicContentBanner, $ionicHistory, $sce, $stateParams, $translate) {

    //console.log("Inside Timeline controller");
    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
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
                "id": 0
            }, {
                reload: true
            });
        }
    };

    $scope.leftButtons = [{
        type: 'button-icon icon ion-navicon',
        tap: function (e) {
            $scope.toggleMenu();
        }
        }];

    //-----------------------------------------------------------
    // Used to display date range for timeline
    //-----------------------------------------------------------
    $scope.prettify = function (str) {
        return moment(str).format('MMMM Do YYYY, '+ZMDataModel.getTimeFormat());
    };

    //-----------------------------------------------------------
    // used for playback when you tap on a timeline event
    //-----------------------------------------------------------
    $scope.calcMsTimer = function (frames, len) {
        var myframes, mylen;
        myframes = parseFloat(frames);
        mylen = parseFloat(len);
        //  console.log ("frames " + myframes + "length " + mylen);
        //  console.log ("*** MS COUNT " + (1000.0/(myframes/mylen)));
        return (Math.round(1000 / (myframes / mylen)));
    };


    $scope.toggleMinAlarmFrameCount = function () {
       // console.log("Toggling");

        var ld = ZMDataModel.getLogin();
        ld.enableAlarmCount = !ld.enableAlarmCount;
        
        ZMDataModel.setLogin(ld);


        drawGraph(curFromDate, curToDate, curCount);

    };

    //-----------------------------------------------------------
    // Move/Zoom are used to move the timeline around
    //-----------------------------------------------------------
    function move(percentage) {
        var range = timeline.getWindow();
        var interval = range.end - range.start;

        timeline.setWindow({
            start: range.start.valueOf() - interval * percentage,
            end: range.end.valueOf() - interval * percentage
        });
    }

    function zoom(percentage) {
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

    //-----------------------------------------
    // Move by X days 
    //-----------------------------------------
    $scope.moveDays = function (d)
    {
        var range = timeline.getWindow();
        var ds = moment(range.start);
        if (d>0) 
            ds.add(d, 'days'); 
        else
            ds.subtract(Math.abs(d), 'days');

        var es = moment(ds); // clone it!
        es.add (1, 'day');
        
        fromDate = ds.format("YYYY-MM-DD HH:mm:ss");
        toDate = es.format("YYYY-MM-DD HH:mm:ss");

        $scope.fromDate = fromDate;
        $scope.toDate = toDate;
        $rootScope.customTimelineRange = false;
        ZMDataModel.zmLog ("moving by " + d + " day to " + fromDate + " upto " + toDate);
        drawGraph(fromDate, toDate, maxItems);
       
    };

    
    function eventDetails(ev)
    {
        $scope.event = ev;
         $ionicModal.fromTemplateUrl('templates/timeline-modal.html', {
                scope: $scope, // give ModalCtrl access to this scope
                animation: 'slide-in-up',
                id:'analyze',
             
            })
            .then(function (modal) {
                $scope.modal = modal;
                

               

                $scope.modal.show();

            });
    }



    //--------------------------------------------------------
    // To show a modal dialog with the event tapped on in timeline
    // FIXME : code repeat from Events
    //--------------------------------------------------------
    function openModal(event) {
        
        if ($scope.modalFromTimelineIsOpen == true)
        {
            // don't know why but some conflict from angular to timeline lib
            // results in double modals at times
            ZMDataModel.zmLog (">>-- duplicate modal detected, preventing");
        }
        
        $scope.modalFromTimelineIsOpen = true;
        ZMDataModel.setAwake(ZMDataModel.getKeepAwake());

        // pass this event to ModalCtrl
        $scope.currentEvent = event;
      
        $scope.event = event;
        // in Timeline view, make sure events stick to same monitor
        $scope.followSameMonitor = "1";

        //prepareModalEvent(event.Event.Id);

        $ionicModal.fromTemplateUrl('templates/events-modal.html', {
                scope: $scope, // give ModalCtrl access to this scope
                animation: 'slide-in-up',
                id:'footage'
            })
            .then(function (modal) {
                $scope.modal = modal;

                $ionicLoading.show({
                    template: $translate.instant('kPleaseWait')+"...",
                    noBackdrop: true,
                    duration: 10000,
                    
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
        $scope.modalFromTimelineIsOpen = false;
        // $interval.cancel(eventsInterval);
        //$interval.cancel(segmentHandle);
        ZMDataModel.zmDebug("TimelineCtrl:Close & Destroy Modal");
        ZMDataModel.stopNetwork("TimelineCtrl: closeModal");
        ZMDataModel.setAwake(false);
        if ($scope.modal !== undefined) {
            $scope.modal.remove();
        }

    };

    /*   $scope.toggleGapless = function()
          {
              console.log ("GAPLESS TOGGLE");
              $scope.loginData.gapless = !$scope.loginData.gapless;
              ZMDataModel.setLogin($scope.loginData);
              
          };*/


    //-------------------------------------------------------------------------
    // called when user switches to background
    //-------------------------------------------------------------------------
    function onPause() {
        ZMDataModel.zmDebug("TimelineCtrl:onpause called");
       // console.log("*** Moving to Background ***"); // Handle the pause event

        if ($scope.popover) $scope.popover.remove();

    }


    //--------------------------------------------------------
    // This function is called by the graph ontapped function
    // which in turn calls openModal
    //--------------------------------------------------------

    function showEvent(event) {

        // in context of angular

        $timeout ( function () {
        openModal(event);});

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
    
    
     $scope.$on('$ionicView.enter', function () {
        
         
         
    // Make sure sliding for menu is disabled so it
    // does not interfere with graph panning
    $ionicSideMenuDelegate.canDragContent(false);
         var ld = ZMDataModel.getLogin();
         maxItemsConf = ($rootScope.platformOS == 'desktop') ? zm.graphDesktopItemMax: zm.graphItemMax; 
          maxItems = ld.graphSize || maxItemsConf;
         ZMDataModel.zmLog("Graph items to draw is " + maxItems);
        $scope.maxItems = maxItems;
        $scope.translationData = {
            maxItemsVal: maxItems
        };
         
        $scope.graphLoaded = false;
        ZMDataModel.zmDebug("TimelineCtrl/drawGraph: graphLoaded is " + $scope.graphLoaded);
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
       // console.log("***AFTER ENTER");

        $scope.modalFromTimelineIsOpen = false;
        var tempMon = message;

        //console.log ("TIMELINE MONITORS: " + JSON.stringify(message));
        var ld = ZMDataModel.getLogin();
        $scope.loginData = ZMDataModel.getLogin();

        if (ld.persistMontageOrder) {
            var iMon = ZMDataModel.applyMontageMonitorPrefs(tempMon, 2);
            $scope.monitors = iMon[0];
        } else
            $scope.monitors = message;
        if ($rootScope.customTimelineRange) {
           // console.log("***** CUSTOM RANGE");
            if (moment($rootScope.fromString).isValid() &&
                moment($rootScope.toString).isValid()) {
               // console.log("FROM & TO IS CUSTOM");
                fromDate = $rootScope.fromString;
                toDate = $rootScope.toString;
                $scope.fromDate = fromDate;
                $scope.toDate = toDate;
                drawGraph(fromDate, toDate, maxItems);
            } else {
              //  console.log("FROM & TO IS CUSTOM INVALID");
            }
        } else {
            drawGraph(fromDate, toDate, maxItems);
        }

        $ionicPopover.fromTemplateUrl('templates/timeline-popover.html', {
            scope: $scope,
        }).then(function (popover) {
            $scope.popover = popover;
        });


    });

    //-------------------------------------------------
    // Controller main
    //-------------------------------------------------

    $scope.mycarousel = {
        index: 0
    };
    $scope.ionRange = {
        index: 1
    };
   
    var curFromDate, curToDate, curCount;


    document.addEventListener("pause", onPause, false);

    // FIXME: Timeline awake to avoid graph redrawing
    ZMDataModel.setAwake(ZMDataModel.getKeepAwake());






    // fromDate and toDate will be used to plot the range for the graph
    // We start in day mode
    var fromDate = moment().startOf('day').format("YYYY-MM-DD HH:mm:ss");
    var toDate = moment().endOf('day').format("YYYY-MM-DD HH:mm:ss");



    $scope.fromDate = fromDate;
    $scope.toDate = toDate;


    // maxItems will be ignored during timeline draw if its desktop
     var maxItemsConf;
    
    var ld = ZMDataModel.getLogin();
    var maxItems;

    

    //flat colors for graph - https://flatuicolors.com http://www.flatuicolorpicker.com
    var colors = ['#3498db', '#E57373', '#EB974E', '#95A5A6', '#e74c3c', '#03C9A9', ];

    var container;
    container = angular.element(document.getElementById('visualization'));
    var timeline = "";



    //console.log ("RETURNING MONITORS " + JSON.stringify($scope.monitors));
    //$scope.monitors = message;

    //console.log ("MONITOR DATA AFTER APPLYING : " + JSON.stringify($scope.monitors));

    $scope.navControls = false;
    var navControls = false;



    //drawGraph(fromDate, toDate, maxItems);
    //dummyDrawGraph(fromDate, toDate,maxItems);

    //-------------------------------------------------
    // Rest graph to sane state after you went
    // wild zooming and panning :-)
    //-------------------------------------------------
    $scope.fit = function () {
        timeline.fit();
    };

    $scope.toggleNav = function () {
        if (navControls == true) {
            navControls = !navControls;
            // $scope.navControls = navControls;
            // give out animation time
            $timeout(function () {
                $scope.navControls = navControls;
            }, 2000);
        } else {
            navControls = !navControls;
            $scope.navControls = navControls;
        }
        var element = angular.element(document.getElementById("timeline-ctrl"));

        if (navControls) {
            element.removeClass("animated bounceOutLeft");
            element.addClass("animated bounceInRight");
        } else {
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


        curFromDate = fromDate;
        curToDate = toDate;
        curCount = count;

        $ionicLoading.show({
            template: $translate.instant('kLoadingGraph')+"...",
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0,
            duration: zm.loadingTimeout, //specifically for Android - http seems to get stuck at times
        });

        ZMDataModel.zmLog("TimelineCtrl/drawgraph: from->" + fromDate + " to->" + toDate + " count:" + count);
        $scope.graphLoaded = false;
        ZMDataModel.zmDebug("TimelineCtrl/drawgraph: graphLoaded:" + $scope.graphLoaded);

        if (timeline) {
            ZMDataModel.zmDebug("TimelineCtrl/drawgraph: destroying timeline as it exists");
            timeline.destroy();
        }


        var groups = new vis.DataSet();
        var graphData = new vis.DataSet();
        //console.log ("AFTER VIS");


        var options = {

            editable: false,
            throttleRedraw: 100,
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
                    minute: ZMDataModel.getTimeFormat(),
                    hour: ZMDataModel.getTimeFormat(),
                    second: 's',
                },
                majorLabels: {
                    second: "D MMM "+ZMDataModel.getTimeFormat(),
                }
            },

        };

        var graphIndex = 1; // will be used for graph ID

        ZMDataModel.getEventsPages(0, fromDate, toDate)
            .then(function (data) {
                var pages = parseInt(data.pageCount);
                var itemsPerPage = parseInt(data.limit);
                var iterCount;

                // So iterCount is the # of HTTP calls I need to make
                iterCount = Math.max(Math.round(count / itemsPerPage), 1);
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
                            ZMDataModel.zmDebug("TimelineCtrl/drawgraph: all pages of graph data received");
                            graphIndex = 0;
                            ZMDataModel.zmLog("Creating " + $scope.monitors.length + " groups for the graph");
                            // create groups
                            for (var g = 0; g < $scope.monitors.length; g++) {
                                groups.add({
                                    id: $scope.monitors[g].Monitor.Id,
                                    //mid: $scope.monitors[g].Monitor.Id,
                                    content: ZMDataModel.getMonitorName($scope.monitors[g].Monitor.Id),
                                    order: $scope.monitors[g].Monitor.Sequence
                                });
                                ZMDataModel.zmDebug("TimelineCtrl/drawgraph:Adding group " +
                                    ZMDataModel.getMonitorName($scope.monitors[g].Monitor.Id));
                            }



                            for (var j = 0; j < data.length; j++) {
                                var myevents = data[j];

                                if (graphIndex > count) {
                                    ZMDataModel.zmLog("Exiting page count graph - reached limit of " + count);
                                    break;

                                }

                                for (var i = 0; i < myevents.length; i++) {

                                    // make sure group id exists before adding
                                    var idfound = true;
                                    var ld = ZMDataModel.getLogin();

                                    if (ld.persistMontageOrder) {

                                        idfound = false;
                                        for (var ii = 0; ii < $scope.monitors.length; ii++) {
                                            if ($scope.monitors[ii].Monitor.Id == myevents[i].Event.MonitorId) {
                                                idfound = true;
                                                //console.log ("****************** ID MATCH " + graphIndex);

                                                break;
                                            }
                                        }
                                    }
                                    
                                    myevents[i].Event.MonitorName = ZMDataModel.getMonitorName(myevents[i].Event.MonitorId);
                            // now construct base path

                            myevents[i].Event.streamingURL = ZMDataModel.getStreamingURL (myevents[i].Event.MonitorId);
                            myevents[i].Event.baseURL = ZMDataModel.getBaseURL (myevents[i].Event.MonitorId);
                            myevents[i].Event.imageMode = ZMDataModel.getImageMode (myevents[i].Event.MonitorId);
                            if (ZMDataModel.getLogin().url != myevents[i].Event.baseURL)
                            {
                                //ZMDataModel.zmDebug ("Multi server, changing base");
                                myevents[i].Event.baseURL = ZMDataModel.getLogin().url;
                                   
                            }
                           // console.log ("***** MULTISERVER STREAMING URL FOR EVENTS " + myevents[i].Event.streamingURL);

                          //  console.log ("***** MULTISERVER BASE URL FOR EVENTS " + myevents[i].Event.baseURL);
                            
                 
                            

                                    if (idfound) {

                                        if (typeof myevents[i].Event.DefaultVideo === 'undefined')
                                           // console.log (JSON.stringify(myevents[i]));
                                            myevents[i].Event.DefaultVideo = "";
                                        graphData.add({
                                            id: graphIndex,
                                            content: "<span class='my-vis-font'>" + "( <i class='ion-android-notifications'></i>"+myevents[i].Event.AlarmFrames+") "+myevents[i].Event.Notes + "</span>",
                                            start: myevents[i].Event.StartTime,
                                            end: myevents[i].Event.EndTime,
                                            group: myevents[i].Event.MonitorId,
                                            //type: "range",
                                            style: "background-color:" + colors[parseInt(myevents[i].Event.MonitorId) % colors.length] +
                                                ";border-color:" + colors[parseInt(myevents[i].Event.MonitorId) % colors.length],
                                            myframes: myevents[i].Event.Frames,
                                            mydur: myevents[i].Event.Length,
                                            myeid: myevents[i].Event.Id,
                                            myename: myevents[i].Event.Name,
                                            myvideo: myevents[i].Event.DefaultVideo,
                                            myevent: myevents[i]

                                        });
                                        graphIndex++;
                                    } else {
                                        //console.log ("SKIPPED GRAPH ID " + graphIndex);
                                    }



                                    if (graphIndex > count) {
                                        ZMDataModel.zmLog("Exiting event graph - reached limit of " + count);
                                        break;

                                    }

                                }
                            }

                            timeline = new vis.Timeline(container[0], null, options);
                            // console.log ("GRAPH DATA");
                            timeline.setItems(graphData);
                            //   console.log ("GROUPS");
                            timeline.setGroups(groups);

                            timeline.fit();

                            $ionicLoading.hide();
                            $scope.graphLoaded = true;
                            ZMDataModel.zmDebug("graph loaded: " + $scope.graphLoaded);
                            $scope.navControls = false;
                            var dblclick = false;
                    
                           
                            
                            timeline.on('click', function (prop) {
                                
                                
                                $timeout (function() {
                                    if (dblclick)
                                    {
                                        console.log ("IGNORING CLICK AS DBL CLICK");
                                        $timeout (function(){dblclick =  false;},400);
                                        return;
                                    }
                                    console.log ("CLICK");
                                    //console.log ("I GOT " + JSON.stringify(prop));
                                   // console.log ("EVENT IS " + JSON.stringify(properties.event));
                                    //var properties =  timeline.getEventProperties(prop);
                                   // console.log ( "I GOT " + properties);
                                    var itm = prop.item;
                                    //console.log ("ITEM CLICKED " + itm);
                                    if (itm && !isNaN(itm)) {
                                        ZMDataModel.zmDebug("TimelineCtrl/drawGraph:You clicked on item " + itm);
                                        var item = graphData.get(itm);
                                        ZMDataModel.zmDebug("TimelineCtrl/drawGraph: clicked item details:" + JSON.stringify(item));
                                        showEvent(item.myevent);


                                    } else {
                                        ZMDataModel.zmDebug ("exact match not found, guessing item with co-ordinates X="+prop.x+" group="+prop.group);
                                        if (prop.group)
                                        {
                                            var visible = timeline.getVisibleItems();
                                            ZMDataModel.zmDebug ("Visible items="+JSON.stringify(visible));
                                            var closestItem=null;
                                            var minDist =99999;
                                            var _item;
                                            for (var x = 0; x < visible.length; x++)
                                            {
                                                _item = timeline.itemSet.items[x];
                                                 if (_item.data.group == prop.group)
                                                 {
                                                     if (Math.abs(_item.left - prop.x) < minDist)
                                                         {
                                                            closestItem = _item;
                                                            minDist = Math.abs(_item.left - prop.x);
                                                            ZMDataModel.zmDebug ("Temporary closest "+_item.left);
                                                            //console.log (_item);
                                                         }
                                                 }

                                            }
                                            
                                            if (closestItem!=null)
                                            {
                                                ZMDataModel.zmLog ("Closest item " +closestItem.left+ " group: " + closestItem.data.group);
                                                showEvent(closestItem.data.myevent);
                                            }
                                            else
                                            {
                                                ZMDataModel.zmLog ("Did not find a visible item match");
                                            }
                                        }
                                        else // no group row tapped, do nothing
                                        {
                                        
                                            /*$ionicLoading.show({
                                                template: "",
                                                animation: 'fade-in',
                                                showBackdrop: true,
                                                maxWidth: 200,
                                                showDelay: 0,
                                                duration: 1500,
                                            });*/
                                        }
                                       // console.log("Zoomed out too far to playback events");
                                    }
                                },400);

                            });
                    
                             timeline.on ('doubleClick', function (prop) {
                                console.log ("DOUBLE");
                                dblclick = true;
                                 var itm = prop.item;
                                    //console.log ("ITEM CLICKED " + itm);
                                    if (itm && !isNaN(itm)) {
                                        ZMDataModel.zmDebug("TimelineCtrl/drawGraph:You clicked on item " + itm);
                                        var item = graphData.get(itm);
                                        ZMDataModel.zmDebug("TimelineCtrl/drawGraph: clicked item details:" + JSON.stringify(item));
                                        eventDetails(item.myevent);


                                    } else {
                                        
                                        ZMDataModel.zmDebug ("exact match not found, guessing item with co-ordinates X="+prop.x+" group="+prop.group);
                                        if (prop.group)
                                        {
                                            var visible = timeline.getVisibleItems();
                                            ZMDataModel.zmDebug ("Visible items="+JSON.stringify(visible));
                                            var closestItem=null;
                                            var minDist =99999;
                                            var _item;
                                            for (var x = 0; x < visible.length; x++)
                                            {
                                                 _item = timeline.itemSet.items[x];
                                                 if (_item.data.group == prop.group)
                                                 {
                                                     if (Math.abs(_item.left - prop.x) < minDist)
                                                         {
                                                            closestItem = _item;
                                                            minDist = Math.abs(_item.left - prop.x);
                                                            ZMDataModel.zmDebug ("Temporary closest "+_item.left);
                                                            //console.log (_item);
                                                         }
                                                 }

                                            }
                                            ZMDataModel.zmLog ("Closest item " +closestItem.left+ " group: " + closestItem.data.group);
                                            if (closestItem!=null)
                                            {
                                                ZMDataModel.zmLog ("Closest item " +closestItem.left+ " group: " + closestItem.data.group);
                                                showEvent(closestItem.data.myevent);
                                            }
                                            else
                                            {
                                                ZMDataModel.zmLog ("Did not find a visible item match");
                                            }
                                        }
                                        
                                       // console.log("Zoomed out too far to playback events");
                                    }
                                
                            });
                        },
                        function (error) {
                            ZMDataModel.displayBanner('error', 'Timeline error', 'Please try again');

                        }

                    ); // get Events
            });
    }


    $scope.radialMenuOptions = {
        content: '',
        //size: 'small',

        background: '#982112',
        isOpen: true,
        toggleOnClick: false,
        button: {
            cssClass: 'fa  fa-compress fa-2x',
            size: 'small',
            onclick: function () {
                console.log("fitting");
                timeline.fit();
            }
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

                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,

                onclick: function () {
                

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

                }
            },

            {
                content: '',
                cssClass: 'fa fa-plus-circle',
                empty: false,
                onclick: function () {

                    zoom(-0.2);
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: true,
                onclick: function () {

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
                    move(-0.2);
                }
            },


            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: true,
                onclick: function () {

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





}]);