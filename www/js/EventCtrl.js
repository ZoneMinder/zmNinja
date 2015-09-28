/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console,moment */

// This is the controller for Event view. StateParams is if I recall the monitor ID.
// This was before I got access to the new APIs. FIXME: Revisit this code to see what I am doing with it
// and whether the new API has a better mechanism

angular.module('zmApp.controllers')
    .controller('zmApp.EventCtrl', ['$scope', '$rootScope', 'zm', 'ZMDataModel', 'message', '$ionicSideMenuDelegate', '$timeout', '$interval', '$ionicModal', '$ionicLoading', '$http', '$state', '$stateParams', '$ionicHistory', '$ionicScrollDelegate', '$ionicPlatform', '$ionicSlideBoxDelegate', '$ionicPosition', '$ionicPopover', '$ionicPopup',function ($scope, $rootScope, zm, ZMDataModel, message, $ionicSideMenuDelegate, $timeout, $interval, $ionicModal, $ionicLoading, $http, $state, $stateParams, $ionicHistory, $ionicScrollDelegate, $ionicPlatform, $ionicSlideBoxDelegate, $ionicPosition, $ionicPopover, $ionicPopup) {

        // events in last 5 minutes
        // TODO https://server/zm/api/events/consoleEvents/5%20minute.json

        //---------------------------------------------------
        // Controller main
        //---------------------------------------------------
        
        $scope.hours = [];
        $scope.days = [];
        $scope.weeks = [];
        $scope.months = [];
        
        $scope.eventList = {showDelete:false};
        
        $scope.slides = []; // will hold scrub frames
        var segmentHandle = 0; // holds timer for progress bar
        $scope.totalEventTime = 0; // used to display max of progress bar
        $scope.currentEventTime = 0;
        var oldEvent = ""; // will hold previous event that had showScrub = true
        var scrollbynumber = 0;
        $scope.eventsBeingLoaded = true;
        $scope.FrameArray = []; // will hold frame info from detailed Events API

        document.addEventListener("pause", onPause, false);
        console.log("I got STATE PARAM " + $stateParams.id);
        $scope.id = parseInt($stateParams.id, 10);
        $scope.connKey = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
       

        $ionicPopover.fromTemplateUrl('templates/events-popover.html', {
            scope: $scope,
        }).then(function (popover) {
            $scope.popover = popover;
        });

        // These are the commands ZM uses to move around
        // in ZMS - not used anymore as I am doing direct
        // image access via image.php
        var eventCommands = {
            next: "13",
            previous: "12",
            zoomin: "8",
            zoomout: "9",
            stop: "3",
            pause: "1",
            play: "2",
            fastFwd: "4",
            slowFwd: "5",
            fastRev: "7",
            slowRev: "6"
        };

        var eventImageDigits = 5; // failsafe
        ZMDataModel.getKeyConfigParams(0)
            .then(function (data) {
                //console.log ("***GETKEY: " + JSON.stringify(data));
                eventImageDigits = parseInt(data);
                ZMDataModel.zmLog("Image padding digits reported as " + eventImageDigits);
            });


        $scope.showSearch = false;
        var eventsPage = 1;
        var moreEvents = true;
        $scope.viewTitle = {
            title: ""
        };
        $scope.search = {
            text: ""
        };
        $scope.myfilter = "";
        $scope.eventCommands = eventCommands;
        $scope.loginData = ZMDataModel.getLogin();

        $scope.mycarousel = {
            index: 0
        };
        $scope.ionRange = {
            index: 1
        };


        // for some reason inifinite scroll is invoked
        // before I actually load the first page with page count
        // this makes scrolling stop as eventsPage is still 0
        // FIXME: This is a hack

        var pageLoaded = false;
        var enableLoadMore = true;

        // When loading images, it sometimes takes time -  the images can be quite
        // large. What practically was happening was you'd see a blank screen for a few
        // seconds. Not a good UX. So what I am doing is when the events modal or
        // monitor modal is loaded, I show an ionic loading. And then when the first frame
        // finishes loading, I take it away

        console.log("***CALLING EVENTS FACTORY");
        var lData = ZMDataModel.getLogin();
        $scope.monitors = message;

        // I am converting monitor ID to monitor Name
        // so I can display it along with Events
        // Is there a better way?

        $scope.events = [];

        // First get total pages and then
        // start from the latest. If this fails, nothing displays
        
        ZMDataModel.zmDebug ("EventCtrl: grabbing # of event pages");
        ZMDataModel.getEventsPages($scope.id, $rootScope.fromString, $rootScope.toString)
            .then(function (data) {
                eventsPage = data.pageCount;
                ZMDataModel.zmDebug ("EventCtrl: found " + eventsPage + " pages of events");
                //console.log("TOTAL EVENT PAGES IS " + eventsPage);
                pageLoaded = true;
                $scope.viewTitle.title = data.count;
                ZMDataModel.zmDebug ("EventCtrl: grabbing events for: id="+$scope.id+" Date/Time:" + $rootScope.fromString +
                                     "-" + $rootScope.toString);
                ZMDataModel.getEvents($scope.id, eventsPage, "", $rootScope.fromString, $rootScope.toString)
                    .then(function (data) {
                        console.log("EventCtrl Got events");
                        //var events = [];
                        
                        var myevents = data;
                        ZMDataModel.zmDebug ("EventCtrl: success, got " + myevents.length + " events");
                        var loginData = ZMDataModel.getLogin();
                        for (var i = 0; i < myevents.length; i++) {

                            myevents[i].Event.MonitorName = ZMDataModel.getMonitorName(myevents[i].Event.MonitorId);
                            myevents[i].Event.ShowScrub = false;
                            myevents[i].Event.height = zm.eventsListDetailsHeight;
                            // now construct base path

                            var str = myevents[i].Event.StartTime;
                            //var yy =  moment(str).format('h:mm:ssa on MMMM Do YYYY');
                            var yy = moment(str).format('YY');
                            var mm = moment(str).format('MM');
                            var dd = moment(str).format('DD');
                            var hh = moment(str).format('HH');
                            var min = moment(str).format('mm');
                            var sec = moment(str).format('ss');

                            myevents[i].Event.BasePath = loginData.url + "/events/" +
                                myevents[i].Event.MonitorId + "/" +
                                yy + "/" +
                                mm + "/" +
                                dd + "/" +
                                hh + "/" +
                                min + "/" +
                                sec + "/";

                            myevents[i].Event.relativePath =
                                myevents[i].Event.MonitorId + "/" +
                                yy + "/" +
                                mm + "/" +
                                dd + "/" +
                                hh + "/" +
                                min + "/" +
                                sec + "/";
                            
                            if (i==0) // just for debug sampling to see what we are getting
                            {
                                ZMDataModel.zmDebug ("EventCtrl: Sample data from first event: " + JSON.stringify(myevents[i]));
                            }

                        } //for

                        
                        $scope.events = myevents;
                        // we only need to stop the template from loading when the list is empty
                        // so this can be false once we have _some_ content
                        // FIXME: check reload
                        $scope.eventsBeingLoaded = false;
                        // to avoid only few events being displayed
                        // if last page has less events
                        //console.log("**Loading Next Page ***");
                        if (myevents.length < 50) 
                        {
                            ZMDataModel.zmDebug("EventCtrl:loading one more page just in case we don't have enough to display");
                            loadMore();
                        }
                    });

            });

        // not explictly handling error --> I have a default "No events found" message
        // displayed in the template if events list is null
        
        
        $scope.showEvents = function(val,unit,monitorId)
        {
            ZMDataModel.zmDebug("ShowEvents called with val:"+val+" unit:"+unit+" for Monitor:"+monitorId);
                                
             $ionicHistory.nextViewOptions({
        disableBack: true
    });
            
        var mToDate = moment();
        
        var mFromDate = moment().subtract(parseInt(val),unit);
        
        console.log ("Moment Dates:" + mFromDate.format() + " TO  " + mToDate.format());
            
        $rootScope.fromTime = mFromDate.toDate();
        $rootScope.toTime =mToDate.toDate();
        $rootScope.fromDate = $rootScope.fromTime;
        $rootScope.toDate = $rootScope.toTime;
            
        ZMDataModel.zmDebug ("From: " + $rootScope.fromTime);
        ZMDataModel.zmDebug ("To: " + $rootScope.toTime);
            
        //$rootScope.fromDate = fromDate.toDate();
        //$rootScope.toDate = toDate.toDate();
        $rootScope.isEventFilterOn = true;
       $rootScope.fromString = mFromDate
           .format("YYYY-MM-DD") + " " + mFromDate.format ("HH:mm:ss");

     $rootScope.toString = mToDate
         .format("YYYY-MM-DD") + " " + mToDate
         .format ("HH:mm:ss");

            
            console.log ("**************From String: " + $rootScope.fromString);
            console.log ("**************To String: " + $rootScope.toString);
            
            $state.go("events", {"id":monitorId});
        };
        
        
        $scope.deleteEvent = function (id, itemid)
    {
            //$scope.eventList.showDelete = false;
        //curl -XDELETE http://server/zm/api/events/1.json
        var loginData = ZMDataModel.getLogin();
        var apiDelete =  loginData.apiurl + "/events/" + id + ".json";
        ZMDataModel.zmDebug("DeleteEvent: ID="+id+" item="+itemid);
         ZMDataModel.zmLog("Delete event " + apiDelete);
         $http.delete(apiDelete)
         .success(function(data)
         {
             ZMDataModel.zmDebug ("delete success: " + JSON.stringify(data));
             ZMDataModel.displayBanner ('info', ['deleted event'],2000,2000);
             
             
             /*var element = angular.element(document.getElementById("item-"+itemid));
              element.addClass("eventDeleteSpeed animated  slideOutLeft")
              .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', 
                   
                    function () {
                       // element.removeClass("animated slideOutLeft");
                    });
             $ionicScrollDelegate.$getByHandle("mainScroll").resize();*/
           
                            $scope.events.splice(itemid, 1);
                            //doRefresh();
                            
         })
         .error (function (data)
         {
             ZMDataModel.zmDebug ("delete error: " + JSON.stringify(data));
             ZMDataModel.displayBanner ('error', ['could not delete event', 'please check logs']);
         });
        
        
    };
        
        //------------------------------------------------
        // Tapping on the filter sign lets you reset it
        //-------------------------------------------------
        
        $scope.filterTapped = function()
        {
            console.log ("FILTER TAPPED");
            var myFrom = moment($rootScope.fromString).format("MMM/DD/YYYY hh:mm a").toString();
            var toString = moment($rootScope.toString).format("MMM/DD/YYYY hh:mm a").toString();
            
               var confirmPopup = $ionicPopup.confirm({
                 title: 'Filter settings',
                 template: 'You are viewing Events between:<br/> <b>' + myFrom + "</b> to <b>" + toString +'</b><br/>Do you want to delete this filter?'
               });
               confirmPopup.then(function(res) {
                 if(res) {
                   ZMDataModel.zmLog("Filter reset requested in popup");
                    $rootScope.isEventFilterOn = false;
                    $rootScope.fromDate = "";
                    $rootScope.fromTime= "";
                    $rootScope.toDate = "";
                    $rootScope.toTime="";
                    $rootScope.fromString="";
                    $rootScope.toString="";
                   $ionicHistory.nextViewOptions({
                                disableBack: true
                            });
                    $state.go("events", {"id":0});
                 } else {
                   ZMDataModel.zmLog("Filter reset cancelled in popup");
                 }
               });

        };
        
        $scope.footerExpand = function()
        {
            //https://server/zm/api/events/consoleEvents/5%20minute.json
            var ld = ZMDataModel.getLogin();
            
            var apiurl = ld.apiurl + "/events/consoleEvents/1%20hour.json";
            $http.get(apiurl)
            .success(function(data) {
                ZMDataModel.zmDebug(JSON.stringify(data));
                $scope.hours = [];
                var p = data.results;
                for (var key in data.results)
                {
                    if (p.hasOwnProperty(key)) {
                        //console.log(ZMDataModel.getMonitorName(key) + " -> " + p[key]);
                        $scope.hours.push(
                            {monitor:ZMDataModel.getMonitorName(key),
                             events:p[key], mid:key});
                        
                    }
                }
            });
            
            
            apiurl = ld.apiurl + "/events/consoleEvents/1%20day.json";
            $http.get(apiurl)
            .success(function(data) {
                ZMDataModel.zmDebug(JSON.stringify(data));
                $scope.days = [];
                var p = data.results;
                for (var key in data.results)
                {
                    if (p.hasOwnProperty(key)) {
                        //console.log(ZMDataModel.getMonitorName(key) + " -> " + p[key]);
                        $scope.days.push(
                            {monitor:ZMDataModel.getMonitorName(key),
                             events:p[key],mid:key});
                        
                    }
                }
            });

            
            
             apiurl = ld.apiurl + "/events/consoleEvents/1%20week.json";
            $http.get(apiurl)
            .success(function(data) {
                ZMDataModel.zmDebug(JSON.stringify(data));
                $scope.weeks = [];
                var p = data.results;
                for (var key in data.results)
                {
                    if (p.hasOwnProperty(key)) {
                        //console.log(ZMDataModel.getMonitorName(key) + " -> " + p[key]);
                        $scope.weeks.push(
                            {monitor:ZMDataModel.getMonitorName(key),
                             events:p[key],mid:key});
                        
                    }
                }
            });
            
            
            apiurl = ld.apiurl + "/events/consoleEvents/1%20month.json";
            $http.get(apiurl)
            .success(function(data) {
                ZMDataModel.zmDebug(JSON.stringify(data));
                $scope.months = [];
                var p = data.results;
                for (var key in data.results)
                {
                    if (p.hasOwnProperty(key)) {
                        //console.log(ZMDataModel.getMonitorName(key) + " -> " + p[key]);
                        $scope.months.push(
                            {monitor:ZMDataModel.getMonitorName(key),
                             events:p[key],mid:key});
                        
                    }
                }
            });
            
            
            
            
            
        };

        $scope.calcMsTimer = function (frames, len) {
            var myframes, mylen;
            myframes = parseFloat(frames);
            mylen = parseFloat(len);
            //  console.log ("frames " + myframes + "length " + mylen);
            //  console.log ("*** MS COUNT " + (1000.0/(myframes/mylen)));
            return (Math.round(1000 / (myframes / mylen)));
        };

        $scope.openMenu = function () {
            $ionicSideMenuDelegate.toggleLeft();
        };

        $scope.scrollPosition = function () {
            var scrl = parseFloat($ionicScrollDelegate.$getByHandle("mainScroll").getScrollPosition().top);
            var item = Math.round(scrl / zm.eventsListDetailsHeight);
            if ($scope.events[item] == undefined) {
                return "";
            } else {
                return prettifyDate($scope.events[item].Event.StartTime);
            }
            //return Math.random();
        };

        //-------------------------------------------------------------------------
        // called when user switches to background
        //-------------------------------------------------------------------------
        function onPause() {
            ZMDataModel.zmDebug ("EventCtrl:onpause called");
            console.log("*** Moving to Background ***"); // Handle the pause event
            console.log("*** CANCELLING INTERVAL ****");
            if ($scope.popover) $scope.popover.remove();
            $interval.cancel(segmentHandle);
            // FIXME: Do I need to  setAwake(false) here?
        }
        //-------------------------------------------------------------------------
        // Pads the filename with leading 0s, depending on  ZM_IMAGE_DIGITS
        //-------------------------------------------------------------------------
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


        //-------------------------------------------------------------------------
        // FIXME: Are we using this?
        //-------------------------------------------------------------------------
        $scope.disableSlide = function () {
            ZMDataModel.zmDebug ("EventCtrl:DisableSlide called");
            $ionicSlideBoxDelegate.$getByHandle("eventSlideBox").enableSlide(false);
        };

        //-------------------------------------------------------------------------
        // I use ion-range to scrub the frames. ion-range uses a text field as
        // value whereas rn-carousel-index expects int, so instead of messing around
        // I am keeping the trackers separate and then using a watch to keep
        // them in sync while doing format conversion.
        //-------------------------------------------------------------------------
        $scope.$watch('ionRange.index', function () {
            // console.log ("***ION RANGE CHANGED");

            $scope.mycarousel.index = parseInt($scope.ionRange.index) - 1;
        });

        $scope.$watch('mycarousel.index', function () {

            $scope.ionRange.index = ($scope.mycarousel.index + 1).toString();
        });


        //-------------------------------------------------------------------------
        // This function is called when a user enables or disables
        // scrub view for an event.
        //-------------------------------------------------------------------------

        $scope.toggleGroup = function (event, ndx, frames) {
            toggleGroup(event, ndx, frames);
        };

        function toggleGroup(event, ndx, frames) {

            // If we are here and there is a record of a previous scroll
            // then we need to scroll back to hide that view
            if (scrollbynumber) {
                $ionicScrollDelegate.$getByHandle("mainScroll").scrollBy(0, -1 * scrollbynumber, true);
                scrollbynumber = 0;
            }

            if (oldEvent && event != oldEvent) {
                console.log("SWITCHING OLD EVENT OFF");
                ZMDataModel.zmDebug ("EventCtrl:Old event scrub will hide now");
                oldEvent.Event.ShowScrub = false;
                oldEvent.Event.height = zm.eventsListDetailsHeight;
                oldEvent = "";
            }

            event.Event.ShowScrub = !event.Event.ShowScrub;
            // $ionicScrollDelegate.resize();

            if (event.Event.ShowScrub == true) // turn on display now
            {
                ZMDataModel.zmDebug ("EventCtrl: Scrubbing will turn on now");
                //$ionicScrollDelegate.freezeScroll(true);
                $ionicSideMenuDelegate.canDragContent(false);
                $scope.slider_options = {
                    from: 1,
                    to: event.Event.Frames,
                    realtime: true,
                    step: 1,
                    className: "mySliderClass",
                    callback: function (value, released) {
                        //console.log("CALLBACK"+value+released);
                        $ionicScrollDelegate.freezeScroll(!released);
                        ZMDataModel.zmDebug ("EventCtrl: freezeScroll called with " + !released);


                    },
                    //modelLabels:function(val) {return "";},
                    css: {
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
                    },
                    scale: []

                };

                event.Event.height = zm.eventsListDetailsHeight + zm.eventsListScrubHeight;
                $ionicScrollDelegate.resize();
                $scope.mycarousel.index = 0;
                $scope.ionRange.index = 1;
                //console.log("**Resetting range");
                $scope.slides = [];
                var i;
                ZMDataModel.zmDebug ("EventCtrl: found " + frames + " frames to scrub");
                for (i = 1; i <= frames; i++) {
                    var fname = padToN(i, eventImageDigits) + "-capture.jpg";
                    $scope.slides.push({
                        id: i,
                        img: fname
                    });

                }
                // now get event details to show alarm frames
                var loginData = ZMDataModel.getLogin();
                var myurl = loginData.apiurl + '/events/' + event.Event.Id + ".json";
                ZMDataModel.zmLog("API for event details" + myurl);
                $http.get(myurl)
                    .success(function (data) {
                        $scope.FrameArray = data.event.Frame;
                        //  $scope.slider_options.scale=[];
                        $scope.slider_options.scale = [];
                        //$scope.slider_options.modelLabels={2:'X'};
                        //$scope.slider_options.dimension="arjun";
                        var i;
                        for (i = 0; i < data.event.Frame.length; i++) {
                            if (data.event.Frame[i].Type == "Alarm") {
                                
                                //console.log ("**ALARM AT " + i);
                                $scope.slider_options.scale.push({
                                    val: i + 1,
                                    label: ' '
                                });
                            } else {
                                //$scope.slider_options.scale.push(' ');
                            }

                        }

                        //console.log (JSON.stringify(data));
                    })
                    .error(function (err) {
                        ZMDataModel.zmLog("Error retrieving detailed frame API " + JSON.stringify(err));
                        ZMDataModel.displayBanner('error', ['could not retrieve frame details', 'please try again']);
                    });


                oldEvent = event;
                $rootScope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
                var elem = angular.element(document.getElementById("item-" + ndx));
                var locobject = $ionicPosition.offset(elem);
                //console.log(JSON.stringify(locobject));
                var toplocation = parseInt(locobject.top);
                var objheight = parseInt(locobject.height);
                console.log("top location is " + toplocation);
                var distdiff = parseInt($rootScope.devHeight) - toplocation - objheight;
                console.log("*****Space at  bottom is " + distdiff);

                if (distdiff < zm.eventsListScrubHeight) // size of the scroller with bars
                {
                    scrollbynumber = zm.eventsListScrubHeight - distdiff;
                    $ionicScrollDelegate.$getByHandle("mainScroll").scrollBy(0, scrollbynumber, true);

                    // we need to scroll up to make space
                }

            } else {
                // $ionicScrollDelegate.freezeScroll(false);
                $ionicSideMenuDelegate.canDragContent(true);
                event.Event.height = zm.eventsListDetailsHeight;
                $ionicScrollDelegate.resize();

                if (scrollbynumber) {
                    $ionicScrollDelegate.$getByHandle("mainScroll").scrollBy(0, -1 * scrollbynumber, true);
                    scrollbynumber = 0;
                }
                // we are turning off, so scroll by back
            }

        }

        $scope.closeIfOpen = function (event) {
            if (event != undefined) {
                if (event.Event.ShowScrub)
                    toggleGroup(event);

            }
        };

        $scope.isGroupShown = function (event) {
            //  console.log ("IS SHOW INDEX is " + ndx);
            //console.log ("SHOW GROUP IS " + showGroup);

            return (event == undefined) ? false : event.Event.ShowScrub;

        };

        //---------------------------------------------------
        // reload view
        //---------------------------------------------------
        $scope.reloadView = function () {
            // All we really need to do here is change the random token
            // in the image src and it will refresh. No need to reload the view
            // and if you did reload the view, it would go back to events list
            // which is the view - and when you are in the modal it will go away
            console.log("*** Refreshing Modal view ***");
            //$state.go($state.current, {}, {reload: true});
            $rootScope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
            $ionicLoading.show({
                template: "refreshed view",
                noBackdrop: true,
                duration: 3000
            });

        };

        //---------------------------------------------------
        // when you tap a list entry - to break search loop
        //---------------------------------------------------
        $scope.tapped = function () {
            console.log("*** TAPPED ****");
            // if he tapped, the we are not infinite loading on ion-infinite
            if (enableLoadMore == false) {
                moreEvents = true;
                enableLoadMore = true;
                console.log("REMOVING ARTIFICAL LOAD MORE BLOCK");
            }
        };

        $scope.$on('$ionicView.loaded', function () {
            console.log("**VIEW ** Events Ctrl Loaded");
        });

        //-------------------------------------------------------------------------
        // Lets make sure we set screen dim properly as we enter
        // The problem is we enter other states before we leave previous states
        // from a callback perspective in ionic, so we really can't predictably
        // reset power state on exit as if it is called after we enter another
        // state, that effectively overwrites current view power management needs
        //------------------------------------------------------------------------
        $scope.$on('$ionicView.enter', function () {
            console.log("**VIEW ** Events Ctrl Entered");
            ZMDataModel.setAwake(false);
        });

        $scope.$on('$ionicView.leave', function () {
            console.log("**VIEW ** Events Ctrl Left");
        });

        $scope.$on('$ionicView.unloaded', function () {
            console.log("**VIEW ** Events Ctrl Unloaded");
            console.log("*** MODAL ** Destroying modal too");
            if ($scope.modal !== undefined) {
                $scope.modal.remove();
            }

        });

        //---------------------------------------------------
        // used to hide loading image toast
        //---------------------------------------------------
        $scope.finishedLoadingImage = function (ndx) {
            //  console.log("*** Events image FINISHED loading index: "+ndx+"***");
            $ionicLoading.hide();
        };

        //---------------------------------------------------
        //
        //---------------------------------------------------
        $scope.clearSearch = function () {
            $scope.search.text = "";
        };

        //---------------------------------------------------
        // Called when user toggles search
        //---------------------------------------------------
        $scope.searchClicked = function () {
            $scope.showSearch = !$scope.showSearch;
            // this helps greatly in repeat scroll gets
            if ($scope.showSearch == false)
                $scope.search.text = "";

            console.log("**** Setting search view to " + $scope.showSearch + " ****");
            if (enableLoadMore == false && $scope.showSearch == false) {
                moreEvents = true;
                enableLoadMore = true;
                console.log("REMOVING ARTIFICAL LOAD MORE BLOCK");
            }
        };

        //--------------------------------------------------------
        // Not used - plan to use it to show event progress
        //--------------------------------------------------------
        function segmentCheck() {
            if ($scope.totalEventTime == 0) {

                console.log("No events to play");
                return;
            }
            if ($scope.currentEventTime >= $scope.totalEventTime) {
                console.log("Total event duration reached");
                $scope.currentEventTime = $scope.totalEventTime;
                return;
            }

            // false == don't show ionic loadings, a query is a background job
            controlEventStream("99", false);
            //console.log("Duration: " + $scope.currentEventTime + " of " + $scope.totalEventTime);


            // ./skins/classic/views/event.php panelSection
        }

        //--------------------------------------------------------
        // this routine handles skipping through events
        // in different event views
        //--------------------------------------------------------

        function controlEventStream(cmd, disp) {
            // console.log("Command value " + cmd);

            if (disp) {
                $ionicLoading.hide();
                $ionicLoading.show({
                    template: "please wait...",
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
            var toast_blurb = "";
            switch (cmd) {
                case "13":
                    toast_blurb = "moving to ";
                    $scope.totalEventTime = 0;


                    break;
                case "12":
                    toast_blurb = "moving to ";
                    $scope.totalEventTime = 0;
                    break;
                case "8":
                    toast_blurb = "zoomed into ";
                    break;
                case "9":
                    toast_blurb = "zoomed out of ";
                    break;
                case "3":
                    toast_blurb = "stopping playback for ";

                    break;
                case "2":
                    toast_blurb = "resuming playback for ";

                    break;
                case "1":
                    toast_blurb = "pausing playback for ";

                    break;
                case "4":
                    toast_blurb = "fast forward ";

                    break;
                case "5":
                    toast_blurb = "slow forward ";
                    break;
                case "6":
                    toast_blurb = "slow rewind ";
                    break;
                case "7":
                    toast_blurb = "fast rewind ";
                    break;
            }


            // You need to POST commands to control zms
            // Note that I am url encoding the parameters into the URL
            // If I leave it as JSON, it gets converted to OPTONS due
            // to CORS behaviour and ZM/Apache don't seem to handle it

            //console.log("POST: " + loginData.url + '/index.php');

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
                    connkey: $scope.connKey,
                    command: cmd,
                    user: loginData.username,
                    pass: loginData.password
                }
            });
            req.success(function (resp) {

                console.log("SUCCESS: " + JSON.stringify(resp));
                var str = toast_blurb + "event:" + resp.status.event;
                // console.log(str);
                // $ionicLoading.hide();

                if (disp == true) {
                    $ionicLoading.show({
                        template: str,
                        noBackdrop: true,
                        duration: 2000
                    });
                }

                // 99 is CMD_QUERY its a convenient way to know where I am in the event playback
                // takes care of speed etc so I don't have to worry about it
                if (cmd == '99') {
                    $scope.currentEventTime = Math.round(parseFloat(resp.status.progress));
                }

                if (cmd == '12' || cmd == '13') {
                    console.log("New event, so recomputing");
                    var newevent = resp.status.event;
                    console.log("**** EXTRACTED EVENT ****" + newevent);
                    var ld = ZMDataModel.getLogin();
                    var myurl = ld.apiurl + "/events/" + newevent + ".json";
                    $http.get(myurl)
                        .success(function (data) {
                            $scope.totalEventTime = Math.round(parseFloat(data.event.Event.Length)) - 1;
                            $scope.currentEventTime = 0;



                        })
                        .error(function (err) {
                            console.log("Error : " + JSON.stringify(err));
                            ZMDataModel.zmLog("Error getting timing info for new event " + newevent + ":" + JSON.stringify(err));
                            $scope.totalEventTime = 0;

                        });
                }

            });

            req.error(function (resp) {
                console.log("ERROR: " + JSON.stringify(resp));
                ZMDataModel.zmLog("Error sending event command " + JSON.stringify(resp), "error");
            });
        }


        $scope.controlEventStream = function (cmd) {
            controlEventStream(cmd, true);
        };

        //--------------------------------------------------------
        //This is called when we first tap on an event to see
        // the feed. It's important to instantiate ionicModal here
        // as otherwise you'd instantiate it when the view loads
        // and our "Please wait loading" technique I explained
        //earlier won't work
        //--------------------------------------------------------

        $scope.openModal = function (eid, ename, edur, eframes, basepath, relativepath) {
            ZMDataModel.zmDebug("EventCtrl: Open Modal with Base path " + relativepath);
            $scope.eventName = ename;
            $scope.eventId = eid;
            $scope.eFramesNum = eframes;
            $scope.eventDur = Math.round(edur);
            $scope.loginData = ZMDataModel.getLogin();
            $scope.eventBasePath = basepath;
            $scope.relativePath = relativepath;
            $rootScope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;

            $scope.slider_modal_options = {
                from: 1,
                to: eframes,
                realtime: true,
                step: 1,
                className: "mySliderClass",
                callback: function (value, released) {
                    //console.log("CALLBACK"+value+released);
                    $ionicScrollDelegate.freezeScroll(!released);


                },
                //modelLabels:function(val) {return "";},
                smooth: false,
                css: {
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
                },
                scale: []

            };


            $scope.mycarousel.index = 0;
            $scope.ionRange.index = 1;
            //console.log("**Resetting range");
            $scope.slides = [];
            var i;
            for (i = 1; i <= eframes; i++) {
                var fname = padToN(i, eventImageDigits) + "-capture.jpg";
                // console.log ("Building " + fname);
                $scope.slides.push({
                    id: i,
                    img: fname
                });
            }


            // now get event details to show alarm frames
            var loginData = ZMDataModel.getLogin();
            var myurl = loginData.apiurl + '/events/' + eid + ".json";
            ZMDataModel.zmLog("*** Constructed API for detailed events: " + myurl);
            $http.get(myurl)
                .success(function (data) {
                    $scope.FrameArray = data.event.Frame;
                    //  $scope.slider_options.scale=[];
                    $scope.slider_modal_options.scale = [];
                    //$scope.slider_options.modelLabels={2:'X'};
                    //$scope.slider_options.dimension="arjun";
                    var i;
                    for (i = 0; i < data.event.Frame.length; i++) {
                        if (data.event.Frame[i].Type == "Alarm") {
                            //⬤
                            // console.log ("**ALARM AT " + i);
                            $scope.slider_modal_options.scale.push({
                                val: i + 1,
                                label: ' '
                            });
                        } else {
                            //$scope.slider_options.scale.push(' ');
                        }

                    }

                    //console.log (JSON.stringify(data));
                })
                .error(function (err) {
                    ZMDataModel.zmLog("Error retrieving detailed frame API " + JSON.stringify(err));
                    ZMDataModel.displayBanner('error', ['could not retrieve frame details', 'please try again']);
                });

            $scope.totalEventTime = Math.round(parseFloat(edur)) - 1;
            $scope.currentEventTime = 0;

            ZMDataModel.setAwake(ZMDataModel.getKeepAwake());

            $ionicModal.fromTemplateUrl('templates/events-modal.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                })
                .then(function (modal) {
                    $scope.modal = modal;

                    $ionicLoading.show({
                        template: "please wait...",
                        noBackdrop: true,
                        duration: 10000
                    });

                    $scope.modal.show();

                    var ld = ZMDataModel.getLogin();

                    // how many seconds this event will take
                    //evtSegments = eframes / ld.maxFPS + 3;
                    //evtCurSegment = 0;
                    // console.log ("**** I SET SEGMENTS TO " + evtSegments);

                    // call on progress indicator every 5 seconds
                    // don't want to overload
                    /*
                        segmentHandle = $interval(function () {
                            segmentCheck();
                        }, zm.progressIntervalCheck);
                        segmentCheck();*/


                });

        };

        //--------------------------------------------------------
        //We need to destroy because we are instantiating
        // it on open
        //--------------------------------------------------------
        $scope.closeModal = function () {
            // $interval.cancel(eventsInterval);
            $interval.cancel(segmentHandle);
            ZMDataModel.zmDebug("EventCtrl:Close & Destroy Modal");
            ZMDataModel.setAwake(false);
            if ($scope.modal !== undefined) {
                $scope.modal.remove();
            }

        };

        //--------------------------------------------------------
        //Cleanup the modal when we're done with it
        // I Don't think it ever comes here
        //--------------------------------------------------------
        $scope.$on('$destroy', function () {
            console.log("Destroy Modal");
            if ($scope.modal !== undefined) {
                $scope.modal.remove();
            }
            if ($scope.popover !== undefined)
                $scope.popover.remove();
            $interval.cancel(segmentHandle);
        });

        //--------------------------------------------------------
        // used by infinite scrolling to see if we can get more
        //--------------------------------------------------------

        $scope.moreDataCanBeLoaded = function () {
            return moreEvents;
        };

        //--------------------------------------------------------
        // stop searching for more data
        //--------------------------------------------------------
        $scope.cancelSearch = function () {
            $ionicLoading.hide(); //Or whatever action you want to preform
            enableLoadMore = false;
            console.log("**** CANCELLED ****");
            $ionicLoading.show({
                template: 'Search Cancelled',
                animation: 'fade-in',
                showBackdrop: true,
                duration: 2000,
                maxWidth: 200,
                showDelay: 0
            });


        };

        //--------------------------------------------------------
        // loads next page of events
        //--------------------------------------------------------


        function loadMore() {
            // the events API does not return an error for anything
            // except greater page limits than reported

            console.log("***** LOADING MORE INFINITE SCROLL ****");
            eventsPage--;
            if ((eventsPage <= 0) && (pageLoaded)) {
                moreEvents = false;
                console.log("*** At Page " + eventsPage + ", not proceeding");
                return;
            }

            if (!enableLoadMore) {
                moreEvents = false; // Don't ion-scroll till enableLoadMore is true;
                $scope.$broadcast('scroll.infiniteScrollComplete');

                console.log("**** LOADMORE ARTIFICALLY DISABLED");
                return;
            }

            var loadingStr = "";
            if ($scope.search.text != "") {
                var toastStr = "Searching page " + eventsPage;
                $ionicLoading.show({
                    maxwidth: 100,
                    scope: $scope,
                    template: '<button class="button button-clear icon-left ion-close-circled button-text-wrap" ng-click="cancelSearch()" >' + toastStr + '</button>'
                });

                loadingStr = "none";
            }

            ZMDataModel.getEvents($scope.id, eventsPage, loadingStr, $rootScope.fromString, $rootScope.toString)
                .then(function (data) {
                        var loginData = ZMDataModel.getLogin();
                        console.log("Got new page of events with Page=" + eventsPage);
                        var myevents = data;
                        for (var i = 0; i < myevents.length; i++) {

                            myevents[i].Event.MonitorName = ZMDataModel.getMonitorName(myevents[i].Event.MonitorId);
                            // now construct base path

                            var str = myevents[i].Event.StartTime;
                            //var yy =  moment(str).format('h:mm:ssa on MMMM Do YYYY');
                            var yy = moment(str).format('YY');
                            var mm = moment(str).format('MM');
                            var dd = moment(str).format('DD');
                            var hh = moment(str).format('HH');
                            var min = moment(str).format('mm');
                            var sec = moment(str).format('ss');

                            myevents[i].Event.BasePath = loginData.url + "/events/" +
                                myevents[i].Event.MonitorId + "/" +
                                yy + "/" +
                                mm + "/" +
                                dd + "/" +
                                hh + "/" +
                                min + "/" +
                                sec + "/";

                            myevents[i].Event.relativePath = myevents[i].Event.MonitorId + "/" +
                                yy + "/" +
                                mm + "/" +
                                dd + "/" +
                                hh + "/" +
                                min + "/" +
                                sec + "/";
                            myevents[i].Event.height = zm.eventsListDetailsHeight;

                        }
                        $scope.events = $scope.events.concat(myevents);
                        console.log("Got new page of events");
                        moreEvents = true;
                        $scope.$broadcast('scroll.infiniteScrollComplete');
                    },

                    function (error) {
                        console.log("*** No More Events to Load, Stop Infinite Scroll ****");
                        moreEvents = false;
                        $scope.$broadcast('scroll.infiniteScrollComplete');

                    });
        }

        $scope.loadMore = function () {
            loadMore();

        };








        //--------------------------------------
        // formats events dates in a nice way
        //---------------------------------------

        $scope.prettifyDate = function (str) {
            return moment(str).format('MMM Do');
        };

        function prettifyDate(str) {
            return moment(str).format('MMM Do');
        }

        $scope.prettifyTime = function (str) {
            return moment(str).format('h:mm:ssa');
        };


        $scope.prettify = function (str) {
            return moment(str).format('h:mm:ssa on MMMM Do YYYY');
        };
        //--------------------------------------------------------
        // For consistency we are keeping the refresher list
        // but its a dummy. The reason I deviated is because
        // refresh with infinite scroll is a UX problem - its
        // easy to pull to refresh when scrolling up with
        // a large list
        //--------------------------------------------------------

        $scope.dummyDoRefresh = function () {
            $scope.$broadcast('scroll.refreshComplete');
        };

        $scope.doRefresh = function () {
            doRefresh();
        }; //dorefresh
        
        function doRefresh()
        {
            console.log("***Pull to Refresh");
            $scope.events = [];
            moreEvents = true;
            ZMDataModel.getEventsPages($scope.id, $rootScope.fromString, $rootScope.toString)
                .then(function (data) {
                    eventsPage = data.pageCount;
                    console.log("TOTAL EVENT PAGES IS " + eventsPage);
                    pageLoaded = true;
                    $scope.viewTitle.title = data.count;
                    ZMDataModel.getEvents($scope.id, eventsPage, "", $rootScope.fromString, $rootScope.toString)

                    .then(function (data) {
                        console.log("EventCtrl Got events");
                        //var events = [];
                        var myevents = data;
                        for (var i = 0; i < myevents.length; i++) {

                            myevents[i].Event.MonitorName = ZMDataModel.getMonitorName(myevents[i].Event.MonitorId);

                            // now construct base path

                            var str = myevents[i].Event.StartTime;
                            //var yy =  moment(str).format('h:mm:ssa on MMMM Do YYYY');
                            var yy = moment(str).format('YY');
                            var mm = moment(str).format('MM');
                            var dd = moment(str).format('DD');
                            var hh = moment(str).format('HH');
                            var min = moment(str).format('mm');
                            var sec = moment(str).format('ss');
                            var loginData = ZMDataModel.getLogin();
                            myevents[i].Event.BasePath = loginData.url + "/events/" +
                                myevents[i].Event.MonitorId + "/" +
                                yy + "/" +
                                mm + "/" +
                                dd + "/" +
                                hh + "/" +
                                min + "/" +
                                sec + "/";

                            myevents[i].Event.relativePath =
                                myevents[i].Event.MonitorId + "/" +
                                yy + "/" +
                                mm + "/" +
                                dd + "/" +
                                hh + "/" +
                                min + "/" +
                                sec + "/";

                            myevents[i].Event.ShowScrub = false;
                            myevents[i].Event.height = zm.eventsListDetailsHeight;
                        }
                        $scope.events = myevents;
                        loadMore();
                    });

                });
        }

}]);