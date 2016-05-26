// Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,ionic,Masonry,moment */


// FIXME: This is a copy of montageCtrl - needs a lot of code cleanup

angular.module('zmApp.controllers').controller('zmApp.MontageHistoryCtrl', ['$scope', '$rootScope', 'ZMDataModel', 'message', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$ionicPopup', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$ionicPlatform', 'zm', '$ionicPopover', '$controller', 'imageLoadingDataShare', '$window', '$translate', function ($scope, $rootScope, ZMDataModel, message, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $ionicPopup, $stateParams, $ionicHistory, $ionicScrollDelegate, $ionicPlatform, zm, $ionicPopover, $controller, imageLoadingDataShare, $window, $translate) {


   //--------------------------------------
    // formats events dates in a nice way
    //---------------------------------------

    $scope.prettifyDate = function (str) {
        return moment(str).format('MMM Do, YYYY '+ZMDataModel.getTimeFormat());
    };

    function prettifyDate(str) {
        return moment(str).format('MMM Do');
    }

    $scope.prettifyTime = function (str) {

        return moment(str).format('h:mm a');
    };


    $scope.prettify = function (str) {
        return moment(str).format(ZMDataModel.getTimeFormat()+' on MMMM Do YYYY');
    };
    
    
     
   //--------------------------------------
    // pause/unpause nph-zms
    //---------------------------------------
    $scope.togglePause = function (mid)
    {
        //console.log ("TOGGLE PAUSE " + mid);
        var m = -1;
        for (var i=0; i < $scope.MontageMonitors.length; i++)
        {
         
            if ($scope.MontageMonitors[i].Monitor.Id == mid)
            {
                m = i;
                break;
            }
        }
        if (m != -1)
        {
            $scope.MontageMonitors[m].Monitor.isPaused = !$scope.MontageMonitors[m].Monitor.isPaused;
            
            var cmd =  $scope.MontageMonitors[m].Monitor.isPaused? 1:2;
            
            ZMDataModel.zmDebug ("Sending CMD:"+cmd+" for monitor "+$scope.MontageMonitors[m].Monitor.Name);
            controlEventStream(cmd,"",$scope.MontageMonitors[m].Monitor.connKey,-1);
        }
    };
    
    
     
    //--------------------------------------
    // Called when ion-footer collapses
    // note that on init it is also called
    //---------------------------------------
    
    $scope.footerExpand = function()
    {
       // console.log ("**************** EXPAND CALLED ***************");
        $ionicSideMenuDelegate.canDragContent(false);
    };
    
    $scope.footerCollapse = function()
    {
        
        
        footerCollapse();
        
            
    };
 
  
    /* Note this is also called when the view is first loaded */
    function footerCollapse()
    {
       // console.log ("**************** COLLAPSE CALLED ***************");
        if (readyToRun == false)
        {
            ZMDataModel.zmDebug ("fake call to footerCollapse - ignoring");
            return;
        }
        
        $ionicSideMenuDelegate.canDragContent(true);
        
         ZMDataModel.stopNetwork("MontageHistory-footerCollapse");
        var ld = ZMDataModel.getLogin();
        
        $scope.sliderVal.realRate = $scope.sliderVal.rate *100;
        //ZMDataModel.zmDebug ("Playback rate is:"  + $scope.sliderVal.realRate);
        
        var TimeObjectFrom = moment($scope.datetimeValueFrom.value).format("YYYY-MM-DD HH:mm");
        var TimeObjectTo = moment($scope.datetimeValueTo.value).format('YYYY-MM-DD HH:mm');
      
       // console.log ("TIME START: " + TimeObjectFrom + " " + TimeObjectTo);
        //console.log ("TIME START: " + TimeObjectFrom + " " + TimeObjectTo);
            
        
         var apiurl;
        
        // release all active streams
        for (var i=0; i< $scope.MontageMonitors.length; i++)
        {
            // generate new connKeys if timeline changes
            if ($scope.MontageMonitors[i].Monitor.eventUrl !='img/noevent.png')
            {
                ZMDataModel.zmLog ("footerCollapse: Calling kill with " + $scope.MontageMonitors[i].Monitor.connKey + " because url is " +$scope.MontageMonitors[i].Monitor.eventUrl ) ;
                var tmpCK = angular.copy($scope.MontageMonitors[i].Monitor.connKey);
                timedControlEventStream(2500,17,"",tmpCK,-1);
                $scope.MontageMonitors[i].Monitor.eventUrl = "img/noevent.png";    
                $scope.MontageMonitors[i].Monitor.connKey =  (Math.floor((Math.random() * 999999) + 1)).toString();
                //console.log ("Generating connkey: " +$scope.MontageMonitors[i].Monitor.connKey);
            }
            
            else
            {
                //console.log ("footerCollapse: Skipped kill: connkey:"+$scope.MontageMonitors[i].Monitor.connKey + " function " + $scope.MontageMonitors[i].Monitor.Function + " listDisplay " + $scope.MontageMonitors[i].Monitor.lisDisplay + " enabled " + $scope.MontageMonitors[i].Monitor.Enabled + " eventURL " + $scope.MontageMonitors[i].Monitor.eventUrl);
            }
            
            
           
            
        }
         // grab events that start on or before the time and end on or after the time
            // this should only bring up events that span that time
            apiurl= ld.apiurl + "/events/index/StartTime >=:"+TimeObjectFrom+"/EndTime <=:"+TimeObjectTo+".json";
        
            ZMDataModel.zmLog ("Event timeline API is " + apiurl);
        
            $http.get(apiurl)
            .success( function(data) {
                
                var ld = ZMDataModel.getLogin();
                ZMDataModel.zmDebug ("Got "+data.events.length+"new history events...");
                var eid, mid, stime;
                for (i=0; i<data.events.length; i++)
                {
                    mid = data.events[i].Event.MonitorId;
                    eid = data.events[i].Event.Id;
                    stime = data.events[i].Event.StartTime;
                    
                   // only take the first one for each monitor
                    for (var j=0; j < $scope.MontageMonitors.length; j++)
                    {
                       // that's the earliest match and play gapless from there
                       if ($scope.MontageMonitors[j].Monitor.Id == mid)
                       {
                           
                           if ($scope.MontageMonitors[j].Monitor.eventUrl == 'img/noevent.png')
                           {

                                   // console.log ("Old value of event url " + $scope.MontageMonitors[j].eventUrl);
                               //console.log ("ldurl is " + ld.streamingurl);
                                    $scope.MontageMonitors[j].Monitor.eventUrl=ld.streamingurl+"/nph-zms?source=event&mode=jpeg&event="+eid+"&frame=1&replay=gapless&rate="+$scope.sliderVal.realRate+"&connkey="+$scope.MontageMonitors[j].Monitor.connKey+"&scale="+ld.montageHistoryQuality+"&rand="+$rootScope.rand;
                                    //console.log ("Setting event URL to " +$scope.MontageMonitors[j].Monitor.eventUrl);

                                   //   console.log ("SWITCHING TO " + $scope.MontageMonitors[j].eventUrl);


                                    $scope.MontageMonitors[j].Monitor.eventUrlTime = stime;
                           }
                       }
                    }
                }
                
                // make sure we do our best to get that duration for all monitors
                // in the above call, is possible some did not make the cut in the first page
               
                    ZMDataModel.zmLog ("Making sure all monitors have a fair chance...");
                    for (i=0; i<$scope.MontageMonitors.length; i++)
                    {
                        if ($scope.MontageMonitors[i].Monitor.eventUrl=='img/noevent.png')
                        {


                            var indivGrab = ld.apiurl + "/events/index/MonitorId:"+$scope.MontageMonitors[i].Monitor.Id+"/StartTime >=:"+TimeObjectFrom+"/EndTime <=:"+TimeObjectTo+".json";

                            ZMDataModel.zmDebug("Monitor " + $scope.MontageMonitors[i].Monitor.Id+":"+$scope.MontageMonitors[i].Monitor.Name + " does not have events, trying "+indivGrab);

                            getExpandedEvents(i,indivGrab);

                        }
                    }
                
               
                
                
            })
            .error (function (data) {
                ZMDataModel.zmDebug ("history  ERROR:"+ JSON.stringify(data));
                
            });
        
        
        function getExpandedEvents(i,indivGrab)
        {
            var ld = ZMDataModel.getLogin();
           // console.log ("EXPANDED EVENT " + i + " " + indivGrab);
            $http.get(indivGrab)
            .success(function(data)
            {
               // console.log ("EXPANDED DATA FOR MONITOR " + i + JSON.stringify(data));
                if (data.events.length > 0 )
                {
                    
                    if (!ZMDataModel.isBackground())
                    {

                        $scope.MontageMonitors[i].Monitor.eventUrl=ld.streamingurl+"/nph-zms?source=event&mode=jpeg&event="+data.events[0].Event.Id+"&frame=1&replay=gapless&rate="+$scope.sliderVal.realRate+"&connkey="+$scope.MontageMonitors[i].Monitor.connKey+"&scale="+ld.montageHistoryQuality+"&rand="+$rootScope.rand;
                        
                    
                        
                         //console.log ("SWITCHING TO " + $scope.MontageMonitors[i].eventUrl);
                        
                        $scope.MontageMonitors[i].Monitor.eventUrlTime = data.events[0].Event.StartTime;

                        ZMDataModel.zmLog ("Found expanded event "+data.events[0].Event.Id+" for monitor " + $scope.MontageMonitors[i].Monitor.Id);
                    }
                    else
                    {
                       // $scope.MontageMonitors[i].eventUrl="img/noevent.png";
                    //    $scope.MontageMonitors[i].eventUrlTime = "";
                    //    ZMDataModel.zmLog ("Setting img src to null as data received in background");
                    }
                }
                
            })
            .error (function(data)
            {
            });
        }
    }
    
    //---------------------------------------------------------
    // This is periodically called to get the current playing 
    // event by zms. I use this to display a timestamp
    // Its a 2 step process - get event Id then go a Event
    // API call to get time stamp. Sucks
    //---------------------------------------------------------
    
    function checkAllEvents()
    {
       
        //console.log ("Events are checked....");
        
        for (var i=0; i<$scope.MontageMonitors.length; i++)
        {
            // don't check for monitors that are not shown
            // because nph connkey won't exist and the response
            // will fail
            if ($scope.MontageMonitors[i].Monitor.eventUrl !="" && $scope.MontageMonitors[i].Monitor.eventUrl !='img/noevent.png' && $scope.MontageMonitors[i].Monitor.connKey !='' &&
                $scope.MontageMonitors[i].Monitor.Function !='None' &&
                $scope.MontageMonitors[i].Monitor.listDisplay!='noshow' &&
                $scope.MontageMonitors[i].Monitor.Enabled !='0')
            {
                ZMDataModel.zmDebug ("Checking event status for " + $scope.MontageMonitors[i].Monitor.Name + ":"+$scope.MontageMonitors[i].Monitor.eventUrl+":"+$scope.MontageMonitors[i].Monitor.Function+":"+$scope.MontageMonitors[i].Monitor.listDisplay);
                controlEventStream('99','',$scope.MontageMonitors[i].Monitor.connKey, i);
                
            }
        }
    }
    
    
    $scope.dateChanged = function()
    {
       // window.stop();
       // console.log (">>>>>>>>>>>>>>>>>>>>>>>>>>>>> BAD BAD");
        footerCollapse();
    };
    

    //--------------------------------------------------------------
    //  Used to control zms for a connkey. If ndx is not -1,
    // then it also calls an event API for the returned eid
    // and stores its time in the montage monitors array
    //--------------------------------------------------------------
    $scope.controlEventStream = function (cmd,disp,connkey,ndx)
    {
        controlEventStream(cmd,disp,connkey,ndx);
    };
    
    function timedControlEventStream (mTime, cmd, disp, connkey, ndx)
    {
        var mMtime = mTime || 2000;
        ZMDataModel.zmDebug ("Deferring control " + cmd + " by " + mMtime);
        $timeout ( function()
        {
            subControlStream(cmd,connkey);
            
        },mMtime);
    }
    
    function subControlStream(cmd,connkey)
    {
        var loginData = ZMDataModel.getLogin();
        var myauthtoken = $rootScope.authSession.replace("&auth=","");
        //&auth=
            var req = $http({
                method: 'POST',
                /*timeout: 15000,*/
                url: loginData.url + '/index.php',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    //'Accept': '*/*',
                },
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" +
                            encodeURIComponent(obj[p]));
                    var foo = str.join("&");
                    //console.log("****SUB RETURNING " + foo);
                    return foo;
                },

                data: {
                    view: "request",
                    request: "stream",
                    connkey: connkey,
                    command: cmd,
                    auth: myauthtoken,
                   // user: loginData.username,
                   // pass: loginData.password
                }
            });
        
            req.success (function (resp) {
                ZMDataModel.zmDebug ("subControl success:"+JSON.stringify(resp));
            });
        
        
            req.error (function (resp) {
                ZMDataModel.zmDebug ("subControl error:"+JSON.stringify(resp));
            });
    }
    
    
    function controlEventStream(cmd, disp, connkey, ndx) {
            // console.log("Command value " + cmd);
            
            if (disp) {
                $ionicLoading.hide();
                $ionicLoading.show({
                    template: $translate.instant('kPleaseWait')+"...",
                    noBackdrop: true,
                    duration: zm.loadingTimeout,
                });
            }
            var loginData = ZMDataModel.getLogin();

            /*
            var CMD_NONE = 0;
            var CMD_PAUSE = 1;
            var CMD_PLAY = 2;
            var CMD_STOP = 3;
            var CMD_FASTFWD = 4;
            var CMD_SLOWFWD = 5;
            var CMD_SLOWREV = 6;
            var CMD_FASTREV = 7;
            var CMD_ZOOMIN = 8;
            var CMD_ZOOMOUT = 9;
            var CMD_PAN = 10;
            var CMD_SCALE = 11;
            var CMD_PREV = 12;
            var CMD_NEXT = 13;
            var CMD_SEEK = 14;
            var CMD_QUERY = 99;
            */
            


            // You need to POST commands to control zms
            // Note that I am url encoding the parameters into the URL
            // If I leave it as JSON, it gets converted to OPTONS due
            // to CORS behaviour and ZM/Apache don't seem to handle it

            //console.log("POST: " + loginData.url + '/index.php');

            //console.log ("AUTH IS " + $rootScope.authSession);
        
            var myauthtoken = $rootScope.authSession.replace("&auth=","");
        //&auth=
            var req = $http({
                method: 'POST',
                /*timeout: 15000,*/
                url: loginData.url + '/index.php',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    //'Accept': '*/*',
                },
                transformRequest: function (obj) {
                    var str = [];
                    for (var p in obj)
                        str.push(encodeURIComponent(p) + "=" +
                            encodeURIComponent(obj[p]));
                    var foo = str.join("&");
                   // console.log("****RETURNING " + foo);
                    return foo;
                },

                data: {
                    view: "request",
                    request: "stream",
                    connkey: connkey,
                    command: cmd,
                    auth: myauthtoken,
                   // user: loginData.username,
                   // pass: loginData.password
                }
            });
            req.success(function (resp) {

               // console.log("SUCCESS FOR: " + JSON.stringify(resp));
               
                if (resp.result=="Ok" && ndx != -1)
                {   
                    var ld = ZMDataModel.getLogin();
                    var apiurl= ld.apiurl + "/events/"+resp.status.event+".json";
                    //console.log ("API " + apiurl);
                    $http.get (apiurl)
                    .success (function (data)
                    {
                        var currentEventTime = moment(data.event.Event.StartTime);
                        var maxTime = moment($scope.datetimeValueTo.value);
                        //ZMDataModel.zmDebug ("Monitor: " + $scope.MontageMonitors[ndx].Monitor.Id + " max time="+maxTime + "("+$scope.datetimeValueTo.value+")"+ " current="+currentEventTime + "("+data.event.Event.StartTime+")");
                        if ($scope.MontageMonitors[ndx].Monitor.eventUrlTime!=data.event.Event.StartTime && currentEventTime.diff(maxTime) <= 0 )
                        {
                            
                            var ld = ZMDataModel.getLogin();
                            var element = angular.element(document.getElementById($scope.MontageMonitors[ndx].Monitor.Id+"-timeline"));
                                    element.removeClass ('animated flipInX');
                                    element.addClass('animated flipOutX');
                                    $timeout (function() {
                                        element.removeClass ('animated flipOutX');
                                         element.addClass('animated flipInX');
                                        $scope.MontageMonitors[ndx].Monitor.eventUrlTime=data.event.Event.StartTime;
                                        
                                        $scope.MontageMonitors[ndx].Monitor.eventUrl=ld.streamingurl+"/nph-zms?source=event&mode=jpeg&event="+data.event.Event.Id+"&frame=1&replay=gapless&rate="+$scope.sliderVal.realRate+"&connkey="+$scope.MontageMonitors[ndx].Monitor.connKey+"&scale="+ld.montageHistoryQuality+"&rand="+$rootScope.rand;
                                    },700);
                               
                        }
                        else if ( currentEventTime.diff(maxTime)>0)
                        {
                            ZMDataModel.zmDebug (">>>>>>>>Monitor " + $scope.MontageMonitors[ndx].Monitor.Id + " event time of " + data.event.Event.StartTime + " exceeds " + $scope.datetimeValueTo.value +" stopping...");
                            subControlStream(17,connkey);
                            
                            
                        }
                        
                    })
                    .error (function (data)
                    {
                        $scope.MontageMonitors[ndx].Monitor.eventUrlTime="-";
                    });
                    
                }
           });

            req.error(function (resp) {
                //console.log("ERROR: " + JSON.stringify(resp));
                ZMDataModel.zmLog("Error sending event command " + JSON.stringify(resp), "error");
            });
        }

    //---------------------------------------------------------------------
    // Controller main
    //---------------------------------------------------------------------

    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);
    
    $scope.timeFormat = "yyyy-MM-dd "+ZMDataModel.getTimeFormat();
    $scope.displayDateTimeSliders = true;
    $scope.showtimers = true;
    $scope.loginData = ZMDataModel.getLogin();

     
    
    var curYear = new Date().getFullYear();
    
    var readyToRun = false;
    var i;
    
    $scope.sliderVal = {
       
        rate:1,
        realRate:100,
        hideNoEvents:false,
        enableGapless:true,
        exactMatch:false,
        showTimeline:true
        
    };
    
    
    
    // default = start of day
    var timeto = moment();
    var timefrom = moment().startOf('day');
    
    $scope.sliderVal.rate = 1;
    $scope.sliderVal.realRate = $scope.sliderVal.rate *100;
   
    
    
    //var tdatetimeValueFrom = new Date();
    //tdatetimeValueFrom.setDate(tdatetimeValueFrom.getDate()-1);
    
    $scope.datetimeValueFrom = {value:""};
    $scope.datetimeValueTo = {value:""};
    
    $scope.datetimeValueFrom.value = timefrom.toDate(); 
    $scope.datetimeValueTo.value = timeto.toDate(); 
    
   $rootScope.eventQueryInterval="";
    
    
    var commonCss =  
        {
        
            background: {
                "background-color": "silver"
            },
            before: {
                "background-color": "purple"
            },
            default: {
                "background-color": "white"
            }, // default value: 1px
            after: {
                "background-color": "green"
            }, // zone after default value
            pointer: {
                "background-color": "red"
            }, // circle pointer
            range: {
                "background-color": "red"
            } // use it if double value
        };
   
    
     $scope.slider_modal_options_rate = {
                        from: 1,
                        to: 10,
                        realtime: true,
                        step: 1,
                        className: "mySliderClass",
                        //modelLabels:function(val) {return "";},
                        smooth: false,
                        css: commonCss,
                        dimension:'X'
                        
                    };
    
   
    
    var isLongPressActive = false;
    $scope.isReorder = false;
    var intervalHandleMontage; // will hold image resize timer on long press
    var montageIndex = 0; // will hold monitor ID to scale in timer
    
    var gridcontainer;

    $scope.monitorSize = []; // array with montage sizes per monitor
    $scope.scaleDirection = []; // 1 = increase -1 = decrease

    $scope.slider = {};
    
    //console.log ("************ HISTORY " + ZMDataModel.getMontageSize());
    $scope.slider.monsize = ZMDataModel.getMontageSize();
    $scope.revMonSize = 11 - parseInt($scope.slider.monsize);

    // The difference between old and original is this:
    // old will have a copy of the last re-arranged monitor list
    // while original will have a copy of the order returned by ZM

    var oldMonitors = []; // To keep old order if user cancels after sort;

    // Montage display order may be different so don't
    // mangle monitors as it will affect other screens
    // in Montage screen we will work with this local copy
    //$scope.MontageMonitors = angular.copy ($scope.monitors);

    var montageOrder = []; // This array will keep the ordering in montage view
    var hiddenOrder = []; // 1 = hide, 0 = don't hide
    
    var tempMonitors = message;
    if (tempMonitors.length == 0)
    {
        $rootScope.zmPopup= $ionicPopup.alert({
                    title: $translate.instant('kNoMonitors'),
                    template:$translate.instant('kPleaseCheckCredentials')
        });
        $ionicHistory.nextViewOptions({
                    disableBack: true
        });
        $state.go("login");
        return;
    }
    
   // console.log ("TEMP MONITORS IS " + JSON.stringify(tempMonitors));
    var tempResponse = ZMDataModel.applyMontageMonitorPrefs(message, 0);
    $scope.monitors = tempResponse[0];
    montageOrder = tempResponse[1];
    hiddenOrder = tempResponse[2];
    
    ZMDataModel.zmLog("Inside MontageHistoryCtrl:We found " + $scope.monitors.length + " monitors");

    $scope.MontageMonitors = ZMDataModel.applyMontageMonitorPrefs (message, 1)[0];
    
    var loginData = ZMDataModel.getLogin();
    
    $scope.packMontage = loginData.packMontage;
    
    
    // init monitors
    ZMDataModel.zmDebug(">>Initializing connkeys and images...");
    for ( i=0; i< $scope.MontageMonitors.length; i++)
          {
              //$scope.MontageMonitors[i].Monitor.connKey='';
              
              
                
                $scope.MontageMonitors[i].Monitor.connKey =  (Math.floor((Math.random() * 999999) + 1)).toString();
                $scope.MontageMonitors[i].Monitor.eventUrl ='img/noevent.png';
                $scope.MontageMonitors[i].Monitor.eventUrlTime="";
                $scope.MontageMonitors[i].Monitor.isPaused=false;
                   
       
          }
    readyToRun = true;
    
    
    
    // --------------------------------------------------------
    // Handling of back button in case modal is open should
    // close the modal
    // --------------------------------------------------------                               
    
    $ionicPlatform.registerBackButtonAction(function (e) {
            e.preventDefault();
            if ($scope.modal && $scope.modal.isShown())
            {
                // switch off awake, as liveview is finished
                ZMDataModel.zmDebug("Modal is open, closing it");
                ZMDataModel.setAwake(false);
                $scope.modal.remove();
                $scope.isModalActive = false;
            }
            else
            {
                ZMDataModel.zmDebug("Modal is closed, so toggling or exiting");
                if (!$ionicSideMenuDelegate.isOpenLeft()) 
                {
                    $ionicSideMenuDelegate.toggleLeft();
                   
                } 
                else 
                {
                    navigator.app.exitApp();
                }
            
            }
            
        }, zm.eventHistoryTimer);




    $scope.showSizeButtons = false;
    $ionicPopover.fromTemplateUrl('templates/help/montage-help.html', {
        scope: $scope,
    }).then(function (popover) {
        $scope.popover = popover;
    });

    var timestamp = new Date().getUTCMilliseconds();
    $scope.minimal = $stateParams.minimal;
    $scope.zmMarginTop = $scope.minimal ? 0:15;
    //console.log ("********* MARGIN IS " + $scope.zmMarginTop);
    
    $scope.isRefresh = $stateParams.isRefresh;
    var sizeInProgress = false;
    $scope.imageStyle = true;

    $ionicSideMenuDelegate.canDragContent(true);

  

    // Do we have a saved montage array size? No?
   // if (window.localStorage.getItem("montageArraySize") == undefined) {
    if (loginData.montageArraySize == '0') {

        for ( i = 0; i < $scope.monitors.length; i++) {
            $scope.monitorSize.push(ZMDataModel.getMontageSize());
            $scope.scaleDirection.push(1);
        }
    } else // recover previous settings
    {
        var msize = loginData.montageArraySize;
        //console.log("MontageArrayString is=>" + msize);
        $scope.monitorSize = msize.split(":");
        var j;

        for (j = 0; j < $scope.monitorSize.length; j++) {
            // convert to number other wise adding to it concatenates :-)
            $scope.monitorSize[j] = parseInt($scope.monitorSize[j]);
            $scope.scaleDirection.push(1);
            //console.log("Montage size for monitor " + j + " is " + $scope.monitorSize[j]);

        }

    }
    // $scope.monitorSize = monitorSize;
    // $scope.scaleDirection = scaleDirection;

    $scope.LoginData = ZMDataModel.getLogin();
    $scope.monLimit = $scope.LoginData.maxMontage;
    
    if ($rootScope.platformOS!='ios')
    {
        ZMDataModel.zmLog ("Limiting montage to 5, thanks to Chrome's stupid connection limit");
        $scope.monLimit = 5;
    }
    
    //console.log("********* Inside MontageHistoryCtrl, MAX LIMIT=" + $scope.monLimit);


    $rootScope.authSession = "undefined";
    $ionicLoading.show({
        template: $translate.instant('kNegotiatingStreamAuth'),
        animation: 'fade-in',
        showBackdrop: true,
        duration: zm.loadingTimeout,
        maxWidth: 300,
        showDelay: 0
    });


    var ld = ZMDataModel.getLogin();
    
    //console.log ("MONITORS " + JSON.stringify($scope.monitors));
    $rootScope.validMonitorId = $scope.monitors[0].Monitor.Id;
    ZMDataModel.getAuthKey($rootScope.validMonitorId)
        .then(function (success) {
                $ionicLoading.hide();
                //console.log(success);
                $rootScope.authSession = success;
                ZMDataModel.zmLog("Stream authentication construction: " +
                    $rootScope.authSession);

            },
            function (error) {

                $ionicLoading.hide();
                ZMDataModel.zmDebug("MontageHistoryCtrl: Error in authkey retrieval " + error);
                //$rootScope.authSession="";
                ZMDataModel.zmLog("MontageHistoryCtrl: Error returned Stream authentication construction. Retaining old value of: " + $rootScope.authSession);
            });


    // I was facing a lot of problems with Chrome/crosswalk getting stuck with
    // pending HTTP requests after a while. There is a problem with chrome handling
    // multiple streams of always open HTTP get's (image streaming). This problem
    // does not arise when the image is streamed for a single monitor - just multiple

    // To work around this I am taking a single snapshot of ZMS and have implemented a timer
    // to reload the snapshot every 1 second. Seems to work reliably even thought its a higer
    // load. Will it bonk with many monitors? Who knows. I have tried with 5 and 1280x960@32bpp


    function loadNotifications() {

        //$rootScope.rand = Math.floor((Math.random() * 100000) + 1);

        //console.log ("Inside Montage timer...");

    }

    var intervalHandle;
    $scope.isModalActive = false;
    var modalIntervalHandle;


    $scope.closeReorderModal = function () {
        //console.log("Close & Destroy Monitor Modal");
        // switch off awake, as liveview is finished
        //ZMDataModel.setAwake(false);
        $scope.modal.remove();

    };
    
    
    $scope.isBackground = function()
    {
        return ZMDataModel.isBackground();
    };


    //----------------------------------------------------------------
    // Alarm notification handling
    //----------------------------------------------------------------
    $scope.handleAlarms = function()
    {
        $rootScope.isAlarm=!$rootScope.isAlarm;
        if (!$rootScope.isAlarm)
        {
            $rootScope.alarmCount="0";
            $ionicHistory.nextViewOptions({disableBack: true});		
            $state.go("events", {"id": 0}, { reload: true });
        }
    };
    
    $scope.handleAlarmsWhileMinimized = function()
    {
        $rootScope.isAlarm=!$rootScope.isAlarm;
        
         $scope.minimal = !$scope.minimal;
        ZMDataModel.zmDebug("MontageHistoryCtrl: switch minimal is " + $scope.minimal);
        ionic.Platform.fullScreen($scope.minimal, !$scope.minimal);
        $interval.cancel(intervalHandle);
        $interval.cancel($rootScope.eventQueryInterval);
        
        if (!$rootScope.isAlarm)
        {
            $rootScope.alarmCount="0";
            $ionicHistory.nextViewOptions({disableBack: true});		
            $state.go("events", {"id": 0}, { reload: true });
        }
    };
    
    
    //-------------------------------------------------------------
    // this is checked to make sure we are not pulling images
    // when app is in background. This is a problem with Android,
    // for example
    //-------------------------------------------------------------

    $scope.isBackground = function()
    {
        //console.log ("Is background called from Montage and returned " +    
        //ZMDataModel.isBackground());
        return ZMDataModel.isBackground();
    };

    //-------------------------------------------------------------
    // Called when user taps on the reorder button
    //-------------------------------------------------------------

    $scope.reorderList = function () {
        //console.log("REORDER");
        $scope.data.showDelete = false;
        $scope.data.showReorder = !$scope.data.showReorder;
    };

    $scope.deleteList = function () {
        //console.log("DELETE");
        $scope.data.showDelete = !$scope.data.showDelete;
        $scope.data.showReorder = false;
    };

    $scope.reloadReorder = function () {
        var refresh = ZMDataModel.getMonitors(1);
        
        refresh.then(function (data) {
            $scope.monitors = data;
            $scope.MontageMonitors = data;
            oldMonitors = angular.copy($scope.monitors);
            var i;
            montageOrder = [];
            for (i = 0; i < $scope.monitors.length; i++) {
                montageOrder[i] = i;
                hiddenOrder[i] = 0;
            }
            
            loginData.montageOrder = montageOrder.toString();
            loginData.montageHiddenOrder = hiddenOrder.toString();
            ZMDataModel.setLogin(loginData);
            //window.localStorage.setItem("montageOrder", montageOrder.toString());
            //window.localStorage.setItem("montageHiddenOrder", hiddenOrder.toString());
            ZMDataModel.zmLog("Montage order saved on refresh: " + montageOrder.toString() + " and hidden order: " + hiddenOrder.toString());

        });
    };

    $scope.saveReorder = function () {
        loginData.montageOrder = montageOrder.toString();
        loginData.montageHiddenOrder = hiddenOrder.toString();
        ZMDataModel.setLogin(loginData);
        //window.localStorage.setItem("montageOrder", montageOrder.toString());
       // window.localStorage.setItem("montageHiddenOrder",
        //    hiddenOrder.toString());
        //console.log("Saved " + montageOrder.toString());
        ZMDataModel.zmLog("User press OK. Saved Monitor Order as: " +
            montageOrder.toString() +
            " and hidden order as " + hiddenOrder.toString());
        $scope.modal.remove();
    };

    $scope.cancelReorder = function () {
        // user tapped cancel
        var i, myhiddenorder;
        if (loginData.montageOrder == '') {
        //if (window.localStorage.getItem("montageOrder") == undefined) {
            for (i = 0; i < $scope.MontageMonitors.length; i++) {
                montageOrder[i] = i;
                hiddenOrder[i] = 0;
            }
            //console.log("Order string is " + montageOrder.toString());
            ZMDataModel.zmLog("User press Cancel. Reset Monitor Order to: " + montageOrder.toString());
        } else // montageOrder exists
        {
            var myorder = loginData.montageOrder;

            if (loginData.montageHiddenOrder=='') {
                for (i = 0; i < $scope.MontageMonitors.length; i++) {
                    hiddenOrder[i] = 0;
                }
            } else {
                myhiddenorder = loginData.montageHiddenOrder;
                hiddenOrder = myhiddenorder.split(",");
            }

            //console.log("Montage order is " + myorder + " and hidden order is " + myhiddenorder);
            montageOrder = myorder.split(",");

            for (i = 0; i < montageOrder.length; i++) {
                montageOrder[i] = parseInt(montageOrder[i]);
                hiddenOrder[i] = parseInt(hiddenOrder[i]);
            }

            $scope.MontageMonitors = oldMonitors;
            ZMDataModel.zmLog("User press Cancel. Restored Monitor Order as: " + montageOrder.toString() + " and hidden order as: " + hiddenOrder.toString());

        }
        $scope.modal.remove();
    };

    $scope.toggleReorder = function () {
        $scope.isReorder = !$scope.isReorder;
        $scope.data = {};
        $scope.data.showDelete = false;
        $scope.data.showReorder = false;

        var i;
        oldMonitors = angular.copy($scope.monitors);
        /*for (i=0; i<$scope.monitors.length; i++)
        {
            $scope.monitors[i].Monitor.listDisplay="show";
        }*/

        ld = ZMDataModel.getLogin();
        if (ld.enableDebug) {
            // Lets show the re-order list
            for (i = 0; i < $scope.MontageMonitors.length; i++) {
                ZMDataModel.zmDebug("Montage reorder list: " + $scope.MontageMonitors[i].Monitor.Name +
                    ":listdisplay->" + $scope.MontageMonitors[i].Monitor.listDisplay);

            }
        }

        $ionicModal.fromTemplateUrl('templates/reorder-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            })
            .then(function (modal) {
                $scope.modal = modal;
                $scope.modal.show();
            });



    };

    /*
    $scope.onSwipeLeft = function ($index) {
        $scope.showSizeButtons = true;
    };

    $scope.onSwipeRight = function ($index) {
        $timeout(function () {
            $scope.showSizeButtons = false;
        }, 1000);

    };*/

    //---------------------------------------------------------------------
    // This marks a monitor as hidden in montage view
    //---------------------------------------------------------------------

    $scope.deleteItem = function (index) {
        var findindex = montageOrder.indexOf(index);
        // $scope.monitors[index].Monitor.Function = 'None';
        if ($scope.MontageMonitors[index].Monitor.listDisplay == 'show') {
            $scope.MontageMonitors[index].Monitor.listDisplay = 'noshow';
            hiddenOrder[findindex] = 1;
        } else {
            $scope.MontageMonitors[index].Monitor.listDisplay = 'show';
            // we need to find the index of Montage Order that contains index
            // because remember, hiddenOrder does not change its orders as monitors
            // move

            hiddenOrder[findindex] = 0;
        }
        //window.localStorage.setItem("montageOrder", montageOrder.toString());
        //console.log("DELETE: Order Array now is " + montageOrder.toString());
        //console.log("DELETE: Hidden Array now is " + hiddenOrder.toString());
        ZMDataModel.zmLog("Marked monitor " + findindex + " as " + $scope.MontageMonitors[index].Monitor.listDisplay + " in montage");

    };

    //---------------------------------------------------------------------
    // When we re-arrange the montage, all the ordering index moves
    // horrible horrible code
    //---------------------------------------------------------------------

    function reorderItem(item, from, to, reorderHidden) {

        ZMDataModel.zmDebug("MontageHistoryCtrl: Reorder from " + from + " to " + to);
        $scope.MontageMonitors.splice(from, 1);
        $scope.MontageMonitors.splice(to, 0, item);

        // Now we need to re-arrange the montageOrder
        // hiddenOrder remains the same

        var i, j;
        for (i = 0; i < $scope.monitors.length; i++) {
            for (j = 0; j < $scope.MontageMonitors.length; j++) {
                if ($scope.monitors[i].Monitor.Id == $scope.MontageMonitors[j].Monitor.Id) {
                    montageOrder[i] = j;
                    break;
                }
            }
        }
        ZMDataModel.zmLog("New Montage Order is: " + montageOrder.toString());

    }


    $scope.reorderItem = function (item, from, to) {
        reorderItem(item, from, to, true);
    };


    //---------------------------------------------------------------------
    // Triggered when you enter/exit full screen
    //---------------------------------------------------------------------
    $scope.switchMinimal = function () {
        $scope.minimal = !$scope.minimal;
        ZMDataModel.zmDebug("MontageHistoryCtrl: switch minimal is " + $scope.minimal);
        //console.log("Hide Statusbar");
        ionic.Platform.fullScreen($scope.minimal, !$scope.minimal);
        $interval.cancel(intervalHandle); //we will renew on reload
        // We are reloading this view, so we don't want entry animations
        $ionicHistory.nextViewOptions({
            disableAnimate: true,
            disableBack: true
        });
        $state.go("montage", {
            minimal: $scope.minimal,
            isRefresh: true
        });
    };

    //---------------------------------------------------------------------
    // Show/Hide PTZ control in monitor view
    //---------------------------------------------------------------------
    $scope.togglePTZ = function () {
        $scope.showPTZ = !$scope.showPTZ;
    };

    $scope.callback = function () {
       // console.log("dragging");
    };


    $scope.onDropComplete = function (index, obj, event) {
        //console.log("dragged");
        var otherObj = $scope.monitors[index];
        var otherIndex = $scope.monitors.indexOf(obj);
        $scope.monitors[index] = obj;
        $scope.monitors[otherIndex] = otherObj;
    };


    

    //---------------------------------------------------------------------
    // changes order of montage display
    //---------------------------------------------------------------------
    
    $scope.toggleMontageDisplayOrder = function()
    {
        $scope.packMontage = !$scope.packMontage;
        loginData.packMontage = $scope.packMontage;
        ZMDataModel.setLogin(loginData);
        //console.log ("Switching orientation");
    };

    
    //---------------------------------------------------------------------
    // In Android, the app runs full steam while in background mode
    // while in iOS it gets suspended unless you ask for specific resources
    // So while this view, we DON'T want Android to keep sending 1 second
    // refreshes to the server for images we are not seeing
    //---------------------------------------------------------------------

    function onPause() {
        ZMDataModel.zmDebug("MontageHistoryCtrl: onpause called");
        $interval.cancel($rootScope.eventQueryInterval);
        $interval.cancel(intervalHandle);
      
        // $interval.cancel(modalIntervalHandle);

        // FIXME: Do I need to  setAwake(false) here?
    }


    function onResume() {
        
        // FIXME: Do we need to resume timers? when you resume, you go to portal and then here
      /*
        if (!$scope.isModalActive) {
            var ld = ZMDataModel.getLogin();
            
            
            ZMDataModel.zmDebug("MontageHistoryCtrl: onresume called");
            ZMDataModel.zmLog("Restarting eventQuery timer on resume");
            
            console.log ("************** TIMER STARTED INSIDE RESUME ***************");
            
            //$rootScope.rand = Math.floor((Math.random() * 100000) + 1);
            $interval.cancel($rootScope.eventQueryInterval);
            $rootScope.eventQueryInterval = $interval(function () {
                checkAllEvents();
                //  console.log ("Refreshing Image...");
            }.bind(this),zm.eventHistoryTimer);
        } else // modal is active
        {
            // $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);
        }*/




    }

    $scope.openMenu = function () {
        $timeout(function () {
            $rootScope.stateofSlide = $ionicSideMenuDelegate.isOpen();
        }, 500);

        $ionicSideMenuDelegate.toggleLeft();
    };

    $scope.$on('$destroy', function () {
       ZMDataModel.zmDebug("Cancelling eventQueryInterval");
        $interval.cancel($rootScope.eventQueryInterval);
        
       
        
        
    });


    $scope.$on('$ionicView.loaded', function () {
        //console.log("**VIEW ** MontageHistoryCtrl Loaded");
    });

    $scope.$on('$ionicView.enter', function () {
        ZMDataModel.zmDebug("**VIEW ** MontageHistory Ctrl Entered, Starting loadNotifications");
        var ld = ZMDataModel.getLogin();
        //console.log("Setting Awake to " + ZMDataModel.getKeepAwake());
        ZMDataModel.setAwake(ZMDataModel.getKeepAwake());
        
        $interval.cancel($rootScope.eventQueryInterval);
        //console.log ("****************** TIMER STARTED INSIDE ENTER");
        $rootScope.eventQueryInterval = $interval(function () {
            checkAllEvents();
            //  console.log ("Refreshing Image...");
        }.bind(this),  zm.eventHistoryTimer);
        
        
        

       
    });
    
    /*$scope.$on ('$ionicView.unloaded', function() {
        console.log ("******** HISTORY UNLOADED KILLING WINDOW ************");
        window.stop();
    });*/

        
     $scope.$on('$ionicView.beforeEnter', function () {
         
       //  ZMDataModel.zmLog ("Before Enter History: initing connkeys");
         
          
         
         
         
     });
    
    $scope.$on('$ionicView.beforeLeave', function () {
        //console.log("**VIEW ** Event History Ctrl Left, force removing modal");
        if ($scope.modal) $scope.modal.remove();
        
        
        ZMDataModel.zmLog ("BeforeLeave: Nullifying the streams...");
        
        for (i=0; i< $scope.MontageMonitors.length; i++)
        {
            var element = document.getElementById("img-"+i);
            /*if (element)
            {
                ZMDataModel.zmDebug("BeforeLeave: Nullifying  " + element.src);
                element.src="";
                //element.removeAttribute('src');
                
                //$scope.$apply(nullify(element));
                //element.src="";
            }*/
            
        }
        
        
        
        ZMDataModel.zmLog("Cancelling event query timer");
        $interval.cancel($rootScope.eventQueryInterval);
        
        ZMDataModel.zmLog ("MontageHistory:Stopping network pull...");
        // make sure this is applied in scope digest to stop network pull
        // thats why we are doing it beforeLeave
        
        for ( i=0; i<$scope.MontageMonitors.length; i++)
        {
            if ($scope.MontageMonitors[i].Monitor.connKey !='' &&
                $scope.MontageMonitors[i].Monitor.eventUrl !='img/noevent.png' &&
                $scope.MontageMonitors[i].Monitor.Function !='None' &&
                $scope.MontageMonitors[i].Monitor.lisDisplay!='noshow' &&
                $scope.MontageMonitors[i].Monitor.Enabled !='0')
            {
                ZMDataModel.zmLog ("Before leave: Calling kill with " + $scope.MontageMonitors[i].Monitor.connKey);
                var tmpCK = angular.copy($scope.MontageMonitors[i].Monitor.connKey);
                timedControlEventStream(2500,17,"",tmpCK,-1);
            }
        }   
        
        ZMDataModel.zmLog ("Forcing a window.stop() here");
        ZMDataModel.stopNetwork("MontageHistory-beforeLeave");
        
        
        
        
    });

    $scope.$on('$ionicView.unloaded', function () {
       
    });

    //---------------------------------------------------------
    // This function readjusts  montage size
    //  and stores current size to persistent memory
    //---------------------------------------------------------

    function processSliderChanged(val) {
        if (sizeInProgress) return;

        sizeInProgress = true;
        //console.log('Size has changed');
        ZMDataModel.setMontageSize(val);
        //console.log("ZMData Montage is " + ZMDataModel.getMontageSize() +
         //   " and slider montage is " + $scope.slider.monsize);
        // Now go ahead and reset sizes of entire monitor array
        var monsizestring = "";
        var i;
        for (i = 0; i < $scope.monitors.length; i++) {

            $scope.monitorSize[i] = parseInt(ZMDataModel.getMontageSize());
            //console.log("Resetting Monitor " + i + " size to " + $scope.monitorSize[i]);
            $scope.scaleDirection[i] = 1;
            monsizestring = monsizestring + $scope.monitorSize[i] + ':';
        }
        monsizestring = monsizestring.slice(0, -1); // kill last :
        //console.log("Setting monsize string:" + monsizestring);
        loginData.montageArraySize = monsizestring;
        ZMDataModel.setLogin(loginData);
        //window.localStorage.setItem("montageArraySize", monsizestring);
        sizeInProgress = false;
    }
    
 

  

    $scope.$on('$ionicView.afterEnter', function () {
        // This rand is really used to reload the monitor image in img-src so it is not cached
        // I am making sure the image in montage view is always fresh
        // I don't think I am using this anymore FIXME: check and delete if needed
        // $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
    });

    $scope.reloadView = function () {
        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
        ZMDataModel.zmLog("User action: image reload " + $rootScope.rand);
    };

    $scope.doRefresh = function () {



        //console.log("***Pull to Refresh, recomputing Rand");
        ZMDataModel.zmLog("Reloading view for montage view, recomputing rand");
        $rootScope.rand = Math.floor((Math.random() * 100000) + 1);
        $scope.monitors = [];
        imageLoadingDataShare.set(0);

        var refresh = ZMDataModel.getMonitors(1);

        refresh.then(function (data) {
            $scope.monitors = data;
            $scope.$broadcast('scroll.refreshComplete');
        });
    };


}]);