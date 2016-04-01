// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,ionic, moment, vis , Chart, DJS*/




angular.module('zmApp.controllers').controller('TimelineModalCtrl', ['$scope', '$rootScope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$q', '$sce', 'carouselUtils', '$ionicPopup', function ($scope, $rootScope, zm, ZMDataModel, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $q, $sce, carouselUtils, $ionicPopup) {

    
    

    var Graph2d;
    var tcGraph;
    var items;
    var groups;
    var eventImageDigits=5;
    var cv;
    var ctx;
    var options;
    var data;
    var onlyalarm_data;
    var current_data;
    
    $scope.graphType = ZMDataModel.getLogin().timelineModalGraphType;
    //$scope.graphType = "all";
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
    
    
    $scope.switchType = function()
    {
        if ($scope.graphType == "all")
        {
            current_data = onlyalarm_data;
            $scope.graphType = "alarmed";
             ZMDataModel.zmDebug ("Alarm array has " + onlyalarm_data.labels.length+ " frames");
            //console.log (JSON.stringify(onlyalarm_data));
            
        }
        else
        {
            current_data = data;
           // tcGraph.data = 
            $scope.graphType = "all";
        }
        
        ZMDataModel.zmLog ("Switching graph type to "+$scope.graphType);
        
        var ld = ZMDataModel.getLogin();
        ld.timelineModalGraphType = $scope.graphType;
        ZMDataModel.setLogin(ld);
        
        $timeout (function() {
            tcGraph.destroy();
            tcGraph = new Chart(ctx,{type:'bar', data: current_data, options:options});
    });
        
        
    
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
       
        //Graph2d.destroy();
        tcGraph.destroy();
        // Execute action
    });

    //-------------------------------------------------------
    // init drawing here
    //------------------------------------------------------
    
     $scope.$on('modal.shown', function () {
         
         $scope.graphWidth=$rootScope.devWidth-30;
         ZMDataModel.zmLog ("Setting init graph width to " + $scope.graphWidth);
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
        //eid = 22302;
        var ld = ZMDataModel.getLogin();
        var apiurl = ld.apiurl + "/events/"+eid+".json";
        ZMDataModel.zmLog ("Getting " + apiurl);
        $http.get (apiurl)
        .then (function (success)
               {
                    //$scope.eventdetails = JSON.stringify(success);
                    drawGraphTC(success.data);
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
    
    function drawGraphTC(event)
    {
        
      $scope.eid = event.event.Event.Id;
       
      data = {
      labels: [],
      datasets: [
        {
          label: 'Score',
          backgroundColor: 'rgba(129, 207, 224, 1.0)',
          borderColor: 'rgba(129, 207, 224, 1.0)',
          hoverBackgroundColor: 'rgba(248, 148, 6,1.0)',
          hoverBorderColor: 'rgba(248, 148, 6,1.0)',
          data: [],
          frames: []
        },
        
      ]
    };
        
    onlyalarm_data = {
      labels: [],
      datasets: [
        {
          label: 'Score',
          backgroundColor: 'rgba(129, 207, 224, 1.0)',
          borderColor: 'rgba(129, 207, 224, 1.0)',
          hoverBackgroundColor: 'rgba(248, 148, 6,1.0)',
          hoverBorderColor: 'rgba(248, 148, 6,1.0)',
          data: [],
          frames: []
        },
        
      ]
    };

    // Chart.js Options
      options =  {
          
        scales: {
            yAxes:[{
                ticks: {beginAtZero:true},
            }],
            xAxes:[{
                display:false
            }]
        },

      responsive: true,
      scaleBeginAtZero : true,
      scaleShowGridLines : true,
      scaleGridLineColor : "rgba(0,0,0,.05)",
      scaleGridLineWidth : 1,
      barShowStroke : true,
      barStrokeWidth : 2,
      barValueSpacing : 5,
      barDatasetSpacing : 1,
      pointDot:true,
      pointDotRadius : 4,
      
      hover: 
        {
            mode:'single',
            onHover:function(obj)
            {
                if (obj.length > 0)
                tapOrHover(obj[0]._index);
            }
        },

      //String - A legend template
      legendTemplate : '<ul class="tc-chart-js-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].fillColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
    };
        
        $scope.graphWidth = event.event.Frame.length * 10;
        if ($scope.graphWidth < $rootScope.devWidth)
            $scope.graphWidth = $rootScope.devWidth;
            
       // ZMDataModel.zmLog ("Changing graph width to " + $scope.graphWidth);
        
        for (var i=0; i< event.event.Frame.length; i++)
        {
            data.labels.push(event.event.Frame[i].TimeStamp);
            //data.labels.push(' ');
            data.datasets[0].data.push(event.event.Frame[i].Score);
            data.datasets[0].frames.push({x:event.event.Frame[i].TimeStamp,
                         y:event.event.Frame[i].Score,
                         eid: event.event.Event.Id,
                         fid: event.event.Frame[i].FrameId,
                         //group:i,
                         relativePath:computeRelativePath(event.event),
                         score:event.event.Frame[i].Score,
                         fname: padToN(event.event.Frame[i].FrameId,eventImageDigits)+"-capture.jpg",
                         
                        });
            
            if (event.event.Frame[i].Type=="Alarm")
            {
            
                onlyalarm_data.labels.push(event.event.Frame[i].TimeStamp);
                //data.labels.push(' ');
                onlyalarm_data.datasets[0].data.push(event.event.Frame[i].Score);
                onlyalarm_data.datasets[0].frames.push({x:event.event.Frame[i].TimeStamp,
                             y:event.event.Frame[i].Score,
                             eid: event.event.Event.Id,
                             fid: event.event.Frame[i].FrameId,
                             //group:i,
                             relativePath:computeRelativePath(event.event),
                             score:event.event.Frame[i].Score,
                             fname: padToN(event.event.Frame[i].FrameId,eventImageDigits)+"-capture.jpg",

                            });
            }
            
        }
        
        $scope.dataReady = true;
        
         cv = document.getElementById("tcchart");
         ctx = cv.getContext("2d");
        
        if (ZMDataModel.getLogin().timelineModalGraphType == 'all')
            current_data = data;
        else    
            current_data = onlyalarm_data;
        $timeout(function() {
        tcGraph = new Chart(ctx,{type:'bar', data: current_data, options:options});});
            
        cv.onclick = function(e)
        {
            var  b = tcGraph.getElementAtEvent(e); 
            if (b.length > 0)
            {
                tapOrHover(b[0]._index);
            }
        };
    }
    
    function tapOrHover(ndx)
    {
        
            $timeout (function() {
            
                
                //console.log ("You tapped " + ndx);
                      $scope.alarm_images=[];
                    $scope.playbackURL = ZMDataModel.getLogin().url;
                var items = current_data.datasets[0].frames[ndx];
                            $scope.alarm_images.push({
                            relativePath:items.relativePath, 
                            fid:items.fid, 
                            fname:items.fname, 
                            score:items.score,
                            time:moment(items.x).format("MMM D,"+ZMDataModel.getTimeFormatSec()),
                            eid:items.eid});
            });
            
    }
    
   
    /*
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
    */
    
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


