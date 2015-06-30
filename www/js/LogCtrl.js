/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.LogCtrl', ['$scope', '$rootScope', '$ionicModal', 'ZMDataModel', '$ionicSideMenuDelegate', '$fileLogger', '$cordovaEmailComposer', '$ionicPopup', '$timeout', function ($scope, $rootScope, $ionicModal, ZMDataModel, $ionicSideMenuDelegate, $fileLogger, $cordovaEmailComposer, $ionicPopup, $timeout) {
    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };




    //--------------------------------------------------------------------------
    // Make sure user knows information masking is best effort
    //--------------------------------------------------------------------------

    $scope.sendEmail = function (logstring) {
        $ionicPopup.confirm({
                title: 'Sensitive Information',
                template: 'zmNinja will modify the logs when creating the email to remove sensitive data like urls and passwords. However it is eventually <b>your responsibility</b> to make sure there is no sensitive data in the logs. Please make sure you review and edit the logs in the next screen before you send.'
            })
            .then(function (res) {
                if (res) sendEmailReally(logstring);

            });
    };

    //--------------------------------------------------------------------------
    // Convenience function to send logs via email
    //--------------------------------------------------------------------------
    function sendEmailReally(logstring) {
        if (window.cordova) {

            $cordovaEmailComposer.isAvailable().then(function () {

                // do my best to replace sensitive information
                var loginData = ZMDataModel.getLogin();
                var re1 = new RegExp(loginData.password, "g");
                logstring = logstring.replace(re1, "<deleted>");
                // keep the protocol, helps to debug
                var urlNoProtocol = loginData.url.replace(/.*?:\/\//, "");
                var re2 = new RegExp(urlNoProtocol, "g");
                // just replacing baseurl - that will take care of
                // masking api but may not be cgi
                logstring = logstring.replace(re2, "<server>");

                urlNoProtocol = loginData.streamingurl.replace(/.*?:\/\//, "");
                var re3 = new RegExp(urlNoProtocol, "g");
                logstring = logstring.replace(re3, "<server>");

                var email = {
                    to: 'pliablepixels+zmNinja@gmail.com',
                    subject: 'zmNinja Logs',
                    body: logstring,
                    isHtml: false
                };
                $cordovaEmailComposer.open(email)
                    .then(null, function () {
                        // user cancelled email
                    });
            }, function () {
                ZMDataModel.zmLog("Email plugin not found", "error");
            });
        } else {
            console.log("Skipping email module as cordova does not exist");
        }

    }

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
