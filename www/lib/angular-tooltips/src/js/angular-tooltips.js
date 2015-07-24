/*global angular*/

(function withAngular(angular) {
  'use strict';

  angular.module('720kb.tooltips', [])
  .directive('tooltips', ['$window', '$compile', '$interpolate',
   function manageDirective($window, $compile, $interpolate) {

    var TOOLTIP_SMALL_MARGIN = 8 //px
      , TOOLTIP_MEDIUM_MARGIN = 9 //px
      , TOOLTIP_LARGE_MARGIN = 10 //px
      , CSS_PREFIX = '_720kb-tooltip-'
      , INTERPOLATE_START_SYM = $interpolate.startSymbol()
      , INTERPOLATE_END_SYM = $interpolate.endSymbol();
    return {
      'restrict': 'A',
      'scope': {},
      'link': function linkingFunction($scope, element, attr) {

        var initialized = false
          , thisElement = angular.element(element[0])
          , body = angular.element($window.document.getElementsByTagName('body')[0])
          , theTooltip
          , theTooltipHeight
          , theTooltipWidth
          , theTooltipMargin //used both for margin top left right bottom
          , height
          , width
          , offsetTop
          , offsetLeft
          , title = attr.tooltipTitle || attr.title || ''
          , content = attr.tooltipContent || ''
          , html = attr.tooltipHtml || ''
          , showTriggers = attr.tooltipShowTrigger || 'mouseover'
          , hideTriggers = attr.tooltipHideTrigger || 'mouseleave'
          , originSide = attr.tooltipSide || 'top'
          , side = originSide
          , size = attr.tooltipSize || 'medium'
          , tryPosition = typeof attr.tooltipTry !== 'undefined' && attr.tooltipTry !== null ? $scope.$eval(attr.tooltipTry) : true
          , className = attr.tooltipClass || ''
          , speed = (attr.tooltipSpeed || 'medium').toLowerCase()
          , delay = attr.tooltipDelay || 0
          , lazyMode = typeof attr.tooltipLazy !== 'undefined' && attr.tooltipLazy !== null ? $scope.$eval(attr.tooltipLazy) : true
          , hasCloseButton = typeof attr.tooltipCloseButton !== 'undefined' && attr.tooltipCloseButton !== null
          , closeButtonContent = attr.tooltipCloseButton || ''
          , htmlTemplate = '<div class="_720kb-tooltip ' + CSS_PREFIX + size + '">';

        if (hasCloseButton) {

          htmlTemplate = htmlTemplate + '<span class="' + CSS_PREFIX + 'close-button" ng-click="hideTooltip()"> ' + closeButtonContent + ' </span>';
        }
        if (attr.tooltipView) {
          if (attr.tooltipViewCtrl) {

            htmlTemplate = htmlTemplate + '<div ng-controller="' + attr.tooltipViewCtrl + '" ng-include="\'' + attr.tooltipView + '\'"></div>';
          } else {

            htmlTemplate = htmlTemplate + '<div ng-include="\'' + attr.tooltipView + '\'"></div>';
          }
        }


        htmlTemplate = htmlTemplate + '<div class="' + CSS_PREFIX + 'title"> ' + INTERPOLATE_START_SYM + 'title' + INTERPOLATE_END_SYM + '</div>' +
                                      INTERPOLATE_START_SYM + 'content' + INTERPOLATE_END_SYM + html + ' <span class="' + CSS_PREFIX + 'caret"></span>' +
                                      '</div>';

        $scope.title = title;
        $scope.content = content;
        $scope.html = html;
        //parse the animation speed of tooltips
        $scope.parseSpeed = function parseSpeed () {

          switch (speed) {
            case 'fast':
              speed = 100;
              break;
            case 'medium':
              speed = 450;
              break;
            case 'slow':
              speed = 800;
              break;
            default:
              speed = Number(speed);
          }
        };
        //create the tooltip
        theTooltip = $compile(htmlTemplate)($scope);

        theTooltip.addClass(className);

        body.append(theTooltip);

        $scope.isTooltipEmpty = function checkEmptyTooltip () {

          if (!$scope.title && !$scope.content && !$scope.html) {

            return true;
          }
        };

        $scope.initTooltip = function initTooltip (tooltipSide) {
          if (!$scope.isTooltipEmpty()) {
            theTooltip.css('visibility', '');

            height = thisElement[0].offsetHeight;
            width = thisElement[0].offsetWidth;
            offsetTop = $scope.getRootOffsetTop(thisElement[0], 0);
            offsetLeft = $scope.getRootOffsetLeft(thisElement[0], 0);
            //get tooltip dimension
            theTooltipHeight = theTooltip[0].offsetHeight;
            theTooltipWidth = theTooltip[0].offsetWidth;

            $scope.parseSpeed();
            $scope.tooltipPositioning(tooltipSide);
          } else {
            theTooltip.css('visibility', 'hidden');
          }
        };

        $scope.getRootOffsetTop = function getRootOffsetTop (elem, val){

          if (!elem.offsetParent){

            return val + elem.offsetTop;
          }

          return $scope.getRootOffsetTop(elem.offsetParent, val + elem.offsetTop - elem.scrollTop);
        };

        $scope.getRootOffsetLeft = function getRootOffsetLeft (elem, val){

          if (!elem.offsetParent){

            return val + elem.offsetLeft;
          }

          return $scope.getRootOffsetLeft(elem.offsetParent, val + elem.offsetLeft - elem.scrollLeft);
        };

        function onMouseEnterAndMouseOver() {
          if (!lazyMode || !initialized) {

            initialized = true;
            $scope.initTooltip(side);
          }
          if (tryPosition) {

            $scope.tooltipTryPosition();
          }
          $scope.showTooltip();
        }

        $scope.bindShowTriggers = function() {
          thisElement.bind(showTriggers, onMouseEnterAndMouseOver);
        };

        function onMouseLeaveAndMouseOut() {
          $scope.hideTooltip();
        }

        $scope.bindHideTriggers = function() {
          thisElement.bind(hideTriggers, onMouseLeaveAndMouseOut);
        };

        $scope.clearTriggers = function() {
          thisElement.unbind(showTriggers, onMouseEnterAndMouseOver);
          thisElement.unbind(hideTriggers, onMouseLeaveAndMouseOut);
        };

        $scope.bindShowTriggers();

        $scope.showTooltip = function showTooltip () {
          theTooltip.addClass(CSS_PREFIX + 'open');
          theTooltip.css('transition', 'opacity ' + speed + 'ms linear');

          if (delay) {

            theTooltip.css('transition-delay', delay + 'ms' );

          }

          $scope.clearTriggers();
          $scope.bindHideTriggers();
        };

        $scope.hideTooltip = function hideTooltip () {
          theTooltip.removeClass(CSS_PREFIX + 'open');
          theTooltip.css('transition', '');
          $scope.clearTriggers();
          $scope.bindShowTriggers();
        };

        $scope.removePosition = function removeTooltipPosition () {

          theTooltip
          .removeClass(CSS_PREFIX + 'left')
          .removeClass(CSS_PREFIX + 'right')
          .removeClass(CSS_PREFIX + 'top')
          .removeClass(CSS_PREFIX + 'bottom ');
        };

        $scope.tooltipPositioning = function tooltipPositioning (tooltipSide) {

          $scope.removePosition();

          var topValue
            , leftValue;

          if (size === 'small') {

            theTooltipMargin = TOOLTIP_SMALL_MARGIN;

          } else if (size === 'medium') {

            theTooltipMargin = TOOLTIP_MEDIUM_MARGIN;

          } else if (size === 'large') {

            theTooltipMargin = TOOLTIP_LARGE_MARGIN;
          }

          if (tooltipSide === 'left') {

            topValue = offsetTop + height / 2 - theTooltipHeight / 2;
            leftValue = offsetLeft - (theTooltipWidth + theTooltipMargin);

            theTooltip.css('top', topValue + 'px');
            theTooltip.css('left', leftValue + 'px');
            theTooltip.addClass(CSS_PREFIX + 'left');
          }

          if (tooltipSide === 'right') {

            topValue = offsetTop + height / 2 - theTooltipHeight / 2;
            leftValue = offsetLeft + width + theTooltipMargin;

            theTooltip.css('top', topValue + 'px');
            theTooltip.css('left', leftValue + 'px');
            theTooltip.addClass(CSS_PREFIX + 'right');
          }

          if (tooltipSide === 'top') {

            topValue = offsetTop - theTooltipMargin - theTooltipHeight;
            leftValue = offsetLeft + width / 2 - theTooltipWidth / 2;

            theTooltip.css('top', topValue + 'px');
            theTooltip.css('left', leftValue + 'px');
            theTooltip.addClass(CSS_PREFIX + 'top');
          }

          if (tooltipSide === 'bottom') {

            topValue = offsetTop + height + theTooltipMargin;
            leftValue = offsetLeft + width / 2 - theTooltipWidth / 2;
            theTooltip.css('top', topValue + 'px');
            theTooltip.css('left', leftValue + 'px');
            theTooltip.addClass(CSS_PREFIX + 'bottom');
          }
        };

        $scope.tooltipTryPosition = function tooltipTryPosition () {


          var theTooltipH = theTooltip[0].offsetHeight
            , theTooltipW = theTooltip[0].offsetWidth
            , topOffset = theTooltip[0].offsetTop
            , leftOffset = theTooltip[0].offsetLeft
            , winWidth = $window.outerWidth
            , winHeight = $window.outerHeight
            , rightOffset = winWidth - (theTooltipW + leftOffset)
            , bottomOffset = winHeight - (theTooltipH + topOffset)
            //element OFFSETS (not tooltip offsets)
            , elmHeight = thisElement[0].offsetHeight
            , elmWidth = thisElement[0].offsetWidth
            , elmOffsetLeft = thisElement[0].offsetLeft
            , elmOffsetTop = thisElement[0].offsetTop
            , elmOffsetRight = winWidth - (elmOffsetLeft + elmWidth)
            , elmOffsetBottom = winHeight - (elmHeight + elmOffsetTop)
            , offsets = {
              'left': leftOffset,
              'top': topOffset,
              'bottom': bottomOffset,
              'right': rightOffset
            }
            , posix = {
              'left': elmOffsetLeft,
              'right': elmOffsetRight,
              'top': elmOffsetTop,
              'bottom': elmOffsetBottom
            }
            , bestPosition = Object.keys(posix).reduce(function (best, key) {

                return posix[best] > posix[key] ? best : key;
            })
            , worstOffset = Object.keys(offsets).reduce(function (worst, key) {

                return offsets[worst] < offsets[key] ? worst : key;
            });

            if (originSide !== bestPosition && offsets[worstOffset] < 20) {

              side = bestPosition;

              $scope.tooltipPositioning(side);
              $scope.initTooltip(bestPosition);
            }
        };

        function onResize() {
          $scope.hideTooltip();
          $scope.initTooltip(originSide);
        }

        angular.element($window).bind('resize', onResize);

        // destroy the tooltip when the directive is destroyed
        // unbind all dom event handlers
        $scope.$on('$destroy', function() {
          angular.element($window).unbind('resize', onResize);
          $scope.clearTriggers();
          theTooltip.remove();
        });

        if (attr.tooltipTitle) {
          attr.$observe('tooltipTitle', function(val) {
            $scope.title = val;
            $scope.initTooltip(side);
          });
        }

        if (attr.title) {
          attr.$observe('title', function(val) {
            $scope.title = val;
            $scope.initTooltip(side);
          });
        }

        if (attr.tooltipContent) {
          attr.$observe('tooltipContent', function(val) {
            $scope.content = val;
            $scope.initTooltip(side);
          });
        }

        if (attr.tooltipHtml) {
          attr.$observe('tooltipHtml', function(val) {
            $scope.html = val;
            $scope.initTooltip(side);
          });
        }
      }
    };
  }]);
}(angular));
