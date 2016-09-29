/* global angular,ionic */
(function (angular, ionic) {
  'use strict';

  angular.module('jett.ionic.scroll.sista', ['ionic'])
    .directive('scrollSista', ['$document', '$timeout', '$rootScope', '$ionicScrollDelegate', function($document, $timeout, $rootScope, $ionicScrollDelegate) {
      var TRANSITION_DELAY = 400;
      var defaultDelay = TRANSITION_DELAY * 2;
      var defaultDuration = TRANSITION_DELAY + 'ms';
      var scaleHeaderElements = ionic.Platform.isAndroid() ? false : true;

      function getParentWithAttr (e, attrName, attrValue, depth) {
        var attr;

        depth = depth || 10;
        while (e.parentNode && depth--) {
          attr = e.parentNode.getAttribute(attrName);
          if (attr && attr === attrValue) {
            return e.parentNode;
          }
          e = e.parentNode;
        }
        return null;
      }

      return {
        restrict: 'A',
        link: function($scope, $element, $attr) {
          var isNavBarTransitioning = true;
          var body = $document[0].body;
          var scrollDelegate = $attr.delegateHandle ? $ionicScrollDelegate.$getByHandle($attr.delegateHandle) : $ionicScrollDelegate;
          var scrollView = scrollDelegate.getScrollView();

          //coordinates
          var y, prevY, prevScrollTop;
          //headers
          var cachedHeader, activeHeader, headerHeight, contentTop;
          //subheader
          var subHeader, subHeaderHeight;
          //tabs
          var tabs, tabsHeight, hasTabsTop = false, hasTabsBottom = false;

          //y position that will indicate where specific elements should start and end their transition.
          var headerStart = 0;
          var tabsStart = 0;
          var subheaderStart = 0;
          var defaultEnd, headerEnd, tabsEnd, subheaderEnd;

          /**
           * translates an element along the y axis by the supplied value.  if duration is passed in,
           * a transition duration is set
           * @param element
           * @param y
           * @param duration
           */
          function translateY (element, y, duration) {
            if (duration && !element.style[ionic.CSS.TRANSITION_DURATION]) {
              element.style[ionic.CSS.TRANSITION_DURATION] = duration;
              $timeout(function () {
                element.style[ionic.CSS.TRANSITION_DURATION] = '';
              }, defaultDelay, false);
            }
            element.style[ionic.CSS.TRANSFORM] = 'translate3d(0, ' + (-y) + 'px, 0)';
          }

          /**
           * Initializes y and scroll variables
           */
          function initCoordinates () {
            y = 0;
            prevY = 0;
            prevScrollTop = 0;
          }

          /**
           * Initializes headers, tabs, and subheaders, and determines how they will transition on scroll
           */
          function init () {
            var activeView;

            cachedHeader = body.querySelector('[nav-bar="cached"] .bar-header');
            activeHeader = body.querySelector('[nav-bar="active"] .bar-header');

            if (!activeHeader) {
              return;
            }

            headerHeight = activeHeader.offsetHeight;
            contentTop = headerHeight;

            //since some people can have nested tabs, get the last tabs
            tabs = body.querySelectorAll('.tabs');
            tabs = tabs[tabs.length - 1];
            if (tabs) {
              tabsHeight = tabs.offsetHeight;
              if (tabs.parentNode.classList.contains('tabs-top')) {
                hasTabsTop = true;
                contentTop += tabsHeight;
              } else if (tabs.parentNode.classList.contains('tabs-bottom')) {
                hasTabsBottom = true;
              }
            }

            //subheader
            //since subheader is going to be nested in the active view, get the closest active view from $element and
            activeView = getParentWithAttr($element[0], 'nav-view', 'active');
            subHeader = activeView && activeView.querySelector('.bar-subheader');
            if (subHeader) {
              subHeaderHeight = subHeader.offsetHeight;
              contentTop += subHeaderHeight;
            }

            //set default end for header/tabs elements to scroll out of the scroll view and set elements end to default
            defaultEnd = contentTop * 2;
            headerEnd = tabsEnd = subheaderEnd = defaultEnd;

            //if tabs or subheader aren't available, set height to 0
            tabsHeight = tabsHeight || 0;
            subHeaderHeight = subHeaderHeight || 0;

            switch($attr.scrollSista) {
              case 'header':
                subheaderEnd =  headerHeight;
                tabsEnd = hasTabsTop ? headerHeight : 0;
                break;
              case 'header-tabs':
                headerStart = hasTabsTop ? tabsHeight : 0;
                subheaderEnd = hasTabsTop ? headerHeight + tabsHeight : headerHeight;
                break;
              case 'tabs-subheader':
                headerEnd = 0;
                headerStart = hasTabsTop ? contentTop - headerHeight : subHeaderHeight;
                tabsStart = hasTabsTop ? subHeaderHeight : 0;
                break;
              case 'tabs':
                headerEnd = 0;
                subheaderEnd =  hasTabsTop ? tabsHeight : 0;
                break;
              case 'subheader':
                headerEnd = 0;
                tabsEnd = 0;
                break;
              case 'header-subheader':
                tabsEnd = hasTabsTop ? headerHeight : 0;
                break;
              case 'subheader-header':
                headerStart = subHeaderHeight;
                tabsStart = hasTabsTop ? subHeaderHeight : 0;
                tabsEnd = hasTabsTop ? headerHeight : 0;
                break;
              //defaults to header-tabs-subheader
              default:
                headerStart = hasTabsTop ? contentTop - headerHeight : subHeaderHeight;
                tabsStart = hasTabsTop ? subHeaderHeight : 0;
            }
          }

          /**
           * Translates active and cached headers, and animates active children
           * @param y
           * @param duration
           */
          function translateHeaders (y, duration) {
            var fadeAmt = Math.max(0, 1 - (y / headerHeight));

            //translate active header
            if (activeHeader) {
              translateY(activeHeader, y, duration);
              angular.forEach(activeHeader.children, function (child) {
                child.style.opacity = fadeAmt;
                if (scaleHeaderElements) {
                  child.style[ionic.CSS.TRANSFORM] = 'scale(' + fadeAmt + ',' + fadeAmt + ')';
                }
              });
            }

            //translate cached header
            if (cachedHeader) {
              translateY(cachedHeader, y, duration);
            }
          }

          /**
           * Translates header, tabs, subheader elements and resets content top and/or bottom
           * When the active view leaves, we need sync functionality to reset headers and clear
           * @param y
           * @param duration
           */
          function translateElementsSync (y, duration) {
            var contentStyle = $element[0].style;
            var headerY = y > headerStart ? y - headerStart : 0;
            var tabsY, subheaderY;

            //subheader
            if (subHeader) {
              subheaderY =  y > subheaderStart ? y - subheaderStart : 0;
              translateY(subHeader, Math.min(subheaderEnd, subheaderY), duration);
            }

            //tabs
            if (tabs) {
              tabsY = Math.min(tabsEnd, y > tabsStart ? y - tabsStart : 0);

              if (hasTabsBottom) {
                tabsY = -tabsY;
                contentStyle.bottom = Math.max(0, tabsHeight - y) + 'px';
              }
              translateY(tabs, tabsY, duration);
            }

            //headers
            translateHeaders(Math.min(headerEnd, headerY), duration);

            //readjust top of ion-content
            contentStyle.top = Math.max(0, contentTop - y) + 'px';
          }

          /**
           * Translates header, tabs, subheader elements and resets content top and/or bottom
           * Wraps translate functionality in an animation frame request
           * @param y
           * @param duration
           */
          function translateElements (y, duration) {
            ionic.requestAnimationFrame(function() {
              translateElementsSync(y, duration);
            });
          }

          //Need to reinitialize the values on refreshComplete or things will get out of wack
          $scope.$on('scroll.refreshComplete', function () {
            initCoordinates();
          });

          /**
           * Before the active view leaves, reset elements, and reset the scroll container
           */
          $scope.$parent.$on('$ionicView.beforeLeave', function () {
            isNavBarTransitioning = true;
            translateElementsSync(0);
            activeHeader = null;
            cachedHeader = null;
          });

          /**
           * Scroll to the top when entering to reset then scrollView scrollTop. (prevents jumping)
           */
          $scope.$parent.$on('$ionicView.beforeEnter', function () {
            if (scrollView) {
              scrollView.scrollTo(0, 0);
            }
          });

          /**
           * Ionic sets the active/cached nav-bar AFTER the afterEnter event is called, so we need to set a small
           * timeout to let the nav-bar logic run.
           */
          $scope.$parent.$on('$ionicView.afterEnter', function () {
            initCoordinates();

            $timeout(function () {
              init();
              isNavBarTransitioning = false;
            }, 20, false);
          });

          /**
           * Called onScroll.  computes coordinates based on scroll position and translates accordingly
           */
          $element.bind('scroll', function (e) {
            if (isNavBarTransitioning) {
              return;
            }
            //support for jQuery event as well
            e = e.originalEvent || e;

            var duration = 0;
            var scrollTop = e.detail.scrollTop;

            y = scrollTop >= 0 ? Math.min(defaultEnd, Math.max(0, y + scrollTop - prevScrollTop)) : 0;

            //if we are at the bottom, animate the header/tabs back in
            if (scrollView.getScrollMax().top - scrollTop <= contentTop) {
              y = 0;
              duration = defaultDuration;
            }

            prevScrollTop = scrollTop;

            //if previous and current y are the same, no need to continue
            if (prevY === y) {
              return;
            }
            prevY = y;

            translateElements(y, duration);
          });

        }
      }
    }]);

})(angular, ionic);
