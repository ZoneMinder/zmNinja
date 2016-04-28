// Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,ionic,Packery, Draggabilly, imagesLoaded */


angular.module('zmApp.controllers').controller('zmApp.MontageCtrl', ['$scope', '$rootScope', 'ZMDataModel', 'message', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$ionicPopup', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$ionicPlatform', 'zm', '$ionicPopover', '$controller', 'imageLoadingDataShare', '$window',  '$localstorage', function ($scope, $rootScope, ZMDataModel, message, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $ionicPopup, $stateParams, $ionicHistory, $ionicScrollDelegate, $ionicPlatform, zm, $ionicPopover, $controller, imageLoadingDataShare, $window, $localstorage) {

   /* $controller('zmApp.BaseController', {
        $scope: $scope
    });*/
    //---------------------------------------------------------------------
    // Controller main
    //---------------------------------------------------------------------

    
    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);
    
    var isLongPressActive = false;
    $scope.isReorder = false;
    var intervalHandleMontage; // will hold image resize timer on long press
   
    
    var gridcontainer;
    var pckry, draggie;
    var draggies;
    $scope.isDragabillyOn = false;
    
    $scope.gridScale = "grid-item-30";
    
    var loginData = ZMDataModel.getLogin();
    $scope.LoginData = ZMDataModel.getLogin();
    $scope.monLimit = $scope.LoginData.maxMontage;
    
    // in edit mode, this is called to add or remove a monitor
    
    
    $scope.monitors = message;
    $scope.MontageMonitors = angular.copy(message);
    $scope.sliderChanging = false;
    
    if ($scope.MontageMonitors.length == 0)
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

    
    ZMDataModel.zmLog("Inside Montage Ctrl:We found " + $scope.monitors.length + " monitors");

    // set them all at 30% for packery
    for (var i=0; i < $scope.MontageMonitors.length; i++)
    {
        $scope.MontageMonitors[i].Monitor.gridScale="30";
        $scope.MontageMonitors[i].Monitor.selectStyle="";
        
    }
    

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
    $rootScope.intervalHandle="";
    $scope.isModalActive = false;
    var modalIntervalHandle;


    $ionicSideMenuDelegate.canDragContent($scope.minimal? true: true);

    
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

    $scope.toggleHide = function(mon)
    {
        
         //pckry.getItemElements().forEach(function (itemElem) {itemElem.hide();
         //});
    //pckry.hide();
        if (mon.Monitor.listDisplay == 'noshow')
            mon.Monitor.listDisplay = 'show';
        else
            mon.Monitor.listDisplay = 'noshow';
        
        /*$timeout(function () {
             
               pckry.once( 'layoutComplete', function() {
                    var positions = pckry.getShiftPositions('data-item-id');
                    console.log ("POSITIONS MAP " + JSON.stringify(positions));
                    var ld = ZMDataModel.getLogin();
                    ld.packeryPositions = JSON.stringify(positions);
                    ZMDataModel.setLogin(ld);
                   $ionicLoading.hide();
                   $scope.sliderChanging = false;
                });
                
                layout(pckry);
        },100);*/
        
        
    };
    
    

// called by afterEnter to load Packery
function initPackery()
{
        
        
        $ionicLoading.show({
                    template: "arranging images...",
                    noBackdrop: true,
                    duration: zm.loadingTimeout
                });
    
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
    
    
    var cnt=0;
    $scope.MontageMonitors.forEach(function(elem) 
        { 
            if ((elem.Monitor.Enabled!='0') && (elem.Monitor.Function!='None') )
                cnt++;
        });
    
    ZMDataModel.zmLog ("Monitors that are active and not DOM hidden: " + cnt + " while grid has " + positions.length);
    
    if (cnt > ZMDataModel.getLogin().maxMontage )
    {
        cnt = ZMDataModel.getLogin().maxMontage;
        ZMDataModel.zmLog ("restricting monitor count to " + cnt + " due to max-montage setting");
    }
    
    if (cnt!= positions.length)
    {
       
        ZMDataModel.zmLog ("Whoops!! Monitors have changed. I'm resetting layouts, sorry!");
        layouttype = true;
        positions = {};
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
         
        imagesLoaded(elem).on('progress', function(instance, img) {
                //console.log ("******** SOME IMAGE LOADED");
                //console.log ("IMAGE PROGRESS " + JSON.stringify(img) );
                progressCalled = true;
                
                if (layouttype) $timeout (function(){layout(pckry);},100);
        });
        
        imagesLoaded(elem).on('always', function() {
                //console.log ("******** ALL IMAGES LOADED");
                ZMDataModel.zmDebug ("All images loaded");
            
                
                $ionicLoading.hide();
                
                
                if (!progressCalled)    
                {
                    ZMDataModel.zmLog ("*** BUG PROGRESS WAS NOT CALLED");
                    pckry.reloadItems();
                    
                }
            
                 pckry.getItemElements().forEach(function (itemElem) {
                      draggie = new Draggabilly(itemElem);
                      pckry.bindDraggabillyEvents(draggie);
                      draggies.push(draggie);
                      draggie.disable();
                      draggie.unbindHandles();
                });
                
                pckry.on( 'dragItemPositioned', itemDragged );
            
                
               
                if (!isEmpty(positions))
                {
                    ZMDataModel.zmLog ("Arranging as per packery grid");
                    
                    for (var i =0; i< $scope.MontageMonitors.length; i++)
                    {
                        for (var j=0; j < positions.length; j++)
                        {
                            if ($scope.MontageMonitors[i].Monitor.Id == positions[j].attr)
                            {
                                $scope.MontageMonitors[i].Monitor.gridScale = positions[j].size;
                                $scope.MontageMonitors[i].Monitor.listDisplay = positions[j].display;
                                ZMDataModel.zmDebug ("Setting monitor ID: " + $scope.MontageMonitors[i].Monitor.Id + " to size: " +positions[j].size + " and display:" + positions[j].display);
                            }
                            //console.log ("Index:"+positions[j].attr+ " with size: " + positions[j].size);
                        }
                    }
                    
                    
                    $timeout(function(){ZMDataModel.zmDebug ("All images loaded, doing image layout");pckry.initShiftLayout(positions, 'data-item-id'); },100);
                }
                $timeout(function(){ZMDataModel.zmLog ("Force calling resize"); pckry.onresize();},300);// don't ask
                    
                   
                   
                
               
        });
    
        function itemDragged(item)
        {
            ZMDataModel.zmDebug ("drag complete");
            
            pckry.getItemElements().forEach(function (itemElem) {
             
                console.log (itemElem.attributes['data-item-id'].value+" size  "+itemElem.attributes['data-item-size'].value );
            });
            
            var positions = pckry.getShiftPositions('data-item-id');
             //console.log ("POSITIONS MAP " + JSON.stringify(positions));
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
    
    function loadNotifications() {

        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);

        //console.log ("Inside Montage timer...");

    }

    $scope.cancelReorder = function()
    {
         $scope.modal.remove();
    };
    
    $scope.saveReorder = function()
    {
        ZMDataModel.zmDebug ("Saving monitor hide/unhide and sizes");
        $scope.MontageMonitors = $scope.copyMontage;
        $scope.modal.remove();
        $timeout( function() {pckry.reloadItems();},400);
        $timeout( function() {
            
            draggies.forEach(function (drag) {
                drag.destroy();
            });
            
            draggies = [];
            
            pckry.once( 'layoutComplete', function() {
                console.log('Saving packery order now, layout rendered');
                $timeout(function() {var positions = pckry.getShiftPositions('data-item-id');
             ZMDataModel.zmDebug ("POSITIONS MAP " + JSON.stringify(positions));
             var ld = ZMDataModel.getLogin();
             ld.packeryPositions = JSON.stringify(positions);
             ZMDataModel.setLogin(ld);});
            });
            
            pckry.getItemElements().forEach(function (itemElem) {
                      draggie = new Draggabilly(itemElem);
                      pckry.bindDraggabillyEvents(draggie);
                      draggies.push(draggie);
                      draggie.disable();
                });
            pckry.layout();
            
        },800);
        
        
        
    };

    $scope.toggleDelete = function (i)
    {
        
        if ($scope.copyMontage[i].Monitor.listDisplay == 'show')
            $scope.copyMontage[i].Monitor.listDisplay = 'noshow';
        else
            $scope.copyMontage[i].Monitor.listDisplay = 'show';
            
        ZMDataModel.zmDebug ("index " + i + " is now " +  $scope.copyMontage[i].Monitor.listDisplay);
    };
    
    $scope.hideUnhide = function()
    {
        if ($scope.isDragabillyOn)
        {
         dragToggle();   
        }
        $scope.copyMontage = angular.copy ($scope.MontageMonitors);
        $ionicModal.fromTemplateUrl('templates/reorder-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            })
            .then(function (modal) {
                $scope.modal = modal;
                $scope.modal.show();
            });
    };
    
   /* $scope.swipeUp = function()
    {
        //console.log ("SWIPE UP");
        $ionicScrollDelegate.$getByHandle("montage-delegate").scrollBy(0, $rootScope.devHeight/2, true);
    };
    
    $scope.swipeDown = function()
    {
        //console.log ("SWIPE DOWN");
        $ionicScrollDelegate.$getByHandle("montage-delegate").scrollBy(0, -($rootScope.devHeight/2), true);
    };*/
    
    
    

    $scope.closeReorderModal = function () {
      
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
            
            for (var j=0; j<$scope.MontageMonitors.length; j++)
            {
                if ($scope.MontageMonitors[j].Monitor.Id == alarmMonitors[i])
                {
                    ZMDataModel.zmDebug ("Enabling alarm for Monitor:"+$scope.monitors[j].Monitor.Id );
                    $scope.MontageMonitors[j].Monitor.isAlarmed=true;
                    scheduleRemoveFlash(j);
                }
            }
            
        }
      
        
    });
    
    function scheduleRemoveFlash(id)
    {
        ZMDataModel.zmDebug ("Scheduled a "+zm.alarmFlashTimer+"ms timer for dis-alarming monitor ID:"+$scope.MontageMonitors[id].Monitor.Id);
        $timeout( function() {
            $scope.MontageMonitors[id].Monitor.isAlarmed = false;
            ZMDataModel.zmDebug ("dis-alarming monitor ID:"+$scope.MontageMonitors[id].Monitor.Id);
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

    //---------------------------------------------------------------------
    // Called when you enable/disable dragging
    //---------------------------------------------------------------------
   
    $scope.dragToggle = function()
    {
        dragToggle();
        
        
    };
    
    function dragToggle()
    {
        var i;
        $scope.isDragabillyOn = !$scope.isDragabillyOn;
        
        $ionicSideMenuDelegate.canDragContent($scope.isDragabillyOn? false: true);
        
        //$timeout(function(){pckry.reloadItems();},10);
        ZMDataModel.zmDebug ("setting dragabilly to " + $scope.isDragabillyOn);
        if ($scope.isDragabillyOn)  
        {
            $scope.dragBorder="dragborder";
            ZMDataModel.zmDebug ("Enabling drag for " + draggies.length + " items");
            for (i=0; i < draggies.length; i++)
            {
                draggies[i].enable();
                draggies[i].bindHandles();
            }
            
           // reflow and reload as some may be hidden
            //  $timeout(function(){pckry.reloadItems();$timeout(function(){pckry.layout();},300);},100);
        }
        else
        {
            $scope.dragBorder="";
            ZMDataModel.zmDebug ("Disabling drag for " + draggies.length + " items");
            for ( i=0; i < draggies.length; i++)
            {
                draggies[i].disable();
                draggies[i].unbindHandles();
            }
            for (i=0; i < $scope.MontageMonitors.length; i++)
            {
                $scope.MontageMonitors[i].Monitor.selectStyle="";
            }
            // reflow and reload as some may be hidden
            $timeout(function(){$timeout(function(){ var positions = pckry.getShiftPositions('data-item-id');
             console.log ("POSITIONS MAP " + JSON.stringify(positions));
             var ld = ZMDataModel.getLogin();
             ld.packeryPositions = JSON.stringify(positions);
             ZMDataModel.setLogin(ld);},300);},100);
            
        }
    }
    
    $scope.getW = function(monitor)
    {
        var w,h;
        if (monitor.Monitor.Orientation == '0')
                w = monitor.Monitor.Width;
        else 
                w = monitor.Monitor.Height;
        
         if (monitor.Monitor.Orientation == '0')
                h = monitor.Monitor.Height;
        else 
                h = monitor.Monitor.Width;
        return (getScale (w,h, $rootScope.devWidth, $rootScope.devHeight).w);
        
    };
    
    $scope.getH= function(monitor)
    {
        var w,h;
        if (monitor.Monitor.Orientation == '0')
                w = monitor.Monitor.Width;
        else 
                w = monitor.Monitor.Height;
        
         if (monitor.Monitor.Orientation == '0')
                h = monitor.Monitor.Height;
        else 
                h = monitor.Monitor.Width;
        return (getScale (w,h, $rootScope.devWidth, $rootScope.devHeight).h);
        
    };
    
    
   function getScale(ow,oh,bw,bh)
    {
        
        var  original_width = ow;
        var  original_height = oh;
        var  bound_width = bw;
        var bound_height = bh;
        var new_width = original_width;
        var  new_height = original_height;
        if (original_width > bound_width) {
        //scale width to fit
        new_width = bound_width;
        //scale height to maintain aspect ratio
        new_height = (new_width * original_height) / original_width;
    }

    // then check if we need to scale even with the new height
        if (new_height > bound_height) {
            //scale height to fit instead
            new_height = bound_height;
            //scale width to maintain aspect ratio
            new_width = (new_height * original_width) / original_height;
        }
        return ({w:Math.round(new_width), h:Math.round(new_height)});

    }

    //---------------------------------------------------------------------
    // main monitor modal open - if drag is not on, this is called on touch
    //---------------------------------------------------------------------
    $scope.openModal = function (mid, controllable, controlid, connKey, monitor) {
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

        $scope.showPTZ = false;
        $scope.monitorId = mid;
        $scope.monitorName = ZMDataModel.getMonitorName(mid);
        $scope.controlid = controlid;

        $scope.LoginData = ZMDataModel.getLogin();
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
        ZMDataModel.setAwake(ZMDataModel.getKeepAwake());

        

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
      
        //$scope.areImagesLoading = true;
        var ld = ZMDataModel.getLogin();
        //console.log("Setting Awake to " + ZMDataModel.getKeepAwake());
        ZMDataModel.setAwake(ZMDataModel.getKeepAwake());

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
          window.addEventListener("resize", orientationChanged, false);
        $timeout ( function () {initPackery(); },500);
        
    });
    
    function orientationChanged()
    {
        ZMDataModel.zmDebug ("Detected orientation change, redoing packery resize");
        $timeout(function(){pckry.onresize();});
    }
    
    
    $scope.$on('$ionicView.beforeLeave', function () {
       // console.log("**VIEW ** Montage Ctrl Left, force removing modal");
        
        console.log ("beforeLeave:Cancelling timer");
        $interval.cancel($rootScope.intervalHandle);
        pckry.destroy();
         window.removeEventListener("resize", orientationChanged, false);
        
        
        // make sure this is applied in scope digest to stop network pull
        // thats why we are doing it beforeLeave
        
        if (ZMDataModel.isForceNetworkStop())
        {
            ZMDataModel.zmLog ("MontageCtrl:Stopping network pull...");
            ZMDataModel.stopNetwork();
            
        }
        
    });
    
   

    $scope.$on('$ionicView.unloaded', function () {
      
    });

   
    $scope.resetSizes = function()
    {
        var somethingReset = false;
        for (var i=0; i< $scope.MontageMonitors.length; i++)
        {
            if ($scope.isDragabillyOn)
            {
             if ($scope.MontageMonitors[i].Monitor.selectStyle=="dragborder-selected")
             {
                $scope.MontageMonitors[i].Monitor.gridScale="30"; 
                 somethingReset = true;
             }
            }
            else
            {
                $scope.MontageMonitors[i].Monitor.gridScale="30";
               // somethingReset = true;
            }
        }
        if (!somethingReset && $scope.isDragabillyOn) // nothing was selected
        {
            for (i=0; i< $scope.MontageMonitors.length; i++){$scope.MontageMonitors[i].Monitor.gridScale="30";}
        }
        
        $timeout (function()
            {
                pckry.reloadItems();
                
                pckry.once( 'layoutComplete', function() {
                    console.log ("Layout complete");
                    var positions = pckry.getShiftPositions('data-item-id');
                    console.log ("POSITIONS MAP " + JSON.stringify(positions));
                    var ld = ZMDataModel.getLogin();
                    ld.packeryPositions = JSON.stringify(positions);
                    ZMDataModel.setLogin(ld);
                   // $scope.slider.monsize = 2;
                });
                //layout(pckry);
                $timeout (function(){pckry.layout();}); // force here - no shiftlayout
               
               
            },100);
 
    };
    
    
    function layout(pckry)
    {
        pckry.shiftLayout();
    }

    //---------------------------------------------------------
    // slider is tied to the view slider for montage
    //Remember not to use a variable. I'm using an object
    // so it's passed as a reference - otherwise it makes
    // a copy and the value never changes
    //---------------------------------------------------------

    $scope.sliderChanged = function (dirn) {
        
        if ($scope.sliderChanging)
        {
           // console.log ("too fast my friend");
            //$scope.slider.monsize = oldSliderVal;
           // return;
        }
        
        $scope.sliderChanging = true;
        
          var somethingReset = false;
          for (var i=0; i< $scope.MontageMonitors.length; i++)
          {

              var curVal = parseInt($scope.MontageMonitors[i].Monitor.gridScale);
              curVal = curVal + (10 * dirn);
              if (curVal  < 20) curVal=20;
              if (curVal >100) curVal = 100;
              //console.log ("For Index: " + i + " From: " + $scope.MontageMonitors[i].Monitor.gridScale + " To: " + curVal);
              
              if ($scope.isDragabillyOn)
              {
                // only do this for selected monitors
                if ($scope.MontageMonitors[i].Monitor.selectStyle=="dragborder-selected")
                {
                    
                    $scope.MontageMonitors[i].Monitor.gridScale= curVal;
                    somethingReset = true;
                }
              }
              else
              {
                  $scope.MontageMonitors[i].Monitor.gridScale= curVal;
                  //somethingReset = true;
                  
              }
        
          }
          if (!somethingReset && $scope.isDragabillyOn) // nothing was selected
            {
                for (i=0; i< $scope.MontageMonitors.length; i++)
                {
                    var cv = parseInt($scope.MontageMonitors[i].Monitor.gridScale);
                    cv = cv + (10 * dirn);
                    if (cv  < 20) cv=20;
                    if (cv >100) cv = 100;
                    $scope.MontageMonitors[i].Monitor.gridScale= cv;
                }
            }
        
        
     
         $timeout(function () {
             
               pckry.once( 'layoutComplete', function() {
                    var positions = pckry.getShiftPositions('data-item-id');
                    console.log ("POSITIONS MAP " + JSON.stringify(positions));
                    var ld = ZMDataModel.getLogin();
                    ld.packeryPositions = JSON.stringify(positions);
                    ZMDataModel.setLogin(ld);
                   $ionicLoading.hide();
                   $scope.sliderChanging = false;
                });
                if (!somethingReset) 
                    pckry.layout();
                else
                    layout(pckry);
        },100);
      
        
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