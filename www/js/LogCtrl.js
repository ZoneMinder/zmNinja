/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.LogCtrl', ['$scope', '$rootScope', '$ionicModal', 'ZMDataModel', '$ionicSideMenuDelegate', '$fileLogger', '$cordovaEmailComposer', function ($scope, $rootScope, $ionicModal, ZMDataModel, $ionicSideMenuDelegate, $fileLogger, $cordovaEmailComposer) {
    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };


    //--------------------------------------------------------------------------
    // Convenience function to send logs via email
    //--------------------------------------------------------------------------
    $scope.sendEmail = function (logstring) {
        if (window.cordova) {
            // pass= password= should be replaced
            //logstring = logstring.replace(/password=*?/g, 'password=xxxx'
            $cordovaEmailComposer.isAvailable().then(function () {
                var email = {
                    to: '',
                    subject: 'zmNinja Logs',
                    body: logstring,
                    isHtml: false
                };
                $cordovaEmailComposer.open(email);
            }, function () {
                ZMDataModel.zmLog("Email plugin not found", "error");
            });
        } else {
            console.log("Skipping email module as cordova does not exist");
        }

    };

    //-------------------------------------------------------------------------
    // Lets make sure we set screen dim properly as we enter
    // The problem is we enter other states before we leave previous states
    // from a callback perspective in ionic, so we really can't predictably
    // reset power state on exit as if it is called after we enter another
    // state, that effectively overwrites current view power management needs
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
        console.log("**VIEW ** Log Ctrl Entered");
        ZMDataModel.setAwake(false);

        $scope.zmLog = {
            logString: ""
        };
        $fileLogger.getLogfile().then(function (l) {

                $scope.zmLog.logString = l;
                //console.log ("LOGS" + logstring);
            },
            function (error) {
                $scope.zmLog.logString = "Error getting log: " + JSON.stringify(error);
            });


    });

}]);
