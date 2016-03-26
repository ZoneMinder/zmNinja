// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,ionic, moment, vis */




angular.module('zmApp.controllers').controller('TimelineModalCtrl', ['$scope', '$rootScope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$q', '$sce', 'carouselUtils', '$ionicPopup', function ($scope, $rootScope, zm, ZMDataModel, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $q, $sce, carouselUtils, $ionicPopup) {


    //----------------------------------------------------------------
        // Alarm notification handling
        //----------------------------------------------------------------
        $scope.handleAlarms = function () {
            $rootScope.isAlarm = !$rootScope.isAlarm;
            if (!$rootScope.isAlarm) {
                $rootScope.alarmCount = "0";
                $ionicHistory.nextViewOptions({
                    disableBack: true
                });
                $state.go("events", {
                    "id": 0
                }, {
                    reload: true
                });
            }
        };
   

    
    //-------------------------------------------------------
    // we use this to reload the connkey if authkey changed
    //------------------------------------------------------
    
    
     $rootScope.$on("auth-success", function () {

            ZMDataModel.zmDebug("EventModalCtrl: Re-login detected, resetting everything & re-generating connkey");
             
            
    });
    
    

    $scope.$on('modal.removed', function () {
       

        // Execute action
    });

     $scope.$on('modal.shown', function () {
         
         $scope.dataReady = false;

         $scope.eventdetails = "loading...";
         processEvent();
         //$scope.eventdetails = JSON.stringify($scope.event);
     });
        
    
    function processEvent()
    {
        var eid = $scope.event.Event.Id;
        var ld = ZMDataModel.getLogin();
        var apiurl = ld.apiurl + "/events/"+eid+".json";
        ZMDataModel.zmLog ("Getting " + apiurl);
        $http.get (apiurl)
        .then (function (success)
               {
                    $scope.eventdetails = JSON.stringify(success);
                    drawGraph(success.data);
        },
               function (error)
               {
                    $scope.eventdetails = JSON.stringify(error);
        });
    }
    
    
    function drawGraph(event)
    {
        console.log ("EVENT IS  " + JSON.stringify(event));
        // Chart.js Data
        var items = [];
        
        for (var i=0; i< event.event.Frame.length; i++)
        {
            console.log ("Pushing " + event.event.Frame[i].TimeStamp +":"+ event.event.Frame[i].Score);
            items.push ({x:event.event.Frame[i].TimeStamp,
                         y:event.event.Frame[i].Score,
                         eid: event.event.Event.Id,
                         fid: event.event.Frame[i].FrameId
                        });
        }
        
        
        var dataset = new vis.DataSet(items);
      var options = {
          style:'bar',
          start: event.event.Frame[0].TimeStamp,
          end: event.event.Frame[event.event.Frame.length-1].TimeStamp,
          max: event.event.Frame[event.event.Frame.length-1].TimeStamp,
          min: event.event.Frame[0].TimeStamp,
          barChart:
          {
             width: 50,
             sideBySide:true,
             align:'center'
          },
          dataAxis:
          {
              left: {title: {text:'score'}},
          }
      };
        var container = document.getElementById('timeline-alarm-vis');
        var Graph2d = new vis.Graph2d(container, dataset, options);
        $scope.dataReady = true;
        
        Graph2d.on('click',function (prop) {
            console.log ("x="+prop.x);
            console.log ("val="+JSON.stringify(prop.value));
            
        });

    }
    
    //--------------------------------------------------------
    // utility function
    //--------------------------------------------------------

    function computeRelativePath(event) {
        var relativePath = "";
        var loginData = ZMDataModel.getLogin();
        var str = event.Event.StartTime;
        var yy = moment(str).format('YY');
        var mm = moment(str).format('MM');
        var dd = moment(str).format('DD');
        var hh = moment(str).format('HH');
        var min = moment(str).format('mm');
        var sec = moment(str).format('ss');
        relativePath = event.Event.MonitorId + "/" +
            yy + "/" +
            mm + "/" +
            dd + "/" +
            hh + "/" +
            min + "/" +
            sec + "/";
        return relativePath;

    }

    //--------------------------------------------------------
    // utility function
    //--------------------------------------------------------

    function computeBasePath(event) {
        var basePath = "";
        var loginData = ZMDataModel.getLogin();
        var str = event.Event.StartTime;
        var yy = moment(str).format('YY');
        var mm = moment(str).format('MM');
        var dd = moment(str).format('DD');
        var hh = moment(str).format('HH');
        var min = moment(str).format('mm');
        var sec = moment(str).format('ss');

        basePath = loginData.url + "/events/" +
            event.Event.MonitorId + "/" +
            yy + "/" +
            mm + "/" +
            dd + "/" +
            hh + "/" +
            min + "/" +
            sec + "/";
        return basePath;
    }



    function padToN(number, digits) {

        var i;
        var stringMax = "";
        var stringLeading = "";
        for (i = 1; i <= digits; i++) {
            stringMax = stringMax + "9";
            if (i != digits) stringLeading = stringLeading + "0";
        }
        var numMax = parseInt(stringMax);

        if (number <= numMax) {
            number = (stringLeading + number).slice(-digits);
        }
        //console.log ("PADTON: returning " + number);
        return number;
    }

    

}]);
