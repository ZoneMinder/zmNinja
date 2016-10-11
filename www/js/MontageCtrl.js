// Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,ionic,Packery, Draggabilly, imagesLoaded, ConnectSDK, moment */


angular.module('zmApp.controllers')
    .controller('zmApp.MontageCtrl', ['$scope', '$rootScope', 'NVRDataModel', 'message', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$ionicPopup', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$ionicPlatform', 'zm', '$ionicPopover', '$controller', 'imageLoadingDataShare', '$window', '$localstorage', '$translate', function ($scope, $rootScope, NVRDataModel, message, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $ionicPopup, $stateParams, $ionicHistory, $ionicScrollDelegate, $ionicPlatform, zm, $ionicPopover, $controller, imageLoadingDataShare, $window, $localstorage, $translate) {

    //---------------------------------------------------------------------
    // Controller main
    //---------------------------------------------------------------------

    var intervalHandleMontage; // image re-load handler
    var intervalHandleAlarmStatus; // status of each alarm state


    var gridcontainer;
    var pckry, draggie;
    var draggies;
    var loginData;
    var timestamp;
    var sizeInProgress;
    var modalIntervalHandle;
    var ld;
    var refreshSec;


    //--------------------------------------------------------------------------------------
    // Handles bandwidth change, if required
    //
    //--------------------------------------------------------------------------------------

    $rootScope.$on("bandwidth-change", function (e,data) {
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
        refreshSec = (NVRDataModel.getBandwidth()=='lowbw') ? ld.refreshSecLowBW : ld.refreshSec;
        $interval.cancel(intervalHandleMontage);
        intervalHandleMontage = $interval(function () {
            loadNotifications();
        }.bind(this), refreshSec * 1000);
        
        
        if (NVRDataModel.getBandwidth() == 'lowbw')
        {
            NVRDataModel.debug("Enabling low bandwidth parameters");
            $scope.LoginData.montageQuality = zm.montageQualityLowBW;
            $scope.LoginData.singleImageQuality = zm.eventSingleImageQualityLowBW;
            $scope.LoginData.montageHistoryQuality = zm.montageQualityLowBW;

        }
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
            $scope.isModalActive = false;
            cleanupOnClose();
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


    

    // called by afterEnter to load Packery
    function initPackery() {


        $ionicLoading.show({
            template: $translate.instant('kArrangingImages'),
            noBackdrop: true,
            duration: zm.loadingTimeout
        });

        var progressCalled = false;
        draggies = [];
        var layouttype = true;
        var ld = NVRDataModel.getLogin();


        var positionsStr = ld.packeryPositions;
        var positions = {};

        if (positionsStr == '') {
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

        imagesLoaded(elem).on('progress', function (instance, img) {

            progressCalled = true;
            

            // if (layouttype) $timeout (function(){layout(pckry);},100);
        });

        imagesLoaded(elem).on('always', function () {
            //console.log ("******** ALL IMAGES LOADED");
           // $scope.$digest();
            NVRDataModel.debug("All images loaded");
            $scope.areImagesLoading = false;

            $ionicLoading.hide();

            pckry = new Packery('.grid', {
                itemSelector: '.grid-item',
                percentPosition: true,
                columnWidth: '.grid-sizer',
                gutter: 0,
                initLayout: layouttype

            });
            if (!progressCalled) {
                NVRDataModel.log("***  PROGRESS WAS NOT CALLED");
                pckry.reloadItems();
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
                                $scope.MontageMonitors[i].Monitor.gridScale = positions[j].size;
                                $scope.MontageMonitors[i].Monitor.listDisplay = positions[j].display;
                                NVRDataModel.debug("Setting monitor ID: " + $scope.MontageMonitors[i].Monitor.Id + " to size: " + positions[j].size + " and display:" + positions[j].display);
                            }
                            //console.log ("Index:"+positions[j].attr+ " with size: " + positions[j].size);
                        }
                    }


                    NVRDataModel.debug("All images loaded, doing image layout");
                    $timeout(function () {
                        pckry.initShiftLayout(positions, 'data-item-id');
                        //$scope.$digest();
                    }, 0);
                }
                $timeout(function () {
                    NVRDataModel.log("Force calling resize");
                    pckry.shiftLayout();
                }, zm.packeryTimer); // don't ask

                pckry.onresize();

            }, zm.packeryTimer);

        });



        function itemDragged(item) {
            NVRDataModel.debug("drag complete");

            //pckry.getItemElements().forEach(function (itemElem) {

            //console.log (itemElem.attributes['data-item-id'].value+" size  "+itemElem.attributes['data-item-size'].value );
            //  });

            var positions = pckry.getShiftPositions('data-item-id');
            //console.log ("POSITIONS MAP " + JSON.stringify(positions));
            var ld = NVRDataModel.getLogin();
            ld.packeryPositions = JSON.stringify(positions);
            //console.log ("Saving " + ld.packeryPositions);
            NVRDataModel.setLogin(ld);
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

    //-----------------------------------------------------------------------
    // cycle through all displayed monitors and check alarm status
    //-----------------------------------------------------------------------

    function loadAlarmStatus() {

        if ((NVRDataModel.versionCompare($rootScope.apiVersion, "1.30") == -1) ||
            (NVRDataModel.getBandwidth() == 'lowbw') ||
            (NVRDataModel.getLogin().disableAlarmCheckMontage == true))    
        {

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
                            monitor.Monitor.alarmState = 'color:rgba(0,0,0,0);';
                            break;
                        case 1: // pre alarm
                            monitor.Monitor.alarmState = 'color:#e67e22;';
                            break;
                        case 2: // alarm
                            monitor.Monitor.alarmState = 'color:#D91E18;';
                            break;
                        case 3: // alert
                            monitor.Monitor.alarmState = 'color:#e67e22;';
                            break;
                        case 4:
                            monitor.Monitor.alarmState = 'color:#26A65B;';
                            break;

                    }

                },
                function (error) {


                    monitor.Monitor.alarmState = 'color:rgba(0,0,0,0);';
                    NVRDataModel.debug("Error in monitor alarmed status ");
                });
    }


    //-----------------------------------------------------------------------
    // re-compute rand so snapshot in montage reloads
    //-----------------------------------------------------------------------

    function loadNotifications() {

        if ($scope.areImagesLoading) {
            NVRDataModel.debug("skipping image refresh, packery is still loading");
            return;
        }

        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
        
        // if you see the time move, montage should move
        $scope.timeNow = moment().format(NVRDataModel.getTimeFormatSec());

        //console.log ("Inside Montage timer...");

    }

    $scope.cancelReorder = function () {
        $scope.modal.remove();
    };

    $scope.saveReorder = function () {
        NVRDataModel.debug("Saving monitor hide/unhide and sizes");




        $scope.MontageMonitors = $scope.copyMontage;
        $scope.modal.remove();
        $timeout(function () {
            pckry.reloadItems();
        }, 400);
        $timeout(function () {

            draggies.forEach(function (drag) {
                drag.destroy();
            });

            draggies = [];

            pckry.once('layoutComplete', function () {
                //console.log('Saving packery order now, layout rendered');
                $timeout(function () {
                    var positions = pckry.getShiftPositions('data-item-id');
                    NVRDataModel.debug("POSITIONS MAP " + JSON.stringify(positions));
                    var ld = NVRDataModel.getLogin();
                    ld.packeryPositions = JSON.stringify(positions);
                    //console.log ("Saving " + ld.packeryPositions);
                    NVRDataModel.setLogin(ld);
                });
            });

            pckry.getItemElements().forEach(function (itemElem) {
                draggie = new Draggabilly(itemElem);
                pckry.bindDraggabillyEvents(draggie);
                draggies.push(draggie);
                draggie.disable();
            });
            pckry.layout();

        }, 800);

        $ionicScrollDelegate.$getByHandle("montage-delegate").scrollTop();

    };


    $scope.toggleDelete = function (i) {

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
        $scope.copyMontage = angular.copy($scope.MontageMonitors);
        $ionicModal.fromTemplateUrl('templates/reorder-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            })
            .then(function (modal) {
                $scope.modal = modal;
                $scope.modal.show();
            });
    };



    /*
        $scope.closeReorderModal = function () {
          
            $scope.modal.remove();

        };
      */

    //----------------------------------------------------------------
    // Alarm emit handling
    //----------------------------------------------------------------
    $rootScope.$on("alarm", function (event, args) {
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
        if (!$rootScope.isAlarm) {
            $rootScope.alarmCount = "0";
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go("events", {
                "id": 0,
                "playEvent":false
            }, {
                reload: true
            });
        }
    };

    $scope.handleAlarmsWhileMinimized = function () {
        $rootScope.isAlarm = !$rootScope.isAlarm;

        $scope.minimal = !$scope.minimal;
        NVRDataModel.debug("MontageCtrl: switch minimal is " + $scope.minimal);
        ionic.Platform.fullScreen($scope.minimal, !$scope.minimal);
        //console.log ("alarms:Cancelling timer");
        $interval.cancel(intervalHandleMontage);
        $interval.cancel(intervalHandleAlarmStatus);

        if (!$rootScope.isAlarm) {
            $rootScope.alarmCount = "0";
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go("events", {
                "id": 0,
                "playEvent":false
            }, {
                reload: true
            });
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
        $interval.cancel(intervalHandleAlarmStatus);
        // We are reloading this view, so we don't want entry animations
        $ionicHistory.nextViewOptions({
            disableAnimate: true,
            disableBack: true
        });
        $state.go("montage", {
            minimal: $scope.minimal,
            isRefresh: true
        });
    };

    //---------------------------------------------------------------------
    // Show/Hide PTZ control in monitor view
    //---------------------------------------------------------------------
    $scope.togglePTZ = function () {
        $scope.showPTZ = !$scope.showPTZ;
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
        NVRDataModel.debug("setting dragabilly to " + $scope.isDragabillyOn);
        if ($scope.isDragabillyOn) {
            $scope.showSizeButtons = true;

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
                    NVRDataModel.setLogin(ld);
                }, 300);
            }, 100);

        }
    }



    //---------------------------------------------------------------------
    // main monitor modal open - if drag is not on, this is called on touch
    //---------------------------------------------------------------------

    $scope.openModal = function (mid, controllable, controlid, connKey, monitor) {
        openModal(mid, controllable, controlid, connKey, monitor);
    };

    function openModal(mid, controllable, controlid, connKey, monitor) {
        NVRDataModel.debug("MontageCtrl: Open Monitor Modal with monitor Id=" + mid + " and Controllable:" + controllable + " with control ID:" + controlid);
        // $scope.isModalActive = true;
        // Note: no need to setAwake(true) as its already awake
        // in montage view

        NVRDataModel.log("Cancelling montage timer, opening Modal");
        // NVRDataModel.log("Starting Modal timer");
        //console.log ("openModal:Cancelling timer");
        $interval.cancel(intervalHandleMontage);
        $interval.cancel(intervalHandleAlarmStatus);

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

        $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
        $scope.isControllable = controllable;
        $scope.refMonitor = monitor;


        // This is a modal to show the monitor footage
        // We need to switch to always awake if set so the feed doesn't get interrupted
        NVRDataModel.setAwake(NVRDataModel.getKeepAwake());



        // This is a modal to show the monitor footage
        $ionicModal.fromTemplateUrl('templates/monitors-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'

            })
            .then(function (modal) {
                $scope.modal = modal;

                $ionicLoading.show({
                    template: $translate.instant('kPleaseWait'),
                    noBackdrop: true,
                    duration: zm.loadingTimeout
                });


                // we don't really need this as we have stopped the timer
                // $scope.isModalActive = true;

                //$timeout (function() {pckry.shiftLayout();},zm.packeryTimer);
                $scope.modal.show();

            });

    }

    //---------------------------------------------------------------------
    //
    //---------------------------------------------------------------------

    function cleanupOnClose() {
        $scope.modal.remove();
        $timeout(function () {
            NVRDataModel.log("MontageCtrl:Stopping network pull...");
            if (NVRDataModel.isForceNetworkStop()) NVRDataModel.stopNetwork();
        }, 50);

        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
        $scope.isModalActive = false;

        NVRDataModel.log("Restarting montage timer, closing Modal...");
        var ld = NVRDataModel.getLogin();
        // console.log ("closeModal: Cancelling timer");
        $interval.cancel(intervalHandleMontage);
        $interval.cancel(intervalHandleAlarmStatus);

        intervalHandleMontage = $interval(function () {
            loadNotifications();
            //  console.log ("Refreshing Image...");
        }.bind(this), refreshSec * 1000);

        intervalHandleAlarmStatus = $interval(function () {
            loadAlarmStatus();
            //  console.log ("Refreshing Image...");
        }.bind(this), 5000);

        // $timeout (function() {pckry.shiftLayout();},zm.packeryTimer);


    }

    $scope.closeModal = function () {
        NVRDataModel.debug("MontageCtrl: Close & Destroy Monitor Modal");
        cleanupOnClose();
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

    function onPause() {
        NVRDataModel.debug("MontageCtrl: onpause called");
        $interval.cancel(intervalHandleMontage);
        $interval.cancel(intervalHandleAlarmStatus);
        // $interval.cancel(modalIntervalHandle);

        // FIXME: Do I need to  setAwake(false) here?
    }


    function onResume() {


    }

    $scope.openMenu = function () {
        $timeout(function () {
            $rootScope.stateofSlide = $ionicSideMenuDelegate.isOpen();
        }, 500);

        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.$on('$destroy', function () {

    });


    $scope.$on('$ionicView.loaded', function () {
        //  console.log("**VIEW ** Montage Ctrl Loaded");
    });



    $scope.$on('$ionicView.leave', function () {
        // console.log("**VIEW ** Montage Ctrl Left, force removing modal");
        if ($scope.modal) $scope.modal.remove();
    });



    function orientationChanged() {
        NVRDataModel.debug("Detected orientation change, redoing packery resize");
        $timeout(function () {
            if (pckry) pckry.onresize();
        });
    }

    $scope.toggleSizeButtons = function () {

        $scope.showSizeButtons = !$scope.showSizeButtons;

        NVRDataModel.debug("toggling size buttons:" + $scope.showSizeButtons);
        if ($scope.showSizeButtons) $ionicScrollDelegate.$getByHandle("montage-delegate").scrollTop();
    };

    // minimal has to be beforeEnter or header won't hide
    $scope.$on('$ionicView.beforeEnter', function () {
        $scope.minimal = $stateParams.minimal;
        //console.log ("**************** MINIMAL ENTER " + $scope.minimal);
        $scope.zmMarginTop = $scope.minimal ? 0 : 15;




    });


    $scope.$on('$ionicView.afterEnter', function () {
        NVRDataModel.debug("Setting image mode to snapshot, will change to image when packery is all done");
        $scope.areImagesLoading = true;
        $scope.isDragabillyOn = false;
        
        $scope.timeNow = moment().format(NVRDataModel.getTimeFormatSec());
   
       
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
        $scope.showSizeButtons = false;


        $scope.monitors = message;
        $scope.MontageMonitors = angular.copy(message);
        $scope.sliderChanging = false;
        loginData = NVRDataModel.getLogin();

        $scope.isRefresh = $stateParams.isRefresh;
        sizeInProgress = false;
        $scope.imageStyle = true;
        intervalHandleMontage = "";
        $scope.isModalActive = false;
        $scope.isReorder = false;

        $ionicSideMenuDelegate.canDragContent($scope.minimal ? true : true);


        $scope.areImagesLoading = true;
        var ld = NVRDataModel.getLogin();

        refreshSec = (NVRDataModel.getBandwidth()=='lowbw') ? ld.refreshSecLowBW : ld.refreshSec;

        NVRDataModel.debug("bandwidth: " + NVRDataModel.getBandwidth() + " montage refresh set to: " + refreshSec);

        //console.log("Setting Awake to " + NVRDataModel.getKeepAwake());
        NVRDataModel.setAwake(NVRDataModel.getKeepAwake());

        $interval.cancel(intervalHandleMontage);
        $interval.cancel(intervalHandleAlarmStatus);

        intervalHandleMontage = $interval(function () {
            loadNotifications();
            //  console.log ("Refreshing Image...");
        }.bind(this), refreshSec * 1000);

        intervalHandleAlarmStatus = $interval(function () {
            loadAlarmStatus();
            //  console.log ("Refreshing Image...");
        }.bind(this), 5000);


        loadNotifications();

        if ($scope.MontageMonitors.length == 0) {
            $rootScope.zmPopup = $ionicPopup.alert({
                title: $translate.instant('kNoMonitors'),
                template: $translate.instant('kCheckCredentials')
            });
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
            $state.go("login", {
                "wizard": false
            });
            return;
        }

        ld = NVRDataModel.getLogin();

        $rootScope.authSession = "undefined";
        $ionicLoading.show({
            template: $translate.instant('kNegotiatingStreamAuth'),
            animation: 'fade-in',
            showBackdrop: true,
            duration: zm.loadingTimeout,
            maxWidth: 300,
            showDelay: 0
        });


        NVRDataModel.log("Inside Montage Ctrl:We found " + $scope.monitors.length + " monitors");

        // set them all at 50% for packery
        for (var i = 0; i < $scope.MontageMonitors.length; i++) {
            $scope.MontageMonitors[i].Monitor.gridScale = "50";
            $scope.MontageMonitors[i].Monitor.selectStyle = "";
            $scope.MontageMonitors[i].Monitor.alarmState = 'color:rgba(0,0,0,0);';

        }

        $rootScope.validMonitorId = $scope.monitors[0].Monitor.Id;
        NVRDataModel.getAuthKey($rootScope.validMonitorId, (Math.floor((Math.random() * 999999) + 1)).toString())
            .then(function (success) {
                    $ionicLoading.hide();
                    //console.log(success);
                    $rootScope.authSession = success;
                    NVRDataModel.log("Stream authentication construction: " +
                        $rootScope.authSession);

                },
                function (error) {

                    $ionicLoading.hide();
                    NVRDataModel.debug("MontageCtrl: Error in authkey retrieval " + error);
                    //$rootScope.authSession="";
                    NVRDataModel.log("MontageCtrl: Error returned Stream authentication construction. Retaining old value of: " + $rootScope.authSession);
                });

        //console.log("**VIEW ** Montage Ctrl AFTER ENTER");
        window.addEventListener("resize", orientationChanged, false);
        $timeout(function () {
            initPackery();
        }, zm.packeryTimer);
        document.addEventListener("pause", onPause, false);
        document.addEventListener("resume", onResume, false);




    });

    $scope.$on('$ionicView.beforeLeave', function () {
        // console.log("**VIEW ** Montage Ctrl Left, force removing modal");

        //console.log ("beforeLeave:Cancelling timer");
        $interval.cancel(intervalHandleMontage);
        $interval.cancel(intervalHandleAlarmStatus);
        pckry.destroy();
        window.removeEventListener("resize", orientationChanged, false);


        // make sure this is applied in scope digest to stop network pull
        // thats why we are doing it beforeLeave

        if (NVRDataModel.isForceNetworkStop()) {
            NVRDataModel.log("MontageCtrl:Stopping network pull...");
            NVRDataModel.stopNetwork();

        }

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
                NVRDataModel.setLogin(ld);
                // $scope.slider.monsize = 2;
            });
            //layout(pckry);
            $timeout(function () {
                pckry.layout();
            }, zm.packeryTimer); // force here - no shiftlayout


        }, 100);

    };


    function layout(pckry) {
        pckry.shiftLayout();
    }

    //---------------------------------------------------------
    // slider is tied to the view slider for montage
    //Remember not to use a variable. I'm using an object
    // so it's passed as a reference - otherwise it makes
    // a copy and the value never changes
    //---------------------------------------------------------

    $scope.sliderChanged = function (dirn) {

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


        pckry.shiftLayout();

        pckry.once('layoutComplete', function () {
            $timeout(function () {
                var positions = pckry.getShiftPositions('data-item-id');
                //console.log ("POSITIONS MAP " + JSON.stringify(positions));
                var ld = NVRDataModel.getLogin();
                
                ld.packeryPositions = JSON.stringify(positions);
                 //console.log ("Saving " + ld.packeryPositions);
                NVRDataModel.setLogin(ld);
                $ionicLoading.hide();
                $scope.sliderChanging = false;
            }, zm.packeryTimer);
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



    $scope.$on('$ionicView.afterEnter', function () {
        // This rand is really used to reload the monitor image in img-src so it is not cached
        // I am making sure the image in montage view is always fresh
        // I don't think I am using this anymore FIXME: check and delete if needed
        // $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
    });

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
