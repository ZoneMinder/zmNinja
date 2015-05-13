

Apache Cordova Crosswalk Engine
===

Cordova Crosswalk Engine is a [Crosswalk WebView](https://crosswalk-project.org/) based engine to work with [Apache Cordova](http://cordova.apache.org/) for Android. This currently works with master branch of [Cordova Android](https://github.com/apache/cordova-android) on GitHub, and it will work with Apache Cordova Android 4.0.0 release.

### Directions:
#### Android-only:
* Pull down the Cordova Android
```
$ git clone https://github.com/apache/cordova-android.git
```
* Generate a project, e.g creating HelloWorld
```
$ /path/to/cordova-android/bin/create hello com.example.hello HelloWorld
```
* Navigate to the project folder
```
$ cd hello
```
* Install Crosswalk engine plugin by plugman (version >= 0.22.17)
```
$ plugman install --platform android --plugin https://github.com/MobileChromeApps/cordova-crosswalk-engine.git --project .
```
* Build
```
$ ./cordova/build
```
The build script will automatically fetch the Crosswalk WebView libraries from Crosswalk project download site (https://download.01.org/crosswalk/releases/crosswalk/android/) and build for both X86 and ARM architectures. 

For example, building HelloWorld generates:

```
/path/to/hello/build/outputs/apk/hello-x86-debug.apk
/path/to/hello/build/outputs/apk/hello-armv7-debug.apk
```

#### Cordova CLI:
(It will be updated after cordova-android 4.0.0 release with CLI)

* Install the latest version of the Cordova CLI from npm (version >= 4.2.0)
```
$ npm install -g cordova
```
* Create a project with cordova create, e.g creating HelloWorld
```
$ cordova create hello com.example.hello HelloWorld
```
* Navigate to the project folder
```
$ cd hello
```
* Add the Android platform @4.0.0-dev
```
$ cordova platform add https://github.com/apache/cordova-android.git
```
* Add the Crosswalk engine plugin
```
$ cordova plugin add  https://github.com/MobileChromeApps/cordova-crosswalk-engine.git
```
* Build
```
$ cordova build android
```
The build script will automatically fetch the Crosswalk WebView libraries from Crosswalk project download site (https://download.01.org/crosswalk/releases/crosswalk/android/) and build for both X86 and ARM architectures.

For example, building android with Crosswalk generates:

```
/path/to/hello/platforms/android/build/outputs/apk/hello-x86-debug.apk
/path/to/hello/platforms/android/build/outputs/apk/hello-armv7-debug.apk
```

Note that it is also possible to publish a multi-APK application on the Play Store that uses Crosswalk for Pre-L devices, and the (updatable) system webview for L+:

To build Crosswalk-enabled apks, add this plugin and run:

    $ cordova build --release

To build System-webview apk, remove this plugin and run:

    $ cordova build --release -- --android-minSdkVersion=21
