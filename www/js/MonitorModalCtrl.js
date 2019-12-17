// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,ionic, moment, imagesLoaded, chrome */

angular.module('zmApp.controllers').controller('MonitorModalCtrl', ['$scope', '$rootScope', 'zm', 'NVR', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$q', '$sce', 'carouselUtils', '$ionicPopup', 'SecuredPopups', '$translate', '$cordovaFile', function ($scope, $rootScope, zm, NVR, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $q, $sce, carouselUtils, $ionicPopup, SecuredPopups, $translate, $cordovaFile) {

  $scope.displayControls = true;
  $scope.animationInProgress = false;
  $scope.imageFit = true;
  $scope.isModalActive = true;
  var intervalModalHandle;
  var cycleHandle;
  var ld = NVR.getLogin();
  $scope.svgReady = false;
  $scope.zoneArray = [];
  var originalZones = [];
  $scope.isZoneEdit = false;
  var _moveStart = false;
  var targetID = "";
  $scope.imageZoomable = true;
  $scope.ptzButtonsShown = true;


  var streamState = {
    SNAPSHOT: 1,
    SNAPSHOT_LOWQUALITY:2,
    ACTIVE: 3,
    STOPPED: 4,
    PAUSED: 5
  };

  var currentStreamState = streamState.SNAPSHOT_LOWQUALITY;

  // incase imageload is never called
  $timeout (function () {
    if (currentStreamState != streamState.SNAPSHOT) {
      currentStreamState = streamState.SNAPSHOT;
      NVR.debug ('Forcing stream to regular quality, imageLoaded() was never called');
    }
    
  },10000);



  $scope.csize = ($rootScope.platformOS == 'desktop') ? 10 : 20;


  $scope.currentStreamMode = 'single';
  NVR.log("Using stream mode " + $scope.currentStreamMode);

  NVR.debug("MonitorModalCtrl called from " + $ionicHistory.currentStateName());


  $interval.cancel(intervalModalHandle);
  $interval.cancel(cycleHandle);

  intervalModalHandle = $interval(function () {
    loadModalNotifications();
    //  console.log ("Refreshing Image...");
  }.bind(this), zm.alarmStatusTime);




  if ($rootScope.platformOS == 'desktop') {
    window.addEventListener('keydown', keyboardHandler, true);

  }

  // Keyboard handler for desktop versions 
  function keyboardHandler(evt) {

    var handled = false;
    var keyCodes = {

      //monitors
      LEFT: 37,
      RIGHT: 39,

      // ptz

      TOGGLEPTZ_P: 80,

      UPLEFT_Q: 81,
      UP_W: 87,
      UPRIGHT_E: 69,

      LEFT_A: 65,
      CENTER_S: 83,
      RIGHT_D: 68,

      DOWNLEFT_Z: 90,
      DOWN_X: 88,
      DOWNRIGHT_C: 67,

      ESC: 27

    };

    $timeout(function () {
      var keyCode = evt.keyCode;

      //console.log(keyCode + " PRESSED");

      if (keyCode == keyCodes.ESC) {

        if ($rootScope.zmPopup) $rootScope.zmPopup.close();
        $scope.closeModal();

      } else if (keyCode == keyCodes.LEFT) {
        $scope.monStatus = "";
        moveToMonitor($scope.monitorId, -1);
      } else if (keyCode == keyCodes.RIGHT) {
        $scope.monStatus = "";
        moveToMonitor($scope.monitorId, 1);
      } else if (keyCode == keyCodes.TOGGLEPTZ_P) {
        $scope.togglePTZ();
      } else { // rest of the functions are PTZ
        if (!$scope.showPTZ) {
          //NVR.debug("PTZ is not on, or disabled");
          return;
        }
        // coming here means PTZ is on
        var cmd = "";
        switch (keyCode) {
          case keyCodes.UPLEFT_Q:
            cmd = 'UpLeft';
            break;
          case keyCodes.UP_W:
            cmd = 'Up';
            break;
          case keyCodes.UPRIGHT_E:
            cmd = 'UpRight';
            break;
          case keyCodes.LEFT_A:
            cmd = 'Left';
            break;
          case keyCodes.CENTER_S:
            cmd = 'presetHome';
            break;
          case keyCodes.RIGHT_D:
            cmd = 'Right';
            break;
          case keyCodes.DOWNLEFT_Z:
            cmd = 'UpLeft';
            break;
          case keyCodes.DOWN_X:
            cmd = 'Down';
            break;
          case keyCodes.DOWNRIGHT_C:
            cmd = 'DownRight';
            break;
        }
        if (cmd) {
          NVR.debug("Invoking controlPTZ with " + cmd);
          $scope.controlPTZ($scope.monitorId, cmd);
        } else {
          NVR.debug("ignoring invalid PTZ command");
        }

      }

      handled = true;
      return handled;

    });
  }




  // This is the PTZ menu

  $scope.ptzRadialMenuOptions = {
    content: '',

    background: '#2F4F4F',
    isOpen: true,
    toggleOnClick: false,
    size: 'small',
    button: {
      cssClass: "fa  fa-arrows-alt",
    },
    items: [{
        content: '',
        cssClass: 'fa fa-chevron-circle-up',
        empty: false,

        onclick: function () {
          controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'Down');
        }
      },

      {
        content: '',
        cssClass: 'fa fa-chevron-circle-up',
        empty: false,
        onclick: function () {
          controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'DownLeft');
        }
      },

      {
        content: '',
        cssClass: 'fa fa-chevron-circle-up',
        empty: false,

        onclick: function () {
          controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'Left');
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
        empty: false,
        onclick: function () {
          controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'UpLeft');
        }
      },

      {
        content: '',
        cssClass: 'fa fa-chevron-circle-up',
        empty: false,
        onclick: function () {
          controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'Up');
        }
      },

      {
        content: '',
        cssClass: 'fa fa-chevron-circle-up',
        empty: false,
        onclick: function () {
          controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'UpRight');
        }
      },

      {
        content: 'H',
        empty: true,
        onclick: function () {
          //console.log('About');
        }
      },

      {
        content: '',
        cssClass: 'fa fa-chevron-circle-up',
        empty: false,
        onclick: function () {
          controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'Right');
        }
      },

      {
        content: '',
        cssClass: 'fa fa-chevron-circle-up',
        empty: false,
        onclick: function () {
          controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'DownRight');
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

  //-------------------------------------------------------------
  // On re-auth, we need a new zms
  //-------------------------------------------------------------

  var as = $scope.$on("auth-success", function () {

    NVR.debug("MonitorModalCtrl: Re-login detected, resetting everything & re-generating connkey");
    //NVR.stopNetwork("MonitorModal-auth success");
    $scope.isModalStreamPaused = false;

    $timeout(function () {

      if (0 && $rootScope.platformOS == 'ios') {
        NVR.debug("Webkit hack, hammering window.stop();");
        NVR.stopNetwork();
      } else {
        NVR.killLiveStream($scope.connKey, $scope.controlURL);
      }



      $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
    });



  });

  $scope.cast = function (mid, mon) {

  };

  //----------------------------------
  // toggles monitor cycling
  //----------------------------------

  $scope.toggleCycle = function () {
    //console.log ("HERE");
    $scope.isCycle = !$scope.isCycle;
    var ld = NVR.getLogin();
    ld.cycleMonitors = $scope.isCycle;
    NVR.setLogin(ld);
    $scope.cycleText = $scope.isCycle ? $translate.instant('kOn') : $translate.instant('kOff');

    if ($scope.isCycle) {
      NVR.log("re-starting cycle timer");
      $interval.cancel(cycleHandle);

      cycleHandle = $interval(function () {
        moveToMonitor($scope.monitorId, 1);
        //  console.log ("Refreshing Image...");
      }.bind(this), ld.cycleMonitorsInterval * 1000);
    } else {
      NVR.log("cancelling cycle timer");
      $interval.cancel(cycleHandle);
    }

  };

  //-------------------------------------------------------------
  // PTZ enable/disable
  //-------------------------------------------------------------

  $scope.togglePTZ = function () {

    //console.log("PTZ");

    if ($scope.isControllable == '1') {
      //console.log ("iscontrollable is true");
      $scope.showPTZ = !$scope.showPTZ;

    } else {
      $ionicLoading.show({
        template: $translate.instant('kPTZnotConfigured'),
        noBackdrop: true,
        duration: 3000,
      });
    }

  };

  //-------------------------------------------------------------
  // Pause and resume handlers
  //-------------------------------------------------------------

  function onPause() {
    NVR.debug("ModalCtrl: onpause called");
    $interval.cancel(intervalModalHandle);
    $interval.cancel(cycleHandle);

    NVR.debug("Killing single stream...");

    if (0 && $rootScope.platformOS == 'ios') {
      NVR.debug("Webkit hack, hammering window.stop();");
      NVR.stopNetwork();
    } else {
      NVR.killLiveStream($scope.connKey, $scope.controlURL);
    }
    // $interval.cancel(modalIntervalHandle)
    // FIXME: Do I need to  setAwake(false) here?
  }

  function onResume() {
    if (1) return; // Do we really need this as it should go to Portal Login
    NVR.debug("ModalCtrl: Modal resume called");
    if ($scope.isModalActive) {
      NVR.log("ModalCtrl: Restarting Modal timer on resume");

      $interval.cancel(intervalModalHandle);
      $interval.cancel(cycleHandle);

      var ld = NVR.getLogin();

      intervalModalHandle = $interval(function () {
        loadModalNotifications();
      }.bind(this), zm.alarmStatusTime);

      if (ld.cycleMonitors) {
        NVR.debug("Cycling enabled at " + ld.cycleMonitorsInterval);

        $interval.cancel(cycleHandle);

        cycleHandle = $interval(function () {
          moveToMonitor($scope.monitorId, 1);
          //  console.log ("Refreshing Image...");
        }.bind(this), ld.cycleMonitorsInterval * 1000);

      }

      $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);

    }

  }

  //-------------------------------------------------------------
  // Queries the 1.30 API for recording state of current monitor
  //-------------------------------------------------------------
  function loadModalNotifications() {

    if (NVR.versionCompare($rootScope.apiVersion, "1.30") == -1) {

      return;
    }

    if (NVR.getLogin().enableLowBandwidth)
      return;

    var status = [$translate.instant('kMonIdle'),
      $translate.instant('kMonPreAlarm'),
      $translate.instant('kMonAlarmed'),
      $translate.instant('kMonAlert'),
      $translate.instant('kMonRecord')
    ];
    //console.log ("Inside Modal timer...");
    var apiurl = NVR.getLogin().apiurl;
    var alarmurl = apiurl + "/monitors/alarm/id:" + $scope.monitorId + "/command:status.json?"+$rootScope.authSession;
    NVR.log("Invoking " + alarmurl);
    console.log ("ALARM = "+alarmurl);

    $http.get(alarmurl)
      .then(function (data) {
          //  NVR.debug ("Success in monitor alarmed status " + JSON.stringify(data));

          $scope.monStatus = status[parseInt(data.data.status)];

        },
        function (error) {

          $scope.monStatus = "";
          NVR.debug("Error in monitor alarmed status ");
        });

  }

  //-------------------------------------------------------------
  // Enable/Disable preset list
  //-------------------------------------------------------------

  $scope.togglePresets = function () {
    $scope.presetOn = !$scope.presetOn;

    if ($scope.presetOn) {
      $scope.controlToggle = "hide buttons";
    } else {
      $scope.controlToggle = "show buttons";
    }
    //console.log("Changing preset to " + $scope.presetOn);

    var element = angular.element(document.getElementById("presetlist"));
    // bring it in
    if ($scope.presetOn) {
      element.removeClass("animated fadeOutUp");

    } else {
      element.removeClass("animated fadeInDown");
      element.addClass("animated fadeOutUp");
    }

  };


  $scope.saveZones = function () {
    var str = "";
    for (var i = 0; i < originalZones.length; i++) {
      str = str + "o:" + originalZones[i].coords + "<br/>n:" + $scope.zoneArray[i].coords + "--------------------------------------------------<br/>";

    }

    $rootScope.zmPopup = SecuredPopups.show('confirm', {
      title: 'Sure',
      template: str,
      okText: $translate.instant('kButtonOk'),
      cancelText: $translate.instant('kButtonCancel'),
    });

  };

  $scope.changeCircleSize = function () {
    $scope.csize = Math.max(($scope.csize + 5) % 31, 10);

  };

  $scope.toggleZoneEdit = function () {
    $scope.isZoneEdit = !$scope.isZoneEdit;


    $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();


    if ($scope.isZoneEdit) {
      $ionicScrollDelegate.$getByHandle("imgscroll").zoomTo(1, true);
      $scope.imageZoomable = false;
      //document.getElementById("imgscroll").zooming="false";

      for (var i = 0; i < $scope.circlePoints.length; i++) {
        var t = document.getElementById("circle-" + i);
        if (t) {
          t.removeEventListener("touchstart", moveStart);
          t.removeEventListener("mousedown", moveStart);
          //t.removeEventListener("mousemove",moveContinue);
          //t.removeEventListener("mouseup",moveStop);


          t.addEventListener("touchstart", moveStart);
          t.addEventListener("mousedown", moveStart);
          //t.addEventListener("mousemove",moveContinue);
          //t.addEventListener("mouseup",moveStop);


          //console.log ("Found circle-"+i);   
        } else {
          // console.log ("did not find circle-"+i);
        }

      }
    } else // get out of edit
    {

      $scope.imageZoomable = true;
    }

  };

  $scope.toggleZone = function () {
    $scope.showZones = !$scope.showZones;
    if (!$scope.showZones)
      $scope.isZoneEdit = false;
  };

  $scope.imageLoaded = function () {
    imageLoaded();
  };

  $scope.checkZoom = function () {
    //var z = $ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom;
    //imageLoaded();

  };

  $scope.circleTouch = function (evt) {
    // console.log ("TOUCH");
  };

  //$scope.circleOnDrag = function (evt, ndx)
  function recomputePolygons(ax, ay, ndx, z) {


    // we get screen X/Y - need to translate
    // to SVG points
    //console.log ("recompute with",ax,"&",ay);
    var svg = document.getElementById('zsvg');
    var pt = svg.createSVGPoint();
    pt.x = ax;
    pt.y = ay;
    var svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    $scope.circlePoints[ndx].x = Math.round(svgP.x);
    $scope.circlePoints[ndx].y = Math.round(svgP.y);

    // get related polygon set
    var zi = $scope.circlePoints[ndx].zoneIndex;
    var newPoints = "";
    for (var i = 0; i < $scope.circlePoints.length; i++) {
      if ($scope.circlePoints[i].zoneIndex == zi) {
        newPoints = newPoints + " " + $scope.circlePoints[i].x + "," + $scope.circlePoints[i].y;
      }
      //console.log ("recomputed polygon:", newPoints);
    }
    // console.log ("OLD ZONE FOR:"+zi+" is "+$scope.zoneArray[zi].coords );
    //console.log ("NEW ZONE FOR:"+zi+" is "+newPoints);
    $scope.zoneArray[zi].coords = newPoints;

    //console.log ("INDEX="+ndx+" DRAG="+svgP.x+":"+svgP.y);

  }

  // credit: http://stackoverflow.com/questions/41411891/most-elegant-way-to-parse-scale-and-re-string-a-string-of-number-co-ordinates?noredirect=1#41411927
  // This function scales coords of zones based on current image size
  function scaleCoords(string, sx, sy) {
    var f = [sx, sy];
    return string.split(' ').map(function (a) {
      return a.split(',').map(function (b, i) {
        return Math.round(b * f[i]);
      }).join(',');
    }).join(' ');
  }

  function moveContinue(event) {
    if (!_moveStart) {
      return;
    }

    // console.log ("CONTINUE: target id="+targetID);


    /*if(event.preventDefault) event.preventDefault();
    if (event.gesture) event.gesture.preventDefault() ;
    if (event.gesture) event.gesture.stopPropagation();*/

    var x, y;

    var z = $ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom;
    // console.log ("zoom is:"+z);

    //console.log(event, this, "t");
    if (event.touches) {
      //console.log ("TOUCH");
      x = event.targetTouches[0].pageX;
      y = event.targetTouches[0].pageY;

    } else {
      //console.log ("MOUSE");
      x = event.clientX;
      y = event.clientY;


    }


    // console.log ("X="+x+" Y="+y + " sl="+document.body.scrollLeft+ " sy="+document.body.scrollTop);
    $timeout(function () {
      recomputePolygons(x, y, targetID, 1);
    });


  }

  function moveStop(event) {
    _moveStart = false;
    // console.log ("STOP");
  }

  function moveStart(event) {

    _moveStart = true;
    targetID = event.target.id.substring(7);
    // console.log ("START: target id="+targetID);

    if (event.preventDefault) event.preventDefault();
    if (event.gesture) event.gesture.preventDefault();
    if (event.gesture) event.gesture.stopPropagation();

    var z = $ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom;
    //console.log ("zoom is:"+z);

    var x, y;
    // perhaps event.targetTouches[0]?
    if (event.touches) {
      //console.log(event.changedTouches[0], this, "t");
      x = event.touches[0].pageX;
      y = event.touches[0].pageY;

    } else {
      //console.log(event, this, "t");
      x = event.clientX;
      y = event.clientY;

    }
    //console.log ("X="+x+" Y="+y + " sl="+document.body.scrollLeft+ " sy="+document.body.scrollTop);

  }


  // called when the live monitor image loads
  // this is a good time to calculate scaled zone points
  function imageLoaded() {

    currentStreamState = streamState.SNAPSHOT;

    if ($scope.animationInProgress) return;
    /*
    var img = document.getElementById("singlemonitor");
    $scope.cw = img.naturalWidth;
    $scope.ch = img.naturalHeight;

    
    $scope.zoneArray = [];
    $scope.circlePoints = [];

    var ow = $scope.monitor.Monitor.Width;
    var oh = $scope.monitor.Monitor.Height;*/

    // console.log ("MONITOR IS: "+JSON.stringify($scope.monitor));

    // console.log ("ORIGINAL WH="+ow+"x"+oh);

    /*for (var i = 0; i < originalZones.length; i++) {
      var sx = $scope.cw / ow;
      var sy = $scope.ch / oh;
      $scope.zoneArray.push({
        coords: originalZones[i].coords,
        type: originalZones[i].type
      });


    }*/

    // now create a points array for circle handles

    /* for (i = 0; i < $scope.zoneArray.length; i++) {
      //jshint loopfunc: true 
      $scope.zoneArray[i].coords.split(' ')
        .forEach(function (itm) {
          var o = itm.split(',');
          $scope.circlePoints.push({
            x: o[0],
            y: o[1],
            zoneIndex: i
          });

          // console.log ("CIRCLE X="+o[0]+"Y="+o[1]);
        });

  }*/

    $scope.isModalStreamPaused = false;
    //NVR.debug("Modal image loaded, switching to streaming");





  }


  //-------------------------------------------------------------
  // Send PTZ command to ZM
  // Note: PTZ fails on desktop, don't bother about it
  //-------------------------------------------------------------

  $scope.controlPTZ = function (monitorId, cmd) {

    if (cmd == "special-hide-unhide") {
      hideUnhidePresets();
      return;
    }
    //console.log ("PTZ command is"+cmd);
    controlPTZ(monitorId, cmd);
  };

  function hideUnhidePresets() {
    //console.log ("**********HIDEUNHIDE");
    $scope.ptzButtonsShown = !$scope.ptzButtonsShown;

    if ($scope.ptzPresets.length > 0) {
      dirn = $scope.ptzButtonsShown ? "up" : "down";

      $scope.ptzPresets[0].icon = "ion-chevron-" + dirn;
    }

  }

  function controlPTZ(monitorId, cmd) {

    //presetGotoX
    //presetHome
    //curl -X POST "http://server.com/zm/index.php?view=request" -d
    //"request=control&user=admin&passwd=xx&id=4&control=moveConLeft"

    if ($scope.ptzMoveCommand == "undefined") {
      $ionicLoading.show({
        template: $translate.instant('kPTZNotReady'),
        noBackdrop: true,
        duration: 2000,
      });
      return;
    }

    var ptzData = "";
    if (cmd.lastIndexOf("preset", 0) === 0) {
      NVR.debug("PTZ command is a preset, so skipping xge/lge");
      ptzData = {
        view: "request",
        request: "control",
        id: monitorId,
        control: cmd,
        //  xge: "30", //wtf
        //  yge: "30", //wtf
      };

    } else {

      ptzData = {
        view: "request",
        request: "control",
        id: monitorId,
        control: cmd,
        xge: "30", //wtf
        yge: "30", //wtf
      };
    }

    if ($rootScope.authSession.indexOf("&token=")!=-1) {
      ptzData.token=$rootScope.authSession.match(/&token=([^&]*)/)[1];
    }


    //console.log("Command value " + cmd + " with MID=" + monitorId);
    //console.log("PTZDATA is " + JSON.stringify(ptzData));
    $ionicLoading.hide();
    $ionicLoading.show({
      template: $translate.instant('kPleaseWait') + "...",
      noBackdrop: true,
      duration: zm.loadingTimeout,
    });

    var loginData = NVR.getLogin();
    $ionicLoading.hide();
    $ionicLoading.show({
      template: $translate.instant('kSendingPTZ') + "...",
      noBackdrop: true,
      duration: zm.loadingTimeout,
    });

    var req = $http({
      method: 'POST',
      /*timeout: 15000,*/
      url: loginData.url + '/index.php',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      transformRequest: function (obj) {
        var str = [];
        for (var p in obj)
          str.push(encodeURIComponent(p) + "=" +
            encodeURIComponent(obj[p]));
        var foo = str.join("&");
        //console.log("****PTZ RETURNING " + foo);
        return foo;
      },

      data: ptzData

    });

    req.then(function (resp) {
        //console.log("SUCCESS: " + JSON.stringify(resp));
        $ionicLoading.hide();

      },
      function (resp) {
        $ionicLoading.hide();
        //console.log("ERROR: " + JSON.stringify(resp));
        NVR.log("Error sending PTZ:" + JSON.stringify(resp), "error");
      });


  }

  $scope.getZoomLevel = function () {
    //console.log("ON RELEASE");
    var zl = $ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition();
    //console.log(JSON.stringify(zl));
  };

  $scope.onTap = function (m, d) {

    moveToMonitor(m, d);
  };

  $scope.onSwipe = function (m, d) {
    if ($scope.isZoneEdit) {
      NVR.log("swipe disabled as you are in edit mode");
      return;
    }
    var ld = NVR.getLogin();
    if (!ld.canSwipeMonitors) return;

    if ($ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom != 1) {
      //console.log("Image is zoomed in - not honoring swipe");
      return;
    }
    $scope.monStatus = "";
    moveToMonitor(m, d);

  };

  function moveToMonitor(m, d) {


    if ($scope.isZoneEdit) {
      NVR.log("Not cycling, as you are editing zones");
      return;
    }

    if ($scope.monitors.length <= 1) {
      NVR.log("Not cycling, as you only have at most 1 monitors");
      return;
    }



    $scope.animationInProgress = true;
    var curstate = $ionicHistory.currentStateName();
    var found = 0;
    var mid;
    mid = NVR.getNextMonitor(m, d);

    $scope.showPTZ = false;

    // FIXME: clean this up - in a situation where
    // no monitors are enabled, will it loop for ever?
    do {
      mid = NVR.getNextMonitor(m, d);
      m = mid;
      //console.log("Next Monitor is " + m);

      found = 0;
      for (var i = 0; i < $scope.monitors.length; i++) {
        if ($scope.monitors[i].Monitor.Id == mid &&
          // if you came from monitors, then ignore noshow
          ($scope.monitors[i].Monitor.listDisplay != 'noshow' || curstate == "monitors") &&
          $scope.monitors[i].Monitor.Function != 'None' &&
          $scope.monitors[i].Monitor.Enabled != '0') {
          found = 1;
          //console.log(mid + "is part of the monitor list");
          NVR.debug("ModalCtrl: swipe detected, moving to " + mid);
          break;
        } else {
          NVR.debug("skipping " + $scope.monitors[i].Monitor.Id +
            " listDisplay=" + $scope.monitors[i].Monitor.listDisplay +
            " Function=" + $scope.monitors[i].Monitor.Function +
            " Enabled=" + $scope.monitors[i].Monitor.Enabled);
        }
      }

    }
    while (found != 1);

    // now kill stream and set up next
    NVR.debug("Killing stream before we move on to next monitor...");

    $scope.isModalStreamPaused = true;
    var element = angular.element(document.getElementById("monitorimage"));
    var slidein;
    var slideout;
    $timeout(function () {
      NVR.killLiveStream($scope.connKey, $scope.controlURL);

      // we should now have a paused stream, time to animate out



      var dirn = d;
      if (dirn == 1) {
        slideout = "animated slideOutLeft";
        slidein = "animated slideInRight";
      } else {
        slideout = "animated slideOutRight";
        slidein = "animated slideInLeft";
      }


      element.addClass(slideout)
        .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', outWithOld);
    });




    function outWithOld() {

      NVR.log(">>>Old image out");
      // NVR.log("ModalCtrl:Stopping network pull...");
      //NVR.stopNetwork("MonitorModal-outwithOld");
      $scope.rand = Math.floor((Math.random() * 100000) + 1);


      $timeout(function () {
        element.removeClass(slideout);
        element.addClass(slidein)
          .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', inWithNew);

        $scope.monitorId = mid;
        $scope.monitorName = NVR.getMonitorName(mid);
        $scope.monitor = NVR.getMonitorObject(mid);
        $scope.controlURL = $scope.monitor.Monitor.controlURL;
        $scope.zoneArray = [];
        $scope.circlePoints = [];
        // getZones();
        configurePTZ($scope.monitorId);
      }, 200);
    }

    function inWithNew() {

      element.removeClass(slidein);

      $scope.isModalStreamPaused = false;


      var ld = NVR.getLogin();
      carouselUtils.setStop(false);
      $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString(); // get new key for new id
      $scope.animationInProgress = false; // has to be AFTER new connkey
      NVR.log("<<<New image loaded in with ck:" + $scope.connKey);
    }

    $ionicLoading.hide();

  }

  //-----------------------------------------------------------------------
  // Sucess/Error handlers for saving a snapshot of the
  // monitor image to phone storage
  //-----------------------------------------------------------------------

  function SaveSuccess() {
    $ionicLoading.show({
      template: $translate.instant('kDone'),
      noBackdrop: true,
      duration: 3000
    });
    NVR.debug("ModalCtrl:Photo saved successfuly");
  }

  function SaveError(e) {
    $ionicLoading.show({
      template: $translate.instant('kErrorSave'),
      noBackdrop: true,
      duration: 3000
    });
    NVR.log("Error saving image: " + e);
    //console.log("***ERROR");
  }

  //-------------------------------------------------------------
  // Turns on or off an alarm forcibly (mode true = on, false = off)
  //-------------------------------------------------------------
  $scope.triggerAlarm = function (mid, mode) {

    if (mode == 'on') // trigger alarm
    {
      $rootScope.zmPopup = SecuredPopups.show('show', {
        title: 'Confirm',
        template: $translate.instant('kForceAlarmConfirm') + $scope.monitorName + "?",
        buttons: [{
            text: $translate.instant('kButtonYes'),
            onTap: function (e) {
              triggerAlarm(mid, mode);
            }
          },
          {
            text: $translate.instant('kButtonNo'),
            onTap: function (e) {
              return;
            }
          }
        ]

      });
    } else
      triggerAlarm(mid, mode);

    function triggerAlarm(mid, mode) {
      var apiurl = NVR.getLogin().apiurl;
      var c = mode == 'on' ? 'on' : 'off';
      var alarmurl = apiurl + "/monitors/alarm/id:" + mid + "/command:" + c + ".json?"+$rootScope.authSession;
      NVR.log("Invoking " + alarmurl);
      

      var status = mode ? $translate.instant('kForcingAlarm') : $translate.instant('kCancellingAlarm');
      $ionicLoading.show({
        template: status,
        noBackdrop: true,
        duration: zm.largeHttpTimeout,
      });

      $http.get(alarmurl)
        .then(function (data) {
            $ionicLoading.show({
              template: $translate.instant('kSuccess'),
              noBackdrop: true,
              duration: 2000,
            });


          },
          function (error) {

            $ionicLoading.show({
              template: $translate.instant('kAlarmAPIError'),
              noBackdrop: true,
              duration: 3000,
            });
            NVR.debug("Error in triggerAlarm " + JSON.stringify(error));
          });
    }

  };

  //-----------------------------------------------------------------------
  // color for monitor state
  //-----------------------------------------------------------------------

  $scope.stateColor = function () {
    var status = [$translate.instant('kMonIdle'),
      $translate.instant('kMonPreAlarm'),
      $translate.instant('kMonAlarmed'),
      $translate.instant('kMonAlert'),
      $translate.instant('kMonRecord')
    ];
    //console.log ("***MONSTATUS**"+$scope.monStatus+"**");
    var color = "";
    switch ($scope.monStatus) {
      case "":
        color = "none";
        break;
      case status[0]:
        color = "#4B77BE";
        break;
      case status[1]:
        color = "#e67e22";
        break;
      case status[2]:
        color = "#D91E18";
        break;
      case status[3]:
        color = "#e67e22";
        break;
      case status[4]:
        color = "#26A65B";
        break;
    }

    return color;
  };

  //-----------------------------------------------------------------------
  // Saves a snapshot of the monitor image to phone storage
  //-----------------------------------------------------------------------

  $scope.saveImageToPhoneWithPerms = function (mid) {
    if ($rootScope.platformOS != 'android') {
      saveImageToPhone(mid);
      return;
    }

    NVR.debug("ModalCtrl: Permission checking for write");
    var permissions = cordova.plugins.permissions;
    permissions.hasPermission(permissions.WRITE_EXTERNAL_STORAGE, checkPermissionCallback, null);

    function checkPermissionCallback(status) {
      if (!status.hasPermission) {
        SaveError("No permission to write to external storage");
      }
      permissions.requestPermission(permissions.WRITE_EXTERNAL_STORAGE, succ, err);
    }

    function succ(s) {
      saveImageToPhone(mid);
    }

    function err(e) {
      SaveError("Error in requestPermission");
    }
  };

  function saveImageToPhone(mid) {
    $ionicLoading.show({
      template: $translate.instant('kSavingSnapshot') + '...',
      noBackdrop: true,
      duration: zm.httpTimeout
    });

    NVR.debug("ModalCtrl: SaveImageToPhone called");
    var canvas, context, imageDataUrl, imageData;
    var loginData = NVR.getLogin();
    var url = loginData.streamingurl +
      '/zms?mode=single&monitor=' + mid;
      url += $rootScope.authSession;

  
    url += NVR.insertBasicAuthToken();

    NVR.log("SavetoPhone:Trying to save image from " + url);

    if ($rootScope.platformOS != 'desktop') {
      var album = 'zmNinja';
      NVR.debug("Trying to save image to album: " + album);
      cordova.plugins.photoLibrary.requestAuthorization(
        function () {
          //url = "https://picsum.photos/200/300/?random";

          var fileTransfer = new FileTransfer();
          var urle = encodeURI(url);
          var fname = "zmninja.jpg";

          fileTransfer.download(urle, cordova.file.dataDirectory + fname,
            function (entry) {
              NVR.debug("local download complete: " + entry.toURL());
              NVR.debug("Now trying to move it to album");
              cordova.plugins.photoLibrary.saveImage(entry.toURL(), album,
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
              NVR.debug("error downloading:" + JSON.stringify(err));
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

      $ionicLoading.hide();
      //SaveSuccess();

      $rootScope.zmPopup = SecuredPopups.show('alert', {
        title: $translate.instant('kNote'),
        template: $translate.instant('kDownloadVideoImage') + "<br/><br/><center><a href='" + url + "' class='button button-assertive icon ion-android-download' download=\"balls.jpg\">" + " " + $translate.instant('kDownload') + "</a></center>",
        okText: $translate.instant('kDismiss'),
        okType: 'button-stable'
      });

    }

  }


  $scope.constructSingleStream = function () {

    var  ld = NVR.getLogin();

    var scale = (currentStreamState == streamState.SNAPSHOT_LOWQUALITY) ? '10':$scope.quality;

    var stream;
    var fps =ld.singleliveFPS;
    stream = $scope.monitor.Monitor.streamingURL +
      "/nph-zms?mode=" + getSingleStreamMode() +
      "&monitor=" + $scope.monitorId +
      "&scale=" + scale;

    if (fps) {
      stream +='&maxfps='+fps;
    }
    stream += $rootScope.authSession +
      appendSingleStreamConnKey();

      if (currentStreamState != streamState.SNAPSHOT_LOWQUALITY)
        stream += "&rand=" + $rootScope.modalRand + "&buffer="+ld.liveStreamBuffer;

    //console.log ("STREAM="+stream);

    if (stream) stream += NVR.insertBasicAuthToken();
    return stream;


  };


  function getSingleStreamMode() {
    if (currentStreamState == streamState.SNAPSHOT_LOWQUALITY) return 'single';
    return $scope.isModalStreamPaused ? 'single' : 'jpeg';
  }

  function appendSingleStreamConnKey() {
    return $scope.isModalStreamPaused ? "" : "&connkey=" + $scope.connKey;

  }

  //-------------------------------------------------------------
  //reloaads mon - do we need it?
  //-------------------------------------------------------------

  $scope.reloadView = function () {
    NVR.log("Reloading view for modal view, recomputing rand");
    $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);
    $scope.isModalActive = true;
  };

  $scope.scaleImage = function () {

    $scope.imageFit = !$scope.imageFit;
    if ($scope.imageFit)
      $scope.aspectFit = "xMidYMid meet";
    else
      $scope.aspectFit = "xMidYMid slice";

    // console.log("Switching image style to " + $scope.imageFit);
  };

  $scope.$on('$ionicView.enter', function () {

    //https://server/zm/api/zones/forMonitor/X.json

  });

  $scope.$on('$ionicView.leave', function () {
    // console.log("**MODAL: Stopping modal timer");
    $scope.isModalActive = false;
    $interval.cancel(intervalModalHandle);
    $interval.cancel(cycleHandle);
  });

  $scope.$on('$ionicView.beforeLeave', function () {

    NVR.log("Nullifying the streams...");

    var element = document.getElementById("singlemonitor");
    if (element) {
      NVR.debug("Nullifying  " + element.src);
      element.src = "";
    }

  });

  $scope.$on('$ionicView.unloaded', function () {
    $scope.isModalActive = false;

    $interval.cancel(intervalModalHandle);
    $interval.cance(cycleHandle);

  });

  $scope.$on('modal.removed', function () {


    if ($rootScope.platformOS == 'android') {
      NVR.debug("Deregistering handlers for multi-window");

      window.MultiWindowPlugin.deregisterOnStop("monitormodal-pause");
      window.MultiWindowPlugin.deregisterOnStart("monitormodal-resume");

    }

    if ($rootScope.platformOS == 'desktop') {
      NVR.debug("Removing keyboard handler");
      window.removeEventListener('keydown', keyboardHandler, true);

    }
    as(); // dregister auth success
    $scope.isModalActive = false;

    if (1 || $rootScope.platformOS != 'ios') {

      // ios calls window stop...
      NVR.debug("Single monitor exited killing stream");
      NVR.killLiveStream($scope.connKey, $scope.controlURL);
    } else {

      NVR.debug("Webkit hack, hammering window.stop();");
      NVR.stopNetwork();
    }

    //console.log("**MODAL REMOVED: Stopping modal timer");
    $interval.cancel(intervalModalHandle);
    $interval.cancel(cycleHandle);

    // NVR.debug("Modal removed - killing connkey");
    // controlStream(17, "", $scope.connKey, -1);

    // Execute action
  });

  //-------------------------------------------------------------
  // called to kill connkey, not sure if we really need it
  // I think we are calling window.stop() which is a hammer
  // anyway 
  //-------------------------------------------------------------

  function controlStream(cmd, disp, connkey, ndx) {
    // console.log("Command value " + cmd);

    if (disp) {
      $ionicLoading.hide();
      $ionicLoading.show({
        template: $translate.instant('kPleaseWait') + '...',
        noBackdrop: true,
        duration: zm.loadingTimeout,
      });
    }
    var loginData = NVR.getLogin();

    /*
    var CMD_NONE = 0;
    var CMD_PAUSE = 1;
    var CMD_PLAY = 2;
    var CMD_STOP = 3;
    var CMD_FASTFWD = 4;
    var CMD_SLOWFWD = 5;
    var CMD_SLOWREV = 6;
    var CMD_FASTREV = 7;
    var CMD_ZOOMIN = 8;
    var CMD_ZOOMOUT = 9;
    var CMD_PAN = 10;
    var CMD_SCALE = 11;
    var CMD_PREV = 12;
    var CMD_NEXT = 13;
    var CMD_SEEK = 14;
    var CMD_QUIT = 17;
    var CMD_QUERY = 99;
    */

   // var myauthtoken='';

    var data_payload = {
      view: "request",
      request: "stream",
      connkey: connkey,
      command: cmd
    };

    if ($rootScope.authSession.indexOf("&auth=")!=-1) {
      data_payload.auth=$rootScope.authSession.match(/&auth=([^&]*)/)[1];
    }
    else if ($rootScope.authSession.indexOf("&token=")!=-1) {
      data_payload.token=$rootScope.authSession.match(/&token=([^&]*)/)[1];
    }

    var req = $http({
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
        //console.log("****CONTROL RETURNING " + foo);
        return foo;
      },

      data: data_payload
    });
    req.then(function (resp) {

        resp = resp.data;
        if (resp.result == "Ok" && ndx != -1) {
          var ld = NVR.getLogin();
          var apiurl = ld.apiurl + "/events/" + resp.status.event + ".json?"+$rootScope.authSession;
          //console.log ("API " + apiurl);
          $http.get(apiurl)
            .then(function (data) {
                data = data.data;
                if ($scope.MontageMonitors[ndx].eventUrlTime != data.event.Event.StartTime) {

                  var element = angular.element(document.getElementById($scope.MontageMonitors[ndx].Monitor.Id + "-timeline"));
                  element.removeClass('animated slideInRight');
                  element.addClass('animated slideOutRight');
                  $timeout(function () {
                    element.removeClass('animated slideOutRight');
                    element.addClass('animated slideInRight');
                    $scope.MontageMonitors[ndx].eventUrlTime = data.event.Event.StartTime;
                  }, 300);

                }

              },
              function (data) {
                $scope.MontageMonitors[ndx].eventUrlTime = "-";
              });

        }

      },

      function (resp) {
        //console.log("ERROR: " + JSON.stringify(resp));
        NVR.log("Error sending event command " + JSON.stringify(resp), "error");
      });


  }

  $scope.toggleListMenu = function () {


    $scope.isToggleListMenu = !$scope.isToggleListMenu;
    //console.log ("isToggleListMenu:"+$scope.isToggleListMenu);
  };

  //-------------------------------------------------------------
  // Zoom in and out via +- for desktops
  //-------------------------------------------------------------
  $scope.zoomImage = function (val) {

    if ($scope.isZoneEdit) {
      $ionicLoading.show({
        //template: $translate.instant('kError'),
        template: 'zoom disabled in zone edit mode',
        noBackdrop: true,
        duration: 2000
      });

      return;
    }
    var zl = parseInt($ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom);
    if (zl == 1 && val == -1) {
      NVR.debug("Already zoomed out max");
      return;
    }

    zl += val;
    NVR.debug("Zoom level is " + zl);
    $ionicScrollDelegate.$getByHandle("imgscroll").zoomTo(zl, true);

  };

  //-------------------------------------------------------------
  // Retrieves PTZ state for each monitor
  //-------------------------------------------------------------
  // make sure following are correct:
  // $scope.isControllable 
  // $scope.controlid
  // 
  function configurePTZ(mid) {
    $scope.presetAndControl = $translate.instant('kMore');
    $scope.ptzWakeCommand = "";
    $scope.ptzSleepCommand = "";
    $scope.ptzResetCommand = "";

    $scope.ptzMoveCommand = "undefined";
    $scope.ptzStopCommand = "";

    $scope.zoomInCommand = "";
    $scope.zoomOutCommand = "";
    $scope.zoomStopCommand = "zoomStop";
    $scope.canZoom = false;

    $scope.presetOn = true;
    $scope.controlToggle = "hide buttons";

    NVR.debug("configurePTZ: called with mid=" + mid);
    var ld = NVR.getLogin();
    var url = ld.apiurl + "/monitors/" + mid + ".json?"+$rootScope.authSession;
    $http.get(url)
      .then(function (data) {
          data = data.data;
          $scope.isControllable = data.monitor.Monitor.Controllable;

          // *** Only for testing - comment out //
          //$scope.isControllable = '1';
          // for testing only
          // $scope.isControllable = 1;
          $scope.controlid = data.monitor.Monitor.ControlId;
          if ($scope.isControllable == '1') {

            var apiurl = NVR.getLogin().apiurl;
            var myurl = apiurl + "/controls/" + $scope.controlid + ".json?"+$rootScope.authSession;
            NVR.debug("configurePTZ : getting controllable data " + myurl);

            $http.get(myurl)
              .then(function (data) {
                  data = data.data;
                  // *** Only for testing - comment out  - start//
                  /*data.Control.Control.CanSleep = '1';
                  data.Control.Control.CanWake = '1';
                  data.Control.Control.CanReset = '1';
                  data.Control.Control.CanZoom = '1';
                  data.control.Control.HasPresets = '1';
                  data.control.Control.HasHomePreset = '1';*/
                  // *** Only for testing - comment out - end //


                  //data.control.Control.HasPresets = '1';
                  //data.control.Control.HasHomePreset = '1'


                  $scope.ptzMoveCommand = "move"; // start with as move;
                  $scope.ptzStopCommand = "";

                  // console.log ("GOT CONTROL "+JSON.stringify(data.control.Control));

                  if (data.control.Control.CanZoom == '1') {
                    $scope.canZoom = true;
                    if (data.control.Control.CanZoomCon == '1') {
                      $scope.zoomInCommand = "zoomConTele";
                      $scope.zoomOutCommand = "zoomConWide";

                    } else if (data.control.Control.CanZoomRel == '1') {
                      $scope.zoomInCommand = "zoomRelTele";
                      $scope.zoomOutCommand = "zoomRelWide";
                    } else if (data.control.Control.CanZoomAbs == '1') {
                      $scope.zoomInCommand = "zoomRelAbs";
                      $scope.zoomOutCommand = "zoomRelAbs";
                    }
                  }

                  NVR.debug("configurePTZ: control data returned " + JSON.stringify(data));


                  if (data.control.Control.CanMoveMap == '1') {

                    //seems moveMap uses Up/Down/Left/Right, 
                    // so no prefix
                    $scope.ptzMoveCommand = "";
                    $scope.ptzStopCommand = "moveStop";
                    // console.log ("MoveAbs set");
                  }

                  if (data.control.Control.CanMoveAbs == '1') {

                    $scope.ptzMoveCommand = "moveAbs";
                    $scope.ptzStopCommand = "moveStop";
                    //  console.log ("MoveAbs set");
                  }

                  if (data.control.Control.CanMoveRel == '1') {

                    $scope.ptzMoveCommand = "moveRel";
                    $scope.ptzStopCommand = "moveStop";
                  }



                  // Prefer con over rel if both enabled
                  // I've tested con

                  if (data.control.Control.CanMoveCon == '1') {

                    $scope.ptzMoveCommand = "moveCon";
                    $scope.ptzStopCommand = "moveStop";
                  }
                  //CanMoveMap

                  // presets
                  NVR.debug("ConfigurePTZ Preset value is " + data.control.Control.HasPresets);
                  $scope.ptzPresets = [];




                  if (data.control.Control.HasPresets == '1') {
                    //$scope.presetAndControl = $translate.instant('kPresets');

                    $scope.ptzPresetCount = parseInt(data.control.Control.NumPresets);
                    //$scope.ptzPresetCount =80;

                    NVR.debug("ConfigurePTZ Number of presets is " + $scope.ptzPresetCount);

                    for (var p = 0; p < $scope.ptzPresetCount; p++) {
                      $scope.ptzPresets.push({
                        name: (p + 1).toString(),
                        icon: '',
                        cmd: "presetGoto" + (p + 1).toString(),
                        style: 'button-royal'
                      });

                    }

                    if (data.control.Control.HasHomePreset == '1') {
                      $scope.ptzPresets.unshift({
                        name: '',
                        icon: "ion-ios-home",
                        cmd: 'presetHome',
                        style: 'button-royal'
                      });

                    }

                    /* MAKE SURE THIS IS THE FIRST ICON */
                    $scope.ptzPresets.unshift({
                      // name: 'W',
                      icon: "ion-chevron-up",
                      cmd: 'special-hide-unhide',
                      style: 'button-royal button-dark ',
                    });


                  }
                  /*else
                  {
                      $scope.presetAndControl = $translate.instant('kMore');
                  }*/
                  // lets add these to the end
                  // strictly speaking, they aren't really presets, but meh for now

                  // no need to darken these buttons if presets are not there
                  var buttonAccent = "button-dark";
                  if ($scope.ptzPresets.length == 0) {
                    buttonAccent = "";
                  }

                  if (data.control.Control.CanWake == '1') {

                    $scope.ptzPresets.push({
                      name: 'W',
                      icon: "ion-eye",
                      cmd: 'wake',
                      style: 'button-royal ' + buttonAccent
                    });

                  }

                  if (data.control.Control.CanSleep == '1') {
                    $scope.ptzPresets.push({
                      name: 'S',
                      icon: "ion-eye-disabled",
                      cmd: 'sleep',
                      style: 'button-royal ' + buttonAccent
                    });

                  }

                  if (data.control.Control.CanReset == '1') {
                    $scope.ptzPresets.push({
                      name: 'R',
                      icon: "ion-ios-loop-strong",
                      cmd: 'reset',
                      style: 'button-royal ' + buttonAccent
                    });

                  }

                  NVR.log("ConfigurePTZ Modal: ControlDB reports PTZ command to be " + $scope.ptzMoveCommand);
                },
                function (data) {
                  //  console.log("** Error retrieving move PTZ command");
                  NVR.log("ConfigurePTZ : Error retrieving PTZ command  " + JSON.stringify(data), "error");
                });

          } else {
            NVR.log("configurePTZ " + mid + " is not PTZ controllable");
          }
        },
        function (data) {
          //  console.log("** Error retrieving move PTZ command");
          NVR.log("configurePTZ : Error retrieving PTZ command  " + JSON.stringify(data), "error");
        });

  }

  function getZones() {
    //https://server/zm/api/zones/forMonitor/7.json
    var api = NVR.getLogin().apiurl + "/zones/forMonitor/" + $scope.monitorId + ".json?"+$rootScope.authSession;
    NVR.debug("Getting zones using:" + api);
    originalZones = [];
    $http.get(api)
      .then(function (succ) {
          // console.log (JSON.stringify(succ));
          for (var i = 0; i < succ.data.zones.length; i++) {
            originalZones.push({
              coords: succ.data.zones[i].Zone.Coords,
              area: succ.data.zones[i].Zone.Area,
              type: succ.data.zones[i].Zone.Type
            });
          }

        },
        function (err) {
          NVR.debug("Error getting zones :" + JSON.stringify(err));

        });

  }

  $scope.showHideControls = function () {
    $scope.displayControls = !$scope.displayControls;
    NVR.debug ('control display is:'+$scope.displayControls);
  };

  $scope.$on('modal.shown', function () {

    $scope.displayControls = true;
    if (0 && $rootScope.platformOS == 'ios') {
      NVR.debug("Webkit hack, hammering window.stop();");
      NVR.stopNetwork();
    }

    $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
    $scope.monStatus = "";
    $scope.isToggleListMenu = true;
    //console.log (">>>>>>>>>>>>>>>>>>>STOOOP");

    if ($rootScope.platformOS != 'android') {

      document.addEventListener("pause", onPause, false);
      document.addEventListener("resume", onResume, false);

    } else {
      NVR.debug("MonitorModal: Android detected, using cordova-multiwindow plugin for onStop/onStart instead");
      window.MultiWindowPlugin.registerOnStop("monitormodal-pause", onPause);
      window.MultiWindowPlugin.registerOnStart("monitormodal-resume", onResume);
    }


    $scope.showZones = false;

    //getZones();

    var ld = NVR.getLogin();
    //currentEvent = $scope.currentEvent;

    //console.log ("************* GENERATED CONNKEY " + $scope.connKey);
    $scope.currentFrame = 1;
    $scope.monStatus = "";
    $scope.isCycle = ld.cycleMonitors;
    $scope.cycleText = $scope.isCycle ? $translate.instant('kOn') : $translate.instant('kOff');

    $scope.quality = (NVR.getBandwidth() == "lowbw") ? zm.monSingleImageQualityLowBW : ld.monSingleImageQuality;

    configurePTZ($scope.monitorId);

    if (ld.cycleMonitors) {
      NVR.debug("Cycling enabled at " + ld.cycleMonitorsInterval);

      $interval.cancel(cycleHandle);

      cycleHandle = $interval(function () {
        moveToMonitor($scope.monitorId, 1);
        //  console.log ("Refreshing Image...");
      }.bind(this), ld.cycleMonitorsInterval * 1000);

    }

  });

}]);
