/*
ionic-pullup v1.1.0
 
Copyright 2016 Ariel Faur (https://github.com/arielfaur)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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
    .directive('ionPullUpFooter', [function () {
        return {
            restrict: 'AE',
            scope: {
                state: '=?',
                onExpand: '&',
                onCollapse: '&',
                onMinimize: '&',
                allowMidRange: '='
            },
            controller: ['$scope', '$element', '$attrs', '$timeout', '$rootScope', '$window', '$ionicPlatform', 'ionPullUpFooterState', 'ionPullUpFooterBehavior', function ($scope, $element, $attrs, $timeout, $rootScope, $window, $ionicPlatform, FooterState, FooterBehavior) {
                var
                    tabs, hasBottomTabs, header, tabsHeight, headerHeight, handleHeight = 0,
                    footer = {
                        height: 0,
                        posY: 0,
                        lastPosY: 0,
                        defaultHeight: $element[0].offsetHeight,
                        maxHeight: parseInt($attrs.maxHeight, 10) || 0,
                        initialState: $attrs.initialState ? $attrs.initialState.toUpperCase() : FooterState.COLLAPSED,
                        defaultBehavior: $attrs.defaultBehavior ? $attrs.defaultBehavior.toUpperCase() : FooterBehavior.EXPAND
                    };

                this.$onInit = function () {
                    $timeout(function () {
                        computeDefaultHeights();
                        $element.css({ 'transition': '300ms ease-in-out', 'padding': 0 });
                        if (tabs && hasBottomTabs) {
                            $element.css('bottom', tabsHeight + 'px');
                        }
                    });
                    updateUI();
                }

                function computeDefaultHeights() {
                    var el = $element[0];
                    tabs = el.closest('ion-tabs');
                    hasBottomTabs = tabs && tabs.classList.contains('tabs-bottom');
                    header = document.querySelector('ion-nav-bar .nav-bar-block[nav-bar=entering] > .bar-header');
                    tabsHeight = tabs ? tabs.querySelector('.tabs').offsetHeight : 0;
                    headerHeight = header ? header.offsetHeight : 0;
                }

                //PP
                function recomputeAllHeights() {
                    computeDefaultHeights();
                    footer.height = footer.maxHeight > 0 ? footer.maxHeight : $window.innerHeight - headerHeight - handleHeight - tabsHeight;

                    // PP 
                    footer.height -=50;

                    if ($rootScope.platformOS == 'ios') footer.height -=30;
                    //if ($rootScope.platformOS == 'android') footer.height -=10;
                  }

                function computeHeights() {
                    footer.height = footer.maxHeight > 0 ? footer.maxHeight : $window.innerHeight - headerHeight - handleHeight - tabsHeight;

                    // PP
                    
                     // PP 
                     footer.height -=50;

                     if ($rootScope.platformOS == 'ios') footer.height -=30;
                     //if ($rootScope.platformOS == 'android') footer.height -=10;

                    $element.css({ 'height': footer.height + 'px' });

                    if (footer.initialState == FooterState.MINIMIZED) {

                        minimize();
                    } else {
                        collapse();
                    }
                }

                function updateUI() {
                    $timeout(function () {
                        computeHeights();
                    }, 300);
                    $element.css({ 'transition': 'none', 'padding': 0 });
                }

                function expand() {
                    recomputeAllHeights();
                    footer.lastPosY = 0;
                    // adjust CSS values with new heights in case they changed
                    // PP added height
                    $element.css({ 'height':footer.height + 'px', '-webkit-transform': 'translate3d(0, 0, 0)', 'transform': 'translate3d(0, 0, 0)' });
                    $element.css({ 'transition': '300ms ease-in-out', 'padding': 0 });
                    $scope.onExpand();
                    $scope.state = FooterState.EXPANDED;
                }

                function collapse() {
                    footer.lastPosY = tabs ? footer.height - tabsHeight : footer.height - footer.defaultHeight;
                    $element.css({ '-webkit-transform': 'translate3d(0, ' + footer.lastPosY + 'px, 0)', 'transform': 'translate3d(0, ' + footer.lastPosY + 'px, 0)' });
                    $scope.onCollapse();
                    $scope.state = FooterState.COLLAPSED;
                }

                function minimize() {
                    footer.lastPosY = footer.height;
                    $element.css({ '-webkit-transform': 'translate3d(0, ' + footer.lastPosY + 'px, 0)', 'transform': 'translate3d(0, ' + footer.lastPosY + 'px, 0)' });
                    $scope.onMinimize();
                    $scope.state = FooterState.MINIMIZED;
                }


                this.setHandleHeight = function (height) {
                    handleHeight = height;
                };

                this.getHeight = function () {
                    return $element[0].offsetHeight;
                };

                this.getBackground = function () {
                    return $window.getComputedStyle($element[0]).background;
                };

                this.getInitialState = function () {
                    return footer.initialState;
                };

                this.getDefaultBehavior = function () {
                    return footer.defaultBehavior;
                };

                this.onTap = function (e) {
                    e.gesture.srcEvent.preventDefault();
                    e.gesture.preventDefault();

                    $timeout(function () {
                        if ($scope.state == FooterState.COLLAPSED) {
                            if (footer.defaultBehavior == FooterBehavior.HIDE) {
                                $scope.state = FooterState.MINIMIZED;
                            } else {
                                $scope.state = FooterState.EXPANDED;
                            }
                        } else {
                            if ($scope.state == FooterState.MINIMIZED) {
                                if (footer.defaultBehavior == FooterBehavior.HIDE)
                                    $scope.state = FooterState.COLLAPSED;
                                else
                                    $scope.state = FooterState.EXPANDED;
                            } else {
                                // footer is expanded
                                $scope.state = footer.initialState == FooterState.MINIMIZED ? FooterState.MINIMIZED : FooterState.COLLAPSED;
                            }
                        }
                    });
                };

                this.onDrag = function (e) {
                    e.gesture.srcEvent.preventDefault();
                    e.gesture.preventDefault();

                    switch (e.type) {
                        case 'dragstart':
                            $element.css('transition', 'none');
                            break;
                        case 'drag':
                            footer.posY = Math.round(e.gesture.deltaY) + footer.lastPosY;
                            if (footer.posY < 0 || footer.posY > footer.height) return;
                            $element.css({ '-webkit-transform': 'translate3d(0, ' + footer.posY + 'px, 0)', 'transform': 'translate3d(0, ' + footer.posY + 'px, 0)' });
                            break;
                        case 'dragend':
                            $element.css({ 'transition': '300ms ease-in-out' });
                            if (!$scope.allowMidRange) {
                                $timeout(function () {
                                    if (footer.lastPosY > footer.posY) {
                                        $scope.state = FooterState.EXPANDED;
                                    }
                                    else if (footer.lastPosY < footer.posY) {
                                        $scope.state = (footer.initialState == FooterState.MINIMIZED) ? FooterState.MINIMIZED : FooterState.COLLAPSED;
                                    }
                                });
                            }
                            else {
                                footer.lastPosY = footer.posY;
                            }
                            break;
                    }
                };

                function cleanup() {
                    $window.removeEventListener('orientationchange', updateUI);
                    deregisterWatch();
                }
                var deregisterWatch = $scope.$watch('state', function (newState, oldState) {
                    
                    if (oldState === undefined || newState == oldState) return;
                    switch (newState) {
                        case FooterState.COLLAPSED:
                            collapse();
                            break;
                        case FooterState.EXPANDED:
                            expand();
                            break;
                        case FooterState.MINIMIZED:
                            minimize();
                            break;
                    }
                    $rootScope.$broadcast('ionPullUp:tap', $scope.state, footer.defaultBehavior);
                });

                $scope.$on('$destroy', cleanup);

                $ionicPlatform.ready(function () {
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
    .component('ionPullUpContent', {
        require: {
            FooterController: '^ionPullUpFooter'
        },
        controller: ['$element', '$attrs', function ($element, $attrs) {
            this.$onInit = function () {
                var controller = this.FooterController,
                    footerHeight = controller.getHeight();
                $element.css({ 'display': 'block', 'margin-top': footerHeight + 'px', width: '100%' });
                // add scrolling if needed
                if ($attrs.scroll && $attrs.scroll.toUpperCase() == 'TRUE') {
                    $element.css({ 'overflow-y': 'scroll', 'overflow-x': 'hidden' });
                }
            }
        }]
    })
    .component('ionPullUpBar', {
        require: {
            FooterController: '^ionPullUpFooter'
        },
        controller: ['$element', function ($element) {
            this.$onInit = function () {
                var controller = this.FooterController,
                    footerHeight = controller.getHeight();
                $element.css({ 'display': 'flex', 'height': footerHeight + 'px', position: 'absolute', right: '0', left: '0' });
            }
        }]
    })
    .directive('ionPullUpTrigger', ['$ionicGesture', function ($ionicGesture) {
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
    .component('ionPullUpHandle', {
        require: {
            FooterController: '^ionPullUpFooter'
        },
        controller: ['$scope', '$element', '$attrs', 'ionPullUpFooterState', 'ionPullUpFooterBehavior', '$ionicGesture', '$ionicPlatform', '$timeout', '$window', function ($scope, $element, $attrs, FooterState, FooterBehavior, $ionicGesture, $ionicPlatform, $timeout, $window) {
            var height = parseInt($attrs.height, 10) || 25, width = parseInt($attrs.width, 10) || 100,
                iconExpand = $attrs.iconExpand,
                iconCollapse = $attrs.iconCollapse;

            $element
                .css({
                    display: 'block',
                    'background-color': 'inherit',
                    position: 'absolute',
                    top: 1 - height + 'px',
                    left: (($window.innerWidth - width) / 2) + 'px',
                    height: height + 'px',
                    width: width + 'px',
                    'text-align': 'center'
                })
                .append('<i>');

            this.$onInit = function () {
                var controller = this.FooterController;

                // add gesture
                $ionicGesture.on('tap', controller.onTap, $element);
                $ionicGesture.on('drag dragstart dragend', controller.onDrag, $element);

                controller.setHandleHeight(height);

                var state = controller.getInitialState(),
                    behavior = controller.getDefaultBehavior();

                toggleIcons(state, behavior);
                
                updateUI();
            }

            $scope.$on('ionPullUp:tap', function (e, state, behavior) {
                toggleIcons(state, behavior);
            });

            function toggleIcons(state, behavior) {
                if (!iconExpand || !iconCollapse) return;

                //remove any icons
                $element.find('i').removeClass([iconExpand, iconCollapse].join(' '));

                if (state == FooterState.COLLAPSED) {
                    if (behavior == FooterBehavior.HIDE) {
                        $element.find('i').addClass(iconCollapse);
                    } else {
                        $element.find('i').addClass(iconExpand);
                    }
                } else {
                    if (state == FooterState.MINIMIZED) {
                        if (behavior == FooterBehavior.HIDE)
                            $element.find('i').addClass(iconExpand);
                        else
                            $element.find('i').addClass(iconExpand);
                    } else {
                        // footer is expanded
                        $element.find('i').addClass(iconCollapse);
                    }
                }
            }

            function updateUI() {
                $timeout(function () {
                    $element.css('left', (($window.innerWidth - width) / 2) + 'px');
                }, 300);
            }

            $ionicPlatform.ready(function () {
                $window.addEventListener('orientationchange', updateUI);
                $ionicPlatform.on("resume", updateUI);
            });
        }]
    });
