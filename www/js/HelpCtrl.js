/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console, Masonry */

angular.module('zmApp.controllers').controller('zmApp.HelpCtrl', ['$scope', '$rootScope', '$ionicModal', 'NVRDataModel', '$ionicSideMenuDelegate', '$ionicHistory', '$state', '$translate', '$q', '$templateRequest', '$sce', '$compile', function ($scope, $rootScope, $ionicModal, NVRDataModel, $ionicSideMenuDelegate, $ionicHistory, $state, $translate, $q, $templateRequest, $sce, $compile) {
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
            $state.go("events", {
                "id": 0,
                "playEvent":false
            }, {
                reload: true
            });
        }
    };

    //----------------------------------------------------------------
    // This function dynamically inserts the relevant help text file
    // based on selected language
    //----------------------------------------------------------------

    function insertHelp() {

        var l = NVRDataModel.getDefaultLanguage() || 'en';
        var lang = "lang/help/help-" + l + ".html";
        //console.log ("LANG IS " + lang);
        var templateUrl = $sce.getTrustedResourceUrl(lang);
        var lang_fb = "lang/help/help-" + "en" + ".html";
        var templateUrlFB = $sce.getTrustedResourceUrl(lang_fb);

        $templateRequest(lang)
            .then(function (template) {
                    var elem = angular.element(document.getElementById('insertHelp'));
                    $compile(elem.html(template).contents())($scope);
                },
                function (error) {
                    NVRDataModel.log("Language file " + lang + " not found, falling back");
                    $templateRequest(templateUrlFB)
                        .then(function (template) {
                                var elem = angular.element(document.getElementById('insertHelp'));
                                $compile(elem.html(template).contents())($scope);
                            },
                            function (error) {
                                NVRDataModel.log("fallback help not found");
                            });
                }
            );



    }

    //-------------------------------------------------------------------------
    // Lets make sure we set screen dim properly as we enter
    // The problem is we enter other states before we leave previous states
    // from a callback perspective in ionic, so we really can't predictably
    // reset power state on exit as if it is called after we enter another
    // state, that effectively overwrites current view power management needs
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
        //console.log("**VIEW ** Help Ctrl Entered");
        NVRDataModel.setAwake(false);
        $scope.zmAppVersion = NVRDataModel.getAppVersion();
        insertHelp();





    });

}]);