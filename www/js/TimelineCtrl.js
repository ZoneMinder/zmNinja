/* jshint -W041 */
/* jshint -W083 */
/*This is for the loop closure I am using in line 143 */
/* jslint browser: true*/
/* global vis,cordova,StatusBar,angular,console,moment */

// This controller generates a graph for events
// the main function is generateChart. I call generate chart with required parameters
// from the template file

angular.module('zmApp.controllers').controller('zmApp.TimelineCtrl', ['$ionicPlatform', '$scope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$rootScope', '$http', '$q','message','$state', '$ionicLoading', '$ionicPopover', function ($ionicPlatform, $scope, zm, ZMDataModel, $ionicSideMenuDelegate, $rootScope, $http, $q,message, $state, $ionicLoading, $ionicPopover) {

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


    //-------------------------------------------------
    // Make sure we delete the timeline
    // This may be redundant as the root view gets
    // destroyed but no harm
    //-------------------------------------------------
    $scope.$on('$ionicView.leave', function () {
        //console.log("**Destroying Timeline");
        //timeline.destroy();
    });

    $scope.$on('$ionicView.afterEnter', function () {
        console.log ("***AFTER ENTER");

         if ($rootScope.customTimelineRange)
    {
        console.log ("***** CUSTOM RANGE");
        if (moment($rootScope.fromString).isValid() &&
            moment($rootScope.toString).isValid())
        {
            console.log ("FROM & TO IS CUSTOM");
            fromDate = $rootScope.fromString;
            toDate = $rootScope.toString;
            $scope.fromDate = fromDate;
            $scope.toDate = toDate;
            drawGraph(fromDate, toDate, maxItems);
        }
        else
        {
             console.log ("FROM & TO IS CUSTOM INVALID");
        }
    }
    });

    //-------------------------------------------------
    // Controller main
    //-------------------------------------------------

    // Make sure sliding for menu is disabled so it
    // does not interfere with graph panning
    $ionicSideMenuDelegate.canDragContent(false);

    // fromDate and toDate will be used to plot the range for the graph
    // We start in day mode
    var fromDate = moment().startOf('day').format("YYYY-MM-DD HH:mm:ss");
    var toDate = moment().endOf('day').format("YYYY-MM-DD HH:mm:ss");



    $scope.fromDate = fromDate;
    $scope.toDate = toDate;

    var maxItems = 200;

    //flat colors for graph - https://flatuicolors.com
    var colors = ['#3498db', '#83adb5', '#c7bbc9', '#f39c12', '#bfb5b2', '#e74c3c'];

    var container ;
    container = angular.element(document.getElementById('visualization'));
    var timeline="";

    $scope.monitors = message;

    $ionicPopover.fromTemplateUrl('templates/timeline-popover.html', {
            scope: $scope,
          }).then(function(popover) {
            $scope.popover = popover;
          });


   //drawGraph(fromDate, toDate,maxItems);
    dummyDrawGraph(fromDate, toDate,maxItems);

    //-------------------------------------------------
    // Rest graph to sane state after you went
    // wild zooming and panning :-)
    //-------------------------------------------------
    $scope.fit = function () {
        timeline.fit();
    };

    //-------------------------------------------------
    // Called with day/week/month
    // so we can redraw the graph
    //-------------------------------------------------

    $scope.buttonClicked = function(index)
    {
        //console.log (index);
        if (index == 0) //month
        {
            ZMDataModel.zmLog ("Month view");
            $rootScope.customTimelineRange = false;

            toDate = moment().format("YYYY-MM-DD HH:mm:ss");
            fromDate = moment().subtract(1,'month').startOf('day').format("YYYY-MM-DD HH:mm:ss");
            $scope.fromDate = fromDate;
            $scope.toDate = toDate;
            drawGraph(fromDate, toDate,maxItems);
        }
        else if (index == 1) //week
        {
            $rootScope.customTimelineRange = false;
            ZMDataModel.zmLog("Week  view");
            toDate = moment().format("YYYY-MM-DD HH:mm:ss");
            fromDate = moment().subtract(1,'week').startOf('day').format("YYYY-MM-DD HH:mm:ss");
            $scope.fromDate = fromDate;
            $scope.toDate = toDate;
            drawGraph(fromDate, toDate,maxItems);
        }
        else if (index==2) //day
        {
            $rootScope.customTimelineRange = false;
            ZMDataModel.zmLog ("Day view");
            toDate = moment().format("YYYY-MM-DD HH:mm:ss");
            fromDate = moment().subtract(1,'day').startOf('day').format("YYYY-MM-DD HH:mm:ss");
            $scope.fromDate = fromDate;
            $scope.toDate = toDate;
            drawGraph(fromDate, toDate,maxItems);
        }

        else // custom
        {
            $rootScope.customTimelineRange = true;
            $state.go('events-date-time-filter');
        }

    };

    // ------------------------------------------------------
    // Draws a random graph from Vis timeline performance
    // -----------------------------------------------------
    function dummyDrawGraph(fromDate, toDate, count)
    {
         if (timeline)  timeline.destroy();

         var groups = new vis.DataSet([
            {id: 1, content: 'Truck&nbsp;1'},
            {id: 2, content: 'Truck&nbsp;2'},
            {id: 3, content: 'Truck&nbsp;3'},
            {id: 4, content: 'Truck&nbsp;4'}
         ]);

        // create items
        var items = new vis.DataSet();

          var order = 1;
          var truck = 1;
          for (var j = 0; j < 4; j++) {
            var date = new Date();
            for (var i = 0; i < count/4; i++) {
              date.setHours(date.getHours() +  4 * (Math.random() < 0.2));
              var start = new Date(date);

              date.setHours(date.getHours() + 2 + Math.floor(Math.random()*4));
              var end = new Date(date);

              items.add({
                id: order,
                group: truck,
                start: start,
                end: end,
                content: 'Order ' + order
              });

              order++;
            }
            truck++;
          }

        // specify options
    var options = {
        stack: false,
        start: new Date(),
        end: new Date(1000*60*60*24 + (new Date()).valueOf()),
        editable: false,
        margin: {
          item: 10, // minimal margin between items
          axis: 5   // minimal margin between items and the axis
        },
        orientation: 'top'
      };
        timeline = new vis.Timeline(container[0], null, options);
        timeline.setGroups(groups);
        timeline.setItems(items);
    }


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

       if (timeline)  timeline.destroy();



        var groups = new vis.DataSet();
        var graphData = new vis.DataSet();
        //console.log ("AFTER VIS");


        var options = {
           // autoResize: false, // true makes it much slower
            //configure: true,
            editable: false,
           // moveable: true,
           // zoomable: true,
            start:fromDate,
            end:toDate,
            orientation: 'top',
            min: fromDate,
            max: toDate,
            //width:'90%',

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
                iterCount  = Math.round(count/itemsPerPage);
                console.log("I will make " + iterCount + " HTTP Requests ");

                // I've restructured this part. I was initially using vis DataSets
                // for dynamic binding which was easier, but due to performance reasons
                // I am waiting for the full data to load before I draw
                var promises = [];
                while ((pages > 0) && (iterCount >0)) {
                    var promise = ZMDataModel.getEvents(0, pages, "none", fromDate, toDate);
                    promises.push(promise);
                    pages--;
                    iterCount--;

                }

                $q.all(promises)
                    .then(function (data) {


                    // create groups
                        for (var g=0; g<$scope.monitors.length; g++)
                        {
                                   groups.add({
                                        id: $scope.monitors[g].Monitor.Id,
                                        content: ZMDataModel.getMonitorName($scope.monitors[g].Monitor.Id)
                                    });
                        }
                        for (var j = 0; j < data.length; j++) {
                            var myevents = data[j];


                            for (var i = 0; i < myevents.length; i++) {

                                graphData.add({
                                    id: graphIndex,
                                    content: '',
                                    start: myevents[i].Event.StartTime,
                                    end: myevents[i].Event.EndTime,
                                    group: myevents[i].Event.MonitorId,
                                    //type: "range",
                                    style: "background-color:" + colors[parseInt(myevents[i].Event.MonitorId) % colors.length] + ";border-color:" + colors[parseInt(myevents[i].Event.MonitorId) % colors.length],
                                   // title: "Hello"

                                });

                                graphIndex++;

                            }
                        }

                        timeline = new vis.Timeline(container[0], null, options);
                        timeline.setItems(graphData);
                        timeline.setGroups(groups);
                        timeline.fit();
                    $ionicLoading.hide();
                    }); // get Events
            });
    }


    function arrayObjectIndexOf(myArray, searchTerm, property) {
        for (var i = 0, len = myArray.length; i < len; i++) {
            if (myArray[i][property] === searchTerm) return i;
        }
        return -1;
    }





}]);
