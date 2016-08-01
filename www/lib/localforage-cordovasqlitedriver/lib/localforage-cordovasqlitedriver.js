/*
 * Includes code from:
 *
 * localForage - websql driver
 * https://github.com/mozilla/localforage
 *
 * Copyright (c) 2015 Mozilla
 * Licensed under Apache 2.0 license.
 *
 */
// import localforage from 'localforage';
import { getSerializerPromise, getWebSqlDriverPromise } from './utils';
import { openDatabasePromise } from './cordova-sqlite';

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
            dbInfo[i] = typeof(options[i]) !== 'string' ?
                        options[i].toString() : options[i];
        }
    }

    var dbInfoPromise = openDatabasePromise.then(function(openDatabase){
        return new Promise(function(resolve, reject) {
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
            dbInfo.db.transaction(function(t) {
                t.executeSql('CREATE TABLE IF NOT EXISTS ' + dbInfo.storeName +
                             ' (id INTEGER PRIMARY KEY, key unique, value)', [],
                             function() {
                    self._dbInfo = dbInfo;
                    resolve();
                }, function(t, error) {
                    reject(error);
                });
            });
        });
    });

    var serializerPromise = getSerializerPromise(self);
    var webSqlDriverPromise = getWebSqlDriverPromise(self);

    return Promise.all([
        serializerPromise,
        webSqlDriverPromise,
        dbInfoPromise
    ]).then(function(results) {
        dbInfo.serializer = results[0];
        return dbInfoPromise;
    });
}

var cordovaSQLiteDriver = {
    _driver: 'cordovaSQLiteDriver',
    _initStorage: _initStorage,
    _support: function() {
        return openDatabasePromise.then(function(openDatabase) {
            return !!openDatabase;
        }).catch(function(){
            return false;
        });
    }
};

function wireUpDriverMethods(driver) {
    var LibraryMethods = [
        'clear',
        'getItem',
        'iterate',
        'key',
        'keys',
        'length',
        'removeItem',
        'setItem'
    ];

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

export default cordovaSQLiteDriver;
