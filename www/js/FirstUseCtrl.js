/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.FirstUseCtrl', ['$scope', '$ionicSideMenuDelegate', 'zm', '$stateParams', '$ionicHistory', '$state', 'NVRDataModel', '$rootScope', '$ionicPopup', '$translate', function ($scope, $ionicSideMenuDelegate, zm, $stateParams, $ionicHistory, $state, NVRDataModel, $rootScope, $ionicPopup, $translate) {
    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };



    //-------------------------------------------------------------------------
    // Controller Main
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
        //console.log("**VIEW ** FirstUse Ctrl Entered");
        $ionicSideMenuDelegate.canDragContent(true);


    });

    $scope.switchLang = function () {
        $scope.lang = NVRDataModel.getLanguages();
        $scope.myopt = {
            lang: ""
        };

        $rootScope.zmPopup = $ionicPopup.show({
            scope: $scope,
            template: '<ion-radio-fix ng-repeat="item in lang" ng-value="item.value" ng-model="myopt.lang"> {{item.text}} </ion-radio-fix>',


            title: $translate.instant('kSelectLanguage'),

            buttons: [
                {
                    text: $translate.instant('kButtonCancel'),
                    onTap: function (e) {
                        //return "CANCEL";
                    }

                },
                {
                    text: $translate.instant('kButtonOk'),
                    onTap: function (e) {
                        NVRDataModel.log("Language selected:" + $scope.myopt.lang);
                        NVRDataModel.setDefaultLanguage($scope.myopt.lang, true);


                        //return "OK";

                    }
               }
           ]
        });


    };

    $scope.goToLogin = function () {
        $ionicHistory.nextViewOptions({
            disableAnimate: false,
            disableBack: true
        });
        $state.go("login", {
            "wizard": false
        });
        return;
    };

    $scope.goToWizard = function () {
        $ionicHistory.nextViewOptions({
            disableAnimate: false,
            disableBack: true
        });
        $state.go("wizard");
        return;
    };



}]);