// This controller generates a graph for events
// the main function is generateChart. I call generate chart with required parameters
// from the template file

// FIXME: I need to clean this up, the animation is stupid because the data loads
// dynamically

angular.module('zmApp.controllers').controller('zmApp.EventsGraphsCtrl', function ($ionicPlatform, $scope, ZMDataModel, $ionicSideMenuDelegate, $rootScope, $http) {
    console.log("Inside Graphs controller");
    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    }

     $scope.$on('$ionicView.loaded', function(){
    console.log("**VIEW ** Graph Ctrl Loaded");
  });

    $scope.$on('$ionicView.enter', function(){
    console.log("**VIEW ** Graph Ctrl Entered");
  });

      $scope.$on('$ionicView.leave', function(){
    console.log("**VIEW ** Graph Ctrl Left");
  });

         $scope.$on('$ionicView.unloaded', function(){
    console.log("**VIEW ** Graph Ctrl Unloaded");
  });


    $scope.navTitle = 'Tab Page';
    $scope.leftButtons = [{
        type: 'button-icon icon ion-navicon',
        tap: function (e) {
            $scope.toggleMenu();
        }
        }];

    $scope.generateChart = function (chartTitle) {

        $scope.chartObject = {};
        $scope.chartObject.data = [
        ['Monitor', 'Events', {
                role: 'style'
        }, {
                role: 'annotation'
        }],
        ['', 0, '', ''] // needed to get rid of the initial error of charts
                        // FIXME: does it really work? I noticed the red warning
                        // coming up on the device
      ];


        $scope.chartObject.type = "BarChart";
        $scope.chartObject.options = {
            title: chartTitle,

            height: $rootScope.devHeight, // FIXME: I need to make this dynamic depending on
            // # of bars
            legend: 'none',
            animation: {
                duration: 700,
                easing: 'out',
                startup: 'false',
            },


        }

        var monitors = [];
        var loginData = ZMDataModel.getLogin();
        console.log("*** Grabbing lists of events and monitors ");
        ZMDataModel.getMonitors(0).then(function (data) {

            monitors = data;
            var adjustedHeight = monitors.length * 30;
            if (adjustedHeight > $rootScope.devHeight)
            {
                console.log ("Readjusting chart height to " + adjustedHeight + " pixels");
                $scope.chartObject.options.height = adjustedHeight;
            }
            for (var i = 0; i < monitors.length; i++) {
                (function (j) { // loop closure - http is async, so success returns after i goes out of scope
                    // so we need to bind j to i when http returns so its not out of scope. Gak.
                    // I much prefer the old days of passing context data from request to response

                    var url = loginData.apiurl +
                        "/events/index/MonitorId:" + monitors[j].Monitor.Id + // FIXME: need to add hr/week
                        ".json?page=1";
                    console.log("Monitor event URL:" + url);
                    if (!ZMDataModel.isSimulated())
                    {
                    $http.get(url /*,{timeout:15000}*/)
                        .success(function (data) {
                            console.log("**** EVENT COUNT FOR MONITOR " +
                                monitors[j].Monitor.Id + " IS " + data.pagination.count);

                            console.log("Pushing " + monitors[j].Monitor.Name +
                                " AND " + data.pagination.count);

                            $scope.chartObject.data.push([monitors[j].Monitor.Name, data.pagination.count,
                          'opacity: 0.4', data.pagination.count]);

                        })
                        .error(function (data) {
                            // ideally I should be treating it as an error
                            // but what I am really doing now is treating it like no events
                            // works but TBD: make this into a proper error handler
                            console.log("**** EVENT COUNT FOR MONITOR " +
                                monitors[i].Monitor.Id + " IS ERROR ");
                            $scope.chartObject.data.push([monitors[j].Monitor.Name,
                                                      0, 'opacity: 0.4', 0]);

                        });
                    } // is not simulated
                    else // simulated: grab a random event count
                    {
                        var rndEventCount = Math.floor(Math.random() * (100 - 20 + 1)) + 20;
                        $scope.chartObject.data.push([monitors[j].Monitor.Name, rndEventCount,
                          'opacity: 0.4', rndEventCount]);

                    }
                })(i); // j

            } //for

        });

    }; // scope function

});
