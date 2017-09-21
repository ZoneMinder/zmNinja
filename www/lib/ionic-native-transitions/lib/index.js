import Provider from './provider.js';
import nativeSref from './nativeSref.js';
import Run from './run.js';

let mod = angular.module('ionic-native-transitions', [
    'ionic',
    'ui.router'
]);

mod.directive('nativeUiSref', nativeSref);
mod.provider('$ionicNativeTransitions', Provider);
mod.run(Run);

export default mod = mod.name;
