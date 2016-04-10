(function(angular){
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
