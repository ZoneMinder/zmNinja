// Common Controller for the montage view
/* jshint -W041 */
/* jslint browser: true*/
/* global saveAs, cordova,StatusBar,angular,console,ionic, moment, imagesLoaded, chrome */

angular.module('zmApp.controllers').controller('MonitorModalCtrl', ['$scope', '$rootScope', 'zm', 'NVRDataModel', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$q', '$sce', 'carouselUtils', '$ionicPopup', 'SecuredPopups', '$translate', function($scope, $rootScope, zm, NVRDataModel, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $q, $sce, carouselUtils, $ionicPopup, SecuredPopups, $translate)
{

    $scope.animationInProgress = false;
    $scope.imageFit = true;
    $scope.isModalActive = true;
    var intervalModalHandle;
    var cycleHandle;
    var nphTimer;
    var ld = NVRDataModel.getLogin();
    $scope.svgReady = false;
    $scope.zoneArray = [];
    var originalZones = [];
    $scope.isZoneEdit = false;
    var _moveStart = false;
    var targetID = "";
    $scope.imageZoomable = true;


    $scope.csize = ($rootScope.platformOS == 'desktop') ? 10:20;


     window.addEventListener("resize", function(){imageLoaded();}, false);


    $rootScope.authSession = "undefined";

    $ionicLoading.show(
    {
        template: $translate.instant('kNegotiatingStreamAuth') + '...',
        animation: 'fade-in',
        showBackdrop: true,
        duration: zm.loadingTimeout,
        maxWidth: 300,
        showDelay: 0
    });

    $scope.currentStreamMode = 'single';
    NVRDataModel.log("Using stream mode " + $scope.currentStreamMode);

    NVRDataModel.debug("MonitorModalCtrl called from " + $ionicHistory.currentStateName());

    $rootScope.validMonitorId = $scope.monitors[0].Monitor.Id;
    NVRDataModel.getAuthKey($rootScope.validMonitorId, $scope.monitors[0].Monitor.connKey)
        .then(function(success)
            {
                $ionicLoading.hide();
                $rootScope.authSession = success;
                NVRDataModel.log("Modal: Stream authentication construction: " + $rootScope.authSession);

            },
            function(error)
            {

                $ionicLoading.hide();
                NVRDataModel.debug("ModalCtrl: Error details of stream auth:" + error);
                //$rootScope.authSession="";
                NVRDataModel.log("Modal: Error returned Stream authentication construction. Retaining old value of: " + $rootScope.authSession);
            });

    $interval.cancel(intervalModalHandle);
    $interval.cancel(cycleHandle);

    intervalModalHandle = $interval(function()
    {
        loadModalNotifications();
        //  console.log ("Refreshing Image...");
    }.bind(this), 5000);

    $timeout.cancel(nphTimer);
    nphTimer = $timeout(function()
    {
        $scope.currentStreamMode = 'jpeg';
        NVRDataModel.log("Switching playback via nphzms");
    }, zm.nphSwitchTimer);

    // This is the PTZ menu

    $scope.ptzRadialMenuOptions = {
        content: '',

        background: '#2F4F4F',
        isOpen: true,
        toggleOnClick: false,
        button:
        {
            cssClass: "fa  fa-arrows-alt",
        },
        items: [
            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function()
                {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'Down');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function()
                {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'DownLeft');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,

                onclick: function()
                {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'Left');
                }
            },
            {
                content: 'D',
                empty: true,

                onclick: function()
                {
                    // console.log('About');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function()
                {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'UpLeft');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function()
                {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'Up');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function()
                {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'UpRight');
                }
            },

            {
                content: 'H',
                empty: true,
                onclick: function()
                {
                    //console.log('About');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function()
                {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'Right');
                }
            },

            {
                content: '',
                cssClass: 'fa fa-chevron-circle-up',
                empty: false,
                onclick: function()
                {
                    controlPTZ($scope.monitorId, $scope.ptzMoveCommand + 'DownRight');
                }
            },

            {
                content: 'K',
                empty: true,
                onclick: function()
                {
                    //console.log('About');
                }
            },
        ]
    };

    //-------------------------------------------------------------
    // On re-auth, we need a new zms
    //-------------------------------------------------------------

    $rootScope.$on("auth-success", function()
    {

        NVRDataModel.debug("MonitorModalCtrl: Re-login detected, resetting everything & re-generating connkey");
        NVRDataModel.stopNetwork("MonitorModal-auth success");
        $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();

    });

    $scope.cast = function(mid, mon) {

    };

    //----------------------------------
    // toggles monitor cycling
    //----------------------------------
    $scope.toggleCycle = function()
    {
        //console.log ("HERE");
        $scope.isCycle = !$scope.isCycle;
        var ld = NVRDataModel.getLogin();
        ld.cycleMonitors = $scope.isCycle;
        NVRDataModel.setLogin(ld);
        $scope.cycleText = $scope.isCycle ? $translate.instant('kOn') : $translate.instant('kOff');

        if ($scope.isCycle)
        {
            NVRDataModel.log("re-starting cycle timer");
            $interval.cancel(cycleHandle);

            cycleHandle = $interval(function()
            {
                moveToMonitor($scope.monitorId, 1);
                //  console.log ("Refreshing Image...");
            }.bind(this), ld.cycleMonitorsInterval * 1000);
        }
        else
        {
            NVRDataModel.log("cancelling cycle timer");
            $interval.cancel(cycleHandle);
        }

    };

    //-------------------------------------------------------------
    // PTZ enable/disable
    //-------------------------------------------------------------

    $scope.togglePTZ = function()
    {

        //console.log("PTZ");

        if ($scope.isControllable == '1')
        {
            //console.log ("iscontrollable is true");
            $scope.showPTZ = !$scope.showPTZ;

        }
        else
        {
            $ionicLoading.show(
            {
                template: $translate.instant('kPTZnotConfigured'),
                noBackdrop: true,
                duration: 3000,
            });
        }

    };

    //-------------------------------------------------------------
    // Pause and resume handlers
    //-------------------------------------------------------------

    function onPause()
    {
        NVRDataModel.debug("ModalCtrl: onpause called");
        $interval.cancel(intervalModalHandle);
        $interval.cancel(cycleHandle);
        // $interval.cancel(modalIntervalHandle);

        // FIXME: Do I need to  setAwake(false) here?
    }

    function onResume()
    {
        NVRDataModel.debug("ModalCtrl: Modal resume called");
        if ($scope.isModalActive)
        {
            NVRDataModel.log("ModalCtrl: Restarting Modal timer on resume");

            $interval.cancel(intervalModalHandle);
            $interval.cancel(cycleHandle);

            var ld = NVRDataModel.getLogin();

            intervalModalHandle = $interval(function()
            {
                loadModalNotifications();
            }.bind(this), 5000);

            if (ld.cycleMonitors)
            {
                NVRDataModel.debug("Cycling enabled at " + ld.cycleMonitorsInterval);

                $interval.cancel(cycleHandle);

                cycleHandle = $interval(function()
                {
                    moveToMonitor($scope.monitorId, 1);
                    //  console.log ("Refreshing Image...");
                }.bind(this), ld.cycleMonitorsInterval * 1000);

            }

            $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);

        }

    }

    //-------------------------------------------------------------
    // Queries the 1.30 API for recording state of current monitor
    //-------------------------------------------------------------
    function loadModalNotifications()
    {

        if (NVRDataModel.versionCompare($rootScope.apiVersion, "1.30") == -1)
        {

            return;
        }

        if (NVRDataModel.getLogin().enableLowBandwidth)
            return;

        var status = [$translate.instant('kMonIdle'),
            $translate.instant('kMonPreAlarm'),
            $translate.instant('kMonAlarmed'),
            $translate.instant('kMonAlert'),
            $translate.instant('kMonRecord')
        ];
        //console.log ("Inside Modal timer...");
        var apiurl = NVRDataModel.getLogin().apiurl;
        var alarmurl = apiurl + "/monitors/alarm/id:" + $scope.monitorId + "/command:status.json";
        NVRDataModel.log("Invoking " + alarmurl);

        $http.get(alarmurl)
            .then(function(data)
                {
                    //  NVRDataModel.debug ("Success in monitor alarmed status " + JSON.stringify(data));

                    $scope.monStatus = status[parseInt(data.data.status)];

                },
                function(error)
                {

                    $scope.monStatus = "";
                    NVRDataModel.debug("Error in monitor alarmed status ");
                });

    }

    //-------------------------------------------------------------
    // Enable/Disable preset list
    //-------------------------------------------------------------

    $scope.togglePresets = function()
    {
        $scope.presetOn = !$scope.presetOn;

        if ($scope.presetOn)
        {
            $scope.controlToggle = "hide buttons";
        }
        else
        {
            $scope.controlToggle = "show buttons";
        }
        //console.log("Changing preset to " + $scope.presetOn);

        var element = angular.element(document.getElementById("presetlist"));
        // bring it in
        if ($scope.presetOn)
        {
            element.removeClass("animated fadeOutUp");

        }
        else
        {
            element.removeClass("animated fadeInDown");
            element.addClass("animated fadeOutUp");
        }

    };


    $scope.saveZones = function()
    {
        var str="";
        for (var i=0; i < originalZones.length; i++)
        {
            str = str + "o:"+originalZones[i].coords+"<br/>n:"+$scope.zoneArray[i].coords+"--------------------------------------------------<br/>";

        }

        $rootScope.zmPopup = SecuredPopups.show('confirm',
            {
                title: 'Sure',
                template: str,
                okText: $translate.instant('kButtonOk'),
                cancelText: $translate.instant('kButtonCancel'),
            });

    };

    $scope.changeCircleSize = function()
    {
        $scope.csize = Math.max (($scope.csize + 5) % 31, 10);

    };

    $scope.toggleZoneEdit = function()
    {
        $scope.isZoneEdit = !$scope.isZoneEdit;
        
        
         $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();

        
        if ($scope.isZoneEdit)
        {
             $ionicScrollDelegate.$getByHandle("imgscroll").zoomTo(1, true);
             $scope.imageZoomable = false;
             //document.getElementById("imgscroll").zooming="false";

            for (var i=0; i < $scope.circlePoints.length; i++)
            {
                var t = document.getElementById("circle-"+i);
                if (t)
                {
                    t.removeEventListener("touchstart",moveStart);
                    t.removeEventListener("mousedown",moveStart);
                    //t.removeEventListener("mousemove",moveContinue);
                    //t.removeEventListener("mouseup",moveStop);


                    t.addEventListener("touchstart",moveStart); 
                    t.addEventListener("mousedown",moveStart); 
                    //t.addEventListener("mousemove",moveContinue);
                    //t.addEventListener("mouseup",moveStop);


                    console.log ("Found circle-"+i);   
                }
                else
                {
                    console.log ("did not find circle-"+i);
                }
                
            }
        }
        else // get out of edit
        {

            $scope.imageZoomable = true;
        }

    };

    $scope.toggleZone = function()
    {
        $scope.showZones = !$scope.showZones;
        if (!$scope.showZones)
            $scope.isZoneEdit = false;
    };

    $scope.imageLoaded = function()
    {
        imageLoaded();
    };

    $scope.checkZoom = function()
    {
        //var z = $ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom;
        //imageLoaded();

    };

    $scope.circleTouch = function (evt)
    {
        console.log ("TOUCH");
    };

    //$scope.circleOnDrag = function (evt, ndx)
    function recomputePolygons (ax, ay, ndx,z)
    {

       
        // we get screen X/Y - need to translate
        // to SVG points
        console.log ("recompute with",ax,"&",ay);
        var svg=document.getElementById('zsvg');
        var pt = svg.createSVGPoint();
        pt.x = ax;
        pt.y = ay;
        var svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

        $scope.circlePoints[ndx].x = Math.round(svgP.x);
        $scope.circlePoints[ndx].y = Math.round(svgP.y);

        // get related polygon set
        var zi = $scope.circlePoints[ndx].zoneIndex;
        var newPoints="";
        for ( var i=0; i < $scope.circlePoints.length; i++)
        {
            if ($scope.circlePoints[i].zoneIndex == zi)
            {
                newPoints = newPoints  + " " +$scope.circlePoints[i].x+","+$scope.circlePoints[i].y;
            }
            console.log ("recomputed polygon:", newPoints);
        }
       // console.log ("OLD ZONE FOR:"+zi+" is "+$scope.zoneArray[zi].coords );
        //console.log ("NEW ZONE FOR:"+zi+" is "+newPoints);
        $scope.zoneArray[zi].coords = newPoints;

        //console.log ("INDEX="+ndx+" DRAG="+svgP.x+":"+svgP.y);

    }

    // credit: http://stackoverflow.com/questions/41411891/most-elegant-way-to-parse-scale-and-re-string-a-string-of-number-co-ordinates?noredirect=1#41411927
    // This function scales coords of zones based on current image size
    function scaleCoords(string, sx, sy) {
        var f = [sx, sy];
        return string.split(' ').map(function (a) {
            return a.split(',').map(function (b, i) {
                return Math.round(b * f[i]);
            }).join(',');
        }).join(' ');
    }

    function moveContinue(event)
    {
        if (!_moveStart) {return;}
        
            console.log ("CONTINUE: target id="+targetID);
            

            /*if(event.preventDefault) event.preventDefault();
            if (event.gesture) event.gesture.preventDefault() ;
            if (event.gesture) event.gesture.stopPropagation();*/

            var x,y;

            var z = $ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom;
            console.log ("zoom is:"+z);
           
            //console.log(event, this, "t");
            if (event.touches)
            {
                //console.log ("TOUCH");
                x = event.targetTouches[0].pageX;
                y = event.targetTouches[0].pageY;
                
            }
            else
            {
                //console.log ("MOUSE");
                x = event.clientX  ;
                y = event.clientY  ;


            }
            
          
            console.log ("X="+x+" Y="+y + " sl="+document.body.scrollLeft+ " sy="+document.body.scrollTop);
            $timeout (function() {recomputePolygons (x,y,targetID,1);});


    }

    function moveStop (event)
    {
        _moveStart = false;
        console.log ("STOP");
    }

    function moveStart(event)
    {
        
            _moveStart=true;
            targetID = event.target.id.substring(7);
            console.log ("START: target id="+targetID);

            if(event.preventDefault) event.preventDefault();
            if (event.gesture) event.gesture.preventDefault() ;
            if (event.gesture) event.gesture.stopPropagation();

            var z = $ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom;
            console.log ("zoom is:"+z);

            var x,y;
            // perhaps event.targetTouches[0]?
            if (event.touches)
            {
                //console.log(event.changedTouches[0], this, "t");
                x  = event.touches[0].pageX;
                y  = event.touches[0].pageY;

            }
            else
            {
                //console.log(event, this, "t");
                x = event.clientX ;
                y = event.clientY  ;

            }
            console.log ("X="+x+" Y="+y + " sl="+document.body.scrollLeft+ " sy="+document.body.scrollTop);

    }
    

    // called when the live monitor image loads
    // this is a good time to calculate scaled zone points
    function imageLoaded()
    {
        
        var img =document.getElementById("singlemonitor");

        //$scope.cw = img.naturalWidth;
        //$scope.ch = img.naturalHeight;
        
        $scope.cw = img.naturalWidth;
        $scope.ch = img.naturalHeight;

        //console.log ("REPORTED DIM:" + $scope.cw+ "x"+$scope.ch );
        //console.log ("ORIGINAL DIM:" + img.naturalWidth+ "x"+img.naturalHeight);
        //https://server/zm/api/zones/forMonitor/7.json
        //
        $scope.zoneArray = [];
        $scope.circlePoints = [];

        var ow = $scope.monitor.Monitor.Width;
        var oh = $scope.monitor.Monitor.Height;

       // console.log ("MONITOR IS: "+JSON.stringify($scope.monitor));

       // console.log ("ORIGINAL WH="+ow+"x"+oh);

        for (var i=0; i < originalZones.length; i++)
        {
            var sx = $scope.cw/ow;
            var sy = $scope.ch/oh;
            //$scope.zoneArray.push({
               // coords:scaleCoords(originalZones[i].coords,sx,sy),
             //   type:originalZones[i].type});
             $scope.zoneArray.push({
                coords:originalZones[i].coords,
                type:originalZones[i].type});
      
      
        }

        // now create a points array for circle handles
        for (i=0; i < $scope.zoneArray.length; i++)
        {
            /*jshint loopfunc: true */
            console.log ("ZONE ARRAY="+$scope.zoneArray[i].coords);
             $scope.zoneArray[i].coords.split(' ')
             .forEach( function(itm) 
                { 
                    var o=itm.split(','); 
                    $scope.circlePoints.push({x:o[0],y:o[1], zoneIndex:i});
                     
                   // console.log ("CIRCLE X="+o[0]+"Y="+o[1]);
                });            

        }






    }

    //-------------------------------------------------------------
    // this is checked to make sure we are not pulling images
    // when app is in background. This is a problem with Android,
    // for example
    //-------------------------------------------------------------

    $scope.isBackground = function()
    {
        // console.log ("Is background called from ModalCtrl and returned " +    
        // NVRDataModel.isBackground());
        return NVRDataModel.isBackground();
    };

    //-------------------------------------------------------------
    // Send PTZ command to ZM
    // Note: PTZ fails on desktop, don't bother about it
    //-------------------------------------------------------------

    $scope.controlPTZ = function(monitorId, cmd)
    {
        console.log ("PTZ command is"+cmd);
        controlPTZ(monitorId, cmd);
    };

    function controlPTZ(monitorId, cmd)
    {

        //presetGotoX
        //presetHome
        //curl -X POST "http://server.com/zm/index.php?view=request" -d
        //"request=control&user=admin&passwd=xx&id=4&control=moveConLeft"

        if ($scope.ptzMoveCommand=="undefined")
        {
            $ionicLoading.show(
            {
                template: $translate.instant('kPTZNotReady'),
                noBackdrop: true,
                duration: 2000,
            });
            return;
        }

        var ptzData = "";
        if (cmd.lastIndexOf("preset", 0) === 0)
        {
            NVRDataModel.debug("PTZ command is a preset, so skipping xge/lge");
            ptzData = {
                view: "request",
                request: "control",
                id: monitorId,
                control: cmd,
                //  xge: "30", //wtf
                //  yge: "30", //wtf
            };

        }
        else
        {

            ptzData = {
                view: "request",
                request: "control",
                id: monitorId,
                control: cmd,
                xge: "30", //wtf
                yge: "30", //wtf
            };
        }

        //console.log("Command value " + cmd + " with MID=" + monitorId);
        //console.log("PTZDATA is " + JSON.stringify(ptzData));
        $ionicLoading.hide();
        $ionicLoading.show(
        {
            template: $translate.instant('kPleaseWait') + "...",
            noBackdrop: true,
            duration: zm.loadingTimeout,
        });

        var loginData = NVRDataModel.getLogin();
        $ionicLoading.hide();
        $ionicLoading.show(
        {
            template: $translate.instant('kSendingPTZ') + "...",
            noBackdrop: true,
            duration: zm.loadingTimeout,
        });

        var req = $http(
        {
            method: 'POST',
            /*timeout: 15000,*/
            url: loginData.url + '/index.php',
            headers:
            {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            transformRequest: function(obj)
            {
                var str = [];
                for (var p in obj)
                    str.push(encodeURIComponent(p) + "=" +
                        encodeURIComponent(obj[p]));
                var foo = str.join("&");
                //console.log("****RETURNING " + foo);
                return foo;
            },

            data: ptzData

        });

        req.success(function(resp)
        {
            $ionicLoading.hide();

        });

        req.error(function(resp)
        {
            $ionicLoading.hide();
            //console.log("ERROR: " + JSON.stringify(resp));
            NVRDataModel.log("Error sending PTZ:" + JSON.stringify(resp), "error");
        });
    }

    $scope.getZoomLevel = function()
    {
        //console.log("ON RELEASE");
        var zl = $ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition();
        //console.log(JSON.stringify(zl));
    };

    $scope.onTap = function(m, d)
    {

        moveToMonitor(m, d);
    };

    $scope.onSwipe = function(m, d)
    {
        if ($scope.isZoneEdit)
        {
            NVRDataModel.log ("swipe disabled as you are in edit mode");
            return;
        }
        var ld = NVRDataModel.getLogin();
        if (!ld.canSwipeMonitors) return;

        if ($ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom != 1)
        {
            //console.log("Image is zoomed in - not honoring swipe");
            return;
        }
        $scope.monStatus = "";
        moveToMonitor(m, d);

    };

    function moveToMonitor(m, d)
    {

        if ($scope.isZoneEdit)
        {
            NVRDataModel.log ("Not cycling, as you are editing zones");
        }
        var curstate = $ionicHistory.currentStateName();
        var found = 0;
        var mid;
        mid = NVRDataModel.getNextMonitor(m, d);

        $scope.showPTZ = false;

        // FIXME: clean this up - in a situation where
        // no monitors are enabled, will it loop for ever?
        do {
            mid = NVRDataModel.getNextMonitor(m, d);
            m = mid;
            //console.log("Next Monitor is " + m);

            found = 0;
            for (var i = 0; i < $scope.monitors.length; i++)
            {
                if ($scope.monitors[i].Monitor.Id == mid &&
                    // if you came from monitors, then ignore noshow
                    ($scope.monitors[i].Monitor.listDisplay != 'noshow' || curstate == "monitors") &&
                    $scope.monitors[i].Monitor.Function != 'None' &&
                    $scope.monitors[i].Monitor.Enabled != '0')
                {
                    found = 1;
                    //console.log(mid + "is part of the monitor list");
                    NVRDataModel.debug("ModalCtrl: swipe detected, moving to " + mid);
                    break;
                }
                else
                {
                    NVRDataModel.debug("skipping " + $scope.monitors[i].Monitor.Id +
                        " listDisplay=" + $scope.monitors[i].Monitor.listDisplay +
                        " Function=" + $scope.monitors[i].Monitor.Function +
                        " Enabled=" + $scope.monitors[i].Monitor.Enabled);
                }
            }

        }
        while (found != 1);

        var slidein;
        var slideout;
        var dirn = d;
        if (dirn == 1)
        {
            slideout = "animated slideOutLeft";
            slidein = "animated slideInRight";
        }
        else
        {
            slideout = "animated slideOutRight";
            slidein = "animated slideInLeft";
        }

        var element = angular.element(document.getElementById("monitorimage"));
        element.addClass(slideout)
            .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', outWithOld);

        function outWithOld()
        {

            NVRDataModel.log("ModalCtrl:Stopping network pull...");
            NVRDataModel.stopNetwork("MonitorModal-outwithOld");
            $scope.rand = Math.floor((Math.random() * 100000) + 1);
            $scope.animationInProgress = true;

            $timeout(function()
            {
                element.removeClass(slideout);
                element.addClass(slidein)
                    .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', inWithNew);
                $scope.monitorId = mid;
                $scope.monitorName = NVRDataModel.getMonitorName(mid);
                $scope.monitor = NVRDataModel.getMonitorObject(mid);
                $scope.zoneArray=[];
                $scope.circlePoints=[];
                getZones();
                configurePTZ($scope.monitorId);
            }, 200);
        }

        function inWithNew()
        {

            element.removeClass(slidein);
            $scope.animationInProgress = false;

            NVRDataModel.log("New image loaded in");
            var ld = NVRDataModel.getLogin();
            carouselUtils.setStop(false);
            if (ld.useNphZms == true)
            {
                $scope.currentStreamMode = 'single';
                NVRDataModel.log("Setting timer to play nph-zms mode");
                // first 5 seconds, load a snapshot, then switch to real FPS display
                // this is to avoid initial image load delay
                // FIXME: 5 seconds fair?
                $timeout.cancel(nphTimer);
                nphTimer = $timeout(function()
                {
                    $scope.currentStreamMode = 'jpeg';
                    NVRDataModel.log("Switching playback via nphzms");
                }, zm.nphSwitchTimer);
            }

        }

        $ionicLoading.hide();

    }

    //-----------------------------------------------------------------------
    // Sucess/Error handlers for saving a snapshot of the
    // monitor image to phone storage
    //-----------------------------------------------------------------------

    function SaveSuccess()
    {
        $ionicLoading.show(
        {
            template: $translate.instant('kDone'),
            noBackdrop: true,
            duration: 1000
        });
        NVRDataModel.debug("ModalCtrl:Photo saved successfuly");
    }

    function SaveError(e)
    {
        $ionicLoading.show(
        {
            template: $translate.instant('kErrorSave'),
            noBackdrop: true,
            duration: 2000
        });
        NVRDataModel.log("Error saving image: " + e);
        //console.log("***ERROR");
    }

    //-------------------------------------------------------------
    // Turns on or off an alarm forcibly (mode true = on, false = off)
    //-------------------------------------------------------------
    $scope.enableAlarm = function(mid, mode)
    {

        if (mode) // trigger alarm
        {
            $rootScope.zmPopup = SecuredPopups.show('show',
            {
                title: 'Confirm',
                template: $translate.instant('kForceAlarmConfirm') + $scope.monitorName + "?",
                buttons: [
                {
                    text: $translate.instant('kButtonYes'),
                    onTap: function(e)
                    {
                        enableAlarm(mid, mode);
                    }
                },
                {
                    text: $translate.instant('kButtonNo'),
                    onTap: function(e)
                    {
                        return;
                    }
                }]

            });
        }
        else
            enableAlarm(mid, mode);

        function enableAlarm(mid, mode)
        {
            var apiurl = NVRDataModel.getLogin().apiurl;
            var c = mode ? "on" : "off";
            var alarmurl = apiurl + "/monitors/alarm/id:" + mid + "/command:" + c + ".json";
            NVRDataModel.log("Invoking " + alarmurl);

            var status = mode ? $translate.instant('kForcingAlarm') : $translate.instant('kCancellingAlarm');
            $ionicLoading.show(
            {
                template: status,
                noBackdrop: true,
                duration: zm.largeHttpTimeout,
            });

            $http.get(alarmurl)
                .then(function(data)
                    {
                        $ionicLoading.show(
                        {
                            template: $translate.instant('kSuccess'),
                            noBackdrop: true,
                            duration: 2000,
                        });
                    },
                    function(error)
                    {

                        $ionicLoading.show(
                        {
                            template: $translate.instant('kAlarmAPIError'),
                            noBackdrop: true,
                            duration: 3000,
                        });
                        NVRDataModel.debug("Error in enableAlarm " + JSON.stringify(error));
                    });
        }

    };

    //-----------------------------------------------------------------------
    // color for monitor state
    //-----------------------------------------------------------------------

    $scope.stateColor = function()
    {
        var status = [$translate.instant('kMonIdle'),
            $translate.instant('kMonPreAlarm'),
            $translate.instant('kMonAlarmed'),
            $translate.instant('kMonAlert'),
            $translate.instant('kMonRecord')
        ];
        //console.log ("***MONSTATUS**"+$scope.monStatus+"**");
        var color = "";
        switch ($scope.monStatus)
        {
            case "":
                color = "background-color:none";
                break;
            case status[0]:
                color = "background-color:#4B77BE";
                break;
            case status[1]:
                color = "background-color:#e67e22";
                break;
            case status[2]:
                color = "background-color:#D91E18";
                break;
            case status[3]:
                color = "background-color:#e67e22";
                break;
            case status[4]:
                color = "background-color:#26A65B";
                break;
        }

        return "padding-left:4px;padding-right:4px;" + color;
    };

    //-----------------------------------------------------------------------
    // Saves a snapshot of the monitor image to phone storage
    //-----------------------------------------------------------------------

    $scope.saveImageToPhoneWithPerms = function(mid)
    {
        if ($rootScope.platformOS != 'android')
        {
            saveImageToPhone(mid);
            return;
        }

        NVRDataModel.debug("ModalCtrl: Permission checking for write");
        var permissions = cordova.plugins.permissions;
        permissions.hasPermission(permissions.WRITE_EXTERNAL_STORAGE, checkPermissionCallback, null);

        function checkPermissionCallback(status)
        {
            if (!status.hasPermission)
            {
                SaveError("No permission to write to external storage");
            }
            permissions.requestPermission(permissions.WRITE_EXTERNAL_STORAGE, succ, err);
        }

        function succ(s)
        {
            saveImageToPhone(mid);
        }

        function err(e)
        {
            SaveError("Error in requestPermission");
        }
    };

    function saveImageToPhone(mid)
    {
        $ionicLoading.show(
        {
            template: $translate.instant('kSavingSnapshot') + '...',
            noBackdrop: true,
            duration: zm.httpTimeout
        });

        NVRDataModel.debug("ModalCtrl: SaveImageToPhone called");
        var canvas, context, imageDataUrl, imageData;
        var loginData = NVRDataModel.getLogin();
        var url = loginData.streamingurl +
            '/zms?mode=single&monitor=' + mid +
            $rootScope.authSession;
        NVRDataModel.log("SavetoPhone:Trying to save image from " + url);

        var img = new Image();
        img.onload = function()
        {
            // console.log("********* ONLOAD");
            canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);

            imageDataUrl = canvas.toDataURL('image/jpeg', 1.0);
            imageData = imageDataUrl.replace(/data:image\/jpeg;base64,/, '');

            if ($rootScope.platformOS != "desktop")
            {
                try
                {

                    cordova.exec(
                        SaveSuccess,
                        SaveError,
                        'Canvas2ImagePlugin',
                        'saveImageDataToLibrary', [imageData]
                    );
                }
                catch (e)
                {

                    SaveError(e.message);
                }
            }
            else
            {

                var fname = $scope.monitorName + "-" +
                    moment().format('MMM-DD-YY_HH-mm-ss') + ".png";
                canvas.toBlob(function(blob)
                {
                    saveAs(blob, fname);
                    SaveSuccess();

                });
            }
        };
        try
        {
            img.src = url;
            // console.log ("SAVING IMAGE SOURCE");
        }
        catch (e)
        {
            SaveError(e.message);

        }
    }

    //-------------------------------------------------------------
    //reloaads mon - do we need it?
    //-------------------------------------------------------------

    $scope.reloadView = function()
    {
        NVRDataModel.log("Reloading view for modal view, recomputing rand");
        $rootScope.modalRand = Math.floor((Math.random() * 100000) + 1);
        $scope.isModalActive = true;
    };

    $scope.scaleImage = function()
    {

        $scope.imageFit = !$scope.imageFit;
        if ($scope.imageFit) 
            $scope.aspectFit="xMidYMid meet";
        else
            $scope.aspectFit = "xMidYMid slice";

        // console.log("Switching image style to " + $scope.imageFit);
    };

    $scope.$on('$ionicView.enter', function()
    {

        //https://server/zm/api/zones/forMonitor/X.json

    });

    $scope.$on('$ionicView.leave', function()
    {
        // console.log("**MODAL: Stopping modal timer");
        $scope.isModalActive = false;
        $interval.cancel(intervalModalHandle);
        $interval.cancel(cycleHandle);
    });

    $scope.$on('$ionicView.beforeLeave', function()
    {

        NVRDataModel.log("Nullifying the streams...");

        var element = document.getElementById("singlemonitor");
        if (element)
        {
            NVRDataModel.debug("Nullifying  " + element.src);
            element.src = "";
        }

    });

    $scope.$on('$ionicView.unloaded', function()
    {
        $scope.isModalActive = false;

        $interval.cancel(intervalModalHandle);
        $interval.cance(cycleHandle);

    });

    $scope.$on('modal.removed', function()
    {
        $scope.isModalActive = false;
        //console.log("**MODAL REMOVED: Stopping modal timer");
        $interval.cancel(intervalModalHandle);
        $interval.cancel(cycleHandle);

        NVRDataModel.debug("Modal removed - killing connkey");
        controlStream(17, "", $scope.connKey, -1);

        // Execute action
    });

    //-------------------------------------------------------------
    // called to kill connkey, not sure if we really need it
    // I think we are calling window.stop() which is a hammer
    // anyway 
    //-------------------------------------------------------------

    function controlStream(cmd, disp, connkey, ndx)
    {
        // console.log("Command value " + cmd);

        if (disp)
        {
            $ionicLoading.hide();
            $ionicLoading.show(
            {
                template: $translate.instant('kPleaseWait') + '...',
                noBackdrop: true,
                duration: zm.loadingTimeout,
            });
        }
        var loginData = NVRDataModel.getLogin();

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
        var CMD_QUIT = 17;
        var CMD_QUERY = 99;
        */

        var myauthtoken = $rootScope.authSession.replace("&auth=", "");
        //&auth=
        var req = $http(
        {
            method: 'POST',
            /*timeout: 15000,*/
            url: loginData.url + '/index.php',
            headers:
            {
                'Content-Type': 'application/x-www-form-urlencoded',
                //'Accept': '*/*',
            },
            transformRequest: function(obj)
            {
                var str = [];
                for (var p in obj)
                    str.push(encodeURIComponent(p) + "=" +
                        encodeURIComponent(obj[p]));
                var foo = str.join("&");
                //console.log("****RETURNING " + foo);
                return foo;
            },

            data:
            {
                view: "request",
                request: "stream",
                connkey: connkey,
                command: cmd,
                auth: myauthtoken,

            }
        });
        req.success(function(resp)
        {

            if (resp.result == "Ok" && ndx != -1)
            {
                var ld = NVRDataModel.getLogin();
                var apiurl = ld.apiurl + "/events/" + resp.status.event + ".json";
                //console.log ("API " + apiurl);
                $http.get(apiurl)
                    .success(function(data)
                    {
                        if ($scope.MontageMonitors[ndx].eventUrlTime != data.event.Event.StartTime)
                        {

                            var element = angular.element(document.getElementById($scope.MontageMonitors[ndx].Monitor.Id + "-timeline"));
                            element.removeClass('animated slideInRight');
                            element.addClass('animated slideOutRight');
                            $timeout(function()
                            {
                                element.removeClass('animated slideOutRight');
                                element.addClass('animated slideInRight');
                                $scope.MontageMonitors[ndx].eventUrlTime = data.event.Event.StartTime;
                            }, 300);

                        }

                    })
                    .error(function(data)
                    {
                        $scope.MontageMonitors[ndx].eventUrlTime = "-";
                    });

            }

        });

        req.error(function(resp)
        {
            //console.log("ERROR: " + JSON.stringify(resp));
            NVRDataModel.log("Error sending event command " + JSON.stringify(resp), "error");
        });
    }

    $scope.toggleListMenu = function()
    {

        
        $scope.isToggleListMenu = !$scope.isToggleListMenu;
        //console.log ("isToggleListMenu:"+$scope.isToggleListMenu);
    };

    //-------------------------------------------------------------
    // Zoom in and out via +- for desktops
    //-------------------------------------------------------------
    $scope.zoomImage = function(val)
    {

        if ($scope.isZoneEdit)
        {
            $ionicLoading.show(
            {
                //template: $translate.instant('kError'),
                template: 'zoom disabled in zone edit mode',
                noBackdrop: true,
                duration: 2000
            });

            return;
        }
        var zl = parseInt($ionicScrollDelegate.$getByHandle("imgscroll").getScrollPosition().zoom);
        if (zl == 1 && val == -1)
        {
            NVRDataModel.debug("Already zoomed out max");
            return;
        }

        zl += val;
        NVRDataModel.debug("Zoom level is " + zl);
        $ionicScrollDelegate.$getByHandle("imgscroll").zoomTo(zl, true);

    };

    //-------------------------------------------------------------
    // Retrieves PTZ state for each monitor
    //-------------------------------------------------------------
    // make sure following are correct:
    // $scope.isControllable 
    // $scope.controlid
    // 
    function configurePTZ(mid)
    {
        $scope.presetAndControl = $translate.instant('kMore');
        $scope.ptzWakeCommand = "";
        $scope.ptzSleepCommand = "";
        $scope.ptzResetCommand = "";

        $scope.ptzMoveCommand = "undefined";
        $scope.ptzStopCommand = "";

        $scope.zoomInCommand = "";
        $scope.zoomOutCommand = "";
        $scope.zoomStopCommand = "zoomStop";
        $scope.canZoom = false;

        $scope.presetOn = true;
        $scope.controlToggle = "hide buttons";

        NVRDataModel.debug("configurePTZ: called with mid=" + mid);
        var ld = NVRDataModel.getLogin();
        var url = ld.apiurl + "/monitors/" + mid + ".json";
        $http.get(url)
            .success(function(data)
            {
                $scope.isControllable = data.monitor.Monitor.Controllable;

                // *** Only for testing - comment out //
                //$scope.isControllable = '1';
                // for testing only
                // $scope.isControllable = 1;
                $scope.controlid = data.monitor.Monitor.ControlId;
                if ($scope.isControllable == '1')
                {

                    var apiurl = NVRDataModel.getLogin().apiurl;
                    var myurl = apiurl + "/controls/" + $scope.controlid + ".json";
                    NVRDataModel.debug("configurePTZ : getting controllable data " + myurl);

                    $http.get(myurl)
                        .success(function(data)
                        {

                            // *** Only for testing - comment out  - start//
                            /*data.Control.Control.CanSleep = '1';
                            data.Control.Control.CanWake = '1';
                            data.Control.Control.CanReset = '1';
                            data.Control.Control.CanZoom = '1';
                            data.control.Control.HasPresets = '1';
                            data.control.Control.HasHomePreset = '1';*/
                            // *** Only for testing - comment out - end //

                            $scope.ptzMoveCommand = "move"; // start with as move;
                            $scope.ptzStopCommand = "";

                            console.log ("GOT CONTROL "+JSON.stringify(data.control.Control));

                            if (data.control.Control.CanZoom == '1')
                            {
                                $scope.canZoom = true;
                                if (data.control.Control.CanZoomCon == '1')
                                {
                                    $scope.zoomInCommand = "zoomConTele";
                                    $scope.zoomOutCommand = "zoomConWide";

                                }
                                else if (data.control.Control.CanZoomRel == '1')
                                {
                                    $scope.zoomInCommand = "zoomRelTele";
                                    $scope.zoomOutCommand = "zoomRelWide";
                                }
                                else if (data.control.Control.CanZoomAbs == '1')
                                {
                                    $scope.zoomInCommand = "zoomRelAbs";
                                    $scope.zoomOutCommand = "zoomRelAbs";
                                }
                            }

                            NVRDataModel.debug("configurePTZ: control data returned " + JSON.stringify(data));


                            if (data.control.Control.CanMoveMap == '1')
                            {

                                //seems moveMap uses Up/Down/Left/Right, 
                                // so no prefix
                                $scope.ptzMoveCommand = "";
                                $scope.ptzStopCommand = "moveStop";
                                console.log ("MoveAbs set");
                            }

                            if (data.control.Control.CanMoveAbs == '1')
                            {

                                $scope.ptzMoveCommand = "moveAbs";
                                $scope.ptzStopCommand = "moveStop";
                                console.log ("MoveAbs set");
                            }

                            if (data.control.Control.CanMoveRel == '1')
                            {

                                $scope.ptzMoveCommand = "moveRel";
                                $scope.ptzStopCommand = "moveStop";
                            }

                            

                            // Prefer con over rel if both enabled
                            // I've tested con

                            if (data.control.Control.CanMoveCon == '1')
                            {

                                $scope.ptzMoveCommand = "moveCon";
                                $scope.ptzStopCommand = "moveStop";
                            }
                            //CanMoveMap

                            // presets
                            NVRDataModel.debug("ConfigurePTZ Preset value is " + data.control.Control.HasPresets);
                            $scope.ptzPresets = [];

                            if (data.control.Control.HasPresets == '1')
                            {
                                //$scope.presetAndControl = $translate.instant('kPresets');

                                $scope.ptzPresetCount = parseInt(data.control.Control.NumPresets);
                            //$scope.ptzPresetCount =80;

                                NVRDataModel.debug("ConfigurePTZ Number of presets is " + $scope.ptzPresetCount);

                                for (var p = 0; p < $scope.ptzPresetCount; p++)
                                {
                                    $scope.ptzPresets.push(
                                    {
                                        name: (p + 1).toString(),
                                        icon: '',
                                        cmd: "presetGoto" + (p + 1).toString(),
                                        style: 'button-royal'
                                    });

                                }

                                if (data.control.Control.HasHomePreset == '1')
                                {
                                    $scope.ptzPresets.unshift(
                                    {
                                        name: '',
                                        icon: "ion-ios-home",
                                        cmd: 'presetHome',
                                        style: 'button-royal'
                                    });

                                }

                            }
                            /*else
                            {
                                $scope.presetAndControl = $translate.instant('kMore');
                            }*/
                            // lets add these to the end
                            // strictly speaking, they aren't really presets, but meh for now

                            // no need to darken these buttons if presets are not there
                            var buttonAccent = "button-dark";
                            if ($scope.ptzPresets.length == 0)
                            {
                                buttonAccent = "";
                            }

                            if (data.control.Control.CanWake == '1')
                            {

                                $scope.ptzPresets.push(
                                {
                                    name: 'W',
                                    icon: "ion-eye",
                                    cmd: 'wake',
                                    style: 'button-royal ' + buttonAccent
                                });

                            }

                            if (data.control.Control.CanSleep == '1')
                            {
                                $scope.ptzPresets.push(
                                {
                                    name: 'S',
                                    icon: "ion-eye-disabled",
                                    cmd: 'sleep',
                                    style: 'button-royal ' + buttonAccent
                                });

                            }

                            if (data.control.Control.CanReset == '1')
                            {
                                $scope.ptzPresets.push(
                                {
                                    name: 'R',
                                    icon: "ion-ios-loop-strong",
                                    cmd: 'reset',
                                    style: 'button-royal ' + buttonAccent
                                });

                            }

                            NVRDataModel.log("ConfigurePTZ Modal: ControlDB reports PTZ command to be " + $scope.ptzMoveCommand);
                        })
                        .error(function(data)
                        {
                            //  console.log("** Error retrieving move PTZ command");
                            NVRDataModel.log("ConfigurePTZ : Error retrieving PTZ command  " + JSON.stringify(data), "error");
                        });

                }
                else
                {
                    NVRDataModel.log("configurePTZ " + mid + " is not PTZ controllable");
                }
            })
            .error(function(data)
            {
                //  console.log("** Error retrieving move PTZ command");
                NVRDataModel.log("configurePTZ : Error retrieving PTZ command  " + JSON.stringify(data), "error");
            });

    }

    function getZones()
    {
        //https://server/zm/api/zones/forMonitor/7.json
        var api = NVRDataModel.getLogin().apiurl+"/zones/forMonitor/"+$scope.monitorId+".json";
        NVRDataModel.debug ("Getting zones using:"+api);
        originalZones = [];
        $http.get (api)
        .then (function (succ) {
            console.log (JSON.stringify(succ));
            for (var i=0; i < succ.data.zones.length; i++)
            {
                originalZones.push ({
                    coords:succ.data.zones[i].Zone.Coords, 
                    area: succ.data.zones[i].Zone.Area,
                    type:succ.data.zones[i].Zone.Type});
            }

        },
        function (err) {
            NVRDataModel.debug ("Error getting zones :"+JSON.stringify(err));

        });

    }

    $scope.$on('modal.shown', function()
    {

        $scope.monStatus = "";
        $scope.isToggleListMenu = true;
        //console.log (">>>>>>>>>>>>>>>>>>>STOOOP");
        document.addEventListener("pause", onPause, false);
        document.addEventListener("resume", onResume, false);

        /*document.addEventListener("mouseup", moveStop, false);
        document.addEventListener("touchend", moveStop, false);

        document.addEventL`istener("mousemove", moveContinue, false);
        document.addEventListener("touchmove", moveContinue, false);*/

        


        $scope.showZones = false;

        getZones();

        var ld = NVRDataModel.getLogin();
        //currentEvent = $scope.currentEvent;
        $scope.connKey = (Math.floor((Math.random() * 999999) + 1)).toString();
        //console.log ("************* GENERATED CONNKEY " + $scope.connKey);
        $scope.currentFrame = 1;
        $scope.monStatus = "";
        $scope.isCycle = ld.cycleMonitors;
        $scope.cycleText = $scope.isCycle ? $translate.instant('kOn') : $translate.instant('kOff');

        $scope.quality = (NVRDataModel.getBandwidth() == "lowbw") ? zm.monSingleImageQualityLowBW : ld.monSingleImageQuality;

        configurePTZ($scope.monitorId);

        if (ld.cycleMonitors)
        {
            NVRDataModel.debug("Cycling enabled at " + ld.cycleMonitorsInterval);

            $interval.cancel(cycleHandle);

            cycleHandle = $interval(function()
            {
                moveToMonitor($scope.monitorId, 1);
                //  console.log ("Refreshing Image...");
            }.bind(this), ld.cycleMonitorsInterval * 1000);

        }

    });

}]);
