// Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,ionic */


angular.module('zmApp.controllers').controller('zmApp.MontageCtrl', ['$scope', '$rootScope', 'ZMDataModel', 'message', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$ionicPopup', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$ionicPlatform', 'zm', '$ionicPopover', '$controller', 'imageLoadingDataShare', '$window', function ($scope, $rootScope, ZMDataModel, message, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $ionicPopup, $stateParams, $ionicHistory, $ionicScrollDelegate, $ionicPlatform, zm, $ionicPopover, $controller, imageLoadingDataShare, $window) {

    $controller('zmApp.BaseController', {
        $scope: $scope
    });
    //---------------------------------------------------------------------
    // Controller main
    //---------------------------------------------------------------------

    console.log("********  HAVE ALL MONITORS");
    
      var isLongPressActive = false;
    $scope.isReorder = false;
    var intervalHandleMontage; // will hold image resize timer on long press
    var montageIndex = 0; // will hold monitor ID to scale in timer

    $scope.monitorSize = []; // array with montage sizes per monitor
    $scope.scaleDirection = []; // 1 = increase -1 = decrease

    $scope.slider = {};
    $scope.slider.monsize = ZMDataModel.getMontageSize();

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
    var tempResponse = ZMDataModel.applyMontageMonitorPrefs(message, 0);
    $scope.monitors = tempResponse[0];
    montageOrder = tempResponse[1];
    hiddenOrder = tempResponse[2];
    
    ZMDataModel.zmLog("Inside Montage Ctrl:We found " + $scope.monitors.length + " monitors");

    $scope.MontageMonitors = ZMDataModel.applyMontageMonitorPrefs (message, 1)[0];
    
    


    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);

    $scope.showSizeButtons = false;
    $ionicPopover.fromTemplateUrl('templates/help/montage-help.html', {
        scope: $scope,
    }).then(function (popover) {
        $scope.popover = popover;
    });

    var timestamp = new Date().getUTCMilliseconds();
    $scope.minimal = $stateParams.minimal;
    $scope.isRefresh = $stateParams.isRefresh;
    var sizeInProgress = false;
    $scope.imageStyle = true;

    $ionicSideMenuDelegate.canDragContent(false);

  

    /*
    
    // First let's check if the user already has a saved monitor order
    var i;
    if (window.localStorage.getItem("montageOrder") == undefined) {

        for (i = 0; i < $scope.monitors.length; i++) {
            montageOrder[i] = i; // order to show is order ZM returns
            hiddenOrder[i] = 0; // don't hide them
        }
        console.log("Order string is " + montageOrder.toString());
        console.log("Hiddent string is " + hiddenOrder.toString());

        ZMDataModel.zmLog("Stored montage order does not exist");
    } else
    // there is a saved order
    {
        var myorder = window.localStorage.getItem("montageOrder");
        var myhiddenorder = window.localStorage.getItem("montageHiddenOrder");


        ZMDataModel.zmDebug("MontageCtrl: Montage order is " + myorder);
        ZMDataModel.zmDebug("MontageCtrl: Hidden order is " + myhiddenorder);
        if (myorder) montageOrder = myorder.split(",");
        if (myhiddenorder) hiddenOrder = myhiddenorder.split(",");

        //  handle add/delete monitors after the array has been 
        // saved

        if ($scope.monitors.length != montageOrder.length) {
            ZMDataModel.zmLog("Monitors array length different from stored hidden/order array. It's possible monitors were added/removed. Resetting...");
            montageOrder = [];
            hiddenOrder = [];
            for (i = 0; i < $scope.monitors.length; i++) {
                montageOrder[i] = i; // order to show is order ZM returns
                hiddenOrder[i] = 0; // don't hide them
            }
            window.localStorage.setItem("montageOrder",
                montageOrder.toString());
            window.localStorage.setItem("montageHiddenOrder",
                hiddenOrder.toString());


        }

    } // at this stage, the monitor arrangement is not matching
    // the montage order. Its in true order. Let us first process the hiddenOrder part
    // now

    for (i = 0; i < montageOrder.length; i++) {
        montageOrder[i] = parseInt(montageOrder[i]);
        hiddenOrder[i] = parseInt(hiddenOrder[i]);
        //  $scope.monitors[i].Monitor.sortOrder = montageOrder[i];
        // FIXME: This will briefly show and then hide
        // disabled monitors
        if (hiddenOrder[i] == 1) {
            // $scope.monitors[i].Monitor.listDisplay='noshow';

            if ($scope.monitors[i] !== undefined)
                $scope.monitors[i].Monitor.listDisplay = 'noshow';
            ZMDataModel.zmLog("Monitor " + i + " is marked as hidden in montage");
        } else {
            if ($scope.monitors[i] !== undefined)
                $scope.monitors[i].Monitor.listDisplay = 'show';
        }
    } */
    
    
    
    // now arrange monitors according to montage order
    // FIXME: Incredibly horrible logic
    // I really need to organize this properly into one structure

    // empty out monitors as I'll need to insert them as per montageOrder
    // remember to assign
    

    
    


    // Do we have a saved montage array size? No?
    if (window.localStorage.getItem("montageArraySize") == undefined) {

        for (var i = 0; i < $scope.monitors.length; i++) {
            $scope.monitorSize.push(ZMDataModel.getMontageSize());
            $scope.scaleDirection.push(1);
        }
    } else // recover previous settings
    {
        var msize = window.localStorage.getItem("montageArraySize");
        console.log("MontageArrayString is=>" + msize);
        $scope.monitorSize = msize.split(":");
        var j;

        for (j = 0; j < $scope.monitorSize.length; j++) {
            // convert to number other wise adding to it concatenates :-)
            $scope.monitorSize[j] = parseInt($scope.monitorSize[j]);
            $scope.scaleDirection.push(1);
            console.log("Montage size for monitor " + j + " is " + $scope.monitorSize[j]);

        }

    }
    // $scope.monitorSize = monitorSize;
    // $scope.scaleDirection = scaleDirection;

    $scope.LoginData = ZMDataModel.getLogin();
    $scope.monLimit = $scope.LoginData.maxMontage;
    console.log("********* Inside Montage Ctrl, MAX LIMIT=" + $scope.monLimit);


    $rootScope.authSession = "undefined";
    $ionicLoading.show({
        template: 'negotiating stream authentication...',
        animation: 'fade-in',
        showBackdrop: true,
        duration: zm.loadingTimeout,
        maxWidth: 300,
        showDelay: 0
    });


    var ld = ZMDataModel.getLogin();
    ZMDataModel.getAuthKey()
        .then(function (success) {
                $ionicLoading.hide();
                console.log(success);
                $rootScope.authSession = success;
                ZMDataModel.zmLog("Stream authentication construction: " +
                    $rootScope.authSession);

            },
            function (error) {

                $ionicLoading.hide();
                ZMDataModel.zmDebug("MontageCtrl: Error in authkey retrieval " + error);
                //$rootScope.authSession="";
                ZMDataModel.zmLog("MontageCtrl: Error returned Stream authentication construction. Retaining old value of: " + $rootScope.authSession);
            });


    // I was facing a lot of problems with Chrome/crosswalk getting stuck with
    // pending HTTP requests after a while. There is a problem with chrome handling
    // multiple streams of always open HTTP get's (image streaming). This problem
    // does not arise when the image is streamed for a single monitor - just multiple

    // To work around this I am taking a single snapshot of ZMS and have implemented a timer
    // to reload the snapshot every 1 second. Seems to work reliably even thought its a higer
    // load. Will it bonk with many monitors? Who knows. I have tried with 5 and 1280x960@32bpp


    function loadNotifications() {

        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
        //console.log ("Inside Montage timer...");

    }

    var intervalHandle;
    $scope.isModalActive = false;
    var modalIntervalHandle;


    $scope.closeReorderModal = function () {
        console.log("Close & Destroy Monitor Modal");
        // switch off awake, as liveview is finished
        //ZMDataModel.setAwake(false);
        $scope.modal.remove();

    };

    //----------------------------------------------------------------
    // Alarm notification handling
    //----------------------------------------------------------------
    $scope.handleAlarms = function()
    {
        $rootScope.isAlarm=!$rootScope.isAlarm;
        if (!$rootScope.isAlarm)
        {
            $rootScope.alarmCount="0";
            $ionicHistory.nextViewOptions({disableBack: true});		
            $state.go("events", {"id": 0}, { reload: true });
        }
    };
    
    $scope.handleAlarmsWhileMinimized = function()
    {
        $rootScope.isAlarm=!$rootScope.isAlarm;
        
         $scope.minimal = !$scope.minimal;
        ZMDataModel.zmDebug("MontageCtrl: switch minimal is " + $scope.minimal);
        ionic.Platform.fullScreen($scope.minimal, !$scope.minimal);
        $interval.cancel(intervalHandle);
        
        if (!$rootScope.isAlarm)
        {
            $rootScope.alarmCount="0";
            $ionicHistory.nextViewOptions({disableBack: true});		
            $state.go("events", {"id": 0}, { reload: true });
        }
    };

    //-------------------------------------------------------------
    // Called when user taps on the reorder button
    //-------------------------------------------------------------

    $scope.reorderList = function () {
        console.log("REORDER");
        $scope.data.showDelete = false;
        $scope.data.showReorder = !$scope.data.showReorder;
    };

    $scope.deleteList = function () {
        console.log("DELETE");
        $scope.data.showDelete = !$scope.data.showDelete;
        $scope.data.showReorder = false;
    };

    $scope.reloadReorder = function () {
        var refresh = ZMDataModel.getMonitors(1);
        refresh.then(function (data) {
            $scope.monitors = data;
            $scope.MontageMonitors = data;
            oldMonitors = angular.copy($scope.monitors);
            var i;
            montageOrder = [];
            for (i = 0; i < $scope.monitors.length; i++) {
                montageOrder[i] = i;
                hiddenOrder[i] = 0;
            }
            window.localStorage.setItem("montageOrder", montageOrder.toString());
            window.localStorage.setItem("montageHiddenOrder", hiddenOrder.toString());
            ZMDataModel.zmLog("Montage order saved on refresh: " + montageOrder.toString() + " and hidden order: " + hiddenOrder.toString());

        });
    };

    $scope.saveReorder = function () {
        window.localStorage.setItem("montageOrder", montageOrder.toString());
        window.localStorage.setItem("montageHiddenOrder",
            hiddenOrder.toString());
        console.log("Saved " + montageOrder.toString());
        ZMDataModel.zmLog("User press OK. Saved Monitor Order as: " +
            montageOrder.toString() +
            " and hidden order as " + hiddenOrder.toString());
        $scope.modal.remove();
    };

    $scope.cancelReorder = function () {
        // user tapped cancel
        var i, myhiddenorder;
        if (window.localStorage.getItem("montageOrder") == undefined) {
            for (i = 0; i < $scope.MontageMonitors.length; i++) {
                montageOrder[i] = i;
                hiddenOrder[i] = 0;
            }
            console.log("Order string is " + montageOrder.toString());
            ZMDataModel.zmLog("User press Cancel. Reset Monitor Order to: " + montageOrder.toString());
        } else // montageOrder exists
        {
            var myorder = window.localStorage.getItem("montageOrder");

            if (window.localStorage.getItem("montageHiddenOrder") == undefined) {
                for (i = 0; i < $scope.MontageMonitors.length; i++) {
                    hiddenOrder[i] = 0;
                }
            } else {
                myhiddenorder = window.localStorage.getItem("montageHiddenOrder");
                hiddenOrder = myhiddenorder.split(",");
            }

            console.log("Montage order is " + myorder + " and hidden order is " + myhiddenorder);
            montageOrder = myorder.split(",");

            for (i = 0; i < montageOrder.length; i++) {
                montageOrder[i] = parseInt(montageOrder[i]);
                hiddenOrder[i] = parseInt(hiddenOrder[i]);
            }

            $scope.MontageMonitors = oldMonitors;
            ZMDataModel.zmLog("User press Cancel. Restored Monitor Order as: " + montageOrder.toString() + " and hidden order as: " + hiddenOrder.toString());

        }
        $scope.modal.remove();
    };

    $scope.toggleReorder = function () {
        $scope.isReorder = !$scope.isReorder;
        $scope.data = {};
        $scope.data.showDelete = false;
        $scope.data.showReorder = false;

        var i;
        oldMonitors = angular.copy($scope.monitors);
        /*for (i=0; i<$scope.monitors.length; i++)
        {
            $scope.monitors[i].Monitor.listDisplay="show";
        }*/

        ld = ZMDataModel.getLogin();
        if (ld.enableDebug) {
            // Lets show the re-order list
            for (i = 0; i < $scope.MontageMonitors.length; i++) {
                ZMDataModel.zmDebug("Montage reorder list: " + $scope.MontageMonitors[i].Monitor.Name +
                    ":listdisplay->" + $scope.MontageMonitors[i].Monitor.listDisplay);

            }
        }

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
    $scope.onSwipeLeft = function ($index) {
        $scope.showSizeButtons = true;
    };

    $scope.onSwipeRight = function ($index) {
        $timeout(function () {
            $scope.showSizeButtons = false;
        }, 1000);

    };*/

    //---------------------------------------------------------------------
    // This marks a monitor as hidden in montage view
    //---------------------------------------------------------------------

    $scope.deleteItem = function (index) {
        var findindex = montageOrder.indexOf(index);
        // $scope.monitors[index].Monitor.Function = 'None';
        if ($scope.MontageMonitors[index].Monitor.listDisplay == 'show') {
            $scope.MontageMonitors[index].Monitor.listDisplay = 'noshow';
            hiddenOrder[findindex] = 1;
        } else {
            $scope.MontageMonitors[index].Monitor.listDisplay = 'show';
            // we need to find the index of Montage Order that contains index
            // because remember, hiddenOrder does not change its orders as monitors
            // move

            hiddenOrder[findindex] = 0;
        }
        //window.localStorage.setItem("montageOrder", montageOrder.toString());
        console.log("DELETE: Order Array now is " + montageOrder.toString());
        console.log("DELETE: Hidden Array now is " + hiddenOrder.toString());
        ZMDataModel.zmLog("Marked monitor " + findindex + " as " + $scope.MontageMonitors[index].Monitor.listDisplay + " in montage");

    };

    //---------------------------------------------------------------------
    // When we re-arrange the montage, all the ordering index moves
    // horrible horrible code
    //---------------------------------------------------------------------

    function reorderItem(item, from, to, reorderHidden) {

        ZMDataModel.zmDebug("MontageCtrl: Reorder from " + from + " to " + to);
        $scope.MontageMonitors.splice(from, 1);
        $scope.MontageMonitors.splice(to, 0, item);

        // Now we need to re-arrange the montageOrder
        // hiddenOrder remains the same

        var i, j;
        for (i = 0; i < $scope.monitors.length; i++) {
            for (j = 0; j < $scope.MontageMonitors.length; j++) {
                if ($scope.monitors[i].Monitor.Id == $scope.MontageMonitors[j].Monitor.Id) {
                    montageOrder[i] = j;
                    break;
                }
            }
        }
        ZMDataModel.zmLog("New Montage Order is: " + montageOrder.toString());

    }


    $scope.reorderItem = function (item, from, to) {
        reorderItem(item, from, to, true);
    };


    //---------------------------------------------------------------------
    // Triggered when you enter/exit full screen
    //---------------------------------------------------------------------
    $scope.switchMinimal = function () {
        $scope.minimal = !$scope.minimal;
        ZMDataModel.zmDebug("MontageCtrl: switch minimal is " + $scope.minimal);
        console.log("Hide Statusbar");
        ionic.Platform.fullScreen($scope.minimal, !$scope.minimal);
        $interval.cancel(intervalHandle); //we will renew on reload
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

    $scope.callback = function () {
        console.log("dragging");
    };


    $scope.onDropComplete = function (index, obj, event) {
        console.log("dragged");
        var otherObj = $scope.monitors[index];
        var otherIndex = $scope.monitors.indexOf(obj);
        $scope.monitors[index] = obj;
        $scope.monitors[otherIndex] = otherObj;
    };


    //---------------------------------------------------------------------
    // main monitor modal open
    //---------------------------------------------------------------------
    $scope.openModal = function (mid, controllable, controlid) {
        ZMDataModel.zmDebug("MontageCtrl: Open Monitor Modal with monitor Id=" + mid + " and Controllable:" + controllable + " with control ID:" + controlid);
        // $scope.isModalActive = true;
        // Note: no need to setAwake(true) as its already awake
        // in montage view

        ZMDataModel.zmLog("Cancelling montage timer, opening Modal");
        // ZMDataModel.zmLog("Starting Modal timer");
        $interval.cancel(intervalHandle);

        // let's start modal timer
        //   modalIntervalHandle= $interval(function () {
        //    modalLoadNotifications();
        //  console.log ("Refreshing Image...");
        //  }.bind(this), 1000);

        $scope.monitorId = mid;

        $scope.LoginData = ZMDataModel.getLogin();
        $rootScope.modalRand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
        $scope.ptzMoveCommand = "";

        // This is a modal to show the monitor footage
        // We need to switch to always awake if set so the feed doesn't get interrupted
        ZMDataModel.setAwake(ZMDataModel.getKeepAwake());

        // if its controllable, lets get the control command
        if (controllable == '1') {
            ZMDataModel.zmDebug("MontageCtrl: getting controllable data " + myurl);
            var apiurl = $scope.LoginData.apiurl;
            var myurl = apiurl + "/controls/" + controlid + ".json";
            ZMDataModel.zmDebug("MontageCtrl: getting controllable data " + myurl);

            $http.get(myurl)
                .success(function (data) {
                    ZMDataModel.zmDebug("MontageCtrl: control data returned " + JSON.stringify(data));
                    $scope.ptzMoveCommand = (data.control.Control.CanMoveCon == '1') ? 'moveCon' : 'move';
                    console.log("***moveCommand: " + $scope.ptzMoveCommand);
                    ZMDataModel.zmLog("ControlDB reports PTZ command to be " + $scope.ptzMoveCommand);
                })
                .error(function (data) {
                    console.log("** Error retrieving move PTZ command");
                    ZMDataModel.zmLog("Error retrieving PTZ command  " + JSON.stringify(data), "error");
                });
        }

        // This is a modal to show the monitor footage
        $ionicModal.fromTemplateUrl('templates/monitors-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'

            })
            .then(function (modal) {
                $scope.modal = modal;

                $ionicLoading.show({
                    template: "please wait...",
                    noBackdrop: true,
                    duration: zm.loadingTimeout
                });
                $scope.isControllable = controllable;
                $scope.showPTZ = false;

                $scope.isModalActive = true;


                $scope.modal.show();

            });

    };

    //---------------------------------------------------------------------
    //
    //---------------------------------------------------------------------

    $scope.closeModal = function () {
        ZMDataModel.zmDebug("MontageCtrl: Close & Destroy Monitor Modal");
        // $scope.isModalActive = false;
        // Note: no need to setAwake(false) as needs to be awake
        // in montage view
        $scope.modal.remove();

        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
        $scope.isModalActive = false;

        ZMDataModel.zmLog("Restarting montage timer, closing Modal...");
        var ld = ZMDataModel.getLogin();
        $interval.cancel(intervalHandle);
        intervalHandle = $interval(function () {
            loadNotifications();
            //  console.log ("Refreshing Image...");
        }.bind(this), ld.refreshSec * 1000);

        //$interval.cancel(modalIntervalHandle);



    };

    //---------------------------------------------------------------------
    // allows you to resize individual montage windows
    //---------------------------------------------------------------------
    function scaleMontage() {
        var index = montageIndex;
        console.log(" MONTAGE INDEX === " + montageIndex);
        console.log("Scaling Monitor " + index);
        if ($scope.monitorSize[index] == 6)
            $scope.scaleDirection[index] = -1;

        if ($scope.monitorSize[index] == 1)
            $scope.scaleDirection[index] = 1;

        $scope.monitorSize[index] += $scope.scaleDirection[index];

        console.log("Changed size to " + $scope.monitorSize[index]);

        var monsizestring = "";
        var i;
        for (i = 0; i < $scope.monitors.length; i++) {
            monsizestring = monsizestring + $scope.monitorSize[i] + ':';
        }
        monsizestring = monsizestring.slice(0, -1); // kill last :
        console.log("Setting monsize string:" + monsizestring);
        window.localStorage.setItem("montageArraySize", monsizestring);
    }

    //---------------------------------------------------------------------
    // if you long press on a montage window, it calls scale montage
    // at a 300 freq
    //---------------------------------------------------------------------
    $scope.onHold = function (index) {
        montageIndex = index;
        isLongPressActive = true;
        intervalHandleMontage = $interval(function () {
            scaleMontage();

        }.bind(this), zm.montageScaleFrequency);
        console.log("****Interval handle started **********" + zm.montageScaleFrequency);
    };

    //---------------------------------------------------------------------
    // stop scaling montage window on release
    //---------------------------------------------------------------------
    $scope.onRelease = function (index) {
        console.log("Press release on " + index);
        isLongPressActive = false;
        $interval.cancel(intervalHandleMontage);
    };



    //---------------------------------------------------------------------
    // In Android, the app runs full steam while in background mode
    // while in iOS it gets suspended unless you ask for specific resources
    // So while this view, we DON'T want Android to keep sending 1 second
    // refreshes to the server for images we are not seeing
    //---------------------------------------------------------------------

    function onPause() {
        ZMDataModel.zmDebug("MontageCtrl: onpause called");
        $interval.cancel(intervalHandle);
        // $interval.cancel(modalIntervalHandle);

        // FIXME: Do I need to  setAwake(false) here?
    }


    function onResume() {
        if (!$scope.isModalActive) {
            var ld = ZMDataModel.getLogin();
            ZMDataModel.zmDebug("MontageCtrl: onresume called");
            ZMDataModel.zmLog("Restarting montage timer on resume");
            $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
            $interval.cancel(intervalHandle);
            intervalHandle = $interval(function () {
                loadNotifications();
                //  console.log ("Refreshing Image...");
            }.bind(this), ld.refreshSec * 1000);
        } else // modal is active
        {
            // $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);
        }




    }

    $scope.openMenu = function () {
        $timeout(function () {
            $rootScope.stateofSlide = $ionicSideMenuDelegate.isOpen();
        }, 500);

        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.$on('$destroy', function () {
        console.log("*** CANCELLING INTERVAL ****");
        $interval.cancel(intervalHandle);
    });


    $scope.$on('$ionicView.loaded', function () {
        console.log("**VIEW ** Montage Ctrl Loaded");
    });

    $scope.$on('$ionicView.enter', function () {
        console.log("**VIEW ** Montage Ctrl Entered, Starting loadNotifications");
        var ld = ZMDataModel.getLogin();
        console.log("Setting Awake to " + ZMDataModel.getKeepAwake());
        ZMDataModel.setAwake(ZMDataModel.getKeepAwake());

        $interval.cancel(intervalHandle);
        intervalHandle = $interval(function () {
            loadNotifications();
            //  console.log ("Refreshing Image...");
        }.bind(this), ld.refreshSec * 1000);

        loadNotifications();
    });

    $scope.$on('$ionicView.leave', function () {
        console.log("**VIEW ** Montage Ctrl Left, force removing modal");
        if ($scope.modal) $scope.modal.remove();
    });

    $scope.$on('$ionicView.unloaded', function () {
        // console.log("**************** CLOSING WINDOW ***************************");
        //  $window.close();
    });

    //---------------------------------------------------------
    // This function readjusts  montage size
    //  and stores current size to persistent memory
    //---------------------------------------------------------

    function processSliderChanged(val) {
        if (sizeInProgress) return;

        sizeInProgress = true;
        console.log('Size has changed');
        ZMDataModel.setMontageSize(val);
        console.log("ZMData Montage is " + ZMDataModel.getMontageSize() +
            " and slider montage is " + $scope.slider.monsize);
        // Now go ahead and reset sizes of entire monitor array
        var monsizestring = "";
        var i;
        for (i = 0; i < $scope.monitors.length; i++) {

            $scope.monitorSize[i] = parseInt(ZMDataModel.getMontageSize());
            console.log("Resetting Monitor " + i + " size to " + $scope.monitorSize[i]);
            $scope.scaleDirection[i] = 1;
            monsizestring = monsizestring + $scope.monitorSize[i] + ':';
        }
        monsizestring = monsizestring.slice(0, -1); // kill last :
        console.log("Setting monsize string:" + monsizestring);
        window.localStorage.setItem("montageArraySize", monsizestring);
        sizeInProgress = false;
    }

    //---------------------------------------------------------
    // In full screen montage view, I call this function
    // as slider is hidden
    //---------------------------------------------------------

    $scope.changeSize = function (val) {
        var newSize = parseInt($scope.slider.monsize) + val;

        $scope.slider.monsize = newSize;
        if ($scope.slider.monsize < "1") $scope.slider.monsize = "1";
        if ($scope.slider.monsize > "6") $scope.slider.monsize = "6";
        processSliderChanged($scope.slider.monsize);

    };

    //---------------------------------------------------------
    // slider is tied to the view slider for montage
    //Remember not to use a variable. I'm using an object
    // so it's passed as a reference - otherwise it makes
    // a copy and the value never changes
    //---------------------------------------------------------

    $scope.sliderChanged = function () {
        processSliderChanged($scope.slider.monsize);
    };

    $scope.$on('$ionicView.afterEnter', function () {
        // This rand is really used to reload the monitor image in img-src so it is not cached
        // I am making sure the image in montage view is always fresh
        // I don't think I am using this anymore FIXME: check and delete if needed
        // $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
    });

    $scope.reloadView = function () {
        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
        ZMDataModel.zmLog("User action: image reload " + $rootScope.rand);
    };

    $scope.doRefresh = function () {



        console.log("***Pull to Refresh, recomputing Rand");
        ZMDataModel.zmLog("Reloading view for montage view, recomputing rand");
        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
        $scope.monitors = [];
        imageLoadingDataShare.set(0);

        var refresh = ZMDataModel.getMonitors(1);

        refresh.then(function (data) {
            $scope.monitors = data;
            $scope.$broadcast('scroll.refreshComplete');
        });
    };


}]);