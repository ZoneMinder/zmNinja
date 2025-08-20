/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

// controller for State View

angular.module('zmApp.controllers').controller('zmApp.StateCtrl', ['$ionicPopup', '$scope', 'zm', 'NVR', '$ionicSideMenuDelegate', '$ionicLoading', '$ionicModal', '$state', '$http', '$rootScope', '$timeout', '$ionicHistory', '$translate', '$stateParams', 'EventServer', function (
  $ionicPopup, $scope, zm, NVR, $ionicSideMenuDelegate, $ionicLoading, $ionicModal, $state, $http, $rootScope, $timeout, $ionicHistory, $translate, $stateParams, EventServer) {

  //----------------------------------------------------------------------
  // Controller main
  //----------------------------------------------------------------------
  $scope.zmRun = "...";
  $scope.zmLoad = "...";
  $scope.zmDisk = "...";
  $scope.color = "";
  $scope.showDanger = false;
  $scope.dangerText = [$translate.instant('kStateShowControls'), $translate.instant('kStateHideControls')];
  $scope.dangerButtonColor = ["button-positive", "button-assertive"];
  $scope.customState = "";
  $scope.allStateNames = [];

  $rootScope.zmPopup = "";

  var loginData = NVR.getLogin();

  var apiRun = loginData.apiurl + "/host/daemonCheck.json?"+$rootScope.authSession;
  var apiESRestart = loginData.apiurl + '/host/daemonControl/zmeventnotification.pl/restart.json?'+$rootScope.authSession;
  var apiLoad = loginData.apiurl + "/host/getLoad.json?"+$rootScope.authSession;
  var apiStorage = loginData.apiurl + "/storage.json?"+$rootScope.authSession;
  var apiServer = loginData.apiurl + "/servers.json?"+$rootScope.authSession;
  var apiCurrentState = loginData.apiurl + "/States.json?"+$rootScope.authSession;

  var apiExec = loginData.apiurl + "/states/change/";

  var inProgress = 0; // prevents user from another op if one is in progress
  getRunStatus();
  getLoadStatus();
  getCurrentState();
  getStorageStatus();
  getServerStatus();

$scope.getEventServerState = function() {
  return EventServer.getState();
};

// credit https://stackoverflow.com/a/14919494/1361529
  $scope.humanFileSize = function(bytes, si) {
    var thresh = si ? 1000 : 1024;
    bytes = parseFloat(bytes);
    if (isNaN(bytes)) bytes=0;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = si? ['kB','MB','GB','TB','PB','EB','ZB','YB']:['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
};

$scope.matchServer = function (id) {
  var str = id;
  var name = "";
  for (var i=0; i< $scope.servers.length; i++) {
    if ($scope.servers[i].Server.Id == id) {
      name = $scope.servers[i].Server.Name;
      break;
    }
  }
  if (name) {
    str = name + " ("+id+")";
  }
  return str;
};

$scope.toggleStorage = function() {
  $scope.showStorage = !$scope.showStorage;
};

$scope.restartEventServer = function() {

  var promptstring = $translate.instant('kConfirmESRestart');
  $rootScope.zmPopup = $ionicPopup.show({
    title: $translate.instant('kPleaseConfirm'),
    template: promptstring,
    buttons: [{
        text: $translate.instant('kButtonCancel'),
        type: 'button-positive'
      },
      {
        text: $translate.instant('kButtonOk'),
        type: 'button-assertive',
        onTap: function (e) {
          NVR.debug ('Invoking '+apiESRestart);
          $http.get(apiESRestart);
        }
      }
    ]
  });
};

$scope.toggleServer = function() {
  $scope.showServer = !$scope.showServer;
};
  /*
  $timeout(function () {
          NVR.debug("invoking DiskStatus...");
          getDiskStatus();
      }, 6000);
  */
  //-------------------------------------------------------------------------
  // Lets make sure we set screen dim properly as we enter
  // The problem is we enter other states before we leave previous states
  // from a callback perspective in ionic, so we really can't predictably
  // reset power state on exit as if it is called after we enter another
  // state, that effectively overwrites current view power management needs
  //------------------------------------------------------------------------
  
  
  $scope.$on ('$ionicView.beforeEnter', function () {

    $scope.showStorage = true;
    $scope.showServer = true;

    $scope.$on ( "process-push", function () {
      NVR.debug (">> StateCtrl: push handler");
      var s = NVR.evaluateTappedNotification();
      NVR.debug("tapped Notification evaluation:"+ JSON.stringify(s));
      $ionicHistory.nextViewOptions({
        disableAnimate:true,
        disableBack: true
      });
      $state.go(s[0],s[1],s[2]);
    });
  });
  
  $scope.$on('$ionicView.enter', function () {
    // console.log("**VIEW ** Montage Ctrl Entered");
    NVR.setAwake(false);

  });

  $scope.$on('$ionicView.afterEnter', function () {
    // console.log("**VIEW ** Montage Ctrl Entered");

   // console.log("STATE SHORTCUT: " + JSON.stringify($stateParams));
    $stateParams.shortcut && $stateParams.shortcut.fn &&
      $scope[$stateParams.shortcut.fn]($stateParams.shortcut.fnargs); // jshint ignore:line

  });

  //---------------------------------------------------------
  // This gets the current run state custom name
  // if applicable
  //---------------------------------------------------------
  function getCurrentState() {
    NVR.debug("StateCtrl: getting state using " + apiCurrentState);
    $http.get(apiCurrentState)
      .then(
        function (success) {
          NVR.debug("State results: " + JSON.stringify(success));
          var customStateArray = success.data.states;
          var i = 0;
          var found = false;
          $scope.allStateNames = [];
          for (i = 0; i < customStateArray.length; i++) {
            $scope.allStateNames.push(customStateArray[i].State.Name);
            if (customStateArray[i].State.IsActive == '1') {
              $scope.customState = customStateArray[i].State.Name;
              found = true;
            }
          }
          if (!found) $scope.customState = "";

        },
        function (error) {
          NVR.debug("StateCtrl: Error retrieving state list " + JSON.stringify(error));
          $scope.customState = "";

        }
      );

  }

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
    }
  };

  //---------------------------------------------------------
  // Allows the user to select a custom run state
  //---------------------------------------------------------
  $scope.selectCustomState = function () {
    selectCustomState();
  };

  function selectCustomState() {
    $scope.myopt = {
      selectedState: ""
    };
    //console.log(JSON.stringify($scope.allStateNames));
    NVR.log("List of custom states: " + JSON.stringify($scope.allStateNames));
    $rootScope.zmPopup = $ionicPopup.show({
      scope: $scope,
      template: '<ion-radio-fix ng-repeat="item in allStateNames" ng-value="item" ng-model="myopt.selectedState"> {{item}} </ion-radio-fix>',

      title: $translate.instant('kSelectRunState'),
      subTitle: $translate.instant('kCurrentState') + $scope.customState ? ($translate.instant('kCurrentState') + ": " + $scope.customState) : "",
      buttons: [{
          text: $translate.instant('kButtonCancel'),
          onTap: function (e) {
            return "CANCEL";
          }

        },
        {
          text: $translate.instant('kButtonOk'),
          onTap: function (e) {
            return "OK";

          }
        }
      ]
    });

    // It seems invoking a popup within a popup handler
    // causes issues. Doing this outside due to that reason
    $rootScope.zmPopup.then(function (res) {
      // console.log("GOT : " + JSON.stringify(res));
      if (res == "OK") {
        if ($scope.myopt.selectedState != "")
          controlZM($scope.myopt.selectedState);
      }
    });
  }

  //----------------------------------------------------------------------
  // returns Storage data
  //----------------------------------------------------------------------
  function getStorageStatus() {

    $scope.storage = [];
    NVR.debug("StorageStatus: " + apiStorage);
    $http.get(apiStorage)
      .then(
        function (success) {
        
          $scope.storage = success.data.storage;
          //console.log (JSON.stringify($scope.storage));

        },
        function (error) {
          $scope.zmDisk = "unknown";
          // console.log("ERROR:" + JSON.stringify(error));
          NVR.log("Error retrieving DiskStatus: " + JSON.stringify(error), "error");
        }
      );
  }


   //----------------------------------------------------------------------
  // returns Storage data
  //----------------------------------------------------------------------
  function getServerStatus() {

    $scope.servers = [];
    NVR.debug("ServerStatus: " + apiStorage);
    $http.get(apiServer)
      .then(
        function (success) {
        
          $scope.servers = success.data.servers;
          if ($scope.servers.length > 0) {
            $scope.zmRun =$translate.instant('kStateMultiServer');
            $scope.color = 'grey';
          }
         // console.log (JSON.stringify($scope.storage));

        },
        function (error) {
          $scope.zmDisk = "unknown";
          // console.log("ERROR:" + JSON.stringify(error));
          NVR.log("Error retrieving DiskStatus: " + JSON.stringify(error), "error");
        }
      );
  }

  //----------------------------------------------------------------------
  // returns ZM running status
  //----------------------------------------------------------------------
  function getRunStatus() {
    NVR.debug("StateCtrl/getRunStatus: " + apiRun);
    $http.get(apiRun)
      .then(
        function (success) {
          NVR.debug("StateCtrl/getRunStatus: success");
          NVR.debug("Run results: " + JSON.stringify(success));
          switch (success.data.result) {
            case 1:
              $scope.zmRun = $translate.instant('kZMRunning');
              $scope.color = 'green';
              break;
            case 0:
              $scope.zmRun = $translate.instant('kZMStopped');
              $scope.color = 'red';
              break;
            default:
              $scope.zmRun = $translate.instant('kZMUndetermined');
              $scope.color = 'orange';

              break;
          }

          // console.log("X"+success.data.result+"X");
        },
        function (error) {
          //console.log("ERROR in getRun: " + JSON.stringify(error));
          NVR.log("Error getting RunStatus " + JSON.stringify(error), "error");
          $scope.color = 'red';
          $scope.zmRun = $translate.instant('kZMUndetermined');
        }
      );

  }

  //----------------------------------------------------------------------
  // gets ZM load - max[0], avg[1], min[2]
  //----------------------------------------------------------------------
  function getLoadStatus() {
    NVR.debug("StateCtrl/getLoadStatus: " + apiLoad);
    $http.get(apiLoad)
      .then(
        function (success) {
          NVR.debug("Load results: " + JSON.stringify(success));
          //console.log(JSON.stringify(success));
          // load returns 3 params - one in the middle is avg.
          NVR.debug("StateCtrl/getLoadStatus: success");
          $scope.zmLoad = Math.round(success.data.load[1]*10)/10;

          // console.log("X"+success.data.result+"X");
        },
        function (error) {
          //console.log("ERROR in getLoad: " + JSON.stringify(error));
          NVR.log("Error retrieving loadStatus " + JSON.stringify(error), "error");
          $scope.zmLoad = 'undetermined';
        }
      );
  }

  //----------------------------------------------------------------------
  // start/stop/restart ZM
  //----------------------------------------------------------------------

  function performZMoperation(str) {

    NVR.debug("inside performZMoperation with " + str);

    $scope.zmRun = "...";
    $scope.color = 'orange';
    $scope.customState = "";
    NVR.debug("StateCtrl/controlZM: POST Control command is " + apiExec + str + ".json");
    inProgress = 1;
    $http.post(apiExec + str + ".json?"+$rootScope.authSession)
      .then(
        function (success) {
          NVR.debug("StateCtrl/controlZM: returned success with:"+JSON.stringify(success));
          inProgress = 0;
          switch (str) {
            case "stop":
              $scope.zmRun = $translate.instant('kZMStopped');
              $scope.color = 'red';
              break;
            default:
              $scope.zmRun = $translate.instant('kZMRunning');
              $scope.color = 'green';
              getCurrentState();
              break;

          }

        },
        function (error) {
          //if (error.status) // it seems to return error with status 0 if ok
          // {
          //console.log("ERROR in Change State:" + JSON.stringify(error));
          NVR.debug("StateCtrl/controlZM: returned error");
          NVR.log("Error in change run state:" + JSON.stringify(error), "error");
          $scope.zmRun = $translate.instant('kZMUndetermined');
          $scope.color = 'orange';
          inProgress = 0;

        });
  }

  function controlZM(str) {
    if (inProgress) {
      NVR.debug("StateCtrl/controlZM: operation in progress");
      $ionicPopup.alert({
        title: $translate.instant('kOperationInProgressTitle'),
        template: $translate.instant('kOperationInProgressBody') + '...',
        okText: $translate.instant('kButtonOk'),
        cancelText: $translate.instant('kButtonCancel'),
      });
      return;
    }

    var statesearch = "startstoprestart";

    var promptstring = $translate.instant('kStateAreYouSure') + str + ' Zoneminder?';
    if (statesearch.indexOf(str) == -1) {
      promptstring = "Are you sure you want to change state to " + str;
    }

    $rootScope.zmPopup = $ionicPopup.show({
      title: $translate.instant('kPleaseConfirm'),
      template: promptstring,
      buttons: [{
          text: $translate.instant('kButtonCancel'),
          type: 'button-positive'
        },
        {
          text: $translate.instant('kButtonOk'),
          type: 'button-assertive',
          onTap: function (e) {
            performZMoperation(str);
          }
        }
      ]
    });

  }

  // Binder so template can call controlZM
  $scope.controlZM = function (str) {
    controlZM(str);
  };

  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

  $scope.$on('$ionicView.leave', function () {
    // console.log("**VIEW ** State Ctrl Left");
    // FIXME not the best way...
    // If the user exits a view before its complete,
    // make sure he can come back in and redo
    inProgress = 0;
  });

  $scope.doRefresh = function () {
    //console.log("***Pull to Refresh");
    NVR.debug("StateCtrl/refresh: calling getRun/Load/Disk/CurrentState");
    getRunStatus();
    getLoadStatus();
    getCurrentState();
    getStorageStatus();
    getServerStatus();
    $scope.$broadcast('scroll.refreshComplete');

  };

}]);
