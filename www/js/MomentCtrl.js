/* jshint -W041 */
/*jshint -W069 */
/*jshint sub:true*/
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console, Masonry */



angular.module('zmApp.controllers').controller('zmApp.MomentCtrl', ['$scope', '$rootScope', '$ionicModal', 'NVR', '$ionicSideMenuDelegate', '$ionicHistory', '$state', '$translate', '$templateRequest', '$sce', '$compile', '$http', '$ionicLoading', 'zm', '$timeout', '$q', '$ionicPopover', '$ionicPopup', 'message', '$ionicScrollDelegate', function ($scope, $rootScope, $ionicModal, NVR, $ionicSideMenuDelegate, $ionicHistory, $state, $translate, $templateRequest, $sce, $compile, $http, $ionicLoading, zm, $timeout, $q, $ionicPopover, $ionicPopup, message, $ionicScrollDelegate) {

var masonry = null;
  var timeFrom;
  var timeTo;
  var moments = [];
  var monitors = [];
  var excludeMonitors = [];
  var excludeMonitorsFilter = "";
  var momentType = "StartTime";
  

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


  function jiggleAway() {



    // STEP 3: Called when step 2 completes for the finale
    masonry.once('layoutComplete', function (laidOutItems) {
      $timeout(function () {
        masonry.layout();
      }, 10);
    });

    // STEP2: Trigger a layout to re-pack
    $timeout(function () {
      masonry.layout();
      // $ionicScrollDelegate.$getByHandle("moment-delegate").scrollTop();

    }, 300);
  }

  //----------------------------------------------------------------
  // Given a set of monitor IDs, constructs a string that can
  // be directly passed to the cake PHP API (/MonitorId != X/...)
  //----------------------------------------------------------------

  function constructMask() {

    excludeMonitorsFilter = "";
    for (var i = 0; i < excludeMonitors.length; i++) {
      excludeMonitorsFilter = excludeMonitorsFilter + "/MonitorId !=:" + excludeMonitors[i];
    }
    NVR.debug("Constructed Monitor Filter =" + excludeMonitorsFilter);
  }

  //----------------------------------------------------------------
  // calculates array index from eid
  // we can't pass $index as events get collapsed messing up $index
  //----------------------------------------------------------------

  function getIndexFromEID(eid) {
    var found = -1;
    for (var i = 0; i < moments.length; i++) {
      if (parseInt(moments[i].Event.Id) == parseInt(eid)) {
        found = i;
        break;
      }
    }
    return found; // really should never be -1
  }

  //----------------------------------------------------------------
  // Given a payload of raw events from JSON, massages it with more
  // params for moments display
  //----------------------------------------------------------------
  function process(rawdata) {
    var data = rawdata.data;
    NVR.debug("--------> attempting PAGE " + data.pagination.page + " of " + data.pagination.pageCount);
    for (var i = 0; i < data.events.length; i++) {
      var d = getMonitorDimensions(data.events[i].Event.MonitorId);
      if (d) {
        data.events[i].Event.width = d.width;
        data.events[i].Event.height = d.height;


        var ratio;
        var mw = d.width;
        var mh = d.height;
        var mo = d.orientation;

        // scale by X if width > height                                
        if (mw > mh) {
          ratio = mw / zm.thumbWidth;
          data.events[i].Event.thumbWidth = 200;
          data.events[i].Event.thumbHeight = Math.round(mh / ratio);
        } else {

          ratio = mh / zm.thumbWidth;
          data.events[i].Event.thumbHeight = 200;
          data.events[i].Event.thumbWidth = Math.round(mw / ratio);

        }
        if (mo != 0) {
          var tmp = data.events[i].Event.thumbHeight;
          data.events[i].Event.thumbHeight = data.events[i].Event.thumbWidth;
          data.events[i].Event.thumbWidth = tmp;

        } // swap 
      }

      data.events[i].Event.hide = false;
      data.events[i].Event.icon = "ion-code-working";
    
      data.events[i].Event.recordingURL = NVR.getLogin().url;

      data.events[i].Event.monitorName = NVR.getMonitorName(data.events[i].Event.MonitorId);
      data.events[i].Event.dateObject = new Date(data.events[i].Event.StartTime);
      data.events[i].Event.humanizeTime = humanizeTime(data.events[i].Event.StartTime);
      var mid = data.events[i].Event.MonitorId;
      data.events[i].Event.order = i; // likely not needed if I stop force sorting

      data.events[i].Event.pinned = false;
      moments.push(data.events[i]);


    }

    if ($scope.expand)
      _expandAll(moments);
    else _collapseAll(moments);

  }

  // credit https://stackoverflow.com/a/17265125/1361529
  function objSort() {
    var args = arguments,
      array = args[0],
      case_sensitive, keys_length, key, desc, a, b, i;

    if (typeof arguments[arguments.length - 1] === 'boolean') {
      case_sensitive = arguments[arguments.length - 1];
      keys_length = arguments.length - 1;
    } else {
      case_sensitive = false;
      keys_length = arguments.length;
    }

    return array.sort(function (obj1, obj2) {
      for (i = 1; i < keys_length; i++) {
        key = args[i];
        if (typeof key !== 'string') {
          desc = key[1];
          key = key[0];
          // hack to extend it as I have nested fields
          a = obj1["Event"][args[i][0]];
          b = obj2["Event"][args[i][0]];
        } else {
          desc = false;
          a = obj1["Event"][args[i]];
          b = obj2["Event"][args[i]];
        }
        // console.log ("a="+a);
        //  console.log ("b="+b);

        if (case_sensitive === false && typeof a === 'string') {
          a = a.toLowerCase();
          b = b.toLowerCase();
        }

        if (!desc) {
          if (a < b) return -1;
          if (a > b) return 1;
        } else {
          if (a > b) return -1;
          if (a < b) return 1;
        }
      }
      return 0;
    });
  } //end of objSort() function

  //----------------------------------------------------------------
  // used for placeholder sizing
  //----------------------------------------------------------------
  function getMonitorDimensions(mid) {

    for (var i = 0; i < monitors.length; i++) {

      if (mid == monitors[i].Monitor.Id) {

        
        return {
          width: monitors[i].Monitor.Width,
          height: monitors[i].Monitor.Height,
          orientation: monitors[i].Monitor.Orientation
        };
      }
    }

  }
  $scope.toggleSubMenu = function () {
    $scope.isSubMenu = !$scope.isSubMenu;

    var ld = NVR.getLogin();
    ld.enableMomentSubMenu = $scope.isSubMenu;
    NVR.setLogin(ld);
    if ($scope.isSubMenu)
      $ionicScrollDelegate.$getByHandle("moment-delegate").scrollTop();
  };

  //----------------------------------------------------------------
  // increase/decrease thumbnail size
  //----------------------------------------------------------------
  $scope.sizeChanged = function (dirn) {
    var sz = $scope.gridSize;
    sz = sz + 5 * dirn;
    if (sz < 5) sz = 5;
    if (sz > 100) sz = 100;
    $scope.gridSize = sz;

    var ld = NVR.getLogin();
    ld.momentGridSize = $scope.gridSize;
    NVR.setLogin(ld);

    $timeout(function () {
      masonry.layout();
    }, 300);


  };

  //----------------------------------------------------------------
  // the times when images take too long and masonry gets messed
  //----------------------------------------------------------------
  $scope.reLayout = function () {
    NVR.log("relaying masonry");
    $timeout(function () {
      masonry.layout();
    }, 300);

  };


  $scope.constructFrame = function (moment) {
    var stream = "";
    // console.log ($scope.isMaxScoreFramePresent);
    stream = moment.Event.recordingURL + "/index.php?view=image" +
    "&eid=" + moment.Event.Id + "&fid=" +
    NVR.getSnapshotFrame() +
      "&width=" + moment.Event.thumbWidth * 2 +
      "&height=" + moment.Event.thumbHeight * 2;

    stream += $rootScope.authSession;
    stream += NVR.insertSpecialTokens();
    return stream;

  };


  //----------------------------------------------------------------
  // construct popover only when needed
  // so that we can use one-time binding for the compare function
  //----------------------------------------------------------------
  $scope.isChecked = function (val) {
    //console.log ("COMPARE");
    return $translate.instant(val) == $scope.type;
  };

  $scope.showPopover = function ($event) {

    $ionicPopover.fromTemplateUrl('templates/moment-popover.html', {
      scope: $scope,
    }).then(function (popover) {
      $scope.popover = popover;
      popover.show($event);
    });

  };

  //----------------------------------------------------------------
  // Pinning a thumbnail means don't collapse it. Useful to drill
  // down quickly.
  //----------------------------------------------------------------

  $scope.togglePin = function (eid) {
    var ndx = getIndexFromEID(eid);
    if (ndx == -1) {
      NVR.log("Uh oh, ndx returned -1, this should never happen. Event passed was " + eid);
      return;
    }

    $scope.moments[ndx].Event.pinned = !$scope.moments[ndx].Event.pinned;

  };

  $scope.toggleExpandOrCollapse = function () {

    $scope.expand = !$scope.expand;
    if ($scope.expand) expandAll();
    else collapseAll();
    var ld = NVR.getLogin();
    ld.montageReviewCollapse = $scope.expand;

   // console.log(">>>>>>>>> SAVING EXPAND AS:" + $scope.expand);
    NVR.setLogin(ld);

  };

  function expandAll() {

    _expandAll($scope.moments);

  }

  function _expandAll(arr) {

    NVR.debug("Expanding all images");
    for (var i = 0; i < arr.length; i++) {
      arr[i].Event.hide = false;
      arr[i].Event.icon = 'ion-code-working';
      arr[i].Event.collapseCount = '';
    }


    if (masonry) {
      $timeout(function () {
        masonry.reloadItems();
        jiggleAway();

      }, 100);
    }

  }

  function collapseAll() {

    _collapseAll($scope.moments);
  }

  function _collapseAll(arr) {

    NVR.debug("Collapsing all images");
    for (var i = 0; i < monitors.length; i++) {
      var firstFound = false;
      var firstIndex = -1;
      var collapseCount = 0;
      for (var j = 0; j < arr.length; j++) {
        if (arr[j].Event.MonitorId == monitors[i].Monitor.Id) {

          if (!firstFound) {
            firstIndex = j; // remember this to create a collapsecount
            arr[j].Event.hide = false;
            arr[j].Event.icon = 'ion-images';
            firstFound = true;
          } else if (!arr[j].Event.pinned) {
            // mid matches, but not first, and not pinned so collapse
            arr[j].Event.hide = true;
            arr[j].Event.icon = 'ion-code-working';
            collapseCount++;
          }
        } // if same mid
      } // moment for j
      if (firstIndex != -1) {
        if (collapseCount > 0) {
          arr[firstIndex].Event.collapseCount = collapseCount + 1;
        } else { // nothing to group
          arr[firstIndex].Event.icon = 'ion-code-working';
          arr[firstIndex].Event.collapseCount = "";
        }

      } // firstIndex
    } // monitor for i

    if (masonry) {

      $timeout(function () {
        masonry.reloadItems();
        jiggleAway();

      }, 100);
    }

  }

  //----------------------------------------------------------------
  // fold/unfold monitor groups
  //----------------------------------------------------------------
  // When a user taps on collapse on an eid,
  // all events after that for the same monitor should be collapsed
  // events before that should remain

  // when a user expands back on an eid, all eids after that for the
  // same monitor should expand, even if they were grouped earlier

  $scope.toggleCollapse = function (mid, eid) {
    //NVR.debug("toggling collapse for:" + mid);
    var collapseCount = 0;
    var hide = false;

    var ndx = getIndexFromEID(eid);
    if (ndx == -1) {
      NVR.log("Uh oh, ndx returned -1, this should never happen. Event passed was " + eid);
      return;
    }

    $scope.moments[ndx].Event.hide = false;
    if ($scope.moments[ndx].Event.icon == 'ion-code-working') {
      // we want to hide 
      hide = true;
      $scope.moments[ndx].Event.icon = 'ion-images';
    } else { // we want to show
      hide = false;
      $scope.moments[ndx].Event.icon = 'ion-code-working';
    }

    for (var i = ndx + 1; i < $scope.moments.length; i++) {
      if ($scope.moments[i].Event.MonitorId == mid && !$scope.moments[i].Event.pinned) {
        $scope.moments[i].Event.hide = hide;
        $scope.moments[i].Event.icon = "ion-code-working";
        $scope.moments[i].Event.collapseCount = "";
        if (hide) collapseCount++;
      }
    } //for
    if (hide) {
      // +1 for the marked frame which doesn't get counted
      if (collapseCount > 0) {
        $scope.moments[ndx].Event.collapseCount = collapseCount + 1;
      } else { // nothing to collapse
        $scope.moments[ndx].Event.collapseCount = "";
        $scope.moments[ndx].Event.icon = 'ion-code-working';

      }
    } else {
      $scope.moments[ndx].Event.collapseCount = "";
    }

    $timeout(function () {
      masonry.reloadItems();
      jiggleAway();

    }, 100);

  };

  //----------------------------------------------------------------
  // convenience fn to show hh:mm of event
  //----------------------------------------------------------------

  $scope.hourmin = function (str) {
    return moment(str).format(NVR.getTimeFormat());

  };

  $scope.cancelMask = function () {
    $scope.modal.remove();
  };

  //----------------------------------------------------------------
  // Write hidden monitors to storage so its remembered
  //----------------------------------------------------------------

  $scope.saveMask = function () {
    $scope.modal.remove();
    excludeMonitors = [];

    // convert selection list to array, so we can pass it to createMask 
    // which in turn creates the actual string for the API to exclude mons
    for (var i = 0; i < $scope.monitors.length; i++) {
      if ($scope.monitors[i].Monitor.listDisplay == 'noshow') {
        excludeMonitors.push($scope.monitors[i].Monitor.Id);
      }

    }
    constructMask();

    var ld = NVR.getLogin();
    ld.momentMonitorFilter = JSON.stringify(excludeMonitors);
    NVR.setLogin(ld);

    getMoments(momentType);


  };


  //----------------------------------------------------------------
  // Called by moments-mask to change color of list items 
  //----------------------------------------------------------------
  $scope.toggleHide = function (i) {

    if ($scope.monitors[i].Monitor.listDisplay == 'show') {
      $scope.monitors[i].Monitor.listDisplay = 'noshow';

    } else {
      $scope.monitors[i].Monitor.listDisplay = 'show';

    }


    NVR.debug("index " + i + " is now " + $scope.monitors[i].Monitor.listDisplay);

  };


  //----------------------------------------------------------------
  // Invokes moment-mask to enable/disable hidden mons
  //----------------------------------------------------------------

  $scope.hideUnhide = function () {
    $scope.monitors = monitors;
    $ionicModal.fromTemplateUrl('templates/moment-mask.html', {
        scope: $scope,
        animation: 'slide-in-up',
        id: 'reorder',
      })
      .then(function (modal) {
        $scope.modal = modal;
        $scope.modal.show();
      });

  };


  function humanizeTime(str) {
    return moment.tz(str, NVR.getTimeZoneNow()).fromNow();
  }

  //----------------------------------------------------------------
  // Like Packery but Masonry offers a mechanism to keep the order
  // of images. Pretty important for a timeline related function
  //----------------------------------------------------------------
  function initMasonry() {
    /*$ionicLoading.show({
      template: $translate.instant('kArrangingImages'),
      noBackdrop: true,
      duration: zm.loadingTimeout
    });*/

    $scope.areImagesLoading = true;
    var progressCalled = false;

    var ld = NVR.getLogin();

    var elem = angular.element(document.getElementById("mygrid"));
    masonry = new Masonry('.grid', {
      itemSelector: '.grid-item',
      horizontalOrder: true, // this keeps the order
      gutter: 0,
      initLayout: true,
      percentPosition: true,

    });

    imagesLoaded(elem).on('progress', function (instance, img) {
      masonry.layout();

    });
    imagesLoaded(elem).once('always', function () {

      NVR.debug("All images loaded");
      $ionicLoading.hide();
      $scope.areImagesLoading = false;
      jiggleAway();

      if (!progressCalled) {
        NVR.log("***  PROGRESS WAS NOT CALLED");
        masonry.reloadItems();
        jiggleAway();
      }

    });
  }

  $scope.closeModal = function () {
    NVR.debug(">>>MomentCtrl:Close & Destroy Modal");
    NVR.setAwake(false);
    if ($scope.modal !== undefined) {
      $scope.modal.remove();
    }

    if ($scope.modalData.doRefresh) getMoments(momentType, timeTo);
  };

  //----------------------------------------------------------------
  //  Loads the modal to play an event
  //----------------------------------------------------------------

  $scope.playEvent = function (event) {

    $scope.currentEvent = event;
    $scope.event = event;
    $scope.monitors = monitors;
    NVR.setAwake(NVR.getKeepAwake());
    $scope.followSameMonitor = "0";
    $scope.mycarousel = {
      index: 0
    };

    $scope.ionRange = {
      index: 1
    };

    var ld = NVR.getLogin();
    var sl = 'disabled';
    if (ld.showLiveForInProgressEvents) {
      sl = 'enabled';
    }

    $scope.modalData = {
      doRefresh: false
    };
    $ionicModal.fromTemplateUrl('templates/events-modal.html', {
        scope: $scope,
        animation: 'slide-in-up',
        id: 'footage',
        showLive: sl,
        snapshot: 'enabled',
        snapshotId: 'snapshot',
        eventId: event.Event.Id
        //eventId:event.Event.Id


      })
      .then(function (modal) {
        $scope.modal = modal;



        $scope.modal.show();

        var ld = NVR.getLogin();

      });


  };


  //----------------------------------------------------------------
  // Only called by "here" button without cond. So prev type is used
  //----------------------------------------------------------------
  $scope.getMoments = function (cond) {
    if (!cond) cond = momentType;

    var ld = NVR.getLogin();
    ld.momentArrangeBy = cond;
    NVR.setLogin(ld);
    getMoments(cond);
  };

  function noop(err) {
    //console.log("ERROR NOOP=" + JSON.stringify(err));
  }


  //----------------------------------------------------------------
  // used to go forward (+1) or back (-1) in time by 24 hrs
  //----------------------------------------------------------------
  $scope.changeFrom = function (dirn) {

    var f;
    if (dirn == 1) { // add a day
      t = moment(timeTo);
      t.add(1, "day");
      if (t > moment()) {
        NVR.log("Future date selected, ignoring");
        return;
      }
      //console.log("T=" + t.format("MMM DD,YYYY HH:mm"));
    } else {
      t = moment(timeTo);
      t.subtract(1, "day");
      //console.log("T=" + t.format("MMM DD,YYYY HH:mm"));

    }
    var newTo = t.format("YYYY-MM-DD HH:mm:ss");
    getMoments(momentType, newTo);

  };

  //----------------------------------------------------------------
  // The entire point of this controller.
  //----------------------------------------------------------------

  function getMoments(sortCondition, to) {

    if (sortCondition == 'MaxScore') {
      $scope.type = $translate.instant('kMomentMenuByScore');
      $scope.typeIcon = "ion-arrow-graph-up-right";
    } else if (sortCondition == 'StartTime') {
      $scope.type = $translate.instant('kMomentMenuByTime');
      $scope.typeIcon = "ion-clock";
    } else if (sortCondition == 'monitorName') {
      $scope.type = $translate.instant('kMomentMenuByMonitor');
      $scope.typeIcon = "ion-ios-videocam";

    }

    $scope.apiurl = NVR.getLogin().apiurl;
    moments.length = 0;

    NVR.setAwake(false);

    var tmptimeto, tmptimefrom;

    if (!to) { // assume current time
      tmptimeto = moment();
    } else {
      tmptimeto = moment(to);
    }


    tmptimefrom = angular.copy(tmptimeto);
    tmptimefrom.subtract(24, 'hours'); // mutable, hence deep copy above

    var page = 1;
    timeFrom = tmptimefrom.format('YYYY-MM-DD HH:mm:ss');
    timeTo = tmptimeto.format('YYYY-MM-DD HH:mm:ss');


    $scope.displayTimeFrom = moment(timeFrom).format("MMM DD," + NVR.getTimeFormat());
    $scope.displayTimeTo = moment(timeTo).format("MMM DD," + NVR.getTimeFormat());

    NVR.debug("Moments from " + timeFrom + " to " + timeTo);

    var ld = NVR.getLogin();

    // in API, always sort by StartTime so all monitors are represented
    var myurl = ld.apiurl + "/events/index/AlarmFrames >=:1" + excludeMonitorsFilter + "/StartTime <=:" + timeTo + "/EndTime >=:" + timeFrom + ".json?sort=" + "StartTime" + "&direction=desc"+$rootScope.authSession;
    NVR.debug("Retrieving " + myurl);


    // very cool trick to parallel fork HTTP requests and not bork on errors. Basically, we catch errors and ignore
    // noop is a dummy function that does nothing
    // credit https://stackoverflow.com/a/20594522/1361529
    $q.all([
        $http.get(myurl + '&page=1').then(process).catch(noop),
        $http.get(myurl + '&page=2').then(process).catch(noop),
        $http.get(myurl + '&page=3').then(process).catch(noop),
        $http.get(myurl + '&page=4').then(process).catch(noop)

      ])
      .then(function () {
        NVR.debug("$q.all Parallel queries completed");

        if (!moments.length) {
          $scope.loadingStatus = $translate.instant('kMomentNoneFound');
        }

        // not really sure we need this
        // will see later
        if (sortCondition == "StartTime") {
          moments.sort(function (a, b) {
            var da = a.Event.dateObject;
            var db = b.Event.dateObject;
            return da > db ? -1 : da < db ? 1 : 0;
          });
        }

        // if we use any other condition, we need to first sort by cond and then time
        if (sortCondition != "StartTime") {
          var ascordesc = true;
          if (sortCondition == 'monitorName') ascordesc = false;
          //console.log("SORTING BY " + sortCondition);
          moments = objSort(moments, [sortCondition, ascordesc], ["dateObject", true]);
        }

       
        $scope.moments = moments;
        $timeout(function () {
          initMasonry();
        }, 300);

      });




  }

  //----------------------------------------------------------------
  // 
  //----------------------------------------------------------------

  $scope.$on('$ionicView.beforeLeave', function () {
    NVR.debug("Destroying masonry");
    masonry.destroy();
  });


  //----------------------------------------------------------------
  // lets you hide overlays - useful for tiny screens
  //----------------------------------------------------------------
  $scope.toggleIcons = function () {

    $scope.showIcons = !$scope.showIcons;
    ld = NVR.getLogin();
    ld.momentShowIcons  =  $scope.showIcons;
    NVR.setLogin(ld);
  };

  //----------------------------------------------------------------
  // Stuff before the view loads
  //----------------------------------------------------------------

  $scope.$on('$ionicView.beforeEnter', function () {


    $scope.$on ( "process-push", function () {
      NVR.debug (">> MomentCtrl: push handler");
      var s = NVR.evaluateTappedNotification();
      NVR.debug("tapped Notification evaluation:"+ JSON.stringify(s));
      $ionicHistory.nextViewOptions({
        disableAnimate:true,
        disableBack: true
      });
      $state.go(s[0],s[1],s[2]);
    });

    //console.log ("HERE>>>>>>>>>>>>>>>>>>>>>>>>>>>");

    monitors = angular.copy(message); // don't mess up the main monitors list
    masonry = null;
    var ld = NVR.getLogin();

    $scope.showIcons = ld.momentShowIcons;
    $scope.areImagesLoading = true;


    $scope.expand = ld.montageReviewCollapse;
    //console.log(">>>>>>>>> RESTORING EXPAND AS:" + $scope.expand);
   

    $scope.loadingStatus = $translate.instant('kLoading');
    $scope.gridSize = ld.momentGridSize;
    momentType = ld.momentArrangeBy;
    //console.log ("---------->Filter before "+ld.momentMonitorFilter);

    try {
      excludeMonitors = JSON.parse(ld.momentMonitorFilter);
    } catch (e) {
      excludeMonitors = [];
    }

    //console.log("RETRIEVED EXCLUDE=" + JSON.stringify(excludeMonitors));
    constructMask();
    $scope.isSubMenu = ld.enableMomentSubMenu;



    for (var i = 0; i < monitors.length; i++) {
      if (excludeMonitors.indexOf(monitors[i].Monitor.Id) != -1) {
        monitors[i].Monitor.listDisplay = 'noshow';
        //console.log("Marking monitor " + monitors[i].Monitor.Id + " as noshow");
      }

    }

  });

  $scope.$on('$ionicView.afterEnter', function () {


    getMoments(momentType);


  });

}]);
