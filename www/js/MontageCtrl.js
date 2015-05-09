// Controller for the montage view

angular.module('zmApp.controllers').controller('zmApp.MontageCtrl', function ($scope, $rootScope, ZMDataModel, message,$ionicSideMenuDelegate, $timeout, $interval) {
    
    var timestamp = new Date().getUTCMilliseconds();


// In Android, the app runs full steam while in background mode
// while in iOS it gets suspended unless you ask for specific resources
// So while this view, we DON'T want Android to keep sending 1 second
// refreshes to the server for images we are not seeing!

function onPause() {
 console.log ("*** Moving to Background ***");   // Handle the pause event
     console.log ("*** CANCELLING INTERVAL ****");
         $interval.cancel(intervalHandle);
}

    document.addEventListener("pause", onPause, false);

    // I was facing a lot of problems with Chrome/crosswalk getting stuck with
    // pending HTTP requests after a while. There is a problem with chrome handling
    // multiple streams of always open HTTP get's (image streaming). This problem
    // does not arise when the image is streamed for a single monitor - just multiple

    // To work around this I am taking a single snapshot of ZMS and have implemented a timer
    // to reload the snapshot every 1 second. Seems to work reliably even thought its a higer
    // load. Will it bonk with many monitors? Who knows. I have tried with 5 and 1280x960@32bpp


     this.loadNotifications = function (){
     // randomval is appended to img src, so after each interval the image reloads
      $scope.randomval = (new Date()).getTime();
      //console.log ("**** NOTIFICATION with rand="+$scope.randomval+"*****");
     };

    var intervalHandle = $interval(function(){
      this.loadNotifications();
   }.bind(this), 1000);

    this.loadNotifications();
    
    $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  }

     $scope.$on('$destroy', function () {
         console.log ("*** CANCELLING INTERVAL ****");
         $interval.cancel(intervalHandle);
     });


    $scope.$on('$ionicView.loaded', function(){
    console.log("**VIEW ** Montage Ctrl Loaded");
  });

    $scope.$on('$ionicView.enter', function(){
    console.log("**VIEW ** Montage Ctrl Entered");
  });

      $scope.$on('$ionicView.leave', function(){
    console.log("**VIEW ** Montage Ctrl Left");
  });

         $scope.$on('$ionicView.unloaded', function(){
    console.log("**VIEW ** Montage Ctrl Unloaded");
  });


    $scope.isSimulated = function ()
    {
        return ZMDataModel.isSimulated();
    }



    $scope.LoginData = ZMDataModel.getLogin();
    $scope.monLimit = $scope.LoginData.maxMontage;
    console.log("********* Inside Montage Ctrl, MAX LIMIT="+$scope.monLimit);

    // slider is tied to the view slider for montage
    //Remember not to use a variable. I'm using an object
    // so it's passed as a reference - otherwise it makes
    // a copy and the value never changes
    $scope.slider = {};
    $scope.slider.monsize = ZMDataModel.getMontageSize();
    $scope.$on('$ionicView.afterEnter', function () {
        // This rand is really used to reload the monitor image in img-src so it is not cached
        // I am making sure the image in montage view is always fresh
        // I don't think I am using this anymore FIXME: check and delete if needed
        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
    });

    // we are monitoring the slider for movement here
    // make sure this is an object - so its passed by reference from the template to the controller!
    $scope.$watch('slider.monsize', function () {
        console.log('Slider has changed');
        ZMDataModel.setMontageSize($scope.slider.monsize);
        console.log("Rootscope Montage is " + ZMDataModel.getMontageSize() + " and slider montage is " + $scope.slider.monsize);

    });

    $scope.monitors = [];
    console.log("Inside MontageCtrl waiting for monitors to load...");

    $scope.monitors = message;
    console.log("I have received the monitors inside Montage and there are " + $scope.monitors.length);

    $scope.doRefresh = function () {
        console.log("***Pull to Refresh");
        $scope.monitors = [];

        var refresh = ZMDataModel.getMonitors(1);
        refresh.then(function (data) {
            $scope.monitors = data;
            $scope.$broadcast('scroll.refreshComplete');
        });

    };
});
