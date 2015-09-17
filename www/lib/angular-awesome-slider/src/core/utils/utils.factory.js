(function(angular){
  'use strict';

  angular.module('angularAwesomeSlider').factory('sliderUtils', ['$window', function(win) {
    return {
      offset: function(elm) { 
        // try {return elm.offset();} catch(e) {} 
        var rawDom = elm[0]; 
        var _x = 0; 
        var _y = 0; 
        var body = document.documentElement || document.body; 
        var scrollX = window.pageXOffset || body.scrollLeft; 
        var scrollY = window.pageYOffset || body.scrollTop; 
        _x = rawDom.getBoundingClientRect().left + scrollX; 
        _y = rawDom.getBoundingClientRect().top + scrollY; 
        return { left: _x, top:_y };
      },
      browser: function() {
        // TODO finish browser detection and this case
        var userAgent = win.navigator.userAgent;        
        var browsers = {mozilla: /mozilla/i, chrome: /chrome/i, safari: /safari/i, firefox: /firefox/i, ie: /internet explorer/i};
        for(var key in browsers) {
          if (browsers[key].test(userAgent)) {
            return key;
          }
        }
        return 'unknown';
      }
    };
  }]);  
})(angular);

    

