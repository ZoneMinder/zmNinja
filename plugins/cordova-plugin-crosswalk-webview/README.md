# cordova-plugin-crosswalk-webview

Makes your Cordova application use the [Crosswalk WebView](https://crosswalk-project.org/)
instead of the System WebView. Requires cordova-android 4.0 or greater.

### Install

The following directions are for cordova-cli (most people).  Alternatively you can use the [Android platform scripts workflow](PlatformScriptsWorkflow.md).

* Open an existing cordova project, with cordova-android 4.0.0+, and using the latest CLI.
* Add this plugin

```
$ cordova plugin add cordova-plugin-crosswalk-webview
```

* Build
```
$ cordova build android
```
The build script will automatically fetch the Crosswalk WebView libraries from Crosswalk project download site (https://download.01.org/crosswalk/releases/crosswalk/android/maven2/) and build for both X86 and ARM architectures.

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

### Configure

You can try out a different Crosswalk version using a `<preference>` tag within your `config.xml`. Some examples:

    <!-- These are all equivalent -->
    <preference name="xwalkVersion" value="org.xwalk:xwalk_core_library_beta:13+" />
    <preference name="xwalkVersion" value="xwalk_core_library_beta:13+" />
    <preference name="xwalkVersion" value="13+" />
    <preference name="xwalkVersion" value="13" />

You can set [command-line flags](http://peter.sh/experiments/chromium-command-line-switches/) as well:

    <!-- This is the default -->
    <preference name="xwalkCommandLine" value="--disable-pull-to-refresh-effect" />

### Release Notes

#### 1.2.0 (April 22, 2015)
* Made Crosswalk command-line configurable via `<preference name="xwalkCommandLine" value="..." />`
* Disabled pull-down-to-refresh by default

#### 1.1.0 (April 21, 2015)
* Based on Crosswalk v13
* Made Crosswalk version configurable via `<preference name="xwalkVersion" value="..." />`

#### 1.0.0 (Mar 25, 2015)
* Initial release
* Based on Crosswalk v11
