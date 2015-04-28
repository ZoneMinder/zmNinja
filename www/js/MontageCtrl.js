// Controller for the montage view

angular.module('zmApp.controllers').controller('zmApp.MontageCtrl', function ($scope, $rootScope, ZMDataModel, message,$ionicSideMenuDelegate) {
    
    
    $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  }


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



    $scope.getMontageImagePath = function ()
    {
        return ZMDataModel.getMontageImagePath();
    }

    $scope.isSimulated = function ()
    {
        return ZMDataModel.isSimulated();
    }


    //var monsize =3;
    console.log("********* Inside Montage Ctrl");
    $scope.LoginData = ZMDataModel.getLogin();

    // slider is tied to the view slider for montage
    //Remember not to use a variable. I'm using an object
    // so it's passed as a reference - otherwise it makes
    // a copy and the value never changes
    $scope.slider = {};
    $scope.slider.monsize = ZMDataModel.getMontageSize();
    $scope.$on('$ionicView.afterEnter', function () {
        // This rand is really used to reload the monitor image in img-src so it is not cached
        // I am making sure the image in montage view is always fresh
        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
        console.log("Rootscoxxpe Montage is " + ZMDataModel.getMontageSize() + " and slider montage is " + $scope.slider.monsize);
    });


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
