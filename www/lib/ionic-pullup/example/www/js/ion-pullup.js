angular.module('ionic-pullup', [])
  .constant('ionPullUpFooterState', {
      COLLAPSED: 'COLLAPSED',
      MINIMIZED: 'MINIMIZED',
      EXPANDED: 'EXPANDED'
  })
  .constant('ionPullUpFooterBehavior', {
      HIDE: 'HIDE',
      EXPAND: 'EXPAND'
  })
  .directive('ionPullUpFooter', ['$timeout', '$rootScope', '$window', '$ionicPlatform', function($timeout, $rootScope, $window, $ionicPlatform) {
      return {
          restrict: 'AE',
          scope: {
              onExpand: '&',
              onCollapse: '&',
              onMinimize: '&'
          },
          controller: ['$scope', '$element', '$attrs', 'ionPullUpFooterState', 'ionPullUpFooterBehavior', function($scope, $element, $attrs, FooterState, FooterBehavior) {
              var
                tabs, hasBottomTabs, header, tabsHeight, headerHeight, handleHeight = 0,
                footer = {
                    height: 0,
                    posY: 0,
                    lastPosY: 0,
                    state: FooterState.COLLAPSED,
                    defaultHeight : $element[0].offsetHeight,
                    maxHeight: parseInt($attrs.maxHeight, 10) || 0,
                    initialState: $attrs.initialState ? $attrs.initialState.toUpperCase() : FooterState.COLLAPSED,
                    defaultBehavior: $attrs.defaultBehavior ? $attrs.defaultBehavior.toUpperCase() : FooterBehavior.EXPAND
                };

              function init() {
                  computeDefaultHeights();

                  $element.css({'transition': '300ms ease-in-out', 'padding': 0});
                  if (tabs && hasBottomTabs) {
                      $element.css('bottom', tabs.offsetHeight + 'px');
                  }
              }

              function computeDefaultHeights() {
                  tabs = document.querySelector('.tabs');
                  hasBottomTabs = document.querySelector('.tabs-bottom');
                  header = document.querySelector('.bar-header');
                  tabsHeight = tabs ? tabs.offsetHeight : 0;
                  headerHeight = header ? header.offsetHeight : 0;
              }

              function computeHeights() {
                  footer.height = footer.maxHeight > 0 ? footer.maxHeight : $window.innerHeight - headerHeight - handleHeight - tabsHeight;
                  $element.css({'height': footer.height + 'px'});

                  if (footer.initialState == FooterState.MINIMIZED) {
                      minimize();
                  }  else {
                      collapse();
                  }
              }

              function updateUI() {
                  $timeout(function() {
                      computeHeights();
                  }, 300);
              }

              function recomputeAllHeights() {
                  computeDefaultHeights();
                  footer.height = footer.maxHeight > 0 ? footer.maxHeight : $window.innerHeight - headerHeight - handleHeight - tabsHeight;
                }

              function expand() {
                  // recompute height right here to make sure we have the latest
                  recomputeAllHeights();
                  footer.lastPosY = 0;
                  // adjust CSS values with new heights in case they changed
                  $element.css({'height':footer.height + 'px',  '-webkit-transform': 'translate3d(0, 0, 0)', 'transform': 'translate3d(0, 0, 0)'});
                  $scope.onExpand();
                  footer.state = FooterState.EXPANDED;
              }

              function collapse() {
                  footer.lastPosY = (tabs && hasBottomTabs) ? footer.height - tabsHeight : footer.height - footer.defaultHeight;
                  $element.css({'-webkit-transform': 'translate3d(0, ' + footer.lastPosY  + 'px, 0)', 'transform': 'translate3d(0, ' + footer.lastPosY  + 'px, 0)'});
                  $scope.onCollapse();
                  footer.state = FooterState.COLLAPSED
              }

              function minimize() {
                  footer.lastPosY = footer.height;
                  $element.css({'-webkit-transform': 'translate3d(0, ' + footer.lastPosY  + 'px, 0)', 'transform': 'translate3d(0, ' + footer.lastPosY  + 'px, 0)'});
                  $scope.onMinimize();
                  footer.state = FooterState.MINIMIZED;
              }


              this.setHandleHeight = function(height) {
                  handleHeight = height;
                  computeHeights();
              };

              this.getHeight = function() {
                  return $element[0].offsetHeight;
              };

              this.getBackground = function() {
                return $window.getComputedStyle($element[0]).background;
              };

              this.onTap = function(e) {
                  e.gesture.srcEvent.preventDefault();
                  e.gesture.preventDefault();

                  if (footer.state == FooterState.COLLAPSED) {
                      if (footer.defaultBehavior == FooterBehavior.HIDE) {
                          minimize();
                      } else {
                          expand();
                      }
                  } else {
                      if (footer.state == FooterState.MINIMIZED) {
                          if (footer.defaultBehavior == FooterBehavior.HIDE)
                              collapse();
                          else
                              expand();
                      } else {
                          // footer is expanded
                          footer.initialState == FooterState.MINIMIZED ? minimize() : collapse();
                      }
                  }

                  $rootScope.$broadcast('ionPullUp:tap', footer.state);
              };

              this.onDrag = function(e) {
                  e.gesture.srcEvent.preventDefault();
                  e.gesture.preventDefault();

                  switch (e.type) {
                      case 'dragstart':
                          $element.css('transition', 'none');
                          break;
                      case 'drag':
                          footer.posY = Math.round(e.gesture.deltaY) + footer.lastPosY;
                          if (footer.posY < 0 || footer.posY > footer.height) return;
                          $element.css({'-webkit-transform': 'translate3d(0, ' + footer.posY + 'px, 0)', 'transform': 'translate3d(0, ' + footer.posY + 'px, 0)'});
                          break;
                      case 'dragend':
                          $element.css({'transition': '300ms ease-in-out'});
                          footer.lastPosY = footer.posY;
                          break;
                  }
              };

              init();

              $ionicPlatform.ready(function() {
                  $window.addEventListener('orientationchange', updateUI);
                  $ionicPlatform.on("resume", updateUI);
              });

          }],
          compile: function(element, attrs) {
              attrs.defaultHeight && element.css('height', parseInt(attrs.defaultHeight, 10) + 'px');
              element.addClass('bar bar-footer');
          }
      }
  }])
  .directive('ionPullUpContent', [function() {
      return {
          restrict: 'AE',
          require: '^ionPullUpFooter',
          link: function (scope, element, attrs, controller) {
              var
                footerHeight = controller.getHeight();
              element.css({'display': 'block', 'margin-top': footerHeight + 'px', width: '100%'});
              // add scrolling if needed
              if (attrs.scroll && attrs.scroll.toUpperCase() == 'TRUE') {
                  element.css({'overflow-y': 'scroll', 'overflow-x': 'hidden'});
              }
          }
      }
  }])
  .directive('ionPullUpBar', [function() {
      return {
          restrict: 'AE',
          require: '^ionPullUpFooter',
          link: function (scope, element, attrs, controller) {
              var
                footerHeight = controller.getHeight();
              element.css({'display': 'flex', 'height': footerHeight + 'px', position: 'absolute', right: '0', left: '0'});

          }
      }
  }])
  .directive('ionPullUpTrigger', ['$ionicGesture', function($ionicGesture) {
      return {
          restrict: 'AE',
          require: '^ionPullUpFooter',
          link: function (scope, element, attrs, controller) {
              // add gesture
              $ionicGesture.on('tap', controller.onTap, element);
              $ionicGesture.on('drag dragstart dragend', controller.onDrag, element);
          }
      }
  }])
  .directive('ionPullUpHandle', ['$ionicGesture', '$ionicPlatform', '$timeout', '$window',  function($ionicGesture, $ionicPlatform, $timeout, $window) {
      return {
          restrict: 'AE',
          require: '^ionPullUpFooter',
          link: function (scope, element, attrs, controller) {
              var height = parseInt(attrs.height,10) || 25, width = parseInt(attrs.width, 10) || 100,
                background =  controller.getBackground(),
                toggleClasses = attrs.toggle;

              controller.setHandleHeight(height);

              element.css({
                  display: 'block',
                  background: background,
                  position: 'absolute',
                  top: 1-height + 'px',
                  left: (($window.innerWidth - width) / 2) + 'px',
                  height: height + 'px',
                  width: width + 'px',
                  'text-align': 'center'
                  });

              // add gesture
              $ionicGesture.on('tap', controller.onTap, element);
              $ionicGesture.on('drag dragstart dragend', controller.onDrag, element);

              scope.$on('ionPullUp:tap', function() {
                  element.find('i').toggleClass(toggleClasses);
              });

              function updateUI() {
                  $timeout(function() {
                      element.css('left', (($window.innerWidth - width) / 2) + 'px');
                  }, 300);
              }

              $ionicPlatform.ready(function() {
                  $window.addEventListener('orientationchange', updateUI);
                  $ionicPlatform.on("resume", updateUI);
              });
          }
      }
  }]);
