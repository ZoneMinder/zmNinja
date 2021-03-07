 /* jshint -W041 */
 /* jslint browser: true*/
 /* global cordova,StatusBar,angular,console */

 angular.module('zmApp.controllers').controller('zmApp.EventServerSettingsCtrl', ['$scope', '$ionicSideMenuDelegate', 'zm', '$stateParams', 'EventServer', '$ionicHistory', '$rootScope', '$state', 'message', 'NVR', '$ionicPlatform', '$ionicPopup', '$timeout', '$translate', function ($scope, $ionicSideMenuDelegate, zm, $stateParams, EventServer, $ionicHistory, $rootScope, $state, message, NVR, $ionicPlatform, $ionicPopup, $timeout, $translate) {
   $scope.openMenu = function () {
     $ionicSideMenuDelegate.toggleLeft();
   };

   $scope.openMenu = function () {
     $ionicSideMenuDelegate.toggleLeft();
   };

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

       $state.go("app.events", {
         "id": 0,
         "playEvent": false
       }, {
         reload: true
       });
       return;
     }
   };

   // we need this to dynamically get title 
   // name as ion-view is set in stone and
   // we don't get title till beforeEnter
   // which is odd - I'd expect beforeEnter to load
   // before View is loaded
   $scope.getTitle = function () {
     return $scope.loginData.serverName;
   };

   //----------------------------------------------------------------
   // Save anyway when you exit
   //----------------------------------------------------------------

   $scope.$on('$ionicView.beforeLeave', function () {
     saveItems();

   });

   $scope.$on('$ionicView.beforeEnter', function () {


     $scope.loginData = NVR.getLogin();
     //console.log ("Event server - before Enter, loginData is " + JSON.stringify($scope.loginData));

     //console.log ("BEFORE ENTER I GOT " + JSON.stringify($scope.loginData));



     $scope.defScreen = $scope.loginData.onTapScreen;

     if ($scope.loginData.eventServer == "") {
       $scope.loginData.eventServer = "wss://" + extractDomain($scope.loginData.url) + ":9000";
     }

     res = $scope.loginData.eventServerMonitors.split(",");
     minterval = $scope.loginData.eventServerInterval.split(",");

     var monchecked = false;
     for (var i = 0; i < $scope.monitors.length; i++) {

       if (!isEnabled($scope.monitors[i].Monitor.Id)) {
         // if the filter list has IDs and this is not part of it, uncheck it
         $scope.monitors[i].Monitor.isChecked = false;
         //console.log("Marking false");
         $scope.monitors[i].Monitor.reportingInterval = 0;
       } else {
         // console.log("Marking true");
         $scope.monitors[i].Monitor.isChecked = true;
         $scope.monitors[i].Monitor.reportingInterval = getInterval($scope.monitors[i].Monitor.Id);
         monchecked = true;
       }

     }

     // now if none are checked, assume it means all checked. This is related to the
     // fact that ES will start sending all monitors, even ones you don't have access to
     if (!monchecked) {
       NVR.debug("Enabling all monitors for event server");
       for (var j = 0; j < $scope.monitors.length; j++) {
         $scope.monitors[i].Monitor.isChecked = true;
         $scope.monitors[i].Monitor.reportingInterval = 0;
       }

     }
   });

   //--------------------------------------------------
   // notification tap action
   //--------------------------------------------------

   $scope.selectScreen = function () {

     // var ld = NVR.getLogin();

     $scope.myopt = {
       selectedState: $scope.loginData.onTapScreen
     };

     var options = '<ion-radio-fix ng-model="myopt.selectedState" ng-value="\'' + $translate.instant('kTapEvents') + '\'">' + $translate.instant('kTapEvents') + '</ion-radio-fix>';

     options += '<ion-radio-fix ng-model="myopt.selectedState" ng-value="\'' + $translate.instant('kTapMontage') + '\'">' + $translate.instant('kTapMontage') + '</ion-radio-fix>';
     options += '<ion-radio-fix ng-model="myopt.selectedState" ng-value="\'' + $translate.instant('kTapLiveMonitor') + '\'">' + $translate.instant('kTapLiveMonitor') + '</ion-radio-fix>';

     $rootScope.zmPopup = $ionicPopup.show({
       scope: $scope,
       template: options,

       title: 'View to navigate to:',
       subTitle: 'currently set to: ' + $scope.loginData.onTapScreen,
       buttons: [{
           text: $translate.instant('kButtonCancel'),

         },
         {
           text: $translate.instant('kButtonOk'),
           onTap: function (e) {

             $scope.loginData.onTapScreen = $scope.myopt.selectedState;
             NVR.log("Setting new onTap State:" + $scope.loginData.onTapScreen);
             NVR.setLogin($scope.loginData);
             $scope.defScreen = $scope.myopt.selectedState;
             //$scope.loginData = ld;

           }
         }
       ]
     });

   };

   //----------------------------------------------------------------
   // Accordion list show/hide
   //----------------------------------------------------------------

   $scope.toggleGroup = function (group) {
     if ($scope.isGroupShown(group)) {
       $scope.shownGroup = null;
     } else {
       $scope.shownGroup = group;
     }
   };
   $scope.isGroupShown = function (group) {
     return $scope.shownGroup === group;
   };

   $scope.saveItems = function () {
     saveItems();
   };

   //----------------------------------------------------------------
   // Saves ES data
   //----------------------------------------------------------------

   function saveItems() {
     NVR.debug("Saving Event Server data");
     var monstring = "";
     var intervalstring = "";
     var atleastOneChecked = false;
     var plat = $ionicPlatform.is('ios') ? 'ios' : 'android';
     for (var i = 0; i < $scope.monitors.length; i++) {
       if (isNaN($scope.monitors[i].Monitor.reportingInterval)) {
         $scope.monitors[i].Monitor.reportingInterval = 0;
       }
       if ($scope.monitors[i].Monitor.isChecked) {
         atleastOneChecked = true;
         monstring = monstring + $scope.monitors[i].Monitor.Id + ",";
         var tint = parseInt($scope.monitors[i].Monitor.reportingInterval);
         if (isNaN(tint)) tint = 0;
         intervalstring = intervalstring + tint + ",";
       }

     }

     if (!atleastOneChecked && $scope.loginData.isUseEventServer) {
        $rootScope.zmPopup = $ionicPopup.alert({
          title:$translate.instant('kNote'),
          template: $translate.instant('kEventServerAllUnchecked'),
          okText: $translate.instant('kButtonOk'),
        });
        return;
      }
      

     if (monstring.charAt(monstring.length - 1) == ',')
       monstring = monstring.substr(0, monstring.length - 1);

     if (intervalstring.charAt(intervalstring.length - 1) == ',')
       intervalstring = intervalstring.substr(0, intervalstring.length - 1);

     $scope.loginData.eventServerMonitors = monstring;
     $scope.loginData.eventServerInterval = intervalstring;

     $rootScope.monstring = monstring;
     $rootScope.intstring = intervalstring;


     // console.log ("SAVED: " + JSON.stringify($scope.loginData));
     NVR.setLogin($scope.loginData);

     var pushstate = "enabled";
     if ($scope.loginData.disablePush == true || $scope.loginData.isUseEventServer == false)
       pushstate = "disabled";

     if ($scope.loginData.isUseEventServer == true) {
       EventServer.disconnect();
       EventServer.init()
         .then(function (data) {
             // console.log("Sending control filter");
             NVR.debug("Sending Control message 'filter' with monlist=" + monstring + " and interval=" + intervalstring);
             EventServer.sendMessage("control", {
               type: 'filter',
               monlist: monstring,
               intlist: intervalstring,
               token: $rootScope.apnsToken
             }, 1);

             if ($rootScope.apnsToken != "")
             // if its defined then this is post init work
             // so lets transmit state here 

             {
               // we need to disable the token
               NVR.debug("Sending token state " + pushstate);
               EventServer.sendMessage('push', {
                 type: 'token',
                 platform: plat,
                 token: $rootScope.apnsToken,
                 state: pushstate
               }, 1);

             }

           },
           function (err) {
             NVR.debug("Event Server init failed");
           }

         );

     } // no event server configured/enabled
     else {
       if ($rootScope.apnsToken != "")
       // if its defined then this is post init work
       // so lets transmit state here 

       {
         // we need to disable the token
         NVR.debug("Sending token state " + pushstate);
         EventServer.sendMessage('push', {
           type: 'token',
           platform: plat,
           token: $rootScope.apnsToken,
           state: pushstate
         }, 1);

       }
       // Give the above some time to transmit

       $timeout(function () {
         EventServer.disconnect();
       }, 1000);

     }

     NVR.displayBanner('info', ['settings saved']);
   }

   //----------------------------------------------------------------
   // returns domain name  in string - 
   // http://stackoverflow.com/questions/8498592/extract-root-domain-name-from-string
   //----------------------------------------------------------------
   function extractDomain(url) {
     var domain;
     //find & remove protocol (http, ftp, etc.) and get domain
     if (url.indexOf("://") > -1) {
       domain = url.split('/')[2];
     } else {
       domain = url.split('/')[0];
     }

     //find & remove port number
     domain = domain.split(':')[0];

     return domain;
   }

   //----------------------------------------------------------------
   // returns reporting interval for monitor ID
   //----------------------------------------------------------------
   function getInterval(id) {
     // means no interval, should only happen one time
     // till we save
     if ($scope.loginData.eventServerInterval == "")
       return 0;
     var retval = 0;
     for (var i = 0; i < res.length; i++) {
       if (res[i] == id) {
         retval = parseInt(minterval[i]);
         break;
       }
     }
     return retval;
   }

   //----------------------------------------------------------------
   // Returns true/false if monitor ID is in event monitor list
   //----------------------------------------------------------------
   function isEnabled(id) {
     if ($scope.loginData.eventServerMonitors == "")
       return true;

     var isThere = false;
     for (var i = 0; i < res.length; i++) {
       if (res[i] == id) {
         isThere = true;
         //console.log("isRes found: " + id);
         break;
       }
     }
     return isThere;
   }

   //-------------------------------------------------------------------------
   // Controller Main
   //------------------------------------------------------------------------
   $scope.monitors = [];
   $scope.monitors = message;
   var res, minterval;

 }]);
