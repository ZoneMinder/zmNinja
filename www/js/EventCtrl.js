// This is the controller for Event view. StateParams is if I recall the monitor ID.
// This was before I got access to the new APIs. FIXME: Revisit this code to see what I am doing with it
// and whether the new API has a better mechanism

angular.module('zmApp.controllers').controller('zmApp.EventCtrl', function ($ionicPlatform, $scope, $stateParams, message, ZMDataModel,$ionicSideMenuDelegate) {
    console.log("I got STATE PARAM " + $stateParams.id);
    $scope.id = parseInt($stateParams.id,10);

$scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  }

    console.log("***CALLING EVENTS FACTORY");
    var lData = ZMDataModel.getLogin();
    console.log("ZM Service Username = " + lData.username);
    $scope.monitors = message;
    $scope.events = ZMDataModel.getEvents($scope.id)
        .then(function (data) {
            console.log("EventCtrl Got events");
            //var events = [];
            var myevents = data;
            for (var i = 0; i < myevents.length; i++) {

                myevents[i].Event.MonitorName = ZMDataModel.getMonitorName(myevents[i].Event.MonitorId);
            }


            $scope.events = myevents;
        });



    $scope.doRefresh = function () {
        console.log("***Pull to Refresh");
        $scope.events = [];
        $scope.events = ZMDataModel.getEvents($scope.id)
            .then(function (data) {
                console.log("EventCtrl Got events");
                //var events = [];
                var myevents = data;
                for (var i = 0; i < myevents.length; i++) {

                    myevents[i].Event.MonitorName = ZMDataModel.getMonitorName(myevents[i].Event.MonitorId);
                }


                $scope.events = myevents;
                $scope.$broadcast('scroll.refreshComplete');
            });
    }; //dorefresh

});
