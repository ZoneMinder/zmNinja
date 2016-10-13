/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('MenuController', ['$scope','$ionicSideMenuDelegate', 'zm', '$stateParams', '$ionicHistory','$state', 'NVRDataModel', '$rootScope', '$ionicPopup', '$translate', function ($scope,$ionicSideMenuDelegate,zm, $stateParams, $ionicHistory, $state, NVRDataModel, $rootScope, $ionicPopup, $translate) {
$scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

//----------------------------------------------------------------
// This controller sits along with the main app to  bring up 
// the language menu from the main menu
//----------------------------------------------------------------
    $scope.switchLang = function()
    {
        $scope.lang = NVRDataModel.getLanguages();
        $scope.myopt = {lang:""};
        
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
                        NVRDataModel.log("Language selected:"+$scope.myopt.lang);
                        NVRDataModel.setDefaultLanguage($scope.myopt.lang, true);
                        $rootScope.$emit('language-changed');
                        
                        
                        //return "OK";

                    }
               }
           ]
        });
        
        
    };
    
   
}]);
