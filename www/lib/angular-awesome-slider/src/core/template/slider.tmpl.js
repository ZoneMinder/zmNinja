(function(angular, undefined) {
'use strict';

  angular.module('angularAwesomeSlider')
  .run(['$templateCache', function ($templateCache) {
    $templateCache.put('ng-slider/slider-bar.tmpl.html',
    '<span ng-class="mainSliderClass" id="{{sliderTmplId}}">' +
      '<table><tr><td>' +
        '<div class="jslider-bg">' +
          '<i class="left"></i>'+
          '<i class="right"></i>'+
          '<i class="range"></i>'+
          '<i class="before"></i>'+
          '<i class="default"></i>'+
          '<i class="default"></i>'+
          '<i class="after"></i>'+          
        '</div>' +
        '<div class="jslider-pointer"></div>' +
        '<div class="jslider-pointer jslider-pointer-to"></div>' +
        '<div class="jslider-label" ng-show="options.limits"><span ng-bind="limitValue(options.from)"></span>{{options.dimension}}</div>' +
        '<div class="jslider-label jslider-label-to" ng-show="options.limits"><span ng-bind="limitValue(options.to)"></span>{{options.dimension}}</div>' +
        '<div class="jslider-value"><span></span>{{options.dimension}}</div>' +
        '<div class="jslider-value jslider-value-to"><span></span>{{options.dimension}}</div>' +
        '<div class="jslider-scale" id="{{sliderScaleDivTmplId}}"></div>' +
      '</td></tr></table>' +
    '</span>');
  }]);

})(window.angular);
