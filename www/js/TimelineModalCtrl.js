// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,ionic, moment, vis , Chart, DJS*/




angular.module('zmApp.controllers').controller('TimelineModalCtrl', ['$scope', '$rootScope', 'zm', 'NVRDataModel', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$q', '$sce', 'carouselUtils', '$ionicPopup', '$translate', function ($scope, $rootScope, zm, NVRDataModel, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $q, $sce, carouselUtils, $ionicPopup, $translate) {




    var Graph2d;
    var tcGraph;
    var items;
    var groups;
    var eventImageDigits = 5;
    var cv;
    var ctx;
    var options;
    var data;
    var onlyalarm_data;
    var current_data;
    var current_options;
    var btype;

    $scope.graphType = NVRDataModel.getLogin().timelineModalGraphType;
    //$scope.graphType = "all";
    $scope.errorDetails = "";



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
                "id": 0,
                "playEvent":false
            }, {
                reload: true
            });
            return;
        }
    };



    //-------------------------------------------------------
    // we use this to reload the connkey if authkey changed
    //------------------------------------------------------


    $rootScope.$on("auth-success", function () {

        NVRDataModel.debug("EventModalCtrl: Re-login detected, resetting everything & re-generating connkey");


    });


    $scope.scrollUp = function () {
        //console.log ("SWIPE UP");
        $ionicScrollDelegate.$getByHandle("timeline-modal-delegate").scrollTop(true);
    };

    $scope.scrollDown = function () {
        //console.log ("SWIPE DOWN");
        $ionicScrollDelegate.$getByHandle("timeline-modal-delegate").scrollBottom(true);
    };


    $scope.switchType = function () {

        if ($scope.graphType == $translate.instant('kGraphAll')) {
            current_data = onlyalarm_data;
            $scope.graphType = $translate.instant('kGraphAlarmed');
            NVRDataModel.debug("Alarm array has " + onlyalarm_data.labels.length + " frames");
            btype = 'bar';
            //console.log (JSON.stringify(onlyalarm_data));

        } else {
            current_data = data;
            // tcGraph.data = 
            $scope.graphType = $translate.instant('kGraphAll');
            btype = 'line';
        }

        NVRDataModel.log("Switching graph type to " + $scope.graphType);

        var ld = NVRDataModel.getLogin();
        ld.timelineModalGraphType = $scope.graphType;
        NVRDataModel.setLogin(ld);


        $timeout(function () {

            /*
            if ($scope.graphType == 'alarmed')
                    tcGraph.data = data;
            else
                    tcGraph.data = onlyalarm_data;
            tcGraph.update();*/
            tcGraph.destroy();
            console.log("GRAPH TYPE IS " + btype);
            tcGraph = new Chart(ctx, {
                type: btype,
                data: current_data,
                options: options
            });
        });



    };


    //-------------------------------------------------------
    // Tapping on a frame shows this image
    //------------------------------------------------------

    $scope.showImage = function (p, r, f, fid, e, imode, id) {
        var img;
        console.log("Image Mode " + imode);
        if (imode == 'path')

            img = "<img width='100%' ng-src='" + p + "/index.php?view=image&path=" + r + f + "'>";
        else {
            img = "<img width='100%' ng-src='" + p + "/index.php?view=image&fid=" + id + "'>";
            // console.log ("IS MULTISERVER SO IMAGE IS " + img);
        }
        $rootScope.zmPopup = $ionicPopup.alert({
            title: 'frame:' + fid + '/Event:' + e,
            template: img,
            cssClass: 'popup95'
        });
    };





    $scope.$on('modal.removed', function (e, m) {

        if (m.id != 'analyze')
            return;
        //Graph2d.destroy();
        tcGraph.destroy();
        // Execute action
    });

    //-------------------------------------------------------
    // init drawing here
    //------------------------------------------------------

    $scope.$on('modal.shown', function (e, m) {

        if (m.id != 'analyze')
            return;

        $scope.alarm_images = [];
        $scope.graphWidth = $rootScope.devWidth - 30;
        NVRDataModel.log("Setting init graph width to " + $scope.graphWidth);
        $scope.dataReady = false;

        NVRDataModel.getKeyConfigParams(0)
            .then(function (data) {
                //console.log ("***GETKEY: " + JSON.stringify(data));
                eventImageDigits = parseInt(data);
                NVRDataModel.log("Image padding digits reported as " + eventImageDigits);
            });

        $scope.eventdetails = $translate.instant('kLoading') + "...";
        $scope.mName = NVRDataModel.getMonitorName($scope.event.Event.MonitorId);
        $scope.humanizeTime = humanizeTime($scope.event.Event.StartTime);
        processEvent();
        //$scope.eventdetails = JSON.stringify($scope.event);
    });


    //-------------------------------------------------------
    // okay, really init drawing here
    //------------------------------------------------------

    function processEvent() {
        var eid = $scope.event.Event.Id;
        //eid = 22302;
        var ld = NVRDataModel.getLogin();
        var apiurl = ld.apiurl + "/events/" + eid + ".json";
        NVRDataModel.log("Getting " + apiurl);
        $http.get(apiurl)
            .then(function (success) {
                    //$scope.eventdetails = JSON.stringify(success);
                    drawGraphTC(success.data);
                },
                function (error) {
                    $scope.errorDetails = $translate.instant('kGraphError');
                    NVRDataModel.log("Error in timeline frames " + JSON.stringify(error));
                });
    }


    //-------------------------------------------------------
    // I was kidding, this is where it really is drawn
    // scout's promise
    //------------------------------------------------------

    function drawGraphTC(event) {

        $scope.eid = event.event.Event.Id;

        $scope.alarm_images = [];


        data = {
            labels: [],
            datasets: [
                {
                    label: 'Score',
                    fill: true,
                    backgroundColor: 'rgba(89, 171, 227, 1.0)',
                    borderColor: 'rgba(52, 152, 219, 1.0)',
                    borderCapStyle: 'butt',
                    borderJoinStyle: 'miter',
                    pointBorderColor: "#e74c3c",
                    pointBackgroundColor: "#e74c3c",

                    pointHoverRadius: 10,
                    pointHoverBackgroundColor: "rgba(249, 105, 14,1.0)",
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
                    label: 'Score',
                    backgroundColor: 'rgba(52, 152, 219, 1.0)',
                    borderColor: 'rgba(52, 152, 219, 1.0)',
                    hoverBackgroundColor: 'rgba(249, 105, 14,1.0)',
                    hoverBorderColor: 'rgba(249, 105, 14,1.0)',
                    data: [],
                    frames: []
        },

      ]
        };

        // Chart.js Options
        options = {
            legend: false,
            scales: {
                yAxes: [{
                    ticks: {
                        // beginAtZero:true,
                        min: -1,
                    },
            }],
                xAxes: [{
                    display: false
            }]
            },

            responsive: true,
            scaleBeginAtZero: true,
            scaleShowGridLines: true,
            scaleGridLineColor: "rgba(0,0,0,.05)",
            scaleGridLineWidth: 1,


            hover: {
                mode: 'single',
                onHover: function (obj) {
                    if (obj.length > 0)
                        tapOrHover(obj[0]._index);
                }
            },

            //String - A legend template
            legendTemplate: '<ul class="tc-chart-js-legend"><% for (var i=0; i<datasets.length; i++){%><li><span style="background-color:<%=datasets[i].fillColor%>"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>'
        };

        $scope.graphWidth = event.event.Frame.length * 10;
        if ($scope.graphWidth < $rootScope.devWidth)
            $scope.graphWidth = $rootScope.devWidth;

        // NVRDataModel.log ("Changing graph width to " + $scope.graphWidth);

        for (var i = 0; i < event.event.Frame.length; i++) {


            data.labels.push(event.event.Frame[i].TimeStamp);
            //data.labels.push(' ');
            data.datasets[0].data.push(event.event.Frame[i].Score);
            data.datasets[0].frames.push({
                x: event.event.Frame[i].TimeStamp,
                y: event.event.Frame[i].Score,
                eid: event.event.Event.Id,
                fid: event.event.Frame[i].FrameId,
                id: event.event.Frame[i].Id,
                //group:i,
                relativePath: computeRelativePath(event.event),
                score: event.event.Frame[i].Score,
                fname: padToN(event.event.Frame[i].FrameId, eventImageDigits) + "-capture.jpg",

            });

            if (event.event.Frame[i].Type == "Alarm") {

                onlyalarm_data.labels.push(event.event.Frame[i].TimeStamp);
                //data.labels.push(' ');
                onlyalarm_data.datasets[0].data.push(event.event.Frame[i].Score);
                onlyalarm_data.datasets[0].frames.push({
                    x: event.event.Frame[i].TimeStamp,
                    y: event.event.Frame[i].Score,
                    eid: event.event.Event.Id,
                    fid: event.event.Frame[i].FrameId,
                    //group:i,
                    relativePath: computeRelativePath(event.event),
                    score: event.event.Frame[i].Score,
                    fname: padToN(event.event.Frame[i].FrameId, eventImageDigits) + "-capture.jpg",
                    id: event.event.Frame[i].Id,

                });
            }

        }

        $scope.dataReady = true;

        cv = document.getElementById("tcchart");
        ctx = cv.getContext("2d");

        if (NVRDataModel.getLogin().timelineModalGraphType == $translate.instant('kGraphAll')) {
            btype = 'line';
            current_data = data;
        } else {
            btype = 'bar';
            current_data = onlyalarm_data;
        }
        $timeout(function () {
            tcGraph = new Chart(ctx, {
                type: btype,
                data: current_data,
                options: options
            });
        });

        cv.onclick = function (e) {
            var b = tcGraph.getElementAtEvent(e);
            if (b.length > 0) {
                tapOrHover(b[0]._index);
            }
        };
    }

    function tapOrHover(ndx) {

        $timeout(function () {


            //console.log ("You tapped " + ndx);
            $scope.alarm_images = [];
            $scope.playbackURL = $scope.event.Event.baseURL;
            var items = current_data.datasets[0].frames[ndx];
            $scope.alarm_images.push({
                relativePath: items.relativePath,
                fid: items.fid,
                id: items.id,
                fname: items.fname,
                score: items.score,
                time: moment(items.x).format("MMM D," + NVRDataModel.getTimeFormatSec()),
                eid: items.eid
            });
        });

    }



    //--------------------------------------------------------
    // utility function
    //--------------------------------------------------------

    function computeRelativePath(event) {
        var relativePath = "";
        var loginData = NVRDataModel.getLogin();
        var str = event.Event.StartTime;
        var yy = moment(str).locale('en').format('YY');
        var mm = moment(str).locale('en').format('MM');
        var dd = moment(str).locale('en').format('DD');
        var hh = moment(str).locale('en').format('HH');
        var min = moment(str).locale('en').format('mm');
        var sec = moment(str).locale('en').format('ss');
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
        var loginData = NVRDataModel.getLogin();
        var str = event.Event.StartTime;
        var yy = moment(str).locale('en').format('YY');
        var mm = moment(str).locale('en').format('MM');
        var dd = moment(str).locale('en').format('DD');
        var hh = moment(str).locale('en').format('HH');
        var min = moment(str).locale('en').format('mm');
        var sec = moment(str).locale('en').format('ss');

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


    function humanizeTime(str)
    {
       return moment(str).fromNow();
        
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