// Controller for the montage view
/* jshint -W041 */

/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,ionic,Packery, Draggabilly, imagesLoaded, ConnectSDK, moment */

angular.module('zmApp.controllers')
  .controller('zmApp.MontageCtrl', ['$scope', '$rootScope', 'NVRDataModel', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$ionicPopup', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$ionicPlatform', 'zm', '$ionicPopover', '$controller', 'imageLoadingDataShare', '$window', '$localstorage', '$translate', 'SecuredPopups', 'EventServer', function ($scope, $rootScope, NVRDataModel, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $ionicPopup, $stateParams, $ionicHistory, $ionicScrollDelegate, $ionicPlatform, zm, $ionicPopover, $controller, imageLoadingDataShare, $window, $localstorage, $translate, SecuredPopups, EventServer) {

    //---------------------------------------------------------------------
    // Controller main
    //---------------------------------------------------------------------

    var intervalHandleMontage; // image re-load handler
    var intervalHandleAlarmStatus; // status of each alarm state
    var intervalHandleMontageCycle;
    var intervalHandleReloadPage;

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


    var streamState = {
      SNAPSHOT: 1,
      ACTIVE: 2,
      STOPPED: 3
    };

    var currentStreamState = streamState.SNAPSHOT; // first load snapshot
    $scope.isModalStreamPaused = false; // used in Monitor Modal

    //var reloadPage = 30;

    var simulStreaming = false; // will be true if you  multiport

    var broadcastHandles = [];

    var as = $scope.$on("auth-success", function () {

      // do nothing, we are reloading here anyway?
      /*
      if ($scope.singleMonitorModalOpen) {
        NVRDataModel.debug("Montage: Not creating streams, as modal is open");
        return;
      }


      NVRDataModel.debug("Montage Re-auth handler");

      //streamState = true;

      $timeout(function () { // after render
        if (simulStreaming) {
          NVRDataModel.debug("Re-creating all stream connkeys in montage ...");
          NVRDataModel.regenConnKeys();
          $scope.monitors = NVRDataModel.getMonitorsNow();
          $scope.MontageMonitors = angular.copy($scope.monitors);
          $timeout(function () // after render
            {
              initPackery();
            }, zm.packeryTimer);


        }
      });
      broadcastHandles.push(as);
      //console.log (">>>>>>>>>>>>>>>>>>>>>>>>>>>AS="+as);
      */
    });

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
      refreshSec = (NVRDataModel.getBandwidth() == 'lowbw') ? ld.refreshSecLowBW : ld.refreshSec;

      $interval.cancel(intervalHandleMontage);
      $interval.cancel(intervalHandleMontageCycle);
      $interval.cancel(intervalHandleReloadPage);


      intervalHandleMontage = $interval(function () {
        loadNotifications();
      }.bind(this), refreshSec * 1000);

      intervalHandleMontageCycle = $interval(function () {
        cycleMontageProfiles();
      }.bind(this), NVRDataModel.getLogin().cycleMontageInterval * 1000);

      intervalHandleReloadPage = $interval(function () {
        forceReloadPage();
      }.bind(this), reloadPage);

      if (NVRDataModel.getBandwidth() == 'lowbw') {
        NVRDataModel.debug("Enabling low bandwidth parameters");
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
        NVRDataModel.debug("Modal is open, closing it");
        NVRDataModel.setAwake(false);
        cleanupOnCloseModal();
      } else {
        NVRDataModel.debug("Modal is closed, so toggling or exiting");
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


    function forceReloadPage() {
      if ($scope.isDragabillyOn) {
        NVRDataModel.debug("not reloading, edit in progress");
        return;

      }

      var ld = NVRDataModel.getLogin();
      ld.reloadInMontage = true;
      NVRDataModel.log("Reloading view to keep memory in check...");
      NVRDataModel.setLogin(ld)
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


          /* $state.transitionTo($state.current, $stateParams, {
               reload: true,
               inherit: false,
               notify: true
           });*/

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

      /* $ionicLoading.show(
       {
           template: $translate.instant('kArrangingImages'),
           noBackdrop: true,
           duration: zm.loadingTimeout
       });*/

      currentStreamState = streamState.SNAPSHOT;

      $scope.areImagesLoading = true;
      var progressCalled = false;

      if (draggies) {
        draggies.forEach(function (drag) {
          drag.destroy();
        });
      }

      draggies = [];
      var layouttype = true;
      var ld = NVRDataModel.getLogin();

      var positionsStr = ld.packeryPositions;
      var positions = {};

      if (positionsStr == '' || positionsStr == undefined) {
        NVRDataModel.log("Did NOT find a packery layout");
        layouttype = true;
      } else {

        //console.log ("POSITION STR IS " + positionsStr);
        positions = JSON.parse(positionsStr);
        NVRDataModel.log("found a packery layout");

        layouttype = false;
      }

      var cnt = 0;
      $scope.MontageMonitors.forEach(function (elem) {
        if ((elem.Monitor.Enabled != '0') && (elem.Monitor.Function != 'None'))
          cnt++;
      });

      NVRDataModel.log("Monitors that are active and not DOM hidden: " + cnt + " while grid has " + positions.length);

      if (cnt > NVRDataModel.getLogin().maxMontage) {
        cnt = NVRDataModel.getLogin().maxMontage;
        NVRDataModel.log("restricting monitor count to " + cnt + " due to max-montage setting");
      }

      if (cnt != positions.length) {

        NVRDataModel.log("Whoops!! Monitors have changed. I'm resetting layouts, sorry!");
        layouttype = true;
        positions = {};
      }

      var elem = angular.element(document.getElementById("mygrid"));

      //console.log ("**** mygrid is " + JSON.stringify(elem));

      if (pckry) pckry.destroy();

      pckry = new Packery('.grid', {
        itemSelector: '.grid-item',
        percentPosition: true,
        columnWidth: '.grid-sizer',
        gutter: 0,
        initLayout: layouttype,
        shiftPercentResize: true

      });

      imagesLoaded(elem).on('progress', function (instance, img) {

        var result = img.isLoaded ? 'loaded' : 'broken';
        // NVRDataModel.debug('~~loaded image is ' + result + ' for ' + img.img.src);

        // lay out every image if a pre-arranged position has not been found

        $timeout(function () {
          if (layouttype) pckry.layout();
        }, 100);

        progressCalled = true;

        // if (layouttype) $timeout (function(){layout(pckry);},100);
      });

      imagesLoaded(elem).on('always', function () {
        //console.log ("******** ALL IMAGES LOADED");
        // $scope.$digest();
        NVRDataModel.debug("All images loaded, switching to snapshot...");

        $scope.areImagesLoading = false;
        currentStreamState = streamState.SNAPSHOT;

        if (simulStreaming) {

          $timeout(function () {
            NVRDataModel.debug("Switching mode to active...");
            currentStreamState = streamState.ACTIVE;
          }, 100);
        }


        $ionicLoading.hide();

        if (!progressCalled) {
          NVRDataModel.log("***  PROGRESS WAS NOT CALLED");
          // pckry.reloadItems();
        }

        $timeout(function () {

          pckry.getItemElements().forEach(function (itemElem) {

            draggie = new Draggabilly(itemElem);
            pckry.bindDraggabillyEvents(draggie);
            draggies.push(draggie);
            draggie.disable();
            draggie.unbindHandles();
          });

          pckry.on('dragItemPositioned', itemDragged);

          if (!isEmpty(positions)) {
            NVRDataModel.log("Arranging as per packery grid");


            for (var i = 0; i < $scope.MontageMonitors.length; i++) {
              for (var j = 0; j < positions.length; j++) {
                if ($scope.MontageMonitors[i].Monitor.Id == positions[j].attr) {
                  if (isNaN(positions[j].size)) positions[j].size = 20;
                  $scope.MontageMonitors[i].Monitor.gridScale = positions[j].size;
                  $scope.MontageMonitors[i].Monitor.listDisplay = positions[j].display;
                  // NVRDataModel.debug("Setting monitor ID: " + $scope.MontageMonitors[i].Monitor.Id + " to size: " + positions[j].size + " and display:" + positions[j].display);
                }
                //console.log ("Index:"+positions[j].attr+ " with size: " + positions[j].size);
              }
            }

            NVRDataModel.debug("All images loaded, doing image layout");

          }
          $timeout(function () {
            //NVRDataModel.log("Force calling resize");
            ///pckry.reloadItems();
            ///positions is defined only if layouttype was false
            //(">>> Positions is " + JSON.stringify(positions));
            if (!layouttype && positions) pckry.initShiftLayout(positions, "data-item-id");
            // now do a jiggle 
            $timeout(function () {
              NVRDataModel.debug("doing the jiggle and dance...");
              pckry.resize(true);
            }, 300);

          }, 100);

          //pckry.onresize();

        }, 20);

      });

      function itemDragged(item) {
        NVRDataModel.debug("drag complete");
        $timeout(function () {
          pckry.shiftLayout();
        }, 20);

        pckry.once('layoutComplete', function () {

          var positions = pckry.getShiftPositions('data-item-id');
          //console.log ("POSITIONS MAP " + JSON.stringify(positions));
          var ld = NVRDataModel.getLogin();
          ld.packeryPositions = JSON.stringify(positions);
          //  console.log ("Saving " + ld.packeryPositions);
          // console.log ("FULL OBJECT "+ JSON.stringify(ld));
          ld.currentMontageProfile = "";
          $scope.currentProfileName = $translate.instant('kMontage');
          NVRDataModel.setLogin(ld);
          NVRDataModel.debug("saved new positions");
        });

        //pckry.getItemElements().forEach(function (itemElem) {

        //console.log (itemElem.attributes['data-item-id'].value+" size  "+itemElem.attributes['data-item-size'].value );
        //  });


      }

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

      /* var size = Object.keys(obj).length;
       var i;
       for (i=0; i<size; i++)
       {
          if (Object.keys(obj)[i] == key)
          break;
       }
       i = (i + 1) % size;
       return Object.keys(obj)[i];*/

    }

    //----------------------------------------------
    // cycle profiles
    //-----------------------------------------------

    function cycleMontageProfiles() {

      var ld = NVRDataModel.getLogin();

      if (!ld.cycleMontageProfiles) {
        // NVRDataModel.debug ("cycling disabled");
        return;

      }

      if ($scope.reOrderActive) {
        NVRDataModel.debug("not cycling, re-order in progress");
        return;
      }

      if ($scope.isDragabillyOn) {
        NVRDataModel.debug("not cycling, edit in progress");
        return;

      }

      var nextProfile = findNext(ld.currentMontageProfile, ld.packeryPositionsArray);

      if (nextProfile == ld.currentMontageProfile) {
        NVRDataModel.debug("Not cycling profiles, looks like you only have one");
      } else {
        NVRDataModel.debug("Cycling profile from: " + ld.currentMontageProfile + " to:" + nextProfile);
        switchMontageProfile(nextProfile);

      }


    }

    //-----------------------------------------------------------------------
    // cycle through all displayed monitors and check alarm status
    //-----------------------------------------------------------------------

    function loadAlarmStatus() {

      if ((NVRDataModel.versionCompare($rootScope.apiVersion, "1.30") == -1) ||
        (NVRDataModel.getBandwidth() == 'lowbw') ||
        (NVRDataModel.getLogin().disableAlarmCheckMontage == true)) {

        // console.log ("NOT DOING ALARMS");
        return;
      }

      for (var i = 0; i < $scope.MontageMonitors.length; i++) {
        if (($scope.MontageMonitors[i].Monitor.Function == 'None') ||
          ($scope.MontageMonitors[i].Monitor.Enabled == '0') ||
          ($scope.MontageMonitors[i].Monitor.listDisplay == 'noshow')) {
          continue;
        }
        getAlarmStatus($scope.MontageMonitors[i]);

      }

    }

    //-----------------------------------------------------------------------
    // get alarm status over HTTP for a single monitor
    //-----------------------------------------------------------------------
    function getAlarmStatus(monitor) {
      var apiurl = NVRDataModel.getLogin().apiurl;
      //console.log ("ALARM CALLED WITH " +JSON.stringify(monitor));

      var alarmurl = apiurl + "/monitors/alarm/id:" + monitor.Monitor.Id + "/command:status.json";
      //  console.log("Alarm Check: Invoking " + alarmurl);

      $http.get(alarmurl)
        .then(function (data) {
            //  NVRDataModel.debug ("Success in monitor alarmed status " + JSON.stringify(data));

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
            NVRDataModel.debug("Error in monitor alarmed status ");
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
      if (simulStreaming) {
        // console.log ("Skipping timer as simulStreaming");
        return;
      }

      randEachTime();
      //console.log ($scope.randToAvoidCacheMem);

      if ($scope.areImagesLoading) {
        NVRDataModel.debug("skipping image refresh, packery is still loading");
        return;
      }

      //if (pckry && !$scope.isDragabillyOn) pckry.shiftLayout();
      $rootScope.rand = Math.floor((Math.random() * 100000) + 1);

      // if you see the time move, montage should move

      if ($scope.iconTimeNow == 'local')
        $scope.timeNow = moment().format(NVRDataModel.getTimeFormatSec());
      else
        $scope.timeNow = moment().tz(NVRDataModel.getTimeZoneNow()).format(NVRDataModel.getTimeFormatSec());
      //$scope.timeNow = moment().format(NVRDataModel.getTimeFormatSec());

      //console.log ("Inside Montage timer...");

    }

    $scope.cancelReorder = function () {
      $scope.modal.remove();
      finishReorder();
    };

    $scope.saveReorder = function () {
      NVRDataModel.debug("Saving monitor hide/unhide");

      $scope.modal.remove();
      $scope.MontageMonitors = $scope.copyMontage;
      finishReorder();

    };

    function finishReorder() {

      for (var i = 0; i < $scope.MontageMonitors.length; i++) {
        $scope.MontageMonitors[i].Monitor.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
      }
      currentStreamState = streamState.STOPPED;
      // don't call initPackery - we need to savePackeryOrder
      $timeout(function () // after render
        {
          draggies.forEach(function (drag) {
            drag.destroy();
          });

          pckry.reloadItems();
          draggies = [];
          pckry.once('layoutComplete', savePackeryOrder);
          pckry.layout();
        }, zm.packeryTimer);

    }

    function savePackeryOrder() {
      $timeout(function () {
        var positions = pckry.getShiftPositions('data-item-id');
        NVRDataModel.debug("POSITIONS MAP " + JSON.stringify(positions));
        var ld = NVRDataModel.getLogin();
        ld.packeryPositions = JSON.stringify(positions);
        //console.log ("Savtogging " + ld.packeryPositions);
        ld.currentMontageProfile = "";
        $scope.currentProfileName = $translate.instant('kMontage');
        NVRDataModel.setLogin(ld);

        pckry.getItemElements().forEach(function (itemElem) {
          draggie = new Draggabilly(itemElem);
          pckry.bindDraggabillyEvents(draggie);
          draggies.push(draggie);
          draggie.disable();
        });

        $ionicScrollDelegate.$getByHandle("montage-delegate").scrollTop();

        // Now also ask DataModel to update its monitor display status
        NVRDataModel.reloadMonitorDisplayStatus();
        //$scope.MontageMonitors = angular.copy(NVRDataModel.getMonitorsNow());
        //$scope.MontageMonitors = NVRDataModel.getMonitorsNow();
        pckry.layout();


        $scope.areImagesLoading = false;
        currentStreamState = streamState.SNAPSHOT;

        if (simulStreaming) {

          $timeout(function () {
            NVRDataModel.debug("Switching mode to active...");
            currentStreamState = streamState.ACTIVE;
          }, 100);
        }
      }, 20);
    }


    $scope.reorderFrame = function (item) {
      var frame = "";
      frame = item.Monitor.streamingURL + "/nph-zms?mode=single" +
        "&monitor=" + item.Monitor.Id +
        "&scale=50";

      if ($rootScope.authSession != 'undefined') frame += $rootScope.authSession;
      frame += NVRDataModel.insertBasicAuthToken();
      return frame;
    };

    $scope.isCycleOn = function () {
      return NVRDataModel.getLogin().cycleMontageProfiles;
    };

    $scope.getCycleStatus = function () {
      var c = NVRDataModel.getLogin().cycleMontageProfiles;
      var str = (c) ? $translate.instant('kOn') : $translate.instant('kOff');
      return str;
    };

    $scope.toggleCycle = function () {
      var ld = NVRDataModel.getLogin();
      ld.cycleMontageProfiles = !ld.cycleMontageProfiles;
      NVRDataModel.setLogin(ld);
      NVRDataModel.debug("cycle=" + ld.cycleMontageProfiles);
      NVRDataModel.debug("cycle interval=" + ld.cycleMontageInterval);


    };

    $scope.toggleHide = function (i) {

      if ($scope.copyMontage[i].Monitor.listDisplay == 'show')
        $scope.copyMontage[i].Monitor.listDisplay = 'noshow';
      else
        $scope.copyMontage[i].Monitor.listDisplay = 'show';

      NVRDataModel.debug("index " + i + " is now " + $scope.copyMontage[i].Monitor.listDisplay);
    };

    $scope.hideUnhide = function () {
      if ($scope.isDragabillyOn) {
        dragToggle();
      }
      // make a copy of the current list and work on that
      // this is to avoid packery screw ups while you are hiding/unhiding

      $scope.copyMontage = angular.copy($scope.MontageMonitors);

      if (simulStreaming) {
        NVRDataModel.debug("Killing all streams in montage to save memory/nw...");
        currentStreamState = streamState.STOPPED;
        NVRDataModel.stopNetwork()
          .then(function (succ) {
            for (var i = 0; i < $scope.MontageMonitors.length; i++) {
              if ($scope.MontageMonitors[i].Monitor.listDisplay == 'show') NVRDataModel.killLiveStream($scope.MontageMonitors[i].Monitor.connKey, $scope.MontageMonitors[i].Monitor.controlURL);
            }
            // in context of timeout
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

          });


      } else {
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
            NVRDataModel.debug("Enabling alarm for Monitor:" + $scope.monitors[j].Monitor.Id);
            $scope.MontageMonitors[j].Monitor.isAlarmed = true;
            scheduleRemoveFlash(j);
          }
        }

      }

    });

    broadcastHandles.push(al);

    function scheduleRemoveFlash(id) {
      NVRDataModel.debug("Scheduled a " + zm.alarmFlashTimer + "ms timer for dis-alarming monitor ID:" + $scope.MontageMonitors[id].Monitor.Id);
      $timeout(function () {
        $scope.MontageMonitors[id].Monitor.isAlarmed = false;
        NVRDataModel.debug("dis-alarming monitor ID:" + $scope.MontageMonitors[id].Monitor.Id);
      }, zm.alarmFlashTimer);
    }

    //----------------------------------------------------------------
    // Alarm notification handling
    //----------------------------------------------------------------
    $scope.handleAlarms = function () {
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
      var ld = NVRDataModel.getLogin();
      ld.isFullScreen = $scope.minimal;
      NVRDataModel.setLogin(ld);

      NVRDataModel.debug("MontageCtrl: switch minimal is " + $scope.minimal);
      ionic.Platform.fullScreen($scope.minimal, !$scope.minimal);
      //console.log ("alarms:Cancelling timer");
      $interval.cancel(intervalHandleMontage);
      $interval.cancel(intervalHandleMontageCycle);
      $interval.cancel(intervalHandleAlarmStatus);
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
      //NVRDataModel.isBackground());
      return NVRDataModel.isBackground();
    };

    //---------------------------------------------------------------------
    // Triggered when you enter/exit full screen
    //---------------------------------------------------------------------
    $scope.switchMinimal = function () {
      $scope.minimal = !$scope.minimal;
      NVRDataModel.debug("MontageCtrl: switch minimal is " + $scope.minimal);
      // console.log("Hide Statusbar");
      ionic.Platform.fullScreen($scope.minimal, !$scope.minimal);
      //console.log ("minimal switch:Cancelling timer");
      $interval.cancel(intervalHandleMontage); //we will renew on reload
      $interval.cancel(intervalHandleMontageCycle);
      $interval.cancel(intervalHandleAlarmStatus);
      $interval.cancel(intervalHandleReloadPage);

      var ld = NVRDataModel.getLogin();
      ld.isFullScreen = $scope.minimal;
      NVRDataModel.setLogin(ld);


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
            NVRDataModel.debug("Stamp for " + $scope.MontageMonitors[i].Monitor.Name + " is:" + $scope.MontageMonitors[i].Monitor.isStamp);
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
          // console.log("SAVING");
          var ld = NVRDataModel.getLogin();

          ld.packeryPositions = JSON.stringify(positions);
          //console.log ("Saving " + ld.packeryPositions);
          ld.currentMontageProfile = "";
          $scope.currentProfileName = $translate.instant('kMontage');
          NVRDataModel.setLogin(ld);
          $ionicLoading.hide();
          //$scope.sliderChanging = false;
        }, 20);
      }

    };

    $scope.toggleSelectItem = function (mid) {
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

      for (i = 0; i < $scope.MontageMonitors.length; i++) {
        $scope.MontageMonitors[i].Monitor.isStamp = false;
      }

      $ionicSideMenuDelegate.canDragContent($scope.isDragabillyOn ? false : true);

      //$timeout(function(){pckry.reloadItems();},10);
      NVRDataModel.debug("setting dragabilly to " + $scope.isDragabillyOn);
      if ($scope.isDragabillyOn) {
        $scope.toggleSubMenu = true;

        $scope.dragBorder = "dragborder";
        NVRDataModel.debug("Enabling drag for " + draggies.length + " items");
        for (i = 0; i < draggies.length; i++) {
          draggies[i].enable();
          draggies[i].bindHandles();
        }

        // reflow and reload as some may be hidden
        //  $timeout(function(){pckry.reloadItems();$timeout(function(){pckry.layout();},300);},100);
      } else {
        $scope.dragBorder = "";
        NVRDataModel.debug("Disabling drag for " + draggies.length + " items");
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
            var ld = NVRDataModel.getLogin();
            ld.packeryPositions = JSON.stringify(positions);
            //console.log ("Saving " + ld.packeryPositions);
            ld.currentMontageProfile = "";
            $scope.currentProfileName = $translate.instant('kMontage');
            NVRDataModel.setLogin(ld);
          }, 300);
        }, 100);

      }
    }

    //---------------------------------------------------------------------
    // main monitor modal open - if drag is not on, this is called on touch
    //---------------------------------------------------------------------

    $scope.openModal = function (mid, controllable, controlid, connKey, monitor) {

      currentStreamState = streamState.STOPPED;
      $scope.isModalStreamPaused = true; // we stop montage and start modal stream in snapshot first
      $timeout(function () { // after render


        if (simulStreaming) {
          NVRDataModel.debug("Killing all streams in montage to save memory/nw...");

          if ($rootScope.platformOS == 'ios') {

          } else {
            for (var i = 0; i < $scope.MontageMonitors.length; i++) {
              if ($scope.MontageMonitors[i].Monitor.listDisplay == 'show') NVRDataModel.killLiveStream($scope.MontageMonitors[i].Monitor.connKey, $scope.MontageMonitors[i].Monitor.controlURL, $scope.MontageMonitors[i].Monitor.Name);
            }
          }
        }

      });


      $scope.controlURL = monitor.Monitor.controlURL;
      openModal(mid, controllable, controlid, connKey, monitor);



    };

    function openModal(mid, controllable, controlid, connKey, monitor) {

      $scope.singleMonitorModalOpen = true;
      NVRDataModel.debug("MontageCtrl: Open Monitor Modal with monitor Id=" + mid + " and Controllable:" + controllable + " with control ID:" + controlid);
      // $scope.isModalActive = true;
      // Note: no need to setAwake(true) as its already awake
      // in montage view

      NVRDataModel.log("Cancelling montage timer, opening Modal");
      // NVRDataModel.log("Starting Modal timer");
      //console.log ("openModal:Cancelling timer");
      $interval.cancel(intervalHandleMontage);
      $interval.cancel(intervalHandleMontageCycle);
      $interval.cancel(intervalHandleAlarmStatus);
      $interval.cancel(intervalHandleReloadPage);


      $scope.monitor = monitor;
      $scope.showPTZ = false;
      $scope.monitorId = mid;
      $scope.monitorName = NVRDataModel.getMonitorName(mid);
      $scope.controlid = controlid;

      //$scope.LoginData = NVRDataModel.getLogin();
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
      NVRDataModel.setAwake(NVRDataModel.getKeepAwake());

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


      NVRDataModel.log("Restarting montage timers...");
      var ld = NVRDataModel.getLogin();
      // console.log ("closeModal: Cancelling timer");
      $interval.cancel(intervalHandleMontage);
      $interval.cancel(intervalHandleAlarmStatus);
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

        NVRDataModel.debug("Re-creating all stream connkeys in montage ...");
        NVRDataModel.regenConnKeys();
        $scope.monitors = NVRDataModel.getMonitorsNow();
        $scope.MontageMonitors = angular.copy($scope.monitors);
      }

      // we need to do this as we hide the view for snapshot as well
      //streamState = false;
      $timeout(function () // after render
        {
          initPackery();
        }, zm.packeryTimer);

    }


    // for some reason, double tap calls this twice
    $scope.closeModal = function () {
      NVRDataModel.debug("MontageCtrl: Close & Destroy Monitor Modal");

      if ($scope.singleMonitorModalOpen) {
        $scope.singleMonitorModalOpen = false;

        cleanupOnCloseModal();

      } else {
        NVRDataModel.debug("Ignoring double-invocation");
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
        NVRDataModel.debug("Montage View Cleanup was already done, skipping");
        return;
      }
      $interval.cancel(intervalHandleMontage);
      $interval.cancel(intervalHandleMontageCycle);
      $interval.cancel(intervalHandleAlarmStatus);
      $interval.cancel(intervalHandleReloadPage);
      if (pckry) pckry.destroy();


      broadcastHandles = [];

      
      $timeout(function () {
        if (!$scope.singleMonitorModalOpen && simulStreaming) {
          NVRDataModel.debug("Killing all streams in montage to save memory/nw...");

          for (i = 0; i < $scope.MontageMonitors.length; i++) {
            if ($scope.MontageMonitors[i].Monitor.listDisplay == 'show') NVRDataModel.killLiveStream($scope.MontageMonitors[i].Monitor.connKey, $scope.MontageMonitors[i].Monitor.controlURL);

          }

        }

      });






    }

    function onPause() {
      NVRDataModel.debug("MontageCtrl: onpause called");
      viewCleanup();
      viewCleaned = true;

    }

    function onResume() {

      // we should be going to portal login so no need here
      //NVRDataModel.debug ("Montage resume called, regenerating all connkeys");
      //NVRDataModel.regenConnKeys();
      // $scope.MontageMonitors = NVRDataModel.getMonitorsNow();

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
      if ($scope.modal) $scope.modal.remove();
    });

    function orientationChanged() {

    }


    // remove a saved montage profile
    $scope.deleteMontageProfile = function () {
      var posArray;

      try {
        posArray = NVRDataModel.getLogin().packeryPositionsArray;
        //console.log ("PA="+JSON.stringify(posArray));

      } catch (e) {
        NVRDataModel.debug("error parsing packery array positions");
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
        template: '<ion-list>                                ' +
          '  <ion-radio-fix ng-repeat="item in listdata" ng-value="item" ng-model="data.selectedVal"> ' +
          '    {{item}}                              ' +
          '  </ion-item>                             ' +
          '</ion-list>                               ',

        title: $translate.instant('kSelect'),
        subTitle: $translate.instant('kSelectDelete'),
        scope: $scope,
        okText: $translate.instant('kButtonOk'),
        cancelText: $translate.instant('kButtonCancel'),

      }).then(function (res) {
        NVRDataModel.debug("Deleting profile: " + $scope.data.selectedVal);
        delete posArray[$scope.data.selectedVal];
        var ld = NVRDataModel.getLogin();
        ld.packeryPositionsArray = posArray;

        if (ld.currentMontageProfile == $scope.data.selectedVal) {
          ld.currentMontageProfile = "";
          $scope.currentProfileName = $translate.instant('kMontage');

        }

        if ($scope.currentMontageProfile == $scope.data.selectedVal)
          $scope.currentProfileName = $translate.instant('kMontage');

        NVRDataModel.setLogin(ld);

      });

    };


    function switchMontageProfile(mName) {
      $interval.cancel(intervalHandleMontageCycle);
      intervalHandleMontageCycle = $interval(function () {
        cycleMontageProfiles();
        //  console.log ("Refreshing Image...");
      }.bind(this), NVRDataModel.getLogin().cycleMontageInterval * 1000);




      //console.log ("SELECTED " + $scope.data.selectedVal);
      var ld = NVRDataModel.getLogin();
      //console.log ("OLD POS="+ld.packeryPositions);
      ld.packeryPositions = ld.packeryPositionsArray[mName];
      ld.currentMontageProfile = mName;
      $scope.currentProfileName = mName;
      //console.log ("NEW POS="+ld.packeryPositions);
      NVRDataModel.setLogin(ld);


      $timeout(function () { // after render


        if (simulStreaming) {
          currentStreamState = streamState.STOPPED;
          NVRDataModel.debug("Killing all streams in montage to save memory/nw...");

          if ($rootScope.platformOS == 'ios') {

            NVRDataModel.stopNetwork();

          } else {

            for (var i = 0; i < $scope.MontageMonitors.length; i++) {
              if ($scope.MontageMonitors[i].Monitor.listDisplay == 'show') NVRDataModel.killLiveStream($scope.MontageMonitors[i].Monitor.connKey, $scope.MontageMonitors[i].Monitor.controlURL, $scope.MontageMonitors[i].Monitor.Name);
            }
          }

          // in timeout for iOS as we call stopNetwork
          $timeout(function () {

            NVRDataModel.regenConnKeys();
            $scope.monitors = NVRDataModel.getMonitorsNow();
            $scope.MontageMonitors = angular.copy($scope.monitors);
            $timeout(function () {
              initPackery();
            }, zm.packeryTimer);

          });


        } else {
          NVRDataModel.regenConnKeys();
          $scope.monitors = NVRDataModel.getMonitorsNow();
          $scope.MontageMonitors = angular.copy($scope.monitors);
          $timeout(function () {
            initPackery();
          }, zm.packeryTimer);
        }



      });






    }
    // switch to another montage profile
    $scope.switchMontageProfile = function () {
      var posArray;

      try {
        posArray = NVRDataModel.getLogin().packeryPositionsArray;
        //console.log ("PA="+JSON.stringify(posArray));

      } catch (e) {
        NVRDataModel.debug("error parsing packery array positions");
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
        template: '<ion-list>                                ' +
          '  <ion-radio-fix ng-repeat="item in listdata" ng-value="item" ng-model="data.selectedVal"> ' +
          '    {{item}}                              ' +
          '  </ion-item>                             ' +
          '</ion-list>                               ',

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
        posArray = NVRDataModel.getLogin().packeryPositionsArray;
        //console.log ("PA="+JSON.stringify(posArray));

      } catch (e) {
        NVRDataModel.debug("error parsing packery array positions");
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
        templ += '<br/><div class="item item-divider">' + $translate.instant('kMontageSavedProfiles') + '</div>' +
        '<ion-list>                                ' +
        '  <ion-radio-fix ng-repeat="item in listdata" ng-value="item" ng-model="data.montageName"> ' +
        '    {{item}}                              ' +
        '  </ion-item>                             ' +
        '</ion-list>                               ';


      $rootScope.zmPopup = SecuredPopups.show('confirm', {
        title: $translate.instant('kMontageSave'),
        template: templ,
        subTitle: $translate.instant('kMontageSaveSubtitle'),
        scope: $scope,
        okText: $translate.instant('kButtonOk'),
        cancelText: $translate.instant('kButtonCancel'),

      }).then(function (res) {
        //console.log(res);
        if (res) // ok
        {

          var ld = NVRDataModel.getLogin();

          if ($scope.data.montageName != '') {
            // lets allow them to save default 
            //if ($scope.data.montageName != $translate.instant('kMontageDefaultProfile'))
            if (1) {
              var getMonPos = pckry.getShiftPositions('data-item-id');
              var unHidden = false;

              // if you are saving to default all monitor profile
              // then I will undo any hidden monitors
              if ($scope.data.montageName == $translate.instant('kMontageDefaultProfile')) {
                for (var p = 0; p < getMonPos.length; p++) {
                  //console.log ("CHECK");
                  if (getMonPos[p].display != 'show') {
                    getMonPos[p].display = 'show';
                    unHidden = true;
                  }
                }
              }

              var pos = JSON.stringify(getMonPos);

              //console.log ("SAVING POS = "+pos);

              ld.packeryPositionsArray[$scope.data.montageName] = pos;
              NVRDataModel.debug("Saving " + $scope.data.montageName + " with:" + pos);
              ld.currentMontageProfile = $scope.data.montageName;
              NVRDataModel.setLogin(ld);
              $scope.currentProfileName = $scope.data.montageName;

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



    $scope.constructStream = function (monitor) {

      var stream;
      if (currentStreamState == streamState.STOPPED || monitor.Monitor.listDisplay == 'noshow' || $rootScope.authSession == 'undefined') {
       // console.log ("STREAM=empty and auth="+$rootScope.authSession);
        return "";
      }

      stream = monitor.Monitor.streamingURL +
        "/nph-zms?mode=" + getMode() +
        "&monitor=" + monitor.Monitor.Id +
        "&scale=" + $scope.LoginData.montageQuality +
        "&rand=" + randToAvoidCacheMem +
        "&buffer=1000" +
        $rootScope.authSession +
        appendConnKey(monitor.Monitor.connKey);

      if (stream) stream += NVRDataModel.insertBasicAuthToken();




      //"&rand=" + randToAvoidCacheMem;
      //"&rand="+$scope.randToAvoidCacheMem +


     // console.log("STREAM=" + stream);
      return stream;

    };

    function appendConnKey(ck) {
      if (simulStreaming && currentStreamState != streamState.SNAPSHOT)
        return "&connkey=" + ck;
      else
        return "";
    }


    $scope.toggleSubMenuFunction = function () {

      $scope.toggleSubMenu = !$scope.toggleSubMenu;

      NVRDataModel.debug("toggling size buttons:" + $scope.toggleSubMenu);
      if ($scope.toggleSubMenu) $ionicScrollDelegate.$getByHandle("montage-delegate").scrollTop();
      var ld = NVRDataModel.getLogin();
      ld.showMontageSubMenu = $scope.toggleSubMenu;
      NVRDataModel.setLogin(ld);
    };

    // minimal has to be beforeEnter or header won't hide
    $scope.$on('$ionicView.beforeEnter', function () {

      broadcastHandles = [];
      randToAvoidCacheMem = new Date().getTime();
      currentStreamState = streamState.SNAPSHOT;
      // NVRDataModel.regenConnKeys();
      $scope.monitors = NVRDataModel.getMonitorsNow();
      $scope.MontageMonitors = angular.copy($scope.monitors);



      $scope.singleMonitorModalOpen = false;
      // $scope.minimal = $stateParams.minimal;
      var ld = NVRDataModel.getLogin();
      $scope.minimal = ld.isFullScreen;
      //console.log ("**************** MINIMAL ENTER " + $scope.minimal);
      $scope.zmMarginTop = $scope.minimal ? 0 : 15;

      NVRDataModel.getZmsMultiPortSupport()
        .then(function (data) {
            //multiPortZms = data;
            simulStreaming = data > 0 ? true : false;
            //console.log ("****** MULTIPORT="+multiPortZms);
            NVRDataModel.debug("Multiport=" + data);

            /*  if ($rootScope.platformOS == 'ios') {
                simulStreaming = false;
                NVRDataModel.debug("IOS detected, DISABLING simul streaming");
              }*/

            if (ld.disableSimulStreaming) {
              simulStreaming = false;
              NVRDataModel.debug("Forcing simulStreams off as you have disabled it");

            }
          },
          function (err) {
            NVRDataModel.debug("******* SHOULD NEVER HAPPEN - MULTIPORT ERROR");
            simulStreaming = false;

          }
        );

    });

    //avoid bogus scale error
    $scope.LoginData = NVRDataModel.getLogin();

    $scope.toggleTimeType = function () {
      if (NVRDataModel.isTzSupported()) {
        if ($scope.iconTimeNow == 'server') {
          $scope.iconTimeNow = 'local';
          $scope.timeNow = $translate.instant('kPleaseWait');
        } else {
          $scope.iconTimeNow = 'server';
          $scope.timeNow = $translate.instant('kPleaseWait');
        }
      } else
        NVRDataModel.debug("timezone API not supported, can't display");
    };

    $scope.$on('$ionicView.afterEnter', function () {
      // NVRDataModel.debug("Setting image mode to snapshot, will change to image when packery is all done");
      $scope.areImagesLoading = true;
      $scope.isDragabillyOn = false;
      $scope.reOrderActive = false;

      if (NVRDataModel.isTzSupported())
        $scope.iconTimeNow = 'server';
      else
        $scope.iconTimeNow = 'local';

      if ($scope.iconTimeNow == 'local')
        $scope.timeNow = moment().format(NVRDataModel.getTimeFormatSec());
      else
        $scope.timeNow = moment().tz(NVRDataModel.getTimeZoneNow()).format(NVRDataModel.getTimeFormatSec());

      $scope.gridScale = "grid-item-50";
      $scope.LoginData = NVRDataModel.getLogin();
      //FIXME

      if (NVRDataModel.getBandwidth() == 'lowbw') {
        NVRDataModel.debug("Enabling low bandwidth parameters");
        $scope.LoginData.montageQuality = zm.montageQualityLowBW;
        $scope.LoginData.singleImageQuality = zm.eventSingleImageQualityLowBW;
        $scope.LoginData.montageHistoryQuality = zm.montageQualityLowBW;

      }

      $scope.monLimit = $scope.LoginData.maxMontage;
      $scope.toggleSubMenu = NVRDataModel.getLogin().showMontageSubMenu;

      $scope.sliderChanging = false;
      loginData = NVRDataModel.getLogin();

      $scope.isRefresh = $stateParams.isRefresh;
      sizeInProgress = false;
      $scope.imageStyle = true;
      intervalHandleMontage = "";
      intervalHandleMontageCycle = "";
      $scope.isReorder = false;

      $ionicSideMenuDelegate.canDragContent($scope.minimal ? true : true);

      $scope.areImagesLoading = true;
      var ld = NVRDataModel.getLogin();

      refreshSec = (NVRDataModel.getBandwidth() == 'lowbw') ? ld.refreshSecLowBW : ld.refreshSec;

      NVRDataModel.debug("bandwidth: " + NVRDataModel.getBandwidth() + " montage refresh set to: " + refreshSec);

      //console.log("Setting Awake to " + NVRDataModel.getKeepAwake());
      NVRDataModel.setAwake(NVRDataModel.getKeepAwake());

      $interval.cancel(intervalHandleMontage);
      $interval.cancel(intervalHandleMontageCycle);
      $interval.cancel(intervalHandleAlarmStatus);
      $interval.cancel(intervalHandleReloadPage);


      intervalHandleMontage = $interval(function () {
        loadNotifications();
        //  console.log ("Refreshing Image...");
      }.bind(this), refreshSec * 1000);

      NVRDataModel.debug("Setting up cycle interval of:" + NVRDataModel.getLogin().cycleMontageInterval * 1000);
      intervalHandleMontageCycle = $interval(function () {
        cycleMontageProfiles();
        //  console.log ("Refreshing Image...");
      }.bind(this), NVRDataModel.getLogin().cycleMontageInterval * 1000);

      intervalHandleAlarmStatus = $interval(function () {
        loadAlarmStatus();
        //  console.log ("Refreshing Image...");
      }.bind(this), zm.alarmStatusTime);

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

      ld = NVRDataModel.getLogin();


      NVRDataModel.log("Inside Montage Ctrl:We found " + $scope.monitors.length + " monitors");

      // set them all at 50% for packery
      for (var i = 0; i < $scope.MontageMonitors.length; i++) {
        $scope.MontageMonitors[i].Monitor.gridScale = "50";
        $scope.MontageMonitors[i].Monitor.selectStyle = "";
        $scope.MontageMonitors[i].Monitor.alarmState = 'rgba(0,0,0,0)';
        $scope.MontageMonitors[i].Monitor.isStamp = false;

      }


      $timeout(function () {
        initPackery();
      }, zm.packeryTimer);
      //console.log("**VIEW ** Montage Ctrl AFTER ENTER");
      window.addEventListener("resize", orientationChanged, false);

      document.addEventListener("pause", onPause, false);
      //  document.addEventListener("resume", onResume, false);

    });

    $scope.$on('$ionicView.beforeLeave', function () {

      currentStreamState = streamState.STOPPED;
      viewCleanup();
      viewCleaned = true;

    });

    $scope.$on('$ionicView.unloaded', function () {

    });

    $scope.resetSizes = function () {
      var somethingReset = false;
      for (var i = 0; i < $scope.MontageMonitors.length; i++) {
        if ($scope.isDragabillyOn) {
          if ($scope.MontageMonitors[i].Monitor.selectStyle == "dragborder-selected") {
            $scope.MontageMonitors[i].Monitor.gridScale = "50";
            somethingReset = true;
          }
        } else {
          $scope.MontageMonitors[i].Monitor.gridScale = "50";
          // somethingReset = true;
        }
      }
      if (!somethingReset && $scope.isDragabillyOn) // nothing was selected
      {
        for (i = 0; i < $scope.MontageMonitors.length; i++) {
          $scope.MontageMonitors[i].Monitor.gridScale = "50";
        }
      }

      $timeout(function () {
        pckry.reloadItems();

        pckry.once('layoutComplete', function () {
          //console.log ("Layout complete");
          var positions = pckry.getShiftPositions('data-item-id');
          //console.log ("POSITIONS MAP " + JSON.stringify(positions));
          var ld = NVRDataModel.getLogin();

          ld.packeryPositions = JSON.stringify(positions);
          //console.log ("Saving " + ld.packeryPositions);
          ld.currentMontageProfile = "";
          $scope.currentProfileName = $translate.instant('kMontage');
          NVRDataModel.setLogin(ld);

          $timeout(function () {
            NVRDataModel.debug("doing the jiggle and dance...");
            pckry.resize(true);
            pckry.shiftLayout();
          }, 300);

          // $scope.slider.monsize = 2;
        });
        pckry.layout();

      }, 20);

    };

    function layout(pckry) {
      pckry.shiftLayout();
    }


    $scope.squeezeMonitors = function () {
      pckry.once('layoutComplete', resizeComplete);
      $timeout(function () {
        pckry.layout();
      });

      function resizeComplete() {
        //console.log ("HERE");
        $timeout(function () {
          var positions = pckry.getShiftPositions('data-item-id');
          //console.log("SAVING");
          var ld = NVRDataModel.getLogin();

          ld.packeryPositions = JSON.stringify(positions);
          //console.log ("Saving " + ld.packeryPositions);
          ld.currentMontageProfile = "";
          $scope.currentProfileName = $translate.instant('kMontage');
          NVRDataModel.setLogin(ld);
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
        if (isNaN(sz)) sz = 20;
        oldScales[id] = sz;
        // console.log("REMEMBERING " + id + ":" + sz);

      });

      // this only changes items that are selected
      for (var i = 0; i < $scope.MontageMonitors.length; i++) {

        var curVal = parseInt($scope.MontageMonitors[i].Monitor.gridScale) || 20;
        curVal = curVal + (5 * dirn);
        if (curVal < 10) curVal = 10;
        if (curVal > 100) curVal = 100;
        //console.log ("For Index: " + i + " From: " + $scope.MontageMonitors[i].Monitor.gridScale + " To: " + curVal);

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
      if (!somethingReset && $scope.isDragabillyOn) // nothing was selected
      {
        for (i = 0; i < $scope.MontageMonitors.length; i++) {
          var cv = parseInt($scope.MontageMonitors[i].Monitor.gridScale) || 20;
          cv = cv + (5 * dirn);
          if (cv < 10) cv = 10;
          if (cv > 100) cv = 100;
          $scope.MontageMonitors[i].Monitor.gridScale = cv;
          //console.log ("*******GRIDSCALE="+)
        }
      }

      // reload sizes from DOM and trigger a layout

      $timeout(function () {
        //console.log("Calling re-layout");
        //pckry.reloadItems(); 

        if (dirn == 1) //expand
        {
          pckry.getItemElements().forEach(function (elem) {
            var id = elem.getAttribute("data-item-id");
            var sz = elem.getAttribute("data-item-size");
            if (isNaN(sz)) sz = 20;
            //console.log("NOW IT IS-> " + id + ":" + sz);
            if (oldScales[id] != sz) {
              //console.log("Calling FIT on " + id + " size:" + oldScales[id] + "->" + sz);
              pckry.once('fitComplete', resizeComplete);
              pckry.fit(elem);

            }
          });
        } else //shrink
        {
          //console.log("Calling shift");
          pckry.once('layoutComplete', resizeComplete);
          pckry.shiftLayout();

        }

      }, 20);

      /* if (!somethingReset) {
           //console.log (">>>SOMETHING NOT RESET");
           $timeout(function () {
               pckry.layout();
           }, zm.packeryTimer);
       } else {

           //console.log (">>>SOMETHING  RESET");
           $timeout(function () {
               layout(pckry);
           }, zm.packeryTimer);
       }*/
      function resizeComplete() {
        //console.log ("HERE");
        $timeout(function () {
          var positions = pckry.getShiftPositions('data-item-id');
          //console.log("SAVING");
          var ld = NVRDataModel.getLogin();

          ld.packeryPositions = JSON.stringify(positions);
          //console.log ("Saving " + ld.packeryPositions);
          ld.currentMontageProfile = "";
          $scope.currentProfileName = $translate.instant('kMontage');
          NVRDataModel.setLogin(ld);
          $ionicLoading.hide();
          $scope.sliderChanging = false;
        }, 20);

      }

    };

    $scope.$on('$ionicView.afterEnter', function () {
      // This rand is really used to reload the monitor image in img-src so it is not cached
      // I am making sure the image in montage view is always fresh
      // I don't think I am using this anymore FIXME: check and delete if needed
      // $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
    });

    $scope.currentProfileName = NVRDataModel.getLogin().currentMontageProfile || $translate.instant('kMontage');

    $scope.reloadView = function () {
      $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
      NVRDataModel.log("User action: image reload " + $rootScope.rand);
    };

    $scope.doRefresh = function () {

      // console.log("***Pull to Refresh, recomputing Rand");
      NVRDataModel.log("Reloading view for montage view, recomputing rand");
      $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
      $scope.monitors = [];
      imageLoadingDataShare.set(0);

      var refresh = NVRDataModel.getMonitors(1);

      refresh.then(function (data) {
        $scope.monitors = data;
        $scope.$broadcast('scroll.refreshComplete');
      });
    };

  }]);
