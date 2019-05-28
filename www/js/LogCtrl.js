/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,moment */

angular.module('zmApp.controllers').controller('zmApp.LogCtrl', ['$scope', '$rootScope', 'zm', '$ionicModal', 'NVR', '$ionicSideMenuDelegate', '$fileLogger', '$cordovaEmailComposer', '$ionicPopup', '$timeout', '$ionicHistory', '$state', '$interval', '$ionicLoading', '$translate', '$http', 'SecuredPopups', function ($scope, $rootScope, zm, $ionicModal, NVR, $ionicSideMenuDelegate, $fileLogger, $cordovaEmailComposer, $ionicPopup, $timeout, $ionicHistory, $state, $interval, $ionicLoading, $translate, $http, SecuredPopups) {
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

  //---------------------------------------------------------------
  // Controller main
  //---------------------------------------------------------------





  $scope.flipLogs = function () {
    if ($scope.logEntity == 'ZoneMinder')
      $scope.logEntity = $rootScope.appName;
    else
      $scope.logEntity = 'ZoneMinder';
    //console.log ("Flipped");
    loadLogs();

  };

  $scope.deleteLogs = function () {

    $rootScope.zmPopup = $ionicPopup.confirm({
      title: $translate.instant('kPleaseConfirm'),
      template: $translate.instant('kDeleteLogsConfirm'),
      okText: $translate.instant('kButtonOk'),
      cancelText: $translate.instant('kButtonCancel'),
    });

    $rootScope.zmPopup.then(function (res) {
      if (res) {
        $fileLogger.deleteLogfile().then(function () {
          //console.log('Logfile deleted');
          $fileLogger.setStorageFilename(zm.logFile);
          $scope.log.logString = "";
        });
      }
    });
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


  // desktop download
  $scope.downloadLogs = function () {
    var body = "zmNinja version:" + $scope.zmAppVersion +
      " (" + $rootScope.platformOS + ")\n" +
      "ZoneMinder version:" + NVR.getCurrentServerVersion()+"\n\n";

    body = $translate.instant('kSensitiveBody') + '\n\n\n' + body;
    var fname = $rootScope.appName + "-logs-" +
      moment().format('MMM-DD-YY_HH-mm-ss') + ".txt";

    $fileLogger.checkFile()
      .then(function (d) {

        body = body + window.localStorage[d.name];
        var file = new Blob([body], {
          type: 'text/plain'
        });
        var url = URL.createObjectURL(file);

        $rootScope.zmPopup = SecuredPopups.show('alert', {
            title: $translate.instant('kNote'),
            template: $translate.instant('kTapDownloadLogs') + "<br/><br/><center><a href='" + url + "' class='button button-assertive icon ion-android-download' download='" + fname + "'>" + " " + $translate.instant('kDownload') + "</a></center>",
            okText: $translate.instant('kDismiss'),
            okType: 'button-stable'
          },
          function (e) {
            NVR.debug("Error getting log file:" + JSON.stringify(e));
          }

        );

      });


  };

  // mobile - picks up applogs on the FS and sends an email with it

  $scope.attachLogs = function () {
    var body = "zmNinja version:" + $scope.zmAppVersion +
      " (" + $rootScope.platformOS + ")<br/>" +
      "ZoneMinder version:" + NVR.getCurrentServerVersion() + "<br/>";
    body = '<b>' + $translate.instant('kSensitiveBody') + '</b><br/><br/>' + body;

    $fileLogger.checkFile()
      .then(function (d) {
          var fileWithPath = cordova.file.dataDirectory + d.name;
          NVR.log("file location:" + fileWithPath);

          var onSuccess = function (result) {
            NVR.log("Share completed? " + result.completed);
            NVR.log("Shared to app: " + result.app);
          };

          var onError = function (msg) {
            NVR.log("Sharing failed with message: " + msg);
          };

          window.plugins.socialsharing.shareViaEmail(
            body, //body
            'zmNinja Logs attached', // subject
            [zm.authoremail], //to
            null, // cc
            null, //bcc
            [fileWithPath],
            onSuccess,
            onError
          );

        },
        function (e) {
          NVR.debug("Error attaching log file:" + JSON.stringify(e));
        });


  };


  function loadZMlogs() {
    var ld = NVR.getLogin();
    var lapi = ld.apiurl + "/logs.json?sort=TimeKey&direction=desc&page=" + $scope.zmPage+$rootScope.authSession;
    $http.get(lapi)
      .then(function (success) {
          $ionicLoading.hide();
          $scope.zmMaxPage = success.data.pagination.pageCount;
          // console.log ("PAGES="+$scope.zmMaxPage);
          var tLogs = "";
          // console.log (JSON.stringify(success));
          for (var i = 0; i < success.data.logs.length; i++) {
            tLogs = tLogs + moment.unix(success.data.logs[i].Log.TimeKey).format("MM/DD/YY hh:mm:ss") + " " +
              success.data.logs[i].Log.Code + " " +
              success.data.logs[i].Log.Message + "\n";
          }
          $scope.log.logString = tLogs;
        },
        function (error) {
          NVR.log("Error getting ZM logs:" + JSON.stringify(error));
          $scope.log.logString = "Error getting log: " + JSON.stringify(error);


        });

  }

  $scope.selectToggle = function () {
    $scope.selectOn = !$scope.selectOn;
  };

  $scope.changePage = function (p) {
    $scope.zmPage = $scope.zmPage + p;
    if ($scope.zmPage < 1) $scope.zmPage = 1;
    if ($scope.zmPage > $scope.zmMaxPage) $scope.zmPage = $scope.zmMaxPage;
    loadLogs();
  };

  function loadLogs() {
    //console.log ("GETTING LOGS");

    $ionicLoading.show({
      template: $translate.instant('kLoading'),
      noBackdrop: true,
      duration: zm.loadingTimeout

    });

    if ($scope.logEntity == $rootScope.appName) {
      $fileLogger.getLogfile().then(function (l) {

          $scope.log.logString = l.split('\n').reverse().join('\n');
          //$scope.log.logString = l;

          $ionicLoading.hide();
        },
        function (error) {
          $scope.log.logString = "Error getting log: " + JSON.stringify(error);
          $ionicLoading.hide();
        });
    } else
      loadZMlogs();

  }

  //-------------------------------------------------------------------------
  // Lets make sure we set screen dim properly as we enter
  // The problem is we enter other states before we leave previous states
  // from a callback perspective in ionic, so we really can't predictably
  // reset power state on exit as if it is called after we enter another
  // state, that effectively overwrites current view power management needs
  //------------------------------------------------------------------------


  $scope.$on('$ionic.beforeEnter', function () {

    $scope.$on("process-push", function () {
      NVR.debug(">> LogCtrl: push handler");
      var s = NVR.evaluateTappedNotification();
      NVR.debug("tapped Notification evaluation:" + JSON.stringify(s));
      $ionicHistory.nextViewOptions({
        disableAnimate: true,
        disableBack: true
      });
      $state.go(s[0], s[1], s[2]);
    });
  });

  $scope.$on('$ionicView.enter', function () {
    //console.log("**VIEW ** Log Ctrl Entered");


    /*n $scope.cloudString = "loading...";
     window.cordova.plugin.cloudsettings.load(
       function (succ) {$scope.cloudString = JSON.stringify(succ);},
       function (err) {$scope.cloudString = JSON.stringify(err);}

     );*/

    $ionicSideMenuDelegate.canDragContent(false);
    $scope.selectOn = false;
    NVR.setAwake(false);
    $scope.logEntity = $rootScope.appName;
    $scope.zmPage = 1;
    $scope.zmMaxPage = 1;

    $scope.log = {
      logString: ""
    };

    $scope.zmAppVersion = NVR.getAppVersion();
    $scope.zmVersion = NVR.getCurrentServerVersion();

    /* intervalLogUpdateHandle = $interval(function ()
    {
        loadLogs();
        
    }.bind(this), 3000);*/

    loadLogs();

  });

  $scope.$on('$ionicView.leave', function () {
    //console.log ("Deleting Log interval...");
    // $interval.cancel(intervalLogUpdateHandle);
  });

}]);
