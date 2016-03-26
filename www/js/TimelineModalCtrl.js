// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,ionic, moment, vis */




angular.module('zmApp.controllers').controller('TimelineModalCtrl', ['$scope', '$rootScope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$q', '$sce', 'carouselUtils', '$ionicPopup', 'Hello', function ($scope, $rootScope, zm, ZMDataModel, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $q, $sce, carouselUtils, $ionicPopup,Hello) {

    
    

    var Graph2d;
    var eventImageDigits=5;
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
    
    
    $scope.showImage = function (p,r,f, fid)
    {
        var img = "<img width='100%' ng-src='"+p+"/index.php?view=image&path="+r+f+"'>";
        $rootScope.zmPopup = $ionicPopup.alert({title: 'frame:'+fid+'/Event:'+$scope.eid,template:img,  cssClass:'popup80'});
    };
    

    $scope.$on('modal.removed', function () {
       
        Graph2d.destroy();
        // Execute action
    });

     $scope.$on('modal.shown', function () {
         
         $scope.dataReady = false;
         
         ZMDataModel.getKeyConfigParams(0)
            .then(function (data) {
                //console.log ("***GETKEY: " + JSON.stringify(data));
                eventImageDigits = parseInt(data);
                ZMDataModel.zmLog("Image padding digits reported as " + eventImageDigits);
            });

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
        var groups = new vis.DataSet();
        $scope.eid = event.event.Event.Id;
        for (var i=0; i< event.event.Frame.length; i++)
        {
            
          //  groups.add({id:i, content:'', //className:'c-'+i
                    //   });
           // console.log ("Pushing " + event.event.Frame[i].TimeStamp +":"+ event.event.Frame[i].Score);
            items.push ({x:event.event.Frame[i].TimeStamp,
                         y:event.event.Frame[i].Score,
                         eid: event.event.Event.Id,
                         fid: event.event.Frame[i].FrameId,
                         //group:i,
                         relativePath:computeRelativePath(event.event),
                         score:event.event.Frame[i].Score,
                         fname: padToN(event.event.Frame[i].FrameId,eventImageDigits)+"-capture.jpg",
                        });
        }
        
        
        var dataset = new vis.DataSet(items);
      var options = {
          autoResize:true,
          height: Math.floor($rootScope.devHeight/2),
          
          style:'bar',
          start: event.event.Frame[0].TimeStamp,
          end: event.event.Frame[event.event.Frame.length-1].TimeStamp,
          max: event.event.Frame[event.event.Frame.length-1].TimeStamp,
          min: event.event.Frame[0].TimeStamp,
          
          barChart:
          {
             width: 50,
             sideBySide:false,
             align:'center'
          },
          dataAxis:
          {
              left: {title: {text:'score'}},
          }
      };
        var container = document.getElementById('timeline-alarm-vis');
        Graph2d = new vis.Graph2d(container, dataset, groups, options);
        $scope.dataReady = true;
        $scope.alarm_data = Hello.get();
        
        
        Graph2d.on('click',function (prop) {
            
            $timeout( function() {
                $scope.alarm_images=[];
                
                $scope.playbackURL = ZMDataModel.getLogin().url;
                var t = moment(prop.time);
                //console.log ("x="+prop.x);
               // console.log ("val="+JSON.stringify(prop.value));
                console.log ("date="+t.format("YYYY-MM-DD HH:mm:ss"));
                var tformat = t.format ("YYYY-MM-DD HH:mm:ss");
                //console.log ("event="+JSON.stringify(prop.event));

                for (var i=0; i<items.length; i++)
                {
                    if (items[i].x == tformat)
                    {
                        //console.log ("ITEM " + i + " matches, relative path=" + items[i].relativePath);
                        $scope.alarm_images.push({relativePath:items[i].relativePath, fid:items[i].fid, fname:items[i].fname, score:items[i].score, eid:items[i].eid});

                    }
                }
                //console.log ("I PUSHED " + $scope.alarm_images.length);
            });
            
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

angular.module('zmApp.controllers')
.factory('Hello', function()
{
    var data = 12;
    return {
        'set': function(val) {data=val;},
        'get': function() {return data;}
    };
    
});
