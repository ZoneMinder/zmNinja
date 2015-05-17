/* jshint -W041 */
/* jshint -W083 */ /*This is for the loop closure I am using in line 143 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,moment */

// This controller generates a graph for events
// the main function is generateChart. I call generate chart with required parameters
// from the template file

// FIXME: I need to clean this up, the animation is stupid because the data loads
// dynamically. I think I should really be using $q.all to animate after we get everything

angular.module('zmApp.controllers').controller('zmApp.EventsGraphsCtrl', ['$ionicPlatform', '$scope', 'ZMDataModel', '$ionicSideMenuDelegate', '$rootScope', '$http', function ($ionicPlatform, $scope, ZMDataModel, $ionicSideMenuDelegate, $rootScope, $http, $element) {
    console.log("Inside Graphs controller");
    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.$on('$ionicView.loaded', function () {
        console.log("**VIEW ** Graph Ctrl Loaded");
    });

    $scope.$on('$ionicView.enter', function () {
        console.log("**VIEW ** Graph Ctrl Entered");
    });

    $scope.$on('$ionicView.leave', function () {
        console.log("**VIEW ** Graph Ctrl Left");
    });

    $scope.$on('$ionicView.unloaded', function () {
        console.log("**VIEW ** Graph Ctrl Unloaded");
    });


    $scope.navTitle = 'Tab Page';
    $scope.leftButtons = [{
        type: 'button-icon icon ion-navicon',
        tap: function (e) {
            $scope.toggleMenu();
        }
        }];

 //   $scope.chartObject=[{},{},{},{}];


    angular.element(document).ready(function () {
        console.log('****DOCUMENT READY******');
    });

    $scope.generateTCChart = function(id,chartTitle, hrs)
    {
        var monitors = [];


     var canvases = document.getElementById('superman');
        //console.log ("**** FOUND " + canvases.length + "CANVASES");
       // for (var i = 0; i < canvases.length; i++) {
      //      console.log ("*** FOUND CANVAS");
            //context.push(canvases[i].getContext('2d'));
     //   }
         var dateRange = "";
        var startDate = "";
        var endDate = "";
        $scope.barHeight=$rootScope.devHeight;

         if (hrs) {
            // Apply a time based filter if I am not watching all events
            var cur = moment();
            endDate = cur.format("YYYY-MM-DD hh:mm:ss");
            startDate = cur.subtract(hrs, 'hours').format("YYYY-MM-DD hh:mm:ss");
            console.log("Start and End " + startDate + "==" + endDate);

        }

        var loginData = ZMDataModel.getLogin();


         $scope.data={};
         $scope.data = {
      labels: [],
      datasets: [
        {
          label: '',
           fillColor: 'rgba(151,187,205,0.5)',
          strokeColor: 'rgba(151,187,205,0.8)',
          highlightFill: 'rgba(151,187,205,0.75)',
          highlightStroke: 'rgba(151,187,205,1)',
          data: []
        },
          ]
    };

          ZMDataModel.getMonitors(0).then(function (data) {

            monitors = data;
            var adjustedHeight = monitors.length * 30;
            if (adjustedHeight > $rootScope.devHeight) {

               $scope.barHeight = adjustedHeight;
                console.log ("********* BAR HEIGHT TO "+$scope.barHeight);
            }

            for (var i = 0; i < monitors.length; i++) {
                (function (j) { // loop closure - http is async, so success returns after i goes out of scope
                    // so we need to bind j to i when http returns so its not out of scope. Gak.
                    // I much prefer the old days of passing context data from request to response

                    $scope.data.labels.push(monitors[j].Monitor.Name);
                   //$scope.chartObject[id].data.push([monitors[j].Monitor.Name,'0','color:#76A7FA','0']);
                    // $scope.chartObject.data[j+1]=([monitors[j].Monitor.Name,'100','color:#76A7FA','0']);

                    var dateString = "";
                    if (hrs) {
                        dateString = "/StartTime >=:" + startDate + "/EndTime <=:" + endDate;
                    }
                    var url = loginData.apiurl +
                        "/events/index/MonitorId:" + monitors[j].Monitor.Id + dateString +
                        ".json?page=1";
                   // console.log("Monitor event URL:" + url);
                    if (!ZMDataModel.isSimulated()) {
                        $http.get(url /*,{timeout:15000}*/ )
                            .success(function (data) {
                                console.log("**** EVENT COUNT FOR MONITOR " +
                                    monitors[j].Monitor.Id + " IS " + data.pagination.count);


                            $scope.data.datasets[0].data[j] = data.pagination.count;



                            })
                            .error(function (data) {
                                // ideally I should be treating it as an error
                                // but what I am really doing now is treating it like no events
                                // works but TBD: make this into a proper error handler


                             $scope.data.datasets[0].data[j] = 0;

                            });
                    } // is not simulated
                    else // simulated: grab a random event count
                    {
                        var rndEventCount = Math.floor(Math.random() * (100 - 20 + 1)) + 20;
                         $scope.data.datasets[0].data[j] = rndEventCount;

                    }
                })(i); // j

            } //for

        });




         $scope.options =  {

      // Sets the chart to be responsive
      responsive: true,


      //Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
      scaleBeginAtZero : true,

      //Boolean - Whether grid lines are shown across the chart
      scaleShowGridLines : false,

      //String - Colour of the grid lines
      scaleGridLineColor : "rgba(0,0,0,.05)",

      //Number - Width of the grid lines
      scaleGridLineWidth : 1,

      //Boolean - If there is a stroke on each bar
      barShowStroke : true,

      //Number - Pixel width of the bar stroke
      barStrokeWidth : 2,

      //Number - Spacing between each of the X value sets
      barValueSpacing : 5,

      //Number - Spacing between data sets within X values
      barDatasetSpacing : 1,

      //String - A legend template
    //  legendTemplate : '<ul class="tc-chart-js-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].fillColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
    };



    };




}]);
