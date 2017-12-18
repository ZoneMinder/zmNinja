/* jshint -W041 */
/*jshint -W069 */
/*jshint sub:true*/
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console, Masonry */


//https:///zm/api/events/index/AlarmFrames%20%3E=:1/StartTime%20%3E=:2017-12-16%2009:08:50.json?sort=TotScore&direction=desc

angular.module('zmApp.controllers').controller('zmApp.MomentCtrl', ['$scope', '$rootScope', '$ionicModal', 'NVRDataModel', '$ionicSideMenuDelegate', '$ionicHistory', '$state', '$translate', '$templateRequest', '$sce', '$compile', '$http', '$ionicLoading', 'zm', '$timeout', '$q', '$ionicPopover', '$ionicPopup', 'message', '$ionicScrollDelegate', function ($scope, $rootScope, $ionicModal, NVRDataModel, $ionicSideMenuDelegate, $ionicHistory, $state, $translate, $templateRequest, $sce, $compile, $http, $ionicLoading, zm, $timeout, $q, $ionicPopover, $ionicPopup, message, $ionicScrollDelegate) {

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


  function constructMask() {

    excludeMonitorsFilter = "";
    for (var i=0; i < excludeMonitors.length; i++) {
        excludeMonitorsFilter = excludeMonitorsFilter + "/MonitorId !=:"+excludeMonitors[i];       
    }
    NVRDataModel.debug ("Constructed Monitor Filter ="+excludeMonitorsFilter);
  }

  function process(rawdata) {
    // console.log (JSON.stringify(data));

    var data = rawdata.data;
    NVRDataModel.debug("--------> attempting PAGE " + data.pagination.page + " of " + data.pagination.pageCount);
    for (var i = 0; i < data.events.length; i++) {
      // console.log ("pushing "+ JSON.stringify(data.data.events[i]));

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

          /*myevents[i].Event.Rotation = {
              'transform' : 'rotate('+mo+'deg'+')'
          };   */

          var tmp = data.events[i].Event.thumbHeight;
          data.events[i].Event.thumbHeight = data.events[i].Event.thumbWidth;
          data.events[i].Event.thumbWidth = tmp;

        } // swap 

        //console.log (d.width+"*"+d.height);

      }

      data.events[i].Event.hide = false;
      data.events[i].Event.icon = "ion-code-working";
      data.events[i].Event.baseURL = NVRDataModel.getBaseURL(data.events[i].Event.MonitorId);
      data.events[i].Event.monitorName = NVRDataModel.getMonitorName(data.events[i].Event.MonitorId);

      data.events[i].Event.dateObject = new Date(data.events[i].Event.StartTime);

      data.events[i].Event.humanizeTime = humanizeTime(data.events[i].Event.StartTime);

      var mid = data.events[i].Event.MonitorId;
      data.events[i].Event.order = i;


      // console.log ("---> PUSHING "+data.events[i].Event.StartTime);
      moments.push(data.events[i]);


    }




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

      // console.log ("obj1="+JSON.stringify(obj1));
      //  console.log ("obj2="+JSON.stringify(obj2));
      for (i = 1; i < keys_length; i++) {
        key = args[i];
        if (typeof key !== 'string') {
          // console.log ("ARGS I 0"+args[i][0]);
          desc = key[1];
          key = key[0];
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
    //($scope.isSubMenu);
  };

  $scope.sizeChanged = function (dirn) {
    var sz = $scope.gridSize;
    sz = sz + 5 * dirn;
    if (sz < 5) sz = 5;
    if (sz > 100) sz = 100;
    $scope.gridSize = sz;

    var ld = NVRDataModel.getLogin();
    ld.momentGridSize = $scope.gridSize;
    NVRDataModel.setLogin(ld);

    $timeout(function () {
      masonry.layout();
    }, 300);


  };

  $scope.reLayout = function () {
    NVRDataModel.log("relaying masonry");
    $timeout(function () {
      masonry.layout();
    }, 300);

  };

  $scope.toggleCollapse = function (mid, eid) {
    NVRDataModel.debug("toggling collapse for:" + mid);
    var collapseCount = 0;
    collapseId = 0;
    for (var i = 0; i < $scope.moments.length; i++) {
      if ($scope.moments[i].Event.Id == eid) {

        $scope.moments[i].Event.hide = false;
        collapseId = i;

        $scope.moments[i].Event.icon = $scope.moments[i].Event.icon == "ion-code-working" ? "ion-images" : "ion-code-working";




      } else if ($scope.moments[i].Event.MonitorId == mid) {
        // same monitor, but different ID

        $scope.moments[i].Event.hide = !$scope.moments[i].Event.hide;
        if ($scope.moments[i].Event.hide) collapseCount++;
        //console.log ("Hiding " + i);
      }
    } //for
    if (collapseCount) {
      $scope.moments[collapseId].Event.collapseCount = collapseCount;
    } else {
      $scope.moments[collapseId].Event.collapseCount = "";
    }



    $timeout(function () {
      masonry.reloadItems();

    }, 100);

    masonry.once('layoutComplete', function (laidOutItems) {
      $timeout(function () {
        masonry.layout();
      }, 300);
    });

    $timeout(function () {
      masonry.layout();
     // $ionicScrollDelegate.$getByHandle("moment-delegate").scrollTop();

    }, 600);

  };


  $scope.hourmin = function (str) {
    return moment(str).format(NVRDataModel.getTimeFormat());

  };

  $scope.cancelMask = function () {
    $scope.modal.remove();
  };

  $scope.saveMask = function () {
    $scope.modal.remove();
    excludeMonitors = [];


    for (var i=0; i < $scope.monitors.length; i++) {
        if ($scope.monitors[i].Monitor.listDisplay == 'noshow') {
            excludeMonitors.push($scope.monitors[i].Monitor.Id);
        }

    }
    console.log ("ENDED");
    constructMask();

    var ld = NVRDataModel.getLogin();
    ld.momentMonitorFilter = JSON.stringify(excludeMonitors);
    NVRDataModel.setLogin(ld);

    getMoments(momentType);


  };


  $scope.toggleHide = function(i)
    {

        if ($scope.monitors[i].Monitor.listDisplay == 'show') {
            $scope.monitors[i].Monitor.listDisplay = 'noshow';

        }
           
        else {
            $scope.monitors[i].Monitor.listDisplay = 'show';
           
        }
            

        NVRDataModel.debug("index " + i + " is now " + $scope.monitors[i].Monitor.listDisplay);
    
    };


  $scope.hideUnhide = function() {

    //console.log (JSON.stringify(monitors));

    

    $scope.monitors = monitors;
    $ionicModal.fromTemplateUrl('templates/moment-mask.html',
            {
                scope: $scope,
                animation: 'slide-in-up',
                id:'reorder',
            })
            .then(function(modal)
            {
                $scope.modal = modal;
                $scope.modal.show();
            });

  }

  function humanizeTime(str) {
    //console.log ("Time:"+str+" TO LOCAL " + moment(str).local().toString());
    //if (NVRDataModel.getLogin().useLocalTimeZone)
    return moment.tz(str, NVRDataModel.getTimeZoneNow()).fromNow();
    // else    
    //  return moment(str).fromNow();

  }

  function initMasonry() {
    $ionicLoading.show({
      template: $translate.instant('kArrangingImages'),
      noBackdrop: true,
      duration: zm.loadingTimeout
    });
    var progressCalled = false;

    var ld = NVRDataModel.getLogin();

    var elem = angular.element(document.getElementById("mygrid"));
    masonry = new Masonry('.grid', {
      itemSelector: '.grid-item',
      // columnWidth: 10
      horizontalOrder: true,
      gutter: 2,
      initLayout: true,
      percentPosition: true,

    });
    //console.log ("**** mygrid is " + JSON.stringify(elem));
    imagesLoaded(elem).on('progress', function (instance, img) {
      masonry.layout();

    });
    imagesLoaded(elem).once('always', function () {

      NVRDataModel.debug("All images loaded");
      $ionicLoading.hide();

      $timeout(function () {
        masonry.layout();
      }, 300);

      if (!progressCalled) {
        NVRDataModel.log("***  PROGRESS WAS NOT CALLED");
        masonry.reloadItems();
      }

    });
  }

  $scope.closeModal = function () {
    NVRDataModel.debug(">>>MomentCtrl:Close & Destroy Modal");
    NVRDataModel.setAwake(false);
    if ($scope.modal !== undefined) {
      $scope.modal.remove();
    }

  };

  $scope.showThumbnail = function (b, f) {

    if (!f) { // api update needed

      $ionicPopup.alert({
        title: $translate.instant('kNote'),
        template: "{{'kApiUpgrade' | translate }}",
        okText: $translate.instant('kButtonOk'),
        cancelText: $translate.instant('kButtonCancel'),
      });
      return;

    }

    $scope.thumbnailLarge = b + '/index.php?view=image&fid=' + f;
    $ionicModal.fromTemplateUrl('templates/image-modal.html', {
        scope: $scope,
        animation: 'slide-in-up',
        id: 'thumbnail',
      })
      .then(function (modal) {
        $scope.modal = modal;


        $scope.modal.show();

        var ld = NVRDataModel.getLogin();

      });

  };

  $scope.getMoments = function (cond) {
    momentType = cond;
    getMoments(cond);
  };

  function noop(err) {
    //console.log("ERROR NOOP=" + JSON.stringify(err));
  }


  function getMoments(sortCondition) {

    if (sortCondition == 'MaxScore')
      $scope.type = $translate.instant('kMomentMenuByScore');
    else if (sortCondition == 'StartTime')
      $scope.type = $translate.instant('kMomentMenuByTime');
    else if (sortCondition == 'MonitorId')
      $scope.type = $translate.instant('kMomentMenuByMonitor');

    $scope.apiurl = NVRDataModel.getLogin().apiurl;
    moments.length = 0;

    NVRDataModel.setAwake(false);
    var tmptimeto = moment();
    var tmptimefrom = tmptimeto.subtract(24, 'hours');
    var page = 1;
    timeFrom = tmptimefrom.format('YYYY-MM-DD HH:mm:ss');
    timeTo = tmptimeto.format('YYYY-MM-DD HH:mm:ss');

    NVRDataModel.debug("Moments from " + timeFrom + " to " + timeTo);

    //https:///zm/api/events/index/AlarmFrames%20%3E=:1/StartTime%20%3E=:2017-12-16%2009:08:50.json?sort=TotScore&direction=desc

    var ld = NVRDataModel.getLogin();

    // in API, always sort by StartTime so all monitors are represented
    var myurl = ld.apiurl + "/events/index/AlarmFrames >=:1"+excludeMonitorsFilter+"/StartTime >=:" + timeFrom + ".json?sort=" + "StartTime" + "&direction=desc";
    NVRDataModel.debug("Retrieving " + myurl);



    $q.all([
        $http.get(myurl + '&page=1').then(process).catch(noop),
        $http.get(myurl + '&page=2').then(process).catch(noop),
        $http.get(myurl + '&page=3').then(process).catch(noop),
        $http.get(myurl + '&page=4').then(process).catch(noop)

      ])
      .then(function () {
        NVRDataModel.debug ("$a.all Parallel queries completed");
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

        /* if (sortCondition == "MonitorId") {
        moments.sort(function(a, b) {
            var da = a.Event.MonitorId;
            var db = b.Event.MonitorId;
            return da>db ? -1 : da<db ? 1 : 0;
        });
   }*/
      });




  }

  $scope.$on('$ionicView.beforeLeave', function () {
    NVRDataModel.debug("Destroying masonry");
    masonry.destroy();
  });



  $scope.$on('$ionicView.beforeEnter', function () {
    /*var w = Math.round(parseInt($rootScope.devWidth) / parseInt($rootScope.pixelRatio)) ;

    w = $rootScope.devWidth;

    var p = w / 100;

    console.log ("old P="+p);
    p = Math.ceil(p/5)*5;
    console.log ("P="+p);*/

    var ld = NVRDataModel.getLogin();

    $scope.gridSize = ld.momentGridSize;
    excludeMonitors = JSON.parse(ld.momentMonitorFilter);
    console.log ("RETRIEVED EXCLUDE="+JSON.stringify(excludeMonitors));
    constructMask();
    $scope.isSubMenu = false;

    monitors = angular.copy(message);

    for (var i=0; i < monitors.length; i++) {
        if (excludeMonitors.indexOf(monitors[i].Monitor.Id) != -1) {
            monitors[i].Monitor.listDisplay = 'noshow';
            console.log ("Marking monitor " + monitors[i].Monitor.Id+ " as noshow");
        }
            
    }
   
  });

  $scope.$on('$ionicView.afterEnter', function () {


  

    
    $ionicPopover.fromTemplateUrl('templates/moment-popover.html', {
      scope: $scope,
    }).then(function (popover) {
      $scope.popover = popover;
    });

    getMoments(momentType);

    //getMoments ("MaxScore");


  });

}]);
