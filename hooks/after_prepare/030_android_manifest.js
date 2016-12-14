#!/usr/bin/env node

var fs    = require('fs');
var async = require('async');
var exec  = require('child_process').exec;
var path  = require('path');

var root = process.argv[2];
var androidManifest = path.join(root, 'platforms/android/AndroidManifest.xml');
fs.exists(path.join(root, 'platforms/android'), function(exists) {
    if(!exists) return;
    fs.readFile(androidManifest, 'utf8', function(err, data) {
        if(err) throw err;

        var lines = data.split('\n');
        var searchingFor = '<application android:hardwareAccelerated="true"';
        var newManifest = [];
        var largeHeap = 'android:largeHeap="true"';
        lines.forEach(function(line) {
            if(line.trim().indexOf(searchingFor) != -1 && line.trim().indexOf(largeHeap) == -1) {
                newManifest.push(line.replace(/\>$/, ' ') + largeHeap + ">");
            } else {
                newManifest.push(line);
            }
        });

        fs.writeFileSync(androidManifest, newManifest.join('\n'));
    });
});