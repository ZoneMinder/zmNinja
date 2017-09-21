(function (angular) {
  'use strict';

  angular.module('angularAwesomeSlider', [])
    // DIRECTIVE
    .directive('slider', [
      '$compile', '$templateCache','$timeout', '$window', 'slider',
      function(compile, templateCache, timeout, win, Slider) {
        return {
          restrict : 'AE',
          require: '?ngModel',
          scope: { options:'=', ngDisabled: '='},
          priority: 1,
          link : function(scope, element, attrs, ngModel) {

          if(!ngModel) return;

          if (!scope.options)
            throw new Error('You must provide a value for "options" attribute.');

          var injector = angular.injector();

          // options as inline variable
          if (angular.isString(scope.options)) {
            scope.options = angular.toJson(scope.options);
          }

          scope.mainSliderClass = 'jslider';
          scope.mainSliderClass += scope.options.skin ? ' jslider_' + scope.options.skin : ' ';
          scope.mainSliderClass += scope.options.vertical ? ' vertical ' : '';
          scope.mainSliderClass += scope.options.css ? ' sliderCSS' : '';
          scope.mainSliderClass += scope.options.className ? ' ' + scope.options.className : '';

          // handle limit labels visibility
          scope.options.limits = angular.isDefined(scope.options.limits) ? scope.options.limits : true;

          // compile template
          element.after(compile(templateCache.get('ng-slider/slider-bar.tmpl.html'))(scope, function(clonedElement, scope) {
            scope.tmplElt = clonedElement;
          }));

          // init

          var initialized = false;

          var init = function(value) {
            scope.from = ''+scope.options.from;
            scope.to = ''+scope.options.to;
            if (scope.options.calculate && angular.isFunction(scope.options.calculate)) {
              scope.from = scope.options.calculate(scope.from);
              scope.to = scope.options.calculate(scope.to);
            }

            var OPTIONS = {
              from: !scope.options.round ? parseInt(scope.options.from, 10) : parseFloat(scope.options.from),
              to: !scope.options.round ? parseInt(scope.options.to, 10) : parseFloat(scope.options.to),
              step: scope.options.step,
              smooth: scope.options.smooth,
              limits: scope.options.limits,
              round: scope.options.round || false,
              value: value || ngModel.$viewValue,
              dimension: '',
              scale: scope.options.scale,
              modelLabels: scope.options.modelLabels,
              vertical: scope.options.vertical,
              css: scope.options.css,
              className: scope.options.className,
              realtime: scope.options.realtime,
              cb: forceApply,
              threshold: scope.options.threshold,
              heterogeneity: scope.options.heterogeneity
            };

            OPTIONS.calculate = scope.options.calculate || undefined;
            OPTIONS.onstatechange = scope.options.onstatechange || undefined;

            // slider
            scope.slider = !scope.slider ? slidering(element, scope.tmplElt, OPTIONS) : scope.slider.init(element, scope.tmplElt, OPTIONS);

            if (!initialized) {
              initListener();
            }

            // scale
            var scaleDiv = scope.tmplElt.find('div')[7];
            angular.element(scaleDiv).html(scope.slider.generateScale());
            scope.slider.drawScale(scaleDiv);

            if (scope.ngDisabled) {
              disabler(scope.ngDisabled);
            }

            initialized = true;
          };

          function initListener() {
            // window resize listener
            angular.element(win).bind('resize', function(event) {
              scope.slider.onresize();
            });
          }

          // model -> view
          ngModel.$render = function () {
            //elm.html(ctrl.$viewValue);
            var singleValue = false;

            if (!ngModel.$viewValue && ngModel.$viewValue !== 0) {
              return;
            }

            if (typeof(ngModel.$viewValue) === 'number') {
              ngModel.$viewValue = ''+ngModel.$viewValue;
            }

            if( !ngModel.$viewValue.split(';')[1]) {
              scope.mainSliderClass += ' jslider-single';
            }
            else {
              scope.mainSliderClass = scope.mainSliderClass.replace(' jslider-single', '');
            }

            if (scope.slider) {
              var vals = ngModel.$viewValue.split(";");
              scope.slider.getPointers()[0].set(vals[0], true);
              if (vals[1]) {
                scope.slider.getPointers()[1].set(vals[1], true);
                //if moving left to right with two pointers
                //we need to "finish" moving the first
                if(parseInt(vals[1]) > parseInt(vals[0])){
                  scope.slider.getPointers()[0].set(vals[0], true);
                }
              }              
            }

          };

          scope.$on('slider-value-update', function(e, msg){            
            init(msg.value);  
            timeout(function(){
              scope.slider.redrawPointers();
            });          
          });

          // view -> model
          var forceApply = function(value, released) {
            if (scope.disabled)
              return;
            scope.$apply(function() {
              ngModel.$setViewValue(value);
            });
            if (scope.options.callback){
              scope.options.callback(value, released);
            }
          };

          // watch options
          scope.$watch('options', function(value) {
            timeout(function(){
              init();
            });
          }, scope.watchOptions || true);

          // disabling
          var disabler = function(value) {
            scope.disabled = value;
            if (scope.slider) {
              scope.tmplElt.toggleClass('disabled');
              scope.slider.disable(value);
            }
          };

          scope.$watch('ngDisabled', function(value) {
            disabler(value);
          });

          scope.limitValue = function(value) {
            if (scope.options.modelLabels) {
              if (angular.isFunction(scope.options.modelLabels)) {
                return scope.options.modelLabels(value);
              }
              return scope.options.modelLabels[value] !== undefined ? scope.options.modelLabels[value] : value;
            }
            return value;
          };

          var slidering = function( inputElement, element, settings) {
            return new Slider( inputElement, element, settings );
          };
        }
      };
    }])
.config(function() {})
.run(function() {});
})(angular);
;(function(angular){
  'use strict';
  angular.module('angularAwesomeSlider').constant('sliderConstants', {
    SLIDER: {
      settings: {
        from: 1,
        to: 40,
        step: 1,
        smooth: true,
        limits: false,
        round: false,	
        value: "3",
        dimension: "",
        vertical: false,
        calculate: false,
        onstatechange: false,
        callback: false,
        realtime: false
      },
      className: "jslider",
      selector: ".jslider-",
      css: {
        visible : { visibility: "visible" },
        hidden : { visibility: "hidden" }
      }
    },
    EVENTS: {
      
    }
  });

}(angular));;(function(angular){
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

    

;(function(angular){
  'use strict';

  angular.module('angularAwesomeSlider').factory('sliderDraggable', ['sliderUtils', function(utils) {

    function Draggable(){
      this._init.apply( this, arguments );
    }

    Draggable.prototype.oninit = function(){
    };

    Draggable.prototype.events = function(){
    };

    Draggable.prototype.onmousedown = function(){
      this.ptr.css({ position: 'absolute' });
    };

    Draggable.prototype.onmousemove = function( evt, x, y ){
      this.ptr.css({ left: x, top: y });
    };

    Draggable.prototype.onmouseup = function(){};

    Draggable.prototype.isDefault = {
      drag: false,
      clicked: false,
      toclick: true,
      mouseup: false
    };

    Draggable.prototype._init = function() {
      if( arguments.length > 0 ){
        this.ptr = arguments[0];
        this.label = arguments[3];
        this.parent = arguments[2];

        if (!this.ptr)
          return;
        //this.outer = $(".draggable-outer");

        this.is = {};
        angular.extend( this.is, this.isDefault );
        var offset = utils.offset(this.ptr);

        this.d = {
          left: offset.left,
          top: offset.top,
          width: this.ptr[0].clientWidth,
          height: this.ptr[0].clientHeight
        };

        this.oninit.apply( this, arguments );

        this._events();
      }
    };

    Draggable.prototype._getPageCoords = function( event ){
      if( event.targetTouches && event.targetTouches[0] ){
        return { x: event.targetTouches[0].pageX, y: event.targetTouches[0].pageY };
      } else
      return { x: event.pageX, y: event.pageY };
    };

    Draggable.prototype._bindEvent = function( ptr, eventType, handler ){
      var self = this;

      // PS need to bind to touch and non-touch events for devices which support both
      if( this.supportTouches_ ){
        ptr[0].addEventListener( this.events_[ eventType ].touch, handler, false );
      }
      
      ptr.bind( this.events_[ eventType ].nonTouch, handler );
    };

    Draggable.prototype._events = function(){
      var self = this;

      this.supportTouches_ = 'ontouchend' in document;
      this.events_ = {
        'click': { touch : 'touchstart', nonTouch : 'click' },
        'down': { touch : 'touchstart', nonTouch : 'mousedown' },
        'move': { touch : 'touchmove', nonTouch : 'mousemove' },
        'up'  : { touch : 'touchend', nonTouch: 'mouseup'},
        'mousedown'  : { touch : 'mousedown', nonTouch : 'mousedown' }
      };

      var documentElt = angular.element(window.document);

      this._bindEvent(documentElt, 'move', function(event) {        
        if(self.is.drag) {
          event.stopPropagation();
          event.preventDefault();
          if (!self.parent.disabled) {
            self._mousemove(event);            
          }  
        }
      });
      this._bindEvent(documentElt, 'down', function(event) {
        if(self.is.drag) {
          event.stopPropagation();
          event.preventDefault();
        }
      });
      this._bindEvent(documentElt, 'up', function(event) {        
        self._mouseup(event);        
      });

      this._bindEvent( this.label, 'down', function(event) {
        self._mousedown( event );
        return false;
      });
      this._bindEvent( this.label, 'up', function(event) {
        self._mouseup( event );
      });      
     
      this._bindEvent( this.ptr, 'down', function(event) {
        self._mousedown( event );
        return false;
      });
      this._bindEvent( this.ptr, 'up', function(event) {
        self._mouseup( event );
      });      
     
      // TODO see if needed
      this.events();
    };

    Draggable.prototype._mousedown = function( evt ){
      this.is.drag = true;
      this.is.clicked = false;
      this.is.mouseup = false;   

      var coords = this._getPageCoords( evt );
      this.cx = coords.x - this.ptr[0].offsetLeft;
      this.cy = coords.y - this.ptr[0].offsetTop;

      angular.extend(this.d, {        
        left: coords.x,
        top: coords.y,
        width: this.ptr[0].clientWidth,
        height: this.ptr[0].clientHeight
      });

      if( this.outer && this.outer.get(0) ){
        this.outer.css({ height: Math.max(this.outer.height(), $(document.body).height()), overflow: 'hidden' });
      }

      this.onmousedown( evt );
    };

    Draggable.prototype._mousemove = function( evt ){
      this.is.toclick = false;
      var coords = this._getPageCoords( evt );
      this.onmousemove( evt, coords.x - this.cx, coords.y - this.cy );
    };    

    Draggable.prototype._mouseup = function( evt ){
      var oThis = this;

      if( this.is.drag ){
        this.is.drag = false;

        var browser = utils.browser();

        if( this.outer && this.outer.get(0) ) {

          if( browser === 'mozilla' ){
            this.outer.css({ overflow: "hidden" });
          } else {
            this.outer.css({ overflow: "visible" });
          }

          // TODO finish browser detection and this case, remove following line
          this.outer.css({ height: "auto" });
          // if( browser === 'ie' && $.browser.version == '6.0' ){
          //   this.outer.css({ height: "100%" });
          // } else {
          //   this.outer.css({ height: "auto" });
          // }
          
        }

        this.onmouseup( evt );
      }
    };

    return Draggable;
  }]);
}(angular));
;(function(angular){
  'use strict';

  angular.module('angularAwesomeSlider').factory('sliderPointer', ['sliderDraggable', 'sliderUtils', function(Draggable, utils) {

    function SliderPointer() {
      Draggable.apply(this, arguments);
    }

    SliderPointer.prototype = new Draggable();

    SliderPointer.prototype.oninit = function( ptr, id, vertical, label, _constructor ) {
      this.uid = id;
      this.parent = _constructor;
      this.value = {};
      this.vertical = vertical;
      this.settings = angular.copy(_constructor.settings);
      this.threshold = this.settings.threshold;
    };

    SliderPointer.prototype.onmousedown = function( evt ) {
      var off = utils.offset(this.parent.domNode);

      var offset = {
        left: off.left,
        top: off.top,
        width: this.parent.domNode[0].clientWidth,
        height: this.parent.domNode[0].clientHeight
      };

      this._parent = {
        offset: offset,
        width: offset.width,
        height: offset.height
      };

      this.ptr.addClass('jslider-pointer-hover');
    };

    SliderPointer.prototype.onmousemove = function( evt, x, y ){
      var coords = this._getPageCoords( evt );
      this._set(!this.vertical ? this.calc( coords.x ) : this.calc( coords.y ));
      if( this.settings.realtime && this.settings.cb && angular.isFunction(this.settings.cb) )
        this.settings.cb.call( this.parent, this.parent.getValue(), !this.is.drag  );
    };

    SliderPointer.prototype.onmouseup = function(evt){
      if( this.settings.cb && angular.isFunction(this.settings.cb))
        this.settings.cb.call( this.parent, this.parent.getValue(), !this.is.drag );

      if (!this.is.drag)
        this.ptr.removeClass('jslider-pointer-hover');
    };

    SliderPointer.prototype.limits = function( x ){
      return this.parent.limits(x, this);
    };

    SliderPointer.prototype.calc = function( coords ){
      return !this.vertical ?
        this.limits(((coords-this._parent.offset.left)*100)/this._parent.width)
        :
        this.limits(((coords-this._parent.offset.top)*100)/this._parent.height);
    };

    SliderPointer.prototype.set = function( value, opt_origin ){
      this.value.origin = this.parent.round(value);
      this._set(this.parent.valueToPrc(value,this), opt_origin);
    };

    SliderPointer.prototype._set = function( prc, opt_origin ){
      this.allowed = true;

      var oldOrigin = this.value.origin;
      var oldPerc = this.value.prc;

      this.value.origin = this.parent.prcToValue(prc);
      this.value.prc = prc;

      // check threshold
      if (this.threshold && this.parent.o.pointers[1]) {
        var v1 = this.value.origin,
            v2 = this.parent.o.pointers[this.uid === 0 ? 1:0].value.origin;
        this.allowed =  Math.abs(v2 - v1) >= this.threshold;
        if (!this.allowed && oldOrigin !== undefined && oldPerc !== undefined){
          this.value.origin = oldOrigin;
          this.value.prc = oldPerc;
        }
      }

      if (!this.vertical)
        this.ptr.css({left:this.value.prc+'%'});
      else
        this.ptr.css({top:this.value.prc+'%', marginTop: -5});
      this.parent.redraw(this);
    };

    return SliderPointer;
  }]);
}(angular));
;(function(angular){
  'use strict';

  angular.module('angularAwesomeSlider').factory('slider', ['sliderPointer', 'sliderConstants', 'sliderUtils', function(SliderPointer, sliderConstants, utils) {

    function Slider(){
      return this.init.apply(this, arguments);
    }

    Slider.prototype.init = function( inputNode, templateNode, settings ){
      this.settings = settings;
      this.inputNode = inputNode;
      this.inputNode.addClass('ng-hide');

      this.settings.interval = this.settings.to-this.settings.from;

      if(this.settings.calculate && angular.isFunction(this.settings.calculate)) {
        this.nice = this.settings.calculate;
      }
        
      if(this.settings.onstatechange && angular.isFunction(this.settings.onstatechange)) {
        this.onstatechange = this.settings.onstatechange;
      }

      this.css = sliderConstants.SLIDER.css;
      this.is = {init: false};
      this.o = {};
      this.initValue = {};
      this.isAsc = settings.from < settings.to;

      this.create(templateNode);

      return this;
    };

    Slider.prototype.create = function( templateNode ){
      // set skin class
      //   if( this.settings.skin && this.settings.skin.length > 0 )
      //     this.setSkin( this.settings.skin );

      var self = this;

      this.domNode = templateNode;

      var divs = this.domNode.find('div'),
          is = this.domNode.find('i'),
          angElt = angular.element,
          angExt = angular.extend,
          angForEach = angular.forEach,
          pointer1 = angElt(divs[1]),
          pointer2 = angElt(divs[2]),
          pointerLabel1 = angElt(divs[5]),
          pointerLabel2 = angElt(divs[6]),
          indicatorLeft = angElt(is[0]),
          indicatorRight = angElt(is[1]),
          range = angElt(is[2]),
          indicator1 = angElt(is[3]),
          indicator2 = angElt(is[4]),
          indicator3 = angElt(is[5]),
          indicator4 = angElt(is[6]),
          labels = [pointerLabel1, pointerLabel2],
				 	pointers = [pointer1, pointer2],
          off = utils.offset(this.domNode),
          offset = {
            left: off.left,
            top: off.top,
            width: this.domNode[0].clientWidth,
            height: this.domNode[0].clientHeight
          },
          values = self.settings.value.split(';');

      this.sizes = {
        domWidth: this.domNode[0].clientWidth,
        domHeight: this.domNode[0].clientHeight,
        domOffset: offset
      };

      // find some objects
      angExt(this.o, {
        pointers: {},
        labels: { 0: { o : pointerLabel1 }, 1: { o : pointerLabel2 } },
        limits: { 0: angular.element(divs[3]), 1: angular.element(divs[4]) },
        indicators: { 0: indicator1, 1: indicator2, 2: indicator3, 3: indicator4 }
      });

      angExt(this.o.labels[0], {
        value: this.o.labels[0].o.find("span")
      });

      angExt(this.o.labels[1], {
        value: this.o.labels[1].o.find("span")
      });

      // single pointer
      this.settings.single = !self.settings.value.split(";")[1];

      if (this.settings.single) {
        range.addClass('ng-hide');
      } else {
        range.removeClass('ng-hide');
      }

      angForEach(pointers, function(pointer, key) {
        self.settings = angular.copy(self.settings);

        var value = values[key],
            prev,
            prevValue,
            test,
            value1,
            offset;

        if(value) {
          self.o.pointers[key] = new SliderPointer(pointer, key, self.settings.vertical, labels[key], self);

          prev = values[key-1];
          prevValue = prev ? parseInt(prev, 10 ) : undefined;

          value = self.settings.round ? parseFloat(value) : parseInt(value, 10);

          if( prev && self.isAsc ? value < prevValue : value > prevValue ) {
            value = prev;
          }

          // limit threshold adjust
/*          test = self.isAsc ? value < self.settings.from : value > self.settings.from,
          value1 = test ? self.settings.from : value;              */

          test = self.isAsc ? value > self.settings.to : value < self.settings.to;
          value1 = test ? self.settings.to : value;

          self.o.pointers[key].set( value1, true );

          // reinit position d
          offset = utils.offset(self.o.pointers[key].ptr);

          self.o.pointers[key].d = {
            left: offset.left,
            top: offset.top
          };
        }
      });

      self.domNode.bind('mousedown', self.clickHandler.apply(self));

      this.o.value = angElt(this.domNode.find("i")[2]);
      this.is.init = true;

      // CSS SKIN
      if (this.settings.css) {
        indicatorLeft.css(this.settings.css.background ? this.settings.css.background : {});
        indicatorRight.css(this.settings.css.background ? this.settings.css.background : {});
        if (!this.o.pointers[1]) {
          indicator1.css(this.settings.css.before ? this.settings.css.before : {});
          indicator4.css(this.settings.css.after ? this.settings.css.after : {});
        }

        indicator2.css(this.settings.css.default ? this.settings.css.default : {});
        indicator3.css(this.settings.css.default ? this.settings.css.default : {});

        range.css(this.settings.css.range ? this.settings.css.range : {});
        pointer1.css(this.settings.css.pointer ? this.settings.css.pointer : {});
        pointer2.css(this.settings.css.pointer ? this.settings.css.pointer : {});
      }      
      
      this.redrawPointers();
    };

    Slider.prototype.clickHandler = function() {
      var self = this;

      // in case of showing/hiding
      var resetPtrSize = function( ptr ) {
        var ptr1 = self.o.pointers[0].ptr,
            ptr2 = self.o.pointers[1].ptr,
            offset1 = utils.offset(ptr1),
            offset2 = utils.offset(ptr2);

        self.o.pointers[0].d = {
          left: offset1.left,
          top: offset1.top,
          width: ptr1[0].clientWidth,
          height: ptr1[0].clientHeight
        };

        self.o.pointers[1].d = {
          left: offset2.left,
          top: offset2.top,
          width: ptr2[0].clientWidth,
          height: ptr2[0].clientHeight
        };
      };

      return function(evt) {
        if (self.disabled)
          return;
        var vertical = self.settings.vertical,
            targetIdx = 0,
            _off = utils.offset(self.domNode),
            firstPtr = self.o.pointers[0],
            secondPtr = self.o.pointers[1] ? self.o.pointers[1] : null,
            tmpPtr,
            evtPosition = evt.originalEvent ? evt.originalEvent: evt,
            mouse = vertical ? evtPosition.pageY : evtPosition.pageX,
            css = vertical ? 'top' : 'left',
            offset = { left: _off.left, top: _off.top, width: self.domNode[0].clientWidth, height: self.domNode[0].clientHeight },
            targetPtr = self.o.pointers[targetIdx];

        if (secondPtr) {
          if (!secondPtr.d.width) {
            resetPtrSize();
          }
          var firstPtrPosition = utils.offset(firstPtr.ptr)[css];
          var secondPtrPosition = utils.offset(secondPtr.ptr)[css];
          var middleGap = Math.abs((secondPtrPosition - firstPtrPosition) / 2);
          var testSecondPtrToMove = mouse >= secondPtrPosition || mouse >= (secondPtrPosition - middleGap);
          if (testSecondPtrToMove) {
            targetPtr = secondPtr;
          }
        }
        targetPtr._parent = {offset: offset, width: offset.width, height: offset.height};
        var coords = firstPtr._getPageCoords( evt );
        targetPtr.cx = coords.x - targetPtr.d.left;
        targetPtr.cy = coords.y - targetPtr.d.top;
        targetPtr.onmousemove( evt, coords.x, coords.y);
        targetPtr.onmouseup();
        angular.extend(targetPtr.d, {
           left: coords.x,
           top: coords.y
        });

        self.redraw(targetPtr);
        return false;
      };
    };


    Slider.prototype.disable = function( bool ) {
      this.disabled = bool;
    };

    Slider.prototype.nice = function( value ){
      return value;
    };

    Slider.prototype.onstatechange = function(){};

    Slider.prototype.limits = function( x, pointer ){
      // smooth
      if(!this.settings.smooth){
        var step = this.settings.step*100 / ( this.settings.interval );
        x = Math.round( x/step ) * step;
      }

      if (pointer) {
        var another = this.o.pointers[1-pointer.uid];
        if(another && pointer.uid && x < another.value.prc) x = another.value.prc;
        if(another && !pointer.uid && x > another.value.prc) x = another.value.prc;
      }
      // base limit
      if(x < 0) x = 0;
      if(x > 100) x = 100;

      return Math.round(x*10) / 10;
    };

    Slider.prototype.getPointers = function(){
      return this.o.pointers;
    };

    Slider.prototype.generateScale = function(){
      if (this.settings.scale && this.settings.scale.length > 0){
        var str = '',
            s = this.settings.scale,
        // FIX Big Scale Failure #34
        // var prc = Math.round((100/(s.length-1))*10)/10;
            prc,
            label,
            duplicate = {},
            position = this.settings.vertical ? 'top' : 'left',
            i=0;
        for(; i < s.length; i++) {
          if (!angular.isDefined(s[i].val)) {
             prc = (100/(s.length-1)).toFixed(2);
             str += '<span style="'+ position + ': ' + i*prc + '%">' + ( s[i] != '|' ? '<ins>' + s[i] + '</ins>' : '' ) + '</span>';
          }

          if (s[i].val <= this.settings.to && s[i].val >= this.settings.from &&  ! duplicate[s[i].val]) {
            duplicate[s[i].val] = true;
            prc = this.valueToPrc(s[i].val);
            label = s[i].label ? s[i].label : s[i].val;
            str += '<span style="'+ position + ': ' + prc + '%">' + '<ins>' + label + '</ins>' + '</span>';
          }
        }
        return str;
      }

      return '';
    };

    Slider.prototype.onresize = function(){
      var self = this;

      this.sizes = {
        domWidth: this.domNode[0].clientWidth,
        domHeight: this.domNode[0].clientHeight,
        domOffset: {
          left: this.domNode[0].offsetLeft,
          top: this.domNode[0].offsetTop,
          width: this.domNode[0].clientWidth,
          height: this.domNode[0].clientHeight
        }
      };

      this.redrawPointers();
    };

    Slider.prototype.update = function(){
      this.onresize();
      this.drawScale();
    };

    Slider.prototype.drawScale = function( scaleDiv ){
      angular.forEach(angular.element(scaleDiv).find('ins'), function(scaleLabel, key) {
        scaleLabel.style.marginLeft = - scaleLabel.clientWidth / 2;
      });
    };

    Slider.prototype.redrawPointers = function() {

      angular.forEach(this.o.pointers, function(pointer){
        this.redraw(pointer);
      }, this);
    };

    Slider.prototype.redraw = function( pointer ){
      if(!this.is.init) {
        // this.settings.single
        if(this.o.pointers[0] && !this.o.pointers[1]) {
          this.originValue = this.o.pointers[0].value.prc;
          this.o.indicators[0].css(!this.settings.vertical ? {left:0, width:this.o.pointers[0].value.prc + "%"} : {top:0, height:this.o.pointers[0].value.prc + "%"});
          this.o.indicators[1].css(!this.settings.vertical ? {left:this.o.pointers[0].value.prc + "%"} : {top:this.o.pointers[0].value.prc + "%"});
          this.o.indicators[3].css(!this.settings.vertical ? {left:this.o.pointers[0].value.prc + "%"} : {top:this.o.pointers[0].value.prc + "%"});
        } else {
          this.o.indicators[2].css(!this.settings.vertical ? {left:this.o.pointers[1].value.prc + "%"} : {top:this.o.pointers[1].value.prc + "%"});
          this.o.indicators[0].css(!this.settings.vertical ? {left:0, width:"0"} : {top:0, height:"0"});
          this.o.indicators[3].css(!this.settings.vertical ? {left:"0", width:"0"} : {top:"0", height:"0"});
        }

        return false;
      }

      this.setValue();

      var newPos,
          newWidth;

      // redraw range line
      if(this.o.pointers[0] && this.o.pointers[1]) {
        newPos = !this.settings.vertical ?
          { left: this.o.pointers[0].value.prc + "%", width: ( this.o.pointers[1].value.prc - this.o.pointers[0].value.prc ) + "%" }
          :
          { top: this.o.pointers[0].value.prc + "%", height: ( this.o.pointers[1].value.prc - this.o.pointers[0].value.prc ) + "%" };

        this.o.value.css(newPos);

        // both pointer overlap on limits
        if (this.o.pointers[0].value.prc === this.o.pointers[1].value.prc) {
          this.o.pointers[1].ptr.css("z-index", this.o.pointers[0].value.prc === 0 ? '3' : '1');
        }

      }

      if(this.o.pointers[0] && !this.o.pointers[1]) {
        newWidth = this.o.pointers[0].value.prc - this.originValue;
        if (newWidth >= 0) {
          this.o.indicators[3].css(!this.settings.vertical ? {width: newWidth + "%"} : {height: newWidth + "%"});
        }
        else {
          this.o.indicators[3].css(!this.settings.vertical ? {width: 0} : {height: 0});
        }

        if (this.o.pointers[0].value.prc < this.originValue) {
         this.o.indicators[0].css(!this.settings.vertical ? {width: this.o.pointers[0].value.prc + "%"} : {height: this.o.pointers[0].value.prc + "%"});
        }
        else {
          this.o.indicators[0].css(!this.settings.vertical ? {width: this.originValue + "%"} : {height: this.originValue + "%"});
        }

      }

      var value = this.nice(pointer.value.origin);
      if (this.settings.modelLabels) {
        if (angular.isFunction(this.settings.modelLabels)) {
          value = this.settings.modelLabels(value);
        }
        else {
          value = this.settings.modelLabels[value] !== undefined ? this.settings.modelLabels[value] : value;
        }
      }

      this.o.labels[pointer.uid].value.html(value);

      // redraw position of labels
      this.redrawLabels( pointer );
    };

    Slider.prototype.redrawLabels = function( pointer ) {

      function setPosition( label, sizes, prc ) {
        sizes.margin = -sizes.label/2;
        var domSize = !self.settings.vertical ? self.sizes.domWidth : self.sizes.domHeight;

        if (self.sizes.domWidth) {
          // left limit
          var label_left = sizes.border + sizes.margin;
          if(label_left < 0)
            sizes.margin -= label_left;

          // right limit
          if(self.sizes.domWidth > 0 && sizes.border+sizes.label / 2 > domSize){
            sizes.margin = 0;
            sizes.right = true;
          } else
          sizes.right = false;
        }

        if (!self.settings.vertical)
          label.o.css({ left: prc + "%", marginLeft: sizes.margin+"px", right: "auto" });
        else
          label.o.css({ top: prc + "%", marginLeft: "20px", marginTop: sizes.margin, bottom: "auto" });
        if(sizes.right && self.sizes.domWidth > 0) {
          if (!self.settings.vertical)
            label.o.css({ left: "auto", right: 0 });
          else
            label.o.css({ top: "auto", bottom: 0 });
        }
        return sizes;
      }

      var self = this,
          label = this.o.labels[pointer.uid],
          prc = pointer.value.prc,
          // case hidden
          labelWidthSize = label.o[0].offsetWidth === 0 ? (label.o[0].textContent.length)*7 : label.o[0].offsetWidth;

      this.sizes.domWidth = this.domNode[0].clientWidth;
      this.sizes.domHeight = this.domNode[0].clientHeight;

      var sizes = {
        label: !self.settings.vertical ? labelWidthSize : label.o[0].offsetHeight,
        right: false,
        border: (prc * (!self.settings.vertical ? this.sizes.domWidth: this.sizes.domHeight)) / 100
      };

      var anotherIdx = pointer.uid === 0 ? 1:0,
          anotherLabel,
          anotherPtr;

      if (!this.settings.single && !this.settings.vertical){
        // glue if near;
        anotherLabel = this.o.labels[anotherIdx];
        anotherPtr = this.o.pointers[anotherIdx];
        var label1 = this.o.labels[0],
            label2 = this.o.labels[1],
            ptr1 = this.o.pointers[0],
            ptr2 = this.o.pointers[1],
            gapBetweenLabel = ptr2.ptr[0].offsetLeft - ptr1.ptr[0].offsetLeft,
            value = this.nice(anotherPtr.value.origin);

        label1.o.css(this.css.visible);
        label2.o.css(this.css.visible);

        value = this.getLabelValue(value);

        if (gapBetweenLabel + 10 < label1.o[0].offsetWidth+label2.o[0].offsetWidth) {
          anotherLabel.o.css(this.css.hidden);

          anotherLabel.value.html(value);
          prc = (anotherPtr.value.prc - prc) / 2 + prc;
          if(anotherPtr.value.prc != pointer.value.prc){
            value = this.nice(this.o.pointers[0].value.origin);
            var value1 = this.nice(this.o.pointers[1].value.origin);
            value = this.getLabelValue(value);
            value1 = this.getLabelValue(value1);

            label.value.html(value + "&nbsp;&ndash;&nbsp;" + value1);
            sizes.label = label.o[0].offsetWidth;
            sizes.border = (prc * domSize) / 100;
          }
        }
        else {
          anotherLabel.value.html(value);
          anotherLabel.o.css(this.css.visible);
        }
      }

      sizes = setPosition(label, sizes, prc);

      var domSize = !self.settings.vertical ? self.sizes.domWidth : self.sizes.domHeight;

      /* draw second label */
      if(anotherLabel){
        // case hidden
        var labelWidthSize2 = label.o[0].offsetWidth === 0 ? (label.o[0].textContent.length/2)*7 : label.o[0].offsetWidth,
            sizes2 = {
          label: !self.settings.vertical ? labelWidthSize2: anotherLabel.o[0].offsetHeight,
          right: false,
          border: (anotherPtr.value.prc * this.sizes.domWidth) / 100
        };
        sizes = setPosition(anotherLabel, sizes2, anotherPtr.value.prc);
      }

      this.redrawLimits();
    };

    Slider.prototype.redrawLimits = function() {
      if (this.settings.limits) {

        var limits = [true, true],
            i = 0;

        for(var key in this.o.pointers){

          if(!this.settings.single || key === 0){

            var pointer = this.o.pointers[key],
                label = this.o.labels[pointer.uid],
                label_left = label.o[0].offsetLeft - this.sizes.domOffset.left,
                limit = this.o.limits[0];

            if(label_left < limit[0].clientWidth) {
              limits[0] = false;
            }

            limit = this.o.limits[1];
            if(label_left + label.o[0].clientWidth > this.sizes.domWidth - limit[0].clientWidth){
              limits[1] = false;
            }

          }
        }

        for(; i < limits.length; i++){
          if(limits[i]){ // TODO animate
            angular.element(this.o.limits[i]).addClass("animate-show");
          }
          else{
            angular.element(this.o.limits[i]).addClass("animate-hidde");
          }
        }
      }
    };

    Slider.prototype.setValue = function(){
      var value = this.getValue();
      this.inputNode.attr("value", value);
      this.onstatechange.call(this, value, this.inputNode);
    };

    Slider.prototype.getValue = function(){
      if(!this.is.init) return false;
      var $this = this;

      var value = "";
      angular.forEach(this.o.pointers, function(pointer, key){
        if(pointer.value.prc !== undefined && !isNaN(pointer.value.prc))
          value += (key > 0 ? ";" : "") + $this.prcToValue(pointer.value.prc);
      });
      return value;
    };

    Slider.prototype.getLabelValue = function(value){
      if (this.settings.modelLabels) {
        if (angular.isFunction(this.settings.modelLabels)) {
          return this.settings.modelLabels(value);
        }
        else {
          return this.settings.modelLabels[value] !== undefined ? this.settings.modelLabels[value] : value;
        }
      }

      return value;
    };

    Slider.prototype.getPrcValue = function(){
      if(!this.is.init) return false;
      var $this = this;

      var value = "";
      // TODO remove jquery and see if % value is nice feature
      /*$.each(this.o.pointers, function(i){
        if(this.value.prc !== undefined && !isNaN(this.value.prc)) value += (i > 0 ? ";" : "") + this.value.prc;
      });*/
      return value;
    };

    Slider.prototype.prcToValue = function( prc ){
      var value;
      if (this.settings.heterogeneity && this.settings.heterogeneity.length > 0){
        var h = this.settings.heterogeneity,
            _start = 0,
            _from = this.settings.round ? parseFloat(this.settings.from) : parseInt(this.settings.from, 10),
            _to = this.settings.round ? parseFloat(this.settings.to) : parseInt(this.settings.to, 10),
            i = 0;

        for (; i <= h.length; i++){
          var v;
          if(h[i])
            v = h[i].split('/');
          else
            v = [100, _to];

          var v1 = this.settings.round ? parseFloat(v[0]) : parseInt(v[0], 10);
          var v2 = this.settings.round ? parseFloat(v[1]) : parseInt(v[1], 10);

          if (prc >= _start && prc <= v1) {
            value = _from + ((prc-_start) * (v2-_from)) / (v1-_start);
          }

          _start = v1;
          _from = v2;
        }
      }
      else {
        value = this.settings.from + (prc * this.settings.interval) / 100;
      }

      return this.round(value);
    };

    Slider.prototype.valueToPrc = function( value, pointer ){
      var prc,
          _from = this.settings.round ? parseFloat(this.settings.from) : parseInt(this.settings.from, 10);

      if (this.settings.heterogeneity && this.settings.heterogeneity.length > 0){
        var h = this.settings.heterogeneity,
            _start = 0,
            i = 0;

        for (; i <= h.length; i++) {
          var v;
          if(h[i])
            v = h[i].split('/');
          else
            v = [100, this.settings.to];

          var v1 = this.settings.round ? parseFloat(v[0]) : parseInt(v[0], 10);
          var v2 = this.settings.round ? parseFloat(v[1]) : parseInt(v[1], 10);

          if(value >= _from && value <= v2){
            if (pointer) {
              prc = pointer.limits(_start + (value-_from)*(v1-_start)/(v2-_from));
            } else {
              prc = this.limits(_start + (value-_from)*(v1-_start)/(v2-_from));
            }
          }

          _start = v1; _from = v2;
        }

      } else {
        if (pointer) {
          prc = pointer.limits((value-_from)*100/this.settings.interval);
        } else {
          prc = this.limits((value-_from)*100/this.settings.interval);
        }
      }

      return prc;
    };

    Slider.prototype.round = function( value ){
      value = Math.round(value / this.settings.step) * this.settings.step;

      if(this.settings.round)
        value = Math.round(value * Math.pow(10, this.settings.round)) / Math.pow(10, this.settings.round);
      else
        value = Math.round(value);
      return value;
    };

    return Slider;

  }]);
}(angular));
;(function(angular, undefined) {
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
