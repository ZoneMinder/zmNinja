/* jshint -W041 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

angular.module('zmApp.controllers').controller('zmApp.FirstUseCtrl', ['$scope', '$ionicSideMenuDelegate', 'zm', '$stateParams', '$ionicHistory', '$state', 'NVR', '$rootScope', '$ionicPopup', '$translate', function ($scope, $ionicSideMenuDelegate, zm, $stateParams, $ionicHistory, $state, NVR, $rootScope, $ionicPopup, $translate) {
  $scope.openMenu = function () {
    $ionicSideMenuDelegate.toggleLeft();
  };

  //-------------------------------------------------------------------------
  // Controller Main
  //------------------------------------------------------------------------
  $scope.$on('$ionicView.enter', function () {
    //console.log("**VIEW ** FirstUse Ctrl Entered");
    $ionicSideMenuDelegate.canDragContent(true);
    // right up here lets set certs to true, we will disable it later
    // this is for first starts

    // 
    if (window.cordova) {
      cordova.plugin.http.setServerTrustMode('nocheck', function () {
        NVR.debug('--> First use -> SSL is permissive, will allow any certs for now. You can change it later.');
      }, function () {
        NVR.log('-->First Use -> Error setting SSL permissive');
      });

      if ($rootScope.platformOS == 'android') {
        NVR.log (">>> Android: enabling inline image view for self signed certs");
        cordova.plugins.certificates.trustUnsecureCerts(true);
      }

    }


  });

  $scope.switchLang = function () {
    $scope.lang = NVR.getLanguages();
    $scope.myopt = {
      lang: ""
    };

    $rootScope.zmPopup = $ionicPopup.show({
      scope: $scope,
      template: '<ion-radio-fix ng-repeat="item in lang" ng-value="item.value" ng-model="myopt.lang"> {{item.text}} </ion-radio-fix>',

      title: $translate.instant('kSelectLanguage'),

      buttons: [{
          text: $translate.instant('kButtonCancel'),
          onTap: function (e) {
            //return "CANCEL";
          }

        },
        {
          text: $translate.instant('kButtonOk'),
          onTap: function (e) {
            NVR.log("Language selected:" + $scope.myopt.lang);
            NVR.setDefaultLanguage($scope.myopt.lang, true);

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
    $state.go("app.login", {
      "wizard": false
    });
    return;
  };

  $scope.goToWizard = function () {
    $ionicHistory.nextViewOptions({
      disableAnimate: false,
      disableBack: true
    });
    $state.go("app.wizard");
    return;
  };

}]);
