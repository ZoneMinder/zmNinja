angular.module('zmApp.controllers').controller('zmApp.MonitorCtrl', function ($scope, ZMDataModel, message,$ionicSideMenuDelegate) {

    $scope.monitors = [];

$scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  }

    console.log("***EVENTS: Waiting for Monitors to load before I proceed");

    $scope.monitors = message;
    // console.log("I GOT " + $scope.monitors);

    console.log("HERE");

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