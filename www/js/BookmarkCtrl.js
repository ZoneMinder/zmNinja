/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console, Masonry */

angular.module('zmApp.controllers').controller('zmApp.BookmarkCtrl', ['$scope', '$rootScope', '$ionicModal', 'NVR', '$ionicSideMenuDelegate', '$ionicHistory', '$state', '$translate', '$q', '$templateRequest', '$sce', '$compile', function ($scope, $rootScope, $ionicModal, NVR, $ionicSideMenuDelegate, $ionicHistory, $state, $translate, $q, $templateRequest, $sce, $compile) {
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
      $state.go("app.events", {
        "id": 0,
        "playEvent": false
      }, {
        reload: true
      });
      return;
    }
  };


  //-------------------------------------------------------------------------
  // Lets make sure we set screen dim properly as we enter
  // The problem is we enter other states before we leave previous states
  // from a callback perspective in ionic, so we really can't predictably
  // reset power state on exit as if it is called after we enter another
  // state, that effectively overwrites current view power management needs
  //------------------------------------------------------------------------
  $scope.$on('$ionicView.beforeEnter', function () {
    //console.log("**VIEW ** Help Ctrl Entered");
    NVR.setAwake(false);

    $scope.bookmarks = [];



    $scope.bookmarks.push({
      text: "Change State",
      state: "app.state",
      params: {
        shortcut: {
          fn: "selectCustomState",
          fnargs: null,
        }
      }
    }, {
      text: "Stop ZM",
      state: "app.state",
      params: {
        shortcut: {
          fn: "controlZM",
          fnargs: 'stop',
        }
      },
    }, {
      text: "Start ZM",
      state: "app.state",
      params: {
        shortcut: {
          fn: "controlZM",
          fnargs: 'start',
        }
      },
    }, {
      text: "Restart ZM",
      state: "app.state",
      params: {
        shortcut: {
          fn: "controlZM",
          fnargs: 'restart',
        }
      },
    });

    $scope.bookmarks.push({
      text: ""
    });


  });

  $scope.action = function (item) {

    $ionicHistory.nextViewOptions({
      historyRoot: true,
      disableAnimate: true,
      expire: 300
    });
    //console.log("GOIN WITH " + JSON.stringify(item.params));
    $state.go(item.state, item.params);
  };

}]);
