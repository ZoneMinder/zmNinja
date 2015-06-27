// Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,ionic */


angular.module('zmApp.controllers').controller('zmApp.MontageCtrl', ['$scope', '$rootScope', 'ZMDataModel', 'message', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams','$ionicHistory','$ionicScrollDelegate', '$ionicPlatform', function ($scope, $rootScope, ZMDataModel, message, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http,$state, $stateParams, $ionicHistory,$ionicScrollDelegate) {

    //---------------------------------------------------------------------
    // Controller main
    //---------------------------------------------------------------------

    document.addEventListener("pause", onPause, false);



    var timestamp = new Date().getUTCMilliseconds();
    $scope.minimal = $stateParams.minimal;
    $scope.isRefresh = $stateParams.isRefresh;

    var isLongPressActive = false;
    var intervalHandleMontage; // will hold image resize timer on long press
    var montageIndex = 0; // will hold monitor ID to scale in timer

    $scope.monitorSize = []; // array with montage sizes per monitor
    $scope.scaleDirection = []; // 1 = increase -1 = decrease

    $scope.slider = {};
    $scope.slider.monsize = ZMDataModel.getMontageSize();

    console.log ("********  HAVE ALL MONITORS");
    $scope.monitors = message;


    // Do we have a saved montage array size? No?
    if (window.localStorage.getItem("montageArraySize") == undefined)
    {

        for ( var i = 0; i<$scope.monitors.length; i++)
        {
            $scope.monitorSize.push(ZMDataModel.getMontageSize() );
           $scope.scaleDirection.push(1);
        }
    }
    else // recover previous settings
    {
        var msize = window.localStorage.getItem("montageArraySize");
        console.log ("MontageArrayString is=>"+msize);
        $scope.monitorSize= msize.split(":");
        var j;

        for (  j = 0; j<$scope.monitorSize.length; j++)
        {
            // convert to number other wise adding to it concatenates :-)
            $scope.monitorSize[j] = parseInt($scope.monitorSize[j]);
            $scope.scaleDirection.push(1);
            console.log ("Montage size for monitor " + j + " is " + $scope.monitorSize[j]);

        }

    }
    console.log ("********  SETTING VARS");
   // $scope.monitorSize = monitorSize;
   // $scope.scaleDirection = scaleDirection;

    $scope.LoginData = ZMDataModel.getLogin();
    $scope.monLimit = $scope.LoginData.maxMontage;
    console.log("********* Inside Montage Ctrl, MAX LIMIT=" + $scope.monLimit);


     // I was facing a lot of problems with Chrome/crosswalk getting stuck with
    // pending HTTP requests after a while. There is a problem with chrome handling
    // multiple streams of always open HTTP get's (image streaming). This problem
    // does not arise when the image is streamed for a single monitor - just multiple

    // To work around this I am taking a single snapshot of ZMS and have implemented a timer
    // to reload the snapshot every 1 second. Seems to work reliably even thought its a higer
    // load. Will it bonk with many monitors? Who knows. I have tried with 5 and 1280x960@32bpp


    this.loadNotifications = function () {
        // randomval is appended to img src, so after each interval the image reloads
        $scope.randomval = (new Date()).getTime();
        //console.log ("**** NOTIFICATION with rand="+$scope.randomval+"*****");
    };

    var intervalHandle = $interval(function () {
        this.loadNotifications();
       //  console.log ("Refreshing Image...");
    }.bind(this), 1000);

    this.loadNotifications();



    //---------------------------------------------------------------------
    // Triggered when you enter/exit full screen
    //---------------------------------------------------------------------
    $scope.switchMinimal = function()
    {
        $scope.minimal = !$scope.minimal;
        console.log ("Hide Statusbar");
        ionic.Platform.fullScreen($scope.minimal,!$scope.minimal);
         $interval.cancel(intervalHandle); //we will renew on reload
        // We are reloading this view, so we don't want entry animations
        $ionicHistory.nextViewOptions({
              disableAnimate: true,
              disableBack: true
            });
      $state.go("montage", {minimal: $scope.minimal,
                            isRefresh:true});
     };

    //---------------------------------------------------------------------
    // Show/Hide PTZ control in monitor view
    //---------------------------------------------------------------------
      $scope.togglePTZ = function () {
        $scope.showPTZ = !$scope.showPTZ;
    };

    //---------------------------------------------------------------------
    // main monitor modal open
    //---------------------------------------------------------------------
     $scope.openModal = function (mid, controllable, controlid) {
        console.log("Open Monitor Modal with monitor Id=" + mid + " and Controllable:" + controllable + " with control ID:"+controlid);

        // Note: no need to setAwake(true) as its already awake
        // in montage view
        $scope.monitorId = mid;
        $scope.LoginData = ZMDataModel.getLogin();
        $scope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
         $scope.ptzMoveCommand = "";

        // This is a modal to show the monitor footage
        // We need to switch to always awake if set so the feed doesn't get interrupted
        ZMDataModel.setAwake(ZMDataModel.getKeepAwake());

         // if its controllable, lets get the control command
        if (controllable == '1')
        {
            var apiurl = $scope.LoginData.apiurl;
            var myurl = apiurl+"/controls/"+controlid+".json";
            console.log ("getting control details:"+myurl);

            $http.get(myurl)
            .success(function(data) {
                $scope.ptzMoveCommand = (data.control.Control.CanMoveCon == '1')? 'moveCon':'move';
                console.log("***moveCommand: " +$scope.ptzMoveCommand );
                ZMDataModel.zmLog ("ControlDB reports PTZ command to be " + $scope.ptzMoveCommand );
            })
            .error(function(data) {
                console.log ("** Error retrieving move PTZ command");
                ZMDataModel.zmLog ("Error retrieving PTZ command  " + JSON.stringify(data),"error");
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
                    duration: 15000
                });
            $scope.isControllable = controllable;
                $scope.showPTZ = false;
                $scope.modal.show();
            });

    };

    //---------------------------------------------------------------------
    //
    //---------------------------------------------------------------------

    $scope.closeModal = function () {
        console.log("Close & Destroy Monitor Modal");
        // Note: no need to setAwake(false) as needs to be awake
        // in montage view
        $scope.modal.remove();

    };

    //---------------------------------------------------------------------
    // allows you to resize individual montage windows
    //---------------------------------------------------------------------
    function scaleMontage()
    {
        var index = montageIndex;
        console.log (" MONTAGE INDEX === " + montageIndex);
        console.log ("Scaling Monitor " + index);
       if ($scope.monitorSize[index] == 6)
            $scope.scaleDirection[index] = -1;

        if ($scope.monitorSize[index] == 1)
            $scope.scaleDirection[index] = 1;

        $scope.monitorSize[index] += $scope.scaleDirection[index] ;

        console.log ("Changed size to "+$scope.monitorSize[index]);

        var monsizestring = "";
        var i;
        for ( i = 0; i<$scope.monitors.length; i++)
        {
            monsizestring = monsizestring + $scope.monitorSize[i]+':';
        }
        monsizestring = monsizestring.slice(0,-1); // kill last :
        console.log ("Setting monsize string:"+monsizestring);
        window.localStorage.setItem("montageArraySize", monsizestring);
    }

    //---------------------------------------------------------------------
    // if you long press on a montage window, it calls scale montage
    // at a 200ms freq
    //---------------------------------------------------------------------
    $scope.onHold = function (index)
    {
        montageIndex = index;
        isLongPressActive = true;
            intervalHandleMontage = $interval(function () {
            scaleMontage();

        }.bind(this), 200);

    };

    //---------------------------------------------------------------------
    // stop scaling montage window on release
    //---------------------------------------------------------------------
    $scope.onRelease = function (index)
    {
        console.log ("Press release on " + index);
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
        console.log("*** Moving to Background ***"); // Handle the pause event
        console.log("*** CANCELLING INTERVAL ****");
        $interval.cancel(intervalHandle);
        // FIXME: Do I need to  setAwake(false) here?
    }



    $scope.openMenu = function () {
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
        console.log("**VIEW ** Montage Ctrl Entered");
        console.log ("Setting Awake to "+ZMDataModel.getKeepAwake());
        ZMDataModel.setAwake(ZMDataModel.getKeepAwake());
    });

    $scope.$on('$ionicView.leave', function () {
        console.log("**VIEW ** Montage Ctrl Left");
    });

    $scope.$on('$ionicView.unloaded', function () {
        console.log("**VIEW ** Montage Ctrl Unloaded");
    });

    //---------------------------------------------------------
    // slider is tied to the view slider for montage
    //Remember not to use a variable. I'm using an object
    // so it's passed as a reference - otherwise it makes
    // a copy and the value never changes
    //---------------------------------------------------------

    $scope.sliderChanged = function ()
    {
       console.log('Slider has changed');
        ZMDataModel.setMontageSize($scope.slider.monsize);
        console.log("Rootscope Montage is " + ZMDataModel.getMontageSize() +
                    " and slider montage is " + $scope.slider.monsize);
        // Now go ahead and reset sizes of entire monitor array
        var monsizestring="";
        var i;
        for ( i = 0; i<$scope.monitors.length; i++)
        {

            $scope.monitorSize[i] = parseInt(ZMDataModel.getMontageSize());
            console.log ("Resetting Monitor "+i+" size to " +$scope.monitorSize[i]);
            $scope.scaleDirection[i] = 1;
            monsizestring = monsizestring + $scope.monitorSize[i]+':';
        }
        monsizestring = monsizestring.slice(0,-1); // kill last :
        console.log ("Setting monsize string:"+monsizestring);
        window.localStorage.setItem("montageArraySize", monsizestring);

    };

    $scope.$on('$ionicView.afterEnter', function () {
        // This rand is really used to reload the monitor image in img-src so it is not cached
        // I am making sure the image in montage view is always fresh
        // I don't think I am using this anymore FIXME: check and delete if needed
        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
    });




    $scope.doRefresh = function () {
        console.log("***Pull to Refresh");
        $scope.monitors = [];

        var refresh = ZMDataModel.getMonitors(1);
        refresh.then(function (data) {
            $scope.monitors = data;
            $scope.$broadcast('scroll.refreshComplete');
        });

    };


}]);
