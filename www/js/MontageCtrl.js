// Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,ionic,Packery, Draggabilly, imagesLoaded */


angular.module('zmApp.controllers').controller('zmApp.MontageCtrl', ['$scope', '$rootScope', 'ZMDataModel', 'message', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$ionicPopup', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$ionicPlatform', 'zm', '$ionicPopover', '$controller', 'imageLoadingDataShare', '$window',  '$localstorage', function ($scope, $rootScope, ZMDataModel, message, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $ionicPopup, $stateParams, $ionicHistory, $ionicScrollDelegate, $ionicPlatform, zm, $ionicPopover, $controller, imageLoadingDataShare, $window, $localstorage) {

    $controller('zmApp.BaseController', {
        $scope: $scope
    });
    //---------------------------------------------------------------------
    // Controller main
    //---------------------------------------------------------------------

    
    var isLongPressActive = false;
    $scope.isReorder = false;
    var intervalHandleMontage; // will hold image resize timer on long press
    var montageIndex = 0; // will hold monitor ID to scale in timer
    
    var gridcontainer;

    $scope.monitorSize = []; // array with montage sizes per monitor
    $scope.scaleDirection = []; // 1 = increase -1 = decrease

    $scope.slider = {};

    
    
    
    
    $scope.slider.monsize = ZMDataModel.getMontageSize();
    
    var oldSliderVal = $scope.slider.monsize;
    $scope.revMonSize = 11 - parseInt($scope.slider.monsize);

    // The difference between old and original is this:
    // old will have a copy of the last re-arranged monitor list
    // while original will have a copy of the order returned by ZM

    var oldMonitors = []; // To keep old order if user cancels after sort;
    
    var pckry, draggie;
    var draggies;
    $scope.isDragabillyOn = false;
    $scope.gridScale = "grid-item-20";
    $scope.animateMonitor="";
    
    $scope.changeScale = function()
    {
        if ($scope.gridScale=="")
                $scope.gridScale = "grid-item-40";
        
        else if ($scope.gridScale=="grid-item-40")
                $scope.gridScale="grid-item-60";
        
         else if ($scope.gridScale=="grid-item-60")
                $scope.gridScale="grid-item-80";
        
        
        else if ($scope.gridScale =="grid-item-80")
                $scope.gridScale = "grid-item-100";
        
        
        else if ($scope.gridScale =="grid-item-100")
                $scope.gridScale = "";
        
        ZMDataModel.zmLog ("Changing scale to " + $scope.gridScale);
        pckry.destroy();
        $timeout ( function () {initPackery(); },500);
        
        
    };

    // Montage display order may be different so don't
    // mangle monitors as it will affect other screens
    // in Montage screen we will work with this local copy
    //$scope.MontageMonitors = angular.copy ($scope.monitors);

    var montageOrder = []; // This array will keep the ordering in montage view
    var hiddenOrder = []; // 1 = hide, 0 = don't hide
    
    var tempMonitors = message;
    
    
    if (tempMonitors.length == 0)
    {
        $rootScope.zmPopup= $ionicPopup.alert({
                    title: "No Monitors found",
                    template: "Please check your credentials"
        });
        $ionicHistory.nextViewOptions({
                    disableBack: true
        });
        $state.go("login");
        return;
    }
    
   // console.log ("TEMP MONITORS IS " + JSON.stringify(tempMonitors));
    var tempResponse = ZMDataModel.applyMontageMonitorPrefs(message, 0);
    $scope.monitors = tempResponse[0];
    
    
    
    montageOrder = tempResponse[1];
    hiddenOrder = tempResponse[2];
    
    ZMDataModel.zmLog("Inside Montage Ctrl:We found " + $scope.monitors.length + " monitors");

    $scope.MontageMonitors = ZMDataModel.applyMontageMonitorPrefs (message, 1)[0];
    
    for (i=0; i < $scope.MontageMonitors.length; i++)
    {
        $scope.MontageMonitors[i].Monitor.gridScale="20";
        $scope.MontageMonitors[i].Monitor.selectStyle="";
        
    }
    
    var loginData = ZMDataModel.getLogin();
    
    $scope.packMontage = loginData.packMontage;
    //var pckry;
    
    
    // init packery
    
    
  

function initPackery()
{
        
        var progressCalled = false;
        draggies = [];
    
        var layouttype = true;
        var ld = ZMDataModel.getLogin();
    
        
        var positionsStr = ld.packeryPositions;
        var positions={};
    
        if (positionsStr == '')
        {
            ZMDataModel.zmLog ("Did NOT find a packery layout");
            layouttype  = true;
        }
        else
        {
            console.log ("POSITION STR IS " + positionsStr);
            positions = JSON.parse(positionsStr);
            ZMDataModel.zmLog ("found a packery layout");
            layouttype = false;
        }
        
        var elem =  angular.element(document.getElementById("mygrid"));
        pckry = new Packery('.grid', 
                             {
                                itemSelector: '.grid-item',
                                percentPosition: true,
                                columnWidth: '.grid-sizer',
                                gutter:0,
                                initLayout:layouttype
                                
                            });
         //console.log ("**** mygrid is " + JSON.stringify(elem));
         
        imagesLoaded(elem).on('progress', function() {
                console.log ("******** SOME IMAGE LOADED");
                progressCalled = true;
                if (layouttype) $timeout (function(){pckry.layout();},50);
        });
        
        imagesLoaded(elem).on('always', function() {
                console.log ("******** ALL IMAGES LOADED");
                
                if (!progressCalled)
                {
                    ZMDataModel.zmlog ("*** BUG PROGRESS WAS NOT CALLED");
                    pckry.reloadItems();
                    
                }
            
                 pckry.getItemElements().forEach(function (itemElem) {
                      draggie = new Draggabilly(itemElem);
                      pckry.bindDraggabillyEvents(draggie);
                      draggies.push(draggie);
                      draggie.disable();
                });
                
                pckry.on( 'dragItemPositioned', itemDragged );
            
                
               
                if (!isEmpty(positions))
                {
                    ZMDataModel.zmLog ("Arranging as per packery grid");
                    $timeout(function(){pckry.initShiftLayout(positions, 'data-item-id');},500);
                    //$grid.packery( 'initShiftLayout', initPositions, 'data-item-id' );
                }
               
        });
    
        function itemDragged(item)
        {
            ZMDataModel.zmDebug ("drag complete");
            
            pckry.getItemElements().forEach(function (itemElem) {
             
                console.log (itemElem.attributes['data-item-id'].value+" size  "+itemElem.attributes['data-item-size'].value );
            });
            
            var positions = pckry.getShiftPositions('data-item-id');
             console.log ("POSITIONS MAP " + JSON.stringify(positions));
             var ld = ZMDataModel.getLogin();
             ld.packeryPositions = JSON.stringify(positions);
             ZMDataModel.setLogin(ld);
        }
  
        
    }

    
    function isEmpty( obj ) 
    { 
      for ( var prop in obj ) { 
        return false; 
      } 
      return true; 
}
    
   
    // --------------------------------------------------------
    // Handling of back button in case modal is open should
    // close the modal
    // --------------------------------------------------------                               
    
    $ionicPlatform.registerBackButtonAction(function (e) {
            e.preventDefault();
            if ($scope.modal && $scope.modal.isShown())
            {
                // switch off awake, as liveview is finished
                ZMDataModel.zmDebug("Modal is open, closing it");
                ZMDataModel.setAwake(false);
                $scope.modal.remove();
                $scope.isModalActive = false;
            }
            else
            {
                ZMDataModel.zmDebug("Modal is closed, so toggling or exiting");
                if (!$ionicSideMenuDelegate.isOpenLeft()) 
                {
                    $ionicSideMenuDelegate.toggleLeft();
                   
                } 
                else 
                {
                    navigator.app.exitApp();
                }
            
            }
            
        }, 1000);


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
    $scope.zmMarginTop = $scope.minimal ? 0:15;

    
    $scope.isRefresh = $stateParams.isRefresh;
    var sizeInProgress = false;
    $scope.imageStyle = true;

    $ionicSideMenuDelegate.canDragContent(false);

  

    
    


    // Do we have a saved montage array size? No?
   // if (window.localStorage.getItem("montageArraySize") == undefined) {
    if (loginData.montageArraySize == '0') {

        for (var i = 0; i < $scope.monitors.length; i++) {
            $scope.monitorSize.push(ZMDataModel.getMontageSize());
            $scope.scaleDirection.push(1);
        }
    } else // recover previous settings
    {
        var msize = loginData.montageArraySize;
       // console.log("MontageArrayString is=>" + msize);
        $scope.monitorSize = msize.split(":");
        var j;

        for (j = 0; j < $scope.monitorSize.length; j++) {
            // convert to number other wise adding to it concatenates :-)
            $scope.monitorSize[j] = parseInt($scope.monitorSize[j]);
            $scope.scaleDirection.push(1);
           // console.log("Montage size for monitor " + j + " is " + $scope.monitorSize[j]);

        }

    }
    // $scope.monitorSize = monitorSize;
    // $scope.scaleDirection = scaleDirection;

    $scope.LoginData = ZMDataModel.getLogin();
    $scope.monLimit = $scope.LoginData.maxMontage;
    //console.log("********* Inside Montage Ctrl, MAX LIMIT=" + $scope.monLimit);


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
    
    //console.log ("MONITORS " + JSON.stringify($scope.monitors));
    $rootScope.validMonitorId = $scope.monitors[0].Monitor.Id;
    ZMDataModel.getAuthKey($rootScope.validMonitorId, (Math.floor((Math.random() * 999999) + 1)).toString())
        .then(function (success) {
                $ionicLoading.hide();
                //console.log(success);
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

    $rootScope.intervalHandle="";
    $scope.isModalActive = false;
    var modalIntervalHandle;


    $scope.closeReorderModal = function () {
       // console.log("Close & Destroy Monitor Modal");
        // switch off awake, as liveview is finished
        //ZMDataModel.setAwake(false);
        $scope.modal.remove();

    };
    
    
    //----------------------------------------------------------------
    // Alarm emit handling
    //----------------------------------------------------------------
    $rootScope.$on("alarm", function (event, args) {
        // FIXME: I should probably unregister this instead
        if (typeof $scope.monitors === undefined)
            return;
        //console.log ("***EVENT TRAP***");
        var alarmMonitors = args.message;
        for (var i=0; i< alarmMonitors.length; i++)
        {
            //console.log ("**** TRAPPED EVENT: "+alarmMonitors[i]);
            
            for (var j=0; j<$scope.monitors.length; j++)
            {
                if ($scope.monitors[j].Monitor.Id == alarmMonitors[i])
                {
                    $scope.monitors[j].Monitor.isAlarmed="true";
                    scheduleRemoveFlash(j);
                }
            }
            
        }
      
        
    });
    
    function scheduleRemoveFlash(id)
    {
        ZMDataModel.zmDebug ("Scheduled a 10 sec timer for dis-alarming monitor ID="+id);
        $timeout( function() {
            $scope.monitors[id].Monitor.isAlarmed = 'false';
            ZMDataModel.zmDebug ("dis-alarming monitor ID="+id);
        },zm.alarmFlashTimer);
    }

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
        console.log ("alarms:Cancelling timer");
        $interval.cancel($rootScope.intervalHandle);
        
        if (!$rootScope.isAlarm)
        {
            $rootScope.alarmCount="0";
            $ionicHistory.nextViewOptions({disableBack: true});		
            $state.go("events", {"id": 0}, { reload: true });
        }
    };
    
    
    //-------------------------------------------------------------
    // this is checked to make sure we are not pulling images
    // when app is in background. This is a problem with Android,
    // for example
    //-------------------------------------------------------------

    $scope.isBackground = function()
    {
        //console.log ("Is background called from Montage and returned " +    
        //ZMDataModel.isBackground());
        return ZMDataModel.isBackground();
    };

    //-------------------------------------------------------------
    // Called when user taps on the reorder button
    //-------------------------------------------------------------

    $scope.reorderList = function () {
        //console.log("REORDER");
        $scope.data.showDelete = false;
        $scope.data.showReorder = !$scope.data.showReorder;
    };

    $scope.deleteList = function () {
        //console.log("DELETE");
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
            
            loginData.montageOrder = montageOrder.toString();
            loginData.montageHiddenOrder = hiddenOrder.toString();
            ZMDataModel.setLogin(loginData);
            //window.localStorage.setItem("montageOrder", montageOrder.toString());
            //window.localStorage.setItem("montageHiddenOrder", hiddenOrder.toString());
            ZMDataModel.zmLog("Montage order saved on refresh: " + montageOrder.toString() + " and hidden order: " + hiddenOrder.toString());

        });
    };

    $scope.saveReorder = function () {
        loginData.montageOrder = montageOrder.toString();
        loginData.montageHiddenOrder = hiddenOrder.toString();
        ZMDataModel.setLogin(loginData);
        //window.localStorage.setItem("montageOrder", montageOrder.toString());
       // window.localStorage.setItem("montageHiddenOrder",
        //    hiddenOrder.toString());
       // console.log("Saved " + montageOrder.toString());
        ZMDataModel.zmLog("User press OK. Saved Monitor Order as: " +
            montageOrder.toString() +
            " and hidden order as " + hiddenOrder.toString());
        $scope.modal.remove();
        ZMDataModel.zmLog ("Reloading packery");
        $timeout (function(){pckry.reloadItems(); pckry.layout();},50);
    };

    $scope.cancelReorder = function () {
        // user tapped cancel
        var i, myhiddenorder;
        if (loginData.montageOrder == '') {
        //if (window.localStorage.getItem("montageOrder") == undefined) {
            for (i = 0; i < $scope.MontageMonitors.length; i++) {
                montageOrder[i] = i;
                hiddenOrder[i] = 0;
            }
           // console.log("Order string is " + montageOrder.toString());
            ZMDataModel.zmLog("User press Cancel. Reset Monitor Order to: " + montageOrder.toString());
        } else // montageOrder exists
        {
            var myorder = loginData.montageOrder;

            if (loginData.montageHiddenOrder=='') {
                for (i = 0; i < $scope.MontageMonitors.length; i++) {
                    hiddenOrder[i] = 0;
                }
            } else {
                myhiddenorder = loginData.montageHiddenOrder;
                hiddenOrder = myhiddenorder.split(",");
            }

          //  console.log("Montage order is " + myorder + " and hidden order is " + myhiddenorder);
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
       // console.log("DELETE: Order Array now is " + montageOrder.toString());
      //  console.log("DELETE: Hidden Array now is " + hiddenOrder.toString());
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
       // console.log("Hide Statusbar");
        ionic.Platform.fullScreen($scope.minimal, !$scope.minimal);
         console.log ("minimal switch:Cancelling timer");
        $interval.cancel($rootScope.intervalHandle); //we will renew on reload
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
       // console.log("dragging");
    };

    $scope.noop = function()
    {
        console.log ("Ignoring tap, drag on");
    };
    
    $scope.toggleSelectItem = function(ndx)
    {
       
         if ($scope.MontageMonitors[ndx].Monitor.selectStyle !== "undefined" && $scope.MontageMonitors[ndx].Monitor.selectStyle=="dragborder-selected")
         {
             $scope.MontageMonitors[ndx].Monitor.selectStyle="";
         }
         else
         {
             $scope.MontageMonitors[ndx].Monitor.selectStyle="dragborder-selected";
         }
        console.log ("Switched value to " + $scope.MontageMonitors[ndx].Monitor.selectStyle);
    };

    $scope.onDropComplete = function (index, obj, event) {
       // console.log("dragged");
        var otherObj = $scope.monitors[index];
        var otherIndex = $scope.monitors.indexOf(obj);
        $scope.monitors[index] = obj;
        $scope.monitors[otherIndex] = otherObj;
    };

    
    $scope.dragToggle = function()
    {
        var i;
        $scope.isDragabillyOn = !$scope.isDragabillyOn;
        ZMDataModel.zmDebug ("setting dragabilly to " + $scope.isDragabillyOn);
        if ($scope.isDragabillyOn)  
        {
            $scope.dragBorder="dragborder";
            ZMDataModel.zmDebug ("Enabling drag for " + draggies.length + " items");
            for (i=0; i < draggies.length; i++)
            {
                draggies[i].enable();
            }
            
           
        }
        else
        {
            $scope.dragBorder="";
            ZMDataModel.zmDebug ("Disabling drag for " + draggies.length + " items");
            for ( i=0; i < draggies.length; i++)
            {
                draggies[i].disable();
            }
            for (i=0; i < $scope.MontageMonitors.length; i++)
            {
                $scope.MontageMonitors[i].Monitor.selectStyle="";
            }
            
        }
    };
    

    //---------------------------------------------------------------------
    // main monitor modal open
    //---------------------------------------------------------------------
    $scope.openModal = function (mid, controllable, controlid, connKey) {
        ZMDataModel.zmDebug("MontageCtrl: Open Monitor Modal with monitor Id=" + mid + " and Controllable:" + controllable + " with control ID:" + controlid);
        // $scope.isModalActive = true;
        // Note: no need to setAwake(true) as its already awake
        // in montage view

        ZMDataModel.zmLog("Cancelling montage timer, opening Modal");
        // ZMDataModel.zmLog("Starting Modal timer");
         console.log ("openModal:Cancelling timer");
        $interval.cancel($rootScope.intervalHandle);

        // let's start modal timer
        //   modalIntervalHandle= $interval(function () {
        //    modalLoadNotifications();
        //  console.log ("Refreshing Image...");
        //  }.bind(this), 1000);

        $scope.monitorId = mid;
        $scope.monitorName = ZMDataModel.getMonitorName(mid);

        $scope.LoginData = ZMDataModel.getLogin();
        $rootScope.modalRand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
        $scope.ptzMoveCommand = "";
        $scope.ptzStopCommand = "";
        $scope.presetOn = false;
        $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();

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
                    $scope.ptzStopCommand = "moveStop";
                    //console.log("***moveCommand: " + $scope.ptzMoveCommand);
                
                
                // presets
                    ZMDataModel.zmDebug ("Preset value is " +data.control.Control.HasPresets);
                
                    if (data.control.Control.HasPresets == '1')
                    {
                        $scope.ptzPresetCount = parseInt(data.control.Control.NumPresets);
                         
                        ZMDataModel.zmDebug ("Number of presets is " + $scope.ptzPresetCount);
                        
                        $scope.ptzPresets = [];
                        for (var p=0; p<$scope.ptzPresetCount; p++)
                        {
                            $scope.ptzPresets.push ({name:(p+1).toString(), icon:'', cmd:"presetGoto"+(p+1).toString()});
                           // $scope.ptzPresets[p].name = "Arjun " + p;
                          //  console.log ("Name to " + $scope.ptzPresets[p].name);
                        }
                        
                        if (data.control.Control.HasHomePreset == '1')
                        {
                            $scope.ptzPresets.unshift({name:'', icon:"ion-ios-home", cmd:'presetHome'});
                            
                            $scope.ptzPresetCount++;
                        }
                        
                    }
                
                
                    ZMDataModel.zmLog("ControlDB reports PTZ command to be " + $scope.ptzMoveCommand);
                })
                .error(function (data) {
                  //  console.log("** Error retrieving move PTZ command");
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
          $timeout (function() {ZMDataModel.zmLog("MontageCtrl:Stopping network pull...");if (ZMDataModel.isForceNetworkStop())  ZMDataModel.stopNetwork();},50);

        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
        $scope.isModalActive = false;

        ZMDataModel.zmLog("Restarting montage timer, closing Modal...");
        var ld = ZMDataModel.getLogin();
         console.log ("closeModal: Cancelling timer");
        $interval.cancel($rootScope.intervalHandle);
        $rootScope.intervalHandle = $interval(function () {
            loadNotifications();
            //  console.log ("Refreshing Image...");
        }.bind(this), ld.refreshSec * 1000);
        //  }.bind(this), 60 * 1000);
        //$interval.cancel(modalIntervalHandle);



    };

    //---------------------------------------------------------------------
    // changes order of montage display
    //---------------------------------------------------------------------
    
    $scope.toggleMontageDisplayOrder = function()
    {
        $scope.packMontage = !$scope.packMontage;
        loginData.packMontage = $scope.packMontage;
        ZMDataModel.setLogin(loginData);
       // console.log ("Switching orientation");
    };

    //---------------------------------------------------------------------
    // allows you to resize individual montage windows
    //---------------------------------------------------------------------
    function scaleMontage() {
        var index = montageIndex;
        //console.log(" MONTAGE INDEX === " + montageIndex);
        //console.log("Scaling Monitor " + index);
        if ($scope.monitorSize[index] == 6)
            $scope.scaleDirection[index] = -1;

        if ($scope.monitorSize[index] == 1)
            $scope.scaleDirection[index] = 1;

        $scope.monitorSize[index] += $scope.scaleDirection[index];

       // console.log("Changed size to " + $scope.monitorSize[index]);

        var monsizestring = "";
        var i;
        for (i = 0; i < $scope.monitors.length; i++) {
            monsizestring = monsizestring + $scope.monitorSize[i] + ':';
        }
        monsizestring = monsizestring.slice(0, -1); // kill last :
        //console.log("Setting monsize string:" + monsizestring);
        loginData.montageArraySize = monsizestring;
        ZMDataModel.setLogin(loginData);
        //window.localStorage.setItem("montageArraySize", monsizestring);
    }

    //---------------------------------------------------------------------
    // if you long press on a montage window, it calls scale montage
    // at a 300 freq
    //---------------------------------------------------------------------
    $scope.onHold = function (index) {
        montageIndex = index;
        //isLongPressActive = true;
        scaleMontage();
       
        /*intervalHandleMontage = $interval(function () {
            scaleMontage();

        }.bind(this), zm.montageScaleFrequency);
        console.log("****Interval handle started **********" + zm.montageScaleFrequency);*/
    };

    //---------------------------------------------------------------------
    // stop scaling montage window on release
    //---------------------------------------------------------------------
    $scope.onRelease = function (index) {
      //  console.log("Press release on " + index);
        isLongPressActive = false;
         console.log ("onRelease:Cancelling timer");
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
        $interval.cancel($rootScope.intervalHandle);
        // $interval.cancel(modalIntervalHandle);

        // FIXME: Do I need to  setAwake(false) here?
    }


    function onResume() {
        
        /*FIXME: Do we need to resume timers? when you resume, you go to portal and then here
        
        if (!$scope.isModalActive) {
            var ld = ZMDataModel.getLogin();
            ZMDataModel.zmDebug("MontageCtrl: onresume called");
            ZMDataModel.zmLog("Restarting montage timer on resume");
            $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
            $interval.cancel($rootScope.intervalHandle);
            $rootScope.intervalHandle = $interval(function () {
                loadNotifications();
                //  console.log ("Refreshing Image...");
            }.bind(this), ld.refreshSec * 1000);
        } else // modal is active
        {
            // $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);
        }


*/

    }

    $scope.openMenu = function () {
        $timeout(function () {
            $rootScope.stateofSlide = $ionicSideMenuDelegate.isOpen();
        }, 500);

        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.$on('$destroy', function () {
      //  console.log("*** CANCELLING INTERVAL ****");
        // console.log ("destroy:Cancelling timer");
      //  $interval.cancel($rootScope.intervalHandle);
    });


    $scope.$on('$ionicView.loaded', function () {
      //  console.log("**VIEW ** Montage Ctrl Loaded");
    });

    $scope.$on('$ionicView.enter', function () {
       // console.log("**VIEW ** Montage Ctrl Entered, Starting loadNotifications");
        var ld = ZMDataModel.getLogin();
        //console.log("Setting Awake to " + ZMDataModel.getKeepAwake());
        ZMDataModel.setAwake(ZMDataModel.getKeepAwake());

        //console.log ("******************************************** STARTING TIMER ");
        $interval.cancel($rootScope.intervalHandle);
        $rootScope.intervalHandle = $interval(function () {
            loadNotifications();
            //  console.log ("Refreshing Image...");
        }.bind(this), ld.refreshSec * 1000);

        loadNotifications();
    });

    $scope.$on('$ionicView.leave', function () {
       // console.log("**VIEW ** Montage Ctrl Left, force removing modal");
        if ($scope.modal) $scope.modal.remove();
    });
    
    
     $scope.$on('$ionicView.afterEnter', function () {
        console.log("**VIEW ** Montage Ctrl AFTER ENTER");
        $timeout ( function () {initPackery(); },500);
        
    });
    
    
    $scope.$on('$ionicView.beforeLeave', function () {
       // console.log("**VIEW ** Montage Ctrl Left, force removing modal");
        
        console.log ("beforeLeave:Cancelling timer");
        $interval.cancel($rootScope.intervalHandle);
        pckry.destroy();
        
        
        // make sure this is applied in scope digest to stop network pull
        // thats why we are doing it beforeLeave
        
        if (ZMDataModel.isForceNetworkStop())
        {
            ZMDataModel.zmLog ("MontageCtrl:Stopping network pull...");
            ZMDataModel.stopNetwork();
            
        }
        
    });
    
    $scope.loadedImage = function()
    {
       // console.log ("IMAGE LOADED");
    };
    

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
       // console.log('Size has changed');
        ZMDataModel.setMontageSize(val);
       // console.log("ZMData Montage is " + ZMDataModel.getMontageSize() +
         //   " and slider montage is " + $scope.slider.monsize);
        // Now go ahead and reset sizes of entire monitor array
        var monsizestring = "";
        var i;
        for (i = 0; i < $scope.monitors.length; i++) {

            $scope.monitorSize[i] = parseInt(ZMDataModel.getMontageSize());
           // console.log("Resetting Monitor " + i + " size to " + $scope.monitorSize[i]);
            $scope.scaleDirection[i] = 1;
            monsizestring = monsizestring + $scope.monitorSize[i] + ':';
        }
        monsizestring = monsizestring.slice(0, -1); // kill last :
        //console.log("Setting monsize string:" + monsizestring);
        loginData.montageArraySize = monsizestring;
        ZMDataModel.setLogin(loginData);
        //window.localStorage.setItem("montageArraySize", monsizestring);
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
        if ($scope.slider.monsize > "10") $scope.slider.monsize = "10";
        processSliderChanged($scope.slider.monsize);

    };
    
    $scope.resetSizes = function()
    {
        for (var i=0; i< $scope.MontageMonitors.length; i++)
        {
            $scope.MontageMonitors[i].Monitor.gridScale="20";
        }
        $timeout (function(){pckry.layout();},50);
        $scope.slider.monsize = 2;
        
    };
    

    //---------------------------------------------------------
    // slider is tied to the view slider for montage
    //Remember not to use a variable. I'm using an object
    // so it's passed as a reference - otherwise it makes
    // a copy and the value never changes
    //---------------------------------------------------------

    $scope.sliderChanged = function () {
        
        if (oldSliderVal == $scope.slider.monsize) return;
        
        var dirn = (oldSliderVal > $scope.slider.monsize) ? -1:1;
         //pckry.destroy();
         //$scope.gridScale = "grid-item-" + ($scope.slider.monsize * 10).toString();
        
        
        
          for (var i=0; i< $scope.MontageMonitors.length; i++)
          {
              var curVal = parseInt($scope.MontageMonitors[i].Monitor.gridScale);
              curVal = curVal + (10 * dirn);
              if (curVal  < 20) curVal=20;
              if (curVal >100) curVal = 100;
              console.log ("For Index: " + i + " From: " + $scope.MontageMonitors[i].Monitor.gridScale + " To: " + curVal);
              
              if ($scope.isDragabillyOn)
              {
                // only do this for selected monitors
                if ($scope.MontageMonitors[i].Monitor.selectStyle=="dragborder-selected")
                {
                    
                    $scope.MontageMonitors[i].Monitor.gridScale= curVal;
                }
              }
              else
              {
                  $scope.MontageMonitors[i].Monitor.gridScale= curVal;
                  
              }
              oldSliderVal = $scope.slider.monsize;
          }
        
        
         //console.log("**** CSS IS " + $scope.gridScale);
         $timeout(function () {
             pckry.layout();
             pckry.getItemElements().forEach(function (itemElem) {
             
                console.log (itemElem.attributes['data-item-id'].value+" size  "+itemElem.attributes['data-item-size'].value );
                 
                     
            });
              var positions = pckry.getShiftPositions('data-item-id');
             console.log ("POSITIONS MAP " + JSON.stringify(positions));
             var ld = ZMDataModel.getLogin();
             ld.packeryPositions = JSON.stringify(positions);
             ZMDataModel.setLogin(ld);
          
         },50);
       // pckry.destroy();
     //   $timeout ( function () {initPackery(); },500);
          //pckry.reloadItems();
       // console.log ("calling layout");
        //  pckry.shiftLayout();
         /* pckry.once( 'layoutComplete', function() {
                console.log('layout done, just this one time');
          });*/
          //$timeout ( function () {initPackery(); },50);
        
      //  processSliderChanged($scope.slider.monsize);
        
        
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



       // console.log("***Pull to Refresh, recomputing Rand");
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