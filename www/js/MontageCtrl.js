angular.module('zmApp.controllers').controller('zmApp.MontageCtrl', function ($scope, $rootScope, ZMDataModel, message,$ionicSideMenuDelegate) {
    
    
    $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  }

    //var monsize =3;
    console.log("********* Inside Montage Ctrl");
    $scope.LoginData = ZMDataModel.getLogin();
    $scope.slider = {};
    $scope.slider.monsize = ZMDataModel.getMontageSize();
    $scope.$on('$ionicView.afterEnter', function () {
        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
        //console.log("*********IN VIEW, generated " + $rootScope.rand);

        console.log("Rootscoxxpe Montage is " + ZMDataModel.getMontageSize() + " and slider montage is " + $scope.slider.monsize);
    });





    $scope.$watch('slider.monsize', function () {
        console.log('Slider has changed');
        ZMDataModel.setMontageSize($scope.slider.monsize);
        console.log("Rootscope Montage is " + ZMDataModel.getMontageSize() + " and slider montage is " + $scope.slider.monsize);
        //$rootScope.montageSize = $scope.slider.monsize;
    });

    $scope.monitors = [];
    console.log("Inside MontageCtrl waiting for monitors to load...");

    $scope.monitors = message;
    console.log("I have received the monitors inside Montage and there are " + $scope.monitors.length);
    // console.log("***CALLING FACTORY");
    //ZMHttpFactory.getMonitors().then(function(data) //{
    //                                  $scope.monitors = data;
    // console.log("I GOT " + $scope.monitors);
    //    });

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