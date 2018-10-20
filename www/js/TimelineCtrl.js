/* jshint -W041 */
/* jshint -W083 */
/*This is for the loop closure I am using in line 143 */
/* jslint browser: true*/
/* global vis,cordova,StatusBar,angular,console,moment */

// This controller creates a timeline
// It uses the visjs library, but due to performance reasons
// I've disabled pan and zoom and used buttons instead
// also limits # of items to maxItems 

// FIXME: too much redundant code between EventCtrl and Timeline 
// Move to ModalCtrl and see if it works

angular.module('zmApp.controllers').controller('zmApp.TimelineCtrl', ['$ionicPlatform', '$scope', 'zm', 'NVRDataModel', '$ionicSideMenuDelegate', '$rootScope', '$http', '$q', 'message', '$state', '$ionicLoading', '$ionicPopover', '$ionicScrollDelegate', '$ionicModal', '$timeout', '$ionicContentBanner', '$ionicHistory', '$sce', '$stateParams', '$translate', '$ionicPopup', '$interval', function ($ionicPlatform, $scope, zm, NVRDataModel, $ionicSideMenuDelegate, $rootScope, $http, $q, message, $state, $ionicLoading, $ionicPopover, $ionicScrollDelegate, $ionicModal, $timeout, $ionicContentBanner, $ionicHistory, $sce, $stateParams, $translate, $ionicPopup, $interval) {
  var broadcastHandles = [];

  //console.log("Inside Timeline controller");
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

  //---------------------------------------f-------------------------
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

  $scope.leftButtons = [{
    type: 'button-icon icon ion-navicon',
    tap: function (e) {
      $scope.toggleMenu();
    }
  }];

  //-----------------------------------------------------------
  // Used to display date range for timeline
  //-----------------------------------------------------------
  $scope.prettify = function (str) {
    if (NVRDataModel.getLogin().useLocalTimeZone)
      return moment.tz(str, NVRDataModel.getTimeZoneNow()).tz(moment.tz.guess()).format('MMMM Do YYYY, ' + NVRDataModel.getTimeFormat());
    else
      return moment(str).format('MMMM Do YYYY, ' + NVRDataModel.getTimeFormat());
  };

  //-----------------------------------------------------------
  // used for playback when you tap on a timeline event
  //-----------------------------------------------------------
  $scope.calcMsTimer = function (frames, len) {
    var myframes, mylen;
    myframes = parseFloat(frames);
    mylen = parseFloat(len);
    //  console.log ("frames " + myframes + "length " + mylen);
    //  console.log ("*** MS COUNT " + (1000.0/(myframes/mylen)));
    return (Math.round(1000 / (myframes / mylen)));
  };

  $scope.toggleMinAlarmFrameCount = function () {
    // console.log("Toggling");

    var ld = NVRDataModel.getLogin();
    ld.enableAlarmCount = !ld.enableAlarmCount;

    NVRDataModel.setLogin(ld);
    $scope.loginData = ld;

    drawGraph(curFromDate, curToDate, curCount);

  };

  //-----------------------------------------------------------
  // Move/Zoom are used to move the timeline around
  //-----------------------------------------------------------
  function move(percentage) {
    var range = timeline.getWindow();
    var interval = range.end - range.start;

    timeline.setWindow({
      start: range.start.valueOf() - interval * percentage,
      end: range.end.valueOf() - interval * percentage
    });
  }

  // helps to navigate to current time quickly
  // after a night of heavy navigation
  $scope.gotoNow = function () {
    timeline.moveTo(timeline.getCurrentTime());
  };

  $scope.move = function (percentage) {
    move(percentage);

  };

  //-----------------------------------------
  // Move by X days 
  //-----------------------------------------
  $scope.moveDays = function (d) {
    var range = timeline.getWindow();
    var ds = moment(range.start);
    if (d > 0)
      ds.add(d, 'days');
    else
      ds.subtract(Math.abs(d), 'days');

    var es = moment(ds); // clone it!
    es.add(1, 'day');

    fromDate = ds.format("YYYY-MM-DD HH:mm:ss");
    toDate = es.format("YYYY-MM-DD HH:mm:ss");

    $scope.fromDate = fromDate;
    $scope.toDate = toDate;
    $rootScope.customTimelineRange = false;
    NVRDataModel.log("moving by " + d + " day to " + fromDate + " upto " + toDate);
    drawGraph(fromDate, toDate, maxItems);

  };

  function eventDetails(ev) {
    $scope.event = ev;
    $ionicModal.fromTemplateUrl('templates/timeline-modal.html', {
        scope: $scope, // give ModalCtrl access to this scope
        animation: 'slide-in-up',
        id: 'analyze',

      })
      .then(function (modal) {
        $scope.modal = modal;

        $scope.modal.show();

      });
  }

  //--------------------------------------------------------
  // To show a modal dialog with the event tapped on in timeline
  // FIXME : code repeat from Events
  //--------------------------------------------------------
  function openModal(event) {

    if ($scope.modalFromTimelineIsOpen == true) {
      // don't know why but some conflict from angular to timeline lib
      // results in double modals at times
      NVRDataModel.log(">>-- duplicate modal detected, preventing");
    }

    $scope.modalFromTimelineIsOpen = true;
    NVRDataModel.setAwake(NVRDataModel.getKeepAwake());

    // pass this event to ModalCtrl
    $scope.currentEvent = event;

    $scope.event = event;
    // in Timeline view, make sure events stick to same monitor
    $scope.followSameMonitor = "1";

    //prepareModalEvent(event.Event.Id);

    var ld = NVRDataModel.getLogin();
    var sl = 'disabled';
    if (ld.showLiveForInProgressEvents) {
      sl = 'enabled';
    }

    $scope.modalData = {
      doRefresh: false
    };
    $ionicModal.fromTemplateUrl('templates/events-modal.html', {
        scope: $scope, // give ModalCtrl access to this scope
        animation: 'slide-in-up',
        id: 'footage',
        showLive: sl
      })
      .then(function (modal) {
        $scope.modal = modal;

        $ionicLoading.show({
          template: $translate.instant('kPleaseWait') + "...",
          noBackdrop: true,
          duration: 10000,

        });

        $scope.modal.show();

        var ld = NVRDataModel.getLogin();

      });

  }

  //--------------------------------------------------------
  //We need to destroy because we are instantiating
  // it on open
  //--------------------------------------------------------
  $scope.closeModal = function () {
    $scope.modalFromTimelineIsOpen = false;
    // $interval.cancel(eventsInterval);
    //$interval.cancel(segmentHandle);
    NVRDataModel.debug("TimelineCtrl:Close & Destroy Modal");
    NVRDataModel.stopNetwork("TimelineCtrl: closeModal");
    NVRDataModel.setAwake(false);
    if ($scope.modal !== undefined) {
      $scope.modal.remove();
    }

    if ($scope.modalData.doRefresh) {

      $timeout(function () {
        drawGraph($scope.fromDate, $scope.toDate, maxItems);
      }, 500);

    }

  };

  /*   $scope.toggleGapless = function()
        {
            console.log ("GAPLESS TOGGLE");
            $scope.loginData.gapless = !$scope.loginData.gapless;
            NVRDataModel.setLogin($scope.loginData);
            
        };*/

  //-------------------------------------------------------------------------
  // called when user switches to background
  //-------------------------------------------------------------------------
  function onPause() {
    NVRDataModel.debug("TimelineCtrl:onpause called");
    $interval.cancel(updateInterval);
    // console.log("*** Moving to Background ***"); // Handle the pause event

    if ($scope.popover) $scope.popover.remove();

  }

  //--------------------------------------------------------
  // This function is called by the graph ontapped function
  // which in turn calls openModal
  //--------------------------------------------------------

  function showEvent(event) {

    // in context of angular

    $timeout(function () {
      openModal(event);
    });

  }

  var tzu = $scope.$on('tz-updated', function () {
    $scope.tzAbbr = NVRDataModel.getTimeZoneNow();
    NVRDataModel.debug("Timezone API updated timezone to " + NVRDataModel.getTimeZoneNow());
  });
  broadcastHandles.push(tzu);

  //-------------------------------------------------
  // Make sure we delete the timeline
  // This may be redundant as the root view gets
  // destroyed but no harm
  //-------------------------------------------------
  $scope.$on('$ionicView.leave', function () {

    if ($rootScope.platformOS == 'desktop') {
      NVRDataModel.debug("Removing keyboard handler");
      window.removeEventListener('keydown', keyboardHandler, true);

    }

    NVRDataModel.debug("Timeline: Deregistering broadcast handles");
    for (var i = 0; i < broadcastHandles.length; i++) {
      // broadcastHandles[i]();
    }
    broadcastHandles = [];

    if (timeline) {
      $interval.cancel(updateInterval);
      timeline.destroy();
      //console.log("**Destroying Timeline");

    }
  });

  /*$scope.$on('$ionicView.enter', function() {



    
  });*/

  $scope.$on('$ionicView.beforeEnter', function () {

    //$ionicHistory.clearCache();
    //$ionicHistory.clearHistory();
    timeline = '';
    $scope.newEvents = '';

    if ($rootScope.platformOS == 'desktop') {
      window.addEventListener('keydown', keyboardHandler, true);

    }


  });

  // Keyboard handler for desktop versions 
  function keyboardHandler(evt) {

    var handled = false;
    var keyCodes = {

      //events
      LEFT: 37,
      RIGHT: 39,
      UP: 38,
      DOWN: 40,

      ESC: 27,

      PREVDAY_A: 65,
      NEXTDAY_D: 68,

    };

    $timeout(function () {
      var keyCode = evt.keyCode;

      console.log(keyCode + " PRESSED");

      if (keyCode == keyCodes.UP) {

        timeline.zoomIn(0.2);

      } else if (keyCode == keyCodes.DOWN) {

        timeline.zoomIn(0.2);

      } else if (keyCode == keyCodes.LEFT) {

        move(-0.2);
      } else if (keyCode == keyCodes.RIGHT) {
        move(0.2);
      } else if (keyCode == keyCodes.ESC) {
        timeline.fit();
      } else if (keyCode == keyCodes.PREVDAY_A) {
        $scope.moveDays(-1);
      } else if (keyCode == keyCodes.NEXTDAY_D) {
        $scope.moveDays(1);
      }


      handled = true;
      return handled;

    });
  }

  //-------------------------------------------
  // Entire reason for existence:
  // double tap doesn't reliably work
  // when paired with tap on mobiles
  //-------------------------------------------

  $scope.toggleTap = function () {

    if ($scope.onTap == $translate.instant('kTimelineEvent')) {
      $scope.onDTap = $translate.instant('kTimelineEvent');
      $scope.onTap = $translate.instant('kTimelineGraph');

    } else {
      $scope.onTap = $translate.instant('kTimelineEvent');
      $scope.onDTap = $translate.instant('kTimelineGraph');
    }
    $scope.timelineControls = $translate.instant('kTimelineTap') + ':' + $scope.onTap + " / " + $translate.instant('kTimelineDTap') + ':' + $scope.onDTap;

  };


  //-------------------------------------------------
  // FIXME: shitty hackery -- Im using a rootScope
  // to know if you just went to custom range
  // and back. Fix this, really.
  // So anyway, if you did select a custom range
  // then we "go back" to timeline, which is when
  // we come here - so make sure we update the
  // graph range
  //-------------------------------------------------


  $scope.$on('$ionicView.afterEnter', function () {

    $scope.monitors = message;

    $scope.onTap = $translate.instant('kTimelineEvent');
    $scope.onDTap = $translate.instant('kTimelineGraph');
    $scope.timelineControls = $translate.instant('kTimelineTap') + ':' + $scope.onTap + " / " + $translate.instant('kTimelineDTap') + ':' + $scope.onDTap;

    //console.log("***AFTER ENTER");

    $scope.follow = {
      'time': NVRDataModel.getLogin().followTimeLine
    };

    $interval.cancel(updateInterval);

    // Make sure sliding for menu is disabled so it
    // does not interfere with graph panning
    $ionicSideMenuDelegate.canDragContent(false);
    var ld = NVRDataModel.getLogin();
    maxItemsConf = ($rootScope.platformOS == 'desktop') ? zm.graphDesktopItemMax : zm.graphItemMax;
    maxItems = ld.graphSize || maxItemsConf;
    NVRDataModel.log("Graph items to draw is " + maxItems);
    $scope.maxItems = maxItems;
    $scope.translationData = {
      maxItemsVal: maxItems
    };

    $scope.graphLoaded = false;
    NVRDataModel.debug("TimelineCtrl/drawGraph: graphLoaded is " + $scope.graphLoaded);

    //latestDateDrawn = moment().locale('en').format("YYYY-MM-DD HH:mm:ss");
    $scope.modalFromTimelineIsOpen = false;
    //var tempMon = message;

    // lets timeline.onget the abbreviated version of TZ to display
    if (NVRDataModel.getLogin().useLocalTimeZone) {
      $scope.tzAbbr = moment().tz(moment.tz.guess()).zoneAbbr();
    } else {
      $scope.tzAbbr = moment().tz(NVRDataModel.getTimeZoneNow()).zoneAbbr();
    }

    //console.log ("TIMELINE MONITORS: " + JSON.stringify(message));
    //var ld = NVRDataModel.getLogin();
    $scope.loginData = NVRDataModel.getLogin();

    /* if (ld.persistMontageOrder) {
         var iMon = NVRDataModel.applyMontageMonitorPrefs(tempMon, 2);
         $scope.monitors = iMon[0];
     } else*/

    //console.log ("MONITORS:"+JSON.stringify($scope.monitors));

    if ($rootScope.customTimelineRange) {
      $scope.currentMode = 'custom';
      //console.log("***** CUSTOM RANGE");
      if (moment($rootScope.fromString).isValid() &&
        moment($rootScope.toString).isValid()) {
        // console.log("FROM & TO IS CUSTOM");
        fromDate = $rootScope.fromString;
        toDate = $rootScope.toString;
        $scope.fromDate = fromDate;
        $scope.toDate = toDate;
        drawGraph(fromDate, toDate, maxItems);
      } else {
        //console.log("From:" + $rootScope.fromString + " To:" + $rootScope.toString);
        //console.log("FROM & TO IS CUSTOM INVALID");

        if (NVRDataModel.getLogin().useLocalTimeZone) {
          fromDate = moment().startOf('day').format("YYYY-MM-DD HH:mm:ss");
          toDate = moment().endOf('day').format("YYYY-MM-DD HH:mm:ss");
        } else {
          fromDate = moment().tz(NVRDataModel.getTimeZoneNow()).startOf('day').format("YYYY-MM-DD HH:mm:ss");
          toDate = moment().tz(NVRDataModel.getTimeZoneNow()).endOf('day').format("YYYY-MM-DD HH:mm:ss");
        }

        drawGraph(fromDate, toDate, maxItems);
      }
    } else {
      $scope.currentMode = 'day';

      if (NVRDataModel.getLogin().useLocalTimeZone) {
        fromDate = moment().startOf('day').format("YYYY-MM-DD HH:mm:ss");
        toDate = moment().endOf('day').format("YYYY-MM-DD HH:mm:ss");
      } else {
        fromDate = moment().tz(NVRDataModel.getTimeZoneNow()).startOf('day').format("YYYY-MM-DD HH:mm:ss");
        toDate = moment().tz(NVRDataModel.getTimeZoneNow()).endOf('day').format("YYYY-MM-DD HH:mm:ss");
      }
      drawGraph(fromDate, toDate, maxItems);
    }

    $ionicPopover.fromTemplateUrl('templates/timeline-popover.html', {
      scope: $scope,
    }).then(function (popover) {
      $scope.popover = popover;
    });

    // --------------------------------------------------------
    // Handling of back button in case modal is open should
    // close the modal
    // --------------------------------------------------------                               

    $ionicPlatform.registerBackButtonAction(function (e) {
      e.preventDefault();
      if ($scope.modal != undefined && $scope.modal.isShown()) {
        // switch off awake, as liveview is finished
        NVRDataModel.debug("Modal is open, closing it");
        NVRDataModel.setAwake(false);
        $scope.modal.remove();
      } else {
        NVRDataModel.debug("Modal is closed, so toggling or exiting");
        if (!$ionicSideMenuDelegate.isOpenLeft()) {
          $ionicSideMenuDelegate.toggleLeft();

        } else {
          navigator.app.exitApp();
        }

      }

    }, 1000);

  });

  //-------------------------------------------------
  // Controller main
  //-------------------------------------------------

  var graphIndex;
  var updateInterval;
  var lastTimeForEvent;
  var groups, graphData;
  var isProcessNewEventsWaiting = false;
  var options;
  var dblclick = false;

  $scope.mycarousel = {
    index: 0
  };
  $scope.ionRange = {
    index: 1
  };

  var curFromDate, curToDate, curCount;

  document.addEventListener("pause", onPause, false);

  // FIXME: Timeline awake to avoid graph redrawing
  NVRDataModel.setAwake(NVRDataModel.getKeepAwake());

  // fromDate and toDate will be used to plot the range for the graph
  // We start in day mode
  // 
  var fromDate, toDate;

  fromDate = moment().tz(NVRDataModel.getLogin().useLocalTimeZone ? NVRDataModel.getLocalTimeZoneNow() : NVRDataModel.getTimeZoneNow()).startOf('day').format("YYYY-MM-DD HH:mm:ss");
  toDate = moment().tz(NVRDataModel.getLogin().useLocalTimeZone ? NVRDataModel.getLocalTimeZoneNow() : NVRDataModel.getTimeZoneNow()).endOf('day').format("YYYY-MM-DD HH:mm:ss");

  $scope.fromDate = fromDate;
  $scope.toDate = toDate;

  // maxItems will be ignored during timeline draw if its desktop
  var maxItemsConf;

  var ld = NVRDataModel.getLogin();
  var maxItems;

  //flat colors for graph - https://flatuicolors.com http://www.flatuicolorpicker.com
  var colors = ['#3498db', '#E57373', '#EB974E', '#95A5A6', '#e74c3c', '#03C9A9', ];

  var container;
  container = angular.element(document.getElementById('visualization'));
  var timeline;

  //console.log ("RETURNING MONITORS " + JSON.stringify($scope.monitors));
  //$scope.monitors = message;

  //console.log ("MONITOR DATA AFTER APPLYING : " + JSON.stringify($scope.monitors));

  $scope.navControls = false;
  var navControls = false;

  //drawGraph(fromDate, toDate, maxItems);
  //dummyDrawGraph(fromDate, toDate,maxItems);

  //-------------------------------------------------
  // Rest graph to sane state after you went
  // wild zooming and panning :-)
  //-------------------------------------------------
  $scope.fit = function () {
    timeline.fit();
  };

  $scope.toggleNav = function () {
    if (navControls == true) {
      navControls = !navControls;
      // $scope.navControls = navControls;
      // give out animation time
      $timeout(function () {
        $scope.navControls = navControls;
      }, 2000);
    } else {
      navControls = !navControls;
      $scope.navControls = navControls;
    }
    var element = angular.element(document.getElementById("timeline-ctrl"));

    if (navControls) {
      element.removeClass("animated bounceOutLeft");
      element.addClass("animated bounceInRight");
    } else {
      element.removeClass("animated bounceInRight");
      element.addClass("animated bounceOutLeft");
    }

  };

  function shortenTime(str) {
    if (NVRDataModel.getLogin().useLocalTimeZone)
      return moment.tz(str, NVRDataModel.getTimeZoneNow()).tz(moment.tz.guess()).format(NVRDataModel.getTimeFormat());
    else
      return moment(str).format(NVRDataModel.getTimeFormat());
  }

  $scope.toggleFollowTime = function () {
    /*if ($scope.currentMode != 'day') {
        $rootScope.zmPopup = $ionicPopup.alert({
            title: $translate.instant('kError'),
            template: $translate.instant('kFollowError')
        });
        return;
    }*/
    $scope.follow.time = !$scope.follow.time;
    var loginData = NVRDataModel.getLogin();
    loginData.followTimeLine = $scope.follow.time;
    NVRDataModel.setLogin(loginData);
  };
  //-------------------------------------------------
  // Called with day/week/month
  // so we can redraw the graph
  //-------------------------------------------------

  $scope.buttonClicked = function (index) {
    //console.log (index);
    if (index == 0) //month
    {
      $scope.follow.time = NVRDataModel.getLogin().followTimeLine;
      $scope.currentMode = "month";
      NVRDataModel.log("Month view");
      $rootScope.customTimelineRange = false;

      toDate = moment().format("YYYY-MM-DD HH:mm:ss");
      fromDate = moment().subtract(1, 'month').startOf('day').format("YYYY-MM-DD HH:mm:ss");
      $scope.fromDate = fromDate;
      $scope.toDate = toDate;
      drawGraph(fromDate, toDate, maxItems);
    } else if (index == 1) //week
    {
      $scope.follow.time = NVRDataModel.getLogin().followTimeLine;
      $scope.currentMode = "week";
      $rootScope.customTimelineRange = false;
      NVRDataModel.log("Week  view");
      toDate = moment().tz(NVRDataModel.getLogin().useLocalTimeZone ? NVRDataModel.getLocalTimeZoneNow() : NVRDataModel.getTimeZoneNow()).format("YYYY-MM-DD HH:mm:ss");
      fromDate = moment().tz(NVRDataModel.getLogin().useLocalTimeZone ? NVRDataModel.getLocalTimeZoneNow() : NVRDataModel.getTimeZoneNow()).subtract(1, 'week').startOf('day').format("YYYY-MM-DD HH:mm:ss");
      $scope.fromDate = fromDate;
      $scope.toDate = toDate;
      drawGraph(fromDate, toDate, maxItems);
    } else if (index == 2) //day
    {

      $scope.currentMode = "day";
      $rootScope.customTimelineRange = false;
      NVRDataModel.log("Day view");
      //toDate = moment().format("YYYY-MM-DD HH:mm:ss");
      fromDate = moment().tz(NVRDataModel.getLogin().useLocalTimeZone ? NVRDataModel.getLocalTimeZoneNow() : NVRDataModel.getTimeZoneNow()).startOf('day').format("YYYY-MM-DD HH:mm:ss");
      toDate = moment().tz(NVRDataModel.getLogin().useLocalTimeZone ? NVRDataModel.getLocalTimeZoneNow() : NVRDataModel.getTimeZoneNow()).endOf('day').format("YYYY-MM-DD HH:mm:ss");
      $scope.fromDate = fromDate;
      $scope.toDate = toDate;
      drawGraph(fromDate, toDate, maxItems);
    } else // custom
    {
      $scope.follow.time = NVRDataModel.getLogin().followTimeLine;
      $scope.currentMode = "custom";
      $rootScope.customTimelineRange = true;
      $state.go('app.events-date-time-filter');
      return;
    }

  };

  /**
   * [processNewEvents is called every X seconds when dynamic update is on. X = 10 for now]
   * @return {[type]}
   */
  function processNewEvents() {

    //safeguard in the event http calls are still going on
    if (!$scope.follow.time || isProcessNewEventsWaiting) return;

    var ld = NVRDataModel.getLogin();

    // check for last 2 minutes to account for late DB updates and what not. 5 mins was likely enough
    // 

    // make sure these are server time
    var from = moment(lastTimeForEvent).tz(NVRDataModel.getTimeZoneNow());
    from = from.subtract(2, 'minutes').locale('en').format("YYYY-MM-DD HH:mm:ss");

    var to = moment(lastTimeForEvent).tz(NVRDataModel.getTimeZoneNow());
    to = to.locale('en').format("YYYY-MM-DD HH:mm:ss");

    lastTimeForEvent = moment().tz(NVRDataModel.getLogin().useLocalTimeZone ? NVRDataModel.getLocalTimeZoneNow() : NVRDataModel.getTimeZoneNow());

    // FIXME: totally ignoring event pages - hoping it wont be more than 100 or 150 whatever
    // the events per page limit is. Why? laziness.
    // 
    var completedEvents = ld.apiurl + '/events/index/EndTime >=:' + from;
    // we can add alarmCount as this is really for completed events
    //completedEvents = completedEvents + "/AlarmFrames >=:" + (ld.enableAlarmCount ? ld.minAlarmCount : 0);

    completedEvents = completedEvents + ".json";

    // now get currently ongoing events
    // as it turns out various events get stored withn null and never recover
    // so, lets limiy to 15 m
    // 

    var st = moment(lastTimeForEvent).tz(NVRDataModel.getTimeZoneNow());
    st = st.subtract(10, 'minutes').locale('en').format("YYYY-MM-DD HH:mm:ss");
    var ongoingEvents = ld.apiurl + '/events/index/StartTime >=:' + st + '/EndTime =:.json';
    //NVRDataModel.debug("Getting incremental events using: " + completedEvents);

    NVRDataModel.debug("Completed events API:" + completedEvents);
    NVRDataModel.debug("Ongoing events API:+" + ongoingEvents);

    isProcessNewEventsWaiting = true;

    var $httpApi = $http.get(completedEvents);
    var $httpOngoing = $http.get(ongoingEvents);

    $q.all([$httpApi, $httpOngoing])
      .then(function (dataarray) {

          var myevents = dataarray[0].data.events;

          if (dataarray.length > 1) {
            myevents = myevents.concat(dataarray[1].data.events);

          }

          $scope.newEvents = '';
          var localNewEvents = '';
          //console.log ("GOT "+JSON.stringify(data));

          for (var j = 0; j < myevents.length; j++) {

            // these are all in server timezone but no TZ

            myevents[j].Event.StartTime = moment.tz(myevents[j].Event.StartTime, NVRDataModel.getTimeZoneNow()).format('YYYY-MM-DD HH:mm:ss');

            myevents[j].Event.EndTime = moment.tz(myevents[j].Event.EndTime, NVRDataModel.getTimeZoneNow()).format('YYYY-MM-DD HH:mm:ss');

            var itm = graphData.get(myevents[j].Event.Id);
            if (itm) {
              // console.log(myevents[j].Event.Id + " already exists, updating params");

              var content = "<span class='my-vis-font'>" + "(" + myevents[j].Event.Id + ")" + myevents[j].Event.Notes + " " + $translate.instant('kRecordingProgress') + "</span>";

              var style;
              var recordingInProgress = false;

              if (moment(myevents[j].Event.EndTime).isValid()) // recording over
              {
                //console.log ("EVENT "+myevents[j].Event.Id+" emded at "+myevents[j].Event.EndTime);

                content = "<span class='my-vis-font'>" + "( <i class='ion-android-notifications'></i>" + myevents[j].Event.AlarmFrames + ") " + " (" + myevents[j].Event.Id + ") " + myevents[j].Event.Notes + "</span>";

                style = "background-color:" + colors[parseInt(myevents[j].Event.MonitorId) % colors.length] +
                  ";border-color:" + colors[parseInt(myevents[j].Event.MonitorId) % colors.length];
              } else // still recording
              {

                var tze;
                tze = moment().tz(NVRDataModel.getTimeZoneNow());

                myevents[j].Event.EndTime = tze.format('YYYY-MM-DD HH:mm:ss');

                //console.log ("END TIME = "+ myevents[j].Event.EndTime);

                style = "background-color:orange";
                recordingInProgress = true;

              }

              // right at this point we need to decide if we keep or remove this event
              // 

              if (ld.enableAlarmCount && ld.minAlarmCount > myevents[j].Event.AlarmFrames && !recordingInProgress) {
                // remove
                NVRDataModel.debug("Removing Event:" + myevents[j].Event.Id + "as it doesn't have " + myevents[j].Event.AlarmFrames + " alarm frames");
                // var old = timeline.getWindow();
                graphData.remove(myevents[j].Event.Id);
                //   timeline.setWindow (old.start, old.end);
              } else {

                var tzs1, tze1;
                if (NVRDataModel.getLogin().useLocalTimeZone) {
                  tzs1 = moment.tz(myevents[j].Event.StartTime, NVRDataModel.getTimeZoneNow()).tz(NVRDataModel.getLocalTimeZoneNow());
                  tze1 = moment.tz(myevents[j].Event.EndTime, NVRDataModel.getTimeZoneNow()).tz(NVRDataModel.getLocalTimeZoneNow());
                } else {
                  tzs1 = moment.tz(myevents[j].Event.StartTime, NVRDataModel.getTimeZoneNow());
                  tze1 = moment.tz(myevents[j].Event.EndTime, NVRDataModel.getTimeZoneNow());
                }

                //tzs1 = tzs1.format("YYYY-MM-DD HH:mm:ss");
                //tze1 = tze1.format("YYYY-MM-DD HH:mm:ss");

                NVRDataModel.debug("Updating Event:" + myevents[j].Event.Id + "StartTime:" + tzs1.format() + " EndTime:" + tze1.format());
                graphData.update({
                  id: myevents[j].Event.Id,
                  content: content,
                  start: tzs1,
                  // start: myevents[j].Event.StartTime,
                  // end: myevents[j].Event.EndTime,
                  end: tze1,
                  //group: myevents[j].Event.MonitorId,
                  //type: "range",
                  style: style,
                  myframes: myevents[j].Event.Frames,
                  mydur: myevents[j].Event.Length,
                  myeid: myevents[j].Event.Id,
                  myename: myevents[j].Event.Name,
                  myvideo: myevents[j].Event.DefaultVideo,
                  myevent: myevents[j]

                });

                //timeline.focus(myevents[j].Event.Id);
                //
                timeline.moveTo(timeline.getCurrentTime());
                //console.log ("Focus EID="+myevents[j].Event.Id);
                localNewEvents = localNewEvents + NVRDataModel.getMonitorName(myevents[j].Event.MonitorId) + '@' + shortenTime(myevents[j].Event.StartTime) + ' (' + myevents[j].Event.Id + '),';

              }

            } else { // event is new

              var isBeingRecorded = false;
              var idfound = false;
              for (var ii = 0; ii < $scope.monitors.length; ii++) {
                if ($scope.monitors[ii].Monitor.Id == myevents[j].Event.MonitorId && NVRDataModel.isNotHidden(myevents[j].Event.MonitorId)) {
                  idfound = true;
                  break;
                }
              }

              if (idfound) {

                myevents[j].Event.MonitorName = NVRDataModel.getMonitorName(myevents[j].Event.MonitorId);

                myevents[j].Event.streamingURL = NVRDataModel.getStreamingURL(myevents[j].Event.MonitorId);
                myevents[j].Event.recordingURL = NVRDataModel.getRecordingURL(myevents[j].Event.MonitorId);
                myevents[j].Event.imageMode = NVRDataModel.getImageMode(myevents[j].Event.MonitorId);
                if (NVRDataModel.getLogin().url != myevents[j].Event.recordingURL) {

                  myevents[j].Event.recordingURL = NVRDataModel.getLogin().url;
                }

                if (typeof myevents[j].Event.DefaultVideo === 'undefined')
                  // console.log (JSON.stringify(myevents[j]));
                  myevents[j].Event.DefaultVideo = "";

                // now lets make sure we don't infinitely increase

                if (graphIndex >= curCount)
                //if (1)
                {
                  var mv = graphData.min('id');
                  //console.log("MIN="+JSON.stringify(mv));
                  if (mv) {
                    graphData.remove(mv.id);
                    graphIndex--;
                    NVRDataModel.debug("Removed Event " + mv.id + " to make space");
                  }

                }

                // since this is a new add its possible dates are not defined
                if (!moment(myevents[j].Event.StartTime).isValid()) {
                  NVRDataModel.log("Event:" + myevents[j].Event.Id + "-Invalid Start time - this should really not happen ");

                }

                if (!moment(myevents[j].Event.EndTime).isValid()) {
                  var t1 = moment().tz(NVRDataModel.getTimeZoneNow());

                  myevents[j].Event.EndTime = t1.format('YYYY-MM-DD HH:mm:ss');

                  NVRDataModel.debug("Event:" + myevents[j].Event.Id + "-End time is invalid, setting to current time");

                  isBeingRecorded = true;

                }

                // if range doesn't allow for current time, we need to fix that
                /*if (moment(options.max).isBefore(moment())) {
                   // console.log("Adjusting Range to fit in new event");
                    options.max = moment().add('1', 'hours').locale('en').format("YYYY-MM-DD HH:mm:ss");
                    timeline.setOptions(options);
                }*/

                var eventText = "<span class='my-vis-font'>" + "( <i class='ion-android-notifications'></i>" + (myevents[j].Event.AlarmFrames || ' unknown ') + ") " + myevents[j].Event.Notes + "</span>";

                if (isBeingRecorded) {
                  eventText = "<span class='my-vis-font'>" + "(" + myevents[j].Event.Id + ") " + myevents[j].Event.Notes + " " + $translate.instant('kRecordingProgress') + "</span>";
                }

                // since we concated, its possible events may be repeated
                if (!graphData.get(myevents[j].Event.Id)) {

                  localNewEvents = localNewEvents + NVRDataModel.getMonitorName(myevents[j].Event.MonitorId) + '@' + shortenTime(myevents[j].Event.StartTime) + ' (' + myevents[j].Event.Id + '),';

                  var tzs2, tze2;
                  if (NVRDataModel.getLogin().useLocalTimeZone) {
                    tzs2 = moment.tz(myevents[j].Event.StartTime, NVRDataModel.getTimeZoneNow()).tz(NVRDataModel.getTimeZoneNow()).tz(NVRDataModel.getLocalTimeZoneNow());
                    tze2 = moment.tz(myevents[j].Event.EndTime, NVRDataModel.getTimeZoneNow()).tz(NVRDataModel.getLocalTimeZoneNow());
                  } else {
                    tzs2 = moment.tz(myevents[j].Event.StartTime, NVRDataModel.getTimeZoneNow());
                    tze2 = moment.tz(myevents[j].Event.EndTime, NVRDataModel.getTimeZoneNow());
                  }

                  //tzs2 = tzs2.format("YYYY-MM-DD HH:mm:ss");
                  //tze2 = tze2.format("YYYY-MM-DD HH:mm:ss");

                  NVRDataModel.debug(">>> " + myevents[j].Event.Id + " New event updating graph " + " from:" + tzs2.format() + " to:" + tze2.format());

                  graphData.add({

                    id: myevents[j].Event.Id,
                    content: eventText,
                    start: tzs2,
                    //start: myevents[j].Event.StartTime,
                    // end: myevents[j].Event.EndTime,
                    end: tze2,
                    group: myevents[j].Event.MonitorId,
                    style: "background-color:orange",
                    //type: "range",

                    myframes: myevents[j].Event.Frames,
                    mydur: myevents[j].Event.Length,
                    myeid: myevents[j].Event.Id,
                    myename: myevents[j].Event.Name,
                    myvideo: myevents[j].Event.DefaultVideo,
                    myevent: myevents[j]

                  });
                  graphIndex++;
                  //timeline.focus(myevents[j].Event.Id);
                  timeline.moveTo(timeline.getCurrentTime());
                }

                //options.max = moment(fromDate).locale('en').format("YYYY-MM-DD HH:mm:ss");

              } //idfound

            } // new event

          } // for j

          // At this stage, see if we need to display new events
          if (localNewEvents.length > 0) {
            localNewEvents = $translate.instant('kLatestEvents') + ':' + localNewEvents;
            localNewEvents = localNewEvents.slice(0, -1);
            $scope.newEvents = localNewEvents;
          }
          isProcessNewEventsWaiting = false;

        },
        function (err) {
          NVRDataModel.debug("Error getting incremental timeline data");
          isProcessNewEventsWaiting = false;

        });

    // check all events that started 10+10 seconds ago

  }

  //-------------------------------------------------
  // This function draws the graph
  //-------------------------------------------------

  function drawGraph(fromDate, toDate, count) {

    // console.log("INSIDE DRAW");

    $scope.newEvents = "";
    // we only need this for day mode
    $interval.cancel(updateInterval);

    curFromDate = fromDate;
    curToDate = toDate;
    curCount = count;

    var isFirstItem = true;

    var fromDateNoLang = moment(fromDate).locale('en').format("YYYY-MM-DD HH:mm:ss");
    var toDateNoLang = moment(toDate).locale('en').format("YYYY-MM-DD HH:mm:ss");

    //latestDateDrawn =toDateNoLang;

    $ionicLoading.show({
      template: $translate.instant('kLoadingGraph') + "...",
      animation: 'fade-in',
      showBackdrop: false,
      maxWidth: 200,
      showDelay: 0,
      duration: zm.loadingTimeout, //specifically for Android - http seems to get stuck at times
    });

    NVRDataModel.log("TimelineCtrl/drawgraph: from->" + fromDateNoLang + " to->" + toDateNoLang + " count:" + count);
    $scope.graphLoaded = false;
    NVRDataModel.debug("TimelineCtrl/drawgraph: graphLoaded:" + $scope.graphLoaded);

    if (timeline) {
      NVRDataModel.debug("TimelineCtrl/drawgraph: destroying timeline as it exists");
      timeline.destroy();
    }

    groups = new vis.DataSet();
    graphData = new vis.DataSet();
    //console.log ("AFTER VIS");

    var tzs, tze;

    // lets scope the time graph to either local or remote time zone

    if (NVRDataModel.getLogin().useLocalTimeZone) {
      tzs = moment.tz(fromDate, NVRDataModel.getTimeZoneNow()).tz(NVRDataModel.getLocalTimeZoneNow());
      tze = moment.tz(toDate, NVRDataModel.getTimeZoneNow()).tz(NVRDataModel.getLocalTimeZoneNow());
    } else {
      tzs = moment.tz(fromDate, NVRDataModel.getTimeZoneNow());
      tze = moment.tz(toDate, NVRDataModel.getTimeZoneNow());
    }

    //tzs = tzs.format("YYYY-MM-DD HH:mm:ss");
    //tze = tze.format("YYYY-MM-DD HH:mm:ss");

    options = {

      showCurrentTime: true,
      editable: false,
      moment: function (date) {

        //var t;
        if (NVRDataModel.getLogin().useLocalTimeZone)
          //if (0)
          return moment.tz(date, NVRDataModel.getTimeZoneNow()).tz(NVRDataModel.getLocalTimeZoneNow());
        else
          // typecast to server time zone - its in server time anyway
          return moment.tz(date, NVRDataModel.getTimeZoneNow());
      },
      //throttleRedraw: 100,
      moveable: true,
      zoomable: true,
      selectable: true,
      start: tzs,
      end: tze,
      orientation: 'top',
      min: tzs,
      //max: tze,
      zoomMin: 5 * 60 * 1000, // 1 min
      stack: false,
      format: {
        minorLabels: {
          minute: NVRDataModel.getTimeFormat(),
          hour: NVRDataModel.getTimeFormat(),
          second: 's',
        },
        majorLabels: {
          second: "D MMM " + NVRDataModel.getTimeFormat(),
        }
      },

    };

    graphIndex = 1; // will be used for graph ID

    //console.log ("**NOLANG" + fromDateNoLang  + " " + toDateNoLang);

    NVRDataModel.getEventsPages(0, fromDateNoLang, toDateNoLang)
      .then(function (epData) {
        var pages = 1;
        var itemsPerPage = parseInt(epData.limit);
        var iterCount;

        // So iterCount is the # of HTTP calls I need to make
        iterCount = Math.max(Math.round(count / itemsPerPage), 1);
        NVRDataModel.debug("TimelineCtrl/drawGraph: pages of data: " + pages + " items per page: " + itemsPerPage);
        NVRDataModel.debug("TimelineCtrl/drawGraph: I will make " + iterCount + " HTTP Requests to get all graph data");

        // I've restructured this part. I was initially using vis DataSets
        // for dynamic binding which was easier, but due to performance reasons
        // I am waiting for the full data to load before I draw
        var promises = [];
        while ((pages <= epData.pageCount) && (iterCount > 0)) {
          var promise = NVRDataModel.getEvents(0, pages, "none", fromDateNoLang, toDateNoLang);
          promises.push(promise);

          pages++;
          iterCount--;

        }

        $q.all(promises)
          .then(function (data) {
              NVRDataModel.debug("TimelineCtrl/drawgraph: all pages of graph data received ");
              graphIndex = 0;
              NVRDataModel.log("Creating " + $scope.monitors.length + " groups for the graph");
              // create groups
              for (var g = 0; g < $scope.monitors.length; g++) {
                groups.add({
                  id: $scope.monitors[g].Monitor.Id,
                  //mid: $scope.monitors[g].Monitor.Id,
                  content: NVRDataModel.getMonitorName($scope.monitors[g].Monitor.Id),
                  order: $scope.monitors[g].Monitor.Sequence
                });
                NVRDataModel.debug("TimelineCtrl/drawgraph:Adding group " +
                  NVRDataModel.getMonitorName($scope.monitors[g].Monitor.Id));
              }

              for (var j = 0; j < data.length; j++) {
                var myevents = data[j].events;

                //   console.log ("****************DATA ="+JSON.stringify(data[j]));
                // console.log ("**********************************");
                if (graphIndex > count) {
                  NVRDataModel.log("Exiting page count graph - reached limit of " + count);
                  break;

                }

                for (var i = 0; i < myevents.length; i++) {

                  // make sure group id exists before adding
                  var idfound = true;
                  var ld = NVRDataModel.getLogin();

                  if (ld.persistMontageOrder) {

                    idfound = false;
                    for (var ii = 0; ii < $scope.monitors.length; ii++) {
                      if ($scope.monitors[ii].Monitor.Id == myevents[i].Event.MonitorId && NVRDataModel.isNotHidden(myevents[i].Event.MonitorId)) {
                        idfound = true;
                        //console.log ("****************** ID MATCH " + graphIndex);

                        break;
                      }
                    }
                  }

                  myevents[i].Event.MonitorName = NVRDataModel.getMonitorName(myevents[i].Event.MonitorId);
                  // now construct base path

                  myevents[i].Event.streamingURL = NVRDataModel.getStreamingURL(myevents[i].Event.MonitorId);
                  myevents[i].Event.recordingURL = NVRDataModel.getRecordingURL(myevents[i].Event.MonitorId);
                  myevents[i].Event.imageMode = NVRDataModel.getImageMode(myevents[i].Event.MonitorId);
                  if (NVRDataModel.getLogin().url != myevents[i].Event.recordingURL) {
                    //NVRDataModel.debug ("Multi server, changing base");
                    myevents[i].Event.recordingURL = NVRDataModel.getLogin().url;

                  }
               

                  if (idfound) {

                    if (typeof myevents[i].Event.DefaultVideo === 'undefined')
                      // console.log (JSON.stringify(myevents[i]));
                      myevents[i].Event.DefaultVideo = "";

                    //console.log ("ADDING "+myevents[i].Event.StartTime+"->"+myevents[i].Event.EndTime);

                    var tzs, tze;
                    if (NVRDataModel.getLogin().useLocalTimeZone) {
                      tzs = moment.tz(myevents[i].Event.StartTime, NVRDataModel.getTimeZoneNow()).tz(NVRDataModel.getLocalTimeZoneNow());
                      tze = moment.tz(myevents[i].Event.EndTime, NVRDataModel.getTimeZoneNow()).tz(NVRDataModel.getLocalTimeZoneNow());
                    } else {
                      tzs = moment.tz(myevents[i].Event.StartTime, NVRDataModel.getTimeZoneNow());
                      tze = moment.tz(myevents[i].Event.EndTime, NVRDataModel.getTimeZoneNow());
                    }

                    //console.log ("ADDED "+tzs+" " +tze);

                    if (!graphData.get(myevents[i].Event.Id)) {
                      graphData.add({
                        //id: graphIndex,
                        id: myevents[i].Event.Id,
                        content: "<span class='my-vis-font'>" + "( <i class='ion-android-notifications'></i>" + myevents[i].Event.AlarmFrames + ") " + "(" + myevents[i].Event.Id + ") " + myevents[i].Event.Notes + "</span>",

                        start: tzs,
                        //start: myevents[i].Event.StartTime,
                        //end: myevents[i].Event.EndTime,
                        end: tze,
                        group: myevents[i].Event.MonitorId,
                        //type: "range",
                        style: "background-color:" + colors[parseInt(myevents[i].Event.MonitorId) % colors.length] +
                          ";border-color:" + colors[parseInt(myevents[i].Event.MonitorId) % colors.length],
                        myframes: myevents[i].Event.Frames,
                        mydur: myevents[i].Event.Length,
                        myeid: myevents[i].Event.Id,
                        myename: myevents[i].Event.Name,
                        myvideo: myevents[i].Event.DefaultVideo,
                        myevent: myevents[i]

                      });
                      //console.log ("IED="+myevents[i].Event.Id);
                      graphIndex++;
                    }
                  } else {
                    //console.log ("SKIPPED GRAPH ID " + graphIndex);
                  }

                  if (graphIndex > count) {
                    NVRDataModel.log("Exiting event graph - reached limit of " + count);
                    break;

                  }

                }
              }

              //  console.log(">>>>> CREATING NEW TIMELINE with " + JSON.stringify(options));
              timeline = new vis.Timeline(container[0], null, options);
              // console.log ("GRAPH DATA");
              timeline.setItems(graphData);
              //   console.log ("GROUPS");
              timeline.setGroups(groups);

              if (NVRDataModel.getLogin().timelineScale == -1)

              {
                // console.log ("SCALE NOT FOUND");

                timeline.fit();
              } else {
                timeline.fit();

                /*var d = NVRDataModel.getLogin().timelineScale;
                console.log ("SCALE FOUND "+d+" SECONDS");
                var w = timeline.getWindow();
                console.log ("Original s="+w.start+" e="+w.end);


                var s = moment.tz(w.end, NVRDataModel.getTimeZoneNow()).subtract(d,'seconds').tz(moment.tz.guess());

                //var s = moment(w.start).format("YYYY-MM-DD HH:mm:ss");
                //
                //var e = moment(w.start).add(d,'seconds').format("YYYY-MM-DD HH:mm:ss");

                var e = moment.tz(w.end, NVRDataModel.getTimeZoneNow()).tz(moment.tz.guess());

                console.log ("Start="+s+" End="+e);
                $timeout (function() {timeline.setWindow(s,e);},1000);*/

              }

              lastTimeForEvent = moment().tz(NVRDataModel.getLogin().useLocalTimeZone ? NVRDataModel.getLocalTimeZoneNow() : NVRDataModel.getTimeZoneNow());
              updateInterval = $interval(function () {
                processNewEvents();
              }.bind(this), 10 * 1000);

              $ionicLoading.hide();
              $scope.graphLoaded = true;
              NVRDataModel.debug("graph loaded: " + $scope.graphLoaded);
              $scope.navControls = false;
              dblclick = false;

              // we don't really need this anymore - as we have an interval timer 
              // ticking away

              // this is called for each tick the bar moves
              // speed moves depending on zoom factor
              // 
              /* timeline.on('currentTimeTick', function() {

                   if ($scope.follow.time) {
                    
                   }


               });*/

              timeline.on('rangechanged', function (s) {
                ///console.log ("Range Changed:"+JSON.stringify(s));
                if (s.byUser) {

                  var w = timeline.getWindow();
                  //console.log ("start:"+w.start+" end:"+w.end);
                  var a = moment(w.start);
                  var b = moment(w.end);
                  var d = b.diff(a, 'seconds');
                  var ld = NVRDataModel.getLogin();
                  ld.timelineScale = d;
                  NVRDataModel.setLogin(ld);
                  //console.log ("Stored user scale of "+d+" seconds");
                }

              });

              timeline.on('click', function (prop) {
                //console.log ("CLICK");
                if ($scope.onTap == $translate.instant('kTimelineGraph'))
                  timelineAnalyzeFrames(prop);
                else
                  timelineShowEvent(prop);


              });

              timeline.on('doubleClick', function (prop) {
                if ($scope.onDTap == $translate.instant('kTimelineGraph'))
                  timelineAnalyzeFrames(prop);
                else
                  timelineShowEvent(prop);

              });
            },
            function (error) {
              NVRDataModel.displayBanner('error', 'Timeline error', 'Please try again');

            }

          ); // get Events
      });
  }

  function timelineShowEvent(prop) {
    $timeout(function () {
      if (dblclick) {
        //console.log ("IGNORING CLICK AS DBL CLICK");
        $timeout(function () {
          dblclick = false;
        }, 400);
        return;
      }
      //console.log ("CLICK");
      //console.log ("I GOT " + JSON.stringify(prop));
      // console.log ("EVENT IS " + JSON.stringify(properties.event));
      //var properties =  timeline.getEventProperties(prop);
      // console.log ( "I GOT " + properties);
      var itm = prop.item;
      //console.log ("ITEM CLICKED " + itm);
      if (itm && !isNaN(itm)) {
        NVRDataModel.debug("TimelineCtrl/drawGraph:You clicked on item " + itm);
        var item = graphData.get(itm);
        NVRDataModel.debug("TimelineCtrl/drawGraph: clicked item details:" + JSON.stringify(item));
        showEvent(item.myevent);

      } else {
        NVRDataModel.debug("exact match not found, guessing item with co-ordinates X=" + prop.x + " group=" + prop.group);
        if (prop.group) {
          var visible = timeline.getVisibleItems();
          NVRDataModel.debug("Visible items=" + JSON.stringify(visible));
          var closestItem = null;
          var minDist = 99999;
          var _item;
          for (var x = 0; x < visible.length; x++) {
            _item = timeline.itemSet.items[x];
            if (_item && _item.data && _item.data.group == prop.group) {
              if (Math.abs(_item.left - prop.x) < minDist) {
                closestItem = _item;
                minDist = Math.abs(_item.left - prop.x);
                NVRDataModel.debug("Temporary closest " + _item.left);
                //console.log (_item);
              }
            }

          }

          if (closestItem != null) {
            NVRDataModel.log("Closest item " + closestItem.left + " group: " + closestItem.data.group);
            showEvent(closestItem.data.myevent);
          } else {
            NVRDataModel.log("Did not find a visible item match");
          }
        } else // no group row tapped, do nothing
        {

          /*$ionicLoading.show({
              template: "",
              animation: 'fade-in',
              showBackdrop: false,
              maxWidth: 200,
              showDelay: 0,
              duration: 1500,
          });*/
        }
        // console.log("Zoomed out too far to playback events");
      }
    }, 400);
  }

  function timelineAnalyzeFrames(prop) {
    // console.log ("DOUBLE");
    dblclick = true;
    var itm = prop.item;
    //console.log ("ITEM CLICKED " + itm);
    if (itm && !isNaN(itm)) {
      NVRDataModel.debug("TimelineCtrl/drawGraph:You clicked on item " + itm);
      var item = graphData.get(itm);
      NVRDataModel.debug("TimelineCtrl/drawGraph: clicked item details:" + JSON.stringify(item));
      eventDetails(item.myevent);

    } else {

      NVRDataModel.debug("exact match not found, guessing item with co-ordinates X=" + prop.x + " group=" + prop.group);
      if (prop.group) {
        var visible = timeline.getVisibleItems();
        NVRDataModel.debug("Visible items=" + JSON.stringify(visible));
        var closestItem = null;
        var minDist = 99999;
        var _item;
        for (var x = 0; x < visible.length; x++) {
          _item = timeline.itemSet.items[x];
          if (_item.data.group == prop.group) {
            if (Math.abs(_item.left - prop.x) < minDist) {
              closestItem = _item;
              minDist = Math.abs(_item.left - prop.x);
              NVRDataModel.debug("Temporary closest " + _item.left);
              //console.log (_item);
            }
          }

        }
        NVRDataModel.log("Closest item " + closestItem.left + " group: " + closestItem.data.group);
        if (closestItem != null) {
          NVRDataModel.log("Closest item " + closestItem.left + " group: " + closestItem.data.group);
          showEvent(closestItem.data.myevent);
        } else {
          NVRDataModel.log("Did not find a visible item match");
        }
      }

      // console.log("Zoomed out too far to playback events");
    }
  }

  $scope.radialMenuOptions = {
    content: '',
    //size: 'small',

    background: '#982112',
    isOpen: true,
    toggleOnClick: false,
    button: {
      cssClass: 'fa  fa-compress fa-2x',
      size: 'small',
      onclick: function () {
        //console.log("fitting");
        timeline.fit();
      }
    },
    items: [{
        content: '',
        cssClass: 'fa fa-minus-circle',
        empty: false,
        onclick: function () {
          //zoom(0.2);
          timeline.zoomOut(0.2);
        }
      },

      {
        content: '',
        cssClass: 'fa fa-chevron-circle-up',
        empty: true,
        onclick: function () {

        }
      },

      {
        content: '',
        cssClass: 'fa fa-chevron-circle-up',
        empty: false,

        onclick: function () {

          move(0.2);
        }
      },
      {
        content: 'D',
        empty: true,

        onclick: function () {
          // console.log('About');
        }
      },

      {
        content: '',
        cssClass: 'fa fa-chevron-circle-up',
        empty: true,
        onclick: function () {

        }
      },

      {
        content: '',
        cssClass: 'fa fa-plus-circle',
        empty: false,
        onclick: function () {

          //zoom(-0.2);
          timeline.zoomIn(0.2);
        }
      },

      {
        content: '',
        cssClass: 'fa fa-chevron-circle-up',
        empty: true,
        onclick: function () {

        }
      },

      {
        content: 'H',
        empty: true,
        onclick: function () {
          // console.log('About');
        }
      },

      {
        content: '',
        cssClass: 'fa fa-chevron-circle-up',
        empty: false,
        onclick: function () {
          move(-0.2);
        }
      },

      {
        content: '',
        cssClass: 'fa fa-chevron-circle-up',
        empty: true,
        onclick: function () {

        }
      },

      {
        content: 'K',
        empty: true,
        onclick: function () {
          //console.log('About');
        }
      },
    ]
  };

}]);
