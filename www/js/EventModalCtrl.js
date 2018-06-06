// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,ionic, moment, Chart */

angular.module('zmApp.controllers').controller('EventModalCtrl', ['$scope', '$rootScope', 'zm', 'NVRDataModel', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$q', '$sce', 'carouselUtils', '$ionicPopup', '$translate', '$filter', 'SecuredPopups', function ($scope, $rootScope, zm, NVRDataModel, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $q, $sce, carouselUtils, $ionicPopup, $translate, $filter, SecuredPopups) {


  var playerReady = false;
  var streamState = {
    SNAPSHOT: 1,
    ACTIVE: 2, // using zms
    STOPPED: 3 // starts off in this mode
  };
  // from parent scope
  var currentEvent = $scope.currentEvent;
  var nphTimer;
  var eventQueryHandle;
  $scope.loginData = NVRDataModel.getLogin();
  $scope.currentRate = '-';
  var timeFormat = 'MM/DD/YYYY HH:mm:ss';
  var event;
  var gEvent;
  var handle;
  var showLive = true;
  var isGlobalFid = false; // true if its set to MaxScoreFrameId in events
  var eventId = 0;
  var isSnapShotEnabled = false;



  var broadcastHandles = [];
  var currentStreamState = streamState.STOPPED;

  var framearray = {

    labels: [],
    datasets: [{
      //label: '# of Votes',
      backgroundColor: 'rgba(242, 12, 12, 0.5)',
      borderColor: 'rgba(242, 12, 12, 0.5)',
      data: [],
    }]
  };

  var frameoptions = [];

  var eventImageDigits = 5; // failsafe
  $scope.currentProgress = {
    progress: 0
  };
  $scope.sliderProgress = {
    progress: 0
  };
  NVRDataModel.getKeyConfigParams(0)
    .then(function (data) {
      //console.log ("***GETKEY: " + JSON.stringify(data));
      eventImageDigits = parseInt(data);
      //NVRDataModel.log("Image padding digits reported as " + eventImageDigits);
    });

  $scope.animationInProgress = false;
  $scope.imageFit = true;
  // FIXME: This is a hack - for some reason
  // the custom slider view is messed up till the image loads
  // in modal view
  $scope.showModalRangeSider = false;
  $scope.isModalActive = true;

  $timeout(function () {
    $scope.showModalRangeSider = true;

  }, 2000);

  document.addEventListener("pause", onPause, false);
  document.addEventListener("resume", onResume, false);


  var ld = NVRDataModel.getLogin();

  $scope.currentStreamMode = ld.gapless ? 'gapless' : 'single';
  NVRDataModel.log("Using stream mode " + $scope.currentStreamMode);

  NVRDataModel.debug("EventModalCtrl called from " + $ionicHistory.currentStateName());
  // This is not needed for event mode

  NVRDataModel.debug("Setting playback to " + $scope.streamMode);


  //--------------------------------------------------------------------------------------
  // Handles bandwidth change, if required
  //
  //--------------------------------------------------------------------------------------

  var bc = $scope.$on("bandwidth-change", function (e, data) {
    // not called for offline, I'm only interested in BW switches
    NVRDataModel.debug("Got network change:" + data);
    var ds;
    if (data == 'lowbw') {
      ds = $translate.instant('kLowBWDisplay');
    } else {
      ds = $translate.instant('kHighBWDisplay');
    }
    NVRDataModel.displayBanner('net', [ds]);

    var ld = NVRDataModel.getLogin();

    $scope.singleImageQuality = (NVRDataModel.getBandwidth() == "lowbw") ? zm.eventSingleImageQualityLowBW : ld.singleImageQuality;
  });
  broadcastHandles.push(bc);

  //-------------------------------------------------------
  // we use this to reload the connkey if authkey changed
  //------------------------------------------------------

  var as = $scope.$on("auth-success", function () {

    NVRDataModel.debug("EventModalCtrl: Re-login detected, resetting everything & re-generating connkey");
    // NVRDataModel.stopNetwork("Auth-Success inside EventModalCtrl");
    $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
    //console.log ("********* OFFSET FROM AUTH SUCC");
    $timeout(function () {
      sendCommand('14', $scope.connKey, '&offset=' + $scope.currentProgress.progress);
    }, 500);
    //$timeout.cancel(eventQueryHandle);
    //eventQueryHandle  = $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);

  });
  broadcastHandles.push(as);

  //-------------------------------------------------------
  // tap to pause
  //------------------------------------------------------

  $scope.togglePause = function () {
    $scope.isPaused = !$scope.isPaused;
    NVRDataModel.debug("Paused is " + $scope.isPaused);
    sendCommand($scope.isPaused ? '1' : '2', $scope.connKey);

  };

  $scope.onPlayerReady = function (api) {

    // we need this timeout to avoid load interrupting
    // play -- I suppose its an angular digest foo thing
    //console.log ("*********** ON PLAY READY");
    NVRDataModel.debug("On Play Ready invoked");
    handle = api;
    handle.mediaElement.attr("playsinline", "");

    $ionicLoading.show({
      template: "<ion-spinner icon='ripple' class='spinner-energized'></ion-spinner><br/>" + $translate.instant('kVideoLoading') + "...",

    });
    NVRDataModel.debug("Player is ready");
    $timeout(function () {
      handle.pause();
      handle.setPlayback(NVRDataModel.getLogin().videoPlaybackSpeed);
      handle.play();
      NVRDataModel.debug("*** Invoking play");
      playerReady = true;

    }, 300);

    // window.stop();
  };

  $scope.onPlaybackUpdate = function (rate) {
    // console.log ("UPDATED RATE TO "+rate);
    var ld = NVRDataModel.getLogin();
    ld.videoPlaybackSpeed = rate;
    NVRDataModel.setLogin(ld);
  };

  $scope.onCanPlay = function () {

    //console.log ("*********** CAN PLAY");
    $ionicLoading.hide();
    NVRDataModel.debug("This video can be played");
    $scope.videoObject.config.cuepoints.points = [];
    // now set up cue points
    NVRDataModel.debug("Setting cue points..");
    NVRDataModel.debug("API-Total length:" + currentEvent.Event.Length);
    NVRDataModel.debug("Player-Total length:" + handle.totalTime / 1000);

    for (var l = 0; l < currentEvent.Frame.length; l++) {
      if (currentEvent.Frame[l].Type == 'Alarm') {
        // var ft = moment(currentEvent.Frame[l].TimeStamp);
        //var s = factor*Math.abs(st.diff(ft,'seconds'));

        var s = currentEvent.Frame[l].Delta;

        //console.log("START="+currentEvent.Event.StartTime);
        //console.log("END="+currentEvent.Frame[l].TimeStamp);
        //NVRDataModel.debug ("alarm cue at:"+s+"s");
        $scope.videoObject.config.cuepoints.points.push({
          time: s
        });
      }
    }
  };

  $scope.onVideoError = function (event) {
    $ionicLoading.hide();

    if (!$scope.isModalActive || !playerReady) return;
    NVRDataModel.debug("player reported a video error:" + JSON.stringify(event));
    $rootScope.zmPopup = SecuredPopups.show('alert', {
      title: $translate.instant('kError'),
      template: $rootScope.platformOS == 'desktop' ? $translate.instant('kVideoError') : $translate.instant('kVideoErrorMobile'),
      okText: $translate.instant('kButtonOk'),
      cancelText: $translate.instant('kButtonCancel'),
    });

  };

  //-------------------------------------------------------
  // This is what we call every zm.EventQueryInterval
  // it really only queries to get status to it can display
  // zms takes care of the display
  //------------------------------------------------------

  function checkEvent() {

    if (currentStreamState == streamState.SNAPSHOT) return;

    if ($scope.modalFromTimelineIsOpen == false) {
      NVRDataModel.log("Modal was closed in timeline, cancelling timer");
      $interval.cancel(eventQueryHandle);
      return;
    }

    //console.log ("Event timer");
    //console.log ("Event timer");

    if ($scope.defaultVideo !== undefined && $scope.defaultVideo != '') {
      //console.log("playing video, not using zms, skipping event commands");
    } else {
      processEvent('99', $scope.connKey)
        .then(function (succ) {
            $scope.checkEventOn = true;
          },
          function (err) {
            //$scope.checkEventOn = true; // umm are we sure?

          });
    }
  }

  function sendCommand(cmd, connkey, extras, rq) {
    var d = $q.defer();

    if ($scope.defaultVideo !== undefined && $scope.defaultVideo != '') {
      // console.log("playing video, not using zms, skipping event commands");
      d.resolve(true);
      return (d.promise);
    }

    var loginData = NVRDataModel.getLogin();
    //console.log("Sending CGI command to " + loginData.url);
    var rqtoken = rq ? rq : "stream";
    var myauthtoken = $rootScope.authSession.replace("&auth=", "");
    //&auth=
    $http({
        method: 'POST',
        /*timeout: 15000,*/
        url: loginData.url + '/index.php',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          //'Accept': '*/*',
        },
        transformRequest: function (obj) {
          var str = [];
          for (var p in obj)
            str.push(encodeURIComponent(p) + "=" +
              encodeURIComponent(obj[p]));
          var foo = str.join("&");
          if (extras) {
            foo = foo + extras;
            //console.log("EXTRAS****SUB RETURNING " + foo);
          }
          //console.log("CGI subcommand=" + foo);
          return foo;

        },

        data: {
          view: "request",
          request: rqtoken,
          connkey: connkey,
          command: cmd,
          auth: myauthtoken,
          // user: loginData.username,
          // pass: loginData.password
        }
      })
      .then(function (resp) {
          NVRDataModel.debug("sendCmd response:" + JSON.stringify(resp));
          d.resolve(resp);
          return (d.promise);

        },
        function (resp) {
          NVRDataModel.debug("sendCmd error:" + JSON.stringify(resp));
          d.reject(resp);
          return (d.promise);
        });

    return (d.promise);
  }

  function processEvent(cmd, connkey) {

    if ($scope.blockSlider) {
      //console.log("Not doing ZMS Command as slider is depressed...");
      return;
    }

    var loginData = NVRDataModel.getLogin();
    //console.log("sending process Event command to " + loginData.url);
    var myauthtoken = $rootScope.authSession.replace("&auth=", "");
    //&auth=
    return $http({
        method: 'POST',
        /*timeout: 15000,*/
        url: loginData.url + '/index.php',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          //'Accept': '*/*',
        },
        transformRequest: function (obj) {
          var str = [];
          for (var p in obj)
            str.push(encodeURIComponent(p) + "=" +
              encodeURIComponent(obj[p]));
          var foo = str.join("&");
          //console.log("****processEvent subcommands RETURNING " + foo);
          return foo;
        },

        data: {
          view: "request",
          request: "stream",
          connkey: connkey,
          command: cmd,
          auth: myauthtoken,
          // user: loginData.username,
          // pass: loginData.password
        }
      })
      .success(function (resp) {
        // NVRDataModel.debug ("processEvent success:"+JSON.stringify(resp));

        if (resp.result == "Ok") {

          if (resp.status) $scope.currentProgress.progress = resp.status.progress;
          if (resp.status) $scope.eventId = resp.status.event;
          $scope.d_eventId = $scope.eventId;
          if (resp.status) $scope.currentRate = resp.status.rate;

          if ($scope.currentProgress.progress > $scope.currentEventDuration) $scope.currentProgress.progress = $scope.currentEventDuration;
          $scope.progressText = "At " + $scope.currentProgress.progress + "s of " + $scope.currentEventDuration + "s";

          $scope.sliderProgress.progress = $scope.currentProgress.progress;

          // lets not do this and use zms to move forward or back
          // as this code conflicts with fast rev etc
          //if (Math.floor(resp.status.progress) >=$scope.currentEventDuration)

          //$timeout (checkEvent(), zm.eventPlaybackQuery);
          //eventQueryHandle  =  $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);

        } else // resp.result was messed up

        {
          NVRDataModel.debug("Hmm I found an error " + JSON.stringify(resp));
          //window.stop();
          // $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();

          // console.log (JSON.stringify(resp));
          /*$timeout(function()
          {
              sendCommand('14', $scope.connKey, '&offset=' + $scope.currentProgress.progress);
          }, 500);
          NVRDataModel.debug("so I'm regenerating Connkey to " + $scope.connKey);*/

        }
      })
      .error(function (resp) {
        NVRDataModel.debug("processEvent error:" + JSON.stringify(resp));
        //eventQueryHandle  =  $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);

      });

  }

  function onPause() {

    broadcastHandles = [];


    // $interval.cancel(modalIntervalHandle);

    // FIXME: Do I need to  setAwake(false) here?

    if ($scope.modal !== undefined) {
      $scope.modal.remove();
    }
    $interval.cancel(eventQueryHandle);
    NVRDataModel.log("EventModalCtrl: paused");
    if ($scope.connKey) sendCommand(17, $scope.connKey);

  }

  function onResume() {
    /* NVRDataModel.debug("EventModalCtrl: Modal resume called");
     $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);*/

  }

  $scope.finishedLoadingImage = function () {
    // console.log("***Monitor image FINISHED Loading***");
    $ionicLoading.hide();

  };

  $scope.enableSliderBlock = function () {
    $scope.blockSlider = true;
  };

  $scope.youChangedSlider = function () {

    //console.log("YOU changed " + $scope.sliderProgress.progress);
    $scope.currentProgress.progress = $scope.sliderProgress.progress;
    sendCommand('14', $scope.connKey, '&offset=' + $scope.currentProgress.progress)
      .then(function (s) {
        $scope.blockSlider = false;
      }, function (e) {
        $scope.blockSlider = false;
      });

  };

  //-----------------------------------------------------------------------
  // Sucess/Error handlers for saving a snapshot of the
  // monitor image to phone storage
  //-----------------------------------------------------------------------

  function SaveSuccess() {
    $ionicLoading.show({
      template: $translate.instant('kDone'),
      noBackdrop: true,
      duration: 1000
    });
    NVRDataModel.debug("ModalCtrl:Photo saved successfuly");
  }

  function SaveError(e) {
    $ionicLoading.show({
      template: $translate.instant('kErrorSave'),
      noBackdrop: true,
      duration: 2000
    });
    NVRDataModel.log("Error saving image: " + e.message);
    //console.log("***ERROR");
  }

  $scope.jumpToOffsetInEvent = function () {
    // streamReq.send( streamParms+"&command="+CMD_SEEK+"&offset="+offset );
  };

  //-----------------------------------------------------------------------
  // Saves a snapshot of the monitor image to phone storage
  //-----------------------------------------------------------------------

  $scope.saveEventImageToPhoneWithPerms = function (onlyAlarms) {

    if ($rootScope.platformOS != 'android') {
      processSaveEventImageToPhone(onlyAlarms);
      return;
    }

    // if we are on android do the 6.x+ hasPermissions flow
    NVRDataModel.debug("EventModalCtrl: Permission checking for write");
    var permissions = cordova.plugins.permissions;
    permissions.hasPermission(permissions.WRITE_EXTERNAL_STORAGE, checkPermissionCallback, null);

    function checkPermissionCallback(status) {
      if (!status.hasPermission) {
        SaveError("No permission to write to external storage");
      }
      permissions.requestPermission(permissions.WRITE_EXTERNAL_STORAGE, succ, err);
    }

    function succ(s) {
      processSaveEventImageToPhone(onlyAlarms);
    }

    function err(e) {
      SaveError("Error in requestPermission");
    }
  };

  function processSaveEventImageToPhone(onlyAlarms) {

    if ($scope.loginData.useNphZmsForEvents) {
      NVRDataModel.log("Use ZMS stream to save to phone");
      saveEventImageToPhoneZms(onlyAlarms);

    } else {
      saveEventImageToPhone(onlyAlarms);
    }

  }

  function saveEventImageToPhoneZms(onlyAlarms) {
    // The strategy here is to build the array now so we can grab frames
    // $scope.currentProgress.progress is the seconds where we are
    // $scope.eventId is the event Id

    $scope.isPaused = true;

    $ionicLoading.show({
      template: $translate.instant('kPleaseWait'),
      noBackdrop: true,
      duration: zm.httpTimeout
    });
    sendCommand('1', $scope.connKey).
    then(function (resp) {

        // console.log ("PAUSE ANSWER IS " + JSON.stringify(resp));
        $scope.currentProgress.progress = resp.data.status.progress;
        // console.log ("STEP 0 progress is " + $scope.currentProgress.progress);
        $scope.slides = [];

        var apiurl = $scope.loginData.apiurl + "/events/" + $scope.eventId + ".json";
        NVRDataModel.debug("prepared to get frame details using " + apiurl);
        $http.get(apiurl)
          .then(function (success) {

              event = success.data.event;

              event.Event.BasePath = computeBasePath(event);
              event.Event.relativePath = computeRelativePath(event);
              $scope.playbackURL = $scope.loginData.url;
              $scope.eventBasePath = event.Event.BasePath;
              $scope.relativePath = event.Event.relativePath;

              // now lets get approx frame #

              var totalTime = event.Event.Length;
              var totalFrames = event.Event.Frames;

              var myFrame = Math.round(totalFrames / totalTime * $scope.currentProgress.progress);

              //  console.log ("STEP 0: playback " + $scope.playbackURL + " total time " + totalTime + " frames " + totalFrames);

              if (myFrame > totalFrames) myFrame = totalFrames;

              //  console.log ("STEP 0 myFrame is " + myFrame);
              // console.log ("DUMPING " + JSON.stringify(event));
              $scope.mycarousel.index = myFrame;
              // console.log ("STEP 1 : Computed index as "+  $scope.mycarousel.index);
              var i, p = 0;
              for (i = 1; i <= event.Frame.length; i++) {
                var fname = padToN(event.Frame[i - 1].FrameId, eventImageDigits) + "-capture.jpg";
                // console.log ("Building " + fname);

                // console.log ("DUMPING ONE " + JSON.stringify(event.Frame[i-1]));
                // onlyAlarms means only copy alarmed frames
                if (onlyAlarms) {
                  if (event.Frame[i - 1] && event.Frame[i - 1].Type == 'Alarm') {
                    p++;
                    $scope.slides.push({
                      id: event.Frame[i - 1].FrameId,
                      img: fname,
                    });
                    //console.log ("ALARM PUSHED " + fname);
                  }
                } else // push all frames
                {
                  //now handle bulk frames pushing before pushing this one
                  if (event.Frame[i - 1].Type == 'Bulk') {
                    var f1 = parseInt(event.Frame[i - 2].FrameId);
                    var f2 = parseInt(event.Frame[i - 1].FrameId);

                    //console.log ("Filling in bulk from:"+f1+" to "+(f2-1));
                    for (var bulk = f1 + 1; bulk < f2; bulk++) {
                      //console.log ("Storing bulk:"+bulk);
                      var bfname = padToN(bulk, eventImageDigits) + "-capture.jpg";
                      p++;
                      $scope.slides.push({
                        id: bulk,
                        img: bfname

                      });


                    }
                  }
                  //console.log ("storing: "+event.Frame[i - 1].FrameId);
                  p++;
                  $scope.slides.push({
                    id: event.Frame[i - 1].FrameId,
                    img: fname,
                  });



                }

              }
              //console.log ("I PUSHED:" + p+" BUT SLIDE LENGHT BEFORE DISPLAY:"+$scope.slides.length);
              //  console.log ("STEP 2 : calling Save Event To Phone");
              $ionicLoading.hide();
              saveEventImageToPhone(onlyAlarms);

            },
            function (err) {
              $ionicLoading.hide();
              NVRDataModel.log("snapshot API Error: Could not get frames " + JSON.stringify(err));

              $ionicLoading.show({
                template: $translate.instant('kErrorRetrievingFrames'),
                noBackdrop: true,
                duration: 4000
              });
            });
      },

      function (err) {
        NVRDataModel.debug("Error pausing stream before snapshot " + JSON.stringify(err));
        $ionicLoading.hide();
      }

    ); // then

  }

  // don't think this is used anymore
  function saveEventImageToPhone(onlyAlarms) {
    // console.log ("________________UNUSED?_______________________");
    var curState = carouselUtils.getStop();
    carouselUtils.setStop(true);

    //console.log("Your index is  " + $scope.mycarousel.index);
    //console.log("Associated image is " + $scope.slides[$scope.mycarousel.index].img);

    NVRDataModel.debug("ModalCtrl: SaveEventImageToPhone called");
    var canvas, context, imageDataUrl, imageData;
    var loginData = NVRDataModel.getLogin();

    // for alarms only
    if (onlyAlarms) $scope.mycarousel.index = 0;
    var url;

    if ($scope.event.Event.imageMode == 'path') {
      url = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&path=" + $scope.relativePath + $scope.slides[$scope.mycarousel.index].img;
    } else {
      url = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand +
        "&eid=" + $scope.eventId +
        "&fid=" + $scope.slides[$scope.mycarousel.index].id;
    }

    if ($rootScope.authSession != 'undefined') {
      url += $rootScope.authSession;

    }
    if ($rootScope.basicAuthToken) {
      url += "&basicauth=" + $rootScope.basicAuthToken;

    }

    $scope.selectEventUrl = url;
    $scope.slideIndex = $scope.mycarousel.index;
    $scope.slideLastIndex = $scope.slides.length - 1;
    // console.log ("FRAMES LENGTH IS " +$scope.slideLastIndex );

    // console.log ("URL TO DISPLAY " + url);

    $rootScope.zmPopup = $ionicPopup.show({
      template: '<center>Frame: {{slideIndex+1}} / {{slideLastIndex+1}}</center><br/><img src="{{selectEventUrl}}" width="100%"  />',
      title: 'Select ' + (onlyAlarms ? 'Alarmed ' : '') + 'frame to save',
      subTitle: 'use left and right arrows to change',
      scope: $scope,
      cssClass: 'popup95',
      buttons: [{
          // left 1
          text: '',
          type: 'button-small button-energized ion-chevron-left',
          onTap: function (e) {
            if ($scope.slideIndex > 0) $scope.slideIndex--;

            if ($scope.event.Event.imageMode == 'path') {
              $scope.selectEventUrl = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&path=" + $scope.relativePath + $scope.slides[$scope.slideIndex].img;
            } else {
              $scope.selectEventUrl = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&eid=" + $scope.eventId + "&fid=" + $scope.slides[$scope.slideIndex].id;
            }
            if ($rootScope.authSession != 'undefined') {
              $scope.selectEventUrl += $rootScope.authSession;

            }
            if ($rootScope.basicAuthToken) {
              $scope.selectEventUrl += "&basicauth=" + $rootScope.basicAuthToken;

            }

            //NVRDataModel.log("selected frame is " + $scope.slideIndex);

            //console.log("URL TO DISPLAY " + $scope.slides[$scope.slideIndex].img);

            e.preventDefault();
          }
        },
        {
          // right 1
          text: '',
          type: 'button-small button-energized ion-chevron-right',
          onTap: function (e) {
            if ($scope.slideIndex < $scope.slideLastIndex) $scope.slideIndex++;

            if ($scope.event.Event.imageMode == 'path') {
              $scope.selectEventUrl = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&path=" + $scope.relativePath + $scope.slides[$scope.slideIndex].img;
            } else {
              $scope.selectEventUrl = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&eid=" + $scope.eventId + "&fid=" + $scope.slides[$scope.slideIndex].id;
            }
            if ($rootScope.authSession != 'undefined') {
              $scope.selectEventUrl += $rootScope.authSession;

            }
            if ($rootScope.basicAuthToken) {
              $scope.selectEventUrl += "&basicauth=" + $rootScope.basicAuthToken;

            }

            //NVRDataModel.log("selected frame is " + $scope.slideIndex);
            //console.log("URL TO DISPLAY " + $scope.slides[$scope.slideIndex].img);
            e.preventDefault();
          }
        },
        {
          // left 10
          text: '',
          type: 'button-small button-energized ion-skip-backward',
          onTap: function (e) {
            var tempVar = $scope.slideIndex;
            tempVar -= 10;
            if (tempVar < 0) tempVar = 0;
            $scope.slideIndex = tempVar;

            if ($scope.event.Event.imageMode == 'path') {
              $scope.selectEventUrl = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&path=" + $scope.relativePath + $scope.slides[$scope.slideIndex].img;
            } else {
              $scope.selectEventUrl = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&eid=" + $scope.eventId + "&fid=" + $scope.slides[$scope.slideIndex].id;
            }
            if ($rootScope.authSession != 'undefined') {
              $scope.selectEventUrl += $rootScope.authSession;

            }
            if ($rootScope.basicAuthToken) {
              $scope.selectEventUrl += "&basicauth=" + $rootScope.basicAuthToken;

            }
            //NVRDataModel.log("selected frame is " + $scope.slideIndex);

            e.preventDefault();
          }
        },
        {
          // right 10
          text: '',
          type: 'button-small button-energized ion-skip-forward',
          onTap: function (e) {
            var tempVar = $scope.slideIndex;
            tempVar += 10;
            if (tempVar > $scope.slideLastIndex) tempVar = $scope.slideLastIndex;
            $scope.slideIndex = tempVar;
            if ($scope.slideIndex < $scope.slideLastIndex) $scope.slideIndex++;

            if ($scope.event.Event.imageMode == 'path') {
              $scope.selectEventUrl = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&path=" + $scope.relativePath + $scope.slides[$scope.slideIndex].img;
            } else {
              $scope.selectEventUrl = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&eid=" + $scope.eventId + "&fid=" + $scope.slides[$scope.slideIndex].id;
            }
            if ($rootScope.authSession != 'undefined') {
              $scope.selectEventUrl += $rootScope.authSession;

            }
            if ($rootScope.basicAuthToken) {
              $scope.selectEventUrl += "&basicauth=" + $rootScope.basicAuthToken;

            }
            //NVRDataModel.log("selected frame is " + $scope.slideIndex);
            e.preventDefault();
          }
        },

        {
          text: '',
          type: 'button-assertive button-small ion-close-round'
        },
        {
          text: '',
          type: 'button-positive button-small ion-checkmark-round',
          onTap: function (e) {
            saveNow();

          }
        }
      ]
    });

    function saveNow() {
      $ionicLoading.show({
        template: $translate.instant('kSavingSnapshot') + "...",
        noBackdrop: true,
        duration: zm.httpTimeout
      });
      var url = $scope.selectEventUrl;
      NVRDataModel.log("saveNow: File path to grab is " + url);

      var img = new Image();
      img.onload = function () {
        // console.log("********* ONLOAD");
        canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);

        imageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
        imageData = imageDataUrl.replace(/data:image\/jpeg;base64,/, '');

        if ($rootScope.platformOS != "desktop") {
          try {

            cordova.exec(
              SaveSuccess,
              SaveError,
              'Canvas2ImagePlugin',
              'saveImageDataToLibrary', [imageData]
            );
            // carouselUtils.setStop(curState);
          } catch (e) {

            SaveError(e.message);
            // carouselUtils.setStop(curState);
          }
        } else {

          var fname = $scope.relativePath + $scope.slides[$scope.slideIndex].img + ".png";
          fname = fname.replace(/\//, "-");
          fname = fname.replace(/\.jpg/, '');

          canvas.toBlob(function (blob) {
            saveAs(blob, fname);
            SaveSuccess();
          });
        }
      };
      try {
        img.src = url;
        // console.log ("SAVING IMAGE SOURCE");
      } catch (e) {
        SaveError(e.message);
      }
    }
  }

  $scope.reloadView = function () {
    NVRDataModel.log("Reloading view for modal view, recomputing rand");
    $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);
    $scope.isModalActive = true;
  };


  $scope.changeSnapshot = function (id) {
    $scope.snapshotFrameId = id;
    isGlobalFid = false;
  };

  $scope.constructStream = function (monitor) {


    if ($scope.animationInProgress) return "";

    var stream = "";
    // eventId gets populated when prepareModal completes
    if (currentStreamState == streamState.STOPPED || !$scope.eventId) {
      stream = "";
    } else if (currentStreamState == streamState.SNAPSHOT) {
      stream = $scope.loginData.url +
        "/index.php?view=image" +
        "&fid=" + $scope.snapshotFrameId +
        (!isGlobalFid ? "&eid=" + $scope.eventId : "") +
        "&scale=" + $scope.singleImageQuality +
        $rootScope.authSession;
    } else if (currentStreamState == streamState.ACTIVE) {
      stream = $scope.loginData.streamingurl +
        "/nph-zms?source=event&mode=jpeg" +
        "&event=" + $scope.eventId + "&frame=1" +
        "&replay=" + $scope.currentStreamMode +
        "&rate=100" +
        "&connkey=" + $scope.connKey +
        "&scale=" + $scope.singleImageQuality +
        $rootScope.authSession;
    }

    //console.log ($scope.connKey );
    // console.log ("STREAM="+stream);
    //console.log ("EID="+$scope.eventId);
    if ($rootScope.basicAuthToken && stream) stream += "&basicauth=" + $rootScope.basicAuthToken;
    return stream;

  };

  $scope.isSnapShot = function () {
    // console.log (currentStreamState);
    return currentStreamState == streamState.SNAPSHOT;
  };

  $scope.isStreamStopped = function () {
    // console.log ("STATE = " + currentStreamState);
    return currentStreamState == streamState.STOPPED;

  };

  $scope.convertSnapShotToStream = function () {
    currentStreamState = streamState.ACTIVE;
  };

  $scope.scaleImage = function () {

    $scope.imageFit = !$scope.imageFit;
    //console.log("Switching image style to " + $scope.imageFit);
  };

  $scope.$on('$ionicView.beforeEnter', function () {
    $scope.alarm_images = [];
    $scope.snapshotFrameId = 1;
    currentStreamState = streamState.STOPPED;

  });


  $scope.$on('modal.shown', function (e, m) {

    $ionicLoading.hide();
    if (m.id != 'footage')

      return;

    showLive = true;

    if (m.snapshot == 'enabled') {
      isSnapShotEnabled = true;
      currentStreamState = streamState.SNAPSHOT;
      if (m.snapshotId) {
        $scope.snapshotFrameId = m.snapshotId;
        isGlobalFid = true;
      } else {
        $scope.snapshotFrameId = 1;
        isSnapShotEnabled = false;
      }

      eventId = m.eventId;
      $scope.eventId = m.eventId;

    } else currentStreamState = streamState.ACTIVE;


    if (m.showLive == 'disabled') {
      showLive = false;
      NVRDataModel.debug("I was explictly asked not to show live, cross my fingers...");
    } else {

      NVRDataModel.debug("If recording is in progress, live feed will be shown");
    }
    $scope.isToggleListMenu = true;
    $scope.videoDynamicTime = "";
    $scope.videoIsReady = false;
    var ld = NVRDataModel.getLogin();
    $scope.loginData = NVRDataModel.getLogin();

    $scope.singleImageQuality = (NVRDataModel.getBandwidth() == "lowbw") ? zm.eventSingleImageQualityLowBW : ld.singleImageQuality;
    $scope.blockSlider = false;
    $scope.checkEventOn = false;
    //$scope.singleImageQuality = 100;

    //$scope.commandURL = $scope.currentEvent.Event.baseURL+"/index.php";
    // NVRDataModel.log (">>>>>>>>>>>>>>>>>>ZMS url command is " + $scope.commandURL);

    currentEvent = $scope.currentEvent;

    //console.log("Current Event " + JSON.stringify(currentEvent));
    $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
    NVRDataModel.debug("Generated Connkey:" + $scope.connKey);

    $scope.currentFrame = 1;
    $scope.isPaused = false;

    gEvent = $scope.currentEvent;
    //console.log ("CURRENT EVENT " + JSON.stringify($scope.currentEvent));
    //
    $scope.currentEventDuration = Math.floor($scope.currentEvent.Event.Length);
    //console.log ($scope.event.Event.Frames);
    if (currentEvent && currentEvent.Event) {
      //console.log ("************ CALLING PREPARE MODAL ***********");
      prepareModalEvent(currentEvent.Event.Id);
      if (ld.useNphZmsForEvents) {
        $timeout(function () {

          if ($scope.modal != undefined && $scope.modal.isShown()) {
            NVRDataModel.log(">>>Starting checkAllEvents interval...");

            //eventQueryHandle  = $timeout (checkEvent(), zm.eventPlaybackQuery);

            $interval.cancel(eventQueryHandle);
            checkEvent();
            eventQueryHandle = $interval(function () {
              checkEvent();
              //  console.log ("Refreshing Image...");
            }.bind(this), (NVRDataModel.getBandwidth() == "lowbw") ? zm.eventPlaybackQueryLowBW : zm.eventPlaybackQuery);
          } else {
            NVRDataModel.log(">>>Modal was exited, not starting checkAllEvents");
          }

        }, 2000);
      }

    }

  });

  //var current_data;
  function drawGraph() {

    var cv = document.getElementById("eventchart");
    var ctx;
    try {
      ctx = cv.getContext("2d");
    } catch (e) {
      NVRDataModel.debug("2D Context ERROR, maybe live play");

    }


    frameoptions = {
      responsive: true,
      legend: false,
      title: {
        display: false,
        text: ""
      },
      scales: {
        yAxes: [{
          display: false,
          scaleLabel: {
            display: false,
            labelString: 'value',
          }

        }],
        xAxes: [{
          type: 'time',
          display: false,
          time: {

            format: timeFormat,
            tooltipFormat: 'll HH:mm',
            min: framearray.datasets[0].data[0].x,
            max: framearray.datasets[0].data[framearray.datasets[0].data.length - 1].x,
            displayFormats: {

            }
          },
          scaleLabel: {
            display: false,
            labelString: ''
          }

        }]
      }
    };

    $timeout(function () {

      var myChart = new Chart(ctx, {
        type: 'line',
        data: framearray,
        options: frameoptions,
      });

    });
  }

  $scope.modalImageLoaded = function () {
    // console.log ("MODAL IMAGE LOADED");
    //  if (m.snapshot != 'enabled') currentStreamState = streamState.ACTIVE;
  };


  $scope.videoTime = function (s, c) {
    var a, o;
    if (NVRDataModel.getLogin().useLocalTimeZone) {
      a = moment.tz(s, NVRDataModel.getTimeZoneNow()).tz(moment.tz.guess());

    } else {
      a = moment(s);
    }
    a.add(c);

    o = a.format("MMM Do " + NVRDataModel.getTimeFormatSec());
    $scope.videoDynamicTime = o;
    //return a.format("MMM Do "+o);

  };

  $scope.$on('modal.removed', function (e, m) {
    NVRDataModel.debug("Deregistering broadcast handles");
    for (var i = 0; i < broadcastHandles.length; i++) {
      // broadcastHandles[i]();
    }
    broadcastHandles = [];

    //console.log("************* REMOVE CALLED");
    $interval.cancel(eventQueryHandle);
    if (m.id != 'footage')
      return;

    $scope.isModalActive = false;

    NVRDataModel.debug("Modal removed - killing connkey");
    if ($scope.connKey) sendCommand(17, $scope.connKey);
    //$timeout (function(){NVRDataModel.stopNetwork("Modal removed inside EventModalCtrl");},400);

    // Execute action
  });

  // Playback speed adjuster
  $scope.adjustSpeed = function (val) {

    if (currentStreamState != streamState.ACTIVE) return;

    if ($scope.defaultVideo !== undefined && $scope.defaultVideo != '') {

      $ionicLoading.show({
        template: $translate.instant('kUseVideoControls'),
        noBackdrop: true,
        duration: 3000
      });
      return;
    }

    var ld = NVRDataModel.getLogin();



    var cmd;
    $scope.isPaused = false;
    switch (val) {
      case 'ff':
        cmd = 4;
        break;
      case 'fr':
        cmd = 7;
        break;
      case 'np':
        cmd = 2;
        break;
      case 'p':
        cmd = 1;
        $scope.isPaused = true;
        break;
      default:
        cmd = 0;
    }

    $ionicLoading.show({
      template: $translate.instant('kPleaseWait') + "...",
      noBackdrop: true,
      duration: zm.httpTimeout
    });

    sendCommand(cmd, $scope.connKey)
      .then(function (success) {
          $ionicLoading.hide();

        },
        function (err) {
          $ionicLoading.hide();
          NVRDataModel.debug("Error in adjust speed: " + JSON.stringify(err));
        }
      );


  };

  $scope.toggleListMenu = function () {

    $scope.isToggleListMenu = !$scope.isToggleListMenu;
  };

  $scope.toggleGapless = function () {
    // console.log(">>>>>>>>>>>>>>GAPLESS TOGGLE INSIDE MODAL");
    $scope.loginData.gapless = !$scope.loginData.gapless;
    NVRDataModel.setLogin($scope.loginData);

    $scope.currentStreamMode = $scope.loginData.gapless ? 'gapless' : 'single';

    NVRDataModel.debug("EventModalCtrl: gapless has changed resetting everything & re-generating connkey");

    NVRDataModel.stopNetwork("EventModalCtrl-toggle gapless");
    currentStreamState = streamState.STOPPED;
    NVRDataModel.debug("Regenerating connkey as gapless has changed");
    // console.log ("********* OFFSET FROM TOGGLE GAPLESS");
    $timeout(function () {
      $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
      currentStreamState = streamState.ACTIVE;

      /* $timeout(function()
       {
           sendCommand('14', $scope.connKey, '&offset=' + $scope.currentProgress.progress);
       }, 500);*/

    });




    //$timeout.cancel(eventQueryHandle);
    //eventQueryHandle  = $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);

  };

  // This function returns neighbor events if applicable




  function neighborEvents(eid, mid) {

    var neighbors = {
      prev: "",
      next: ""
    };
    // prev https://zm/api/events/index/StartTime <: 2018-05-05 11:50:00 =:7/AlarmFrames >=:1.json?sort=StartTime&direction=desc&limit=1 

    //next 
    //zm/api/events/index/StartTime >: 2018-05-05 11:50:00/MonitorId =:7/AlarmFrames >=:1.json?sort=StartTime&direction=asc&limit=1

    var d = $q.defer();
    // now get event details to show alarm frames
    var loginData = NVRDataModel.getLogin();
    var myurl = loginData.apiurl + '/events/' + eid + ".json";

    var nextEvent = loginData.apiurl + "/events/index" +
      "/StartTime >: " + currentEvent.Event.StartTime +
      ($scope.followSameMonitor == '1' ? "/MonitorId =: " + currentEvent.Monitor.Id : "") +
      "/AlarmFrames >=: " + (loginData.enableAlarmCount ? loginData.minAlarmCount : 0) +
      ".json?sort=StartTime&direction=asc&limit=1";


    var prevEvent = loginData.apiurl + "/events/index" +
      "/StartTime <: " + currentEvent.Event.StartTime +
      ($scope.followSameMonitor == '1' ? "/MonitorId =: " + currentEvent.Monitor.Id : "") +
      "/AlarmFrames >=: " + (loginData.enableAlarmCount ? loginData.minAlarmCount : 0) +
      ".json?sort=StartTime&direction=desc&limit=1";


    NVRDataModel.debug("Neighbor next URL=" + nextEvent);
    NVRDataModel.debug("Neighbor pre URL=" + prevEvent);

    var nextPromise = $http.get(nextEvent);
    var prePromise = $http.get(prevEvent);

    var preId = "";
    var nextId = "";

    $q.all([nextPromise, prePromise])
      .then(function (data) {

        // console.log ("NEXT OBJ="+JSON.stringify(data[0]));
        // console.log ("PRE OBJ="+JSON.stringify(data[1]));
        // next
        if (data[0] && data[0].data && data[0].data.events.length > 0) {
          nextId = data[0].data.events[0].Event.Id;

        }

        if (data[1] && data[1].data && data[1].data.events.length > 0) {
          preId = data[1].data.events[0].Event.Id;

        }
        NVRDataModel.debug("neighbors of " + currentEvent.Event.Id + "are pre=" + preId + " next=" + nextId);
        neighbors.next = nextId;
        neighbors.prev = preId;
        d.resolve(neighbors);
        return d.promise;


        // prev
        //  console.log ("NEXT:",JSON.stringify(data[0].data),"PREV:",JSON.stringify(data[1].data));
      }, function (error) {
        NVRDataModel.log("Error retrieving neighbors" + JSON.stringify(err));
        d.reject(neighbors);
        return (d.promise);

      });

    return (d.promise);

  }

  $scope.zoomImage = function (val) {
    var zl = parseInt($ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom);
    if (zl == 1 && val == -1) {
      NVRDataModel.debug("Already zoomed out max");
      return;
    }

    zl += val;
    NVRDataModel.debug("Zoom level is " + zl);
    $ionicScrollDelegate.$getByHandle("imgscroll").zoomTo(zl, true);

  };



  $scope.deleteAndMoveNext = function (id) {
    NVRDataModel.debug("Delete and move next called with: " + id);
    deleteEvent(id)
      .then(function (succ) {
        $ionicLoading.hide();
        if ($scope.modalData) $scope.modalData.doRefresh = true;

        var dirn = 1;
        if (!$scope.nextId && $scope.prevId) dirn = -1;
        jumpToEvent(id, dirn);

      });
  };

  function deleteEvent(id) {
    //$scope.eventList.showDelete = false;
    //curl -XDELETE http://server/zm/api/events/1.json
    var loginData = NVRDataModel.getLogin();
    var apiDelete = loginData.apiurl + "/events/" + id + ".json";
    NVRDataModel.debug("DeleteEvent: ID=" + id);
    NVRDataModel.log("Delete event " + apiDelete);

    $ionicLoading.show({
      template: "{{'kDeletingEvent' | translate}}...",
      noBackdrop: true,
      duration: zm.httpTimeout
    });

    return $http.delete(apiDelete)
      .success(function (data) {
        $ionicLoading.hide();
        // NVRDataModel.debug("delete output: " + JSON.stringify(data));

        if (data.message == 'Error') {
          $ionicLoading.show({
            template: "{{'kError' | translate}}...",
            noBackdrop: true,
            duration: 1500
          });

        } else {

          $ionicLoading.hide();
          $ionicLoading.show({
            template: "{{'kSuccess' | translate}}...",
            noBackdrop: true,
            duration: 1000
          });


        }

        // NVRDataModel.displayBanner('info', [$translate.instant('kDeleteEventSuccess')], 2000, 2000);




        //doRefresh();

      })
      .error(function (data) {
        $ionicLoading.hide();
        NVRDataModel.debug("delete error: " + JSON.stringify(data));
        NVRDataModel.displayBanner('error', [$translate.instant('kDeleteEventError1'), $translate.instant('kDeleteEventError2')]);
      });
  }
  //--------------------------------------------------------
  //Navigate to next/prev event in full screen mode
  //--------------------------------------------------------

  $scope.onSwipeEvent = function (eid, dirn) {

    console.log("CALLED WITH " + eid + " dirn " + dirn);
    if ($ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom != 1) {
      //console.log("Image is zoomed in - not honoring swipe");
      return;
    }

    //if ($scope.liveFeedMid) return;

    jumpToEvent(eid, dirn);
    /*  else
      {
          jumpToEvent(eid, dirn);
      }*/

    //console.log("JUMPING");

  };

  $scope.jumpToEvent = function (eid, dirn) {
    jumpToEvent(eid, dirn);
  };

  function jumpToEvent(eid, dirn) {
    $scope.snapshotFrameId = 1;
    $scope.isPaused = false;
    isGlobalFid = false;
    var oState;
    NVRDataModel.log("HERE: Event jump called with:" + eid);
    if (eid == "") {
      $ionicLoading.show({
        template: $translate.instant('kNoMoreEvents'),
        noBackdrop: true,
        duration: 2000
      });

      return;
    }

    var slidein;
    var slideout;
    if (dirn == 1) {
      slideout = "animated slideOutLeft";
      slidein = "animated slideInRight";
    } else {
      slideout = "animated slideOutRight";
      slidein = "animated slideInLeft";
    }

    oState = currentStreamState;
    var element = angular.element(document.getElementById("full-screen-event"));
    element.addClass(slideout).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', outWithOld);

    function outWithOld() {

      NVRDataModel.log("ModalCtrl:Stopping network pull...");
      NVRDataModel.stopNetwork("EventModalCtrl-out with old");
      $scope.animationInProgress = true;
      // give digest time for image to swap
      // 100 should be enough
      $timeout(function () {
        element.removeClass(slideout);
        element.addClass(slidein)
          .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', inWithNew);
        processMove(eid, dirn);

        // FIXME: why does making this STOPPED show video playable error?
        currentStreamState = streamState.SNAPSHOT;
      }, 200);
    }

    function inWithNew() {
      element.removeClass(slidein);
      $scope.animationInProgress = false;
      carouselUtils.setStop(false);
      currentStreamState = oState;


    }

  }

  function processMove(eid, dirn) {
    var ld = NVRDataModel.getLogin();
    if (!ld.canSwipeMonitors) return;


    // NVRDataModel.log("using zms to move ");

    if (currentStreamState == streamState.ACTIVE && ($scope.defaultVideo == '' || $scope.defaultVideo == 'undefined')) {
      // need to kill zms
      currentStreamState = streamState.STOPPED;
      $timeout(function () {
        NVRDataModel.killLiveStream($scope.connKey);

      });

    }

    if ($scope.defaultVideo != "" && $scope.defaultVideo != 'undefined') {

      if (handle) {

        NVRDataModel.debug("Clearing video feed...");
        handle.stop();
        handle.clearMedia();


      }



      playerReady = false;
      $scope.defaultVideo = "";
      $scope.video_url = "";
      $scope.videoObject = {};
      $scope.videoIsReady = false;

    }



    if (dirn == 1) {
      NVRDataModel.debug("Moving to:" + $scope.nextId);
      prepareModalEvent($scope.nextId);
    } else if (dirn == 2) {
      // this is called when you delete
      var id = "";
      if ($scope.nextId > 0) id = $scope.nextId;
      else if ($scope.prevId > 0) id = $scope.prevId;
      NVRDataModel.debug("after delete, moving to " + id);
      prepareModalEvent(id);


    } else if (dirn == -1 && $scope.prevId > 0) {
      NVRDataModel.debug("Moving to:" + $scope.prevId);
      prepareModalEvent($scope.prevId);
    }




  }

  function humanizeTime(str) {
    // if (NVRDataModel.getLogin().useLocalTimeZone)
    return moment.tz(str, NVRDataModel.getTimeZoneNow()).fromNow();
    //  else    
    //    return moment(str).fromNow();

  }


  function jumpToEventVideo(dirn) {
    var ld = NVRDataModel.getLogin();
    var url = ld.url + '/index.php?view=request&request=status&entity=nearevents&id=' + $scope.eventId;
    // url += "&filter%5BQuery%5D%5Bterms%5D%5B0%5D%5Battr%5D=MonitorId&filter%5BQuery%5D%5Bterms%5D%5B0%5D%5Bop%5D=%3D&filter%5BQuery%5D%5Bterms%5D%5B0%5D%5Bval%5D=5&sort_field=StartTime&sort_asc=1"; // wtf junk
    NVRDataModel.debug("Asking nearest video EID using " + url);
    $http.get(url)
      .then(function (succ) {
          // console.log ("GOT "+JSON.stringify(succ));

        },
        function (err) {
          // console.log ("ERR GOT "+JSON.stringify(succ));
        }
      );
  }

  function jumpToEventZms(connkey, dirn) {

    /* if ($scope.defaultVideo !== undefined && $scope.defaultVideo != '')
     {
         jumpToEventVideo (dirn);
         return;

     }*/


    var cmd = dirn == 1 ? '13' : '12';
    $scope.d_eventId = "...";
    NVRDataModel.debug("Sending " + cmd + " to " + connkey);

    $ionicLoading.show({
      template: $translate.instant('kSwitchingEvents') + "...",
      noBackdrop: true,
      duration: zm.httpTimeout
    });

    //console.log("Send command connkey: " + connkey);




    sendCommand(cmd, connkey)
      .then(
        function (success) {
          //console.log ("jump success " + JSON.stringify(success));
          $ionicLoading.hide();
        },
        function (error) {

          NVRDataModel.debug("Hmm jump  error " + JSON.stringify(error));
          NVRDataModel.stopNetwork("EventModalCtrl-jumptoEventZms error");
          $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
          //  console.log ("********* OFFSET FROM JUMPTOEVENTZMS ERROR");
          $timeout(function () {
            sendCommand('14', $scope.connKey, '&offset=' + $scope.currentProgress.progress);
          }, 500);
          NVRDataModel.debug("so I'm regenerating Connkey to " + $scope.connKey);
          //$timeout.cancel(eventQueryHandle);
          // eventQueryHandle  =  $timeout (function(){checkEvent();}, zm.eventPlaybackQuery);
          $ionicLoading.hide();
        });
    var slidein;
    var slideout;
    if (dirn == 1) {
      slideout = "animated slideOutLeft";
      slidein = "animated slideInRight";
    } else {
      slideout = "animated slideOutRight";
      slidein = "animated slideInLeft";
    }
    var element = angular.element(document.getElementById("full-screen-event"));
    element.addClass(slideout).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', outWithOld);

    function outWithOld() {

      $timeout(function () {
        element.removeClass(slideout);
        element.addClass(slidein)
          .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', inWithNew);

      }, 200);
    }

    function inWithNew() {
      element.removeClass(slidein);

    }

  }

  //--------------------------------------------------------
  // utility function
  //--------------------------------------------------------

  function computeRelativePath(event) {
    var relativePath = "";
    var loginData = NVRDataModel.getLogin();
    var str = event.Event.StartTime;
    var yy = moment(str).locale('en').format('YY');
    var mm = moment(str).locale('en').format('MM');
    var dd = moment(str).locale('en').format('DD');
    var hh = moment(str).locale('en').format('HH');
    var min = moment(str).locale('en').format('mm');
    var sec = moment(str).locale('en').format('ss');
    relativePath = event.Event.MonitorId + "/" +
      yy + "/" +
      mm + "/" +
      dd + "/" +
      hh + "/" +
      min + "/" +
      sec + "/";
    return relativePath;

  }

  //--------------------------------------------------------
  // utility function
  //--------------------------------------------------------

  function computeBasePath(event) {
    var basePath = "";
    var loginData = NVRDataModel.getLogin();
    var str = event.Event.StartTime;
    var yy = moment(str).locale('en').format('YY');
    var mm = moment(str).locale('en').format('MM');
    var dd = moment(str).locale('en').format('DD');
    var hh = moment(str).locale('en').format('HH');
    var min = moment(str).locale('en').format('mm');
    var sec = moment(str).locale('en').format('ss');

    basePath = loginData.url + "/events/" +
      event.Event.MonitorId + "/" +
      yy + "/" +
      mm + "/" +
      dd + "/" +
      hh + "/" +
      min + "/" +
      sec + "/";
    return basePath;
  }

  //-------------------------------------------------------------------------
  // Called when rncarousel or video player finished playing event
  //-------------------------------------------------------------------------     

  $scope.playbackFinished = function () {
    playbackFinished();
  };

  function playbackFinished() {
    // currentEvent is updated with the currently playing event in prepareModalEvent()
    NVRDataModel.log("Playback of event " + currentEvent.Event.Id + " is finished");

    if ($scope.loginData.gapless) {

      neighborEvents(currentEvent.Event.Id, currentEvent.Monitor.Id)
        .then(function (success) {

            // lets give a second before gapless transition to the next event
            $timeout(function () {
              $scope.nextId = success.next;
              $scope.prevId = success.prev;
              NVRDataModel.debug("Gapless move to event " + $scope.nextId);
              jumpToEvent($scope.nextId, 1);
            }, 1000);
          },
          function (error) {
            NVRDataModel.debug("Error in neighbor call " +
              JSON.stringify(error));
          });
    } else {
      NVRDataModel.debug("not going to next event, gapless is off");
    }
  }

  function computeAlarmFrames(data) {
    $scope.alarm_images = [];
    tempAlarms = [];
    $scope.FrameArray = data.event.Frame;
    var ts = 0;

    for (i = 0; i < data.event.Frame.length; i++) {
      if (data.event.Frame[i].Type == "Alarm") {

        // console.log ("**ONLY ALARM AT " + i + "of " + data.event.Frame.length);

        if (ts != data.event.Frame[i].TimeStamp)
        {
          tempAlarms.push({

            id: data.event.Frame[i].Id,
            frameid: data.event.Frame[i].FrameId,
          });
          ts = data.event.Frame[i].TimeStamp;
        }
        

      }

    }
    if (tempAlarms.length > 1) // don't do it for just one too
      $scope.alarm_images = tempAlarms;

  }

  $scope.constructFrame = function (fid) {

    var frame = "";
    frame = currentEvent.Event.baseURL + "/index.php?view=image" +
      "&eid=" + currentEvent.Event.Id +
      "&fid=" + fid +
      "&height=" + 200;

    if ($rootScope.authSession != 'undefined') frame += $rootScope.authSession;
    frame += NVRDataModel.insertBasicAuthToken();
    // console.log (frame);
    return frame;
  };

  //--------------------------------------------------------
  // Called by openModal as well as jump to event
  // what it basically does is get a detailed event API
  // for an event ID and constructs required playback
  // parameters
  // Note that openModal is called with the top level event
  // API. Some parameters are repeated across both
  //--------------------------------------------------------

  function prepareModalEvent(eid) {



    // Lets get the detailed event API
    var loginData = NVRDataModel.getLogin();
    var myurl = loginData.apiurl + '/events/' + eid + ".json";
    NVRDataModel.log("*** Constructed API for detailed events: " + myurl);
    $scope.humanizeTime = "...";
    $scope.mName = "...";
    $scope.liveFeedMid = '';


    $http.get(myurl)
      .then(function (success) {

          // console.log ("DUCCESS::"+JSON.stringify(success));


          var event = success.data.event;
          currentEvent = event;

          computeAlarmFrames(success.data);
          $scope.eventWarning = '';

          if (!event.Event.EndTime && showLive) {
            $scope.eventWarning = $translate.instant('kEventStillRecording');
            // if this happens we get to live feed 
            $scope.liveFeedMid = event.Event.MonitorId;
            NVRDataModel.log("Event not ready, setting live view, with MID=" + $scope.liveFeedMid);
          }

          event.Event.BasePath = computeBasePath(event);
          event.Event.relativePath = computeRelativePath(event);

          event.Event.streamingURL = NVRDataModel.getStreamingURL(event.Event.MonitorId);
          //  event.Event.baseURL = NVRDataModel.getBaseURL (event.Event.MonitorId);
          event.Event.baseURL = loginData.url;
          event.Event.imageMode = NVRDataModel.getImageMode(event.Event.MonitorId);

          //console.log (JSON.stringify( success));
          $scope.eventName = event.Event.Name;
          $scope.eventId = event.Event.Id;
          $scope.d_eventId = $scope.eventId;
          $scope.eFramesNum = event.Event.Frames;
          $scope.eventDur = Math.round(event.Event.Length);
          $scope.loginData = NVRDataModel.getLogin();
          $scope.humanizeTime = humanizeTime(event.Event.StartTime);
          $scope.mName = NVRDataModel.getMonitorName(event.Event.MonitorId);
          //console.log (">>>>>>>>HUMANIZE " + $scope.humanizeTime);

          // console.log("**** VIDEO STATE IS " + event.Event.DefaultVideo);
          if (typeof event.Event.DefaultVideo === 'undefined' || event.Event.DefaultVideo == '') {
            event.Event.DefaultVideo = "";
          }


          $scope.defaultVideo = event.Event.DefaultVideo;

          $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();

          if (currentStreamState != streamState.SNAPSHOT)
            currentStreamState = streamState.ACTIVE;


          //console.log("loginData is " + JSON.stringify($scope.loginData));
          //console.log("Event ID is " + $scope.eventId);
          //console.log("video is " + $scope.defaultVideo);

          neighborEvents(event.Event.Id)
            .then(function (success) {
                $scope.nextId = success.next;
                $scope.prevId = success.prev;
              },
              function (error) {
                //console.log(JSON.stringify(error));
              });

          $scope.nextId = "...";
          $scope.prevId = "...";

          event.Event.video = {};
          var videoURL;

          if ((event.Event.imageMode == 'path') || NVRDataModel.getLogin().forceImageModePath)
            videoURL = event.Event.baseURL + "/events/" + event.Event.relativePath + event.Event.DefaultVideo;
          else
            videoURL = event.Event.baseURL + "/index.php?view=view_video&eid=" + event.Event.Id;

          if ($rootScope.authSession != 'undefined') videoURL += $rootScope.authSession;
          if ($rootScope.basicAuthToken) videoURL = videoURL + "&basicauth=" + $rootScope.basicAuthToken;

          // hack
          //videoURL = "http://static.videogular.com/assets/videos/videogular.mp4";

          $scope.video_url = videoURL;

          //console.log("************** VIDEO IS " + videoURL);

          NVRDataModel.debug("Video url passed to player is: " + videoURL);

          // console.log (">>>>>>>>>>>>>"+loginData.url+"-VS-"+event.Event.baseURL);

          //console.log("************** VIDEO IS " + videoURL);

          $scope.videoObject = {
            config: {
              autoPlay: true,
              responsive: false,
              nativeControls: false,
              nativeFullScreen: false,

              playsInline: true,
              sources: [{
                  src: $sce.trustAsResourceUrl(videoURL),
                  type: "video/mp4"
                }

              ],

              theme: "lib/videogular-themes-default/videogular.css",
              cuepoints: {
                theme: {
                  url: "lib/videogular-cuepoints/cuepoints.css"
                },
                points: [],
              }
            }
          };

          // $scope.videoObject = angular.copy(event.Event.video);

          $scope.playbackURL = $scope.loginData.url;

          $scope.videoIsReady = true;

          /* we don't need this for electron
          if ($rootScope.platformOS == "desktop") {
              $scope.playbackURL = zm.desktopUrl;
          } */

          $scope.eventBasePath = event.Event.BasePath;
          $scope.relativePath = event.Event.relativePath;
          $rootScope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;

          $scope.slider_modal_options = {
            from: 1,
            to: event.Event.Frames,
            realtime: true,
            step: 1,
            className: "mySliderClass",
            callback: function (value, released) {
              //console.log("CALLBACK"+value+released);
              $ionicScrollDelegate.freezeScroll(!released);

            },
            //modelLabels:function(val) {return "";},
            smooth: false,
            css: {
              background: {
                "background-color": "silver"
              },
              before: {
                "background-color": "purple"
              },
              default: {
                "background-color": "white"
              }, // default value: 1px
              after: {
                "background-color": "green"
              }, // zone after default value
              pointer: {
                "background-color": "red"
              }, // circle pointer
              range: {
                "background-color": "red"
              } // use it if double value
            },
            scale: []

          };

          $scope.mycarousel.index = 0;
          $scope.ionRange.index = 1;
          $scope.eventSpeed = $scope.event.Event.Length / $scope.event.Event.Frames;

          //console.log("**Resetting range");
          $scope.slides = [];
          var i;
          for (i = 1; i <= event.Event.Frames; i++) {
            var fname = padToN(i, eventImageDigits) + "-capture.jpg";
            // console.log ("Building " + fname);
            $scope.slides.push({
              id: i,
              img: fname
            });
          }

          // now get event details to show alarm frames

          //$scope.FrameArray = event.Frame;
          //  $scope.slider_options.scale=[];
          // $scope.slider_modal_options.scale = [];

          // lets 
          framearray.datasets[0].data = [];
          for (i = 0; i < event.Frame.length; i++) {

            var ts = moment(event.Frame[i].TimeStamp).format(timeFormat);

            //console.log ("pushing s:" + event.Frame[i].Score+" t:"+ts);

            framearray.datasets[0].data.push({
              x: ts,
              y: event.Frame[i].Score
            });
            framearray.labels.push("");

          }
          $scope.totalEventTime = Math.round(parseFloat(event.Event.Length)) - 1;
          $scope.currentEventTime = 0;

          // video mode doesn't need this graph - it won't really work
          if ($scope.defaultVideo == undefined || $scope.defaultVideo == '') {
            $timeout(function () {
              drawGraph();
            }, 500);
          }

        },
        function (err) {
          NVRDataModel.log("Error retrieving detailed frame API " + JSON.stringify(err));
          NVRDataModel.displayBanner('error', ['could not retrieve frame details', 'please try again']);
        });

  }

  if (typeof $scope.ionRange !== 'undefined') {
    $scope.$watch('ionRange.index', function () {
      //  
      $scope.mycarousel.index = parseInt($scope.ionRange.index) - 1;

      if (carouselUtils.getStop() == true)
        return;

      //console.log ("***ION RANGE CHANGED TO " + $scope.mycarousel.index);
    });
  }

  if (typeof $scope.mycarousel !== 'undefined') {
    $scope.$watch('mycarousel.index', function () {

      if (currentEvent && $scope.ionRange.index == parseInt(currentEvent.Event.Frames - 1)) {
        playbackFinished();
      }
      // end of playback from quick scrub
      // so ignore gapless

      if ($scope.event && $scope.ionRange.index == parseInt($scope.event.Event.Frames) - 1) {
        if (!$scope.modal || $scope.modal.isShown() == false) {
          // console.log("quick scrub playback over");
          carouselUtils.setStop(true);
          $scope.ionRange.index = 0;
          $scope.mycarousel.index = 1;
        }

      }
      if (carouselUtils.getStop() == true)
        return;
      $scope.ionRange.index = ($scope.mycarousel.index + 1).toString();
      // console.log ("***IONRANGE RANGE CHANGED TO " + $scope.ionRange.index);

    });
  }

  function padToN(number, digits) {

    var i;
    var stringMax = "";
    var stringLeading = "";
    for (i = 1; i <= digits; i++) {
      stringMax = stringMax + "9";
      if (i != digits) stringLeading = stringLeading + "0";
    }
    var numMax = parseInt(stringMax);

    if (number <= numMax) {
      number = (stringLeading + number).slice(-digits);
    }
    //console.log ("PADTON: returning " + number);
    return number;
  }

}]);
