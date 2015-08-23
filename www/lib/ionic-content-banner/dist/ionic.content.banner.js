angular.module('jett.ionic.content.banner', ['ionic']);
/* global angular */
(function (angular) {
  'use strict';

  angular.module('jett.ionic.content.banner')
    .directive('ionContentBanner', [
      '$interval',
      function ($interval) {
        return {
          restrict: 'E',
          scope: true,
          link: function ($scope, $element) {
            var stopInterval;

            $scope.currentIndex = 0;

            if ($scope.text.length > 1) {
              stopInterval = $interval(function () {
                $scope.currentIndex = ($scope.currentIndex < $scope.text.length - 1) ? $scope.currentIndex + 1 : 0;
              }, $scope.interval);
            }

            $scope.$on('$destroy', function() {
              $element.remove();
              if (stopInterval) {
                $interval.cancel(stopInterval);
              }
            });
          },
          template:
          '<div class="content-banner-text-wrapper">' +
            '<div ng-repeat="item in text track by $index" ng-class="{active: $index === currentIndex}" class="content-banner-text" ng-bind="item"></div>' +
          '</div>' +
          '<button class="content-banner-close button button-icon icon {{::icon}}" ng-click="close()"></button>'
        };
      }]);

})(angular);

/* global angular,ionic */
/**
 * @ngdoc service
 * @name $ionicContentBanner
 * @module ionic
 * @description The Content Banner is an animated banner that will show specific information to a user.
 */
(function (angular, ionic) {
  'use strict';

  angular.module('jett.ionic.content.banner')
    .factory('$ionicContentBanner', [
      '$document',
      '$rootScope',
      '$compile',
      '$timeout',
      '$ionicPlatform',
      function ($document, $rootScope, $compile, $timeout, $ionicPlatform) {

        function isActiveView (node) {
          // walk up the child-parent node chain until we get to the root or the BODY
          while (node !== null && node.nodeName !== 'BODY') {
            var navView = node.getAttribute("nav-view");

            // as soon as we encounter a cached (parent) view then we know the view can't be active
            if (navView !== null && navView === 'cached') {
              return false;
            }
            node = node.parentNode;
          }
          // no cached parent seen, the view must be really active
          return true;
        }

        function getActiveView (body) {
          // get the candidate active views
          var views = body.querySelectorAll('ion-view[nav-view="active"]');

          // only one candidate, so we just take it
          if (views.length === 1) {
            return views[0];
          }

          // convert the NodeList to an array, filter it using 'isActiveView' and return the first element
          return Array.prototype.slice.call(views).filter(function (view) {
            return isActiveView(view);
          })[0];
        }

        /**
         * @ngdoc method
         * @name $ionicContentBanner#show
         * @description
         * Load and show a new content banner.
         */
        function contentBanner (opts) {
          var scope = $rootScope.$new(true);

          angular.extend(scope, {
            icon: 'ion-ios-close-empty',
            transition: 'vertical',
            interval: 7000,
            type: 'info',
            $deregisterBackButton: angular.noop,
            closeOnStateChange: true,
            autoClose: null
          }, opts);

          // Compile the template
          var classes = 'content-banner ' + scope.type + ' content-banner-transition-' + scope.transition;
          var element = scope.element = $compile('<ion-content-banner class="' + classes + '"></ion-content-banner>')(scope);
          var body = $document[0].body;

          var stateChangeListenDone = scope.closeOnStateChange ?
            $rootScope.$on('$stateChangeSuccess', function() { scope.close(); }) :
            angular.noop;

          scope.$deregisterBackButton = $ionicPlatform.registerBackButtonAction(
            function() {
              $timeout(scope.close);
            }, 300
          );

          scope.close = function() {
            if (scope.removed) {
              return;
            }
            scope.removed = true;

            ionic.requestAnimationFrame(function () {
              element.removeClass('content-banner-in');

              $timeout(function () {
                scope.$destroy();
                element.remove();
                body = stateChangeListenDone = null;
              }, 400);
            });

            scope.$deregisterBackButton();
            stateChangeListenDone();
          };

          scope.show = function() {
            if (scope.removed) {
              return;
            }

            getActiveView(body).querySelector('.scroll-content').appendChild(element[0]);

            ionic.requestAnimationFrame(function () {
              $timeout(function () {
                element.addClass('content-banner-in');
                //automatically close if autoClose is configured
                if (scope.autoClose) {
                  $timeout(function () {
                    scope.close();
                  }, scope.autoClose, false);
                }
              }, 20, false);
            });
          };

          //set small timeout to let ionic set the active/cached view
          $timeout(function () {
            scope.show();
          }, 10, false);

          // Expose the scope on $ionContentBanner's return value for the sake of testing it.
          scope.close.$scope = scope;

          return scope.close;
        }

        return {
          show: contentBanner
        };
      }]);


})(angular, ionic);
