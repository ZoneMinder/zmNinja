Native transitions for Ionic. Turn it on and enjoy native transitions.

![gif](http://examples.julienrenaux.fr/native-transitions/native-transitions.gif)

# Installation
## npm
[https://www.npmjs.com/package/ionic-native-transitions](https://www.npmjs.com/package/ionic-native-transitions)

```
npm install ionic-native-transitions --save
```

Then require the library

```
# ES5
require('ionic-native-transitions');

# or ES6
import 'ionic-native-transitions';
```

## Bower

```
bower install shprink/ionic-native-transitions
```

## Cordova/Ionic
The recommended version for the Transition plugin is 0.5.5 or higher.

```
# Using Cordova
cordova plugin add https://github.com/Telerik-Verified-Plugins/NativePageTransitions#0.5.5

# Using Ionic CLI
ionic plugin add https://github.com/Telerik-Verified-Plugins/NativePageTransitions#0.5.5
```

### iOS
Transitions on iOS9 can flicker sometimes. To prevent this from hapenning you can install this plugin:

```
# Using Cordova
cordova plugin add cordova-plugin-wkwebview

# Using Ionic CLI
ionic plugin add cordova-plugin-wkwebview
```

### Android
if you are using Crosswalk > 1.3 please add the following to your `config.xml`

```
<preference name="CrosswalkAnimatable" value="true" />
```

# Configuration

```
angular.module('yourApp', [
    'ionic-native-transitions'
]);
```

## Set default options (optional)
**_Beware_**: Only use `setDefaultOptions` if you know what you are doing.

```
.config(function($ionicNativeTransitionsProvider){
    $ionicNativeTransitionsProvider.setDefaultOptions({
        duration: 400, // in milliseconds (ms), default 400,
        slowdownfactor: 4, // overlap views (higher number is more) or no overlap (1), default 4
        iosdelay: -1, // ms to wait for the iOS webview to update before animation kicks in, default -1
        androiddelay: -1, // same as above but for Android, default -1
        winphonedelay: -1, // same as above but for Windows Phone, default -1,
        fixedPixelsTop: 0, // the number of pixels of your fixed header, default 0 (iOS and Android)
        fixedPixelsBottom: 0 // the number of pixels of your fixed footer (f.i. a tab bar), default 0 (iOS and Android)
        triggerTransitionEvent: '$ionicView.afterEnter', // internal ionic-native-transitions option
        backInOppositeDirection: false // Takes over default back transition and state back transition to use the opposite direction transition to go back
    });
});
```

## Set default transition (optional)
[See the list of possible transitions](#transitions)

```
.config(function($ionicNativeTransitionsProvider){
    $ionicNativeTransitionsProvider.setDefaultTransition({
        type: 'slide',
        direction: 'left'
    });
});
```

## Set default back transition (optional)
[See the list of possible transitions](#transitions)

```
.config(function($ionicNativeTransitionsProvider){
    $ionicNativeTransitionsProvider.setDefaultBackTransition({
        type: 'slide',
        direction: 'right'
    });
});
```

## Enable/Disable (optional)
You can programatically disable the plugin for any reason:

```
# Within the config phase
# * @param {boolean} enabled
$ionicNativeTransitionsProvider.enable(false);

# Anywhere else (controller, service etc.)
# * @param {boolean} enabled                    default true
# * @param {boolean} disableIonicTransitions    default true
# * @param {string}  ionicTransitionType        default 'platform'

# Disable plugin and enable ionic transitions (same as: enable(false, false))
$ionicNativeTransitions.enable(false);

# Enable plugin and disable ionic transitions (same as: enable(true, true))
$ionicNativeTransitions.enable(true);

# Disable plugin and disable ionic transitions
$ionicNativeTransitions.enable(false, true);

# Enable plugin and enable ionic transitions
# in some cases it is useful <https://github.com/shprink/ionic-native-transitions/issues/23>
$ionicNativeTransitions.enable(true, false);
```

# Usage
By default any state transition will use the default transition (Defined in the configuration phase) but you can specify a different transition per state if you want using the UI router state definition:

```
.state('home', {
    url: '/home',
    nativeTransitions: {
        "type": "flip",
        "direction": "up"
    }
    templateUrl: "templates/home.html"
})
```

You can also define a different transition (backward and forward) per device like this:

```
.state('home', {
    url: '/home',
    nativeTransitionsAndroid: {
        "type": "flip",
        "direction": "right"
    },
    nativeTransitionsIOS: {
        "type": "flip",
        "direction": "left"
    },
    nativeTransitionsWindowsPhone: {
        "type": "flip",
        "direction": "down"
    },
    nativeTransitionsBackAndroid: {
        "type": "flip",
        "direction": "left"
    },
    nativeTransitionsBackIOS: {
        "type": "flip",
        "direction": "right"
    },
    nativeTransitionsBackWindowsPhone: {
        "type": "flip",
        "direction": "up"
    },
    templateUrl: "templates/home.html"
})
```

Overwrite just one device (here only android will be different)

```
.state('home', {
    url: '/home',
    nativeTransitions: {
        "type": "flip",
        "direction": "up"
    },
    nativeTransitionsAndroid: {
        "type": "flip",
        "direction": "right"
    }
    templateUrl: "templates/home.html"
})
```

Disable native transition for one state (for instance on tabs)

```
.state('home', {
    url: '/home',
    nativeTransitions: null,
    templateUrl: "templates/home.html"
})
```

## Programatically change page with native transitions

### State

```
# * @description
# * Call state go and apply a native transition
# * @param {string|null} state                default:null
# * @param {object}      stateParams          default:{}
# * @param {object|null} transitionOptions    default:null
# * @param {object}      stateOptions         default:{}

$ionicNativeTransitions.stateGo('yourState', {}, {
    "type": "slide",
    "direction": "up", // 'left|right|up|down', default 'left' (which is like 'next')
    "duration": 1500, // in milliseconds (ms), default 400
});
```

### Location.url

```
# * @description
# * Call location url and apply a native transition
# * @param {string|null} url                 default:null
# * @param {object|null} transitionOptions   default:null

$ionicNativeTransitions.locationUrl('/yourUrl', {
    "type": "slide",
    "direction": "down", // 'left|right|up|down', default 'left' (which is like 'next')
    "duration": 1500, // in milliseconds (ms), default 400
});
```

## Using directives

```
<button native-ui-sref="tabs.home({param1: 'param1', param2: 'param2'})" native-ui-sref-opts="{reload: true}" native-options="{type: 'slide', direction:'down'}"></button>
```

## History back button

Using the `<ion-nav-back-button>` directive automatically uses the default back transition if you have not added a specific `ng-click` on it.

## Hadware back button (Android)

The hardware back button on Android uses the default back transition

## Swipe back (iOS)

For now swipe back will trigger the state native transition (or the default). It does not use the back transition.

You can disable swipe back like this:

```
$ionicConfigProvider.views.swipeBackEnabled(false);
```

<a name="transitions"></a>

## Events
You can listen to success or error events

```
$rootScope.$on('ionicNativeTransitions.success', function(){
    // Transition success
});

$rootScope.$on('ionicNativeTransitions.error', function(){
    // Transition error
});
```

# Possible transitions
## Slide (default animation)

```
{
    "type"          : "slide",
    "direction"     : "left", // 'left|right|up|down', default 'left' (which is like 'next')
    "duration"      :  500, // in milliseconds (ms), default 400
}
```

## Flip

```
{
    "type"          : "flip",
    "direction"     : "up", // 'left|right|up|down', default 'right' (Android currently only supports left and right)
    "duration"      :  500, // in milliseconds (ms), default 400
}
```

## Fade (iOS and Android only)

```
{
    "type"          : "fade",
    "duration"      :  500, // in milliseconds (ms), default 400
}
```

## Drawer (iOS and Android only)

```
{
    "type"          : "drawer",
    "origin"        : "left", // 'left|right', open the drawer from this side of the view, default 'left'
    "action"        : "open", // 'open|close', default 'open', note that close is not behaving nicely on Crosswalk
 }
```

## Curl (iOS only, direction up and down only)

```
{
    "type"          : "curl",
    "direction"     : "up", // 'up|down', default 'up'
}
```

# Contribute
## Development

```
npm install

# Open two terminals
# and run watch to build on the lib files changes
npm run watch

# in the other terminal run following to build the test page and the doc
npm run devserver
```

Open `http://localhost:8080`

## Tests on device

```
npm run platformAddAndroid
npm run platformAddIOS
npm run pluginAddAll

# run iOS devices
npm run runIosDevice

# run iOS devices
npm run runAndroid
```

# Thanks
- Eddy Verbruggen for his amazing job on: [https://github.com/Telerik-Verified-Plugins/NativePageTransitions](https://github.com/Telerik-Verified-Plugins/NativePageTransitions)
- GAJOTRES for his great post: [http://www.gajotres.net/handling-native-view-animations-with-ionic-framework/](http://www.gajotres.net/handling-native-view-animations-with-ionic-framework/)
