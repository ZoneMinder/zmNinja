/*!
 * fileLogger
 * Copyright 2015 Peter Bakondy https://github.com/pbakondy
 * See LICENSE in this repository for license information
 */
(function(){
/* global angular, console, cordova */

// install    : cordova plugin add cordova-plugin-file
// date format: https://docs.angularjs.org/api/ng/filter/date

angular.module('fileLogger', ['ngCordova.plugins.file'])

  .factory('$fileLogger', ['$q', '$window', '$cordovaFile', '$timeout', '$filter',
    function ($q, $window, $cordovaFile, $timeout, $filter) {

    'use strict';


    var queue = [];
    var ongoing = false;
    var levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

    var storageFilename = 'messages.log';

    var dateFormat;
    var dateTimezone;


    function isBrowser() {
      return (!$window.cordova && !$window.PhoneGap && !$window.phonegap);
    }


    function log(level) {
      if (angular.isString(level)) {
        level = level.toUpperCase();

        if (levels.indexOf(level) === -1) {
          level = 'INFO';
        }
      } else {
        level = 'INFO';
      }

      var now = new Date();
      var timestamp = dateFormat ?
        $filter('date')(now, dateFormat, dateTimezone) : now.toJSON();

      var messages = Array.prototype.slice.call(arguments, 1);
      var message = [ timestamp, level ];
      var text;

      for (var i = 0; i < messages.length; i++ ) {
        if (angular.isArray(messages[i])) {
          text = '[Array]';
          try {
            // avoid "TypeError: Converting circular structure to JSON"
            text = JSON.stringify(messages[i]);
          } catch(e) {}
          message.push(text);
        }
        else if (angular.isObject(messages[i])) {
          text = '[Object]';
          try {
            // avoid "TypeError: Converting circular structure to JSON"
            text = JSON.stringify(messages[i]);
          } catch(e) {}
          message.push(text);
        }
        else {
          message.push(messages[i]);
        }
      }

      if (isBrowser()) {
        // log to browser console

        messages.unshift(timestamp);

        if (angular.isObject(console) && angular.isFunction(console.log)) {
          switch (level) {
            case 'DEBUG':
              if (angular.isFunction(console.debug)) {
                console.debug.apply(console, messages);
              } else {
                console.log.apply(console, messages);
              }
              break;
            case 'INFO':
              if (angular.isFunction(console.debug)) {
                console.info.apply(console, messages);
              } else {
                console.log.apply(console, messages);
              }
              break;
            case 'WARN':
              if (angular.isFunction(console.debug)) {
                console.warn.apply(console, messages);
              } else {
                console.log.apply(console, messages);
              }
              break;
            case 'ERROR':
              if (angular.isFunction(console.debug)) {
                console.error.apply(console, messages);
              } else {
                console.log.apply(console, messages);
              }
              break;
            default:
              console.log.apply(console, messages);
          }
        }

      } else {
        // log to logcat
        console.log(message.join(' '));
      }

      queue.push({ message: message.join(' ') + '\n' });

      if (!ongoing) {
        process();
      }
    }


    function process() {

      if (!queue.length) {
        ongoing = false;
        return;
      }

      ongoing = true;
      var m = queue.shift();

      writeLog(m.message).then(
        function() {
          $timeout(function() {
            process();
          });
        },
        function() {
          $timeout(function() {
            process();
          });
        }
      );

    }


    function writeLog(message) {
      var q = $q.defer();

      if (isBrowser()) {
        // running in browser with 'ionic serve'

        if (!$window.localStorage[storageFilename]) {
          $window.localStorage[storageFilename] = '';
        }

        $window.localStorage[storageFilename] += message;
        q.resolve();

      } else {

        $cordovaFile.checkFile(cordova.file.dataDirectory, storageFilename).then(
          function() {
            // writeExistingFile(path, fileName, text)
            $cordovaFile.writeExistingFile(cordova.file.dataDirectory, storageFilename, message).then(
              function() {
                q.resolve();
              },
              function(error) {
                q.reject(error);
              }
            );
          },
          function() {
            // writeFile(path, fileName, text, replaceBool)
            $cordovaFile.writeFile(cordova.file.dataDirectory, storageFilename, message, true).then(
              function() {
                q.resolve();
              },
              function(error) {
                q.reject(error);
              }
            );
          }
        );

      }

      return q.promise;
    }


    function getLogfile() {
      var q = $q.defer();

      if (isBrowser()) {
        q.resolve($window.localStorage[storageFilename]);
      } else {
        $cordovaFile.readAsText(cordova.file.dataDirectory, storageFilename).then(
          function(result) {
            q.resolve(result);
          },
          function(error) {
            q.reject(error);
          }
        );
      }

      return q.promise;
    }


    function deleteLogfile() {
      var q = $q.defer();

      if (isBrowser()) {
        $window.localStorage.removeItem(storageFilename);
        q.resolve();
      } else {
        $cordovaFile.removeFile(cordova.file.dataDirectory, storageFilename).then(
          function(result) {
            q.resolve(result);
          },
          function(error) {
            q.reject(error);
          }
        );
      }

      return q.promise;
    }


    function setStorageFilename(filename) {
      if (angular.isString(filename) && filename.length > 0) {
        storageFilename = filename;
        return true;
      } else {
        return false;
      }
    }


    function setTimestampFormat(format, timezone) {
      if (!(angular.isUndefined(format) || angular.isString(format))) {
        throw new TypeError('format parameter must be a string or undefined');
      }
      if (!(angular.isUndefined(timezone) || angular.isString(timezone))) {
        throw new TypeError('timezone parameter must be a string or undefined');
      }

      dateFormat = format;
      dateTimezone = timezone;
    }


    function checkFile() {
      var q = $q.defer();

      if (isBrowser()) {

        q.resolve({
          'name': storageFilename,
          'localURL': 'localStorage://localhost/' + storageFilename,
          'type': 'text/plain',
          'size': ($window.localStorage[storageFilename] ? $window.localStorage[storageFilename].length : 0)
        });

      } else {

        $cordovaFile.checkFile(cordova.file.dataDirectory, storageFilename).then(function(fileEntry) {
          fileEntry.file(q.resolve, q.reject);
        }, q.reject);

      }

      return q.promise;
    }

    function debug() {
      var args = Array.prototype.slice.call(arguments, 0);
      args.unshift('DEBUG');
      log.apply(undefined, args);
    }


    function info() {
      var args = Array.prototype.slice.call(arguments, 0);
      args.unshift('INFO');
      log.apply(undefined, args);
    }


    function warn() {
      var args = Array.prototype.slice.call(arguments, 0);
      args.unshift('WARN');
      log.apply(undefined, args);
    }


    function error() {
      var args = Array.prototype.slice.call(arguments, 0);
      args.unshift('ERROR');
      log.apply(undefined, args);
    }


    return {
      log: log,
      getLogfile: getLogfile,
      deleteLogfile: deleteLogfile,
      setStorageFilename: setStorageFilename,
      setTimestampFormat: setTimestampFormat,
      checkFile: checkFile,
      debug: debug,
      info: info,
      warn: warn,
      error: error
    };

  }]);

})();