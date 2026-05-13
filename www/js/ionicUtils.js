/* global cordova,StatusBar,angular,console */

//http://learn.ionicframework.com/formulas/localstorage/

angular.module('ionic.utils', [])

  .factory('$localstorage', ['$window', function ($window) {
    var sensitiveKeyPattern = /(pass(word)?|secret|token|auth|api[_-]?key|session|cookie|credential|jwt)/i;
    function canStoreKey(key) {
      return key && !sensitiveKeyPattern.test(key);
    }

    return {

      init: function () {},

      set: function (key, value) {
        if (!canStoreKey(key)) {
          return;
        }
        $window.localStorage[key] = value;
      },
      get: function (key, defaultValue) {
        return $window.localStorage[key] || defaultValue;
      },
      setObject: function (key, value) {
        if (!canStoreKey(key)) {
          return;
        }
        $window.localStorage[key] = JSON.stringify(value);
      },
      getObject: function (key) {

        return JSON.parse($window.localStorage[key] || '{}');
      }
    };
  }]);
