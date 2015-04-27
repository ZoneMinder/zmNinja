// This is the controller for Event view. StateParams is if I recall the monitor ID.
// This was before I got access to the new APIs. FIXME: Revisit this code to see what I am doing with it
// and whether the new API has a better mechanism

angular.module('zmApp.controllers').controller('zmApp.EventCtrl', function ($ionicPlatform, $scope, $stateParams, message, ZMDataModel,$ionicSideMenuDelegate, $ionicModal) {
    console.log("I got STATE PARAM " + $stateParams.id);
    $scope.id = parseInt($stateParams.id,10);

$scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  }

// This is a modal to show the event footage
$ionicModal.fromTemplateUrl('templates/events-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  })
    .then(function(modal) {
    $scope.modal = modal;

  });


$scope.openModal = function(eid,ename,edur) {
      console.log ("Open Modal");
    $scope.eventName = ename;
    $scope.eventId = eid;
    $scope.eventDur = Math.round(edur);
    $scope.loginData = ZMDataModel.getLogin();
    $scope.modal.show();
  };
  $scope.closeModal = function() {
      console.log ("Close Modal");
    $scope.modal.hide();

  };
  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
      console.log ("Destroy Modal");
    $scope.modal.remove();
  });

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

$scope.isSimulated = function ()
    {
        return ZMDataModel.isSimulated();
    };


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
