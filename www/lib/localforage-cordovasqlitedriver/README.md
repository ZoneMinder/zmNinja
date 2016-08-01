# localForage-cordovaSQLiteDriver
[![npm](https://img.shields.io/npm/dm/localforage-cordovasqlitedriver.svg)](https://www.npmjs.com/package/localforage-cordovasqlitedriver)  
SQLite driver for [Cordova](https://cordova.apache.org/) apps using [localForage](https://github.com/mozilla/localForage).

## Requirements

* [Cordova](https://cordova.apache.org/)/[ionic](http://ionicframework.com/)
* [Cordova SQLite storage plugin](https://github.com/litehelpers/Cordova-sqlite-storage/) or [Cordova SQLite Plugin 2](https://github.com/nolanlawson/cordova-plugin-sqlite-2)
* [localForage](https://github.com/mozilla/localForage) v1.4.0+
  * for earlier versions of localforage, please use the v1.2.x releases

## Install Dependencies

* install Cordova-sqlite-storage plugin `cordova plugin add https://github.com/litehelpers/Cordova-sqlite-storage.git`
* install localForage-cordovaSQLiteDriver `bower install --save localForage-cordovaSQLiteDriver`

## CHANGELOG

### v1.3
Reduce driver size (almost by 50%) by "inheriting" the method implementations of the `localforage.WEBSQL` driver.

### v1.2 *BREAKING CHANGE*
Add support for newer versions of [Cordova SQLite storage plugin](https://github.com/litehelpers/Cordova-sqlite-storage/) (v0.8.x  & v1.2.x).

*UPGRADE WARNING*: The default storage location for SQLite has changed in newer versions of [Cordova SQLite storage plugin](https://github.com/litehelpers/Cordova-sqlite-storage/). The new "`default`" location value is NOT the same as the old "`default`" location and will break an upgrade for an app that was using the old default value (0) on iOS. If you are upgrading to a newer version of `localForage-cordovaSQLiteDriver` you need to verify where your previous storage location was and update the `location` property of the localForage database. Otherwise the default is `'default'`. This is to avoid breaking the iCloud Design Guide. See [here](https://github.com/litehelpers/Cordova-sqlite-storage#important-icloud-backup-of-sqlite-database-is-not-allowed) for further details.

### v1.1
Try using the `getSerializer()` (available in localforage v1.3) as the prefered way to retrieve the serializer.

## Setup Your Project

* Include localforage and localForage-cordovaSQLiteDriver in your main html page, after the cordova include.
* Call `defineDriver` and `setDriver` to make localForage use the cordovaSQLiteDriver.

```html
<script src="cordova.js"></script>

<script src="lib/localforage/dist/localforage.js"></script>
<script src="lib/localForage-cordovaSQLiteDriver/src/localforage-cordovasqlitedriver.js"></script>
<script>
localforage.defineDriver(window.cordovaSQLiteDriver).then(function() {
    return localforage.setDriver([
    	// Try setting cordovaSQLiteDriver if available,
      window.cordovaSQLiteDriver._driver,
      // otherwise use one of the default localforage drivers as a fallback.
      // This should allow you to transparently do your tests in a browser
      localforage.INDEXEDDB,
      localforage.WEBSQL,
      localforage.LOCALSTORAGE
    ]);
}).then(function() {
  // this should alert "cordovaSQLiteDriver" when in an emulator or a device
  alert(localforage.driver());
  // set a value;
  return localforage.setItem('testPromiseKey', 'testPromiseValue');
}).then(function() {
  return localforage.getItem('testPromiseKey');
}).then(function(value) {
  alert(value);
}).catch(function(err) {
  alert(err);
});
</script>
```
[Exaple Ionic project](https://github.com/thgreasi/localForage-cordovaSQLiteDriver-TestIonicApp)
