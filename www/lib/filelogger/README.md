Cordova File Logger
==========

[![Bower](http://img.shields.io/badge/bower-filelogger-FFCC2F.svg?style=flat)](http://bower.io/search/?q=filelogger)

Logger module for Cordova/Ionic projects.

When you run your application in device the Logger writes in the local filesystem (with cordova-plugin-file) and the system logs (with console.log).

When you run your application in browser with „ionic serve” the Logger uses browsers localStorage and the browser console (with console.log).

## Dependencies

- [ngCordova](http://ngcordova.com/) ( required version v0.1.14-alpha )
- [cordova-plugin-file](https://github.com/apache/cordova-plugin-file)

## Installation

Add cordova plugin:

```bash
$ cordova plugin add cordova-plugin-file
```

Install manually, or from bower:

```bash
$ bower install filelogger
```

Include *filelogger.min.js* and ng-cordova.js or *ng-cordova.min.js* in your index.html file before cordova.js and after your AngularJS / Ionic file (since ngCordova depends on AngularJS).

```html
<script src="lib/ngCordova/dist/ng-cordova.min.js"></script>
<script src="lib/filelogger/dist/filelogger.min.js"></script>
<script src="cordova.js"></script>
```

Comment: you don't have to use the complete ngCordova package. I suggest to create a [Custom Build](http://ngcordova.com/build/) with file module.


## Usage

### $fileLogger.log(level, ...message)

General logger method. The first parameter is the log level (debug, info, warn, error). The following parameters are the message parts.
You can put here any javascript type (string, number, boolean, object, array).

In the logfile every item starts with the current UTC timestamp, followed by the log level and the message.

### $fileLogger.debug(...message)

Wrapper for $fileLogger.log('debug', ...)

### $fileLogger.info(...message)

Wrapper for $fileLogger.log('info', ...)

### $fileLogger.warn(...message)

Wrapper for $fileLogger.log('warn', ...)

### $fileLogger.error(...message)

Wrapper for $fileLogger.log('error', ...)

### $fileLogger.setStorageFilename(filename)

You can set the local filename (default messages.log). It requests one parameter, the filename (type string).

### $fileLogger.setTimestampFormat(format, timezone)

You can customize the timestamp format using [Angular <code>date</code> filter](https://docs.angularjs.org/api/ng/filter/date). See formatting parameters on the linked Angular docs page. Example:

```js
$fileLogger.setTimestampFormat('medium');
```

### $fileLogger.getLogfile()

You can read the whole logfile from the filestore. This method returns a promise.

### $fileLogger.deleteLogfile()

You can delete the logfile from the filestore. This method returns a promise.

### $fileLogger.checkFile()

Get storage file data. This method returns an object.

```js
// response on iOS
{
  "name": "myLog.txt",
  "localURL": "cdvfile://localhost/library-nosync/myLog.txt",
  "type": null,
  "lastModified": 1435668606000,
  "lastModifiedDate": 1435668606000,
  "size": 450,
  "start": 0,
  "end": 450
}

// response on Android
{
  "name": "myLog.txt",
  "localURL": "cdvfile://localhost/files/myLog.txt",
  "type": "text/plain",
  "lastModified": 1435669292000,
  "lastModifiedDate": 1435669292000,
  "size": 450,
  "start": 0,
  "end": 450
}

// response in Browser
{
  "name": "myLog.txt",
  "localURL": "localStorage://localhost/myLog.txt",
  "type": "text/plain",
  "size": 450
}
```

### Example use

```js
angular.module('starter', ['ionic', 'fileLogger'])
  .controller('mainCtrl', ['$scope', '$fileLogger', '$timeout', function($scope, $fileLogger, $timeout) {

  function testing() {

    $fileLogger.setStorageFilename('myLog.txt');

    $fileLogger.log('debug', 'message');
    $fileLogger.log('info', 'message');
    $fileLogger.log('warn', 'message');
    $fileLogger.log('error', 'message');

    $fileLogger.debug('message');
    $fileLogger.info('message');
    $fileLogger.warn('message');
    $fileLogger.error('message');

    $fileLogger.log('error', 'error message', { code: 1, meaning: 'general' });

    $fileLogger.log('info', 'message', 123, [1, 2, 3], { a: 1, b: '2' });

    $timeout(function(){
      $fileLogger.getLogfile().then(function(l) {
        console.log('Logfile content');
        console.log(l);
      });
    }, 1000);

    $timeout(function(){
      $fileLogger.checkFile().then(function(d) {
        console.log('Logfile data');
        console.log(JSON.stringify(d));
      });
    }, 2000);

    $timeout(function(){
      $fileLogger.deleteLogfile().then(function() {
        console.log('Logfile deleted');
      });
    }, 3000);

  }

}]);
```


## Author

#### Peter Bakondy

- https://github.com/pbakondy


## LICENSE

Cordova File Logger is licensed under the MIT Open Source license. For more information, see the LICENSE file in this repository.
