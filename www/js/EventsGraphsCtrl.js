angular.module('zmApp.controllers').controller('zmApp.EventsGraphsCtrl', function ($ionicPlatform, $scope, ZMDataModel, $ionicSideMenuDelegate, $rootScope, $http) {
 console.log("Inside Graphs controller");
    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    }

     $scope.navTitle = 'Tab Page';
    $scope.leftButtons = [{
        type: 'button-icon icon ion-navicon',
        tap: function (e) {
            $scope.toggleMenu();
        }
        }];

    $scope.generateChart = function(chartTitle)
    {
        //alert ("Well I got called!");
        $scope.chartObject = {}; //test
    $scope.chartObject.data = [
        ['Monitor', 'Events', {
            role: 'style'
        }, {
            role: 'annotation'
        }],
        ['', 0, '', ''] // needed to get rid of the initial error of charts
      ];


    $scope.chartObject.type = "BarChart";
    $scope.chartObject.options = {
        title: chartTitle,
        height: $rootScope.devHeight,
        animation: {
            duration: 700,
            easing: 'out',
            startup: 'false',
        },


    }

    var monitors = [];
    console.log("*** Grabbing lists of events and monitors ");
    ZMDataModel.getMonitors(0).then(function (data) {

        monitors = data;
        var loginData = ZMDataModel.getLogin();
        //var events = ZMDataModel.getAllPreexistingEvents();
        // lets get the event count for all
        for (var i = 0; i < monitors.length; i++) {
            (function (j) {
                //monevents[monitors[j].Monitor.Id].monName = monitors[j].Monitor.Name;

                var url = loginData.apiurl + 
                    "/events/index/MonitorId:" + monitors[j].Monitor.Id + 
                    ".json?page=1";
                console.log("Monitor event URL:" + url);
                $http.get(url)
                    .success(function (data) {
                        console.log("**** EVENT COUNT FOR MONITOR " + 
                                    monitors[j].Monitor.Id + " IS " + data.pagination.count);

                        console.log("Pushing " + monitors[j].Monitor.Name + 
                                    " AND " + data.pagination.count);
                        
                        $scope.chartObject.data.push
                        ([monitors[j].Monitor.Name, data.pagination.count, 
                          'opacity: 0.4', data.pagination.count]); 

                    })
                    .error(function (data) {
                        console.log("**** EVENT COUNT FOR MONITOR " + 
                                    monitors[i].Monitor.Id + " IS ERROR ");
                        $scope.chartObject.data.push([monitors[j].Monitor.Name, 
                                                      0, 'opacity: 0.4', 0]);
                      
                    });

            })(i); // j

        } //for

    });

    }; // scope function





});
