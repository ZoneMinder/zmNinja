// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,ionic, moment, vis */




angular.module('zmApp.controllers').controller('TimelineModalCtrl', ['$scope', '$rootScope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$q', '$sce', 'carouselUtils', '$ionicPopup', function ($scope, $rootScope, zm, ZMDataModel, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $q, $sce, carouselUtils, $ionicPopup) {

    
    

    var Graph2d;
    var items;
    var groups;
    var eventImageDigits=5;
    $scope.errorDetails="";
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
    
    
     $scope.scrollUp = function()
    {
        //console.log ("SWIPE UP");
        $ionicScrollDelegate.$getByHandle("timeline-modal-delegate").scrollTop(true);
    };
    
    $scope.scrollDown = function()
    {
        //console.log ("SWIPE DOWN");
        $ionicScrollDelegate.$getByHandle("timeline-modal-delegate").scrollBottom(true);
    };
    
    //-------------------------------------------------------
    // Tapping on a frame shows this image
    //------------------------------------------------------
    
    $scope.showImage = function (p,r,f, fid)
    {
        var img = "<img width='100%' ng-src='"+p+"/index.php?view=image&path="+r+f+"'>";
        $rootScope.zmPopup = $ionicPopup.alert({title: 'frame:'+fid+'/Event:'+$scope.eid,template:img,  cssClass:'popup80'});
    };
    

    $scope.$on('modal.removed', function () {
       
        Graph2d.destroy();
        // Execute action
    });

    //-------------------------------------------------------
    // init drawing here
    //------------------------------------------------------
    
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
        
    
    //-------------------------------------------------------
    // okay, really init drawing here
    //------------------------------------------------------
    
    function processEvent()
    {
        var eid = $scope.event.Event.Id;
        var ld = ZMDataModel.getLogin();
        var apiurl = ld.apiurl + "/events/"+eid+".json";
        ZMDataModel.zmLog ("Getting " + apiurl);
        $http.get (apiurl)
        .then (function (success)
               {
                    //$scope.eventdetails = JSON.stringify(success);
                    drawGraph(success.data);
        },
               function (error)
               {
                    $scope.errorDetails = "there was an error rendering the graph. Please see logs";
                    ZMDataModel.zmLog ("Error in timeline frames " + JSON.stringify(error));
        });
    }
    
    
    //-------------------------------------------------------
    // I was kidding, this is where it really is drawn
    // scout's promise
    //------------------------------------------------------
    
    function drawGraph(event)
    {
        //console.log ("EVENT IS  " + JSON.stringify(event));
        items = [];
        groups = new vis.DataSet();
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
                         tap_selected:false
                        });
        }
        
        
        var dataset = new vis.DataSet(items);
          var options = {
              autoResize:true,
              height: Math.floor($rootScope.devHeight/2),
              //clickToUse:true,

              style:'bar',
              start: event.event.Frame[0].TimeStamp,
              end: event.event.Frame[event.event.Frame.length-1].TimeStamp,
              max: event.event.Frame[event.event.Frame.length-1].TimeStamp,
              min: event.event.Frame[0].TimeStamp,

              drawPoints:function (item,group)
                  {
                      //ITEM IS {"screen_x":1199.0266666666666,"screen_y":232,"x":"2016-03-28T09:27:46.000Z","y":0,"groupId":"__ungrouped__"}
                      var taps = false;
                      for (var i=0; i<items.length; i++)
                      {
                          
                          if (moment(items[i].x).format("YYYY-MM-DD HH:mm:ss") == moment(item.x).format("YYYY-MM-DD HH:mm:ss"))
                          {
                              taps = items[i].tap_selected;
                              if (taps)
                              {
                                
                                  //console.log (">>Item " +i + " is true");
                              }
                              break;
                          }
                      }
                      
                     
                      var style_sel = {size:30, style:'circle', className:'visred'};
                      var style = {size:20, style:'circle'};
                     
                      return (taps ? style_sel: style);
                  },
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
       
        
        
        //-------------------------------------------------------
        // When you tap on a data node
        //------------------------------------------------------
    
        Graph2d.on('click',function (prop) {
            
            $timeout( function() {
                $scope.alarm_images=[];
                
                $scope.playbackURL = ZMDataModel.getLogin().url;
                var t = moment(prop.time);
               
                //console.log ("date="+t.format("YYYY-MM-DD HH:mm:ss"));
                var tformat = t.format ("YYYY-MM-DD HH:mm:ss");
                

                for (var i=0; i<items.length; i++)
                {
                    if (moment(items[i].x).format("YYYY-MM-DD HH:mm:ss") == tformat)
                    {
                   
                         ZMDataModel.zmDebug ("Item " + i + " is tapped with timestamp of "+items[i].x);
                       items[i].tap_selected = true;
                        $scope.alarm_images.push({
                            relativePath:items[i].relativePath, 
                            fid:items[i].fid, 
                            fname:items[i].fname, 
                            score:items[i].score,
                            time:moment(items[i].x).format("MMM D,"+ZMDataModel.getTimeFormat()),
                            eid:items[i].eid});
                        // console.log ("setting " + i + " to " +  items[i].tap_selected);

                    }
                    else
                    {
                        items[i].tap_selected = false;
                    }
                }
                Graph2d.setItems(items);
                //Graph2d.redraw();
                //console.log ("REDRAW");
               
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


