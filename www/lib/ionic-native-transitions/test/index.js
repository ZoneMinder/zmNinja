import 'ionic-sdk/release/js/ionic.bundle';
import 'ionic-sdk/release/css/ionic.css';
import '../dist/ionic-native-transitions.js';
import './angular-ios9-uiwebview.patch.js';
import Config from './config.js';
import Controller from './controller.js';

let mod = angular.module('test', [
    'ionic',
    'ui.router',
    'ionic-native-transitions',
    'ngIOS9UIWebViewPatch'
]);

mod.config(Config);
mod.controller('MainController', Controller);
mod.run(($log) => {
    $log.info('test running');
});

export default mod = mod.name;
