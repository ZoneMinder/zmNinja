/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,moment */

angular.module('zmApp.controllers').controller('zmApp.LogCtrl', ['$scope', '$rootScope', 'zm', '$ionicModal', 'NVRDataModel', '$ionicSideMenuDelegate', '$fileLogger', '$cordovaEmailComposer', '$ionicPopup', '$timeout', '$ionicHistory', '$state', '$interval', '$ionicLoading', '$translate', '$http', function ($scope, $rootScope, zm, $ionicModal, NVRDataModel, $ionicSideMenuDelegate, $fileLogger, $cordovaEmailComposer, $ionicPopup, $timeout, $ionicHistory, $state, $interval, $ionicLoading, $translate, $http) {
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

  //---------------------------------------------------------------
  // Controller main
  //---------------------------------------------------------------

  var intervalLogUpdateHandle;

  document.addEventListener("pause", onPause, false);
  document.addEventListener("resume", onResume, false);

  function onPause() {
    NVRDataModel.debug("LogCtrl: pause called, killing log timer");
    // $interval.cancel(intervalLogUpdateHandle);
  }

  function onResume() {
    // NVRDataModel.debug("LogCtrl: resume called, starting log timer");
    loadLogs();
  }



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

  //--------------------------------------------------------------------------
  // Make sure user knows information masking is best effort
  //--------------------------------------------------------------------------

  $scope.sendEmail = function (logstring) {
    logstring = logstring.substring(0, 20000);
    $ionicPopup.confirm({
        title: $translate.instant('kSensitiveTitle'),
        template: $rootScope.appName + ' ' + $translate.instant('kSensitiveBody'),
        okText: $translate.instant('kButtonOk'),
        cancelText: $translate.instant('kButtonCancel'),
      })
      .then(function (res) {
        if (res) {

          logstring = "zmNinja version:" + $scope.zmAppVersion +
            " (" + $rootScope.platformOS + ")\n" +
            "ZoneMinder version:" + NVRDataModel.getCurrentServerVersion() + "\n" +
            logstring;
          sendEmailReally(logstring);
        }

      });
  };


  $scope.attachLogs = function() {

    cordova.plugins.email.isAvailable(
      function (isAvailable) {

        if (isAvailable) {
          
       
           $fileLogger.checkFile()
           .then (function (d) {

              var url = cordova.file.dataDirectory + d.name;
              console.log ( "URL:"+url);
              cordova.plugins.email.open({
                to: zm.authoremail,
                subject: $rootScope.appName + ' logs attached',
                body: 'logs are attached',
                attachments: url
  
              });
           },
           function (e) {
              NVRDataModel.debug ("Error attaching log file:"+JSON.stringify(e));
           });

           

        } else {
          // kEmailNotConfigured		
          $rootScope.zmPopup = SecuredPopups.show('alert', {
            title: $translate.instant('kError'),
            template: $translate.instant('kEmailNotConfigured'),
            okText: $translate.instant('kButtonOk'),
            cancelText: $translate.instant('kButtonCancel'),
          });
        }

      });
  };
  //--------------------------------------------------------------------------
  // Convenience function to send logs via email
  //--------------------------------------------------------------------------
  function sendEmailReally(logstring) {

    //console.log ("LOGSTRING:"+logstring);
    if (window.cordova) {

      // do my best to replace sensitive information
      var loginData = NVRDataModel.getLogin();

      // We don't need this anymore as log and debug now strip passwords
      /*if (loginData.password !="")
      {
          var re1 = new RegExp(loginData.password, "g");
          logstring = logstring.replace(re1, "<deleted>");
      }*/
      // keep the protocol, helps to debug
      var urlNoProtocol = loginData.url.replace(/.*?:\/\//, "");
      if (urlNoProtocol != "") {
        var re2 = new RegExp(urlNoProtocol, "g");
       
        logstring = logstring.replace(re2, "<server>");
      }
      urlNoProtocol = loginData.streamingurl.replace(/.*?:\/\//, "");
      if (urlNoProtocol != "") {
        var re3 = new RegExp(urlNoProtocol, "g");
        logstring = logstring.replace(re3, "<server>");
      }

      urlNoProtocol = loginData.eventServer.replace(/.*?:\/\//, "");
      if (urlNoProtocol != "") {
        var re4 = new RegExp(urlNoProtocol, "g");
        logstring = logstring.replace(re4, "<server>");
      }

      //console.log ("NEW LOGSTRING:"+logstring);
      /* window.plugins.emailComposer.showEmailComposerWithCallback(callback, $rootScope.appName + ' logs', logstring, [zm.authoremail]);*/


      cordova.plugins.email.isAvailable(
        function (isAvailable) {

          if (isAvailable) {
            // body encapsulation requires br :^
            // see https://github.com/katzer/cordova-plugin-email-composer/issues/150
            logstring = logstring.split('\n').join('<br/>');
            cordova.plugins.email.open({
              to: zm.authoremail,
              subject: $rootScope.appName + ' logs',
              body: logstring
            });
          } else {
            // kEmailNotConfigured		
            $rootScope.zmPopup = SecuredPopups.show('alert', {
              title: $translate.instant('kError'),
              template: $translate.instant('kEmailNotConfigured'),
              okText: $translate.instant('kButtonOk'),
              cancelText: $translate.instant('kButtonCancel'),
            });
          }

        });


    } else {
      // console.log("Using default email client to send data");

      var fname = $rootScope.appName + "-logs-" +
        moment().format('MMM-DD-YY_HH-mm-ss') + ".txt";

      var blob = new Blob([logstring], {
        type: "text/plain;charset=utf-8"
      });
      saveAs(blob, fname);
    }

  }

  function callback() {
    // console.log ("EMAIL SENT");
    NVRDataModel.debug("Email sent callback called");
  }

  function loadZMlogs() {
    var ld = NVRDataModel.getLogin();
    var lapi = ld.apiurl + "/logs.json?sort=TimeKey&direction=desc&page=" + $scope.zmPage;
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
          NVRDataModel.log("Error getting ZM logs:" + JSON.stringify(error));
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

    $scope.$on ( "process-push", function () {
      NVRDataModel.debug (">> LogCtrl: push handler");
      var s = NVRDataModel.evaluateTappedNotification();
      NVRDataModel.debug("tapped Notification evaluation:"+ JSON.stringify(s));
      $ionicHistory.nextViewOptions({
        disableAnimate:true,
        disableBack: true
      });
      $state.go(s[0],s[1],s[2]);
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
    NVRDataModel.setAwake(false);
    $scope.logEntity = $rootScope.appName;
    $scope.zmPage = 1;
    $scope.zmMaxPage = 1;

    $scope.log = {
      logString: ""
    };

    $scope.zmAppVersion = NVRDataModel.getAppVersion();

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
