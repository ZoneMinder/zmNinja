 
// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,ionic, moment, Chart */

angular.module('zmApp.controllers').controller('EventModalCtrl', ['$scope', '$rootScope', 'zm', 'NVR', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$q', '$sce', 'carouselUtils', '$ionicPopup', '$translate', '$filter', 'SecuredPopups', '$cordovaFile', function ($scope, $rootScope, zm, NVR, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $q, $sce, carouselUtils, $ionicPopup, $translate, $filter, SecuredPopups, $cordovaFile) {


  var videoPlaybarClicked = false;
  
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
  $scope.loginData = NVR.getLogin();
  $scope.currentRate = '-';
  var timeFormat = 'MM/DD/YYYY HH:mm:ss';
  var event;
  var gEvent;
  var handle;
  //var playerPromise = undefined;
  var showLive = true;
  //var isGlobalFid = false; // true if its set to MaxScoreFrameId in events
  var eventId = 0;
  var isSnapShotEnabled = false;
  var playState = 'play';
  var isSeeking = false;
  $scope.useFilters = true;
  


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
  NVR.getKeyConfigParams(0)
    .then(function (data) {
      //console.log ("***GETKEY: " + JSON.stringify(data));
      eventImageDigits = parseInt(data);
      //NVR.log("Image padding digits reported as " + eventImageDigits);
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


  var ld = NVR.getLogin();

  $scope.currentStreamMode = ld.gapless ? 'gapless' : 'single';
  NVR.log("Using stream mode " + $scope.currentStreamMode);

  NVR.debug("EventModalCtrl called from " + $ionicHistory.currentStateName());
  // This is not needed for event mode

  NVR.debug("Setting playback to " + $scope.streamMode);

  if ($rootScope.platformOS == 'desktop') {
    window.addEventListener('keydown', keyboardHandler, true);

  }

  // Keyboard handler for desktop versions 
  function keyboardHandler(evt) {

    var handled = false;
    var keyCodes = {

      //events
      LEFT: 37,
      RIGHT: 39,

      ESC: 27,
      FITFILL_F: 70,
      PLAY_SELECT: 13

    };

    $timeout(function () {
      var keyCode = evt.keyCode;

      //console.log(keyCode + " PRESSED");

      if (keyCode == keyCodes.ESC) {

        $scope.closeModal();

      } else if (keyCode == keyCodes.LEFT) {

        $scope.jumpToEvent($scope.prevId, -1);
      } else if (keyCode == keyCodes.RIGHT) {
        $scope.jumpToEvent($scope.nextId, 1);
      } else if (keyCode == keyCodes.FITFILL_F) {
        $scope.scaleImage();
      } else if (keyCode == keyCodes.PLAY_SELECT) {
        if ($scope.isSnapShot() && !$scope.liveFeedMid) {
          $scope.convertSnapShotToStream();
        } else {
          NVR.debug("Not in snapshot mode, ignoring");
        }
      }

      handled = true;
      return handled;

    });
  }



  //--------------------------------------------------------------------------------------
  // Handles bandwidth change, if required
  //
  //--------------------------------------------------------------------------------------

  var bc = $scope.$on("bandwidth-change", function (e, data) {
    // not called for offline, I'm only interested in BW switches
    NVR.debug("Got network change:" + data);
    var ds;
    if (data == 'lowbw') {
      ds = $translate.instant('kLowBWDisplay');
    } else {
      ds = $translate.instant('kHighBWDisplay');
    }
    NVR.displayBanner('net', [ds]);

    var ld = NVR.getLogin();

    $scope.singleImageQuality = (NVR.getBandwidth() == "lowbw") ? zm.eventSingleImageQualityLowBW : ld.singleImageQuality;
  });
  broadcastHandles.push(bc);

  //-------------------------------------------------------
  // we use this to reload the connkey if authkey changed
  //------------------------------------------------------

  var as = $scope.$on("auth-success", function () {

    NVR.debug("EventModalCtrl: Re-login detected, resetting everything & re-generating connkey");
    // NVR.stopNetwork("Auth-Success inside EventModalCtrl");
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
    NVR.debug("Paused is " + $scope.isPaused);
    sendCommand($scope.isPaused ? '1' : '2', $scope.connKey);

  };


  $scope.onPlayerState = function (state) {
    // parent scope
    NVR.debug ("Video state="+state);
    playState = state;
    $scope.lastVideoStateTime.time = moment();

    if (!videoPlaybarClicked) {
      videoPlaybarClicked = true;
      $timeout(function () {videoPlaybarClicked = false;},1000);
    }
  };

  $scope.onPlayerReady = function (api) {

    // we need this timeout to avoid load interrupting
    // play -- I suppose its an angular digest foo thing
    NVR.debug("On Play Ready invoked");
    handle = api;
    handle.mediaElement.attr("playsinline", "");

    $scope.videoObject.config.cuepoints.points = [];
    // now set up cue points
    NVR.debug("Setting cue points..");
    NVR.debug("API-Total length:" + currentEvent.Event.Length);
    NVR.debug("Player-Total length:" + handle.totalTime / 1000);

    for (var l = 0; l < currentEvent.Frame.length; l++) {
      if (currentEvent.Frame[l].Type == 'Alarm') {
        // var ft = moment(currentEvent.Frame[l].TimeStamp);
        //var s = factor*Math.abs(st.diff(ft,'seconds'));

        var s = currentEvent.Frame[l].Delta;

        //console.log("START="+currentEvent.Event.StartTime);
        //console.log("END="+currentEvent.Frame[l].TimeStamp);
        //console.log ("alarm cue at:"+s+"s");
        $scope.videoObject.config.cuepoints.points.push({
          time: parseFloat(s)
        });
      }
    }

  
    $scope.isVideoLoading = true;
 
   
  };

  

  $scope.onPlaybackUpdate = function (rate) {
   
   
    var ld = NVR.getLogin();
    if (ld.videoPlaybackSpeed != rate) {
      NVR.debug ("Update video rate to:"+rate);
      ld.videoPlaybackSpeed = rate;
    }
    
    NVR.setLogin(ld);

    if (!videoPlaybarClicked) {
      videoPlaybarClicked = true;
      $timeout(function () {videoPlaybarClicked = false;},1000);
    }
    
  };

  $scope.videoSeek = function (val) {

    if (!handle) {
      NVR.debug ("Can't seek. Video not playing");
      return;
    }
    isSeeking = true;
    //console.log ("You asked:"+val);
    //console.log (handle.totalTime);
    //console.log(handle.timeLeft);
    var newTime = handle.currentTime + val;
    if (newTime > handle.totalTime) newTime =handle.totalTime;
    if (newTime < 0) newTime =0;
    NVR.debug ("Skipping from " + handle.currentTime + " to "+ newTime);
    handle.seekTime(newTime/1000,false);



  };

  $scope.onCanPlay = function () {

    if (isSeeking) {
      NVR.debug ("onCanPlay: triggered due to seek, skipping");
      isSkipping = false;
      return;
    }

    $ionicLoading.hide();
    $scope.isVideoLoading = false;
    NVR.debug("This video can be played");
    
    var rate = NVR.getLogin().videoPlaybackSpeed;
   
    handle.setPlayback (rate);
    if (playState== 'play') {
      NVR.debug ("Setting play at rate:"+rate+" as video can be played");
      handle.play();

    }
  };

  $scope.onVideoError = function (event) {
    $ionicLoading.hide();

    if (!$scope.isModalActive || !playerReady) return;
    NVR.debug("player reported a video error:" + JSON.stringify(event));
    $rootScope.zmPopup = SecuredPopups.show('alert', {
      title: $translate.instant('kError'),
      template: $translate.instant('kVideoError'),
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
      NVR.log("Modal was closed in timeline, cancelling timer");
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

    var loginData = NVR.getLogin();
    //console.log("Sending CGI command to " + loginData.url);
    var rqtoken = rq ? rq : "stream";
    
    var cmdUrl = loginData.url + '/index.php?view=request&request='+rqtoken+'&connkey='+connkey+'&command='+cmd+$rootScope.authSession;
    if (extras)
      cmdUrl = cmdUrl+extras;

    //&auth=

    NVR.debug ("Control: Sending "+cmdUrl);
    $http({
        //method: 'POST',
        method: 'GET',
        /*timeout: 15000,*/
        url: cmdUrl

      })
      .then(function (resp) {
          NVR.debug("sendCmd response:" + JSON.stringify(resp));
          d.resolve(resp);
          return (d.promise);

        },
        function (resp) {
          NVR.debug("sendCmd error:" + JSON.stringify(resp));
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

    var loginData = NVR.getLogin();
    //console.log("sending process Event command to " + loginData.url);
    
    var cmdUrl = loginData.url + '/index.php?view=request&request=stream&connkey='+connkey+'&command='+cmd+$rootScope.authSession;
    //&auth=
    return $http({
        method: 'GET',
        /*timeout: 15000,*/
        url: cmdUrl,
        
      })
      .then(function (resp) {
          //NVR.debug ("processEvent success:"+JSON.stringify(resp));

          resp = resp.data;
          if (resp.result == "Ok") {

            if (resp.status) $scope.currentProgress.progress = resp.status.progress;
            if (resp.status && resp.status.event) $scope.eventId = resp.status.event;
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
            NVR.debug("Hmm I found an error " + JSON.stringify(resp));
            //window.stop();
            // $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();

            // console.log (JSON.stringify(resp));
            /*$timeout(function()
            {
                sendCommand('14', $scope.connKey, '&offset=' + $scope.currentProgress.progress);
            }, 500);
            NVR.debug("so I'm regenerating Connkey to " + $scope.connKey);*/

          }
        },
        function (resp) {
          NVR.debug("processEvent error:" + JSON.stringify(resp));
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
    NVR.log("EventModalCtrl: paused");
    if ($scope.connKey) sendCommand(17, $scope.connKey);

  }

  function onResume() {
    /* NVR.debug("EventModalCtrl: Modal resume called");
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
      duration: 2000
    });
    NVR.debug("ModalCtrl:Photo saved successfuly");
  }

  function SaveError(e) {
    $ionicLoading.show({
      template: $translate.instant('kErrorSave'),
      noBackdrop: true,
      duration: 3000
    });
    //NVR.log("Error saving image: " + e.message);
    //console.log("***ERROR");
  }

  $scope.jumpToOffsetInEvent = function () {
    // streamReq.send( streamParms+"&command="+CMD_SEEK+"&offset="+offset );
  };


  $scope.saveEventVideoWithPerms = function (eid) {

    if ($rootScope.platformOS != 'android') {
      saveEvent("video", eid);
      return;
    }

    NVR.debug("EventModalCtrl: Permission checking for write");
    var permissions = cordova.plugins.permissions;
    permissions.hasPermission(permissions.WRITE_EXTERNAL_STORAGE, checkPermissionCallback, null);

    function checkPermissionCallback(status) {
      if (!status.hasPermission) {
        SaveError("No permission to write to external storage");
      }
      permissions.requestPermission(permissions.WRITE_EXTERNAL_STORAGE, succ, err);
    }

    function succ(s) {
      saveEvent("video", eid);
    }

    function err(e) {
      SaveError("Error in requestPermission");
    }

  };


  //-----------------------------------------------------------------------
  // Saves a snapshot of the monitor image to phone storage
  //-----------------------------------------------------------------------

  $scope.saveEventImageWithPerms = function (onlyAlarms,eid) {

    if ($rootScope.platformOS != 'android') {
      saveEventImage(onlyAlarms, eid);
      return;
    }

    // if we are on android do the 6.x+ hasPermissions flow
    NVR.debug("EventModalCtrl: Permission checking for write");
    var permissions = cordova.plugins.permissions;
    permissions.hasPermission(permissions.WRITE_EXTERNAL_STORAGE, checkPermissionCallback, null);

    function checkPermissionCallback(status) {
      if (!status.hasPermission) {
        SaveError("No permission to write to external storage");
      }
      permissions.requestPermission(permissions.WRITE_EXTERNAL_STORAGE, succ, err);
    }

    function succ(s) {
      saveEventImage(onlyAlarms, eid);
    }

    function err(e) {
      SaveError("Error in requestPermission");
    }
  };

  function saveEventImage(onlyAlarms, eid) {

    if ($scope.isSnapShot()) {
      $scope.selectEventUrl = $scope.constructStream();
      NVR.debug("just saving current snapshot:" + $scope.selectEventUrl);
      saveEvent("image", eid);
    } else {
      selectFrameAndSave(onlyAlarms,eid);
    }
  }

  function selectFrameAndSave(onlyAlarms, eid) {
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

       // console.log("PAUSE ANSWER IS " + JSON.stringify(resp));

        if (resp && resp.data && resp.data.status)
          $scope.currentProgress.progress = resp.data.status.progress;
        else
          $scope.currentProgress.progress = 100;

        // console.log ("STEP 0 progress is " + $scope.currentProgress.progress);
        $scope.slides = [];

        var apiurl = $scope.loginData.apiurl + "/events/" + $scope.eventId + ".json?"+$rootScope.authSession;
        NVR.debug("prepared to get frame details using " + apiurl);
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
              saveEventImageToPhone(onlyAlarms, eid);

            },
            function (err) {
              $ionicLoading.hide();
              NVR.log("snapshot API Error: Could not get frames " + JSON.stringify(err));

              $ionicLoading.show({
                template: $translate.instant('kErrorRetrievingFrames'),
                noBackdrop: true,
                duration: 4000
              });
            });
      },

      function (err) {
        NVR.debug("Error pausing stream before snapshot " + JSON.stringify(err));
        $ionicLoading.hide();
      }

    ); // then

  }

  // don't think this is used anymore
  function saveEventImageToPhone(onlyAlarms, eid) {
    var curState = carouselUtils.getStop();
    carouselUtils.setStop(true);
    var url;

    //console.log("Your index is  " + $scope.mycarousel.index);
    //console.log("Associated image is " + $scope.slides[$scope.mycarousel.index].img);




    NVR.debug("EventModalCtrl: SaveEventImageToPhone called");
    var canvas, context, imageDataUrl, imageData;
    var loginData = NVR.getLogin();

    // for alarms only
    if (onlyAlarms || ($scope.defaultVideo !== undefined && $scope.defaultVideo != ''))
      $scope.mycarousel.index = 1;

      url = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand +
        "&eid=" + $scope.eventId +
        "&fid=" + $scope.slides[$scope.mycarousel.index - 1].id + $rootScope.authSession;
    

    
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

       
              $scope.selectEventUrl = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&eid=" + $scope.eventId + "&fid=" + $scope.slides[$scope.slideIndex].id+ $rootScope.authSession;
            
           
            if ($rootScope.basicAuthToken) {
              $scope.selectEventUrl += "&basicauth=" + $rootScope.basicAuthToken;

            }

            //NVR.log("selected frame is " + $scope.slideIndex);

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

       
              $scope.selectEventUrl = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&eid=" + $scope.eventId + "&fid=" + $scope.slides[$scope.slideIndex].id+ $rootScope.authSession;
            
          
            if ($rootScope.basicAuthToken) {
              $scope.selectEventUrl += "&basicauth=" + $rootScope.basicAuthToken;

            }

            //NVR.log("selected frame is " + $scope.slideIndex);
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

       
              $scope.selectEventUrl = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&eid=" + $scope.eventId + "&fid=" + $scope.slides[$scope.slideIndex].id+ $rootScope.authSession;
           
            if ($rootScope.basicAuthToken) {
              $scope.selectEventUrl += "&basicauth=" + $rootScope.basicAuthToken;

            }
            //NVR.log("selected frame is " + $scope.slideIndex);

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

          
              $scope.selectEventUrl = $scope.playbackURL + '/index.php?view=image&rand=' + $rootScope.rand + "&eid=" + $scope.eventId + "&fid=" + $scope.slides[$scope.slideIndex].id+ $rootScope.authSession;
            
           
            if ($rootScope.basicAuthToken) {
              $scope.selectEventUrl += "&basicauth=" + $rootScope.basicAuthToken;

            }
            //NVR.log("selected frame is " + $scope.slideIndex);
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
            saveEvent("image",eid);

          }
        }
      ]
    });



  }

  function saveEvent(t,eid) {

    NVR.debug ("saveEvent  in EventModalCtrl called with "+t+" and "+ eid);
    var fname;
    var fn = "cordova.plugins.photoLibrary.saveImage";
    var loginData = NVR.getLogin();

    $ionicLoading.show({
      template: $translate.instant('kPleaseWait') + "...",
      noBackdrop: true,
      duration: zm.httpTimeout
    });

    if ($scope.defaultVideo !== undefined && $scope.defaultVideo != '' && t != "image") {
      $scope.selectEventUrl = $scope.video_url;
      fname = "zmNinja-eid-"+eid+".mp4";
      fn = "cordova.plugins.photoLibrary.saveVideo";
    } else {
      fname = "zmNinja-eid-"+eid+".jpg";
    }

    NVR.debug("-->Going to try and download " + $scope.selectEventUrl);
    var url = $scope.selectEventUrl;


    NVR.log(">>saveEvent: File path to grab is " + url);

    if ($rootScope.platformOS != 'desktop') {

      var album = 'zmNinja';
      NVR.debug("Trying to save image to album: " + album);
      cordova.plugins.photoLibrary.requestAuthorization(
        function () {
          //url = "https://picsum.photos/200/300/?random";

          var fileTransfer = new FileTransfer();
          var urle = encodeURI(url);


          fileTransfer.onprogress = function (progressEvent) {
            if (progressEvent.lengthComputable) {

              $timeout(function () {
                var perc = Math.floor(progressEvent.loaded / progressEvent.total * 100);
                $ionicLoading.show({
                  template: $translate.instant('kPleaseWait') + "... (" + perc + "%)",
                  noBackdrop: true,
                  //duration: zm.httpTimeout
                });
              });


            }
          };

          fileTransfer.download(urle, cordova.file.dataDirectory + fname,
            function (entry) {
              NVR.debug("local download complete: " + entry.toURL());
              NVR.debug("Now trying to move it to album");
              var pluginName = ((fname.indexOf('.mp4') != -1) ? "saveVideo" : "saveImage");


              cordova.plugins.photoLibrary[pluginName](entry.toURL(), album,
                function (cameraRollAssetId) {
                  SaveSuccess();
                  $cordovaFile.removeFile(cordova.file.dataDirectory, fname)
                    .then(
                      function () {
                        NVR.debug("file removed from data directory");
                      },
                      function (e) {
                        NVR.debug("could not delete temp file: " + JSON.stringify(e));
                      }
                    );


                },
                function (err) {
                  NVR.debug("Saving error:" + JSON.stringify(err));
                  SaveError();

                });




            },
            function (err) {
              NVR.log("error downloading:" + JSON.stringify(err));
              SaveError();
            }, !loginData.enableStrictSSL, {});




          // User gave us permission to his library, retry reading it!
        },
        function (err) {
          // User denied the access
          NVR.debug("Permission not granted");
          SaveError();
        }, // if options not provided, defaults to {read: true}.

        {
          read: true,
          write: true
        }
      );

    } else {
      //desktop

      $ionicLoading.hide();
      $ionicLoading.show({
        template: $translate.instant('kPleaseWait') + "...",
        noBackdrop: true
      });

        fetch(url).then(function (resp) {
          return resp.blob();
        }).then(function (blob) {
          $ionicLoading.hide();

         // console.log (blob);
          var url = window.URL.createObjectURL(blob);
          $rootScope.zmPopup = SecuredPopups.show('alert', {
            title: $translate.instant('kNote'),
            template: $translate.instant('kDownloadVideoImage') + "<br/><br/><center><a href='" + url + "' class='button button-assertive icon ion-android-download' download='"+fname+"'>" + " " + $translate.instant('kDownload') + "</a></center>",
            okText: $translate.instant('kDismiss'),
            okType: 'button-stable'
          });
  
          $rootScope.zmPopup.then (function (res) {
            //console.log ('DONE RELEASE');
            NVR.debug ('download successful');
            window.URL.revokeObjectURL(url);
            $ionicLoading.hide();

  
          });
        }).catch(function () {
          $ionicLoading.hide();
          $ionicLoading.show({
            template: $translate.instant('kErrorSave'),
            noBackdrop: true,
            duration: 2000
          });
        });



    }

  }

  $scope.reloadView = function () {
    NVR.log("Reloading view for modal view, recomputing rand");
    $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);
    $scope.isModalActive = true;
  };


  $scope.changeSnapshot = function (id) {
    $scope.snapshotFrameId = id;
    //isGlobalFid = false;
  };

  $scope.constructStream = function (monitor) {


    //console.log ("STREAMSTATE ="+currentStreamState);
    if ($scope.animationInProgress) return "";
    var stream = "";
    //console.log ("SNAPSHOT FID IS "+$scope.snapshotFrameId );
    // eventId gets populated when prepareModal completes
    if (currentStreamState == streamState.STOPPED || !$scope.eventId) {
      stream = "";
    } else if (currentStreamState == streamState.SNAPSHOT) {
      stream = currentEvent.Event.recordingURL +
        "/index.php?view=image" +
        "&fid=" + $scope.snapshotFrameId +
        "&eid=" + $scope.eventId +
        "&scale=" + $scope.singleImageQuality +
        $rootScope.authSession;
    } else if (currentStreamState == streamState.ACTIVE) {
      stream = currentEvent.Event.streamingURL +
        "/nph-zms?source=event&mode=jpeg" +
        "&event=" + $scope.eventId + "&frame=1" +
        "&replay=" + $scope.currentStreamMode +
        "&rate=100" +
        "&connkey=" + $scope.connKey +
        "&scale=" + $scope.singleImageQuality +
        $rootScope.authSession;
    }

    //console.log ($scope.connKey );
    
    //console.log ("EID="+$scope.eventId);
    if ($rootScope.basicAuthToken && stream) stream += "&basicauth=" + $rootScope.basicAuthToken;

    //console.log ("SNAPSHOT IS:="+$scope.snapshotFrameId );
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
    $scope.isVideoLoading = false;


  });

  $scope.$on('$ionicView.beforeLeave', function () {
  document.removeEventListener("pause", onPause, false);
  ddocument.removeEventListener("resume", onResume, false);
  });

  $scope.showHideControls = function () {

    if (videoPlaybarClicked) {
      NVR.debug ("Not toggling screen controls as video controls were just used");
      return;
    }

    $scope.displayControls = !$scope.displayControls;
    NVR.debug ('display overlays:'+$scope.displayControls);
  };

  $scope.$on('modal.shown', function (e, m) {

    $scope.isVideoLoading = false;
    $scope.displayControls = true;
    $ionicLoading.hide();
    if (m.id != 'footage')
      return;

    $ionicSideMenuDelegate.canDragContent(false);
    showLive = true;

    if (m.snapshot == 'enabled') {
      isSnapShotEnabled = true;
      currentStreamState = streamState.SNAPSHOT;
      if (m.snapshotId) {
       
        $scope.snapshotFrameId = NVR.getSnapshotFrame();
       // isGlobalFid = false;
      } else {
        $scope.snapshotFrameId = 1;
        isSnapShotEnabled = false;
      }

      eventId = m.eventId;
      $scope.eventId = m.eventId;

    } else currentStreamState = streamState.ACTIVE;


    if (m.showLive == 'disabled') {
      showLive = false;
      NVR.debug("I was explictly asked not to show live, cross my fingers...");
    } else {

      NVR.debug("If recording is in progress, live feed will be shown");
    }
    $scope.isToggleListMenu = true;
    $scope.isToggleListEventParamsMenu = false;
    $scope.videoDynamicTime = "";
    $scope.videoIsReady = false;
    var ld = NVR.getLogin();
    $scope.loginData = NVR.getLogin();

    $scope.singleImageQuality = (NVR.getBandwidth() == "lowbw") ? zm.eventSingleImageQualityLowBW : ld.singleImageQuality;
    $scope.blockSlider = false;
    $scope.checkEventOn = false;
    

    currentEvent = $scope.currentEvent;

    //console.log("Current Event " + JSON.stringify(currentEvent));
    $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
    NVR.debug("Generated Connkey:" + $scope.connKey);

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
            NVR.log(">>>Starting checkAllEvents interval...");

            //eventQueryHandle  = $timeout (checkEvent(), zm.eventPlaybackQuery);

            $interval.cancel(eventQueryHandle);
            checkEvent();
            eventQueryHandle = $interval(function () {
              checkEvent();
              //  console.log ("Refreshing Image...");
            }.bind(this), (NVR.getBandwidth() == "lowbw") ? zm.eventPlaybackQueryLowBW : zm.eventPlaybackQuery);
          } else {
            NVR.log(">>>Modal was exited, not starting checkAllEvents");
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
      NVR.debug("2D Context ERROR, maybe live play");

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

    // console.log ("VIDEO TIME WITH "+s+ " and "+c);
    //console.log ("$currentTime="+c);
    //console.log ("handle currentTime="+handle.currentTime);
    var a, o;
    if (NVR.getLogin().useLocalTimeZone) {
      a = moment.tz(s, NVR.getTimeZoneNow()).tz(moment.tz.guess());

    } else {
      a = moment(s);
    }
    a.add(c);

    o = a.format("MMM Do " + NVR.getTimeFormatSec());
    $scope.videoDynamicTime = o;
    //return a.format("MMM Do "+o);

  };

  $scope.$on('modal.removed', function (e, m) {

    if (!m.disableDrag )
      $ionicSideMenuDelegate.canDragContent(true);
    if ($rootScope.platformOS == 'desktop') {
      NVR.debug("Removing keyboard handler");
      window.removeEventListener('keydown', keyboardHandler, true);

    }

   // NVR.debug("Deregistering broadcast handles");
    for (var i = 0; i < broadcastHandles.length; i++) {
      // broadcastHandles[i]();
    }
    broadcastHandles = [];

    //console.log("************* REMOVE CALLED");
    $interval.cancel(eventQueryHandle);
    if (m.id != 'footage')
      return;

    $scope.isModalActive = false;

    NVR.debug("Modal removed - killing connkey");
    if ($scope.connKey) sendCommand(17, $scope.connKey);
    //$timeout (function(){NVR.stopNetwork("Modal removed inside EventModalCtrl");},400);

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

    var ld = NVR.getLogin();



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
          NVR.debug("Error in adjust speed: " + JSON.stringify(err));
        }
      );


  };

  $scope.toggleFilters = function () {
    $scope.useFilters=!$scope.useFilters;
    $scope.nextId = "...";
    $scope.prevId = "...";
    neighborEvents($scope.eventId)
    .then(function (success) {
        $scope.nextId = success.next;
        $scope.prevId = success.prev;
      },
      function (error) {
        //console.log(JSON.stringify(error));
      });

  };

  $scope.toggleFollowSameMonitor = function () {

    if ($scope.followSameMonitor == '1') {
      NVR.debug ('followSame Monitor was 1, making null');
      $scope.followSameMonitor = '';
    } else {
      NVR.debug ('followSame Monitor was null, making 1');
      $scope.followSameMonitor = '1';
    }
    $scope.nextId = "...";
    $scope.prevId = "...";
    neighborEvents($scope.eventId)
    .then(function (success) {
        $scope.nextId = success.next;
        $scope.prevId = success.prev;
      },
      function (error) {
        //console.log(JSON.stringify(error));
      });


  };

  $scope.toggleListMenu = function () {

    $scope.isToggleListMenu = !$scope.isToggleListMenu;
  };

  $scope.toggleListEventParamsMenu = function () {

    $scope.isToggleListEventParamsMenu = !$scope.isToggleListEventParamsMenu;
  };

 

  $scope.toggleGapless = function () {
    // console.log(">>>>>>>>>>>>>>GAPLESS TOGGLE INSIDE MODAL");
    $scope.loginData.gapless = !$scope.loginData.gapless;
    NVR.setLogin($scope.loginData);

    $scope.currentStreamMode = $scope.loginData.gapless ? 'gapless' : 'single';

    NVR.debug("EventModalCtrl: gapless has changed resetting everything & re-generating connkey");

    NVR.stopNetwork("EventModalCtrl-toggle gapless");
    currentStreamState = streamState.STOPPED;
    NVR.debug("Regenerating connkey as gapless has changed");
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

  function noop() {
    
  }


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
    var loginData = NVR.getLogin();
    var nextEvent = loginData.apiurl + "/events/index" +
      "/StartTime >:" + currentEvent.Event.StartTime +
      ($scope.followSameMonitor == '1' ? "/"+"MonitorId =:" + currentEvent.Monitor.Id : "") ;
      if ($scope.useFilters) {
        if (loginData.enableAlarmCount && loginData.minAlarmCount)
          nextEvent = nextEvent + "/"+"AlarmFrames >=:" + loginData.minAlarmCount;
      }
      nextEvent = nextEvent + ".json?sort=StartTime&direction=asc&limit=1"+$rootScope.authSession;
      

    var prevEvent = loginData.apiurl + "/events/index" +
      "/"+"StartTime <:" + currentEvent.Event.StartTime +
      ($scope.followSameMonitor == '1' ? "/"+"MonitorId =:"+ currentEvent.Monitor.Id : "");

      if ($scope.useFilters) {
        if (loginData.enableAlarmCount && loginData.minAlarmCount)
          prevEvent = prevEvent + "/"+"AlarmFrames >=:" + loginData.minAlarmCount;
      }
      prevEvent = prevEvent + ".json?sort=StartTime&direction=desc&limit=1"+$rootScope.authSession;



    NVR.debug("Neighbor next URL=" + nextEvent);
    NVR.debug("Neighbor pre URL=" + prevEvent);

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
        NVR.debug("neighbors of " + currentEvent.Event.Id + "are pre=" + preId + " next=" + nextId);
        neighbors.next = nextId;
        neighbors.prev = preId;
        d.resolve(neighbors);
        return d.promise;


        // prev
        //  console.log ("NEXT:",JSON.stringify(data[0].data),"PREV:",JSON.stringify(data[1].data));
      }, function (error) {
        NVR.log("Error retrieving neighbors" + JSON.stringify(error));
        d.reject(neighbors);
        return (d.promise);

      })
      .catch (noop);

    return (d.promise);

  }

  $scope.zoomImage = function (val) {
    var zl = parseInt($ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom);
    if (zl == 1 && val == -1) {
      NVR.debug("Already zoomed out max");
      return;
    }

    zl += val;
    NVR.debug("Zoom level is " + zl);
    $ionicScrollDelegate.$getByHandle("imgscroll").zoomTo(zl, true);

  };



  $scope.deleteAndMoveNext = function (id) {
    NVR.debug("Delete and move next called with: " + id);
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
    var loginData = NVR.getLogin();
    var apiDelete = loginData.apiurl + "/events/" + id + ".json?"+$rootScope.authSession;
    NVR.debug("DeleteEvent: ID=" + id);
    NVR.log("Delete event " + apiDelete);

    $ionicLoading.show({
      template: "{{'kDeletingEvent' | translate}}...",
      noBackdrop: true,
      duration: zm.httpTimeout
    });

    return $http.delete(apiDelete)
      .then(function (data) {
          data = data.data;
          $ionicLoading.hide();
          // NVR.debug("delete output: " + JSON.stringify(data));

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

          // NVR.displayBanner('info', [$translate.instant('kDeleteEventSuccess')], 2000, 2000);




          //doRefresh();

        },
        function (data) {
          $ionicLoading.hide();
          NVR.debug("delete error: " + JSON.stringify(data));
          NVR.displayBanner('error', [$translate.instant('kDeleteEventError1'), $translate.instant('kDeleteEventError2')]);
        });
  }
  //--------------------------------------------------------
  //Navigate to next/prev event in full screen mode
  //--------------------------------------------------------

  $scope.onSwipeEvent = function (eid, dirn) {

    var diff = moment().diff($scope.lastVideoStateTime.time);
      if (diff <= 1000) {
        NVR.debug ("Not swiping, time interval was only:"+diff+" ms");
        return;
      }
    //console.log("CALLED WITH " + eid + " dirn " + dirn);
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

    if (isSnapShotEnabled) {
      $scope.snapshotFrameId = NVR.getSnapshotFrame();
    } else {
      $scope.snapshotFrameId = 1;
    }
    
    $scope.isPaused = false;
    //isGlobalFid = false;
    var oState;
    NVR.log("HERE: Event jump called with:" + eid);
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

      NVR.log("ModalCtrl:Stopping network pull...");
      NVR.stopNetwork("EventModalCtrl-out with old");
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
    var ld = NVR.getLogin();
    if (!ld.canSwipeMonitors) return;


    // NVR.log("using zms to move ");

    if (currentStreamState == streamState.ACTIVE && ($scope.defaultVideo == '' || $scope.defaultVideo == 'undefined')) {
      // need to kill zms
      currentStreamState = streamState.STOPPED;
      $timeout(function () {
        NVR.killLiveStream($scope.connKey);

      });

    }

    if ($scope.defaultVideo != "" && $scope.defaultVideo != 'undefined') {

      if (handle) {

        NVR.debug("Clearing video feed...");
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
      NVR.debug("Moving to:" + $scope.nextId);
      prepareModalEvent($scope.nextId);
    } else if (dirn == 2) {
      // this is called when you delete
      var id = "";
      if ($scope.nextId > 0) id = $scope.nextId;
      else if ($scope.prevId > 0) id = $scope.prevId;
      NVR.debug("after delete, moving to " + id);
      prepareModalEvent(id);


    } else if (dirn == -1 && $scope.prevId > 0) {
      NVR.debug("Moving to:" + $scope.prevId);
      prepareModalEvent($scope.prevId);
    }




  }

  function humanizeTime(str) {
    // if (NVR.getLogin().useLocalTimeZone)
    return moment.tz(str, NVR.getTimeZoneNow()).fromNow();
    //  else    
    //    return moment(str).fromNow();

  }


  function jumpToEventVideo(dirn) {
    var ld = NVR.getLogin();
    var url = ld.url + '/index.php?view=request&request=status&entity=nearevents&id=' + $scope.eventId;
    // url += "&filter%5BQuery%5D%5Bterms%5D%5B0%5D%5Battr%5D=MonitorId&filter%5BQuery%5D%5Bterms%5D%5B0%5D%5Bop%5D=%3D&filter%5BQuery%5D%5Bterms%5D%5B0%5D%5Bval%5D=5&sort_field=StartTime&sort_asc=1"; // wtf junk
    NVR.debug("Asking nearest video EID using " + url);
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
    NVR.debug("Sending " + cmd + " to " + connkey);

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

          NVR.debug("Hmm jump  error " + JSON.stringify(error));
          NVR.stopNetwork("EventModalCtrl-jumptoEventZms error");
          $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
          //  console.log ("********* OFFSET FROM JUMPTOEVENTZMS ERROR");
          $timeout(function () {
            sendCommand('14', $scope.connKey, '&offset=' + $scope.currentProgress.progress);
          }, 500);
          NVR.debug("so I'm regenerating Connkey to " + $scope.connKey);
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
    var loginData = NVR.getLogin();
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
    var loginData = NVR.getLogin();
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
    NVR.log("Playback of event " + currentEvent.Event.Id + " is finished");

    if ($scope.loginData.gapless) {

      neighborEvents(currentEvent.Event.Id, currentEvent.Monitor.Id)
        .then(function (success) {

            // lets give a second before gapless transition to the next event
            $timeout(function () {
              $scope.nextId = success.next;
              $scope.prevId = success.prev;
              NVR.debug("Gapless move to event " + $scope.nextId);
              playState = 'play';
              jumpToEvent($scope.nextId, 1);
            }, 1000);
          },
          function (error) {
            NVR.debug("Error in neighbor call " +
              JSON.stringify(error));
          });
    } else {
      NVR.debug("not going to next event, gapless is off");
    }
  }

  function computeAlarmFrames(data) {
    $scope.alarm_images = [];
    tempAlarms = [];
    $scope.FrameArray = [];


    //console.log ("FRAME ARRAY: "+JSON.stringify(data));
    if (data.event && data.event.Frame) $scope.FrameArray = data.event.Frame;
    var ts = 0;

    for (i = 0; i < data.event.Frame.length; i++) {
      if (data.event.Frame[i].Type == "Alarm") {

        // console.log ("**ONLY ALARM AT " + i + "of " + data.event.Frame.length);

        if (ts != data.event.Frame[i].TimeStamp) {
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

      // add snapshot
    if (NVR.getSnapshotFrame() == 'snapshot') {
        $scope.alarm_images.unshift({
            frameid: 'snapshot',
            id: 'doesntseemtobeusedhuh'
        });
    }
    if (data.event.Event.Notes.indexOf('detected:') != -1) {
          
            NVR.debug ("You have object detection! Adding object detect frame");
            var frameid = 'objdetect';
            var ld = NVR.getLogin();
            if (!ld.showAnimation) {
              if (NVR.versionCompare(ld.currentServerVersion, '1.35') != -1) {
               frameid = 'objdetect_jpg';
              }

            }
          
            $scope.alarm_images.unshift({
                frameid: frameid,
                id: 'whatever'
             });

            NVR.debug ("Your ZM version is:"+NVR.getCurrentServerVersion()+" and your obj frame setting is:"+NVR.getLogin().showObjectDetectionFrame);

    } else {
      NVR.debug ("No object detection found in notes");
    }

  }

  $scope.constructFrame = function (fid) {

    var frame = "";
    frame = currentEvent.Event.recordingURL + "/index.php?view=image" +
      "&eid=" + currentEvent.Event.Id +
      "&fid=" + fid +
      "&height=" + 200;

    if ($rootScope.authSession != 'undefined') frame += $rootScope.authSession;
    frame += NVR.insertSpecialTokens();
    //console.log ("alarm:"+frame);
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
    var loginData = NVR.getLogin();
    var myurl = loginData.apiurl + '/events/' + eid + ".json?"+$rootScope.authSession;
    NVR.log("*** Constructed API for detailed events: " + myurl);
    $scope.humanizeTime = "...";
    $scope.mName = "...";
    $scope.liveFeedMid = $scope.mid;

    $http.get(myurl)
      .then(function (success) {

          var event = success.data.event;
          currentEvent = event;
          $scope.event = event;
          $scope.currentEvent = event;

         // console.log ("prepareModal DATA:"+JSON.stringify(success.data));
          computeAlarmFrames(success.data);
          $scope.eventWarning = '';

          if (!event.Event.EndTime && showLive) {
            $scope.eventWarning = $translate.instant('kEventStillRecording');
            // if this happens we get to live feed 
            $scope.liveFeedMid = event.Event.MonitorId;
            NVR.log("Event not ready, setting live view, with MID=" + $scope.liveFeedMid);
          }

          event.Event.BasePath = computeBasePath(event);
          event.Event.relativePath = computeRelativePath(event);

          event.Event.streamingURL = NVR.getStreamingURL(event.Event.MonitorId);
          
          event.Event.recordingURL = NVR.getRecordingURL(event.Event.MonitorId);
          event.Event.imageMode = NVR.getImageMode(event.Event.MonitorId);

          //console.log (JSON.stringify( success));
          $scope.eventName = event.Event.Name;
          $scope.eventId = event.Event.Id;
          $scope.d_eventId = $scope.eventId;
          $scope.eFramesNum = event.Event.Frames;
          $scope.eventDur = Math.round(event.Event.Length);
          $scope.loginData = NVR.getLogin();
          $scope.humanizeTime = humanizeTime(event.Event.StartTime);
          $scope.mName = NVR.getMonitorName(event.Event.MonitorId);
          //console.log (">>>>>>>>HUMANIZE " + $scope.humanizeTime);

          // console.log("**** VIDEO STATE IS " + event.Event.DefaultVideo);
          if (typeof event.Event.DefaultVideo === 'undefined' || event.Event.DefaultVideo == '') {
            event.Event.DefaultVideo = "";
          }


          

          var ld = NVR.getLogin();
          if (ld.monitorSpecific[event.Event.MonitorId] &&
              ld.monitorSpecific[event.Event.MonitorId].forceMjpeg) {
                NVR.debug ('Monitor:'+event.Event.MonitorId+' has forced MJPEG playback');
                $scope.defaultVideo ='';
          } else {
            
            $scope.defaultVideo = event.Event.DefaultVideo;
          }

         

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

            videoURL = event.Event.recordingURL + "/index.php?view=view_video&eid=" + event.Event.Id;

          if ($rootScope.authSession != 'undefined') videoURL += $rootScope.authSession;
          if ($rootScope.basicAuthToken) videoURL = videoURL + "&basicauth=" + $rootScope.basicAuthToken;

          // hack
          //videoURL = "http://static.videogular.com/assets/videos/videogular.mp4";

          $scope.video_url = videoURL;

          //console.log("************** VIDEO IS " + videoURL);

          NVR.debug("Video url passed to player is: " + videoURL);

         
          $scope.videoObject = {
            config: {
              autoPlay: true,
              responsive: true,
              nativeControls: false,
              nativeFullScreen: true,

              playsInline: true,
              sources: [{
                  src: $sce.trustAsResourceUrl(videoURL),
                  type: "video/mp4"
                }

              ],

              theme: "external/videogular2.2.1/videogular.min.css",
              cuepoints: {
                theme: {
                  url: "external/videogular2.2.1/videogular-cuepoints.min.css"
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
          NVR.log("Error retrieving detailed frame API " + JSON.stringify(err));
         // NVR.displayBanner('error', ['could not retrieve frame details']);
          $scope.eventWarning = $translate.instant('kLiveView');
            // if this happens we get to live feed 
            $scope.liveFeedMid = $scope.mid;
    

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
