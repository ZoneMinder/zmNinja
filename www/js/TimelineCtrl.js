/* jshint -W041 */
/* jshint -W083 */
/*This is for the loop closure I am using in line 143 */
/* jslint browser: true*/
/* global vis,timeline,cordova,StatusBar,angular,console,moment */

// This controller creates a timeline
// It uses the visjs library, but due to performance reasons
// I've disabled pan and zoom and used buttons instead
// also limits # of items to maxItems 

// FIXME: too much redundant code between EventCtrl and Timeline 
// Move to ModalCtrl and see if it works

angular.module('zmApp.controllers').controller('zmApp.TimelineCtrl', ['$ionicPlatform', '$scope', 'zm', 'NVR', '$ionicSideMenuDelegate', '$rootScope', '$http', '$q', 'message', '$state', '$ionicLoading', '$ionicPopover', '$ionicScrollDelegate', '$ionicModal', '$timeout', '$ionicContentBanner', '$ionicHistory', '$sce', '$stateParams', '$translate', '$ionicPopup', '$interval', function ($ionicPlatform, $scope, zm, NVR, $ionicSideMenuDelegate, $rootScope, $http, $q, message, $state, $ionicLoading, $ionicPopover, $ionicScrollDelegate, $ionicModal, $timeout, $ionicContentBanner, $ionicHistory, $sce, $stateParams, $translate, $ionicPopup, $interval) {
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


    function prettifyTimeSec(str) {
    if (NVR.getLogin().useLocalTimeZone)
      return moment.tz(str, NVR.getTimeZoneNow()).tz(moment.tz.guess()).format(NVR.getTimeFormatSec());
    else
      return moment(str).format(NVR.getTimeFormatSec());
  }

  //-----------------------------------------------------------
  // Used to display date range for timeline_instance
  //-----------------------------------------------------------
  $scope.prettify = function (str) {
    if (NVR.getLogin().useLocalTimeZone)
      return moment.tz(str, NVR.getTimeZoneNow()).tz(moment.tz.guess()).format('MMMM Do YYYY, ' + NVR.getTimeFormat());
    else
      return moment(str).format('MMMM Do YYYY, ' + NVR.getTimeFormat());
  };

  //-----------------------------------------------------------
  // used for playback when you tap on a timeline_instance event
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

    var ld = NVR.getLogin();
    ld.enableAlarmCount = !ld.enableAlarmCount;

    NVR.setLogin(ld);
    $scope.loginData = ld;

    drawGraph(curFromDate, curToDate, curCount);

  };

  //-----------------------------------------------------------
  // Move/Zoom are used to move the timeline_instance around
  //-----------------------------------------------------------
  function move(percentage) {
    var range = timeline_instance.getWindow();
    var interval = range.end - range.start;

    timeline_instance.setWindow({
      start: range.start.valueOf() - interval * percentage,
      end: range.end.valueOf() - interval * percentage
    });
  }

  // helps to navigate to current time quickly
  // after a night of heavy navigation
  $scope.gotoNow = function () {
    timeline_instance.moveTo(timeline_instance.getCurrentTime());
  };

  $scope.move = function (percentage) {
    move(percentage);

  };

 
  //-----------------------------------------
  // Move by X days 
  //-----------------------------------------
  $scope.moveDays = function (d) {
    var range = timeline_instance.getWindow();
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
    NVR.log("moving by " + d + " day to " + fromDate + " upto " + toDate);
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
  // To show a modal dialog with the event tapped on in timeline_instance
  // FIXME : code repeat from Events
  //--------------------------------------------------------
  function openModal(event) {

    //console.log (JSON.stringify(event));

    if ($scope.modalFromTimelineIsOpen == true) {
      // don't know why but some conflict from angular to timeline_instance lib
      // results in double modals at times
      NVR.log(">>-- duplicate modal detected, preventing");
    }

    $scope.modalFromTimelineIsOpen = true;
    NVR.setAwake(NVR.getKeepAwake());

    // pass this event to ModalCtrl
    $scope.currentEvent = event;

    $scope.event = event;
    // in Timeline view, make sure events stick to same monitor
    $scope.followSameMonitor = "1";

    //prepareModalEvent(event.Event.Id);

    var ld = NVR.getLogin();
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
        showLive: sl,
        disableDrag: true
      })
      .then(function (modal) {
        $scope.modal = modal;

        $ionicLoading.show({
          template: $translate.instant('kPleaseWait') + "...",
          noBackdrop: true,
          duration: 10000,

        });

        $scope.modal.show();

        var ld = NVR.getLogin();

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
    NVR.debug("TimelineCtrl:Close & Destroy Modal");
    NVR.stopNetwork("TimelineCtrl: closeModal");
    NVR.setAwake(false);
  
    if ($scope.modal !== undefined) {
      $scope.modal.remove();
    }

    if ($scope.modalData && $scope.modalData.doRefresh) {

      $timeout(function () {
        drawGraph($scope.fromDate, $scope.toDate, maxItems);
        
      }, 500);

    }

  };

  /*   $scope.toggleGapless = function()
        {
            console.log ("GAPLESS TOGGLE");
            $scope.loginData.gapless = !$scope.loginData.gapless;
            NVR.setLogin($scope.loginData);
            
        };*/

  //-------------------------------------------------------------------------
  // called when user switches to background
  //-------------------------------------------------------------------------
  function onPause() {
    NVR.debug("TimelineCtrl:onpause called");
    $interval.cancel(updateInterval);
    // console.log("*** Moving to Background ***"); // Handle the pause event

    if ($scope.popover) $scope.popover.remove();

  }

  $scope.doRefresh = function(){
    // nothing, needs to be here
    // as events modal close calls it
    NVR.debug ("dummy doRefresh()");
};


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
    $scope.tzAbbr = NVR.getTimeZoneNow();
    NVR.debug("Timezone API updated timezone to " + NVR.getTimeZoneNow());
  });
  broadcastHandles.push(tzu);

  //-------------------------------------------------
  // Make sure we delete the timeline_instance
  // This may be redundant as the root view gets
  // destroyed but no harm
  //-------------------------------------------------
  $scope.$on('$ionicView.leave', function () {

    if ($rootScope.platformOS == 'desktop') {
      NVR.debug("Removing keyboard handler");
      window.removeEventListener('keydown', keyboardHandler, true);

    }

    //NVR.debug("Timeline: Deregistering broadcast handles");
    for (var i = 0; i < broadcastHandles.length; i++) {
      broadcastHandles[i]();
    }
    broadcastHandles = [];

    if (timeline_instance) {
      $interval.cancel(updateInterval);
      timeline_instance.destroy();
      //console.log("**Destroying Timeline");

    }
  });

  /*$scope.$on('$ionicView.enter', function() {



    
  });*/


  $scope.$on('sizechanged', function() {
   
    $timeout (function () {
      if (timeline_instance) {
        options.maxHeight = $rootScope.devHeight-100;
        timeline_instance.setOptions(options);
        timeline_instance.redraw();
       // console.log ('******* TIMELINE REDRAW');
      }
    },10);

  });
 
   


  $scope.$on('$ionicView.beforeLeave', function () {
   // window.removeEventListener("resize", redrawTimeline, false);

  });

  $scope.$on('$ionicView.beforeEnter', function () {
    $ionicSideMenuDelegate.canDragContent(false);
    $scope.$on ( "process-push", function () {
      NVR.debug (">> TimelineCtrl: push handler");
      var s = NVR.evaluateTappedNotification();
      NVR.debug("tapped Notification evaluation:"+ JSON.stringify(s));
      $ionicHistory.nextViewOptions({
        disableAnimate:true,
        disableBack: true
      });
      $state.go(s[0],s[1],s[2]);
    });
    
    //$ionicHistory.clearCache();
    //$ionicHistory.clearHistory();
    timeline_instance = '';
    $scope.currentThumbEvent = '';
    $scope.thumbData = {
        url: '',
        eid: $translate.instant('kMonNone'),
        time: $translate.instant('kMonNone'),
        monName: $translate.instant('kMonNone'),
        notes: ''
    };

    $scope.lastVideoStateTime = {
      'time':''
    };
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

      //console.log(keyCode + " PRESSED");

      if (keyCode == keyCodes.UP) {

        timeline_instance.zoomIn(0.2);

      } else if (keyCode == keyCodes.DOWN) {

        timeline_instance.zoomIn(0.2);

      } else if (keyCode == keyCodes.LEFT) {

        move(-0.2);
      } else if (keyCode == keyCodes.RIGHT) {
        move(0.2);
      } else if (keyCode == keyCodes.ESC) {
        timeline_instance.fit();
      } else if (keyCode == keyCodes.PREVDAY_A) {
        $scope.moveDays(-1);
      } else if (keyCode == keyCodes.NEXTDAY_D) {
        $scope.moveDays(1);
      }


      handled = true;
      return handled;

    });
  }

  

  //-------------------------------------------------
  // FIXME: shitty hackery -- Im using a rootScope
  // to know if you just went to custom range
  // and back. Fix this, really.
  // So anyway, if you did select a custom range
  // then we "go back" to timeline_instance, which is when
  // we come here - so make sure we update the
  // graph range
  //-------------------------------------------------


  $scope.$on('$ionicView.afterEnter', function () {

    $scope.monitors = message;

    $scope.onTap = $translate.instant('kTimelineEvent');
    $scope.onDTap = $translate.instant('kTimelineGraph');

    $scope.timelineControls =  ($rootScope.platformOS == 'desktop')? $translate.instant('kTimelineControlsD'):$translate.instant('kTimelineControlsM');

   
    $scope.follow = {
      'time': NVR.getLogin().followTimeLine
    };

    $interval.cancel(updateInterval);

    // Make sure sliding for menu is disabled so it
    // does not interfere with graph panning
   
    var ld = NVR.getLogin();
    maxItemsConf = ($rootScope.platformOS == 'desktop') ? zm.graphDesktopItemMax : zm.graphItemMax;
    maxItems = ld.graphSize || maxItemsConf;
    NVR.log("Graph items to draw is " + maxItems);
    $scope.maxItems = maxItems;
    $scope.translationData = {
      maxItemsVal: maxItems
    };

    $scope.graphLoaded = false;
    NVR.debug("TimelineCtrl/drawGraph: graphLoaded is " + $scope.graphLoaded);

    //latestDateDrawn = moment().locale('en').format("YYYY-MM-DD HH:mm:ss");
    $scope.modalFromTimelineIsOpen = false;
    //var tempMon = message;

    // lets timeline_instance.onget the abbreviated version of TZ to display
    if (NVR.getLogin().useLocalTimeZone) {
      $scope.tzAbbr = moment().tz(moment.tz.guess()).zoneAbbr();
    } else {
      $scope.tzAbbr = moment().tz(NVR.getTimeZoneNow()).zoneAbbr();
    }

    //console.log ("TIMELINE MONITORS: " + JSON.stringify(message));
    //var ld = NVR.getLogin();
    $scope.loginData = NVR.getLogin();

    /* if (ld.persistMontageOrder) {
         var iMon = NVR.applyMontageMonitorPrefs(tempMon, 2);
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

        if (NVR.getLogin().useLocalTimeZone) {
          fromDate = moment().startOf('day').format("YYYY-MM-DD HH:mm:ss");
          toDate = moment().endOf('day').format("YYYY-MM-DD HH:mm:ss");
        } else {
          fromDate = moment().tz(NVR.getTimeZoneNow()).startOf('day').format("YYYY-MM-DD HH:mm:ss");
          toDate = moment().tz(NVR.getTimeZoneNow()).endOf('day').format("YYYY-MM-DD HH:mm:ss");
        }

        drawGraph(fromDate, toDate, maxItems);
      }
    } else {
      $scope.currentMode = 'day';

      if (NVR.getLogin().useLocalTimeZone) {
        fromDate = moment().startOf('day').format("YYYY-MM-DD HH:mm:ss");
        toDate = moment().endOf('day').format("YYYY-MM-DD HH:mm:ss");
      } else {
        fromDate = moment().tz(NVR.getTimeZoneNow()).startOf('day').format("YYYY-MM-DD HH:mm:ss");
        toDate = moment().tz(NVR.getTimeZoneNow()).endOf('day').format("YYYY-MM-DD HH:mm:ss");
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
        NVR.debug("Modal is open, closing it");
        NVR.setAwake(false);
        $scope.modal.remove();
      } else {
        NVR.debug("Modal is closed, so toggling or exiting");
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
  var lastClicked = moment();

  $scope.mycarousel = {
    index: 0
  };
  $scope.ionRange = {
    index: 1
  };

  var curFromDate, curToDate, curCount;

  document.addEventListener("pause", onPause, false);

  // FIXME: Timeline awake to avoid graph redrawing
  NVR.setAwake(NVR.getKeepAwake());

  // fromDate and toDate will be used to plot the range for the graph
  // We start in day mode
  // 
  var fromDate, toDate;

  fromDate = moment().tz(NVR.getLogin().useLocalTimeZone ? NVR.getLocalTimeZoneNow() : NVR.getTimeZoneNow()).startOf('day').format("YYYY-MM-DD HH:mm:ss");
  toDate = moment().tz(NVR.getLogin().useLocalTimeZone ? NVR.getLocalTimeZoneNow() : NVR.getTimeZoneNow()).endOf('day').format("YYYY-MM-DD HH:mm:ss");

  $scope.fromDate = fromDate;
  $scope.toDate = toDate;

  // maxItems will be ignored during timeline_instance draw if its desktop
  var maxItemsConf;

  var ld = NVR.getLogin();
  var maxItems;

  //flat colors for graph - https://flatuicolors.com http://www.flatuicolorpicker.com
  var colors = ['#3498db', '#E57373', '#EB974E', '#95A5A6', '#e74c3c', '#03C9A9', ];

  var container;
  container = angular.element(document.getElementById('visualization'));
  var timeline_instance;

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
    timeline_instance.fit();
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
    if (NVR.getLogin().useLocalTimeZone)
      return moment.tz(str, NVR.getTimeZoneNow()).tz(moment.tz.guess()).format(NVR.getTimeFormat());
    else
      return moment(str).format(NVR.getTimeFormat());
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
    var loginData = NVR.getLogin();
    loginData.followTimeLine = $scope.follow.time;
    NVR.setLogin(loginData);
  };

  $scope.toggleObjectDetectionFilter = function () {
      
    var ld = NVR.getLogin();
    ld.objectDetectionFilter = !ld.objectDetectionFilter;
    NVR.setLogin(ld);
    NVR.debug ("object detection filter: "+ld.objectDetectionFilter);
    $scope.loginData = NVR.getLogin();
    drawGraph(fromDate, toDate, maxItems);

  };
  

  //-------------------------------------------------
  // Called with day/week/month
  // so we can redraw the graph
  //-------------------------------------------------

  $scope.buttonClicked = function (index) {
    //console.log (index);
    if (index == 0) //month
    {
      $scope.follow.time = NVR.getLogin().followTimeLine;
      $scope.currentMode = "month";
      NVR.log("Month view");
      $rootScope.customTimelineRange = false;

      toDate = moment().format("YYYY-MM-DD HH:mm:ss");
      fromDate = moment().subtract(1, 'month').startOf('day').format("YYYY-MM-DD HH:mm:ss");
      $scope.fromDate = fromDate;
      $scope.toDate = toDate;
      drawGraph(fromDate, toDate, maxItems);
    } else if (index == 1) //week
    {
      $scope.follow.time = NVR.getLogin().followTimeLine;
      $scope.currentMode = "week";
      $rootScope.customTimelineRange = false;
      NVR.log("Week  view");
      toDate = moment().tz(NVR.getLogin().useLocalTimeZone ? NVR.getLocalTimeZoneNow() : NVR.getTimeZoneNow()).format("YYYY-MM-DD HH:mm:ss");
      fromDate = moment().tz(NVR.getLogin().useLocalTimeZone ? NVR.getLocalTimeZoneNow() : NVR.getTimeZoneNow()).subtract(1, 'week').startOf('day').format("YYYY-MM-DD HH:mm:ss");
      $scope.fromDate = fromDate;
      $scope.toDate = toDate;
      drawGraph(fromDate, toDate, maxItems);
    } else if (index == 2) //day
    {

      $scope.currentMode = "day";
      $rootScope.customTimelineRange = false;
      NVR.log("Day view");
      //toDate = moment().format("YYYY-MM-DD HH:mm:ss");
      fromDate = moment().tz(NVR.getLogin().useLocalTimeZone ? NVR.getLocalTimeZoneNow() : NVR.getTimeZoneNow()).startOf('day').format("YYYY-MM-DD HH:mm:ss");
      toDate = moment().tz(NVR.getLogin().useLocalTimeZone ? NVR.getLocalTimeZoneNow() : NVR.getTimeZoneNow()).endOf('day').format("YYYY-MM-DD HH:mm:ss");
      $scope.fromDate = fromDate;
      $scope.toDate = toDate;
      drawGraph(fromDate, toDate, maxItems);
    } else // custom
    {
      $scope.follow.time = NVR.getLogin().followTimeLine;
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

    var ld = NVR.getLogin();

    // check for last 2 minutes to account for late DB updates and what not. 5 mins was likely enough
    // 

    // make sure these are server time
    var from = moment(lastTimeForEvent).tz(NVR.getTimeZoneNow());
    from = from.subtract(2, 'minutes').locale('en').format("YYYY-MM-DD HH:mm:ss");

    var to = moment(lastTimeForEvent).tz(NVR.getTimeZoneNow());
    to = to.locale('en').format("YYYY-MM-DD HH:mm:ss");

    lastTimeForEvent = moment().tz(NVR.getLogin().useLocalTimeZone ? NVR.getLocalTimeZoneNow() : NVR.getTimeZoneNow());

    // FIXME: totally ignoring event pages - hoping it wont be more than 100 or 150 whatever
    // the events per page limit is. Why? laziness.
    // 
    var completedEvents = ld.apiurl + '/events/index/EndTime >=:' + from;
    // we can add alarmCount as this is really for completed events
    completedEvents = completedEvents + "/AlarmFrames >=:" + (ld.enableAlarmCount ? ld.minAlarmCount : 0);

    if (ld.objectDetectionFilter) {
      completedEvents = completedEvents + '/Notes REGEXP:"detected:"';
    }

    completedEvents = completedEvents + ".json?"+$rootScope.authSession;

    // now get currently ongoing events
    // as it turns out various events get stored withn null and never recover
    // so, lets limiy to 15 m
    // 

    var st = moment(lastTimeForEvent).tz(NVR.getTimeZoneNow());
    st = st.subtract(10, 'minutes').locale('en').format("YYYY-MM-DD HH:mm:ss");
    var ongoingEvents = ld.apiurl + '/events/index/StartTime >=:' + st + '/EndTime =:.json?'+$rootScope.authSession;
    //NVR.debug("Getting incremental events using: " + completedEvents);

    NVR.debug("Completed events API:" + completedEvents);
    NVR.debug("Ongoing events API:+" + ongoingEvents);

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

            myevents[j].Event.StartTime = moment.tz(myevents[j].Event.StartTime, NVR.getTimeZoneNow()).format('YYYY-MM-DD HH:mm:ss');

            myevents[j].Event.EndTime = moment.tz(myevents[j].Event.EndTime, NVR.getTimeZoneNow()).format('YYYY-MM-DD HH:mm:ss');

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
                tze = moment().tz(NVR.getTimeZoneNow());

                myevents[j].Event.EndTime = tze.format('YYYY-MM-DD HH:mm:ss');

                //console.log ("END TIME = "+ myevents[j].Event.EndTime);

                style = "background-color:orange";
                recordingInProgress = true;

              }

              // right at this point we need to decide if we keep or remove this event
              // 

              if (ld.enableAlarmCount && ld.minAlarmCount > myevents[j].Event.AlarmFrames && !recordingInProgress) {
                // remove
                NVR.debug("Removing Event:" + myevents[j].Event.Id + "as it doesn't have " + myevents[j].Event.AlarmFrames + " alarm frames");
                // var old = timeline_instance.getWindow();
                graphData.remove(myevents[j].Event.Id);
                //   timeline_instance.setWindow (old.start, old.end);
              } else {

                var tzs1, tze1;
                if (NVR.getLogin().useLocalTimeZone) {
                  tzs1 = moment.tz(myevents[j].Event.StartTime, NVR.getTimeZoneNow()).tz(NVR.getLocalTimeZoneNow());
                  tze1 = moment.tz(myevents[j].Event.EndTime, NVR.getTimeZoneNow()).tz(NVR.getLocalTimeZoneNow());
                } else {
                  tzs1 = moment.tz(myevents[j].Event.StartTime, NVR.getTimeZoneNow());
                  tze1 = moment.tz(myevents[j].Event.EndTime, NVR.getTimeZoneNow());
                }

                //tzs1 = tzs1.format("YYYY-MM-DD HH:mm:ss");
                //tze1 = tze1.format("YYYY-MM-DD HH:mm:ss");

                NVR.debug("Updating Event:" + myevents[j].Event.Id + "StartTime:" + tzs1.format() + " EndTime:" + tze1.format());
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

                //timeline_instance.focus(myevents[j].Event.Id);
                //
                timeline_instance.moveTo(timeline_instance.getCurrentTime());
                //console.log ("Focus EID="+myevents[j].Event.Id);
                localNewEvents = localNewEvents + NVR.getMonitorName(myevents[j].Event.MonitorId) + '@' + shortenTime(myevents[j].Event.StartTime) + ' (' + myevents[j].Event.Id + '),';

              }

            } else { // event is new

              var isBeingRecorded = false;
              var idfound = false;
              for (var ii = 0; ii < $scope.monitors.length; ii++) {
                if ($scope.monitors[ii].Monitor.Id == myevents[j].Event.MonitorId && NVR.isNotHidden(myevents[j].Event.MonitorId)) {
                  idfound = true;
                  break;
                }
              }

              if (idfound) {

                myevents[j].Event.MonitorName = NVR.getMonitorName(myevents[j].Event.MonitorId);

                myevents[j].Event.streamingURL = NVR.getStreamingURL(myevents[j].Event.MonitorId);
                myevents[j].Event.recordingURL = NVR.getRecordingURL(myevents[j].Event.MonitorId);
                myevents[j].Event.imageMode = NVR.getImageMode(myevents[j].Event.MonitorId);
                if (NVR.getLogin().url != myevents[j].Event.recordingURL) {

                  myevents[j].Event.recordingURL = NVR.getLogin().url;
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
                    NVR.debug("Removed Event " + mv.id + " to make space");
                  }

                }

                // since this is a new add its possible dates are not defined
                if (!moment(myevents[j].Event.StartTime).isValid()) {
                  NVR.log("Event:" + myevents[j].Event.Id + "-Invalid Start time - this should really not happen ");

                }

                if (!moment(myevents[j].Event.EndTime).isValid()) {
                  var t1 = moment().tz(NVR.getTimeZoneNow());

                  myevents[j].Event.EndTime = t1.format('YYYY-MM-DD HH:mm:ss');

                  NVR.debug("Event:" + myevents[j].Event.Id + "-End time is invalid, setting to current time");

                  isBeingRecorded = true;

                }

                // if range doesn't allow for current time, we need to fix that
                /*if (moment(options.max).isBefore(moment())) {
                   // console.log("Adjusting Range to fit in new event");
                    options.max = moment().add('1', 'hours').locale('en').format("YYYY-MM-DD HH:mm:ss");
                    timeline_instance.setOptions(options);
                }*/

                var eventText = "<span class='my-vis-font'>" + "( <i class='ion-android-notifications'></i>" + (myevents[j].Event.AlarmFrames || ' unknown ') + ") " + myevents[j].Event.Notes + "</span>";

                if (isBeingRecorded) {
                  eventText = "<span class='my-vis-font'>" + "(" + myevents[j].Event.Id + ") " + myevents[j].Event.Notes + " " + $translate.instant('kRecordingProgress') + "</span>";
                }

                // since we concated, its possible events may be repeated
                if (!graphData.get(myevents[j].Event.Id)) {

                  localNewEvents = localNewEvents + NVR.getMonitorName(myevents[j].Event.MonitorId) + '@' + shortenTime(myevents[j].Event.StartTime) + ' (' + myevents[j].Event.Id + '),';

                  var tzs2, tze2;
                  if (NVR.getLogin().useLocalTimeZone) {
                    tzs2 = moment.tz(myevents[j].Event.StartTime, NVR.getTimeZoneNow()).tz(NVR.getTimeZoneNow()).tz(NVR.getLocalTimeZoneNow());
                    tze2 = moment.tz(myevents[j].Event.EndTime, NVR.getTimeZoneNow()).tz(NVR.getLocalTimeZoneNow());
                  } else {
                    tzs2 = moment.tz(myevents[j].Event.StartTime, NVR.getTimeZoneNow());
                    tze2 = moment.tz(myevents[j].Event.EndTime, NVR.getTimeZoneNow());
                  }

                  //tzs2 = tzs2.format("YYYY-MM-DD HH:mm:ss");
                  //tze2 = tze2.format("YYYY-MM-DD HH:mm:ss");

                  NVR.debug(">>> " + myevents[j].Event.Id + " New event updating graph " + " from:" + tzs2.format() + " to:" + tze2.format());

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
                  //timeline_instance.focus(myevents[j].Event.Id);
                  timeline_instance.moveTo(timeline_instance.getCurrentTime());
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
          NVR.debug("Error getting incremental timeline data");
          isProcessNewEventsWaiting = false;

        })
        .catch (noop);

    // check all events that started 10+10 seconds ago

  }

  function noop() {

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

    NVR.log("TimelineCtrl/drawgraph: from->" + fromDateNoLang + " to->" + toDateNoLang + " count:" + count);
    $scope.graphLoaded = false;
    NVR.debug("TimelineCtrl/drawgraph: graphLoaded:" + $scope.graphLoaded);

    if (timeline_instance) {
      NVR.debug("TimelineCtrl/drawgraph: destroying timeline_instance as it exists");
      timeline_instance.destroy();
    }

    groups = new vis.DataSet();
    graphData = new vis.DataSet();
    //console.log ("AFTER VIS");

    var tzs, tze;

    // lets scope the time graph to either local or remote time zone

    if (NVR.getLogin().useLocalTimeZone) {
      tzs = moment.tz(fromDate, NVR.getTimeZoneNow()).tz(NVR.getLocalTimeZoneNow());
      tze = moment.tz(toDate, NVR.getTimeZoneNow()).tz(NVR.getLocalTimeZoneNow());
    } else {
      tzs = moment.tz(fromDate, NVR.getTimeZoneNow());
      tze = moment.tz(toDate, NVR.getTimeZoneNow());
    }

    //tzs = tzs.format("YYYY-MM-DD HH:mm:ss");
    //tze = tze.format("YYYY-MM-DD HH:mm:ss");

   // var th = Math.round( window.height() * 0.85 ) + 'px';
    options = {

      showCurrentTime: true,
      editable: false,
     verticalScroll: true,
     //height: '100%',
     //maxHeight:"80%",
     maxHeight:$rootScope.devHeight-100,
     //zoomKey: 'ctrlKey',

     //groupHeightMode:'fixed',
     //height:$rootScope.devHeight - 10,
      moment: function (date) {

        //var t;
        if (NVR.getLogin().useLocalTimeZone)
          //if (0)
          return moment.tz(date, NVR.getTimeZoneNow()).tz(NVR.getLocalTimeZoneNow());
        else
          // typecast to server time zone - its in server time anyway
          return moment.tz(date, NVR.getTimeZoneNow());
      },
      //throttleRedraw: 100,
      moveable: true,
     // height:100,
      zoomable: true,
      selectable: true,
     // multiselect: true,
      start: tzs,
      end: tze,
      orientation: 'top',
      min: tzs,
      //max: tze,
      zoomMin: 5 * 60 * 1000, // 1 min
      stack: false,
      format: {
        minorLabels: {
          minute: NVR.getTimeFormat(),
          hour: NVR.getTimeFormat(),
          second: 's',
        },
        majorLabels: {
          second: "D MMM " + NVR.getTimeFormat(),
        }
      },

    };

    graphIndex = 1; // will be used for graph ID

    //console.log ("**NOLANG" + fromDateNoLang  + " " + toDateNoLang);

    NVR.getEventsPages(0, fromDateNoLang, toDateNoLang, true)
      .then(function (epData) {
        var pages = 1;
        var itemsPerPage = parseInt(epData.limit);
        var iterCount;

        // So iterCount is the # of HTTP calls I need to make
        iterCount = Math.max(Math.round(count / itemsPerPage), 1);
        NVR.debug("TimelineCtrl/drawGraph: pages of data: " + pages + " items per page: " + itemsPerPage);
        NVR.debug("TimelineCtrl/drawGraph: I will make " + iterCount + " HTTP Requests to get all graph data");

        // I've restructured this part. I was initially using vis DataSets
        // for dynamic binding which was easier, but due to performance reasons
        // I am waiting for the full data to load before I draw
        var promises = [];
        while ((pages <= epData.pageCount) && (iterCount > 0)) {
          var promise = NVR.getEvents(0, pages, "none", fromDateNoLang, toDateNoLang, true, $rootScope.monitorsFilter);
          promises.push(promise);

          pages++;
          iterCount--;

        }

        $q.all(promises)
          .then(function (data) {
              NVR.debug("TimelineCtrl/drawgraph: all pages of graph data received ");
              graphIndex = 0;
              NVR.log("Creating " + $scope.monitors.length + " groups for the graph");
              // create groups
              for (var g = 0; g < $scope.monitors.length; g++) {
                groups.add({
                  id: $scope.monitors[g].Monitor.Id,
                  //mid: $scope.monitors[g].Monitor.Id,
                  content: NVR.getMonitorName($scope.monitors[g].Monitor.Id),
                  order: $scope.monitors[g].Monitor.Sequence
                });
                NVR.debug("TimelineCtrl/drawgraph:Adding group " +
                  NVR.getMonitorName($scope.monitors[g].Monitor.Id));
              }

              for (var j = 0; j < data.length; j++) {
                var myevents = data[j].events;


                //   console.log ("****************DATA ="+JSON.stringify(data[j]));
                // console.log ("**********************************");
                if (graphIndex > count) {
                  NVR.log("Exiting page count graph - reached limit of " + count);
                  break;

                }

                for (var i = 0; i < myevents.length; i++) {

                  // make sure group id exists before adding
                  var idfound = true;
                  var ld = NVR.getLogin();

                  // skip non detections here because we can't query to DB due to page attribute
                  if (ld.objectDetectionFilter && myevents[i].Event.Notes.indexOf('detected:') == -1) {
                    continue;
                  }

                  if (ld.persistMontageOrder) {

                    idfound = false;
                    for (var ii = 0; ii < $scope.monitors.length; ii++) {
                      if ($scope.monitors[ii].Monitor.Id == myevents[i].Event.MonitorId && NVR.isNotHidden(myevents[i].Event.MonitorId)) {
                        idfound = true;
                        //console.log ("****************** ID MATCH " + graphIndex);

                        break;
                      }
                    }
                  }

                  myevents[i].Event.MonitorName = NVR.getMonitorName(myevents[i].Event.MonitorId);
                  // now construct base path

                  myevents[i].Event.streamingURL = NVR.getStreamingURL(myevents[i].Event.MonitorId);
                  myevents[i].Event.recordingURL = NVR.getRecordingURL(myevents[i].Event.MonitorId);
                  myevents[i].Event.imageMode = NVR.getImageMode(myevents[i].Event.MonitorId);
                  if (NVR.getLogin().url != myevents[i].Event.recordingURL) {
                    //NVR.debug ("Multi server, changing base");
                    myevents[i].Event.recordingURL = NVR.getLogin().url;

                  }
               

                  if (idfound) {

                    if (typeof myevents[i].Event.DefaultVideo === 'undefined')
                      // console.log (JSON.stringify(myevents[i]));
                      myevents[i].Event.DefaultVideo = "";

                    //console.log ("ADDING "+myevents[i].Event.StartTime+"->"+myevents[i].Event.EndTime);

                    var tzs, tze;
                    if (NVR.getLogin().useLocalTimeZone) {
                      tzs = moment.tz(myevents[i].Event.StartTime, NVR.getTimeZoneNow()).tz(NVR.getLocalTimeZoneNow());
                      tze = moment.tz(myevents[i].Event.EndTime, NVR.getTimeZoneNow()).tz(NVR.getLocalTimeZoneNow());
                    } else {
                      tzs = moment.tz(myevents[i].Event.StartTime, NVR.getTimeZoneNow());
                      tze = moment.tz(myevents[i].Event.EndTime, NVR.getTimeZoneNow());
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
                    NVR.log("Exiting event graph - reached limit of " + count);
                    break;

                  }

                }
              }

              //  console.log(">>>>> CREATING NEW TIMELINE with " + JSON.stringify(options));
              timeline_instance = new vis.Timeline(container[0], null, options);
              // console.log ("GRAPH DATA");
              timeline_instance.setItems(graphData);
              //   console.log ("GROUPS");
              timeline_instance.setGroups(groups);
              timeline_instance.fit();

              

              lastTimeForEvent = moment().tz(NVR.getLogin().useLocalTimeZone ? NVR.getLocalTimeZoneNow() : NVR.getTimeZoneNow());
              updateInterval = $interval(function () {
                processNewEvents();
              }.bind(this), 10 * 1000);

              $ionicLoading.hide();
              $scope.graphLoaded = true;
              NVR.debug("graph loaded: " + $scope.graphLoaded);
              $scope.navControls = false;
             

          
               
              timeline_instance.on('rangechanged', function (s) {
                ///console.log ("Range Changed:"+JSON.stringify(s));
                if (s.byUser) {

                  var w = timeline_instance.getWindow();
                  //console.log ("start:"+w.start+" end:"+w.end);
                  var a = moment(w.start);
                  var b = moment(w.end);
                  var d = b.diff(a, 'seconds');
                  var ld = NVR.getLogin();
                  ld.timelineScale = d;
                  NVR.setLogin(ld);
                }
              });

              // different handlers for mobile and desktop
              // due to how they seeem to react to touch differently

              if ($rootScope.platformOS == 'desktop') {
                NVR.debug ("setting up desktop handlers");
                timeline_instance.on('click', function (prop) {
                    NVR.debug ("click handler called");
                    timelineShowHover(prop);
                   
                  });

                timeline_instance.on('doubleClick', function (prop) {
                    NVR.debug ("double click handler called");
                    timelineShowEvent(prop);   
                    //timelineAnalyzeFrames(prop);
                });
              }
              // mobile handlers
              else {
                 // click doesn't seem to work on mobile (iOS at least. wuh?)
                 // this is called for both tap and double tap
                 NVR.debug ("setting up mobile handlers");

                
                 timeline_instance.on('touchstart', function (prop) {
                   $timeout (function () {
                    var now = moment();
                    var diff = now.diff(lastClicked);
                    NVR.debug ('Touch Start called with ms since last clicked:'+diff);
                    lastClicked = now;
                    //NVR.debug ('lastClick set to:'+lastClicked);
                    if (diff <= 500) {
                        NVR.debug ("Double tap detected <= 500ms");
                        //timelineAnalyzeFrames(prop);
                        timelineShowEvent(prop);
                    }
                    // differntiate between dbl click and click
                    else {                      
                            NVR.debug ("single tap assumed (double tap timeout)");
                            timelineShowHover(prop);
      
                    }

                   });
                   
                    

              });
            }
            
       

              // hover is only desktop
              if ($rootScope.platformOS == 'desktop') {
                timeline_instance.on('itemover', function (prop) {
                    timelineShowHover(prop);
                   });

                
              }
     
            },
            function (error) {
              NVR.displayBanner('error', 'Timeline error', 'Please try again');

            }

          )
          .catch (noop); // get Events
      });
  }

  $scope.thumbnailClicked = function(event) {
   //console.log ("Thumb tapped");
    if (!$scope.currentThumbEvent) {
        // will this ever be? Don't think so
        NVR.debug ("No thumb rendered");
        return;
    }
    var prop = $scope.currentThumbEvent;
    if ($scope.onTap == $translate.instant('kTimelineGraph'))
        timelineAnalyzeFrames(prop);
    else
        timelineShowEvent(prop);

  };

  function timelineShowEvent(prop) {

      var itm = prop.item;
      if (!itm) {
          itm = getClosestId(prop);
          if (!itm) {
            NVR.log ("did not find an item to display", "error");
            return;
        }
      }

      if (itm) {
        NVR.debug("TimelineCtrl/drawGraph:You clicked on item " + itm);
        var item = graphData.get(itm);
        NVR.debug("TimelineCtrl/drawGraph: clicked item details:" + JSON.stringify(item));
        showEvent(item.myevent);

      } 
   
  }

  function getClosestId(prop) {
    prop = timeline_instance.getEventProperties(prop.event);
    var closestId = null;

    var target = new Date(prop.time).getTime();
    NVR.debug ("item is not exact, so guessing from time " + target + " with group=" + prop.group);
    if (prop.group) {
      var visible = timeline_instance.getVisibleItems();
     NVR.debug("Show hover: Visible items=" + JSON.stringify(visible));
     var minDist = Number.MAX_VALUE;
     //var minDist = 1.8e7; // 5 hrs in milliseconds
      var _item;
      //NVR.debug("ITEM SET IS : " + JSON.stringify(timeline_instance.itemSet));
      for (var x = 0; x < visible.length; x++) {
        _item = graphData.get(visible[x]);
        if (_item.group != prop.group) continue;
        //console.log ("ITEM start/end is:"+_item.start+'/'+_item.end);
        var dist = Math.min( Math.abs(_item.start - target), Math.abs(_item.end - target));
        if (dist < minDist ) {
            closestId = _item.id;
            minDist = dist;
           // NVR.debug ("ID:"+closestId+' is closest for now, with dist='+dist);
        }
      }

      if (closestId != null) { 
        NVR.log("Final closest item" + closestId + " group: " + prop.group);


      } else {
        NVR.log("Did not find a visible item match");
        $scope.thumbData = {
            url: '',
            eid: $translate.instant('kMonNone'),
            time: $translate.instant('kMonNone'),
            monName: $translate.instant('kMonNone')
        };
       
      }
    } else // no group row tapped, do nothing
    {
       NVR.debug ("No group id found, cannot approximate");

      /*$ionicLoading.show({
          template: "",
          animation: 'fade-in',
          showBackdrop: false,
          maxWidth: 200,
          showDelay: 0,
          duration: 1500,
      });*/
    }
    return closestId;
  }

  function timelineShowHover(prop) {

   var itm;
   if (prop.items) {
    itm = prop.items[0];
   }
   if (prop.item) {
     itm = prop.item;
   }
   if (!itm) {
        itm = getClosestId(prop);
        if (!itm) {
            NVR.log ("did not find an item to display", "error");
            return;
        }
   }

    //console.log ("ITEM HOVERED " + JSON.stringify(itm));

     // NVR.debug("TimelineCtrl/drawGraph:You hovered on item " + itm);
      //NVR.debug (" Eid=: "+itm);
      var item = graphData.get(itm);

      $scope.currentThumbEvent = timeline_instance.getEventProperties(prop.event);
      showThumbnail(item.myevent);

  }

  function timelineAnalyzeFrames(prop) {
    // console.log ("DOUBLE");
    var itm = prop.item;
   // console.log ("ITEM CLICKED " + itm);
    if (!itm) {
        itm = getClosestId(prop);
        if (!itm) {
            NVR.log ("did not find an item to display", "error");
            return;
        }
    }

   
      NVR.debug("TimelineCtrl/drawGraph:You clicked on item " + itm);
      var item = graphData.get(itm);
      NVR.debug("TimelineCtrl/drawGraph: clicked item details:" + JSON.stringify(item));
      eventDetails(item.myevent);
  }

  function showThumbnail (event) {
    //console.log ("EVENT IS "+JSON.stringify(event));
    var stream = "";
    stream = event.Event.recordingURL +
      "/index.php?view=image&fid=" +
      NVR.getSnapshotFrame()+"&eid="+event.Event.Id  + "&width=400" ;
    stream += $rootScope.authSession;
    stream += NVR.insertBasicAuthToken();
    $timeout ( function () {

        $scope.thumbData = {
            url: stream,
            eid: event.Event.Id,
            time: prettifyTimeSec(event.Event.StartTime),
            monName: event.Event.MonitorName,
            notes: event.Event.Notes
        };
      
    });
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
        timeline_instance.fit();
      }
    },
    items: [{
        content: '',
        cssClass: 'fa fa-minus-circle',
        empty: false,
        onclick: function () {
          //zoom(0.2);
          timeline_instance.zoomOut(0.2);
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
          timeline_instance.zoomIn(0.2);
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
