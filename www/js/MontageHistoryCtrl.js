// Controller for the montage view
/* jshint -W041, -W093, -W083 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,ionic,Masonry,moment,Packery, Draggabilly, imagesLoaded, Chart */
// FIXME: This is a copy of montageCtrl - needs a lot of code cleanup
angular.module('zmApp.controllers').controller('zmApp.MontageHistoryCtrl', ['$scope', '$rootScope', 'NVR', 'message', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$ionicPopup', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$ionicPlatform', 'zm', '$ionicPopover', '$controller', 'imageLoadingDataShare', '$window', '$translate', 'qHttp', '$q', '$sce',function ($scope, $rootScope, NVR, message, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $ionicPopup, $stateParams, $ionicHistory, $ionicScrollDelegate, $ionicPlatform, zm, $ionicPopover, $controller, imageLoadingDataShare, $window, $translate, qHttp, $q, $sce) {
  var broadcastHandles = [];
  var isMultiPort = false;
  $scope.isMultiPort = isMultiPort;
  var areStreamsStopped = false;
  var viewCleaned = false;
  $scope.isScreenReady = false;




  //--------------------------------------------------------------------------------------
  // Handles bandwidth change, if required
  //
  //--------------------------------------------------------------------------------------
  var bc = $scope.$on("bandwidth-change", function (e, data) {
    // nothing to do for now
    // eventUrl will use lower BW in next query cycle
  });

  $scope.getLocalTZ = function () {
    return moment.tz.guess();
  };
  //--------------------------------------
  // formats events dates in a nice way
  //---------------------------------------
  $scope.prettifyDateTimeFirst = function (str) {
    if (NVR.getLogin().useLocalTimeZone)
      return moment.tz(str, NVR.getTimeZoneNow()).tz(moment.tz.guess()).format(NVR.getTimeFormat() + '/MMM Do');
    else
      return moment(str).format(NVR.getTimeFormat() + '/MMM Do');
  };
  $scope.prettifyDate = function (str) {
    return moment(str).format('MMM Do, YYYY ' + NVR.getTimeFormat());
  };

  
  $scope.prettifyTime = function (str) {
    if (NVR.getLogin().useLocalTimeZone)
      return moment.tz(str, NVR.getTimeZoneNow()).tz(moment.tz.guess()).format('h:mm a');
    else
      return moment(str).format('h:mm a');
  };
  $scope.prettify = function (str) {
    if (NVR.getLogin().useLocalTimeZone)
      return moment.tz(str, NVR.getTimeZoneNow()).tz(moment.tz.guess()).format(NVR.getTimeFormat() + ' on MMMM Do YYYY');
    else
      return moment(str).format(NVR.getTimeFormat() + ' on MMMM Do YYYY');
  };
  $scope.humanizeTime = function (str) {
    // if (NVR.getLogin().useLocalTimeZone)
    return moment.tz(str, NVR.getTimeZoneNow()).fromNow();
    //  else    
    //     return moment(str).fromNow();

  };
  // if you change date in footer, change hrs
  $scope.dateChanged = function () {
    $scope.datetimeValueFrom.hrs = Math.round(moment.duration(moment().diff(moment($scope.datetimeValueFrom.value))).asHours());
  };
  // if you change hrs in footer, change date 
  $scope.hrsChanged = function () {
    $scope.datetimeValueFrom.value = moment().subtract($scope.datetimeValueFrom.hrs, 'hours').toDate();
    timefrom.toDate();
  };

  
  //--------------------------------------
  // pause/unpause nph-zms
  //---------------------------------------
  $scope.togglePause = function (mid) {
    //console.log ("TOGGLE PAUSE " + mid);
    var m = -1;
    for (var i = 0; i < $scope.MontageMonitors.length; i++) {
      if ($scope.MontageMonitors[i].Monitor.Id == mid) {
        m = i;
        break;
      }
    }
    if (m != -1) {

      $scope.MontageMonitors[m].Monitor.isPaused = !$scope.MontageMonitors[m].Monitor.isPaused;
      var cmd = 1;
      NVR.debug("Sending CMD:" + cmd + " for monitor " + $scope.MontageMonitors[m].Monitor.Name);
      controlEventStream(cmd, "", $scope.MontageMonitors[m].Monitor.connKey, -1);
    }
  };

  function sendCmd(mid, cmd, extra) {

    var m = -1;
    for (var i = 0; i < $scope.MontageMonitors.length; i++) {
      if ($scope.MontageMonitors[i].Monitor.Id == mid) {
        m = i;
        break;
      }
    }
    if (m != -1) {
      NVR.debug("Sending CMD:" + cmd + " for monitor " + $scope.MontageMonitors[m].Monitor.Name);
      return controlEventStream(cmd, "", $scope.MontageMonitors[m].Monitor.connKey, -1, extra);
    }

  }
  $scope.seek = function (mid, p) {
    NVR.debug("Slider called with mid=" + mid + " progress=" + p);

    var m = -1;
    for (var i = 0; i < $scope.MontageMonitors.length; i++) {
      if ($scope.MontageMonitors[i].Monitor.Id == mid) {
        m = i;
        break;
      }
    }
    if (m != -1) {
      $scope.MontageMonitors[i].Monitor.seek = true;
    }

    sendCmd(mid, '14', "&offset=" + p)
      .then(function (success) {
          //console.log ("Removing seek status from "  + $scope.MontageMonitors[i].Monitor.Name);
          $scope.MontageMonitors[i].Monitor.seek = false;

        },
        function (err) {
          //console.log ("Removing seek status from "  + $scope.MontageMonitors[i].Monitor.Name);
          $scope.MontageMonitors[i].Monitor.seek = false;
        });

  };
  $scope.moveFaster = function (mid) {
    sendCmd(mid, 4);
  };
  $scope.moveSlower = function (mid) {
    sendCmd(mid, 5);
  };
  $scope.movePlay = function (mid) {

    var m = -1;
    for (var i = 0; i < $scope.MontageMonitors.length; i++) {
      if ($scope.MontageMonitors[i].Monitor.Id == mid) {
        m = i;
        break;
      }
    }
    if (m != -1) {
      $scope.MontageMonitors[m].Monitor.isPaused = false;
      var cmd = 2;
      NVR.debug("Sending CMD:" + cmd + " for monitor " + $scope.MontageMonitors[m].Monitor.Name);
      controlEventStream(cmd, "", $scope.MontageMonitors[m].Monitor.connKey, -1);
    }
  };
  //--------------------------------------
  // Called when ion-footer collapses
  // note that on init it is also called
  //---------------------------------------
  $scope.footerExpand = function () {
    // console.log ("**************** EXPAND CALLED ***************");
    $ionicSideMenuDelegate.canDragContent(false);
  };


  $scope.footerCollapse = function () {
    footerCollapse();
  };
  /* Note this is also called when the view is first loaded */
  function footerCollapse() {

    NVR.debug("Inside footerCollapse");
    if (readyToRun == false) {
      NVR.debug("fake call to footerCollapse - ignoring");
      return;
    }


    if ($scope.MontageMonitors == undefined) {
      NVR.debug("montage array is undefined and not ready");
      return;
    }

    $interval.cancel($rootScope.eventQueryInterval);
    $ionicLoading.show({
      template: $translate.instant('kPleaseWait'),
      noBackdrop: true,
      duration: zm.httpTimeout
    });

    $scope.dragBorder = "";
    $scope.isDragabillyOn = false;
    $ionicSideMenuDelegate.canDragContent(false);

    var apiurl;
    var ld = NVR.getLogin();
    $scope.sliderVal.realRate = $scope.sliderVal.rate * 100;

    var TimeObjectFrom = moment($scope.datetimeValueFrom.value).format("YYYY-MM-DD HH:mm");
    var TimeObjectTo = moment().format('YYYY-MM-DD HH:mm');

    // At this point of time, we need to ensure From and To are changed to server time
    //if (NVR.getLogin().useLocalTimeZone)

    var localtz = moment.tz.guess();
    var servertz = NVR.getTimeZoneNow();

    NVR.log("Local timezone conversion is on, converting from " + localtz + " to " + servertz);
    NVR.log("Original From: " + TimeObjectFrom + " Original To: " + TimeObjectTo);

    TimeObjectFrom = moment.tz(TimeObjectFrom, localtz).tz(servertz).format("YYYY-MM-DD HH:mm");
    TimeObjectTo = moment.tz(TimeObjectTo, localtz).tz(servertz).format("YYYY-MM-DD HH:mm");

    NVR.log("Converted From: " + TimeObjectFrom + " Converted To: " + TimeObjectTo);



    areStreamsStopped = true; // kill current view

    $timeout(function () {

      var i;
      if ($rootScope.platformOS != 'ios') {
        NVR.debug("Killing existing streams, if alive...");
        for (i = 0; i < $scope.MontageMonitors.length; i++) {
          if ($scope.MontageMonitors[i].Monitor.listDisplay == 'show' && $scope.MontageMonitors[i].Monitor.eventUrl != 'img/noimage.png') NVR.killLiveStream($scope.MontageMonitors[i].Monitor.connKey, $scope.MontageMonitors[i].Monitor.controlURL, $scope.MontageMonitors[i].Monitor.Name);
        }
      } else {
        NVR.stopNetwork("montage-history footerCollapse");
      }


      //NVR.regenConnKeys();
      //$scope.monitors = NVR.getMonitorsNow();
      //$scope.MontageMonitors = angular.copy($scope.monitors);

      NVR.debug(">>Initializing monitor array with history specific stuff...");
      for (i = 0; i < $scope.MontageMonitors.length; i++) {
        $scope.MontageMonitors[i].Monitor.eventUrl = 'img/noimage.png';
        $scope.MontageMonitors[i].Monitor.eventType = "";
        $scope.MontageMonitors[i].Monitor.eid = "-1";
        $scope.MontageMonitors[i].Monitor.eventUrlTime = "";
        $scope.MontageMonitors[i].Monitor.isPaused = false;
        $scope.MontageMonitors[i].Monitor.gridScale = "50";
        $scope.MontageMonitors[i].Monitor.selectStyle = "";
        $scope.MontageMonitors[i].Monitor.alarmState = 'color:rgba(0,0,0,0);';
        $scope.MontageMonitors[i].Monitor.sliderProgress = {
          progress: 0
        };
      }

      // let stopNetwork finish
      $timeout(function () {
        getNextSetHistory();
      });


    });


    function noop() {}
    
    function getNextSetHistory() {

      // grab events that start on or after the time 
      apiurl = ld.apiurl + "/events/index/"+"StartTime >=:" + TimeObjectFrom;
      if (ld.enableAlarmCount && ld.enableAlarmCount)
       apiurl+= "/"+"AlarmFrames >=:" + ld.minAlarmCount;

      apiurl+= ".json?sort=StartTime&direction=asc"+$rootScope.authSession;
      NVR.log("Grabbing history using: " + apiurl);
      // make sure there are no more than 5 active streams (noevent is ok)
      $scope.currentLimit = $scope.monLimit;
      //qHttp.get(apiurl)
      //console.log ("GETTING "+apiurl);
      $http({
        method: 'get',
        url: apiurl
      }).then(function (succ) {
        var data = succ.data;
        var ld = NVR.getLogin();
        NVR.debug("Got " + data.events.length + "new history events...");
        //console.log (JSON.stringify(data));
        var eid, mid, stime;
        for (i = 0; i < data.events.length; i++) {
          mid = data.events[i].Event.MonitorId;
          eid = data.events[i].Event.Id;
          
          var eType = (data.events[i].Event.DefaultVideo != '')? 'video':'jpeg';
          //console.log ("====SETTING video type to "+eType+" for "+mid);

          //console.log ("Event ID:"+eid);
          stime = data.events[i].Event.StartTime;
          // only take the first one for each monitor
          for (var j = 0; j < $scope.MontageMonitors.length; j++) {
            $scope.MontageMonitors[j].Monitor.isPaused = false;
            // that's the earliest match and play gapless from there
            if ($scope.MontageMonitors[j].Monitor.Id == mid) {
              if ($scope.MontageMonitors[j].Monitor.eventUrl == 'img/noimage.png') {
                // console.log ("Old value of event url " + $scope.MontageMonitors[j].eventUrl);
                //console.log ("ldurl is " + ld.streamingurl);
                var bw = NVR.getBandwidth() == "lowbw" ? zm.eventMontageQualityLowBW : ld.montageHistoryQuality;

                if (eType=='video') {
                  var videoURL= $scope.MontageMonitors[j].Monitor.baseURL  + "/index.php?view=view_video&mode=mpeg&format=h264&eid=" + eid;

                  videoURL += $rootScope.authSession;
                  if ($rootScope.basicAuthToken) videoURL = videoURL + "&basicauth=" + $rootScope.basicAuthToken;

          
                  $scope.MontageMonitors[j].Monitor.videoObject = {
                    config: {
                      autoPlay: true,
                      responsive: false,
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
                }
                
                $scope.MontageMonitors[j].Monitor.eventType = eType;
                $scope.MontageMonitors[j].Monitor.eventUrl = $scope.MontageMonitors[j].Monitor.streamingURL + "/nph-zms?source=event&mode=jpeg&event=" + eid + "&replay=gapless&rate=" + $scope.sliderVal.realRate + "&connkey=" + $scope.MontageMonitors[j].Monitor.connKey + "&scale=" + bw + $rootScope.authSession;
                //console.log ("Setting event URL to " +$scope.MontageMonitors[j].Monitor.eventUrl);
                //   console.log ("SWITCHING TO " + $scope.MontageMonitors[j].eventUrl);
                $scope.MontageMonitors[j].Monitor.eventUrlTime = stime;
                $scope.MontageMonitors[j].Monitor.eid = eid;
                $scope.MontageMonitors[j].Monitor.eventDuration = data.events[i].Event.Length;
                $scope.MontageMonitors[j].Monitor.sliderProgress = {
                  progress: 0
                };
                //console.log(">>> Setting Event for " + $scope.MontageMonitors[j].Monitor.Name + " to " + eid);
                // now lets get the API for that event for graphing
                $scope.MontageMonitors[j].Monitor.noGraph = true;

              }
            }
          } // for

        }
        // make sure we do our best to get that duration for all monitors
        // in the above call, is possible some did not make the cut in the first page
        NVR.log("Making sure all monitors have a fair chance...");
        var promises = [];
        for (i = 0; i < $scope.MontageMonitors.length; i++) {
          //console.log("Fair chance check for " + $scope.MontageMonitors[i].Monitor.Name);
          if ($scope.MontageMonitors[i].Monitor.eventUrl == 'img/noimage.png') {
            var indivGrab = ld.apiurl + "/events/index/MonitorId:" + $scope.MontageMonitors[i].Monitor.Id + "/"+"StartTime >=:" + TimeObjectFrom ;
            if (ld.enableAlarmCount && ld.minAlarmCount)
              indivGrab += "/"+"AlarmFrames >=:" +  ld.minAlarmCount;
            indivGrab += ".json?"+$rootScope.authSession;
            NVR.debug("Monitor " + $scope.MontageMonitors[i].Monitor.Id + ":" + $scope.MontageMonitors[i].Monitor.Name + " does not have events, trying " + indivGrab);
            var p = getExpandedEvents(i, indivGrab);
            promises.push(p);

          }

        }
        $q.all(promises).then(function () {
            $scope.isScreenReady = true;
            $timeout(function () {
              doPackery();
            });

          }

        )
        .catch (noop);

        // At this stage, we have both a general events grab, and specific event grabs for MIDS that were empty

        function doPackery() {
          // $ionicLoading.hide();
          //console.log("REDOING PACKERY & DRAG");
          NVR.debug("Re-creating packery and draggy");

          // remove current draggies
          if (draggies)
            draggies.forEach(function (drag) {
              drag.destroy();
            });
          draggies = [];
          // destroy existing packery object
          if (pckry) pckry.destroy();
          initPackery();

          $interval.cancel($rootScope.eventQueryInterval);
          $rootScope.eventQueryInterval = $interval(function () {
            checkAllEvents();
          }.bind(this), zm.eventHistoryTimer);

        }
      }, function (err) {
        NVR.debug("history  ERROR:" + JSON.stringify(err));
      });

      function getExpandedEvents(i, indivGrab) {
        var d = $q.defer();
        var ld = NVR.getLogin();
        // console.log ("Expanded API: " + indivGrab);
        $http({
          method: 'get',
          url: indivGrab
        }).then(function (succ) {
            var data = succ.data;
             //console.log ("EXPANDED DATA FOR MONITOR " + i + JSON.stringify(data));
            if (data.events.length > 0) {
              if (!NVR.isBackground()) {
                var bw = NVR.getBandwidth() == "lowbw" ? zm.eventMontageQualityLowBW : ld.montageHistoryQuality;
                var eType = data.events[0].Event.DefaultVideo != ''? 'video':'jpeg';

                var eid =  data.events[0].Event.Id;

                if (eType=='video') {
                  var videoURL= $scope.MontageMonitors[i].Monitor.baseURL  + "/index.php?view=view_video&mode=mpeg&format=h264&eid=" + eid;

                  videoURL += $rootScope.authSession;
                  if ($rootScope.basicAuthToken) videoURL = videoURL + "&basicauth=" + $rootScope.basicAuthToken;

          
                  $scope.MontageMonitors[i].Monitor.videoObject = {
                    config: {
                      autoPlay: true,
                      responsive: false,
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
                }
                $scope.MontageMonitors[i].Monitor.eventType = eType;
                $scope.MontageMonitors[i].Monitor.eventUrl = $scope.MontageMonitors[i].Monitor.streamingURL + "/nph-zms?source=event&mode=jpeg&event=" + data.events[0].Event.Id + "&frame=1&replay=gapless&rate=" + $scope.sliderVal.realRate + "&connkey=" + $scope.MontageMonitors[i].Monitor.connKey + "&scale=" + bw + $rootScope.authSession;
                //console.log ("SWITCHING TO " + $scope.MontageMonitors[i].eventUrl);
                $scope.MontageMonitors[i].Monitor.eventUrlTime = data.events[0].Event.StartTime;
                $scope.MontageMonitors[i].Monitor.eid = data.events[0].Event.Id;
                $scope.MontageMonitors[i].Monitor.noGraph = true;
                $scope.MontageMonitors[i].Monitor.sliderProgress = {
                  progress: 0
                };
                $scope.MontageMonitors[i].Monitor.eventDuration = data.events[0].Event.Length;
                //console.log(">>> Setting Event for " + $scope.MontageMonitors[i].Monitor.Name + " to " + data.events[0].Event.Id);
                NVR.log("Found expanded event " + data.events[0].Event.Id + " for monitor " + $scope.MontageMonitors[i].Monitor.Id);
              } else {
                // $scope.MontageMonitors[i].eventUrl="img/noimage.png";
                //    $scope.MontageMonitors[i].eventUrlTime = "";
                //    NVR.log ("Setting img src to null as data received in background");
              }
            }
            d.resolve(true);

            return d.promise;

          },
          function (err) {
            d.resolve(true);

            return d.promise;

          }

        );
        return d.promise;
      }

    } // getNextHistory


  }
  //---------------------------------------------------------
  // This is periodically called to get the current playing 
  // event by zms. I use this to display a timestamp
  // Its a 2 step process - get event Id then go a Event
  // API call to get time stamp. Sucks
  //---------------------------------------------------------
  function checkAllEvents() {
    //console.log("Timer:Events are checked....");

    //if (pckry && !$scope.isDragabillyOn) pckry.shiftLayout();

    for (var i = 0; i < $scope.MontageMonitors.length; i++) {
      // don't check for monitors that are not shown
      // because nph connkey won't exist and the response
      // will fail
      if ($scope.MontageMonitors[i].Monitor.eventUrl != "" && $scope.MontageMonitors[i].Monitor.eventUrl != 'img/noimage.png' && $scope.MontageMonitors[i].Monitor.connKey != '' && $scope.MontageMonitors[i].Monitor.Function != 'None' && $scope.MontageMonitors[i].Monitor.listDisplay != 'noshow' && $scope.MontageMonitors[i].Monitor.Enabled != '0' &&
      $scope.MontageMonitors[i].Monitor.eventType == "jpeg") {
        // NVR.debug("Checking event status for " + $scope.MontageMonitors[i].Monitor.Name + ":" + $scope.MontageMonitors[i].Monitor.eventUrl + ":" + $scope.MontageMonitors[i].Monitor.Function + ":" + $scope.MontageMonitors[i].Monitor.listDisplay);
        // console.log ("Sending query 99 for " + $scope.MontageMonitors[i].Monitor.Name + " with ck="+$scope.MontageMonitors[i].Monitor.connKey);
       controlEventStream('99', '', $scope.MontageMonitors[i].Monitor.connKey, i);
      }
    }
  }
  //--------------------------------------------------------------
  //  Used to control zms for a connkey. If ndx is not -1,
  // then it also calls an event API for the returned eid
  // and stores its time in the montage monitors array
  //--------------------------------------------------------------
  $scope.controlEventStream = function (cmd, disp, connkey, ndx) {
    controlEventStream(cmd, disp, connkey, ndx);
  };

  function timedControlEventStream(mTime, cmd, disp, connkey, ndx) {
    var mMtime = mTime || 2000;
    NVR.debug("Deferring control " + cmd + " by " + mMtime);
    $timeout(function () {
      subControlStream(cmd, connkey);
    }, mMtime);
  }

  function subControlStream(cmd, connkey) {
    var loginData = NVR.getLogin();
    
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

    //&auth=
    var req = qHttp({
      method: 'POST',
      /*timeout: 15000,*/
      url: loginData.url + '/index.php',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', //'Accept': '*/*',
      },
      transformRequest: function (obj) {
        var str = [];
        for (var p in obj) str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        var foo = str.join("&");
        //console.log("****HISTORY CONTROL RETURNING " + foo);
        return foo;
      },
      data: data_payload
    });
    req.then(function (succ) {
      NVR.debug("subControl success:" + JSON.stringify(succ));
    }, function (err) {
      NVR.debug("subControl error:" + JSON.stringify(err));
    });
  }

  function controlEventStream(cmd, disp, connkey, ndx, extras) {
    // console.log("Command value " + cmd);

    var d = $q.defer();
    if (disp) {
      $ionicLoading.hide();
      $ionicLoading.show({
        template: $translate.instant('kPleaseWait') + "...",
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
    var CMD_QUERY = 99;
    */
    // You need to POST commands to control zms
    // Note that I am url encoding the parameters into the URL
    // If I leave it as JSON, it gets converted to OPTONS due
    // to CORS behaviour and ZM/Apache don't seem to handle it
    //console.log("POST: " + loginData.url + '/index.php');
    //console.log ("AUTH IS " + $rootScope.authSession);
    var myauthtoken = $rootScope.authSession.replace("&auth=", "");
    //&auth=

    var cmdUrl = loginData.url + '/index.php?view=request&request=stream'+'&connkey='+connkey+'&command='+cmd+$rootScope.authSession;
    if (extras)
      cmdUrl = cmdUrl+extras;

    NVR.debug ("Control: Sending "+cmdUrl);

    var req = $http({
      method: 'GET',
      url:cmdUrl
    });
    
   
    req.then(function (succ) {
      var resp = succ.data;

      //console.log ("zms response: " + JSON.stringify(resp));

      // move progress bar if event id is the same
      if (resp.result == "Ok" && ndx != -1 && (resp.status && resp.status.event == $scope.MontageMonitors[ndx].Monitor.eid)) {
        if (!$scope.MontageMonitors[ndx].Monitor.seek) {
          $scope.MontageMonitors[ndx].Monitor.sliderProgress.progress = resp.status.progress;
        } else {
          NVR.debug("Skipping progress as seek is active for " + $scope.MontageMonitors[ndx].Monitor.Name);
        }
      }

      if (resp.result == "Ok" && resp.status &&  ndx != -1 && ((resp.status.event != $scope.MontageMonitors[ndx].Monitor.eid) || $scope.MontageMonitors[ndx].Monitor.noGraph == true)) {
        $scope.MontageMonitors[ndx].Monitor.noGraph = false;
        // $scope.MontageMonitors[ndx].Monitor.sliderProgress.progress = 0;
        NVR.debug("Fetching details, as event changed for " + $scope.MontageMonitors[ndx].Monitor.Name + " from " + $scope.MontageMonitors[ndx].Monitor.eid + " to " + resp.status.event);
        var ld = NVR.getLogin();
        var apiurl = ld.apiurl + "/events/" + resp.status.event + ".json?"+$rootScope.authSession;
        //console.log ("API " + apiurl);
        qHttp({
          method: 'get',
          url: apiurl
        }).then(function (succ) {
          var data = succ.data;
          var currentEventTime = moment(data.event.Event.StartTime);
          var maxTime = moment();
          //NVR.debug ("Monitor: " + $scope.MontageMonitors[ndx].Monitor.Id + " max time="+maxTime + "("+$scope.datetimeValueTo.value+")"+ " current="+currentEventTime + "("+data.event.Event.StartTime+")");

          NVR.debug("creating graph for " + $scope.MontageMonitors[ndx].Monitor.Name);
          var framearray = {
            labels: [],
            datasets: [{
              backgroundColor: 'rgba(242, 12, 12, 0.5)',
              borderColor: 'rgba(242, 12, 12, 0.5)',
              data: [],
            }]
          };
          framearray.labels = [];
          var ld = NVR.getLogin();
          //console.log(">>>>> GRAPH");
          for (i = 0; i < data.event.Frame.length; i++) {
            var ts = moment(data.event.Frame[i].TimeStamp).format(timeFormat);
            //console.log ("pushing s:" + event.Frame[i].Score+" t:"+ts);
            framearray.datasets[0].data.push({
              x: ts,
              y: data.event.Frame[i].Score
            });
            framearray.labels.push("");
          }
          $timeout(function () {
            drawGraph(framearray, $scope.MontageMonitors[ndx].Monitor.Id);
          }, 100);
          var element = angular.element(document.getElementById($scope.MontageMonitors[ndx].Monitor.Id + "-timeline"));
          element.removeClass('animated fadeIn');
          element.addClass('animated fadeOut');
          $timeout(function () {
            element.removeClass('animated fadeOut');
            element.addClass('animated fadeIn');
            $scope.MontageMonitors[ndx].Monitor.eventUrlTime = data.event.Event.StartTime;
            var bw = NVR.getBandwidth() == "lowbw" ? zm.eventMontageQualityLowBW : ld.montageHistoryQuality;

            // you don't have to change url - its taken care of in cmd?

            // $scope.MontageMonitors[ndx].Monitor.eventUrl = $scope.MontageMonitors[ndx].Monitor.streamingURL + "/nph-zms?source=event&mode=jpeg&event=" + data.event.Event.Id + "&frame=1&replay=gapless&rate=" + $scope.sliderVal.realRate + "&connkey=" + $scope.MontageMonitors[ndx].Monitor.connKey + "&scale=" + bw + $rootScope.authSession;
            $scope.MontageMonitors[ndx].Monitor.eid = data.event.Event.Id;
            $scope.MontageMonitors[ndx].Monitor.sliderProgress = {
              progress: 0
            };
            $scope.MontageMonitors[ndx].Monitor.eventDuration = data.event.Event.Length;
            //console.log(">>> Setting Event for " + $scope.MontageMonitors[ndx].Monitor.Name + " to " + data.event.Event.Id);
          }, 700);

        }, function (err) {
          NVR.debug("skipping graph as detailed API failed for " + $scope.MontageMonitors[ndx].Monitor.Name);
          $scope.MontageMonitors[ndx].Monitor.eventUrlTime = "-";
        });
      }
      d.resolve(true);
      return d.promise;
    }, function (err) {
      d.reject(false);
      NVR.log("Error sending event command " + JSON.stringify(err), "error");
      return d.promise;
    });
    return d.promise;
  }
  $scope.isBackground = function () {
    return NVR.isBackground();
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
  $scope.handleAlarmsWhileMinimized = function () {
    $rootScope.isAlarm = !$rootScope.isAlarm;
    $scope.minimal = !$scope.minimal;
    NVR.debug("MontageHistoryCtrl: switch minimal is " + $scope.minimal);
    ionic.Platform.fullScreen($scope.minimal, !$scope.minimal);
    $interval.cancel(intervalHandle);
    $interval.cancel($rootScope.eventQueryInterval);
    if (!$rootScope.isAlarm) {
      $rootScope.alarmCount = "0";
      $ionicHistory.nextViewOptions({
        disableBack: true
      });
      $state.go("app.events", {
        "id": 0,
        "playEvent": false,
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

  $scope.skipImage = function (m, dirn) {

    NVR.debug ("skipping image in direction:"+dirn);
    var cmd = (dirn == -1)?12:13;
    sendCmd(m.Monitor.Id, cmd);
    //var CMD_PREV = 12;
    //var CMD_NEXT = 13;




  };
  $scope.toggleControls = function () {
    $scope.showControls = !$scope.showControls;
  };
  $scope.toggleSelectItem = function (ndx) {
    if ($scope.MontageMonitors[ndx].Monitor.selectStyle !== "undefined" && $scope.MontageMonitors[ndx].Monitor.selectStyle == "dragborder-selected") {
      $scope.MontageMonitors[ndx].Monitor.selectStyle = "";
    } else {
      $scope.MontageMonitors[ndx].Monitor.selectStyle = "dragborder-selected";
    }
    //console.log ("Switched value to " + $scope.MontageMonitors[ndx].Monitor.selectStyle);
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
    $ionicSideMenuDelegate.canDragContent($scope.isDragabillyOn ? false : true);
    //$timeout(function(){pckry.reloadItems();},10);
    NVR.debug("setting dragabilly to " + $scope.isDragabillyOn);
    if ($scope.isDragabillyOn) {
      $scope.showSizeButtons = true;
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
          pckry.shiftLayout();
          /*var positions = pckry.getShiftPositions('data-item-id');
          //console.log ("POSITIONS MAP " + JSON.stringify(positions));
          var ld = NVR.getLogin();
          ld.packeryPositions = JSON.stringify(positions);
          NVR.setLogin(ld);*/
        }, 300);
      }, 100);
    }
  }


  //---------------------------------------------------------------------
  // Show/Hide PTZ control in monitor view
  //---------------------------------------------------------------------
  $scope.togglePTZ = function () {
    $scope.showPTZ = !$scope.showPTZ;
  };
  $scope.callback = function () {
    // console.log("dragging");
  };
  $scope.onDropComplete = function (index, obj, event) {
    //console.log("dragged");
    var otherObj = $scope.MontageMonitors[index];
    var otherIndex = $scope.MontageMonitors.indexOf(obj);
    $scope.MontageMonitors[index] = obj;
    $scope.MontageMonitors[otherIndex] = otherObj;
  };
  //---------------------------------------------------------------------
  // changes order of montage display
  //---------------------------------------------------------------------
  $scope.toggleMontageDisplayOrder = function () {
    $scope.packMontage = !$scope.packMontage;
    loginData.packMontage = $scope.packMontage;
    NVR.setLogin(loginData);
    //console.log ("Switching orientation");
  };


  $scope.skipVideo= function (m,d) {

    $scope.playbackFinished(m,d);
  };

  $scope.playbackFinished = function(m,d) {

    NVR.debug("--> Video playback finished for mon:"+m.Monitor.Id+ " evt:" +m.Monitor.eid);
    getNextEvent( m.Monitor.eid,d)
    .then (function (success) {
      NVR.debug ("next event for monitor:"+m.Monitor.Id+" is "+success.eid);

      if (success.eid != "null" && success.eid != m.Monitor.eid && success.eid !="-1") {
       
        var videoURL= m.Monitor.baseURL  + "/index.php?view=view_video&mode=mpeg&format=h264&eid=" + success.eid;

                  videoURL += $rootScope.authSession;
                  if ($rootScope.basicAuthToken) videoURL = videoURL + "&basicauth=" + $rootScope.basicAuthToken;

                  m.Monitor.videoObject = {
                    config: {
                      autoPlay: true,
                      responsive: false,
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
            

                  

      //  m.Monitor.videoObject.config.sources[0].src = $sce.trustAsResourceUrl(videoURL);

      var element = angular.element(document.getElementById(m.Monitor.Id + "-timeline"));
      element.removeClass('animated fadeIn');
      element.addClass('animated fadeOut');

      $timeout (function () {

        element.removeClass('animated fadeOut');
        element.addClass('animated fadeIn');

        NVR.debug ("--->updating videoURL for mid="+m.Monitor.Id+ "to:"+videoURL);
        m.Monitor.eid = success.eid;
        m.Monitor.eventUrlTime = success.stime;
        $timeout (function () {
          m.Monitor.handle.play();
        });

      },700);

        
        
      
      // m.Monitor.handle.play();
      
       
        }

    });
  };


  $scope.onVideoError = function (event) {
    $ionicLoading.hide();
    NVR.debug("player reported a video error:" + JSON.stringify(event));

  };

  $scope.onPlayerReady = function (api,m) {

    // we need this timeout to avoid load interrupting
    // play -- I suppose its an angular digest foo thing
    //console.log ("*********** ON PLAY READY")
    m.Monitor.handle = api;
    
    NVR.debug("On Play Ready invoked");
  
    m.Monitor.handle.mediaElement.attr("playsinline", "");

    $ionicLoading.show({
      template: "<ion-spinner icon='ripple' class='spinner-energized'></ion-spinner><br/>" + $translate.instant('kVideoLoading') + "...",

    });
    NVR.debug("Player is ready");
    $timeout(function () {
      m.Monitor.handle.pause();

      $timeout(function() {
        m.Monitor.handle.setPlayback(NVR.getLogin().videoPlaybackSpeed);
      m.Monitor.handle.play();
      NVR.debug("*** Invoking play");
      playerReady = true;
      },300);
      

    }, 300);

    // window.stop();
  };

  function getNextEvent(eid,dirn) {

    var d = $q.defer();
    // now get event details to show alarm frames
    var loginData = NVR.getLogin();
    var myurl = loginData.apiurl + '/events/' + eid + ".json?"+$rootScope.authSession;
    //console.log (">> 1: getting: "+myurl);

    var r = {
      eid:"",
      stime:""
    };

    $http.get(myurl)
    .then( function (succ) {
      //console.log (JSON.stringify(succ));
      var target = (dirn == -1) ? succ.data.event.Event.PrevOfMonitor: succ.data.event.Event.NextOfMonitor;
      //console.log (">> 2: dirn: "+dirn+" target: "+target);
      if (!target) target = 'null'; // fallback incase in some API this doesn't exist;
      if (target == 'null') {
        r.eid = "-1";
        r.stime = "-1";
        d.resolve(r);
        return d.promise;
      }
      else {
        r.eid = target;
        // now get time of that event
        myurl = loginData.apiurl+'/events/'+target + '.json?'+$rootScope.authSession;
        $http.get (myurl)
        .then (function (succ) {
            r.stime = succ.data.event.Event.StartTime;
            d.resolve(r);
            return d.promise;
        },function (err) {
          NVR.debug ("Error getting start time of neighbor:"+JSON.stringify(err));
           r.stime = "-1";
           d.resolve(r);
           return d.promise;
        });
        return d.promise;
      }
    }, function (err) {
        NVR.debug ("Error getting neighbors:"+JSON.stringify(err));
        r.eid = "-1";
        r.stime = "-1";
        d.resolve(r);
        return d.promise;

    });
    return (d.promise);

  }
  //---------------------------------------------------------------------
  // In Android, the app runs full steam while in background mode
  // while in iOS it gets suspended unless you ask for specific resources
  // So while this view, we DON'T want Android to keep sending 1 second
  // refreshes to the server for images we are not seeing
  //---------------------------------------------------------------------
  function onPause() {
    NVR.debug("MontageHistoryCtrl: onpause called");
    viewCleanup();
    viewCleaned = true;
  }

  function viewCleanup() {

    if (viewCleaned) {
      NVR.debug("Montage History View Cleanup was already done, skipping");
      return;
    }


    $interval.cancel($rootScope.eventQueryInterval);
    if (pckry) pckry.destroy();


    broadcastHandles = [];

    areStreamsStopped = true;

    $timeout(function () {

      NVR.debug("Killing all streams in montage to save memory/nw...");
      for (var i = 0; i < $scope.MontageMonitors.length; i++) {
        if ($scope.MontageMonitors[i].Monitor.listDisplay == 'show' && $scope.MontageMonitors[i].Monitor.eventUrl != 'img/noimage.png') NVR.killLiveStream($scope.MontageMonitors[i].Monitor.connKey, $scope.MontageMonitors[i].Monitor.controlURL, $scope.MontageMonitors[i].Monitor.Name);

      }

    });

  }

  function onResume() {
    areStreamsStopped = false;
  }

  $scope.openMenu = function () {
    $timeout(function () {
      $rootScope.stateofSlide = $ionicSideMenuDelegate.isOpen();
    }, 500);
    $ionicSideMenuDelegate.toggleLeft();
  };
  $scope.$on('$destroy', function () {
    NVR.debug("Cancelling eventQueryInterval");
    $interval.cancel($rootScope.eventQueryInterval);
  });
  $scope.$on('$ionicView.loaded', function () {
    //console.log("**VIEW ** MontageHistoryCtrl Loaded");
  });
  $scope.$on('$ionicView.enter', function () {
    NVR.debug("**VIEW ** MontageHistory Ctrl Entered");
    var ld = NVR.getLogin();
    //console.log("Setting Awake to " + NVR.getKeepAwake());
    NVR.setAwake(NVR.getKeepAwake());
    NVR.debug("query timer started");
    $interval.cancel($rootScope.eventQueryInterval);
    //console.log ("****************** TIMER STARTED INSIDE ENTER");
    $rootScope.eventQueryInterval = $interval(function () {
      checkAllEvents();
    }.bind(this), zm.eventHistoryTimer);
  });

  $scope.$on('$ionicView.beforeLeave', function () {
    //console.log("**VIEW ** Event History Ctrl Left, force removing modal");
    areStreamsStopped = true;
    viewCleanup();
    viewCleaned = true;

    //$window.removeEventListener('orientationchange', updateUI);

    document.removeEventListener("pause", onPause, false);
    document.removeEventListener("resume", onResume, false);



    // if ($scope.modal) $scope.modal.remove();
    NVR.log("Cancelling event query timer");
    $interval.cancel($rootScope.eventQueryInterval);
    // NVR.log("MontageHistory:Stopping network pull...");
    // make sure this is applied in scope digest to stop network pull
    // thats why we are doing it beforeLeave
    pckry.destroy();
    
  });
  $scope.$on('$ionicView.unloaded', function () {});
  $scope.sliderChanged = function (dirn) {
    //console.log("SLIDER CHANGED");
    if ($scope.sliderChanging) {
      // console.log ("too fast my friend");
      //$scope.slider.monsize = oldSliderVal;
      // return;
    }
    $scope.sliderChanging = true;
    var somethingReset = false;
    // this only changes items that are selected
    for (var i = 0; i < $scope.MontageMonitors.length; i++) {
      var curVal = parseInt($scope.MontageMonitors[i].Monitor.gridScale);
      curVal = curVal + (10 * dirn);
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
        var cv = parseInt($scope.MontageMonitors[i].Monitor.gridScale);
        cv = cv + (10 * dirn);
        if (cv < 10) cv = 10;
        if (cv > 100) cv = 100;
        $scope.MontageMonitors[i].Monitor.gridScale = cv;
      }
    }
    //pckry.reloadItems();
    pckry.once('layoutComplete', function () {
      /* $timeout(function () {
           var positions = pckry.EHgetShiftPositions('eh-data-item-id');
           //console.log ("POSITIONS MAP " + JSON.stringify(positions));
           var ld = NVR.getLogin();
           ld.EHpackeryPositions = JSON.stringify(positions);
           NVR.setLogin(ld);
           $ionicLoading.hide();
           $scope.sliderChanging = false;
       }, zm.packeryTimer);*/
    });
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
  };

  function layout(pckry) {
    pckry.shiftLayout();
  }
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
      $timeout(function () {
        pckry.layout();
      }, zm.packeryTimer); // force here - no shiftlayout
    }, 100);
  };

  function isEmpty(obj) {
    for (var prop in obj) {
      return false;
    }
    return true;
  }
  // called by afterEnter to load Packery
  function initPackery() {
    areStreamsStopped = true;
    $ionicLoading.show({
      template: $translate.instant('kArrangingImages'),
      noBackdrop: true,
      duration: zm.loadingTimeout
    });
    var progressCalled = false;
    draggies = [];
    var layouttype = true;
    var ld = NVR.getLogin();

    var elem = angular.element(document.getElementById("mygrid"));
    pckry = new Packery('.grid', {
      itemSelector: '.grid-item',
      percentPosition: true,
      columnWidth: '.grid-sizer',
      gutter: 0,
      initLayout: true

    });
    //console.log ("**** mygrid is " + JSON.stringify(elem));
    imagesLoaded(elem).on('progress', function (instance, img) {
      var result = img.isLoaded ? 'loaded' : 'broken';
      // NVR.debug('~~loaded image is ' + result + ' for ' + img.img.src);
      $timeout(function () {
        pckry.layout();
      }, 100);

      progressCalled = true;
      // if (layouttype) $timeout (function(){layout(pckry);},100);
    });
    imagesLoaded(elem).once('always', function () {
      //console.log("******** ALL IMAGES LOADED");
      //$scope.$digest();
      areStreamsStopped = false;

      NVR.debug("All images loaded");
      $ionicLoading.hide();

      $scope.areImagesLoading = false;

      if (!progressCalled) {
        NVR.log("***  PROGRESS WAS NOT CALLED");
        //pckry.reloadItems();
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

        /*if (!isEmpty(positions)) {
            NVR.log("Arranging as per packery grid");

            for (var i = 0; i < $scope.MontageMonitors.length; i++) {
                for (var j = 0; j < positions.length; j++) {
                    if ($scope.MontageMonitors[i].Monitor.Id == positions[j].attr) {
                        $scope.MontageMonitors[i].Monitor.gridScale = positions[j].size;
                        $scope.MontageMonitors[i].Monitor.listDisplay = positions[j].display;
                        NVR.debug("Setting monitor ID: " + $scope.MontageMonitors[i].Monitor.Id + " to size: " + positions[j].size + " and display:" + positions[j].display);
                    }
                    //console.log ("Index:"+positions[j].attr+ " with size: " + positions[j].size);
                }
            }


            NVR.debug("All images loaded, doing image layout");
            $timeout(function () {
                pckry.initShiftLayout(positions, 'data-item-id');
            }, 0);
        }*/

        $timeout(function () {
          NVR.log("Force calling resize");
          pckry.layout();
          $scope.packeryDone = true;
        }, zm.packeryTimer); // don't ask

      }, zm.packeryTimer);

    });

    function itemDragged(item) {
      NVR.debug("drag complete");
    }
  }
  $scope.$on('$ionicView.beforeEnter', function () {

    $scope.$on ( "process-push", function () {
      NVR.debug (">> MontageHistoryCtrl: push handler");
      var s = NVR.evaluateTappedNotification();
      NVR.debug("tapped Notification evaluation:"+ JSON.stringify(s));
      $ionicHistory.nextViewOptions({
        disableAnimate:true,
        disableBack: true
      });
      $state.go(s[0],s[1],s[2]);
    });
    
    // This rand is really used to reload the monitor image in img-src so it is not cached
    // I am making sure the image in montage view is always fresh
    // I don't think I am using this anymore FIXME: check and delete if needed
    // $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
    $scope.showControls = true;
    $scope.packeryDone = false;
    readyToRun = false;
    $scope.isScreenReady = false;
    // $scope.MontageMonitors = message;


    isMultiPort = NVR.getCurrentServerMultiPortSupported() && !NVR.getLogin().disableSimulStreaming;


    // don't do this - we are simulstreaming in this view 
    /* if ($rootScope.platformOS == 'ios') {
       isSimulStreaming = false;
       NVR.log("IOS detected, disabling simulstreaming");
     }*/
    $scope.isMultiPort = isMultiPort;
    areStreamsStopped = true;

    NVR.regenConnKeys();
    $scope.monitors = NVR.getMonitorsNow();
    $scope.MontageMonitors = angular.copy($scope.monitors);

    var loginData = NVR.getLogin();
    // init monitors

    NVR.debug(">>Initializing connkeys and images...");
    for (var i = 0; i < $scope.MontageMonitors.length; i++) {
      //$scope.MontageMonitors[i].Monitor.connKey='';
      $scope.MontageMonitors[i].Monitor.eid = "-1";
      $scope.MontageMonitors[i].Monitor.eventUrl = 'img/noimage.png';
      $scope.MontageMonitors[i].Monitor.eventType = "";
      $scope.MontageMonitors[i].Monitor.eid = "-1";
      $scope.MontageMonitors[i].Monitor.eventUrlTime = "";
      $scope.MontageMonitors[i].Monitor.isPaused = false;
      $scope.MontageMonitors[i].Monitor.gridScale = "50";
      $scope.MontageMonitors[i].Monitor.selectStyle = "";
      $scope.MontageMonitors[i].Monitor.alarmState = 'color:rgba(0,0,0,0);';
      $scope.MontageMonitors[i].Monitor.sliderProgress = {
        progress: 0
      };
    }
    doInitCode();

  });
  $scope.reloadView = function () {
    $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
    NVR.log("User action: image reload " + $rootScope.rand);
  };
  $scope.doRefresh = function () {
    //console.log("***Pull to Refresh, recomputing Rand");
    NVR.log("Reloading view for montage view, recomputing rand");
    $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
    $scope.MontageMonitors = [];
    imageLoadingDataShare.set(0);
    var refresh = NVR.getMonitors(1);
    refresh.then(function (data) {
      $scope.MontageMonitors = data.data;
      $scope.$broadcast('scroll.refreshComplete');
    });
  };

  function drawGraph(f, mid) {
    //console.log("Graphing on " + "eventchart-" + mid);
    var cv = document.getElementById("eventchart-" + mid);
    var ctx = cv.getContext("2d");
   // ctx.height=30;
    frameoptions = {
      maintainAspectRatio: false,
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
            min: f.datasets[0].data[0].x,
            max: f.datasets[0].data[f.datasets[0].data.length - 1].x,
            displayFormats: {}
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
        data: f,
        options: frameoptions,
      });
    });
  }
  //---------------------------------------------------------------------
  // Controller main
  //---------------------------------------------------------------------
  var intervalHandle;
  var modalIntervalHandle;
  var timeFormat;
  var curYear;
  var readyToRun;
  var frameoptions;
  var timeto, timefrom;
  var sizeInProgress;
  var ld;
  var pckry;
  var draggies;
  var i;
  var loginData;
  var draggie;
  var oldmonitors;
  var gridcontainer;
  var montageOrder, hiddenOrder;

  $scope.sliderVal = {
    rate: 2,
    realRate: 200,
    hideNoEvents: false,
    enableGapless: true,
    exactMatch: false,
    showTimeline: true
  };
  $scope.timeFormat = "yyyy-MM-dd " + NVR.getTimeFormat();
  $scope.displayDateTimeSliders = true;
  $scope.showtimers = true;
  $scope.loginData = NVR.getLogin();

  $scope.slider_modal_options_rate = {
    from: 1,
    to: 10,
    realtime: true,
    step: 1,
    className: "mySliderClass", //modelLabels:function(val) {return "";},
    callback: function (value, released) {
      //console.log("CALLBACK"+value+released);
      $ionicScrollDelegate.freezeScroll(!released);
      //NVR.debug("EventCtrl: freezeScroll called with " + !released);

    },
    smooth: false,
    dimension: 'X',
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

  };

  $scope.datetimeValueFrom = {
    value: "",
    hrs: ""
  };
  $scope.datetimeValueTo = {
    value: ""
  };

  $rootScope.eventQueryInterval = "";


  $scope.constructStream = function (monitor) {


    var stream;
    if (areStreamsStopped) return "";
    //if (monitor.Monitor.isPaused) return "";
    stream = monitor.Monitor.eventUrl; //eventUrl already has all the foo

    stream += NVR.insertSpecialTokens();
    // console.log("STREAM=" + stream);
    return stream;

  };

  function appendConnKey(ck) {
    // always streaming
    return "&connkey=" + ck;

  }

  function doInitCode()

  {

    $scope.isModalActive = false;

    $scope.hrsAgo = 4;
    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);

    timeFormat = 'MM/DD/YYYY HH:mm:ss';
    curYear = new Date().getFullYear();
    readyToRun = false;

    frameoptions = [];
    // default = start of day
    timeto = moment();
    timefrom = moment().startOf('day');
    $scope.datetimeValueTo.value = timeto.toDate();
    $scope.sliderVal.rate = 1;
    $scope.sliderVal.realRate = $scope.sliderVal.rate * 100;

    $scope.datetimeValueFrom.value = timefrom.toDate();
    $scope.datetimeValueFrom.hrs = Math.round(moment.duration(moment().diff(moment($scope.datetimeValueFrom.value))).asHours());


    $scope.monitorSize = []; // array with montage sizes per monitor
    $scope.scaleDirection = []; // 1 = increase -1 = decrease
    // The difference between old and original is this:
    // old will have a copy of the last re-arranged monitor list
    // while original will have a copy of the order returned by ZM
    var oldMonitors = []; // To keep old order if user cancels after sort;
    // Montage display order may be different so don't
    // mangle monitors as it will affect other screens
    // in Montage screen we will work with this local copy
    //$scope.MontageMonitors = angular.copy ($scope.monitors);
    var montageOrder = []; // This array will keep the ordering in montage view
    var hiddenOrder = []; // 1 = hide, 0 = don't hide
    var tempMonitors = message;
    /* if (tempMonitors.length == 0)
        {
            $rootScope.zmPopup = $ionicPopup.alert(
            {
                title: $translate.instant('kNoMonitors'),
                template: $translate.instant('kPleaseCheckCredentials'),
                okText: $translate.instant('kButtonOk'),
                cancelText: $translate.instant('kButtonCancel'),
            });
            $ionicHistory.nextViewOptions(
            {
                disableBack: true
            });
            $state.go("app.login");
            return;
        }
*/
    NVR.log("Inside MontageHistoryCtrl:We found " + $scope.MontageMonitors.length + " monitors");
    // $scope.MontageMonitors = NVR.applyMontageMonitorPrefs(message, 1)[0];


    // --------------------------------------------------------
    // Handling of back button in case modal is open should
    // close the modal
    // --------------------------------------------------------                               
    $ionicPlatform.registerBackButtonAction(function (e) {
      e.preventDefault();
      if ($scope.modal && $scope.modal.isShown()) {
        // switch off awake, as liveview is finished
        NVR.debug("Modal is open, closing it");
        NVR.setAwake(false);
        $scope.modal.remove();
        $scope.isModalActive = false;
      } else {
        NVR.debug("Modal is closed, so toggling or exiting");
        if (!$ionicSideMenuDelegate.isOpenLeft()) {
          $ionicSideMenuDelegate.toggleLeft();
        } else {
          navigator.app.exitApp();
        }
      }
    }, 1000);
    $scope.isRefresh = $stateParams.isRefresh;
    sizeInProgress = false;
    $ionicSideMenuDelegate.canDragContent(false);
    $scope.LoginData = NVR.getLogin();
    $scope.monLimit = $scope.LoginData.maxMontage;
    $scope.currentLimit = $scope.LoginData.maxMontage;
    ld = NVR.getLogin();

    if (!isMultiPort || ld.disableSimulStreaming) {

      NVR.log("Limiting montage to 5, thanks to max connection  per domain limit");
      $scope.currentLimit = 5;
      $scope.monLimit = 5;
    } else {

      NVR.log("You have multiport on, so no montage limits");
    }



    $timeout(function () {
      // initPackery();
      readyToRun = true;
      NVR.debug("Calling footerCollapse from doInit");
      footerCollapse();
    }, zm.packeryTimer);


  }

}]);
