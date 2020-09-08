/* jshint -W041 */
/*jshint bitwise: false*/
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,moment, MobileAccessibility, gifshot, ReadableStream , LibraryHelper, GifWriter, NeuQuant, LocalFileSystem, FileError*/

// This is the controller for Event view. StateParams is if I recall the monitor ID.
// This was before I got access to the new APIs. FIXME: Revisit this code to see what I am doing with it
// and whether the new API has a better mechanism

angular.module('zmApp.controllers')

  // alarm frames filter
  .filter('selectFrames', function ($filter, $translate) {

    // Create the return function and set the required parameter name to **input**
    return function (input, typeOfFrames) {

      var out = [];

      angular.forEach(input, function (item) {

        if (typeOfFrames == $translate.instant('kShowTimeDiffFrames')) {
          if (item.type == $translate.instant('kShowTimeDiffFrames'))
            out.push(item);
        } else
          out.push(item);

      });

      return out;
    };

  })

  .controller('zmApp.EventCtrl', ['$scope', '$rootScope', 'zm', 'NVR', 'message', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$ionicPlatform', '$ionicSlideBoxDelegate', '$ionicPosition', '$ionicPopover', '$ionicPopup', 'EventServer', '$sce', '$cordovaBadge', '$cordovaLocalNotification', '$q', 'carouselUtils', '$translate', '$cordovaFileTransfer', '$cordovaFile', '$ionicListDelegate', 'ionPullUpFooterState', 'SecuredPopups', '$window', function ($scope, $rootScope, zm, NVR, message, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $ionicPlatform, $ionicSlideBoxDelegate, $ionicPosition, $ionicPopover, $ionicPopup, EventServer, $sce, $cordovaBadge, $cordovaLocalNotification, $q, carouselUtils, $translate, $cordovaFileTransfer, $cordovaFile, $ionicListDelegate, ionPullUpFooterState,SecuredPopups, $window) {

    // events in last 5 minutes
    // TODO https://server/zm/api/events/consoleEvents/5%20minute.json

    //---------------------------------------------------
    // Controller main
    //---------------------------------------------------

    var loginData;
    var oldEvent;
    var scrollbynumber;
    var eventImageDigits = 5; // failsafe
    var currEventsPage = 1;
    var maxEventsPage = 1;
    var moreEvents;
    var enableLoadMore;
    var lData;
    var showHiddenMonitors;
    var ionRangeWatcher;
    var mycarouselWatcher;
    var nolangFrom;
    var nolangTo;
    var broadcastHandles = [];
    var intervalReloadEvents;
    var eventHeight = 0;
    var currentPagePosition = 0;
    var currentPageLength = 0;
    var currentPageData;
    var loadMoreTime;
    var maxEventsToLoad = 5; //limit to 5 to minimise memory usage when displaying gifs

    $scope.typeOfFrames = $translate.instant('kShowTimeDiffFrames');
    $scope.outlineMotion = false;
    $scope.outlineMotionParam = "&show=capture";
    $scope.eventsBeingLoaded = true;

    var eHandle;
    var scrubOngoing = false;


    //---------------------------------------------------
    // initial code
    //---------------------------------------------------


    $scope.$on('sizechanged', function() {
      $timeout (function () {
        recomputeEventCollectionSize();
      },10);
  
    });

    //we come here is TZ is updated after the view loads
    var tzu = $scope.$on('tz-updated', function () {
      $scope.tzAbbr = NVR.getTimeZoneNow();
      NVR.debug("Timezone API updated timezone to " + NVR.getTimeZoneNow());
    });
    broadcastHandles.push(tzu);

    var lc = $scope.$on("language-changed", function () {
      NVR.log(">>>>>>>>>>>>>>> language changed");
      doRefresh();
    });
    broadcastHandles.push(lc);

    $scope.$on('$ionicView.afterEnter', function () {

      $ionicListDelegate.canSwipeItems(true);
     // NVR.debug("enabling options swipe");

      // see if we come from monitors, if so, don't filter events
      if ($ionicHistory.backTitle() == 'Monitors') {
        showHiddenMonitors = true;
      } else {
        showHiddenMonitors = false;
      }

      if (NVR.getLogin().useLocalTimeZone) {
        $scope.tzAbbr = moment().tz(moment.tz.guess()).zoneAbbr();
      } else {
        $scope.tzAbbr = moment().tz(NVR.getTimeZoneNow()).zoneAbbr();
      }

      //console.log ("************** CLEARING EVENTS");
      $scope.events = [];

      $timeout(function () {
        // console.log ("DEFERRED ACTION EVENTS");
        getInitialEvents();
        setupWatchers();
        footerExpand();
        // now do event playback if asked

        if (parseInt($rootScope.tappedEid) > 0 && $stateParams.playEvent == 'true') {
          NVR.debug(" Trying to  play event due to push:" + $rootScope.tappedEid);
          playSpecificEvent($rootScope.tappedEid);

        }

      }, 100);

      NVR.debug ("Starting page refresh timer");
      $interval.cancel(intervalReloadEvents);
      intervalReloadEvents = $interval(function () {
        timedPageReload();
      }.bind(this), zm.eventPageRefresh);

    });

    function timedPageReload() {

      if (!NVR.getLogin().enableEventRefresh) {
        NVR.debug ("Event refresh disabled");
        return;
      }
     
      if ($ionicScrollDelegate.$getByHandle("mainScroll").getScrollPosition().top !=0 ) {
        NVR.debug ("Not reloading as you have scrolled");

      } 
      else if ($scope.modal != undefined && $scope.modal.isShown()) {
          NVR.debug ("Not reloading as you have a modal open");
      }
      else if (scrubOngoing) {
          NVR.debug ("Not reloading, as video scrub is on");
      }
      else {
        doRefresh();
      }
      
    }

    function playSpecificEvent(eid) {
      NVR.log("Stuffing EID to play back " + eid);
      $rootScope.tappedEid = 0;
      var event = {
        Event: {
          Id: eid
        }

      };
      $scope.event = event;
      $scope.currentEvent = event;
      openModal(event, 'enabled');

    }

    $scope.$on("$stateChangeStart", function(event, toState){
        //console.log(event);
        //console.log(toState);
        
        // clear the seach except when we are going to /events-date-time-filter
        if (toState.url != "/events-date-time-filter") {
          NVR.debug ("removing montage temporary filter");
          $rootScope.isEventFilterOn = false;
          $rootScope.fromDate = "";
          $rootScope.fromTime = "";
          $rootScope.toDate = "";
          $rootScope.toTime = "";
          $rootScope.fromString = "";
          $rootScope.toString = "";
          $rootScope.monitorsFilter="";
        }
    });
    
    $scope.$on('$ionicView.beforeLeave', function () {
      //$window.removeEventListener('orientationchange', updateUI);

      NVR.debug ("Cancelling page reload timer");
      $interval.cancel(intervalReloadEvents);
      document.removeEventListener("pause", onPause, false);

     
      //NVR.debug("EventCtrl: Deregistering broadcast handles");
      for (var i = 0; i < broadcastHandles.length; i++) {
      //  broadcastHandles[i]();
      }
      broadcastHandles = [];
    });

    $scope.$on('$ionicView.beforeEnter', function () {

      /*
        It's a bleeding mess trying to get this working on  
        multiple devices and orientations with flex-box, primarily
        because I'm not a CSS guru.

        Plus, collection-repeat offers significant performance benefits
        and this requires fixed row sizes across all rows.

        The layout I am using:
        a) If you are using large thumbs, it's a single column format
        b) If you are using small thumbs, it's a two column format

        The max size of the image is in computeThumbnailSize()
      */

      var ld = NVR.getLogin();
      if (ld.eventViewThumbs != 'none') {
        if (ld.eventViewThumbsSize == 'large') {
          NVR.debug ('Switching to big thumbs style');
          $scope.thumbClass = 'large';
        } else {
          NVR.debug ('using small thumbs style');
          $scope.thumbClass = 'small';
        }
      } else {
          NVR.debug ('No thumbs');
      }
      
      $scope.mid = '';


      $scope.$on ("alarm", function() {
        NVR.debug ("EventCtrl: new event notification, doing an immediate reload");
        // do an immediate display reload and schedule timer again
        $interval.cancel(intervalReloadEvents);
        timedPageReload();
        intervalReloadEvents = $interval(function () {
          timedPageReload();
        }.bind(this), zm.eventPageRefresh);


      });

      $scope.$on ( "process-push", function () {
        NVR.debug (">> EventCtrl: push handler");
        var s = NVR.evaluateTappedNotification();
        NVR.debug("tapped Notification evaluation:"+ JSON.stringify(s));
        $scope.mid = $rootScope.tappedMid;
        $ionicHistory.nextViewOptions({
          disableAnimate:true,
          disableBack: true
        });
        $state.go(s[0],s[1],s[2]);
      });
   

      $scope.modalData = {
        "doRefresh": false
      };

      $scope.footerState = ionPullUpFooterState.MINIMIZED;
      $scope.gifshotSupported = true;
      document.addEventListener("pause", onPause, false);
      //console.log("I got STATE PARAM " + $stateParams.id);
      $scope.id = parseInt($stateParams.id, 10);
      if (isNaN($scope.id)) { 
        $scope.id = 0; 
      } 

      if ($scope.id)
        $rootScope.isEventFilterOn = true;


      $scope.showEvent = $stateParams.playEvent || false;
      $scope.monitors = NVR.getMonitorsNow();

      //console.log("lastCheckTime: " + $stateParams.lastCheckTime);
      if ($stateParams.lastCheckTime != undefined && $stateParams.lastCheckTime != '' && moment($stateParams.lastCheckTime).isValid()) {
        $rootScope.fromString = $stateParams.lastCheckTime;
        var mToDate = moment().tz(NVR.getTimeZoneNow());
        $rootScope.toString = mToDate
            .format("YYYY-MM-DD") + " " + mToDate.format("HH:mm:ss");
        $rootScope.isEventFilterOn = true;
        $rootScope.fromDate = moment($rootScope.fromString).toDate();
        $rootScope.fromTime = moment($rootScope.fromString).toDate();
        $rootScope.toDate = moment($rootScope.toString).toDate();
        $rootScope.toTime = moment($rootScope.toString).toDate();
        //console.log("toString: " + $rootScope.toString);
      }



      //console.log("BEFORE ENTER >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");

      NVR.log("EventCtrl called with: E/MID=" + $scope.id + " playEvent =  " + $scope.showEvent);

      enableLoadMore = true;

      $scope.mycarousel = {
        index: 0
      };

      $scope.ionRange = {
        index: 1
      };
      $scope.animationInProgress = false;

      $scope.hours = [];
      $scope.days = [];
      $scope.weeks = [];
      $scope.months = [];

      $scope.eventList = {
        showDelete: false
      };

      $scope.slides = []; // will hold scrub frames
      $scope.totalEventTime = 0; // used to display max of progress bar
      $scope.currentEventTime = 0;
      oldEvent = ""; // will hold previous event that had showScrub = true
      scrollbynumber = 0;
      $scope.eventsBeingLoaded = true;
      $scope.FrameArray = []; // will hold frame info from detailed Events API
      loginData = NVR.getLogin();
      NVR.getKeyConfigParams(0)
        .then(function (data) {
          //console.log ("***GETKEY: " + JSON.stringify(data));
          eventImageDigits = parseInt(data);
          NVR.log("Image padding digits reported as " + eventImageDigits);
        });

      $scope.showSearch = false;

      moreEvents = true;
      $scope.viewTitle = {
        title: ""
      };
      $scope.search = {
        text: ""

      };
      $scope.myfilter = "";

      $scope.loginData = NVR.getLogin();
      $scope.playbackURL = $scope.loginData.url;

    });

    function getEventObject(eid) {

      var apiurl = NVR.getLogin().apiurl + '/events/' + eid + '.json?'+$rootScope.authSession;

      $http.get(apiurl)
        .then(function (data) {},
          function (err) {});

    }

    function getTextZoomCallback(tz) {
      $rootScope.textScaleFactor = parseFloat(tz + "%") / 100.0;
      NVR.debug("text zoom factor is " + $rootScope.textScaleFactor);
    }

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

    //--------------------------------------
    // monitor the slider for carousels
    //--------------------------------------
    function setupWatchers() {
      NVR.debug("Setting up carousel watchers");

      ionRangeWatcher = $scope.$watch('ionRange.index', function () {
        // console.log ("Watching index");
        $scope.mycarousel.index = parseInt($scope.ionRange.index) - 1;
        if (carouselUtils.getStop() == true)
          return;

        //console.log ("***ION RANGE CHANGED TO " + $scope.mycarousel.index);
      });

      mycarouselWatcher = $scope.$watch('mycarousel.index', function () {

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

    // --------------------------------------------------------
    // Handling of back button in case modal is open should
    // close the modal
    // --------------------------------------------------------      

    function getInitialEvents() {
      NVR.debug("getInitialEvents called");
      $scope.eventsBeingLoaded = true;
      $ionicScrollDelegate.$getByHandle("mainScroll").scrollTop();
      var lData = NVR.getLogin();

      // If you came from Monitors, disregard hidden monitors in montage
      /* if (lData.persistMontageOrder && stackState != "Monitors") {
           var tempMon = message;
           $scope.monitors = NVR.applyMontageMonitorPrefs(tempMon, 2)[0];
       } else*/
      $scope.monitors = message;
      currEventsPage = 1;
      maxEventsPage = 1;
      currentPagePosition = 0;
      currentPageLength = 0;

      if ($scope.monitors.length == 0) {
        var pTitle = $translate.instant('kNoMonitors');
        $ionicPopup.alert({
          title: pTitle,
          template: "{{'kCheckCredentials' | translate }}",
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

      $scope.events = [];
      
      if ($scope.id) {
        $rootScope.monitorsFilter = "/MonitorId =:" + $scope.id;
        //console.log("monitors.length: " + $scope.monitors.length);
        for (var i=0; i <= $scope.monitors.length; i++) {
            //console.log("i: " + i);
            if ($scope.monitors[i] != undefined) {
                //console.log("$scope.monitors[i].Id: " + $scope.monitors[i].Monitor.Id);
                if ($scope.monitors[i].Monitor.Id == $scope.id)
                    $scope.monitors[i].Monitor.isChecked = true;
                else
                    $scope.monitors[i].Monitor.isChecked = false;
            }
        }
        $scope.id = 0;
      }

      nolangFrom = "";
      nolangTo = "";
      if ($rootScope.fromString)
        nolangFrom = moment($rootScope.fromString).locale('en').format("YYYY-MM-DD HH:mm:ss");
      if ($rootScope.toString)
        nolangTo = moment($rootScope.toString).locale('en').format("YYYY-MM-DD HH:mm:ss");

      //NVR.debug ("GETTING EVENTS USING "+$scope.id+" "+nolangFrom+" "+ nolangTo);
      NVR.debug("EventCtrl: grabbing events for: id=" + $scope.id + " Date/Time:" + $rootScope.fromString +
        "-" + $rootScope.toString);

      if ($scope.loginData.eventViewThumbs != 'objdetect_gif') {
          maxEventsToLoad = 50; //limit to 5 to minimise memory usage when displaying gifs
      }
      NVR.debug("maxEventsToLoad: " + maxEventsToLoad);

      NVR.getEvents($scope.id, currEventsPage, "", nolangFrom, nolangTo, false, $rootScope.monitorsFilter)
        .then(function (data) {
         // console.log(JSON.stringify(data.pagination));
          if (data.pagination && data.pagination.pageCount)
            maxEventsPage = data.pagination.pageCount;

          NVR.debug("maxEventsPage: " + maxEventsPage + ", currEventsPage: " + currEventsPage);

          // console.log ("WE GOT EVENTS="+JSON.stringify(data));

          //NVR.debug("EventCtrl: success, got " + data.events.length + " events");
          loadEvents(data);
          
          currentPageData = data;
          //$scope.events = data.events;
          // we only need to stop the template from loading when the list is empty
          // so this can be false once we have _some_ content
          $scope.eventsBeingLoaded = false;
          moreEvents = true;
          // to avoid only few events being displayed
          // if last page has less events
          //console.log("**Loading Next Page ***");
          if ($scope.events < maxEventsToLoad) {
            //console.log ("EVENTS LOADED="+JSON.stringify($scope.events));
            NVR.debug("EventCtrl:loading one more page just in case we don't have enough to display");
            loadMore();
          }
          navTitle();
        });
        loadMoreTime = Date.now();
    }

    //-------------------------------------------------------
    // Tapping on a frame shows this image
    //------------------------------------------------------

    function SaveSuccess() {
      $ionicLoading.show({
        template: $translate.instant('kDone'),
        noBackdrop: true,
        duration: 1000
      });
      NVR.debug("ModalCtrl:Photo saved successfuly");
    }

    function SaveError(e) {
      $ionicLoading.show({
        template: $translate.instant('kErrorSave'),
        noBackdrop: true,
        duration: 2000
      });
      NVR.log("Error saving image: " + e.message);
      //console.log("***ERROR");
    }


    function saveNow(imgsrc) {

      var fname = "zmninja.jpg";
      var fn = "cordova.plugins.photoLibrary.saveImage";
      var loginData = NVR.getLogin();


      $ionicLoading.show({
        template: $translate.instant('kSavingSnapshot') + "...",
        noBackdrop: true,
        duration: zm.httpTimeout
      });
      var url = imgsrc;
      NVR.log("saveNow: File path to grab is " + url);

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
                var pluginName = (fname == "zmNinja.mp4" ? "saveVideo" : "saveImage");


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

        $rootScope.zmPopup = SecuredPopups.show('alert', {
          title: $translate.instant('kNote'),
          template: $translate.instant('kDownloadVideoImage') + "<br/><br/><center><a href='" + url + "' class='button button-assertive icon ion-android-download' download>" + " " + $translate.instant('kDownload') + "</a></center>",
          okText: $translate.instant('kDismiss'),
          okType: 'button-stable'
        });



      }



    }




    function writeFile2(path, file, blob, isAppend) {
      var csize = 4 * 1024 * 1024; // 4MB
      var d = $q.defer();
      NVR.debug("Inside writeFile2 with blob size=" + blob.size);

      // nothing more to write, so all good?
      if (!blob.size) {
        NVR.debug("writeFile2 all done");
        d.resolve(true);
        return $q.resolve(true);
      }


      if (!isAppend) {
        // return the delegated promise, even if it fails
        return $cordovaFile.writeFile(path, file, blob.slice(0, csize), true)
          .then(function (succ) {
            return writeFile2(path, file, blob.slice(csize), true);
          });
      } else {
        // return the delegated promise, even if it fails
        return $cordovaFile.writeExistingFile(path, file, blob.slice(0, csize))
          .then(function (succ) {
            return writeFile2(path, file, blob.slice(csize), true);
          });
      }


    }

    function writeFile(path, __filename, __data) {
      var d = $q.defer();
      //console.log ("inside write file");
      window.requestFileSystem(LocalFileSystem.TEMPORARY, __data.size + 5000, onFileSystemSuccess, fail);

      function fail(e) {
        var msg = '';

        switch (e.code) {
          case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
          case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
          case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
          case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
          case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
          default:
            msg = 'Unknown Error';
            break;
        }

        //console.log('Error: ' + msg);
      }

      function onFileSystemSuccess() {
        // console.log ("Got temporary FS");
        window.resolveLocalFileSystemURL(path, function (dir) {
            dir.getFile(__filename, {
              create: true
            }, function (file) {
              file.createWriter(function (fileWriter) {
                //var blob = new Blob([__data], {type:'text/plain'});
                // console.log ("about to write "+__data.size+" bytes");
                //var blob = new Blob([__data], {type:'text/plain'});
                fileWriter.write(__data);
                fileWriter.onwrite = function (e) {
                  NVR.debug("write complete");
                  d.resolve();
                  return d.promise;
                };

                fileWriter.onerror = function (e) {
                  NVR.debug("write error in filewriter:" + JSON.stringify(e));
                  d.reject();
                  return d.promise;
                };

              });
            });

          },
          function (err) {
            d.reject(err);
            return d.promise;
          });
      }
      return d.promise;
    }


    function moveImageToGallery(fname) {
      // this is https://github.com/terikon/cordova-plugin-photo-library

      NVR.debug("moveImageToGallery called with " + fname);
      cordova.plugins.photoLibrary.saveImage(fname, "zmNinja", onSuccess, onError);
      //LibraryHelper.saveImageToLibrary(onSuccess, onError, fname, "zmNinja");

      function onSuccess(results) {

        NVR.debug("Removing temp file");

        if ($rootScope.platformOS == 'ios') {
          $cordovaFile.removeFile(cordova.file.documentsDirectory, "temp-file.gif");
        } else
          $cordovaFile.removeFile(cordova.file.dataDirectory, "temp-file.gif");
        $ionicLoading.show({
          template: $translate.instant('kDone'),
          noBackdrop: true,
          duration: 2000
        });


      }

      function onError(error) {
        // console.log("Error: " + error);

      }
    }

    $scope.readyToPlay = function (api) {

      eHandle = api;
      eHandle.mediaElement.attr("playsinline", "");


    };

    $scope.eventCanPlay = function() {
        NVR.debug("This video can be played");
        eHandle.play();

    };


    $scope.downloadFileToDevice = function (path, eid) {

      NVR.setAwake(true);
      var tp;
      if ($rootScope.platformOS == 'ios')
        tp = cordova.file.documentsDirectory + "temp-video.mp4";
      else
        tp = cordova.file.dataDirectory + "temp-video.mp4";

      var th = true;

      var opt = {};

      if ($rootScope.basicAuthHeader) {
        opt.headers = {
          "Authorization": $rootScope.basicAuthHeader
        };
        NVR.debug("download with auth options is:" + JSON.stringify(opt));
      }

      //path = "http://techslides.com/demos/sample-videos/small.mp4";

      NVR.debug("Saving temporary video to: " + tp);
      $cordovaFileTransfer.download(path, tp, opt, th)
        .then(function (result) {
          NVR.debug("Moving to gallery...");
          var ntp;
          ntp = tp.indexOf('file://') === 0 ? tp.slice(7) : tp;

          $timeout(function () {
            $ionicLoading.hide();
          });
          moveToGallery(ntp, eid + "-video");
          NVR.setAwake(false);
          // Success!
        }, function (err) {
          NVR.setAwake(false);
          NVR.log("Error=" + JSON.stringify(err));

          $timeout(function () {
            $ionicLoading.show({

              template: $translate.instant('kError'),
              noBackdrop: true,
              duration: 3000
            });
          });
          // Error
        }, function (progress) {
          var p = Math.round((progress.loaded / progress.total) * 100);

          $ionicLoading.show({

            template: $translate.instant('kPleaseWait') + "...(" + p + "%)",
            noBackdrop: true
          });

        });

      function moveToGallery(path, fname) {

        NVR.debug("moveToGallery called with " + path);
        LibraryHelper.saveVideoToLibrary(onSuccess, onError, path, fname);

        function onSuccess(results) {
          $ionicLoading.hide();
          NVR.debug("Removing temp file");

          if ($rootScope.platformOS == 'ios')
            $cordovaFile.removeFile(cordova.file.documentsDirectory, "temp-video.mp4");
          else
            $cordovaFile.removeFile(cordova.file.dataDirectory, "temp-video.mp4");

        }

        function onError(error) {
          $ionicLoading.hide();
          NVR.debug("Error: " + error);

        }
      }

    };

    $scope.mp4warning = function () {
      $ionicPopup.alert({
        title: $translate.instant('kNote'),
        template: "{{'kVideoMp4Warning' | translate }}",
        okText: $translate.instant('kButtonOk'),
        cancelText: $translate.instant('kButtonCancel'),
      });
    };

    $scope.showImage = function (p, f, fid, e, imode, id, parray, ndx) {
      var img;

//      console.log ("P="+p+" F="+f+" E="+e+" imode="+imode+"  id="+id+" parray="+JSON.stringify(parray)+" ndx="+ndx);

      //console.log ("HERE");
      $scope.kFrame = $translate.instant('kFrame');
      $scope.kEvent = $translate.instant('kEvent');
      $scope.ndx = ndx;
      $scope.parray = parray;
      $scope.imode = imode;

      // note ndx may be incorrect if we are looking 
      // at unique frames;

      // NVR.debug("Hello");
      if ($scope.typeOfFrames == $translate.instant('kShowTimeDiffFrames')) {

        var ic;

        for (ic = 0; ic < $scope.parray.length; ic++) {
          if ($scope.parray[ic].frameid == fid)
            break;
        }

        NVR.debug("Readjusting selected frame ID from:" + $scope.ndx + "  to actual frame ID of:" + ic);
        $scope.ndx = ic;
      } else {
        NVR.debug("No index adjustment necessary as we are using all frames");
      }

     
        $scope.imgsrc = p + "/index.php?view=image&fid=" + $scope.parray[$scope.ndx].id + $scope.outlineMotionParam+$rootScope.authSession;
        $scope.fallbackImgSrc = p + "/index.php?view=image&fid=" + $scope.parray[$scope.ndx].id+$rootScope.authSession;

   

      //$rootScope.zmPopup = $ionicPopup.alert({title: kFrame+':'+fid+'/'+kEvent+':'+e,template:img,  cssClass:'popup80'});

   
  


      $scope.imgsrc += NVR.insertSpecialTokens();
      $scope.fallbackImgSrc += NVR.insertSpecialTokens();



      $rootScope.zmPopup = $ionicPopup.show({
        template: '<center>' + $translate.instant('kFrame') + ':{{parray[ndx].frameid}}@{{prettifyTimeSec(parray[ndx].time)}}</center><br/><img ng-src="{{imgsrc}}" fallback-src="{{fallbackImgSrc}}" width="100%"  />',
        title: $translate.instant('kImages') + " (" + $translate.instant($scope.typeOfFrames) + ")",
        subTitle: 'use left and right arrows to change',
        scope: $scope,
        cssClass: 'popup95',
        buttons: [

          {
            text: '',
            type: 'button-assertive button-small ion-camera',
            onTap: function (e) {
              e.preventDefault();
              saveNow($scope.imgsrc);

            }
          },

          {
            // left 1
            text: '',
            type: 'button-small button-energized ion-chevron-left',
            onTap: function (e) {
              // look for next frame that matches the type of frame
              // we are showing (all or diff timestamps);

              // console.log ("TYPE OF FRAMES: " + $scope.typeOfFrames);
              var nndx = null;
              var alltype = $translate.instant('kShowAllFrames');
              for (var i = $scope.ndx - 1; i >= 0; i--) {
                if ($scope.parray[i].type == $scope.typeOfFrames || $scope.typeOfFrames == alltype) {
                  nndx = i;
                  break;
                }
              }
              if (nndx == null) nndx = $scope.ndx;
              $scope.ndx = nndx;

             
                $scope.imgsrc = p + "/index.php?view=image&fid=" + $scope.parray[$scope.ndx].id + $scope.outlineMotionParam+$rootScope.authSession;
                $scope.fallbackImgSrc = p + "/index.php?view=image&fid=" + $scope.parray[$scope.ndx].id+$rootScope.authSession;

         


              e.preventDefault();

            }
          },
          {
            // right 1
            text: '',
            type: 'button-small button-energized ion-chevron-right',
            onTap: function (e) {

              // look for next frame that matches the type of frame
              // we are showing (all or diff timestamps);

              // console.log ("TYPE OF FRAMES: " + $scope.typeOfFrames);
              var nndx = null;
              var alltype = $translate.instant('kShowAllFrames');
              for (var i = $scope.ndx + 1; i < $scope.parray.length; i++) {
                //console.log ("Comparing: " +$scope.parray[i].type +" to " + $scope.typeOfFrames);
                if ($scope.parray[i].type == $scope.typeOfFrames || $scope.typeOfFrames == alltype) {
                  nndx = i;
                  break;
                }
              }
              if (nndx == null) nndx = $scope.ndx;
              $scope.ndx = nndx;

             
                $scope.imgsrc = p + "/index.php?view=image&fid=" + $scope.parray[$scope.ndx].id + $scope.outlineMotionParam+$rootScope.authSession;
                $scope.fallbackImgSrc = p + "/index.php?view=image&fid=" + $scope.parray[$scope.ndx].id+$rootScope.authSession;

              


              e.preventDefault();

            }
          },

          {
            text: '',
            type: 'button-positive button-small ion-checkmark-round',
            onTap: function (e) {

            }
          }
        ]
      });

    };



    $scope.toggleMotionOutline = function () {
      $scope.outlineMotion = !$scope.outlineMotion;
      if ($scope.outlineMotion)
        $scope.outlineMotionParam = "&show=analyse";
      else
        $scope.outlineMotionParam = "&show=capture";
    };

    $scope.toggleTypeOfAlarms = function () {
      //  "kShowAllFrames"             : "all",
      // "kShowTimeDiffFrames"        :  "different timestamps"

      if ($scope.typeOfFrames == $translate.instant('kShowAllFrames')) {
        $scope.typeOfFrames = $translate.instant('kShowTimeDiffFrames');
      } else {
        $scope.typeOfFrames = $translate.instant('kShowAllFrames');
      }
    };

    // not explictly handling error --> I have a default "No events found" message
    // displayed in the template if events list is null

    //--------------------------------------------------------------------------
    // This is what the pullup bar calls depending on what range is specified
    //--------------------------------------------------------------------------
    $scope.showEvents = function (val, unit, monitorId) {
      NVR.debug("ShowEvents called with val:" + val + " unit:" + unit + " for Monitor:" + monitorId);

      $ionicHistory.nextViewOptions({
        disableBack: true
      });

      // we have to convert from and to, to server time
      var mToDate = moment().tz(NVR.getTimeZoneNow());
      var mFromDate = moment().subtract(parseInt(val), unit).tz(NVR.getTimeZoneNow());

      // console.log("Moment Dates:" + mFromDate.format() + " TO  " + mToDate.format());

      $rootScope.fromTime = mFromDate.toDate();
      $rootScope.toTime = mToDate.toDate();
      $rootScope.fromDate = $rootScope.fromTime;
      $rootScope.toDate = $rootScope.toTime;

      NVR.debug("From: " + $rootScope.fromTime);
      NVR.debug("To: " + $rootScope.toTime);

      //$rootScope.fromDate = fromDate.toDate();
      //$rootScope.toDate = toDate.toDate();
      $rootScope.isEventFilterOn = true;
      $rootScope.fromString = mFromDate
        .format("YYYY-MM-DD") + " " + mFromDate.format("HH:mm:ss");

      $rootScope.toString = mToDate
        .format("YYYY-MM-DD") + " " + mToDate
        .format("HH:mm:ss");

      // console.log("**************From String: " + $rootScope.fromString);
      //  console.log("**************To String: " + $rootScope.toString);

      // reloading - may solve https://github.com/pliablepixels/zmNinja/issues/36
      // if you are in the same mid event page $state.go won't work

      $scope.id = monitorId;
      $scope.showEvent = false;
      $scope.footerState = ionPullUpFooterState.MINIMIZED;
      getInitialEvents();

      /* console.log ("---> SENDING TO EVENTS WITH mid " + monitorId);
       $state.go("app.events",
       {
           "id": monitorId,
           "playEvent": false
       },
       {
           reload: true
       });*/
    };
    
    $scope.nextEventsLoad = function () {
        NVR.debug("nextEventsLoad called");
        $scope.nextEvents = false;
        //$scope.eventsBeingLoaded = true;
        var lData = NVR.getLogin();

        currEventsPage = 1;
        maxEventsPage = 1;
        currentPagePosition = 0;
        currentPageLength = 0;

        nolangFrom = "";
        nolangTo = "";
        if ($rootScope.toString && $rootScope.fromString) {
            //nolangTo = moment($rootScope.fromString).locale('en').format("YYYY-MM-DD HH:mm:ss");
            nolangTo = moment($scope.events[$scope.events.length-1].Event.StartTime).subtract(1, 'seconds').locale('en').format("YYYY-MM-DD HH:mm:ss");
            //$rootScope.fromString = new Date('01/01/2000');
            nolangFrom = moment(new Date('01/01/2000')).locale('en').format("YYYY-MM-DD HH:mm:ss");
        }
        
      //NVR.debug ("GETTING EVENTS USING "+$scope.id+" "+nolangFrom+" "+ nolangTo);
      NVR.debug("EventCtrl: grabbing events for: id=" + $scope.id + " Date/Time:" + nolangFrom +
        "-" + nolangTo);

      NVR.getEvents($scope.id, currEventsPage, "", nolangFrom, nolangTo, false, $rootScope.monitorsFilter)
        .then(function (data) {
         // console.log(JSON.stringify(data.pagination));
          if (data.pagination && data.pagination.pageCount)
            maxEventsPage = data.pagination.pageCount;

          NVR.debug("maxEventsPage: " + maxEventsPage + ", currEventsPage: " + currEventsPage);

          // console.log ("WE GOT EVENTS="+JSON.stringify(data));

          //NVR.debug("EventCtrl: success, got " + data.events.length + " events");
          loadEvents(data);
          
          currentPageData = data;
          //$scope.events = data.events;
          // we only need to stop the template from loading when the list is empty
          // so this can be false once we have _some_ content
          // FIXME: check reload
          //$scope.eventsBeingLoaded = false;
          moreEvents = true;
        });
        loadMoreTime = Date.now();
    };

    //----------------------------------------------------------------
    // Alarm notification handling
    //----------------------------------------------------------------
    $scope.handleAlarms = function () {
      // $rootScope.isAlarm = !$rootScope.isAlarm;

      if ($scope.modal !== undefined) {
        $scope.modal.remove();
      }
      if ($rootScope.isAlarm) {
        $rootScope.alarmCount = "0";
        $rootScope.isAlarm = !$rootScope.isAlarm;
        /*$ionicHistory.nextViewOptions(
        {
            disableBack: true
        });
        $state.go("app.events",
        {
            "id": 0,
            "playEvent": false
        },
        {
            reload: true
        }); */

        getInitialEvents();
        return;
      }
    };

    // credit:http://stackoverflow.com/a/20151856/1361529
    function base64toBlob(base64Data, contentType) {
      contentType = contentType || '';
      var sliceSize = 1024;
      var byteCharacters = atob(base64Data);
      var bytesLength = byteCharacters.length;
      var slicesCount = Math.ceil(bytesLength / sliceSize);
      var byteArrays = new Array(slicesCount);

      for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        var begin = sliceIndex * sliceSize;
        var end = Math.min(begin + sliceSize, bytesLength);

        var bytes = new Array(end - begin);
        for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
          bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
      }
      return new Blob(byteArrays, {
        type: contentType
      });
    }

    //----------------------------------------------------------
    // create an array of images
    // to keep memory manageable, we are only  going to pick up alarmed frames
    // and that too, max 1ps
    // --------------------------------------------------------------
    function prepareImages(e) {
      var d = $q.defer();
      var imglist = [];
      var myurl = loginData.apiurl + '/events/' + e.Event.Id + ".json?"+$rootScope.authSession;
      $http.get(myurl)
        .then(function (succ) {
            var data = succ.data;
            var fps = 0;
            var lastTime = "";

            for (var i = 0; i < data.event.Frame.length; i++) {
              if (data.event.Frame[i].Type == "Alarm")
              //if (1)
              {
                var fname;
                //console.log ("PATH="+e.Event.imageMode);
                
                  fname = e.Event.recordingURL + "/index.php?view=image&width=" + zm.maxGifWidth + "&fid=" + data.event.Frame[i].Id+$rootScope.authSession;
             

                if (data.event.Frame[i].TimeStamp != lastTime /*|| fps < 2*/ )

                {
                  imglist.push(fname);
                  //fps = data.event.Frame[i].TimeStamp != lastTime ? 0 : fps+1;
                  lastTime = data.event.Frame[i].TimeStamp;
                }

              }

            }

            // next up make sure we are not processing more than 100 images

            while (imglist.length > zm.maxGifCount2) {
              NVR.debug("Too many images: " + imglist.length + ", deleting  alternate frames to keep it <=" + zm.maxGifCount2);

              for (var l = 0; l < imglist.length; l++) {
                imglist.splice(l + 1, 2);
                if (imglist.length <= zm.maxGifCount2) break;
              }

            }
            NVR.debug("final image list length is:" + imglist.length);

            d.resolve(imglist);
            return d.promise;
          },
          function (err) {
            d.reject(err);
            return d.promise;
          });
      return d.promise;
    }

    // force image to be of zm.maxGifWidth. TBD: rotated foo
    function adjustAspect(e) {

      var w = zm.maxGifWidth;
      var h = Math.round(e.Event.Height / e.Event.Width * zm.maxGifWidth);
      return {
        w: w,
        h: h
      };

    }

    // for devices - handle permission before you download
    $scope.permissionsDownload = function (e) {
      if ($rootScope.platformOS == 'desktop') {
        gifAlert(e);
      } else {

        //console.log("in perms");
        cordova.plugins.photoLibrary.getLibrary(
          function (library) {
            gifAlert(e);
          },
          function (err) {
            if (err.startsWith('Permission')) {
              // call requestAuthorization, and retry
              cordova.plugins.photoLibrary.requestAuthorization(
                function () {
                  // User gave us permission to his library, retry reading it!
                  gifAlert(e);
                },
                function (err) {
                  NVR.log("ERROR with saving permissions " + err);
                  // User denied the access
                }, // if options not provided, defaults to {read: true}. 
                {
                  read: true,
                  write: true
                }
              );
            }
            // Handle error - it's not permission-related
          }
        );

      }
    };

    // make sure the user knows the GIF is not full fps/all frames
    function gifAlert(e) {
      if (navigator.userAgent.toLowerCase().indexOf('crosswalk') == -1) {
        $ionicPopup.confirm({
          title: $translate.instant('kNote'),
          template: "{{'kGifWarning' | translate }}",
          okText: $translate.instant('kButtonOk'),
          cancelText: $translate.instant('kButtonCancel'),
        }).then(function (res) {
          if (res) {
            downloadAsGif2(e);
          } else
            NVR.debug("User cancelled GIF");

        });
      } else {
        $ionicPopup.alert({
          title: $translate.instant('kNote'),
          template: "{{'kGifNoCrosswalk' | translate}}"
        });
      }


    }

    // convert to base64 - devices need this to save to gallery
    function blobToBase64(blob) {
      NVR.debug("converting blob to base64...");
      var d = $q.defer();
      var reader = new window.FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = function () {
        var base64data = reader.result;
        //console.log(base64data );
        d.resolve(base64data);
        return d.promise;

      };
      return d.promise;
    }

    // part of neuquant conversion 
    function componentizedPaletteToArray(paletteRGB) {
      var paletteArray = [],
        i, r, g, b;
      for (i = 0; i < paletteRGB.length; i += 3) {
        r = paletteRGB[i];
        g = paletteRGB[i + 1];
        b = paletteRGB[i + 2];
        paletteArray.push(r << 16 | g << 8 | b);
      }
      return paletteArray;
    }

    // part of neuquant conversion 
    function dataToRGB(data, width, height) {
      var i = 0,
        length = width * height * 4,
        rgb = [];
      while (i < length) {
        rgb.push(data[i++]);
        rgb.push(data[i++]);
        rgb.push(data[i++]);
        i++;
      }
      return rgb;
    }

    // credit Jimmy Warting
    // https://github.com/jimmywarting/StreamSaver.js/issues/38
    // he stream-ized and cleaned up the gif creation process
    // using GifWriter.js
    function createGif(files, w, h) {

      var cv = document.getElementById("canvas");
      var ctx = cv.getContext("2d");
      var pixels = new Uint8Array(w * h);
      var totalImages = files.length;
      var processedImages = 0;

      cv.width = w;
      cv.height = h;

      var rs = new ReadableStream({
        // Each time pull gets called you should get the pixel data and
        // enqueue it as if it would be good old gif.addFrame()
        pull: function pull(controller) {
          var frame = files.shift();
          if (!frame) {
            controller.close();
            return;
          }

          return $http({
              url: frame,
              responseType: "blob"
            })
            .then(function (res) {

              return res.data.image();
            })
            .then(function (img) {
              processedImages++;

              var p = Math.round(processedImages / totalImages * 100);
              $ionicLoading.show({
                template: $translate.instant('kPleaseWait') + "...(" + p + "%)",
                noBackdrop: true
              });

              // console.log("URL=" + frame);
              URL.revokeObjectURL(img.src);
              ctx.drawImage(img, 0, 0);

              var data = ctx.getImageData(0, 0, w, h).data;
              var rgbComponents = dataToRGB(data, w, h);
              var nq = new NeuQuant(rgbComponents, rgbComponents.length, 15);
              var paletteRGB = nq.process();
              var paletteArray = new Uint32Array(componentizedPaletteToArray(paletteRGB));
              var numberPixels = w * h;
              var k = 0,
                i, r, g, b;

              for (i = 0; i < numberPixels; i++) {
                r = rgbComponents[k++];
                g = rgbComponents[k++];
                b = rgbComponents[k++];
                pixels[i] = nq.map(r, g, b);
              }

              controller.enqueue([0, 0, w, h, pixels,
                {
                  palette: paletteArray,
                  delay: 100, // 1 second
                }
              ]);
            });
        }
      });

      return new GifWriter(rs, w, h, {
        loop: null
      });
    }



    function downloadAsGif2(e) {
      $rootScope.isDownloading = true;
      $ionicLoading.show({
        template: $translate.instant('kPleaseWait') + "...",
        noBackdrop: true,
        duration: 20000
      });
      NVR.setAwake(true);

      prepareImages(e)
        .then(function (files) {
            return $http({
                url: files[0],
                responseType: "blob"
              })
              .then(function (res) {
                return res.data.image();
              })
              .then(function (img) {
                URL.revokeObjectURL(img.src); // Revoke object URL to free memory
                var stream = createGif(files, img.width, img.height);
                //var fileStream = streamSaver.createWriteStream('image.gif');

                var chunks = [];
                var reader = stream.getReader();

                function pull() {
                  return reader.read().then(function (result) {
                    chunks.push(result.value);
                    return result.done ? chunks : pull();
                  });
                }

                pull().then(function (chunks) {
                  var blob = new Blob(chunks, {
                    type: "image/gif"

                  });

                  //alert ("WE ARE DONE!");
                  if ($rootScope.platformOS == 'desktop') {
                    saveAs(blob, e.Event.Id + "-video.gif");
                    $ionicLoading.hide();
                  } else {
                    // write blob to file
                    var tp;
                    if ($rootScope.platformOS == 'ios')
                      tp = cordova.file.documentsDirectory;
                    else
                      tp = cordova.file.dataDirectory;
                    var th = true,
                      opt = {};

                    $ionicLoading.show({

                      template: "writing to file...",
                      noBackdrop: true,
                    });

                    //var bloburl = URL.createObjectURL(blob);
                    //NVR.debug ("blob-url is:"+bloburl);

                    writeFile2(tp, "temp-file.gif", blob, false)
                      .then(function (succ) {
                        NVR.debug("write to file successful");
                        //  console.log( "write file successful");
                        $ionicLoading.hide();

                        var ntp = tp;
                        //ntp = tp.indexOf('file://') === 0 ? tp.slice(7) : tp;

                        ntp = ntp + "temp-file.gif";
                        // console.log ("ntp="+ntp);

                        moveImageToGallery(ntp);
                        $rootScope.isDownloading = false;

                      }, function (err) {
                        $rootScope.isDownloading = false;
                        $ionicLoading.hide();
                        NVR.debug("error writing to file " + JSON.stringify(err));


                      });
                  }

                });
              });

          },
          function (err) {
            $ionicLoading.hide();
            NVR.setAwake(false);
            NVR.log("Error getting frames");
            $rootScope.isDownloading = false;
          }

        );

    }

    // NOT USED - WILL REMOVE AFTER TESTING OTHER METHOD MORE
    function downloadAsGif(e) {
      $ionicLoading.show({
        template: $translate.instant('kPleaseWait') + "...",
        noBackdrop: true,
        duration: 20000
      });

      prepareImages(e)
        .then(function (imgs) {

            // console.log("TOTAL IMAGES TO GIF=" + imgs.length);
            //console.log(JSON.stringify(imgs));

            var ad = adjustAspect(e);
            //console.log("SAVING W=" + ad.w + " H=" + ad.h);
            NVR.setAwake(true);
            gifshot.createGIF({

              'gifWidth': ad.w,
              'gifHeight': ad.h,
              'images': imgs,
              'interval': 1,
              //'loop':null,
              'sampleInterval': 20,
              //'frameDur':5, // 1/2 a sec
              'text': 'zmNinja',
              'crossOrigin': 'use-credentials',
              'progressCallback': function (cp) {
                var p = Math.round(cp * 100);
                $ionicLoading.show({
                  template: $translate.instant('kPleaseWait') + "...(" + p + "%)",
                  noBackdrop: true
                });
              }
            }, function (obj) {
              NVR.setAwake(false);
              if (!obj.error) {
                //console.log(obj.image);

                var blob;

                if ($rootScope.platformOS == 'desktop') {

                  obj.image = obj.image.replace(/data:image\/gif;base64,/, '');
                  blob = base64toBlob(obj.image, "image/gif");
                  var f = NVR.getMonitorName(e.Event.MonitorId);
                  f = f + "-" + e.Event.Id + ".gif";
                  saveAs(blob, f);
                  $ionicLoading.hide();
                } else {
                  NVR.debug("Saving blob to gallery...");
                  var album = "zmNinja";
                  cordova.plugins.photoLibrary.saveImage(obj.image, album,
                    function () {
                      $ionicLoading.hide();
                      NVR.debug("Event saved");
                    },
                    function (err) {
                      $ionicLoading.hide();
                      NVR.debug("Saving ERROR=" + err);
                    });

                }

              } else {
                $ionicLoading.hide();
                NVR.log("Error creating GIF");
              }
            });
          },
          function (err) {
            $ionicLoading.hide();
            NVR.log("Error getting frames");
          }

        );
    }

    $scope.archiveUnarchiveEvent = function (ndx, eid) {
      //https://server/zm/api/events/11902.json -XPUT -d"Event[Archived]=1"
      //
      $ionicListDelegate.closeOptionButtons();

      NVR.debug("Archiving request for EID=" + eid);
      var loginData = NVR.getLogin();
      var apiArchive = loginData.apiurl + "/events/" + eid + ".json?"+$rootScope.authSession;
      var setArchiveBit = ($scope.events[ndx].Event.Archived == '0') ? "1" : "0";

      NVR.debug("Calling archive with:" + apiArchive + " and Archive=" + setArchiveBit);
      //put(url, data, [config]);

      // $http.put(apiArchive,"Event[Archived]="+setArchiveBit)
      // 
      $ionicLoading.show({
        template: "{{'kPleaseWait' | translate}}...",
        noBackdrop: true,
        duration: zm.httpTimeout
      });

      $http({

          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': '*/*',
          },
          transformRequest: function (obj) {
            var str = [];
            for (var p in obj)
              str.push(encodeURIComponent(p) + "=" +
                encodeURIComponent(obj[p]));
            var foo = str.join("&");
            // console.log("****RETURNING " + foo);
            NVR.debug("MonitorCtrl: parmeters constructed: " + foo);
            return foo;
          },
          url: apiArchive,
          data: {
            "Event[Archived]": setArchiveBit

          }
        })
        .then(function (success) {

            NVR.log("archiving response: " + JSON.stringify(success));
            if (success.data.message == 'Error') {
              $ionicLoading.show({
                template: "{{'kError' | translate}}...",
                noBackdrop: true,
                duration: 1500
              });

            } else {


              $ionicLoading.show({
                template: "{{'kSuccess' | translate}}...",
                noBackdrop: true,
                duration: 1000
              });
              if ($scope.events[ndx].Event.Archived == '0')
                $scope.events[ndx].Event.Archived = '1';
              else
                $scope.events[ndx].Event.Archived = '0';
            }



          },
          function (error) {
            NVR.log("Error archiving: " + JSON.stringify(error));
          });



    };

    //--------------------------------------------------------------------------
    // Takes care of deleting individual events
    //--------------------------------------------------------------------------



    $scope.deleteEvent = function (id, itemid) {
      deleteEvent(id, itemid);

    };

    function deleteEvent(id, itemid) {
      //$scope.eventList.showDelete = false;
      //curl -XDELETE http://server/zm/api/events/1.json
      var loginData = NVR.getLogin();
      var apiDelete = loginData.apiurl + "/events/" + id + ".json?"+$rootScope.authSession;
      NVR.debug("DeleteEvent: ID=" + id + " item=" + itemid);
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
            NVR.debug("delete output: " + JSON.stringify(data));

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
              if (itemid >= 0) $scope.events.splice(itemid, 1);

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

    //------------------------------------------------
    // Tapping on the filter sign lets you reset it
    //-------------------------------------------------

    $scope.filterTapped = function () {
      //console.log("FILTER TAPPED");
      var myFrom = $translate.instant('kAll');
      var toString = $translate.instant('kAll');
      var monString = '';

      if (moment($rootScope.fromString).isValid())
        myFrom = moment($rootScope.fromString).format("MMM/DD/YYYY " + NVR.getTimeFormat()).toString();
      if (moment($rootScope.toString).isValid())
        toString = moment($rootScope.toString).format("MMM/DD/YYYY " + NVR.getTimeFormat()).toString();
      if ($rootScope.monitorsFilter != '')
        monString = $translate.instant('kFilterEventsSelectiveMon');

      $rootScope.zmPopup = $ionicPopup.confirm({
        title: $translate.instant('kFilterSettings'),
        template: $translate.instant('kFilterEventsBetween1') + ':<br/> <b>' + myFrom + "</b> " + $translate.instant('kTo') + " <b>" + toString + '</b> '+ monString+'<br/>' + $translate.instant('kFilterEventsBetween2'),
        okText: $translate.instant('kButtonOk'),
        cancelText: $translate.instant('kButtonCancel'),
      });
      $rootScope.zmPopup.then(function (res) {
        if (res) {
          NVR.log("Filter reset requested in popup");
          $rootScope.isEventFilterOn = false;
          $rootScope.fromDate = "";
          $rootScope.fromTime = "";
          $rootScope.toDate = "";
          $rootScope.toTime = "";
          $rootScope.fromString = "";
          $rootScope.toString = "";
          $rootScope.monitorsFilter = "";
          $scope.id = 0;
          $scope.showEvent = false;
          $scope.footerState = ionPullUpFooterState.MINIMIZED;
          getInitialEvents();

          /*
          $ionicHistory.nextViewOptions(
          {
              disableBack: true
          });
          $state.go("app.events",
          {
              "id": 0,
              "playEvent": false,
              refresh:true
          });*/

          return;
        } else {
          NVR.log("Filter reset cancelled in popup");
        }
      });

    };

    //--------------------------------------------------------------------------
    // When the user pulls the pullup bar we call this to get the latest
    // data for events ranges summaries using the consolveEvents facility of ZM
    //--------------------------------------------------------------------------


    $scope.footerToggle = function() {

      if ($scope.footerState == ionPullUpFooterState.EXPANDED)
        $scope.footerCollapse();
      else 
        $scope.footerExpand();
    };

    $scope.footerExpand = function () {
      $scope.footerState = ionPullUpFooterState.EXPANDED;
      footerExpand();

    };

    $scope.footerCollapse = function() {
      $scope.footerState = ionPullUpFooterState.MINIMIZED;
    };

    function footerExpand() {
      //https://server/zm/api/events/consoleEvents/5%20minute.json
      var ld = NVR.getLogin();

      var af="";
      if (ld.enableAlarmCount && ld.minAlarmCount )
        af = "/AlarmFrames >=:" + ld.minAlarmCount ;

      if (ld.objectDetectionFilter) {
        af = af + '/'+'Notes REGEXP:detected:';
      }

     

      var apiurl = ld.apiurl + "/events/consoleEvents/1 hour" + af + ".json?"+$rootScope.authSession;
      //NVR.debug("consoleEvents API:" + apiurl);

      $http.get(apiurl)
        .then(function (data) {
          data = data.data;
         // NVR.debug(JSON.stringify(data));  
          $scope.hours = [];
          var p = data.results;
          for (var key in data.results) {

            if (p.hasOwnProperty(key)) {

              var idfound = true;
              //console.log ("PERSIST IS " + ld.persistMontageOrder);
              if (ld.persistMontageOrder) {
                idfound = false;
                for (var ii = 0; ii < $scope.monitors.length; ii++) {
                  if ($scope.monitors[ii].Monitor.Id == key && (NVR.isNotHidden(key) || showHiddenMonitors)) {
                    // console.log ("Authorizing "+$scope.monitors[ii].Monitor.Name);
                    idfound = true;
                    break;
                  }
                }
              }
              //console.log(NVR.getMonitorName(key) + " -> " + p[key]);
              if (idfound)
                $scope.hours.push({
                  monitor: NVR.getMonitorName(key),
                  events: p[key],
                  mid: key
                });

            }
          }
        });

      apiurl = ld.apiurl + "/events/consoleEvents/1 day" + af + ".json?"+$rootScope.authSession;
      //NVR.debug("consoleEvents API:" + apiurl);
      $http.get(apiurl)
        .then(function (data) {
          data = data.data;
          //NVR.debug(JSON.stringify(data));
          $scope.days = [];
          var p = data.results;
          for (var key in data.results) {
            if (p.hasOwnProperty(key)) {
              var idfound = true;
              if (ld.persistMontageOrder) {
                idfound = false;
                for (var ii = 0; ii < $scope.monitors.length; ii++) {
                  if ($scope.monitors[ii].Monitor.Id == key && (NVR.isNotHidden(key) || showHiddenMonitors)) {
                    idfound = true;
                    break;
                  }
                }
              }
              //console.log(NVR.getMonitorName(key) + " -> " + p[key]);
              if (idfound)
                //console.log(NVR.getMonitorName(key) + " -> " + p[key]);
                $scope.days.push({
                  monitor: NVR.getMonitorName(key),
                  events: p[key],
                  mid: key
                });

            }
          }
        });

      apiurl = ld.apiurl + "/events/consoleEvents/1 week" + af + ".json?"+$rootScope.authSession;
      //NVR.debug("consoleEvents API:" + apiurl);
      $http.get(apiurl)
        .then(function (data) {
          data = data.data;
         // NVR.debug(JSON.stringify(data));
          $scope.weeks = [];
          var p = data.results;
          for (var key in data.results) {
            if (p.hasOwnProperty(key)) {

              var idfound = true;
              if (ld.persistMontageOrder) {
                idfound = false;
                for (var ii = 0; ii < $scope.monitors.length; ii++) {
                  if ($scope.monitors[ii].Monitor.Id == key && (NVR.isNotHidden(key) || showHiddenMonitors)) {
                    idfound = true;
                    break;
                  }
                }
              }
              //console.log(NVR.getMonitorName(key) + " -> " + p[key]);
              if (idfound)
                //console.log(NVR.getMonitorName(key) + " -> " + p[key]);
                $scope.weeks.push({
                  monitor: NVR.getMonitorName(key),
                  events: p[key],
                  mid: key
                });

            }
          }
        });

      apiurl = ld.apiurl + "/events/consoleEvents/1 month" + af + ".json?"+$rootScope.authSession;
      //NVR.debug("consoleEvents API:" + apiurl);
      $http.get(apiurl)
        .then(function (data) {
          data = data.data;
          //NVR.debug(JSON.stringify(data));
          $scope.months = [];
          var p = data.results;
          for (var key in data.results) {
            if (p.hasOwnProperty(key)) {

              var idfound = true;
              var ld = NVR.getLogin();
              if (ld.persistMontageOrder) {
                idfound = false;
                for (var ii = 0; ii < $scope.monitors.length; ii++) {
                  if ($scope.monitors[ii].Monitor.Id == key && (NVR.isNotHidden(key) || showHiddenMonitors)) {
                    idfound = true;
                    break;
                  }
                }
              }
              //console.log(NVR.getMonitorName(key) + " -> " + p[key]);
              if (idfound)
                //console.log(NVR.getMonitorName(key) + " -> " + p[key]);
                $scope.months.push({
                  monitor: NVR.getMonitorName(key),
                  events: p[key],
                  mid: key
                });

            }
          }
        });

    }

    $scope.openMenu = function () {
      $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.scrolling = function() {
      //console.log("scrolling : When Scrolling");
      navTitle();
    };
    
    function navTitle() {
      if (!$ionicScrollDelegate.$getByHandle("mainScroll")) $scope.navTitle = "";
      if (!$ionicScrollDelegate.$getByHandle("mainScroll").getScrollPosition()) $scope.navTitle = "";
      var scrl = parseFloat($ionicScrollDelegate.$getByHandle("mainScroll").getScrollPosition().top);
      eventHeight = $scope.rowHeight;
      var item = 0;
      if (eventHeight) {
        item = Math.floor(scrl / eventHeight);
      }
      //NVR.debug("scrl: " + scrl + ", events[0].Event.Height: " + eventHeight + ", item: " + item);
      if ($scope.events == undefined || !$scope.events.length || $scope.events[item] == undefined) {
        $scope.navTitle = "";
      } else {
        //return prettifyDate($scope.events[item].Event.StartTime);
        $scope.navTitle = ($scope.events[item].Event.humanizeTime);
      }
      $scope.$evalAsync();
      //return Math.random();
    }

    //-------------------------------------------------------------------------
    // called when user switches to background
    //-------------------------------------------------------------------------
    function onPause() {
      NVR.debug("EventCtrl:onpause called");
      if ($scope.popover) $scope.popover.remove();
      NVR.debug("EventCtrl Pause:Deregistering broadcast handles");
      for (var i = 0; i < broadcastHandles.length; i++) {
        //  broadcastHandles[i]();
      }
      broadcastHandles = [];


    }
    //-------------------------------------------------------------------------
    // Pads the filename with leading 0s, depending on  ZM_IMAGE_DIGITS
    //-------------------------------------------------------------------------
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

    //-------------------------------------------------------------------------
    // FIXME: Are we using this?
    //-------------------------------------------------------------------------
    $scope.disableSlide = function () {
      NVR.debug("EventCtrl:DisableSlide called");
      $ionicSlideBoxDelegate.$getByHandle("eventSlideBox").enableSlide(false);
    };

    $scope.checkSwipe = function (ndx) {
      if ($scope.events[ndx].Event.ShowScrub) {
        $ionicListDelegate.canSwipeItems(false);
        NVR.debug("disabling options swipe");
      } else {
        $ionicListDelegate.canSwipeItems(true);
        //NVR.debug("enabling options swipe");
      }

    };

    //-------------------------------------------------------------------------
    // This function is called when a user enables or disables
    // scrub view for an event.
    //-------------------------------------------------------------------------

    $scope.toggleGroupScrub = function (event, ndx, frames) {
      $scope.groupType = "scrub";
      toggleGroup(event, ndx, frames, $scope.groupType);
    };

    $scope.toggleGroupAlarms = function (event, ndx, frames) {
      $scope.groupType = "alarms";
      toggleGroup(event, ndx, frames, $scope.groupType);
    };

    function toggleGroup(event, ndx, frames, groupType) {
      // If we are here and there is a record of a previous scroll
      // then we need to scroll back to hide that view
      if (scrollbynumber) {
        $ionicScrollDelegate.$getByHandle("mainScroll").scrollBy(0, -1 * scrollbynumber, true);
        scrollbynumber = 0;
      }

      if (scrubOngoing) { 
          NVR.debug ("making sure scrub is off");
          scrubOngoing = false;
      }

      if (oldEvent && event != oldEvent) {

        NVR.debug("EventCtrl:Old event scrub will hide now");
        oldEvent.Event.ShowScrub = false;
        event.Event.rowHeight = $scope.rowHeightRegular;
        oldEvent = "";
      }

      event.Event.ShowScrub = !event.Event.ShowScrub;

      if (event.Event.ShowScrub == false) {
        $ionicListDelegate.canSwipeItems(true);
        //NVR.debug("enabling options swipe due to toggle");
      } else {
        $ionicListDelegate.canSwipeItems(false);
        $ionicListDelegate.closeOptionButtons();
       // NVR.debug("disabling options swipe due to toggle");

      }




      //console.log ("SCRUBBING IS "+event.Event.ShowScrub);
      // $ionicScrollDelegate.resize();

      //console.log ("GROUP TYPE IS " + groupType);

      if (event.Event.ShowScrub == true) // turn on display now
      {

        if (groupType == 'alarms') {
          event.Event.rowHeight = $scope.rowHeightExpanded;
          // $ionicListDelegate.canSwipeItems(false);
          //NVR.debug ("Disabling flag swipe as alarms are swipable");
          $scope.alarm_images = [];
          $ionicScrollDelegate.resize();
          var myurl = loginData.apiurl + '/events/' + event.Event.Id + ".json?"+$rootScope.authSession;
          NVR.log("API for event details" + myurl);
          $http.get(myurl)
            .then(function (data) {

              
                data = data.data;
             
       
             //  var ndata = data.replace(/<pre class="cake-error">/,'');

           //    console.log ("NDATA:"+ndata);
                //<pre class="cake-error">


                $scope.FrameArray = data.event.Frame;
                //  $scope.slider_options.scale=[];

                //$scope.slider_options.scale = [];

                var i;
                var timestamp = null;
                for (i = 0; i < data.event.Frame.length; i++) {
                  if (data.event.Frame[i].Type == "Alarm") {

                    //console.log ("**ONLY ALARM AT " + i + "of " + data.event.Frame.length);
                    var atype;
                    if (timestamp != data.event.Frame[i].TimeStamp) {

                      atype = $translate.instant('kShowTimeDiffFrames');
                    } else {
                      atype = $translate.instant('kShowAllFrames');
                    }
                    $scope.alarm_images.push({
                      type: atype,
                      id: data.event.Frame[i].Id,
                      frameid: data.event.Frame[i].FrameId,
                      score: data.event.Frame[i].Score,
                      fname: padToN(data.event.Frame[i].FrameId, eventImageDigits) + "-capture.jpg",
                      aname: padToN(data.event.Frame[i].FrameId, eventImageDigits) + "-analyse.jpg",
                      time: data.event.Frame[i].TimeStamp
                    });
                    timestamp = data.event.Frame[i].TimeStamp;
                  }

                }
                oldEvent = event;

                //console.log (JSON.stringify(data));
              },
              function (err) {
                NVR.log("Error retrieving detailed frame API " + JSON.stringify(err));
               // NVR.displayBanner('error', ['could not retrieve frame details', 'please try again']);
              });

        } // end of groupType == alarms
        else // groupType == scrub
        {

          NVR.debug("EventCtrl: Scrubbing will turn on now");
          scrubOngoing = true;
          $scope.currentEvent = "";
          $scope.event = event;
          //$ionicScrollDelegate.freezeScroll(true);
          $ionicSideMenuDelegate.canDragContent(false);
          $scope.slider_options = {
            from: 1,
            to: event.Event.Frames,
            realtime: true,
            step: 1,
            className: "mySliderClass",
            callback: function (value, released) {
              //console.log("CALLBACK"+value+released);
              $ionicScrollDelegate.freezeScroll(!released);
              //NVR.debug("EventCtrl: freezeScroll called with " + !released);

            },
            //modelLabels:function(val) {return "";},
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

          event.Event.rowHeight = $scope.rowHeightExpanded + 30;
          $ionicScrollDelegate.resize();

          $scope.mycarousel.index = 0;
          $scope.ionRange.index = 1;
          //console.log("**Resetting range");
          $scope.slides = [];
          var i;

          
            var myurl_frames = loginData.apiurl + '/events/' + event.Event.Id + ".json?"+$rootScope.authSession;
            NVR.log("API for event details" + myurl_frames);
            $http.get(myurl_frames)
              .then(function (data) {
                  data = data.data;
                  $scope.FrameArray = data.event.Frame;
                  //  $scope.slider_options.scale=[];

                  //$scope.slider_options.scale = [];

                  var i;
                  for (i = 0; i < data.event.Frame.length; i++) {

                    //console.log ("**ONLY ALARM AT " + i + "of " + data.event.Frame.length);
                    $scope.slides.push({
                      id: data.event.Frame[i].Id,
                      frameid: data.event.Frame[i].FrameId,

                    });

                  }

                  //console.log (JSON.stringify(data));
                },
                function (err) {
                  NVR.log("Error retrieving detailed frame API " + JSON.stringify(err));
                  NVR.displayBanner('error', [$translate.instant('kErrorFrameBanner'), $translate.instant('kErrorPleaseTryAgain')]);
                });

          

          // now get event details to show alarm frames
          loginData = NVR.getLogin();

          if (typeof event.Event.DefaultVideo === 'undefined')
            event.Event.DefaultVideo = "";
          // grab video details
          event.Event.video = {};
          var videoURL;

        
          videoURL = event.Event.recordingURL + "/index.php?view=view_video&eid=" + event.Event.Id;
          videoURL += $rootScope.authSession;
          videoURL += NVR.insertSpecialTokens();


         //  console.log("************** VIDEO IS " + videoURL);
          event.Event.video.config = {
            autoPlay: true,
            sources: [{
                src: $sce.trustAsResourceUrl(videoURL),
                type: "video/mp4"
              }

            ],

            theme: "external/videogular2.2.1/videogular.min.css",

          };

          var myurl2 = loginData.apiurl + '/events/' + event.Event.Id + ".json?"+$rootScope.authSession;
          NVR.log("API for event details" + myurl2);
          $http.get(myurl2)
            .then(function (data) {
                data = data.data;
                $scope.FrameArray = data.event.Frame;
                //  $scope.slider_options.scale=[];
                $scope.slider_options.scale = [];

                var i;
                for (i = 0; i < data.event.Frame.length; i++) {
                  if (data.event.Frame[i].Type == "Alarm") {

                    //console.log ("**ALARM AT " + i + "of " + data.event.Frame.length);
                    $scope.slider_options.scale.push({
                      val: data.event.Frame[i].FrameId,
                      label: ' '
                    });
                  } else {
                    //$scope.slider_options.scale.push(' ');
                  }

                }

                //console.log (JSON.stringify(data));
              },
              function (err) {
                NVR.log("Error retrieving detailed frame API " + JSON.stringify(err));
                NVR.displayBanner('error', [$translate.instant('kErrorFrameBanner'), $translate.instant('kErrorPleaseTryAgain')]);
              });

          oldEvent = event;
          $rootScope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
          var elem = angular.element(document.getElementById("item-" + ndx));
          var locobject = $ionicPosition.offset(elem);
          //console.log(JSON.stringify(locobject));
          var toplocation = parseInt(locobject.top);
          var objheight = parseInt(locobject.height);
          // console.log("top location is " + toplocation);
          var distdiff = parseInt($rootScope.devHeight) - toplocation - objheight;

          if (distdiff < $scope.rowHeight) // size of the scroller with bars
          {
            scrollbynumber = $scope.rowHeight - distdiff;
            $ionicScrollDelegate.$getByHandle("mainScroll").scrollBy(0, scrollbynumber, true);

            // we need to scroll up to make space
          }
          // console.log("*****Space at  bottom is " + distdiff);
        } // end of groupType == scrub 
      } // end of ShowScrub == true
      else {
        // $ionicScrollDelegate.freezeScroll(false);
        // 
        // $ionicListDelegate.canSwipeItems(true);
        // NVR.debug ("enabling options swipe");
        event.Event.rowHeight = $scope.rowHeightRegular;
        $ionicSideMenuDelegate.canDragContent(true);
        $ionicScrollDelegate.resize();

        if (scrollbynumber) {
          $ionicScrollDelegate.$getByHandle("mainScroll").scrollBy(0, -1 * scrollbynumber, true);
          scrollbynumber = 0;
        }
        // we are turning off, so scroll by back
      }

    }

    $scope.closeIfOpen = function (event) {
      if (event != undefined) {
        if (event.Event.ShowScrub)
          toggleGroup(event);

      }
    };

    $scope.isGroupShown = function (event) {
      //  console.log ("IS SHOW INDEX is " + ndx);
      //console.log ("SHOW GROUP IS " + showGroup);
      return (event == undefined) ? false : event.Event.ShowScrub;

    };

    //---------------------------------------------------
    // reload view
    //---------------------------------------------------
    $scope.reloadView = function () {
      // All we really need to do here is change the random token
      // in the image src and it will refresh. No need to reload the view
      // and if you did reload the view, it would go back to events list
      // which is the view - and when you are in the modal it will go away
      //console.log("*** Refreshing Modal view ***");
      //$state.go($state.current, {}, {reload: true});
      $rootScope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
      $ionicLoading.show({
        template: $translate.instant('kRefreshedView'),
        noBackdrop: true,
        duration: 3000
      });

    };

    //---------------------------------------------------
    // when you tap a list entry - to break search loop
    //---------------------------------------------------
    $scope.tapped = function () {
      // console.log("*** TAPPED ****");
      // if he tapped, the we are not infinite loading on ion-infinite
      if (enableLoadMore == false) {
        moreEvents = true;
        enableLoadMore = true;
        // console.log("REMOVING ARTIFICAL LOAD MORE BLOCK");
      }
    };

    $scope.$on('$ionicView.loaded', function () {
      //  console.log("**VIEW ** Events Ctrl Loaded");
    });

    //-------------------------------------------------------------------------
    // Lets make sure we set screen dim properly as we enter
    // The problem is we enter other states before we leave previous states
    // from a callback perspective in ionic, so we really can't predictably
    // reset power state on exit as if it is called after we enter another
    // state, that effectively overwrites current view power management needs
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
      //  console.log("**VIEW ** Events Ctrl Entered");
      NVR.setAwake(false);

      $ionicPopover.fromTemplateUrl('templates/events-popover.html', {
        scope: $scope,
      }).then(function (popover) {
        $scope.popover = popover;
      });

      // coming to this view clears all notification badges
      EventServer.sendMessage('push', {
        type: 'badge',
        badge: 0,
      });
      // also clear bells
      $rootScope.alarmCount = "0";
      $rootScope.isAlarm = 0;

      // reset badge count
      if (window.FirebasePlugin && $rootScope.platformOS == 'ios') {
        NVR.debug ('Clearing app badge count');
        window.FirebasePlugin.setBadgeNumber(0);

      }
    
    
    });

    $scope.$on('$ionicView.leave', function () {
      //console.log("**VIEW ** Events Ctrl Left");
    });

    $scope.$on('$ionicView.unloaded', function () {
      //console.log("**VIEW ** Events Ctrl Unloaded");
      //console.log("*** MODAL ** Destroying modal too");
      if ($scope.modal !== undefined) {
        $scope.modal.remove();
      }

    });

    //---------------------------------------------------
    // used to hide loading image toast
    //---------------------------------------------------
    $scope.finishedLoadingImage = function (ndx) {
      //  console.log("*** Events image FINISHED loading index: "+ndx+"***");
      $ionicLoading.hide();
    };

    //---------------------------------------------------
    //
    //---------------------------------------------------
    $scope.clearSearch = function () {
      $scope.search.text = "";
    };

    //---------------------------------------------------
    // Called when user toggles search
    //---------------------------------------------------
    $scope.searchClicked = function () {
      $scope.showSearch = !$scope.showSearch;
      // this helps greatly in repeat scroll gets
      if ($scope.showSearch == false)
        $scope.search.text = "";

      //console.log("**** Setting search view to " + $scope.showSearch + " ****");
      if (enableLoadMore == false && $scope.showSearch == false) {
        moreEvents = true;
        enableLoadMore = true;
        //console.log("REMOVING ARTIFICAL LOAD MORE BLOCK");
      }
    };

    
   

    $scope.modalGraph = function () {
      $scope.lastVideoStateTime = {
        'time':''
      };
      $ionicModal.fromTemplateUrl('templates/events-modalgraph.html', {
          scope: $scope, // give ModalCtrl access to this scope
          animation: 'slide-in-up',
          id: 'modalgraph',

        })
        .then(function (modal) {
          $scope.modal = modal;

          $scope.modal.show();

        });
    };

    $scope.analyzeEvent = function (ev) {
      $scope.lastVideoStateTime = {
        'time':''
      };
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
    };

    $scope.$on('modal.removed', function (e, m) {

      if (m.id != 'footage')
        return;
      NVR.debug("Rebinding watchers of eventCtrl");
      setupWatchers();

      //console.log ("************** FOOTAGE CLOSED");

    });






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


      $scope.thumbnailLarge = b + '/index.php?view=image&fid=' + f+$rootScope.authSession;
      $ionicModal.fromTemplateUrl('templates/image-modal.html', {
          scope: $scope,
          animation: 'slide-in-up',
          id: 'thumbnail',
        })
        .then(function (modal) {
          $scope.modal = modal;


          $scope.modal.show();

          var ld = NVR.getLogin();

        });

    };


    //--------------------------------------------------------
    //This is called when we first tap on an event to see
    // the feed. It's important to instantiate ionicModal here
    // as otherwise you'd instantiate it when the view loads
    // and our "Please wait loading" technique I explained
    //earlier won't work
    //--------------------------------------------------------

    $scope.openModalWithSnapshot = function (event) {
      openModal(event, 'enabled');

    };

    $scope.openModal = function (event) {

      openModal(event);

    };

    function openModal(event, snapshot) {
      NVR.debug("unbinding eventCtrl watchers as modal has its own");
      ionRangeWatcher();
      mycarouselWatcher();
      //NVR.debug("EventCtrl: Open Modal with Base path " + relativepath);

      $scope.modalData = {
        "doRefresh": false
      };

      $scope.event = event;

      NVR.setAwake(NVR.getKeepAwake());

      $scope.currentEvent = event;
      $scope.followSameMonitor = ($scope.id == "0") ? "0" : "1";

      var ld = NVR.getLogin();
      var sl = 'disabled';
      if (ld.showLiveForInProgressEvents) {
        sl = 'enabled';
      }
      $scope.lastVideoStateTime = {
        'time':''
      };
      NVR.debug("Shall I follow the same monitor for prev/next?:"+$scope.followSameMonitor);
      $ionicModal.fromTemplateUrl('templates/events-modal.html', {
          scope: $scope,
          animation: 'slide-in-up',
          id: 'footage',
          showLive: sl, // seems bool is not allowed...
          snapshot: snapshot,
          snapshotId: NVR.getSnapshotFrame(),
          eventId: event.Event.Id
        })
        .then(function (modal) {
          $scope.modal = modal;

          $scope.modal.show();

          var ld = NVR.getLogin();

        });
    }


    
    //--------------------------------------------------------
    //We need to destroy because we are instantiating
    // it on open
    //--------------------------------------------------------
    $scope.closeModal = function () {
      NVR.debug(">>>EventCtrl:Close & Destroy Modal");
      if ($scope.lastVideoStateTime && $scope.lastVideoStateTime.time) {
        var diff = moment().diff($scope.lastVideoStateTime.time);
        if (diff <= 300) {
          NVR.debug ("Not closing model, time interval was only:"+diff+" ms");
          return;
        }
      }
     
      $ionicLoading.hide();
      NVR.setAwake(false);
      if ($scope.modal !== undefined) {
        $scope.modal.remove();
      }
      if ($scope.modalData.doRefresh) {
        $scope.modalData.doRefresh = false;
        NVR.debug("Reloading events since we deleted some...");
        doRefresh();
      }


    };

    //--------------------------------------------------------
    //Cleanup the modal when we're done with it
    // I Don't think it ever comes here
    //--------------------------------------------------------
    $scope.$on('$destroy', function () {
      //console.log("Destroy Modal");
      if ($scope.modal !== undefined) {
        $scope.modal.remove();
      }
      if ($scope.popover !== undefined)
        $scope.popover.remove();
    });

    //--------------------------------------------------------
    // used by infinite scrolling to see if we can get more
    //--------------------------------------------------------

    $scope.moreDataCanBeLoaded = function () {
      //console.log(new Date() + ' ' + moreEvents);
      return moreEvents;
    };

    //--------------------------------------------------------
    // stop searching for more data
    //--------------------------------------------------------
    $scope.cancelSearch = function () {
      $ionicLoading.hide(); //Or whatever action you want to preform
      enableLoadMore = false;
      //console.log("**** CANCELLED ****");
      $ionicLoading.show({
        template: $translate.instant('kSearchCancelled'),
        animation: 'fade-in',
        showBackdrop: false,
        duration: 2000,
        maxWidth: 200,
        showDelay: 0
      });

    };

    //--------------------------------------------------------
    // loads next page of events
    //--------------------------------------------------------

    function loadMore() {
      // the events API does not return an error for anything
      // except greater page limits than reported

      //console.log("***** LOADING MORE INFINITE SCROLL ****");
      loadMoreTime = Date.now();

      if (currentPagePosition > 0 && currentPagePosition >= currentPageLength) {
        currEventsPage++;
        currentPagePosition = 0;
        currentPageLength = 0;
      }
      NVR.debug("EventCtrl:loadMore() currEventsPage: " + currEventsPage + ", currentPagePosition: " + currentPagePosition + ", currentPageLength: " + currentPageLength);

      if (currEventsPage > maxEventsPage) {
        moreEvents = false;
        $scope.nextEvents = true;
        NVR.debug("No more - We have a total of " + maxEventsPage + " and are at page=" + currEventsPage);

       // console.log("*** At Page " + currEventsPage + " of " + maxEventsPage + ", not proceeding");
        $ionicLoading.hide();
        return;
      }

      if (!enableLoadMore) {
        $ionicLoading.hide();
        moreEvents = false; // Don't ion-scroll till enableLoadMore is true;
        $scope.nextEvents = true;
        $scope.$broadcast('scroll.infiniteScrollComplete');

        // console.log("**** LOADMORE ARTIFICALLY DISABLED");
        return;
      }

      var loadingStr = "";
      if ($scope.search.text != "") {
    
        var toastStr = $translate.instant('kPleaseWait') +'...'+ currEventsPage;
       // console.log ("SHOW " + toastStr );
        $ionicLoading.show({
          maxwidth: 100,
          noBackdrop:true,
          scope: $scope,
          template: toastStr,
          //template: '<button class="button button-clear icon-left ion-close-circled button-text-wrap" ng-click="cancelSearch()" >' + toastStr + '</button>'
        });

        loadingStr = "none";
      }

      nolangFrom = "";
      nolangTo = "";
      if ($rootScope.fromString)
        nolangFrom = moment($rootScope.fromString).locale('en').format("YYYY-MM-DD HH:mm:ss");
      if ($rootScope.toString)
        nolangTo = moment($rootScope.toString).locale('en').format("YYYY-MM-DD HH:mm:ss");

      if (currentPagePosition && currentPageData) {
        loadEvents(currentPageData);
        //console.log("Got new page of events");
        moreEvents = true;
      }
      else {
      NVR.getEvents($scope.id, currEventsPage, loadingStr, nolangFrom, nolangTo, false,$rootScope.monitorsFilter)
        .then( function (data) {
            // console.log(JSON.stringify(data.pagination));
            if (data.pagination && data.pagination.pageCount)
                maxEventsPage = data.pagination.pageCount;

            loadEvents(data);
            currentPageData = data;
            //console.log("Got new page of events");
            moreEvents = true;
            },

          function (error) {
            // console.log("*** No More Events to Load, Stop Infinite Scroll ****");
            moreEvents = false;
            $ionicLoading.hide();
          });
      }
    }

    $scope.loadMore = function () {
      var now = Date.now();
      if (now - loadMoreTime > 1500) {
          NVR.debug("$scope.loadMore > loadMore() ... delta: " + (now - loadMoreTime));
          loadMore();
          $scope.$broadcast('scroll.infiniteScrollComplete');
      }
      else {
        NVR.debug("$scope.loadMore ... delta: " + (now - loadMoreTime));
        $timeout(function () {
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }, 250);
      }
    };
    
    function loadEvents(data) {
        var loginData = NVR.getLogin();
        var myevents = data.events;
        NVR.debug("EventCtrl:loadEvents() myevents.length: " + myevents.length + ", currEventsPage: " + currEventsPage + ", currentPagePosition: " + currentPagePosition);
        
        if (data.events.length == 0) {
            NVR.debug("EventCtrl:loadEvents() no events so we must have reached the end.");
            moreEvents = false;
            $ionicLoading.hide();
            currEventsPage++;
            return;
        }

        //console.log ("-------->MON LEN"+$scope.monitors.length);
        currentPageLength = myevents.length;
        var eventsLoaded = 0;
        var prevPagePosition = currentPagePosition;
        NVR.debug("maxEventsToLoad: " + maxEventsToLoad);
        for (currentPagePosition; currentPagePosition < myevents.length && eventsLoaded < maxEventsToLoad; currentPagePosition++) {
            var idfound = true;
            if (loginData.persistMontageOrder) {
              idfound = false;
              for (var i = 0; i < $scope.monitors.length; i++) {
                if ($scope.monitors[i].Monitor.Id == myevents[currentPagePosition].Event.MonitorId && (NVR.isNotHidden(myevents[currentPagePosition].Event.MonitorId) || showHiddenMonitors)) {
                  // console.log ("FOUND IT");

                    //console.log ( $scope.monitors[i].Monitor.Id + " MATCHES " + myevents[currentPagePosition].Event.MonitorId);
                  idfound = true;
                  break;
                }
              }
            }

            //console.log ("IDFOUND="+idfound + " AND MON LEN="+$scope.monitors.length);

            myevents[currentPagePosition].Event.humanizeTime = humanizeTime(myevents[currentPagePosition].Event.StartTime);
            myevents[currentPagePosition].Event.streamingURL = NVR.getStreamingURL(myevents[currentPagePosition].Event.MonitorId);
            myevents[currentPagePosition].Event.recordingURL = NVR.getRecordingURL(myevents[currentPagePosition].Event.MonitorId);
            myevents[currentPagePosition].Event.imageMode = NVR.getImageMode(myevents[currentPagePosition].Event.MonitorId);

            // console.log ("***** MULTISERVER STREAMING URL FOR EVENTS " + myevents[currentPagePosition].Event.streamingURL);
            // console.log ("***** MULTISERVER BASE URL FOR EVENTS " + myevents[currentPagePosition].Event.recordingURL);

            myevents[currentPagePosition].Event.MonitorName = NVR.getMonitorName(myevents[currentPagePosition].Event.MonitorId);
            myevents[currentPagePosition].Event.ShowScrub = false;
            //myevents[currentPagePosition].Event.height = eventsListDetailsHeight;
            // now construct base path

            // get thumbW/H
            var tempMon = NVR.getMonitorObject(myevents[currentPagePosition].Event.MonitorId);
            if (tempMon != undefined) {
              var mw = parseInt(tempMon.Monitor.Width);
              var mh = parseInt(tempMon.Monitor.Height);
              var mo = parseInt(tempMon.Monitor.Orientation);
              myevents[currentPagePosition].Event.Rotation = '';

              var th = computeThumbnailSize(mw, mh, mo);
              myevents[currentPagePosition].Event.thumbWidth = th.w;
              myevents[currentPagePosition].Event.thumbHeight = th.h;
              $scope.rowHeight = th.h + 144;
              $scope.rowHeightRegular = $scope.rowHeight;
              $scope.rowHeightExpanded = $scope.rowHeight + 230;
              myevents[currentPagePosition].Event.rowHeight = $scope.rowHeight;
             // myevents[currentPagePosition].Event.rowHeight = th.h + 50;
             // console.log ("************* RH:"+myevents[currentPagePosition].Event.rowHeight);
            }

            // in multiserver BasePath is login url for frames 
            // http://login.url/index.php?view=frame&eid=19696772&fid=21

            //  console.log ("COMPARING "+NVR.getLogin().url+ " TO " +myevents[currentPagePosition].Event.recordingURL);

            myevents[currentPagePosition].Event.videoPath = myevents[currentPagePosition].Event.recordingURL + "/index.php?view=view_video&eid=" + myevents[currentPagePosition].Event.Id;

            // if (idfound)
            if (idfound) {

              //NVR.debug ("PUSHING "+JSON.stringify(myevents[currentPagePosition]));
              $scope.events.push(myevents[currentPagePosition]);
              eventsLoaded++;
              //console.log ("SCOPE EVENTS LEN="+$scope.events.length);
            } else {
              //NVR.debug ("Skipping Event MID = " + myevents[currentPagePosition].Event.MonitorId);
            }

        } //for
        
        NVR.debug("EventCtrl:loadEvents() Events added to view: " + (currentPagePosition - prevPagePosition));
    }


    function recomputeEventCollectionSize() {
    //  NVR.debug("EventCtrl: recompute thumbnails");

    // remember, devHeight/devWidth upate 300ms after rotation
      $timeout ( function () {
        for (var i = 0; i < $scope.events.length; i++) {
          var tempMon = NVR.getMonitorObject($scope.events[i].Event.MonitorId);
          if (tempMon != undefined) {
  
            var mw = parseInt(tempMon.Monitor.Width);
            var mh = parseInt(tempMon.Monitor.Height);
            var mo = parseInt(tempMon.Monitor.Orientation);
  
            var th = computeThumbnailSize(mw, mh, mo);
            $scope.events[i].Event.thumbWidth = th.w;
            $scope.events[i].Event.thumbHeight = th.h;
            //console.log ("Setting to "+th.w+"*"+th.h);
            
            $scope.rowHeight = th.h + 144;
            $scope.rowHeightRegular = th.h;
            $scope.rowHeightExpanded = th.h + 230;
            $scope.events[i].Event.rowHeight = th.h + 144;
            
            console.log ("th.w: " + th.w + " th.h: " + th.h + " rowHeight: " + (th.h + 144));
          }
  
  
        }
      },500);
      

    }

    function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
      // credit: https://stackoverflow.com/a/14731922
      var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
      return { w: Math.round(srcWidth*ratio), h: Math.round(srcHeight*ratio) };
   }


    function computeThumbnailSize(mw, mh, mo) {
      // if ZM is going to rotate the view, lets flip our dimensions
      if (mo != 0 && mo != 180) {
        var tmp = mw;
        mw = mh;
        mh = tmp;
      }
      var ld = NVR.getLogin();
      var landscape = ($rootScope.devWidth > $rootScope.devHeight) ? true:false;
      var maxRowHeight;

      if (ld.eventViewThumbsSize == 'large') {
        maxRowHeight = 350;
        if (landscape) {
          // go till 90% of width in large landscape, but restricted to useable row height 
          return calculateAspectRatioFit(mw, mh, 0.9* $rootScope.devWidth, maxRowHeight);
        } else {
                    // go till 80% of width in large portrait, but restricted to useable row height 

          return calculateAspectRatioFit(mw, mh, 0.8* $rootScope.devWidth, maxRowHeight);
        }

      } else { // small
        maxRowHeight = 70;
        if (landscape) {
          // go till 50% of width in small landscape, but restricted to useable row height 
          return calculateAspectRatioFit(mw, mh, 0.5* $rootScope.devWidth, maxRowHeight);
        } else {
                    // go till 30% of width in small portrait, but restricted to useable row height 
          return calculateAspectRatioFit(mw, mh, 0.3* $rootScope.devWidth, maxRowHeight);
        }

      }
     
    }

   
    $scope.constructThumbnail = function (event) {
      var stream = "";
      //console.log(event.Event.Notes);
      var snapshotFrame = NVR.getSnapshotFrame();
      if (($scope.loginData.eventViewThumbs.substring(0, 9) == 'objdetect') && event.Event.Notes.includes("detected:")) {
          snapshotFrame = $scope.loginData.eventViewThumbs;
      }
      stream = event.Event.recordingURL +
        "/index.php?view=image&fid=" +
        snapshotFrame+"&eid="+event.Event.Id  +
        "&width=" + event.Event.thumbWidth * 2 +
        "&height=" + event.Event.thumbHeight * 2;
      stream += $rootScope.authSession;

      stream += NVR.insertSpecialTokens();

      return stream;

    };

    $scope.constructScrubFrame = function (event, slide) {

      var stream = "";
     
        stream = event.Event.recordingURL + "/index.php?view=image" +
          "&fid=" + slide.id + $scope.outlineMotionParam;
      
     stream += $rootScope.authSession;

      stream += NVR.insertSpecialTokens();


      return stream;
    };

    $scope.constructAlarmFrame = function (event, alarm, motion) {
      var stream = "";

     
        stream = event.Event.recordingURL +
          "/index.php?view=image&fid=" + alarm.id;
        if (motion) stream += $scope.outlineMotionParam;
      stream += $rootScope.authSession;
      stream += NVR.insertSpecialTokens();

//      console.log ("alarm:"+stream);
      return stream;

    };
    
    $scope.toggleObjectDetectionFilter = function () {
      
      var ld = NVR.getLogin();
      ld.objectDetectionFilter = !ld.objectDetectionFilter;
      NVR.setLogin(ld);
      NVR.debug ("object detection filter: "+ld.objectDetectionFilter);
      $scope.loginData = NVR.getLogin();
      doRefresh();

    };

    $scope.toggleMinAlarmFrameCount = function () {

      var ld = NVR.getLogin();

     // console.log("Toggling " + ld.enableAlarmCount);
      ld.enableAlarmCount = !ld.enableAlarmCount;
      NVR.setLogin(ld);
      $scope.loginData = NVR.getLogin();
      doRefresh();
    };

    //--------------------------------------
    // formats events dates in a nice way
    //---------------------------------------

    function humanizeTime(str) {
      //console.log ("Time:"+str+" TO LOCAL " + moment(str).local().toString());
      //if (NVR.getLogin().useLocalTimeZone)
      return moment.tz(str, NVR.getTimeZoneNow()).fromNow();
      // else    
      //  return moment(str).fromNow();

    }

    $scope.humanize = function (num) {

      var min = Math.floor(num / 60);
      var sec = Math.floor(num - min * 60);
      stime = "";
      if (min) stime += min + "m ";

      if (sec) stime += sec + "s";
      return stime;
    };

    $scope.prettifyDate = function (str) {
      if (NVR.getLogin().useLocalTimeZone)
        return moment.tz(str, NVR.getTimeZoneNow()).tz(moment.tz.guess()).format('MMM Do');
      else
        return moment(str).format('MMM Do');
    };

    function prettifyDate(str) {
      if (NVR.getLogin().useLocalTimeZone)
        return moment.tz(str, NVR.getTimeZoneNow()).tz(moment.tz.guess()).format('MMM Do');
      else
        return moment(str).format('MMM Do');
    }

    $scope.prettifyTime = function (str) {
      if (NVR.getLogin().useLocalTimeZone)
        return moment.tz(str, NVR.getTimeZoneNow()).tz(moment.tz.guess()).format(NVR.getTimeFormat());
      else
        return moment(str).format(NVR.getTimeFormat());
    };

    $scope.prettifyTimeSec = function (str) {
      if (NVR.getLogin().useLocalTimeZone)
        return moment.tz(str, NVR.getTimeZoneNow()).tz(moment.tz.guess()).format(NVR.getTimeFormatSec());
      else
        return moment(str).format(NVR.getTimeFormatSec());
    };

    $scope.prettify = function (str) {
      if (NVR.getLogin().useLocalTimeZone)
        return moment.tz(str, NVR.getTimeZoneNow()).tz(moment.tz.guess()).format(NVR.getTimeFormat() + ', MMMM Do YYYY');
      else
        return moment(str).format(NVR.getTimeFormat() + ', MMMM Do YYYY');
    };
    //--------------------------------------------------------
    // For consistency we are keeping the refresher list
    // but its a dummy. The reason I deviated is because
    // refresh with infinite scroll is a UX problem - its
    // easy to pull to refresh when scrolling up with
    // a large list
    //--------------------------------------------------------

    $scope.dummyDoRefresh = function () {
      $scope.$broadcast('scroll.refreshComplete');
    };

    $scope.doRefresh = function () {
      doRefresh();
    }; //dorefresh

    function doRefresh() {
      // console.log("***Pull to Refresh");

      

      NVR.debug("Reloading monitors");
      maxEventsPage = 1;
      currEventsPage = 1;
      currentLength = 0;
      currentPagePosition = 0;
      currentPageLength = 0;
      var refresh = NVR.getMonitors(1);
      refresh.then(function (data) {
        $scope.monitors = data;
        message = data;

        /* var ld = NVR.getLogin();
         if (ld.persistMontageOrder) {
             var tempMon = data;
             $scope.monitors = NVR.applyMontageMonitorPrefs(tempMon, 2)[0];
         } else {
             $scope.monitors = data;
         }*/

        getInitialEvents();
        moreEvents = true;

      });
      $scope.$broadcast('scroll.refreshComplete');
    }

  }]);
