/* global document, sqlitePlugin */
// we can't import this, since it gets defined later
// import sqlitePlugin from 'sqlitePlugin';

var deviceReady = new Promise(function(resolve, reject) {
    if (typeof sqlitePlugin !== 'undefined') {
        resolve();
    } else if (typeof cordova === 'undefined') {
        reject();
    } else {
        // Wait for Cordova to load
        document.addEventListener("deviceready", resolve, false);
    }
});

export var openDatabasePromise = deviceReady.catch(Promise.resolve).then(function() {
    return new Promise(function(resolve, reject) {
        if (typeof sqlitePlugin !== 'undefined' &&
            typeof sqlitePlugin.openDatabase === 'function') {
            resolve(sqlitePlugin.openDatabase);
        } else {
            reject('SQLite plugin is not present.');
        }
    });
});
