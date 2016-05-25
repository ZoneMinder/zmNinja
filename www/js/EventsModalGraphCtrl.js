// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,ionic, moment, vis , Chart, DJS*/




angular.module('zmApp.controllers').controller('EventsModalGraphCtrl', ['$scope', '$rootScope', 'zm', 'ZMDataModel', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$q', '$sce', 'carouselUtils', '$ionicPopup', '$translate', function ($scope, $rootScope, zm, ZMDataModel, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $q, $sce, carouselUtils, $ionicPopup, $translate) {

    
    

    var Graph2d;
    var tcGraph;
    var items;
    var groups;
    var eventImageDigits=5;
    var cv;
    var ctx;
    //var options;
    //var data;
    var onlyalarm_data;
    var current_data;
    var current_options;
    var btype;
    var data,options;
    
    
      
    
    
    
    $scope.$on('modal.shown', function (e,m) {
        
         if (m.id != 'modalgraph')
            return;
        
        
        console.log ("INSIDE MODAL GRAPH>>>>>>>>>>>>>>>>>");
         data = {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [
        {
            label: "My First dataset",
            fillColor: "rgba(220,220,220,0.5)",
            strokeColor: "rgba(220,220,220,0.8)",
            highlightFill: "rgba(220,220,220,0.75)",
            highlightStroke: "rgba(220,220,220,1)",
            data: [65, 59, 80, 81, 56, 55, 40]
        },
        {
            label: "My Second dataset",
            fillColor: "rgba(151,187,205,0.5)",
            strokeColor: "rgba(151,187,205,0.8)",
            highlightFill: "rgba(151,187,205,0.75)",
            highlightStroke: "rgba(151,187,205,1)",
            data: [28, 48, 40, 19, 86, 27, 90]
        }
    ]
};
        
        options =  {
          
        scales: {
            yAxes:[{
                ticks: {
                   // beginAtZero:true,
                    min:-1,
                },
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
        
     cv = document.getElementById("eventchart");
         ctx = cv.getContext("2d");
    $timeout (function() {
    var tcGraph2 = new Chart(ctx,{type:'bar', data: data, options:options}); });
    });
  
    //-------------------------------------------------------
    // we use this to reload the connkey if authkey changed
    //------------------------------------------------------
    
    
     $rootScope.$on("auth-success", function () {

            ZMDataModel.zmDebug("EventModalCtrl: Re-login detected, resetting everything & re-generating connkey");
             
            
    });
    
    
    
  
    
    //-------------------------------------------------------
    // I was kidding, this is where it really is drawn
    // scout's promise
    //------------------------------------------------------
    
    function drawGraphTC(event)
    {
        
      $scope.eid = event.event.Event.Id;
        
       $scope.alarm_images=[];
       
      /*data = {
      labels: [],
      datasets: [
        {
          label: 'Score',
          fill:true,
          borderJoinStyle: 'miter',
          pointBorderColor: "rgba(220,220,220,1)",
          pointBackgroundColor: "#e74c3c",
          backgroundColor: 'rgba(129, 207, 224, 1.0)',
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#40d47e",
          pointHoverBorderWidth: 2,
          tension: 0.1,
          borderColor: 'rgba(129, 207, 224, 1.0)',
          hoverBackgroundColor: 'rgba(248, 148, 6,1.0)',
          hoverBorderColor: 'rgba(248, 148, 6,1.0)',
          data: [],
          frames: []
        },
        
      ]
    };*/
        
    
    data = {
      labels: [],
      datasets: [
        {
          label: $translate.instant('kScore'),
          fill:true,
          backgroundColor: 'rgba(129, 207, 224, 1.0)',
          borderColor: 'rgb(92, 147, 159)',
          borderCapStyle: 'butt',
          borderJoinStyle: 'miter',
          pointBorderColor: "rgba(220,220,220,1)",
          pointBackgroundColor: "#e74c3c",
          
          pointHoverRadius: 10,
          pointHoverBackgroundColor: "#f39c12",
          pointHoverBorderWidth: 1,
          tension: 0.1,
        
          data: [],
          frames: []
        },
        
      ]
    };
        
    onlyalarm_data = {
      labels: [],
      datasets: [
        {
          label: $translate.instant ('kScore'),
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
                ticks: {
                   // beginAtZero:true,
                    min:-1,
                },
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
        {
            btype = 'line';
            current_data = data;
        }
        else    
        {
            btype = 'bar';
            current_data = onlyalarm_data;
        }
        $timeout(function() {
        tcGraph = new Chart(ctx,{type:btype, data: current_data, options:options});});
            
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


