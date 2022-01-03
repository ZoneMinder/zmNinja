// Controller for the montage view
/* jshint -W041 */
/* jshint esversion: 6 */

/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,ionic,Packery, Draggabilly, imagesLoaded, ConnectSDK, moment */

angular.module('zmApp.controllers')
  .controller('zmApp.MontageCtrl', ['$scope', '$rootScope', 'NVR', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$ionicPopup', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$ionicPlatform', 'zm', '$ionicPopover', '$controller', 'imageLoadingDataShare', '$window', '$localstorage', '$translate', 'SecuredPopups', 'EventServer', 'message', '$q',function ($scope, $rootScope, NVR, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $ionicPopup, $stateParams, $ionicHistory, $ionicScrollDelegate, $ionicPlatform, zm, $ionicPopover, $controller, imageLoadingDataShare, $window, $localstorage, $translate, SecuredPopups, EventServer, message,$q) {

    //---------------------------------------------------------------------
    // Controller main
    //---------------------------------------------------------------------

    var timeInMontage = new Date();
    var intervalHandleMontage; // image re-load handler
    var intervalHandleAlarmStatus; // status of each alarm state
    var intervalHandleMontageCycle;
    var intervalHandleReloadPage;
    var intervalHandleEventStatus;
    var intervalHandleStreamQuery;


    var gridcontainer;
    var pckry, draggie;
    var draggies;
    var loginData;
    var timestamp;
    var sizeInProgress;
    var modalIntervalHandle;
    var ld;
    var refreshSec;
    var reloadPage = zm.forceMontageReloadDelay;
    var viewCleaned = false;
    var randToAvoidCacheMem;
    var beforeReorderPositions=[];

    var streamQueryTimer;

    var streamState = {
      SNAPSHOT: 1,
      SNAPSHOT_LOWQUALITY:2,
      ACTIVE: 3,
      STOPPED: 4,
      PAUSED: 5
    };

    var currentStreamState = streamState.SNAPSHOT_LOWQUALITY; // first load snapshot
    $scope.isModalStreamPaused = false; // used in Monitor Modal

    //var reloadPage = 30;

    var simulStreaming = false; // will be true if you  multiport

    var broadcastHandles = [];
    $scope.$on('monitors-hard-reload', function () {
      NVR.debug('Monitors reloaded, reloading monitor array');

      var ps = NVR.getLogin().packeryPositions;
      var p = parsePositions(ps);
      matchMonitorsToPositions(p, $scope.monitors);
      $scope.MontageMonitors = angular.copy($scope.monitors);
    });

    var as = $scope.$on('auth-success', function () {
      NVR.debug('Auth success, recomputing rand value...');
      randEachTime();
    });

    //--------------------------------------------------------------------------------------
    // Handles bandwidth change, if required
    //
    //--------------------------------------------------------------------------------------

    var bc = $scope.$on('bandwidth-change', function (e, data) {
      // not called for offline, I'm only interested in BW switches
      NVR.debug('Got network change:' + data);
      var ds;
      if (data == 'lowbw') {
        ds = $translate.instant('kLowBWDisplay');
      } else {
        ds = $translate.instant('kHighBWDisplay');
      }
      NVR.displayBanner('net', [ds]);
      var ld = NVR.getLogin();
      refreshSec = (NVR.getBandwidth() == 'lowbw') ? ld.refreshSecLowBW : ld.refreshSec;
      streamQueryTimer = (NVR.getBandwidth() == 'lowbw') ? zm.streamQueryStatusTimeLowBW: zm.streamQueryStatusTime;

      $interval.cancel(intervalHandleMontage);
      $interval.cancel(intervalHandleMontageCycle);
      $interval.cancel(intervalHandleReloadPage);
      $interval.cancel(intervalHandleStreamQuery);

      if (simulStreaming){
        intervalHandleStreamQuery = $interval(function () {
          loadStreamQueryStatus();
          //  console.log ("Refreshing Image...");
        }.bind(this), streamQueryTimer);
      }

      intervalHandleMontage = $interval(function () {
        loadNotifications();
      }.bind(this), refreshSec * 1000);

      intervalHandleMontageCycle = $interval(function () {
        cycleMontageProfiles();
      }.bind(this), NVR.getLogin().cycleMontageInterval * 1000);

      intervalHandleReloadPage = $interval(function () {
        forceReloadPage();
      }.bind(this), reloadPage);

      if (NVR.getBandwidth() == 'lowbw') {
        NVR.debug('Enabling low bandwidth parameters');
        $scope.LoginData.montageQuality = zm.montageQualityLowBW;
        $scope.LoginData.singleImageQuality = zm.eventSingleImageQualityLowBW;
        $scope.LoginData.montageHistoryQuality = zm.montageQualityLowBW;
      }
    });

    broadcastHandles.push(bc);

    // --------------------------------------------------------
    // Handling of back button in case modal is open should
    // close the modal
    // --------------------------------------------------------

    $ionicPlatform.registerBackButtonAction(function (e) {
      e.preventDefault();
      if ($scope.modal != undefined && $scope.modal.isShown()) {
        // switch off awake, as liveview is finished
        NVR.debug('Modal is open, closing it');
        NVR.setAwake(false);
        cleanupOnCloseModal();
      } else {
        NVR.debug('Modal is closed, so toggling or exiting');
        if (!$ionicSideMenuDelegate.isOpenLeft()) {
          $ionicSideMenuDelegate.toggleLeft();
        } else {
          navigator.app.exitApp();
        }
      }
    }, 1000);

    /*$scope.toggleHide = function(mon)
    {
        if (mon.Monitor.listDisplay == 'noshow')
            mon.Monitor.listDisplay = 'show';
        else
            mon.Monitor.listDisplay = 'noshow';
    };*/

    function jiggleMontage() {
      if ($scope.reOrderActive) return;
      NVR.debug('window resized');
      //initPackery();
    }

    function forceReloadPage() {
      if ($scope.isDragabillyOn) {
        NVR.debug('not reloading, edit in progress');
        return;
      }

      var ld = NVR.getLogin();
      ld.reloadInMontage = true;
      NVR.log('Reloading view to keep memory in check...');
      NVR.setLogin(ld)
        .then(function () {
          //window.location.reload(true);
          //location.reload();
          //$ionicHistory.clearCache();
          //$state.go('app.montage');

          /*$ionicHistory.clearCache([$state.current.name]).then(function() {
              $state.go('app.montage', $stateParams, {reload:true, inherit:false});
            });*/
          $ionicHistory.nextViewOptions({
            disableAnimate: true,
            disableBack: true
          });

          $state.go('app.refresh', {
            "view": 'app.montage'
          });
        });

      /*$ionicHistory.nextViewOptions(
       {
           disableAnimate: true,
           disableBack: true
       });
       $state.go("app.montage",
       {
           minimal: $scope.minimal,
           isRefresh: true
       });*/
    }

    // called by afterEnter to load Packery
    function initPackery() {
      /* for (var x=0; x < $scope.MontageMonitors.length; x++) {
        console.log ('INITPACKERY: '+$scope.MontageMonitors[x].Monitor.Id+'==>'+$scope.MontageMonitors[x].Monitor.listDisplay);
      }*/

      /* $ionicLoading.show(
       {
           template: $translate.instant('kArrangingImages'),
           noBackdrop: true,
           duration: zm.loadingTimeout
       });*/

      var d = $q.defer();
      currentStreamState = streamState.SNAPSHOT_LOWQUALITY;

      $scope.areImagesLoading = true;
      var progressCalled = false;

      if (draggies) {
        draggies.forEach(function (drag) {
          drag.destroy();
        });
      }
      draggies = [];

      var layouttype = true;
      var ld = NVR.getLogin();

      var positionsStr = ld.packeryPositions;
      var positions = {};

      if (positionsStr == '' || positionsStr == undefined) {
        NVR.log("Did NOT find a packery layout");
        layouttype = true;
      } else {
        //console.log ("POSITION STR IS " + positionsStr);
        positions = parsePositions(positionsStr);
        layouttype = matchMonitorsToPositions(positions);
        //console.log ('P US NOW '+positions);
        // NVR.log("found a packery layout:"+positionsStr);
        //layouttype = false;
      }

      var cnt = 0;
      $scope.MontageMonitors.forEach(function (elem) {
        if (elem.Monitor.listDisplay != 'noshow')
          cnt++;
      });

      var pos_cnt = 0;
      for (var p=0; p < positions.length; p++) {
        if (positions[p].display == 'show' || positions[p].display=='blank') {
          pos_cnt++;
        }
      }

      // NVR.log("Monitors that are active " + cnt + " while grid has " + pos_cnt);

      if (cnt > NVR.getLogin().maxMontage) {
        cnt = NVR.getLogin().maxMontage;
        NVR.log("restricting monitor count to " + cnt + " due to max-montage setting");
      }

      //      console.log ($scope.MontageMonitors);
      //if (cnt != pos_cnt) {
      //   NVR.log("Whoops!! Monitors have changed. I'm resetting layouts, sorry!");
      //   layouttype = true;
      //   positions = {};
      // document.documentElement.style.setProperty('--grid-width', "50%");
      //}

      var elem = angular.element(document.getElementById("mygrid"));

      var loadCount = 0;
      //console.log ("**** mygrid is " + JSON.stringify(elem));

      if (pckry) pckry.destroy();
      NVR.debug ('Calling initPackery() with layout as:'+layouttype);
      pckry = new Packery('.grid', {
        itemSelector: '.grid-item',
        percentPosition: true,
        //columnWidth: '.grid-sizer',
        gutter: 0,
        initLayout: layouttype,
        shiftPercentResize: true,
        transitionDuration: 0
      });

      imagesLoaded(elem).on('progress', function (instance, img) {
        var result = img.isLoaded ? 'loaded' : 'broken';
        // NVR.debug('~~loaded image is ' + result + ' for ' + img.img.src);

        // lay out every image if a pre-arranged position has not been found

        $timeout(function () {
          if (layouttype)  {
            pckry.layout();
          } else {
            pckry.shiftLayout();
          }
        }, 100);

        progressCalled = true;
        loadCount++;
        // console.log ("loaded "+loadCount+" of "+positions.length);

        // if (layouttype) $timeout (function(){layout(pckry);},100);
      });

      $timeout(function () {
        if ($scope.areImagesLoading) {
          NVR.debug("Images still loading after 15secs?");
          allImagesLoadedOrFailed();
        }
      }, 15000);

      imagesLoaded(elem).on('always', function () {
        //console.log ("******** ALL IMAGES LOADED");
        // $scope.$digest();
        NVR.debug("All images loaded, switching to snapshot...");
        allImagesLoadedOrFailed();
      });

      imagesLoaded(elem).on('fail', function () {
        NVR.debug("All images loaded, but some broke, switching to snapshot...");
        //console.log ("******** ALL IMAGES LOADED");
        // $scope.$digest();
        $timeout (function () {
          allImagesLoadedOrFailed();
        },100);
      });

      function allImagesLoadedOrFailed() {
        $scope.areImagesLoading = false;
        currentStreamState = streamState.SNAPSHOT;
        if (simulStreaming) {
          $timeout (function () {
            NVR.debug("Switching mode to streaming as multi-port on...");
            //NVR.regenConnKeys();
            //randEachTime();
            currentStreamState = streamState.ACTIVE;
            d.resolve(true);
            return d.promise;
          },300);
        }

        $ionicLoading.hide();
        pckry.getItemElements().forEach(function (itemElem) {
          draggie = new Draggabilly(itemElem);
          pckry.bindDraggabillyEvents(draggie);
          draggies.push(draggie);
          draggie.disable();
          draggie.unbindHandles();
        });

        pckry.on('dragItemPositioned', itemDragged);

        if (!isEmpty(positions)) {
          NVR.log("Arranging as per packery grid");

          for (var i = 0; i < $scope.MontageMonitors.length; i++) {
            for (var j = 0; j < positions.length; j++) {
              if ($scope.MontageMonitors[i].Monitor.Id == positions[j].attr) {
                if (isNaN(positions[j].size) || (positions[j].size == 0))
                  positions[j].size = 20;

                $scope.MontageMonitors[i].Monitor.gridScale = positions[j].size;

                if (!positions[j].display)
                  positions[j].display = 'show';

                $scope.MontageMonitors[i].Monitor.listDisplay = positions[j].display;
                // NVR.debug("Setting monitor ID: " + $scope.MontageMonitors[i].Monitor.Id + " to size: " + positions[j].size + " and display:" + positions[j].display);
              }
              //console.log ("Index:"+positions[j].attr+ " with size: " + positions[j].size);
            }
          }

          NVR.debug("All images loaded, doing image layout");
          $timeout(function () {
            //NVR.log("Force calling resize");
            ///pckry.reloadItems();
            ///positions is defined only if layouttype was false
            //(">>> Positions is " + JSON.stringify(positions));
            //console.log ('WHATEVER '+layouttype+"=>"+JSON.stringify(positions));
            /* for (var m=0; m < $scope.MontageMonitors.length; m++) {
                console.log ("mid:"+$scope.MontageMonitors[m].Monitor.Id+" with listDisplay="+$scope.MontageMonitors[m].Monitor.listDisplay + " and Function=" + $scope.MontageMonitors[m].Monitor.Function);
              }*/
            try {
              if (!layouttype && positions)
                pckry.initShiftLayout(positions, "data-item-id");
            } catch (e) {
              console.log('Error: '+JSON.stringify(e));
            }
            console.log('DONE');
            // now do a jiggle
            $timeout(function () {
              NVR.debug("inside drag items:doing the jiggle and dance...");

              pckry.once('layoutComplete', function() {
                var positions = pckry.getShiftPositions('data-item-id');
                //console.log ("POSITIONS MAP " + JSON.stringify(positions));
                var ld = NVR.getLogin();
                ld.packeryPositions = JSON.stringify(positions);
                //  console.log ("Saving " + ld.packeryPositions);
                // console.log ("FULL OBJECT "+ JSON.stringify(ld));
                //ld.currentMontageProfile = "";
                //$scope.currentProfileName = $translate.instant('kMontage');
                NVR.setLogin(ld);
                NVR.debug("saved new positions: " + ld.packeryPositions);
              });
              pckry.shiftLayout();

              //$scope.squeezeMonitors();
            }, 500);
          }, 100);
        } // endif (!isEmpty(positions))

        //pckry.onresize();
      } /* function allImagesLoadedOrFailed() */

      function itemDragged(item) {
        NVR.debug("drag complete");
        /* $timeout(function () {
          pckry.shiftLayout();
        }, 20);*/

        $timeout (function () {
          var positions = pckry.getShiftPositions('data-item-id');
          //console.log ("POSITIONS MAP " + JSON.stringify(positions));
          var ld = NVR.getLogin();
          ld.packeryPositions = JSON.stringify(positions);
          //  console.log ("Saving " + ld.packeryPositions);
          // console.log ("FULL OBJECT "+ JSON.stringify(ld));
          ld.currentMontageProfile = "";
          $scope.currentProfileName = $translate.instant('kMontage');
          NVR.setLogin(ld);
          NVR.debug("saved new positions: " + ld.packeryPositions);
          //pckry.reloadItems();
        },300);
      }
      return d.promise;
    }

    function isEmpty(obj) {
      for (var prop in obj) {
        return false;
      }
      return true;
    }

    //-----------------------------------------------------------------------
    // color for monitor state in montage
    //-----------------------------------------------------------------------

    $scope.stateColor = function () {
      //console.log ("***MONSTATUS**"+$scope.monStatus+"**");
      var attr = "";
      switch ($scope.monStatus) {
        case "":
          attr = "color:rgba(0, 0, 0, 0)";
          break;
        case "idle":
          attr = "color:rgba(0, 0, 0, 0)";
          break;
        case "pre-alarm":
          attr = "color:#e67e22";
          break;
        case "alarmed":
          attr = "color:#D91E18";
          break;
        case "alert":
          attr = "color:#e67e22";
          break;
        case "record":
          attr = "color:#26A65B";
          break;
      }

      return attr;
    };

    function findNext(key, obj) {

      // console.log (" key is: "+ key);
      // console.log ("array is " + JSON.stringify (obj));
      var keys = Object.keys(obj);

      var len = keys.length;
      var curindex = keys.indexOf(key);
      var modulus = (curindex + 1) % len;

      //console.log ("*********** len="+len+" curr="+curindex+" next="+modulus);

      //console.log ("Keys array "+ JSON.stringify(keys));

      //console.log ("Current index: "+ keys.indexOf(key) );
      //console.log ("returning index of " + (keys.indexOf(key) + 1) % (keys.length));
      // console.log ("keys length is "+ keys.length);
      return keys[modulus];

      /*
       var size = Object.keys(obj).length;
       var i;
       for (i=0; i<size; i++) {
          if (Object.keys(obj)[i] == key)
          break;
       }
       i = (i + 1) % size;
       return Object.keys(obj)[i];
       */
    }

    //----------------------------------------------
    // cycle profiles
    //-----------------------------------------------

    function cycleMontageProfiles() {
      var ld = NVR.getLogin();

      if (!ld.cycleMontageProfiles) {
        // NVR.debug ("cycling disabled");
        return;
      }

      if ($scope.reOrderActive) {
        NVR.debug("not cycling, re-order in progress");
        return;
      }

      if ($scope.isDragabillyOn) {
        NVR.debug("not cycling, edit in progress");
        return;
      }

      var nextProfile = findNext(ld.currentMontageProfile, ld.packeryPositionsArray);

      if (nextProfile == ld.currentMontageProfile) {
        NVR.debug("Not cycling profiles, looks like you only have one");
      } else {
        NVR.debug("Cycling profile from: " + ld.currentMontageProfile + " to:" + nextProfile);
        switchMontageProfile(nextProfile);
      }
    }

    $scope.humanizeTime = function(str) {
      //console.log ("Time:"+str+" TO LOCAL " + moment(str).local().toString());
      //if (NVR.getLogin().useLocalTimeZone)
      return moment.tz(str, NVR.getTimeZoneNow()).fromNow();
      // else
      //  return moment(str).fromNow();
    };

    function getEventStatus(monitor, showMontageSidebars) {
      ld = NVR.getLogin();

      //  https:///zm/api/events/index/MonitorId=:2.json?sort=StartTime&direction=desc&limit=1

      var apiurl = ld.apiurl +'/events/index'; // we need some interval or it errors
      apiurl += "/"+"MonitorId =:" + monitor.Monitor.Id;
      if (monitor.Monitor.Id in ld.lastEventCheckTimes) {
        // now is server TZ time
        var now = ld.lastEventCheckTimes[monitor.Monitor.Id];
        apiurl += "/StartTime >:" + now;
      }

      if (ld.enableAlarmCount && ld.minAlarmCount)
        apiurl += "/"+"AlarmFrames >=:" + ld.minAlarmCount;
      if (ld.objectDetectionFilter) {
        apiurl +='/'+'Notes REGEXP:detected:';
      }

      /*if ( !(monitor.Monitor.Id in ld.lastEventCheckTimes)) {
            apiurl+= '/1 month';
            NVR.debug ("No last time found for monitor:"+monitor.Monitor.Id+" assuming 1 month" )
        } else {
            var now = new moment();
            var dur = moment.duration(now.diff(ld.lastEventCheckTimes[monitor.Monitor.Id]));
            var interval = Math.floor(dur.asHours()) + moment.utc(dur.asMilliseconds()).format("-mm-ss");
            NVR.debug ("Monitor "+monitor.Monitor.Id+" was last accessed "+interval+" ago");

            apiurl += '/\'' + interval + '\' HOUR_SECOND';
        }*/

      apiurl  += '.json?sort=StartTime&direction=desc&limit=1'+$rootScope.authSession;

      //NVR.debug ("Getting event count ");
      $http.get(apiurl)
        .then (function (data) {
          // console.log ("EVENTS GOT: "+JSON.stringify(data));
          var res = data.data;
          var mid = monitor.Monitor.Id;
          if (!res || !res.events) res = undefined;
          else if (res.events.length == 0) res = undefined;

          monitor.Monitor.lastEvent = res;

          if (monitor.Monitor.lastEvent) {
            var notes = res.events[0].Event.Notes;
            if (notes.indexOf('detected:') != -1) {
              monitor.Monitor.lastEvent.object = true;
            } else {
              monitor.Monitor.lastEvent.object = false;
            }
          }

          if (monitor.Monitor.lastEvent && showMontageSidebars) {
            if (ld.objectDetectionFilter) {
              if (monitor.Monitor.lastEvent.object)  {
                monitor.Monitor.showSidebar = true;
              }
            } else {
              monitor.Monitor.showSidebar = true;
            }
          }
        },
          function (err) {
            NVR.debug ("event status load failed: "+JSON.stringify(err));
          });
    }

    function loadEventStatus(showMontageSidebars) {
      // console.log ("LOADING EVENT STATUS");

      if (!NVR.getLogin().enableMontageOverlays) {
        //NVR.debug ("not loading events, as overlay is off");
        return;
      }

      for (var i = 0; i < $scope.MontageMonitors.length; i++) {
        if ($scope.MontageMonitors[i].Monitor.Enabled == 0 ||
          $scope.MontageMonitors[i].Monitor.listDisplay == 'noshow' ||
          $scope.MontageMonitors[i].Monitor.Function == 'None') continue;
        getEventStatus($scope.MontageMonitors[i], showMontageSidebars);
      }
    }

    //-----------------------------------------------------------------------
    // cycle through all displayed monitors and check alarm status
    //-----------------------------------------------------------------------

    function loadAlarmStatus() {
      return; // lets focus on eventDetails now. Apr 2019
      /*
      if ((NVR.versionCompare($rootScope.apiVersion, "1.30") == -1) ||
        (NVR.getBandwidth() == 'lowbw') ||
        (NVR.getLogin().disableAlarmCheckMontage == true)) {

    // console.log ("NOT DOING ALARMS");
        return;
      }

      for (var i = 0; i < $scope.MontageMonitors.length; i++) {
        if (($scope.MontageMonitors[i].Monitor.Function == 'None') ||
          ($scope.MontageMonitors[i].Monitor.listDisplay == 'noshow')) {
          continue;
        }
        getAlarmStatus($scope.MontageMonitors[i]);

      }*/

  }

    //-----------------------------------------------------------------------
    // get alarm status over HTTP for a single monitor
    //-----------------------------------------------------------------------
    function getAlarmStatus(monitor) {
      var apiurl = NVR.getLogin().apiurl;
      //console.log ("ALARM CALLED WITH " +JSON.stringify(monitor));

      var alarmurl = apiurl + "/monitors/alarm/id:" + monitor.Monitor.Id + "/command:status.json?"+$rootScope.authSession;
      //  console.log("Alarm Check: Invoking " + alarmurl);

      $http.get(alarmurl)
        .then(function (data) {
          //  NVR.debug ("Success in monitor alarmed status " + JSON.stringify(data));

          var sid = parseInt(data.data.status);
          switch (sid) {
            case 0: // idle
              monitor.Monitor.alarmState = 'rgba(0,0,0,0)';
              break;
            case 1: // pre alarm
              monitor.Monitor.alarmState = '#e67e22';
              break;
            case 2: // alarm
              monitor.Monitor.alarmState = '#D91E18';
              break;
            case 3: // alert
              monitor.Monitor.alarmState = '#e67e22';
              break;
            case 4:
              monitor.Monitor.alarmState = '#26A65B';
              break;
          }
        },
          function (error) {
            monitor.Monitor.alarmState = 'rgba(0,0,0,0)';
            NVR.debug("Error in monitor alarmed status ");
          });
    }

    function randEachTime() {
      randToAvoidCacheMem = new Date().getTime();

      //$scope.randToAvoidCacheMem =  "1";
      //console.log ("Generating:"+$scope.randToAvoidCacheMem);
    }

    //-----------------------------------------------------------------------
    // re-compute rand so snapshot in montage reloads
    //-----------------------------------------------------------------------

    function loadNotifications() {

      if ($scope.iconTimeNow == 'local')
        $scope.timeNow = moment().format(NVR.getTimeFormatSec());
      else
        $scope.timeNow = moment().tz(NVR.getTimeZoneNow()).format(NVR.getTimeFormatSec());

      if (simulStreaming) {
        // console.log ("Skipping timer as simulStreaming");
        return;
      }

      randEachTime();
      //console.log ($scope.randToAvoidCacheMem);

      if ($scope.areImagesLoading) {
        NVR.debug("skipping image refresh, packery is still loading");
        return;
      }

      //if (pckry && !$scope.isDragabillyOn) pckry.shiftLayout();
      $rootScope.rand = Math.floor((Math.random() * 100000) + 1);

      // if you see the time move, montage should move

      //$scope.timeNow = moment().format(NVR.getTimeFormatSec());

      //console.log ("Inside Montage timer...");
    }

    $scope.cancelReorder = function () {
      $scope.modal.remove();
      ld.packeryPositions = JSON.stringify(beforeReorderPositions);
      //ld.currentMontageProfile='';
      NVR.debug('Updating positions:'+JSON.stringify(ld.packeryPositions));
      //ld.currentMontageProfile = "__reorder__";
      //$scope.currentProfileName = $translate.instant('kMontage');
      $timeout(function() {
        finishReorder(false, true);
      },300);
    };

    $scope.saveReorder = function() {
      NVR.debug("Saving monitor hide/unhide");

      $scope.currentZMGroupName='';
      var ld = NVR.getLogin();
      ld.currentZMGroupName = '';
      //ld.packeryPositions = undefined;
      // NVR.debug("clearing positions");

      NVR.setLogin(ld);
      $scope.modal.remove();
      $scope.MontageMonitors = $scope.copyMontage;
      NVR.setMonitors($scope.MontageMonitors);
      // let's wait for the changes to reflect in DOM
      $timeout(function() {
        var x = 0;
        for (var i=0; i < $scope.MontageMonitors.length; i++) {
          var display= $scope.MontageMonitors[i].Monitor.listDisplay;
          var id=$scope.MontageMonitors[i].Monitor.Id;
          var found = false;
          for (var j=0; j < beforeReorderPositions.length; j++) {
            beforeReorderPositions[j].x = x;
            beforeReorderPositions[j].y = 0;
            beforeReorderPositions[j].size = '50';

            x = (x==0)?0.5:0;
            if (beforeReorderPositions[j].attr == id) {
              beforeReorderPositions[j].display = display;
              found = true;
              break;
            }
          } // before reorder array
          if (!found) {
            beforeReorderPositions.push({'x':x, 'y':0, size:'50', 'display':display});
            x = (x==0)?0.5:0;
          }
        } // montage monitors

        ld.packeryPositions = JSON.stringify(beforeReorderPositions);
        ld.currentMontageProfile='';
        NVR.debug ('Updating positions:'+JSON.stringify(ld.packeryPositions));
        ld.currentMontageProfile = "__reorder__";
        $scope.currentProfileName = $translate.instant('kMontage');
        $timeout ( function () {
          NVR.setLogin(ld)
            .then (function() {
              finishReorder(false);
            });
        },100);
      },300);
    }; // function $scope.saveReorder

    function finishReorder(match_reorder, no_init_packery) {
      currentStreamState = simulStreaming? streamState.ACTIVE: streamState.SNAPSHOT;

      //console.log ("AFTER REORDER="+JSON.stringify(beforeReorderPositions));

      for (var i = 0; i < $scope.MontageMonitors.length; i++) {
        $scope.MontageMonitors[i].Monitor.connKey = NVR.regenConnKeys($scope.MontageMonitors[i]);
      }

      if (match_reorder) {
        var ps = NVR.getLogin().packeryPositions;
        var p = parsePositions(ps);
        matchMonitorsToPositions(p);
      } else {
        NVR.debug ('Not calling matchReorder');
      }

      if (!no_init_packery) { initPackery(); }
      // ld.packeryPositions = JSON.stringify(beforeReorderPositions);
    }

    $scope.reorderFrame = function(item) {
      var frame = item.Monitor.streamingURL + "/nph-zms?mode=single&scale=50&monitor=" + item.Monitor.Id;

      frame += $rootScope.authSession;
      frame += NVR.insertSpecialTokens();
      return frame;
    };

    $scope.isCycleOn = function() {
      return NVR.getLogin().cycleMontageProfiles;
    };

    $scope.getCycleStatus = function () {
      var c = NVR.getLogin().cycleMontageProfiles;
      return c ? $translate.instant('kOn') : $translate.instant('kOff');
    };

    $scope.toggleCycle = function() {
      var ld = NVR.getLogin();
      ld.cycleMontageProfiles = !ld.cycleMontageProfiles;
      NVR.setLogin(ld);
      NVR.debug("cycle=" + ld.cycleMontageProfiles);
      NVR.debug("cycle interval=" + ld.cycleMontageInterval);
    };

    $scope.toggleHide = function(i) {
      if ($scope.copyMontage[i].Monitor.listDisplay == 'show') {
        $scope.copyMontage[i].Monitor.listDisplay = 'noshow';
      } else if ($scope.copyMontage[i].Monitor.listDisplay == 'noshow') {
        $scope.copyMontage[i].Monitor.listDisplay = 'show';
      }
      NVR.debug("index " + i + " is now " + $scope.copyMontage[i].Monitor.listDisplay);
    };

    $scope.hideUnhide = function() {
      if ($scope.isDragabillyOn) {
        dragToggle();
      }
      // make a copy of the current list and work on that
      // this is to avoid packery screw ups while you are hiding/unhiding

      $scope.copyMontage = angular.copy($scope.MontageMonitors);
      beforeReorderPositions = pckry.getShiftPositions('data-item-id');
      //console.log ("BEFORE REORDER="+JSON.stringify(beforeReorderPositions));

      if (simulStreaming) {
        NVR.debug("Killing all streams in montage to save memory/nw...");
        currentStreamState = streamState.STOPPED;
        NVR.stopNetwork("", true)
          .then(function (succ) {
            for (var i = 0; i < $scope.MontageMonitors.length; i++) {
              if ($scope.MontageMonitors[i].Monitor.listDisplay == 'show')
                NVR.killLiveStream(
                  $scope.MontageMonitors[i].Monitor.connKey,
                  $scope.MontageMonitors[i].Monitor.controlURL);
            }
            // in context of timeout

            $scope.reorder = {
              selected:false
            };

            $ionicModal.fromTemplateUrl('templates/reorder-modal.html', {
              scope: $scope,
              animation: 'slide-in-up',
              id: 'reorder',
            })
              .then(function (modal) {
                $scope.modal = modal;
                $scope.reOrderActive = true;
                $scope.modal.show();
                $scope.reorder = {
                  selected:false
                };
              });
          });
      } else {
        $scope.reorder = {
          selected:false
        };
        $ionicModal.fromTemplateUrl('templates/reorder-modal.html', {
          scope: $scope,
          animation: 'slide-in-up',
          id: 'reorder',
        })
          .then(function (modal) {
            $scope.modal = modal;
            $scope.reOrderActive = true;
            $scope.modal.show();
          });
      }
    };

    $scope.selectZMGroup = function() {
      $scope.tempZMGroups = [];
      var ld = NVR.getLogin();

      // ICON FIXME I don't understand this next line.
      if (ld.currentMontageProfile != $translate.instant('kMontageDefaultProfile') && ld.currentMontageProfile) {
        $rootScope.zmPopup = $ionicPopup.alert({
          title: $translate.instant('kError'),
          template: $translate.instant('kErrorZMGroupMontageProfile') + $translate.instant('kMontageDefaultProfile'),
        });
        return;
      }

      for (var i=0; i < $scope.zmGroups.length; i++) {
        var val = ld.currentZMGroupNames.includes($scope.zmGroups[i])? true:false;
        $scope.tempZMGroups.push ({
          'name': $scope.zmGroups[i],
          'selection': val
        });
      }
      $scope.tempZMGroups.unshift({'name':$translate.instant('kAll'), 'selection':false});

      $rootScope.zmPopup = $ionicPopup.show({
        scope: $scope,
        template: '<ion-checkbox ng-if="item" ng-repeat="item in tempZMGroups" ng-value="item.name" ng-model="item.selection" > {{item.name}} </ion-checkbox>',

        title: $translate.instant('kSelect'),
        subTitle: $translate.instant('kActive') + ': '+ NVR.getLogin().currentZMGroupNames,

        buttons: [{
          text: $translate.instant('kButtonCancel'),
          onTap: function (e) {
          }
        },
          {
            text: $translate.instant('kButtonOk'),
            onTap: function (e) {
              //NVR.log("Group selected:" + $scope.tempZMGroups);
              var ld = NVR.getLogin();
              var old_ZMGroupNames = ld.currentZMGroupNames;
              ld.currentZMGroupNames = [];
              if (!$scope.tempZMGroups[0].selection) { // All is not selected
                for (var i=1; i < $scope.tempZMGroups.length; i++) {
                  if ($scope.tempZMGroups[i].selection)
                    ld.currentZMGroupNames.push($scope.tempZMGroups[i].name);
                }
              }

              NVR.debug ("Group(s) selected:"+JSON.stringify(ld.currentZMGroupNames));
              var are_equal = ld.currentZMGroupNames.length === old_ZMGroupNames.length && 
                ld.currentZMGroupNames.sort().every(function(value, index) { return value === old_ZMGroupNames.sort()[index];});

              if (!are_equal) {
                $scope.currentZMGroupName = ld.currentZMGroupNames[0] || '';
                var ln = ld.currentZMGroupNames.length;
                if (ln > 1)
                  $scope.currentZMGroupName = $scope.currentZMGroupName + '+'+(ln-1);
                ld.currentZMGroupName = $scope.currentZMGroupName;
                NVR.setLogin(ld);

                if (simulStreaming) currentStreamState = streamState.STOPPED;
                for (var iz = 0; iz < $scope.MontageMonitors.length; iz++) {
                  if ($scope.MontageMonitors[iz].Monitor.listDisplay == 'show' && simulStreaming)
                    NVR.killLiveStream(
                      $scope.MontageMonitors[iz].Monitor.connKey,
                      $scope.MontageMonitors[iz].Monitor.controlURL);

                  // if length of selected groups is 0 then show all
                  var isShow = ln ? false : true;
                  if (ln) {
                    for (var k=0; k < $scope.MontageMonitors[iz].Monitor.Group.length; k++) {
                      if (ld.currentZMGroupNames.includes($scope.MontageMonitors[iz].Monitor.Group[k].name)) {
                        isShow = true;
                        break;
                      }
                    }
                  }

                  $scope.MontageMonitors[iz].Monitor.listDisplay = isShow? 'show':'noshow';
                  NVR.debug ('Group:'+$scope.currentZMGroupName+' setting '+$scope.MontageMonitors[iz].Monitor.Name +' to '+ $scope.MontageMonitors[iz].Monitor.listDisplay);
                }
                $scope.monitors = $scope.MontageMonitors;
                NVR.setMonitors($scope.MontageMonitors);
                ld.packeryPositions = undefined;
                NVR.setLogin(ld)
                  .then (function() {
                    var ps = NVR.getLogin().packeryPositions;
                    //var p = parsePositions(ps);
                    //matchMonitorsToPositions(p);
                    initPackery().then (function () {
                      NVR.debug ("initPackery over, storing positions");
                      var positions = pckry.getShiftPositions('data-item-id');
                      var ld = NVR.getLogin();

                      ld.packeryPositions = JSON.stringify(positions);
                      NVR.setLogin(ld);

                    });
                  });

                $timeout(function () {
                  beforeReorderPositions = pckry.getShiftPositions('data-item-id');
                  finishReorder();
                },300);
              } else {
                NVR.debug ("No action taken as selection is same as current");
              }
            }
          }
        ]
      });
    };

    $scope.selectUnselectAllToggleReorder = function () {
      $scope.reorder.selected = !$scope.reorder.selected;

      for (var i=0; i < $scope.copyMontage.length; i++) {
        $scope.copyMontage[i].Monitor.listDisplay = $scope.reorder.selected ? 'show' : 'noshow';
      }
    };

    $scope.$on('modal.removed', function (e, m) {
      if (m.id != 'reorder')
        return;
      $scope.reOrderActive = false;

      //console.log ("************** FOOTAGE CLOSED");
    });

    /*
        $scope.closeReorderModal = function () {

            $scope.modal.remove();

        };
        */

    //----------------------------------------------------------------
    // Alarm emit handling
    //----------------------------------------------------------------
    var al = $scope.$on("alarm", function (event, args) {
      // FIXME: I should probably unregister this instead
      if (typeof $scope.monitors === undefined)
        return;
      //console.log ("***EVENT TRAP***");
      var alarmMonitors = args.message;
      for (var i = 0; i < alarmMonitors.length; i++) {
        //console.log ("**** TRAPPED EVENT: "+alarmMonitors[i]);

        for (var j = 0; j < $scope.MontageMonitors.length; j++) {
          if ($scope.MontageMonitors[j].Monitor.Id == alarmMonitors[i]) {
            NVR.debug("Enabling alarm for Monitor:" + $scope.monitors[j].Monitor.Id);
            $scope.MontageMonitors[j].Monitor.isAlarmed = true;
            scheduleRemoveFlash(j);
          }
        }
      }
    });

    broadcastHandles.push(al);

    function scheduleRemoveFlash(id) {
      NVR.debug("Scheduled a " + zm.alarmFlashTimer + "ms timer for dis-alarming monitor ID:" + $scope.MontageMonitors[id].Monitor.Id);
      $timeout(function () {
        $scope.MontageMonitors[id].Monitor.isAlarmed = false;
        NVR.debug("dis-alarming monitor ID:" + $scope.MontageMonitors[id].Monitor.Id);
      }, zm.alarmFlashTimer);
    }

    //----------------------------------------------------------------
    // Alarm notification handling
    //----------------------------------------------------------------
    $scope.handleAlarms = function () {
      //$rootScope.isAlarm = true;
      $rootScope.isAlarm = !$rootScope.isAlarm;
      if (!$rootScope.isAlarm)
        // if (1)
      {
        $rootScope.alarmCount = "0";
        $ionicHistory.nextViewOptions({
          disableBack: true
        });
        $state.go("app.events", {
          "id": 0,
          "playEvent": false
        }
          /*,
                      {
                          reload: true
                      }*/
        );
        return;
      }
    };

    $scope.handleAlarmsWhileMinimized = function () {
      $rootScope.isAlarm = !$rootScope.isAlarm;

      $scope.minimal = !$scope.minimal;
      var ld = NVR.getLogin();
      ld.isFullScreen = $scope.minimal;
      NVR.setLogin(ld);

      NVR.debug("MontageCtrl: switch minimal is " + $scope.minimal);
      ionic.Platform.fullScreen($scope.minimal, !$scope.minimal);
      //console.log ("alarms:Cancelling timer");
      $interval.cancel(intervalHandleMontage);
      $interval.cancel(intervalHandleMontageCycle);
      $interval.cancel(intervalHandleAlarmStatus);
      $interval.cancel(intervalHandleStreamQuery);
      $interval.cancel(intervalHandleEventStatus);
      $interval.cancel(intervalHandleReloadPage);

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

    //-------------------------------------------------------------
    // this is checked to make sure we are not pulling images
    // when app is in background. This is a problem with Android,
    // for example
    //-------------------------------------------------------------

    $scope.isBackground = function () {
      //console.log ("Is background called from Montage and returned " +
      //NVR.isBackground());
      return NVR.isBackground();
    };

    //---------------------------------------------------------------------
    // Triggered when you enter/exit full screen
    //---------------------------------------------------------------------
    $scope.switchMinimal = function () {
      $scope.minimal = !$scope.minimal;
      NVR.debug("MontageCtrl: switch minimal is " + $scope.minimal);
      // console.log("Hide Statusbar");
      ionic.Platform.fullScreen($scope.minimal, !$scope.minimal);

      // hiding status bar messes up X
      /*if ($scope.minimal) {
        if ($rootScope.platformOS !='desktop') {
          NVR.debug ('hiding device status bar');
          return StatusBar.hide();
        }
      } else {
        if ($rootScope.platformOS !='desktop') {
          NVR.debug ('showing device status bar');
          return StatusBar.show();
        }
      }*/

      //console.log ("minimal switch:Cancelling timer");
      $interval.cancel(intervalHandleMontage); //we will renew on reload
      $interval.cancel(intervalHandleMontageCycle);
      $interval.cancel(intervalHandleAlarmStatus);
      $interval.cancel(intervalHandleStreamQuery);
      $interval.cancel(intervalHandleEventStatus);
      $interval.cancel(intervalHandleReloadPage);

      var ld = NVR.getLogin();
      ld.isFullScreen = $scope.minimal;
      NVR.setLogin(ld);

      // We are reloading this view, so we don't want entry animations
      $ionicHistory.nextViewOptions({
        disableAnimate: true,
        disableBack: true
      });

      $state.go('app.refresh', {
        "view": 'app.montage'
      });

      /*  $state.go("app.montage", {
          minimal: $scope.minimal,
          isRefresh: true
        });*/
      return;
    };

    //---------------------------------------------------------------------
    // Show/Hide PTZ control in monitor view
    //---------------------------------------------------------------------
    $scope.togglePTZ = function () {
      $scope.showPTZ = !$scope.showPTZ;
    };

    function getIndex(mid) {
      var ndx = 0;
      for (var i = 0; i < $scope.MontageMonitors.length; i++) {
        if ($scope.MontageMonitors[i].Monitor.Id == mid) {
          ndx = i;
          break;
        }
      }
      return ndx;
    }

    $scope.toggleStamp = function () {
      if (!$scope.isDragabillyOn) return;
      var found = false;

      for (var i = 0; i < $scope.MontageMonitors.length; i++) {
        if ($scope.MontageMonitors[i].Monitor.selectStyle == 'dragborder-selected') {
          findPackeryElement(i);
        }
      }

      function findPackeryElement(i) {
        pckry.getItemElements().forEach(function (elem) {

          var id = elem.getAttribute("data-item-id");
          if (id == $scope.MontageMonitors[i].Monitor.Id) {
            if ($scope.MontageMonitors[i].Monitor.isStamp)
              pckry.unstamp(elem);
            else
              pckry.stamp(elem);

            $scope.MontageMonitors[i].Monitor.isStamp = !$scope.MontageMonitors[i].Monitor.isStamp;
            NVR.debug("Stamp for " + $scope.MontageMonitors[i].Monitor.Name + " is:" + $scope.MontageMonitors[i].Monitor.isStamp);
            //break;
          }
        });
      }
    };

    $scope.hideMonitor = function (mid) {
      if (!$scope.isDragabillyOn) return;
      var found = false;
      for (var i = 0; i < $scope.MontageMonitors.length; i++) {
        if ($scope.MontageMonitors[i].Monitor.selectStyle == 'dragborder-selected') {
          $scope.MontageMonitors[i].Monitor.listDisplay = 'noshow';
          $scope.MontageMonitors[i].Monitor.selectStyle = "";
          found = true;
        }
      }
      if (found) {
        pckry.once('layoutComplete', saveUpdatedLayout);
        $timeout(function () {
          pckry.shiftLayout();
        }, 300);
      }

      function saveUpdatedLayout() {
        $timeout(function () {
          var positions = pckry.getShiftPositions('data-item-id');
          //console.log("SAVING");
          var ld = NVR.getLogin();

          ld.packeryPositions = JSON.stringify(positions);
          //console.log ("Saving " + ld.packeryPositions);
          ld.currentMontageProfile = "";
          $scope.currentProfileName = $translate.instant('kMontage');
          NVR.setLogin(ld);
          $ionicLoading.hide();
          //$scope.sliderChanging = false;
        }, 20);
      }
    };

    $scope.toggleSelectItem = function(mid) {
      var ndx = getIndex(mid);
      //console.log ("TOGGLE DETECTED AT INDEX:"+ndx+" NAME="+$scope.MontageMonitors[ndx].Monitor.Name);
      if ($scope.MontageMonitors[ndx].Monitor.selectStyle !== "undefined" && $scope.MontageMonitors[ndx].Monitor.selectStyle == "dragborder-selected") {
        $scope.MontageMonitors[ndx].Monitor.selectStyle = "";
      } else {
        $scope.MontageMonitors[ndx].Monitor.selectStyle = "dragborder-selected";
      }
      //console.log ("Switched value to " + $scope.MontageMonitors[ndx] .Monitor.selectStyle);
    };

    //---------------------------------------------------------------------
    // Called when you enable/disable dragging
    //---------------------------------------------------------------------

    $scope.dragToggle = function () {
      dragToggle();
    };

    function dragToggle() {
      var i;
      $scope.isDragabillyOn = !$scope.isDragabillyOn;
      //currentStreamState  = $scope.isDragabillyOn? streamState.STOPPED:streamState.ACTIVE;

      for (i = 0; i < $scope.MontageMonitors.length; i++) {
        $scope.MontageMonitors[i].Monitor.isStamp = false;
      }

      $ionicSideMenuDelegate.canDragContent($scope.isDragabillyOn ? false : true);

      //$timeout(function(){pckry.reloadItems();},10);
      NVR.debug("setting dragabilly to " + $scope.isDragabillyOn);
      if ($scope.isDragabillyOn) {
        $scope.toggleSubMenu = true;

        $scope.dragBorder = "dragborder";
        NVR.debug("Enabling drag for " + draggies.length + " items");
        for (i = 0; i < draggies.length; i++) {
          draggies[i].enable();
          draggies[i].bindHandles();
        }

        // reflow and reload as some may be hidden
        //  $timeout(function(){pckry.reloadItems();$timeout(function(){pckry.layout();},300);},100);
      } else {
        $scope.dragBorder = "";
        NVR.debug("Disabling drag for " + draggies.length + " items");
        for (i = 0; i < draggies.length; i++) {
          draggies[i].disable();
          draggies[i].unbindHandles();
        }
        for (i = 0; i < $scope.MontageMonitors.length; i++) {
          $scope.MontageMonitors[i].Monitor.selectStyle = "";
        }
        // reflow and reload as some may be hidden
        $timeout(function () {
          $timeout(function () {
            var positions = pckry.getShiftPositions('data-item-id');
            //console.log ("POSITIONS MAP " + JSON.stringify(positions));
            var ld = NVR.getLogin();
            ld.packeryPositions = JSON.stringify(positions);
            //console.log ("Saving " + ld.packeryPositions);
            ld.currentMontageProfile = "";
            $scope.currentProfileName = $translate.instant('kMontage');
            NVR.setLogin(ld);
          }, 300);
        }, 100);
      }
    }

    //---------------------------------------------------------------------
    // main monitor modal open - if drag is not on, this is called on touch
    //---------------------------------------------------------------------

    $scope.openModal = function (mid, controllable, controlid, connKey, monitor) {
      $timeout(function () { // after render
        if (simulStreaming) {
          NVR.debug("Killing all streams in montage to save memory/nw...");
          currentStreamState = streamState.STOPPED;
          NVR.stopNetwork("",true)
            .then(function (succ) {
              for (var i = 0; i < $scope.MontageMonitors.length; i++) {
                if ($scope.MontageMonitors[i].Monitor.listDisplay == 'show')
                  NVR.killLiveStream(
                    $scope.MontageMonitors[i].Monitor.connKey,
                    $scope.MontageMonitors[i].Monitor.controlURL);
              }
            });
        }
        $scope.controlURL = monitor.Monitor.controlURL;
        openModal(mid, controllable, controlid, connKey, monitor);
      });
    };

    function openModal(mid, controllable, controlid, connKey, monitor) {
      $scope.singleMonitorModalOpen = true;
      NVR.debug("MontageCtrl: Open Monitor Modal with monitor Id=" + mid + " and Controllable:" + controllable + " with control ID:" + controlid);
      // $scope.isModalActive = true;
      // Note: no need to setAwake(true) as its already awake
      // in montage view

      NVR.log("Cancelling montage timer, opening Modal");
      // NVR.log("Starting Modal timer");
      //console.log ("openModal:Cancelling timer");
      $interval.cancel(intervalHandleMontage);
      $interval.cancel(intervalHandleMontageCycle);
      $interval.cancel(intervalHandleAlarmStatus);
      $interval.cancel(intervalHandleStreamQuery);
      $interval.cancel(intervalHandleEventStatus);
      $interval.cancel(intervalHandleReloadPage);

      $scope.monitor = monitor;
      $scope.showPTZ = false;
      $scope.monitorId = mid;
      $scope.monitorName = NVR.getMonitorName(mid);
      $scope.controlid = controlid;

      //$scope.LoginData = NVR.getLogin();
      $rootScope.modalRand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;

      $scope.ptzMoveCommand = "";
      $scope.ptzStopCommand = "";

      $scope.zoomInCommand = "";
      $scope.zoomOutCommand = "";
      $scope.zoomStopCommand = "zoomStop";
      $scope.canZoom = false;

      $scope.presetOn = false;
      $scope.isControllable = controllable;
      $scope.refMonitor = monitor;

      // This is a modal to show the monitor footage
      // We need to switch to always awake if set so the feed doesn't get interrupted
      NVR.setAwake(NVR.getKeepAwake());

      // This is a modal to show the monitor footage
      $ionicModal.fromTemplateUrl('templates/monitors-modal.html', {
        scope: $scope,
        animation: 'slide-in-up',
        id: 'monitorsmodal'
      })
        .then(function (modal) {
          $scope.modal = modal;

          /* $ionicLoading.show(
           {
               template: $translate.instant('kPleaseWait'),
               noBackdrop: true,
               duration: zm.loadingTimeout
           });*/

          // we don't really need this as we have stopped the timer
          // $scope.isModalActive = true;

          //$timeout (function() {pckry.shiftLayout();},zm.packeryTimer);
          $scope.modal.show();
        });
    }

    //---------------------------------------------------------------------
    // This is ONLY called when we exit modal to montage
    //---------------------------------------------------------------------

    function cleanupOnCloseModal() {
      if (simulStreaming){
        randEachTime();
        NVR.debug('rand each time:'+randToAvoidCacheMem);
      }

      NVR.log("Restarting montage timers...");
      var ld = NVR.getLogin();
      // console.log ("closeModal: Cancelling timer");
      $interval.cancel(intervalHandleMontage);
      $interval.cancel(intervalHandleAlarmStatus);
      $interval.cancel(intervalHandleStreamQuery);
      $interval.cancel(intervalHandleEventStatus);
      $interval.cancel(intervalHandleMontageCycle);
      $interval.cancel(intervalHandleReloadPage);

      intervalHandleMontage = $interval(function () {
        loadNotifications();
        //  console.log ("Refreshing Image...");
      }.bind(this), refreshSec * 1000);

      intervalHandleAlarmStatus = $interval(function () {
        loadAlarmStatus();
        //  console.log ("Refreshing Image...");
      }.bind(this), zm.alarmStatusTime);

      if (simulStreaming){
        intervalHandleStreamQuery = $interval(function () {
          loadStreamQueryStatus();
          //console.log ("Restarting Query Timer...");
        }.bind(this), streamQueryTimer);
      }

      loadEventStatus(ld.showMontageSidebars);
      intervalHandleEventStatus = $interval(function () {
        loadEventStatus();
        //  console.log ("Refreshing Image...");
      }.bind(this), zm.eventCheckTime);

      intervalHandleMontageCycle = $interval(function () {
        cycleMontageProfiles();
        //  console.log ("Refreshing Image...");
      }.bind(this), 5000);

      intervalHandleReloadPage = $interval(function () {
        forceReloadPage();
      }.bind(this), reloadPage);

      $scope.isModalStreamPaused = true;
      // let modal go to snapshot mode in render
      $timeout(function () {
        $scope.modal.remove();
      });

      // We now need to regen connkeys
      // once regenerated
      if (simulStreaming) {
        currentStreamState = streamState.ACTIVE;
        NVR.debug ('Regenerating connkeys so old kills wont affect');
        for (var i = 0; i < $scope.MontageMonitors.length; i++) {
          $scope.MontageMonitors[i].Monitor.connKey = NVR.regenConnKeys($scope.MontageMonitors[i]);
        }
      }
    }

    // for some reason, double tap calls this twice
    $scope.closeModal = function () {
      NVR.debug("MontageCtrl: Close & Destroy Monitor Modal");

      if ($scope.singleMonitorModalOpen) {
        $scope.singleMonitorModalOpen = false;
        cleanupOnCloseModal();
      } else if ($scope.eventModalOpen) {
        $scope.eventModalOpen = false;
        NVR.debug ("event just played, need to force reload");
        forceReloadPage();
      } else {
        NVR.debug("Ignoring double-invocation");
      }

      // $scope.isModalActive = false;
      // Note: no need to setAwake(false) as needs to be awake
      // in montage view
    };

    //---------------------------------------------------------------------
    // In Android, the app runs full steam while in background mode
    // while in iOS it gets suspended unless you ask for specific resources
    // So while this view, we DON'T want Android to keep sending 1 second
    // refreshes to the server for images we are not seeing
    //---------------------------------------------------------------------

    function viewCleanup() {
      currentStreamState = streamState.STOPPED;
      if (viewCleaned) {
        NVR.debug("Montage View Cleanup was already done, skipping");
        return;
      }
      $interval.cancel(intervalHandleMontage);
      $interval.cancel(intervalHandleMontageCycle);
      $interval.cancel(intervalHandleAlarmStatus);
      $interval.cancel(intervalHandleStreamQuery);
      $interval.cancel(intervalHandleEventStatus);
      $interval.cancel(intervalHandleReloadPage);
      if (pckry) pckry.destroy();

      broadcastHandles = [];

      $timeout(function () {
        if (!$scope.singleMonitorModalOpen && simulStreaming) {
          NVR.debug("Killing all streams in montage to save memory/nw...");

          for (var i = 0; i < $scope.MontageMonitors.length; i++) {
            if ($scope.MontageMonitors[i].Monitor.listDisplay == 'show')
              NVR.killLiveStream(
                $scope.MontageMonitors[i].Monitor.connKey,
                $scope.MontageMonitors[i].Monitor.controlURL);
          }
        }
      });
    }

    function onPause() {
      NVR.debug("MontageCtrl: onpause called");
      viewCleanup();
      viewCleaned = true;
    }

    function onResume() {
      NVR.debug ("resume called, hard refreshing monitor lists just to make sure...");
      NVR.getMonitors(1);
      // we should be going to portal login so no need here
      //NVR.debug ("Montage resume called, regenerating all connkeys");
      //NVR.regenConnKeys();
      // $scope.MontageMonitors = NVR.getMonitorsNow();
    }

    $scope.openMenu = function () {
      $timeout(function () {
        $rootScope.stateofSlide = $ionicSideMenuDelegate.isOpen();
      }, 500);

      $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.$on('$destroy', function () {});

    $scope.$on('$ionicView.loaded', function () {
      //  console.log("**VIEW ** Montage Ctrl Loaded");
    });

    $scope.$on('$ionicView.leave', function () {
      // console.log("**VIEW ** Montage Ctrl Left, force removing modal");
      if ($rootScope.platformOS == 'android') {
        NVR.debug("Deregistering handlers for multi-window");
        window.MultiWindowPlugin.deregisterOnStop("montage-pause");
      } else {
        document.removeEventListener("pause", onPause, false);
      }

      if ($scope.modal) $scope.modal.remove();
    });

    // remove a saved montage profile
    $scope.deleteMontageProfile = function () {
      var posArray;

      try {
        posArray = NVR.getLogin().packeryPositionsArray;
        //console.log ("PA="+JSON.stringify(posArray));
      } catch (e) {
        NVR.debug("error parsing packery array positions");
        posArray = {};
      }

      //console.log ("posArray="+JSON.stringify(posArray));

      $scope.listdata = [];
      for (var key in posArray) {
        if (posArray.hasOwnProperty(key)) {
          $scope.listdata.push(key);
        }
      }

      if (!$scope.listdata.length) {
        $rootScope.zmPopup = $ionicPopup.alert({
          title: $translate.instant('kError'),
          template: $translate.instant('kMontageNoSavedProfiles'),
          okText: $translate.instant('kButtonOk'),
          cancelText: $translate.instant('kButtonCancel'),
        });
        return;
      }

      $scope.data = {
        'selectedVal': ''
      };

      $rootScope.zmPopup = SecuredPopups.show('confirm', {
        template: `
          <ion-list>
            <ion-radio-fix ng-repeat="item in listdata" ng-value="item" ng-model="data.selectedVal">
              {{item}}
            </ion-item> 
          </ion-list>`,

        title: $translate.instant('kSelect'),
        subTitle: $translate.instant('kSelectDelete'),
        scope: $scope,
        okText: $translate.instant('kButtonOk'),
        cancelText: $translate.instant('kButtonCancel'),
      }).then(function (res) {
        NVR.debug("Deleting profile: " + $scope.data.selectedVal);
        delete posArray[$scope.data.selectedVal];
        var ld = NVR.getLogin();
        ld.packeryPositionsArray = posArray;

        if (ld.currentMontageProfile == $scope.data.selectedVal) {
          ld.currentMontageProfile = "";
          $scope.currentProfileName = $translate.instant('kMontage');
        }

        if ($scope.currentMontageProfile == $scope.data.selectedVal)
          $scope.currentProfileName = $translate.instant('kMontage');

        NVR.setLogin(ld);
      });
    };

    function switchMontageProfile(mName) {
      $interval.cancel(intervalHandleMontageCycle);
      intervalHandleMontageCycle = $interval(function () {
        cycleMontageProfiles();
        //  console.log ("Refreshing Image...");
      }.bind(this), NVR.getLogin().cycleMontageInterval * 1000);

      var ld = NVR.getLogin();
      ld.packeryPositions = ld.packeryPositionsArray[mName];
      ld.currentMontageProfile = mName;
      $scope.currentProfileName = mName || $translate.instant('kMontage');
      console.log ("NEW POS="+ld.packeryPositions);
      var positionsStr = ld.packeryPositions;
      var positions;

      if (positionsStr == '' || positionsStr == undefined) {
        NVR.debug ('No positions stored');
        positions = undefined;
        positionsStr = undefined;
      } else {
        positions = parsePositions(positionsStr);
        matchMonitorsToPositions(positions);
      }

      NVR.setLogin(ld).then(function(data) {
        if (!ld.packeryPositions) {
          NVR.debug ("This profile doesn't seem to have been saved. Resetting it to defaults...");
          //$scope.resetSizes(true);
        }
      });

      $timeout(function () { // after render
        if (simulStreaming) {
          currentStreamState = streamState.STOPPED;
          NVR.debug("Killing all streams in montage to save memory/nw...");

          if ($rootScope.platformOS == 'ios') {
            NVR.stopNetwork();
          } else {
            for (var i = 0; i < $scope.MontageMonitors.length; i++) {
              if ($scope.MontageMonitors[i].Monitor.listDisplay == 'show')
                NVR.killLiveStream(
                  $scope.MontageMonitors[i].Monitor.connKey,
                  $scope.MontageMonitors[i].Monitor.controlURL,
                  $scope.MontageMonitors[i].Monitor.Name);
            }
          }

          // in timeout for iOS as we call stopNetwork
          $timeout(function () {
            //console.log ("SIMUL SWITCH MONTAGE CALLING REGEN");
            NVR.regenConnKeys();
            $scope.monitors = NVR.getMonitorsNow();
            var ps = NVR.getLogin().packeryPositions;

            var p = parsePositions(ps);
            matchMonitorsToPositions(p, $scope.monitors);
            $scope.MontageMonitors = angular.copy($scope.monitors);

            // console.log("BEFORE INIT PACKERY"+JSON.stringify(positions));
            /*
            for (var x=0; x < $scope.MontageMonitors.length; x++) {

              console.log ('BEFORE INITPACKERY: '+$scope.MontageMonitors[x].Monitor.Id+'==>'+$scope.MontageMonitors[x].Monitor.listDisplay);
            }*/
            //var pl = positions? positions.length : 0;

            /*
            for (var x=0; x < $scope.MontageMonitors.length; x++) {
              for (var xx = 0; xx < pl; xx++) {


                if ($scope.MontageMonitors[x].Monitor.Id == positions[xx].attr && $scope.MontageMonitors[x].Monitor.Function=='None' && positions[xx].display=='show') {
                  console.log ('BEFORE: Making MID='+$scope.MontageMonitors[x].Monitor.Id+' to blank');
                  $scope.MontageMonitors[x].Monitor.listDisplay='blank';
                  positions[xx].attr = 'blank';
                }
              }
              console.log ('BEFORE: '+$scope.MontageMonitors[x].Monitor.Id+'==>'+$scope.MontageMonitors[x].Monitor.listDisplay);
            } */

            $timeout(function () {
              var ps = NVR.getLogin().packeryPositions;
              var p = parsePositions(ps);
              matchMonitorsToPositions(p);
              initPackery();
            }, zm.packeryTimer);
          });

        } else {
          //console.log ("NOT SIMUL SWITCH MONTAGE CALLING REGEN");
          NVR.regenConnKeys();

          $scope.monitors = NVR.getMonitorsNow();
          var ps = NVR.getLogin().packeryPositions;

          var p = parsePositions(ps);
          matchMonitorsToPositions(p, $scope.monitors);
          $scope.MontageMonitors = angular.copy($scope.monitors);

          /*
          var pl = positions? positions.length : 0;
          for (var x=0; x < $scope.MontageMonitors.length; x++) {
            for (var xx = 0; xx < pl; xx++) {
              if ($scope.MontageMonitors[x].Monitor.Id == positions[xx].attr && !$scope.MontageMonitors[x].Monitor.Function=='None' && positions[xx].display=='show') {
                console.log ('BEFORE: Making MID='+$scope.MontageMonitors[x].Monitor.Id+' to blank');
                $scope.MontageMonitors[x].Monitor.listDisplay='blank';
              }
            }
            console.log ('BEFORE: '+$scope.MontageMonitors[x].Monitor.Id+'==>'+$scope.MontageMonitors[x].Monitor.listDisplay);
          }*/

          $timeout(function () {
            var ps = NVR.getLogin().packeryPositions;
            var p = parsePositions(ps);
            matchMonitorsToPositions(p);
            initPackery();
          }, zm.packeryTimer);
        }
      });
    }
    // switch to another montage profile
    $scope.switchMontageProfile = function () {
      var posArray;
      var i;
      var ld = NVR.getLogin();

      if ($scope.currentZMGroupName &&
        (ld.currentMontageProfile != $translate.instant('kMontageDefaultProfile') ||
          ld.currentMontageProfile)) {
        NVR.debug('Resetting currentZMGroupName - this is hopefully a one time thing');
        $scope.currentZMGroupName='';
        ld.currentZMGroupName='';
        ld.currentZMGroupNames = [];
        NVR.setLogin(ld);
      }

      if ($scope.currentZMGroupName) {
        $rootScope.zmPopup = $ionicPopup.alert({
          title: $translate.instant('kError'),
          template: $translate.instant('kErrorMontageProfileZMGroup'),
        });
        return;
      }

      try {
        posArray = NVR.getLogin().packeryPositionsArray;
        //console.log ("PA="+JSON.stringify(posArray));

      } catch (e) {
        NVR.debug("error parsing packery array positions");
        posArray = {};
      }

      //console.log ("posArray="+JSON.stringify(posArray));

      $scope.listdata = [];
      for (var key in posArray) {
        if (posArray.hasOwnProperty(key)) {
          $scope.listdata.push(key);
        }
      }

      if ($scope.listdata.indexOf($translate.instant('kMontageDefaultProfile')) == -1)
        $scope.listdata.push($translate.instant('kMontageDefaultProfile'));

      if (!$scope.listdata.length) {
        $rootScope.zmPopup = $ionicPopup.alert({
          title: $translate.instant('kError'),
          template: $translate.instant('kMontageNoSavedProfiles'),

        });
        return;
      }

      $scope.data = {
        'selectedVal': ''
      };

      $rootScope.zmPopup = SecuredPopups.show('confirm', {
        template:
`<ion-list>
  <ion-radio-fix ng-repeat="item in listdata" ng-value="item" ng-model="data.selectedVal">
  {{item}}
  </ion-item>
</ion-list>`,

        title: $translate.instant('kSelect'),
        subTitle: $translate.instant('kSelectSwitch'),
        scope: $scope,
        okText: $translate.instant('kButtonOk'),
        cancelText: $translate.instant('kButtonCancel'),
      }).then(function (res) {
        if (res) {
          // destroy cycle timer and redo it
          //
          switchMontageProfile($scope.data.selectedVal);
          //pckry.reloadItems();
        }
      });
    };

    // save current configuration into a profile
    $scope.saveMontageProfile = function () {
      var posArray;

      try {
        posArray = NVR.getLogin().packeryPositionsArray;
      } catch (e) {
        NVR.debug("error parsing packery array positions");
        posArray = {};
      }
      $scope.data = {
        montageName: ""
      };

      $scope.listdata = [];
      for (var key in posArray) {
        if (posArray.hasOwnProperty(key)) {
          $scope.listdata.push(key);
        }
      }
      if ($scope.listdata.indexOf($translate.instant('kMontageDefaultProfile')) == -1)
        $scope.listdata.push($translate.instant('kMontageDefaultProfile'));

      var templ = "<input autocapitalize='none' autocomplete='off' autocorrect='off' type='text' ng-model='data.montageName'>";

      if ($scope.listdata.length)
        templ += '<br/><div class="item item-divider">' + $translate.instant('kMontageSavedProfiles') + `</div>
      <ion-list>
        <ion-radio-fix ng-repeat="item in listdata" ng-value="item" ng-model="data.montageName">
          {{item}}
        </ion-item>
      </ion-list>`;

      $rootScope.zmPopup = SecuredPopups.show('confirm', {
        title: $translate.instant('kMontageSave'),
        template: templ,
        subTitle: $translate.instant('kMontageSaveSubtitle'),
        scope: $scope,
        okText: $translate.instant('kButtonOk'),
        cancelText: $translate.instant('kButtonCancel'),

      }).then(function (res) {
        //console.log(res);
        if (res) { // ok
          var ld = NVR.getLogin();

          if ($scope.data.montageName != '') {
            // lets allow them to save default
            //if ($scope.data.montageName != $translate.instant('kMontageDefaultProfile'))
            if (1) {
              var getMonPos = pckry.getShiftPositions('data-item-id');
              var unHidden = false;

              // if you are saving to default all monitor profile
              // then I will undo any hidden monitors
              if ($scope.data.montageName == $translate.instant('kMontageDefaultProfile')) {
                NVR.debug ("All monitors is special, unhiding all");
                for (var p = 0; p < getMonPos.length; p++) {
                  //console.log ("CHECK");
                  if (getMonPos[p].display != 'show' && getMonPos[p].display != 'blank' ) {
                    getMonPos[p].display = 'show';
                    unHidden = true;
                  }
                }
              }

              var pos = JSON.stringify(getMonPos);

              // console.log ("SAVING POS = "+pos);

              ld.packeryPositionsArray[$scope.data.montageName] = pos;
              //console.log (ld.packeryPositionsArray);
              NVR.debug("Saving " + $scope.data.montageName + " with:" + pos);
              ld.currentMontageProfile = $scope.data.montageName;
              NVR.setLogin(ld);
              $scope.currentProfileName = $scope.data.montageName ||$translate.instant('kMontage');

              if (unHidden) {
                $rootScope.zmPopup = SecuredPopups.show('alert', {
                  title: $translate.instant('kNote'),
                  template: $translate.instant('kMontageSaveDefaultWarning'),
                  okText: $translate.instant('kButtonOk'),

                });
                switchMontageProfile($translate.instant('kMontageDefaultProfile'));
              }
            }
          }
        }
      });
    };

    function getMode() {
      var mode = (simulStreaming && currentStreamState != streamState.SNAPSHOT && currentStreamState != streamState.STOPPED) ? 'jpeg' : 'single';
      //console.log ("mode="+mode);
      return mode;
    }

    $scope.processImageError = function(monitor) {
      if (currentStreamState != streamState.ACTIVE) return;
      if (monitor.Monitor.listDisplay=='blank') return;
      var mintimesec = 10;
      var nowt = moment();
      var thent = monitor.Monitor.regenTime || moment();
      if (nowt.diff(thent, 'seconds') >=mintimesec) {
        console.log ('IMAGE ERROR CALLING REGEN');
        NVR.regenConnKeys(monitor);
        NVR.debug ("Image load error for: "+monitor.Monitor.Id+" regenerated connKey is:"+monitor.Monitor.connKey);
      } else {
        var dur = mintimesec - nowt.diff(thent, 'seconds');
        NVR.debug ("Image load error for Monitor: "+monitor.Monitor.Id+" scheduling for connkey regen in "+dur+"s");
        monitor.Monitor.regenHandle = $timeout ( function() {
          NVR.debug ('deferred image error, calling regen');
          //console.log ('DEFERRED IMAGE ERROR CALLING REGEN');
          NVR.regenConnKeys(monitor);}, dur*1000 );
      }
    };

    $scope.showEvent = function(monitor) {
      if (!monitor.Monitor.lastEvent) {
        NVR.debug("Events cleared, nothing to show");
        return;
      }

      var ld = NVR.getLogin();
      var url = ld.apiurl;
      var eid = monitor.Monitor.lastEvent.events[0].Event.Id;
      url += '/events/'+monitor.Monitor.lastEvent.events[0].Event.Id+'.json?'+$rootScope.authSession;
      var mid = monitor.Monitor.Id;

      ld.lastEventCheckTimes[mid] = (new moment()).tz(NVR.getTimeZoneNow()).format('YYYY-MM-DD HH:mm:ss');
      NVR.debug ("Updating monitor:"+mid+" event check time (server tz) to " + ld.lastEventCheckTimes[mid] );
      NVR.setLogin(ld);
      $http.get(url)
        .then ( function (succ) {
          var data = succ.data;

          var event = data.event;
          $scope.event = event;
          $scope.currentEvent = event;

          $scope.eventModalOpen = true;
          // $scope.isModalActive = true;
          // Note: no need to setAwake(true) as its already awake
          // in montage view

          currentStreamState = streamState.PAUSED;
          $scope.isModalStreamPaused = true; // we stop montage and start modal stream in snapshot first
          $timeout(function () { // after render
            if (simulStreaming) {
              NVR.debug("Killing all streams in montage to save memory/nw...");
              for (var i = 0; i < $scope.MontageMonitors.length; i++) {
                if ($scope.MontageMonitors[i].Monitor.listDisplay == 'show')
                  NVR.killLiveStream(
                    $scope.MontageMonitors[i].Monitor.connKey,
                    $scope.MontageMonitors[i].Monitor.controlURL,
                    $scope.MontageMonitors[i].Monitor.Name);
              }
            }
          });

          NVR.log("Cancelling montage timer, opening Modal");

          // NVR.log("Starting Modal timer");
          //console.log ("openModal:Cancelling timer");
          $interval.cancel(intervalHandleMontage);
          $interval.cancel(intervalHandleMontageCycle);
          $interval.cancel(intervalHandleAlarmStatus);
          $interval.cancel(intervalHandleStreamQuery);
          $interval.cancel(intervalHandleEventStatus);
          $interval.cancel(intervalHandleReloadPage);

          $scope.followSameMonitor = "1";
          $scope.mycarousel = {
            index: 0
          };
          $scope.ionRange = {
            index: 1
          };

          //prepareModalEvent(event.Event.Id);

          var ld = NVR.getLogin();
          var sl = 'disabled';
          if (ld.showLiveForInProgressEvents) {
            sl = 'enabled';
          }

          $scope.modalData = {
            doRefresh: false
          };

          monitor.Monitor.lastEvent = undefined;
          $ionicModal.fromTemplateUrl('templates/events-modal.html', {
            scope: $scope, // give ModalCtrl access to this scope
            animation: 'slide-in-up',
            id: 'footage',
            snapshot: 'enabled',
            eventId: eid,
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

              var ld = NVR.getLogin();
            });
        });
    };
$scope.constructEventThumbnail = function (monitor) {
  if (!monitor.Monitor.lastEvent) {
    return '';
  }
  // console.log (JSON.stringify(monitor));
  var stream = monitor.Monitor.recordingURL +
    "/index.php?view=image&width=400&fid=snapshot&eid=" +
    monitor.Monitor.lastEvent.events[0].Event.Id;

  stream += $rootScope.authSession;
  stream += NVR.insertSpecialTokens();
  //  console.log (stream);
  //console.log ("EVENT="+stream);
  return stream;
};

function matchMonitorsToPositions(positions, mon) {
  var ld = NVR.getLogin();
  var layouttype = false;

  if (ld.currentMontageProfile == '__reorder__') {
    NVR.debug ('You manually messed with the profile, so skipping all matches');
    return;
  }

  console.log ("matchMonitor positions:"+JSON.stringify(positions));
  if (!mon) { mon = $scope.MontageMonitors;}
  if (!mon) { return;}
  var disabled_display;
  // hide disabled monitors when no profile is used
  if (!ld.currentMontageProfile || ld.currentMontageProfile == $translate.instant('kMontageDefaultProfile')) {
    disabled_display = 'noshow';
  } else {
    disabled_display = 'blank';
  }

  NVR.debug ('We are in profile:'+ld.currentMontageProfile+" so disabled monitors is "+disabled_display);
  NVR.debug ('Passed profile is: '+JSON.stringify(positions));
  if (!positions.length) layouttype = true;
  var found = false;
  var monitor_found = false;
  for (var m=0; m < mon.length; m++){
    monitor_found = false;
    for (var p=0; p < positions.length; p++) {
      if (mon[m].Monitor.Id == positions[p].attr) {
        NVR.debug ('Monitor '+positions[p].attr+ ' found in position array with listDisplay='+positions[p].display);
        found = true;
        monitor_found = true;
        if (mon[m].Monitor.Function == 'None' && positions[p].display!='noshow') {
          NVR.debug (ld.currentMontageProfile + '=>None Function: Making '+mon[m].Monitor.Name+' to "'+disabled_display+'" as this is disabled in the current ZM run state');
          positions[p].display=disabled_display;
          mon[m].Monitor.listDisplay = disabled_display;
        }
        if (mon[m].Monitor.Function != 'None' && positions[p].display!='noshow') {
          NVR.debug (ld.currentMontageProfile + '=>Making '+mon[m].Monitor.Name+' to show  as this is enabled in the current ZM run state');
          positions[p].display='show';
          mon[m].Monitor.listDisplay = 'show';
        }
      }
    } // pos

    if (!monitor_found && !$scope.currentZMGroupName) {
      NVR.debug (mon[m].Monitor.Name+' not found, profile='+ld.currentMontageProfile+' and group='+$scope.currentZMGroupName);
      mon[m].Monitor.listDisplay = ((ld.currentMontageProfile == $translate.instant('kMontageDefaultProfile')  || !positions.length)) ?'show':'noshow';
      NVR.debug (ld.currentMontageProfile + '=> Making '+mon[m].Monitor.Name+' to '+mon[m].Monitor.listDisplay+' as this monitor was not found in profile');
    }
    /* if (!found) {
        NVR.debug ('********************* monitor not in this profile: '+mon[m].Monitor.Name);
       layouttype = true;
      }*/
  } //mon

  NVR.debug ('after matchMontageProfile, will packery re-init? '+ layouttype);
  NVR.setMonitors(mon);
  $scope.monitors = mon;
  return layouttype;
}

function parsePositions(ps) {
  //var ld = NVR.getLogin();
  var positions;
  //NVR.debug ('parsePositions: got '+JSON.stringify(ps));
  if (!ps) return [];
  try {
    positions = JSON.parse(ps);
  } catch (e) {
    NVR.debug ("error parsing profile");
    return undefined;
  }
  return positions;
}

function loadStreamQueryStatus () {

  function checkValidConnkey(query, i) {
    $http.get(query)
      .then (function (succ) {
        //console.log ("SUCCESS="+JSON.stringify(succ.data));
        if (succ.data && succ.data.result && succ.data.result == "Error") {
          $scope.MontageMonitors[i].Monitor.streamState = 'bad';
          NVR.log ("Montage View: Regenerating Connkey as Failed:"+query);
          $scope.MontageMonitors[i].Monitor.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
        } else if (succ.data && succ.data.result && succ.data.result == "Ok"){
          $scope.MontageMonitors[i].Monitor.streamState = 'good';
          //console.log (JSON.stringify(succ));
        }
      },
        function (err) {
          NVR.log ("Stream Query ERR="+JSON.stringify(err));
        });
  }
  //console.log ("MONTAGE: "+currentStreamState);
  if (currentStreamState != streamState.ACTIVE || !simulStreaming) return;

  NVR.debug ('Montage View: Stream Status check');
  var ld = NVR.getLogin();

  var query;
  for (var i = 0; i < $scope.MontageMonitors.length; i++) {
    if (($scope.MontageMonitors[i].Monitor.Function == 'None') ||
      ($scope.MontageMonitors[i].Monitor.listDisplay == 'noshow')) {
      continue;
    }
    query = $scope.MontageMonitors[i].Monitor.recordingURL+'/index.php?view=request&request=stream&command=99';
    //query = ld.url+'/index.php?view=request&request=stream&command=99';
    query = query + $rootScope.authSession;
    query += appendConnKey($scope.MontageMonitors[i].Monitor.connKey);
    //if (query) query += NVR.insertSpecialTokens();
    //console.log ("QUERY="+query);
    checkValidConnkey(query,i);
  }
}

$scope.constructStream = function(monitor) {
  var stream;
  var fps = NVR.getLogin().montageliveFPS;
  //console.log ('MID='+monitor.Monitor.Id+" listDisplay:"+monitor.Monitor.listDisplay);
  if (currentStreamState == streamState.STOPPED || monitor.Monitor.listDisplay == 'noshow' ) {
    //console.log ("STREAM=empty and auth="+$rootScope.authSession);
    //sconsole.log ('EMPTY STREAM');
    return "";
  }

  if (monitor.Monitor.listDisplay == 'blank') {
    //console.log(monitor.Monitor.Id + " is hidden");
    return "";
  }

  if (currentStreamState == streamState.SNAPSHOT_LOWQUALITY) {
    stream = monitor.Monitor.streamingURL +
      "/nph-zms?mode=single&scale=10&monitor="+ monitor.Monitor.Id +
      "&rand=" + randToAvoidCacheMem + monitor.Monitor.Id;
    // console.log(stream);
  } else {
    stream = monitor.Monitor.streamingURL +
    "/nph-zms?mode=" + getMode()  +
    "&monitor=" + monitor.Monitor.Id +
    "&scale=" + $scope.LoginData.montageQuality +
    "&buffer="+ $scope.LoginData.liveStreamBuffer +
    "&rand=" + randToAvoidCacheMem + monitor.Monitor.Id;

    if (fps) {
      stream +='&maxfps='+fps;
    }
  }

  stream  += $rootScope.authSession;
  stream += appendConnKey(monitor.Monitor.connKey);

  if (stream) stream += NVR.insertSpecialTokens();

  //randEachTime();
  //"&rand=" + randToAvoidCacheMem;
  //"&rand="+$scope.randToAvoidCacheMem
  //console.log("STREAM=" + stream);
  return stream;
};

function appendConnKey(ck) {
  return "&connkey=" + ck;
}

$scope.toggleSubMenuFunction = function () {
  $scope.toggleSubMenu = !$scope.toggleSubMenu;
  NVR.debug("toggling size buttons:" + $scope.toggleSubMenu);
  if ($scope.toggleSubMenu) $ionicScrollDelegate.$getByHandle("montage-delegate").scrollTop();
  var ld = NVR.getLogin();
  ld.showMontageSubMenu = $scope.toggleSubMenu;
  NVR.setLogin(ld);
};

$scope.toggleSidebar = function(monitor) {
  monitor.Monitor.showSidebar = !monitor.Monitor.showSidebar;
  $timeout (function() {
    pckry.shiftLayout();
    // $scope.squeezeMonitors();
  }, 300);
};

// minimal has to be beforeEnter or header won't hide
$scope.$on('$ionicView.beforeEnter', function () {
  $scope.eventModalOpen = false;

  $scope.zmGroups  = NVR.listOfZMGroups();
  $scope.currentZMGroupName = NVR.getLogin().currentZMGroupName;

  $scope.$on ( "process-push", function () {
    NVR.debug (">> MontageCtrl: push handler");
    var s = NVR.evaluateTappedNotification();
    NVR.debug("tapped Notification evaluation:"+ JSON.stringify(s));
    $ionicHistory.nextViewOptions({
      disableAnimate:true,
      disableBack: true
    });
    $state.go(s[0],s[1],s[2]);
  });

  //window.addEventListener("resize", jiggleMontage, false);
  $scope.$on('sizechanged', function() {
    $timeout (function () {
      jiggleMontage();
    },10);
  });

  timeInMontage = new Date();
  broadcastHandles = [];
  randToAvoidCacheMem = new Date().getTime();

  $scope.monitors = message;
  NVR.debug ('Montage beforeEnter: got '+message.length+' monitors');

  //console.log ("MONITORS:"+JSON.stringify($scope.monitors));

  var ps = NVR.getLogin().packeryPositions;
  var p = parsePositions(ps);
  matchMonitorsToPositions(p, $scope.monitors);
  $scope.MontageMonitors = angular.copy($scope.monitors);

  NVR.debug ('Montage beforeEnter: copying monitors to montage monitors');

  $scope.singleMonitorModalOpen = false;
  // $scope.minimal = $stateParams.minimal;
  var ld = NVR.getLogin();
  $scope.minimal = ld.isFullScreen;
  if ($scope.minimal) {
    NVR.debug ('Moving to full screen');
    ionic.Platform.fullScreen($scope.minimal, !$scope.minimal);
  }
  //console.log ("**************** MINIMAL ENTER " + $scope.minimal);
  $scope.zmMarginTop = $scope.minimal ? 0 : 15;

  NVR.getZmsMultiPortSupport()
    .then(function (data) {
      //multiPortZms = data;
      simulStreaming = data > 0 ? true : false;
      //console.log ("****** MULTIPORT="+multiPortZms);
      NVR.debug("Multiport=" + data);

      /*  if ($rootScope.platformOS == 'ios') {
                simulStreaming = false;
                NVR.debug("IOS detected, DISABLING simul streaming");
              }*/

      if (ld.disableSimulStreaming) {
        simulStreaming = false;
        NVR.debug("Forcing simulStreams off as you have disabled it");
      }
    },
      function (err) {
        NVR.debug("******* SHOULD NEVER HAPPEN - MULTIPORT ERROR");
        simulStreaming = false;
      }
    );
});

//avoid bogus scale error
$scope.LoginData = NVR.getLogin();

streamQueryTimer = (NVR.getBandwidth() == 'lowbw') ? zm.streamQueryStatusTimeLowBW: zm.streamQueryStatusTime;
NVR.debug('Setting streamQuery timer to '+streamQueryTimer);

$scope.toggleTimeType = function () {
  if (NVR.isTzSupported()) {
    if ($scope.iconTimeNow == 'server') {
      $scope.iconTimeNow = 'local';
      $scope.timeNow = $translate.instant('kPleaseWait');
    } else {
      $scope.iconTimeNow = 'server';
      $scope.timeNow = $translate.instant('kPleaseWait');
    }
  } else
    NVR.debug("timezone API not supported, can't display");
};

$scope.$on('$ionicView.afterEnter', function () {
  // NVR.debug("Setting image mode to snapshot, will change to image when packery is all done");
  $scope.areImagesLoading = true;
  $scope.isDragabillyOn = false;
  $scope.reOrderActive = false;

  if (NVR.isTzSupported())
    $scope.iconTimeNow = 'server';
  else
    $scope.iconTimeNow = 'local';

  if ($scope.iconTimeNow == 'local')
    $scope.timeNow = moment().format(NVR.getTimeFormatSec());
  else
    $scope.timeNow = moment().tz(NVR.getTimeZoneNow()).format(NVR.getTimeFormatSec());

  $scope.gridScale = "grid-item-50";
  $scope.LoginData = NVR.getLogin();
  //FIXME

  if (NVR.getBandwidth() == 'lowbw') {
    NVR.debug("Enabling low bandwidth parameters");
    $scope.LoginData.montageQuality = zm.montageQualityLowBW;
    $scope.LoginData.singleImageQuality = zm.eventSingleImageQualityLowBW;
    $scope.LoginData.montageHistoryQuality = zm.montageQualityLowBW;
  }

  $scope.monLimit = $scope.LoginData.maxMontage;
  $scope.toggleSubMenu = NVR.getLogin().showMontageSubMenu;

  $scope.sliderChanging = false;
  loginData = NVR.getLogin();

  $scope.isRefresh = $stateParams.isRefresh;
  sizeInProgress = false;
  $scope.imageStyle = true;
  intervalHandleMontage = "";
  intervalHandleMontageCycle = "";
  $scope.isReorder = false;

  $ionicSideMenuDelegate.canDragContent($scope.minimal ? true : true);

  $scope.areImagesLoading = true;
  var ld = NVR.getLogin();

  refreshSec = (NVR.getBandwidth() == 'lowbw') ? ld.refreshSecLowBW : ld.refreshSec;

  NVR.debug("bandwidth: " + NVR.getBandwidth() + " montage refresh set to: " + refreshSec);

  //console.log("Setting Awake to " + NVR.getKeepAwake());
  NVR.setAwake(NVR.getKeepAwake());

  $interval.cancel(intervalHandleMontage);
  $interval.cancel(intervalHandleMontageCycle);
  $interval.cancel(intervalHandleAlarmStatus);
  $interval.cancel(intervalHandleStreamQuery);
  $interval.cancel(intervalHandleEventStatus);
  $interval.cancel(intervalHandleReloadPage);

  intervalHandleMontage = $interval(function () {
    loadNotifications();
    //  console.log ("Refreshing Image...");
  }.bind(this), refreshSec * 1000);

  NVR.debug("Setting up cycle interval of:" + NVR.getLogin().cycleMontageInterval * 1000);
  intervalHandleMontageCycle = $interval(function () {
    cycleMontageProfiles();
    //  console.log ("Refreshing Image...");
  }.bind(this), NVR.getLogin().cycleMontageInterval * 1000);

  intervalHandleAlarmStatus = $interval(function () {
    loadAlarmStatus();
    //  console.log ("Refreshing Image...");
  }.bind(this), zm.alarmStatusTime);

  if (simulStreaming){
    intervalHandleStreamQuery = $interval(function () {
      loadStreamQueryStatus();
      //  console.log ("Refreshing Image...");
    }.bind(this), streamQueryTimer);
  }

  loadEventStatus(ld.showMontageSidebars);
  intervalHandleEventStatus = $interval(function () {
    loadEventStatus();
    //  console.log ("Refreshing Image...");
  }.bind(this), zm.eventCheckTime);

  intervalHandleReloadPage = $interval(function () {
    forceReloadPage();
  }.bind(this), reloadPage);

  loadNotifications();

  if ($scope.MontageMonitors.length == 0) {
    $rootScope.zmPopup = $ionicPopup.alert({
      title: $translate.instant('kNoMonitors'),
      template: $translate.instant('kCheckCredentials'),
      okText: $translate.instant('kButtonOk'),
      cancelText: $translate.instant('kButtonCancel'),
    });
    $ionicHistory.nextViewOptions({
      disableBack: true
    });
    $state.go("app.login", {
      "wizard": false
    });
    return;
  }

  ld = NVR.getLogin();
  NVR.log("Inside Montage Ctrl:We found " + $scope.monitors.length + " monitors");

  // set them all at 50% for packery
  for (var i = 0; i < $scope.MontageMonitors.length; i++) {
    $scope.MontageMonitors[i].Monitor.gridScale = "50";
    $scope.MontageMonitors[i].Monitor.selectStyle = "";
    $scope.MontageMonitors[i].Monitor.alarmState = 'rgba(0,0,0,0)';
    $scope.MontageMonitors[i].Monitor.isStamp = false;
    $scope.MontageMonitors[i].Monitor.eventCount = 0;
    $scope.MontageMonitors[i].Monitor.showSidebar = false;
  }

  $timeout(function () {
    var ps  = parsePositions(ld.packeryPositions);
    matchMonitorsToPositions(ps);
    initPackery();
  }, zm.packeryTimer);
  //console.log("**VIEW ** Montage Ctrl AFTER ENTER");

  if ($rootScope.platformOS != 'android') {
    document.addEventListener("pause", onPause, false);
  } else {
    NVR.debug("MontageCtrl: Android detected, using cordova-multiwindow plugin for onStop/onStart instead");
    window.MultiWindowPlugin.registerOnStop("montage-pause", onPause);
  }
  document.addEventListener("resume", onResume, false);
});

$scope.clearAllEvents = function () {
  for (var i = 0; i < $scope.MontageMonitors.length; i++) {
    $scope.eventButtonClicked ($scope.MontageMonitors[i], false);
    //  $scope.MontageMonitors[i].Monitor.showSidebar = false;
  }
};

$scope.eventButtonClicked = function (monitor, showEvents) {
  var ld = NVR.getLogin();
  mid = monitor.Monitor.Id;
  // always use server tz to avoid confusion
  var lastCheckTime = ld.lastEventCheckTimes[mid];
  ld.lastEventCheckTimes[mid] = (new moment()).tz(NVR.getTimeZoneNow()).format('YYYY-MM-DD HH:mm:ss');
  NVR.debug ("Updating monitor:"+mid+" event check time (server tz) to " + lastCheckTime);
  NVR.setLogin(ld);
  if (!monitor.Monitor.lastEvent) {
    lastCheckTime = "";
  }
  monitor.Monitor.lastEvent = undefined;
  monitor.Monitor.showSidebar = false;
  if (!showEvents) return;
  $state.go("app.events", {
    "id": monitor.Monitor.Id,
    "playEvent": false,
    "lastCheckTime": lastCheckTime
  });
  return;
};

$scope.$on('$ionicView.beforeLeave', function () {
  document.removeEventListener("resume", onResume, false);

  // window.removeEventListener("resize", jiggleMontage, false);
  currentStreamState = streamState.STOPPED;
  viewCleanup();
  viewCleaned = true;
  //NVR.debug("Deregistering broadcast handles");
  for (var i = 0; i < broadcastHandles.length; i++) {
    broadcastHandles[i]();
  }
  broadcastHandles = [];
});

$scope.$on('$ionicView.unloaded', function () {
});

$scope.resetSizesWithInput = function () {
  $scope.data = {};
  var myPopup = $ionicPopup.show({
    template: '<input type="number" ng-model="data.cols">',
    title: $translate.instant('kMontageResizeCols'),
    scope: $scope,
    buttons: [
      { text: $translate.instant('kButtonCancel') },
      {
        text: $translate.instant('kButtonOk'),
        type: 'button-positive',
        onTap: function(e) {
          if (!$scope.data.cols) {
            //don't allow the user to close unless he enters wifi password
            e.preventDefault();
          } else {
            return $scope.data.cols;
          }
        }
      }
    ]
  });

  myPopup.then(function(res) {
    if (res)  {
      // var x = getComputedStyle(document.documentElement).getPropertyValue('--grid-width');
      //  console.log ('*********** CURRENT WIDTH IS '+x);

      // var p = parseInt(100.0/res + 0.2);
      p = parseFloat (100.0/res).toFixed(3);
      NVR.debug ("Resizing monitors to: "+p);

      // document.documentElement.style.setProperty('--grid-width', p+"%");
      // document.documentElement.style.setProperty('--grid-width', p);
      //  x = getComputedStyle(document.documentElement).getPropertyValue('--grid-width');
      //          var x = document.documentElement.style.getProperty('--grid-width');
      //  console.log ('*********** NEW WIDTH IS '+x);
      $scope.resetSizes(false, p);
    }
  });
};

$scope.resetSizes = function (unhideAll, percent) {
  var somethingReset = false;
  if (!percent) percent="50";
  for (var i = 0; i < $scope.MontageMonitors.length; i++) {
    if (unhideAll) {
      NVR.debug ('Setting '+$scope.MontageMonitors[i].Monitor.Name+' to show');
      $scope.MontageMonitors[i].Monitor.listDisplay = 'show';
    }
    if ($scope.isDragabillyOn) {
      if ($scope.MontageMonitors[i].Monitor.selectStyle == "dragborder-selected") {
        $scope.MontageMonitors[i].Monitor.gridScale = percent;
        somethingReset = true;
      }
    } else {
      $scope.MontageMonitors[i].Monitor.gridScale = percent;
      // console.log (percent);
      // somethingReset = true;
    }
  }
  if (!somethingReset && $scope.isDragabillyOn) { // nothing was selected
    for (i = 0; i < $scope.MontageMonitors.length; i++) {
      $scope.MontageMonitors[i].Monitor.gridScale = percent;
    }
  }

  $timeout(function () {
    console.log ('******* DOING RESET');
    pckry.once('layoutComplete', function () {
      console.log ("Layout complete");
      var positions = pckry.getShiftPositions('data-item-id');
      console.log ("POSITIONS MAP " + JSON.stringify(positions));
      var ld = NVR.getLogin();

      ld.packeryPositions = JSON.stringify(positions);
      //console.log ("Saving " + ld.packeryPositions);
      //ld.currentMontageProfile = "";
      //$scope.currentProfileName = $translate.instant('kMontage');
      NVR.setLogin(ld);

      $timeout(function () {
        NVR.debug("inside reset sizes:doing the jiggle and dance...");
        //pckry.resize(true);
        pckry.shiftLayout();
        //$scope.squeezeMonitors();
      }, 600);
      // $scope.slider.monsize = 2;
    });
    pckry.layout();
    //pckry.layout();
  }, 100);
};

function layout(pckry) {
  pckry.shiftLayout();
}

$scope.formatBytes = function (bytes, decimals) {
  return formatBytes(bytes, decimals);
};

//https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript?answertab=active#tab-top
function formatBytes(bytes, decimals) {
  if (bytes === undefined) return '?';
  if (bytes === null) return '0B';
  if (bytes === 0) return '0B';
  var k = 1024;
  var  dm = decimals < 0 ? 0 : decimals;
  var  sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  var i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

$scope.squeezeMonitors = function () {
  NVR.debug ("squeezing");
  pckry.once('layoutComplete', resizeComplete);
  $timeout(function () {
    pckry.layout();
  });

  function resizeComplete() {
    //console.log ("HERE");
    $timeout(function () {
      var positions = pckry.getShiftPositions('data-item-id');
      //console.log("SAVING");
      var ld = NVR.getLogin();

      ld.packeryPositions = JSON.stringify(positions);
      //console.log ("Saving " + ld.packeryPositions);
      ld.currentMontageProfile = "";
      $scope.currentProfileName = $translate.instant('kMontage');
      NVR.setLogin(ld);
      $ionicLoading.hide();
      $scope.sliderChanging = false;
    }, 20);
  }
};
//---------------------------------------------------------
// slider is tied to the view slider for montage
//Remember not to use a variable. I'm using an object
// so it's passed as a reference - otherwise it makes
// a copy and the value never changes
//---------------------------------------------------------

$scope.sliderChanged = function (dirn) {
  if ($scope.sliderChanging) {
    // console.log("too fast my friend");
    //$scope.slider.monsize = oldSliderVal;
    return;
  }

  $scope.sliderChanging = true;
  var ld = NVR.getLogin();

  $ionicLoading.show({
    template: $translate.instant('kPleaseWait'),
    noBackdrop: true,
    duration: 5000
  });

  var somethingReset = false;

  var oldScales = {};
  pckry.getItemElements().forEach(function (elem) {
    var id = elem.getAttribute("data-item-id");
    var sz = elem.getAttribute("data-item-size");
    //console.log ('********** GOT ID:'+id+" SIZE:"+sz);
    //if (isNaN(sz)) sz = "20%";
    oldScales[id] = sz;
    //console.log("REMEMBERING " + id + ":" + sz);
  });

  // this only changes items that are selected
  for (var i = 0; i < $scope.MontageMonitors.length; i++) {
    var curVal = parseFloat($scope.MontageMonitors[i].Monitor.gridScale) || 20;
    curVal = curVal + (ld.montageResizeSteps * dirn);
    if (curVal < 5) curVal = 5;
    if (curVal > 100) curVal = 100;
    console.log ("For Index: " + i + " From: " + $scope.MontageMonitors[i].Monitor.gridScale + " To: " + curVal);

    if ($scope.isDragabillyOn) {
      // only do this for selected monitors
      if ($scope.MontageMonitors[i].Monitor.selectStyle == "dragborder-selected") {
        $scope.MontageMonitors[i].Monitor.gridScale = curVal;
        somethingReset = true;
      }
    } else {
      $scope.MontageMonitors[i].Monitor.gridScale = curVal;
      //somethingReset = true;
    }
  }

  // this changes all items if none were selected
  if (!somethingReset && $scope.isDragabillyOn) { // nothing was selected
    for (i = 0; i < $scope.MontageMonitors.length; i++) {
      var cv = parseFloat($scope.MontageMonitors[i].Monitor.gridScale) || 20;
      cv = cv + (ld.montageResizeSteps * dirn);
      if (cv < 5) cv = 5;
      if (cv > 100) cv = 100;
      $scope.MontageMonitors[i].Monitor.gridScale = cv;
      //console.log ("*******GRIDSCALE="+)
    }
  }

  // reload sizes from DOM and trigger a layout

  $timeout(function () {
    //console.log("Calling re-layout");
    //pckry.reloadItems();

    pckry.once('layoutComplete', resizeComplete);
    pckry.layout();
  }, 150);

  /*
   if (!somethingReset) {
     //console.log (">>>SOMETHING NOT RESET");
           $timeout(function () {
               pckry.layout();
           }, zm.packeryTimer);
       } else {

         //console.log (">>>SOMETHING  RESET");
           $timeout(function () {
               layout(pckry);
           }, zm.packeryTimer);
       }
       */
         function resizeComplete() {
           //console.log ("HERE");
           $timeout(function () {
             var positions = pckry.getShiftPositions('data-item-id');
             //console.log("SAVING");
             var ld = NVR.getLogin();

             ld.packeryPositions = JSON.stringify(positions);
             //console.log ("Saving " + ld.packeryPositions);
             ld.currentMontageProfile = "";
             $scope.currentProfileName = $translate.instant('kMontage');
             NVR.setLogin(ld);
             $ionicLoading.hide();
             $scope.sliderChanging = false;
           }, 20);
         }
};

$scope.currentProfileName = NVR.getLogin().currentMontageProfile || $translate.instant('kMontage');

$scope.reloadView = function () {
  $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
  NVR.log('User action: image reload ' + $rootScope.rand);
};

$scope.doRefresh = function () {
  // console.log("***Pull to Refresh, recomputing Rand");
  NVR.log('Reloading view for montage view, recomputing rand');
  $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
  $scope.monitors = [];
  imageLoadingDataShare.set(0);

  var refresh = NVR.getMonitors(1);

  refresh.then(function (data) {
    $scope.monitors = data;
    $scope.$broadcast('scroll.refreshComplete');
  });
};

}]);
