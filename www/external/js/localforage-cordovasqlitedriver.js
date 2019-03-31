(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.cordovaSQLiteDriver = factory());
}(this, function () { 'use strict';

    function getSerializerPromise(localForageInstance) {
        if (getSerializerPromise.result) {
            return getSerializerPromise.result;
        }
        if (!localForageInstance || typeof localForageInstance.getSerializer !== 'function') {
            return Promise.reject(new Error('localforage.getSerializer() was not available! ' + 'localforage v1.4+ is required!'));
        }
        getSerializerPromise.result = localForageInstance.getSerializer();
        return getSerializerPromise.result;
    }

    function getDriverPromise(localForageInstance, driverName) {
        getDriverPromise.result = getDriverPromise.result || {};
        if (getDriverPromise.result[driverName]) {
            return getDriverPromise.result[driverName];
        }
        if (!localForageInstance || typeof localForageInstance.getDriver !== 'function') {
            return Promise.reject(new Error('localforage.getDriver() was not available! ' + 'localforage v1.4+ is required!'));
        }
        getDriverPromise.result[driverName] = localForageInstance.getDriver(driverName);
        return getDriverPromise.result[driverName];
    }

    function getWebSqlDriverPromise(localForageInstance) {
        return getDriverPromise(localForageInstance, localForageInstance.WEBSQL);
    }

    /* global document, sqlitePlugin */
    // we can't import this, since it gets defined later
    // import sqlitePlugin from 'sqlitePlugin';

    var deviceReady = new Promise(function (resolve, reject) {
        if (typeof sqlitePlugin !== 'undefined') {
            resolve();
        } else if (typeof cordova === 'undefined') {
            reject(new Error('cordova is not defined.'));
        } else {
            // Wait for Cordova to load
            document.addEventListener("deviceready", function () {
                return resolve();
            }, false);
        }
    });

    var deviceReadyDone = deviceReady.catch(function () {
        return Promise.resolve();
    });

    function getOpenDatabasePromise() {
        return deviceReadyDone.then(function () {
            if (typeof sqlitePlugin !== 'undefined' && typeof sqlitePlugin.openDatabase === 'function') {
                return sqlitePlugin.openDatabase;
            } else {
                throw new Error('SQLite plugin is not present.');
            }
        });
    }

    // // If cordova is not present, we can stop now.
    // if (!globalObject.cordova) {
    //     return;
    // }

    // Open the cordova sqlite plugin database (automatically creates one if one didn't
    // previously exist), using any options set in the config.
    function _initStorage(options) {
        var self = this;
        var dbInfo = {
            db: null
        };

        if (options) {
            for (var i in options) {
                dbInfo[i] = typeof options[i] !== 'string' ? options[i].toString() : options[i];
            }
        }

        var dbInfoPromise = getOpenDatabasePromise().then(function (openDatabase) {
            return new Promise(function (resolve, reject) {
                // Open the database; the openDatabase API will automatically
                // create it for us if it doesn't exist.
                try {
                    dbInfo.location = dbInfo.location || 'default';
                    dbInfo.db = openDatabase({
                        name: dbInfo.name,
                        version: String(dbInfo.version),
                        description: dbInfo.description,
                        size: dbInfo.size,
                        location: dbInfo.location
                    });
                } catch (e) {
                    reject(e);
                }

                // Create our key/value table if it doesn't exist.
                dbInfo.db.transaction(function (t) {
                    t.executeSql('CREATE TABLE IF NOT EXISTS ' + dbInfo.storeName + ' (id INTEGER PRIMARY KEY, key unique, value)', [], function () {
                        self._dbInfo = dbInfo;
                        resolve();
                    }, function (t, error) {
                        reject(error);
                    });
                });
            });
        });

        var serializerPromise = getSerializerPromise(self);
        var webSqlDriverPromise = getWebSqlDriverPromise(self);

        return Promise.all([serializerPromise, webSqlDriverPromise, dbInfoPromise]).then(function (results) {
            dbInfo.serializer = results[0];
            return dbInfoPromise;
        });
    }

    var cordovaSQLiteDriver = {
        _driver: 'cordovaSQLiteDriver',
        _initStorage: _initStorage,
        _support: function _support() {
            return getOpenDatabasePromise().then(function (openDatabase) {
                return !!openDatabase;
            }).catch(function () {
                return false;
            });
        }
    };

    function wireUpDriverMethods(driver) {
        var LibraryMethods = ['clear', 'getItem', 'iterate', 'key', 'keys', 'length', 'removeItem', 'setItem'];

        function wireUpDriverMethod(driver, methodName) {
            driver[methodName] = function () {
                var localForageInstance = this;
                var args = arguments;
                return getWebSqlDriverPromise(localForageInstance).then(function (webSqlDriver) {
                    return webSqlDriver[methodName].apply(localForageInstance, args);
                });
            };
        }

        for (var i = 0, len = LibraryMethods.length; i < len; i++) {
            wireUpDriverMethod(driver, LibraryMethods[i]);
        }
    }

    wireUpDriverMethods(cordovaSQLiteDriver);

    return cordovaSQLiteDriver;

}));