/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,moment */

angular.module('zmApp.controllers')
  .controller('zmApp.EventDateTimeFilterCtrl', ['$scope', '$ionicSlideBoxDelegate', '$ionicSideMenuDelegate', '$rootScope', '$ionicHistory', 'NVR', '$state', function ($scope, $ionicScrollDelegate, $ionicSideMenuDelegate, $rootScope, $ionicHistory, NVR, $state) {

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
          $state.go("app.events", {
            "id": 0,
            "playEvent": false
          }, {
            reload: true
          });
          return;
        }
      };

      $scope.$on('$ionicView.beforeLeave', function () {
        
      });

      $scope.$on('$ionicView.beforeEnter', function () {
        $scope.today = moment().format("YYYY-MM-DD");
        $scope.monitors = NVR.getMonitorsNow();
        if (!$scope.monitors.length) {
          NVR.getMonitors(1)
          .then (function (data) {
            $scope.monitors = data;
            for (var i=0; i < $scope.monitors.length; i++) {
              if ($scope.monitors[i].Monitor.isChecked == undefined)
               $scope.monitors[i].Monitor.isChecked = true;
            }
          });
        }
        else {
          for (var i=0; i < $scope.monitors.length; i++) {
            if ($scope.monitors[i].Monitor.isChecked == undefined)
               $scope.monitors[i].Monitor.isChecked = true;
          }
        }
        $scope.monitorsExpanded = false;
      });

      $scope.toggleMonitors = function() {
        $scope.monitorsExpanded = !$scope.monitorsExpanded;

      };
      //--------------------------------------------------------------------------
      // Clears filters 
      //--------------------------------------------------------------------------

      $scope.removeFilters = function () {
        $rootScope.isEventFilterOn = false;
        $rootScope.fromDate = "";
        $rootScope.fromTime = "";
        $rootScope.toDate = "";
        $rootScope.toTime = "";
        $rootScope.fromString = "";
        $rootScope.toString = "";
        $rootScope.monitorsFilter = '';

        // if you come here via the events pullup
        // you are looking at a specific monitor ID
        // going back will only retain that monitor ID
        // so lets reload with all monitors
        // 
        

        if ($ionicHistory.backTitle() == 'Timeline') {
          $ionicHistory.nextViewOptions({
            disableBack: true
          });
          $state.go("app.timeline", {
            "id": 0,
            "playEvent": false
          });
          return;
        } else // in events, backview is undefined?
        {
          $ionicHistory.nextViewOptions({
            disableBack: true
          });
          $state.go("app.events", {
            "id": 0,
            "playEvent": false
          });
          return;
        }

        //$ionicHistory.goBack();
      };

      //--------------------------------------------------------------------------
      // Saves filters in root variables so EventFilter can access it. I know:
      // don't root.
      //--------------------------------------------------------------------------
      $scope.saveFilters = function () {
        // only reset date/time if at least one of them is set.
        if ($rootScope.fromDate || $rootScope.toDate || $rootScope.fromTime || $rootScope.toTime) {
            if (!$rootScope.fromDate) {
              //console.log("RESET fromDate");
              $rootScope.fromDate = new Date();
              NVR.debug("DateTimeFilter: resetting from date");
            }

            if (!$rootScope.toDate) {
              // console.log("RESET toDate");
              $rootScope.toDate = new Date();
              NVR.debug("DateTimeFilter: resetting to date");
            }

            if (!$rootScope.fromTime) {
              // console.log("RESET fromTime");
              $rootScope.fromTime = new Date(99, 5, 24, 0, 0, 0, 0); //moment().format("hh:mm:ss");
              NVR.debug("DateTimeFilter: resetting from time");
            }

            if (!$rootScope.toTime) {
              //console.log("RESET toTime");
              $rootScope.toTime = new Date(99, 5, 24, 23, 59, 59, 0);
              //$rootScope.toTime = "01:01:02"; //moment().format("hh:mm:ss");
              NVR.debug("DateTimeFilter: resetting to time");
            }

            if ($rootScope.fromDate > $rootScope.toDate) {
              NVR.log("From date > To Date, swapping");
              var t = $rootScope.fromDate;
              $rootScope.fromDate = $rootScope.toDate;
              $rootScope.toDate = t;
            }
            
            $rootScope.fromString = moment($rootScope.fromDate).format("YYYY-MM-DD") + " " + moment($rootScope.fromTime).format("HH:mm:ss");

            $rootScope.toString = moment($rootScope.toDate).format("YYYY-MM-DD") + " " + moment($rootScope.toTime).format("HH:mm:ss");
        }
        else {
            $rootScope.fromDate = null;
            $rootScope.toDate = null;
            $rootScope.fromTime = null;
            $rootScope.toTime = null;
            $rootScope.fromString = null;
            $rootScope.toString = null;
        }

        $rootScope.isEventFilterOn = true;

        //console.log("CONCAT DATES " + temp);
        //
        // var startDate = moment(temp).format("YYYY-MM-DD hh:mm:ss");
        NVR.debug("DateTimeFilter: From/To is now: " + $rootScope.fromString + " & " + $rootScope.toString);

        $ionicHistory.nextViewOptions({
          disableBack: true
        });

        var includeString='';
        var excludeString='';
        var totalUnchecked = 0;
        var totalChecked = 0;

        for (var i=0; i < $scope.monitors.length; i++) {
          if ($scope.monitors[i].Monitor.isChecked) {
            totalChecked += 1;
            includeString = includeString + '/'+'MonitorId =:'+$scope.monitors[i].Monitor.Id;
          }
          else {
            totalUnchecked +=1;
            excludeString = excludeString + '/'+'MonitorId !=:'+$scope.monitors[i].Monitor.Id;
          }
        }
        if (!totalUnchecked) {
          $rootScope.monitorsFilter = '';
        } else {
          if (totalUnchecked >= totalChecked) {
            $rootScope.monitorsFilter = includeString;
          }
          else {
            $rootScope.monitorsFilter = excludeString;
          }
        }

        
        //console.log (">>>>>>>>>>>>> MON FILTER="+$rootScope.monitorsFilter);

        //console.log (" >>>>>>>> BACK VIEW = "+$ionicHistory.backTitle());

        if ($ionicHistory.backTitle() == 'Timeline') {
            $ionicHistory.nextViewOptions({
              disableBack: true
            });
            $state.go("app.timeline", {
              "id": 0,
              "playEvent": false
            });
            return;
          } else // in events, backview is undefined?
          {
            $ionicHistory.nextViewOptions({
              disableBack: true
            });
            $state.go("app.events", {
              "id": 0,
              "playEvent": false
            });
            return;
          }

       
      };

    }

  ]);
