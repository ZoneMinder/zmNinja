# WebSocket for Android [![GitHub version](https://badge.fury.io/gh/knowledgecode%2FWebSocket-for-Android.svg)](http://badge.fury.io/gh/knowledgecode%2FWebSocket-for-Android)
WebSocket for Android is a Cordova plugin that makes WebSocket (RFC 6455) available on Android.  
This is based on [Jetty 8](https://github.com/eclipse/jetty.project/tree/jetty-8) under the terms of the Apache License v2.0.  

## Requirements
 - Android 2.3 or later (recommended 4.1 or later)  
 - `cordova-android@3.0.0` or later or compatible framework  
 - `cordova-plugin-whitelist` or `cordova-plugin-legacy-whitelist` if using `cordova-android@4.0.0` and later  

The plugin for Cordova 2.x can be found [here](https://github.com/knowledgecode/WebSocket-for-Android/tree/2.x).  

## Supported Features
| version        | WS protocol | WSS protocol | text message | binary message |
|:--------------:|:-----------:|:------------:|:------------:|:--------------:|
| 2.3.3 (API 10) | ✓           | ✓            | ✓            |                |
| 4.0 (API 14)   | ✓           | ✓            | ✓            | ✓              |
| 4.0.3 (API 15) | ✓           | ✓            | ✓            | ✓              |
| 4.1.2 (API 16) | ✓           | ✓            | ✓            | ✓              |
| 4.2.2 (API 17) | ✓           | ✓            | ✓            | ✓              |
| 4.3.1 (API 18) | ✓           | ✓            | ✓            | ✓              |
| 4.4.2 (API 19) | -           | -            | -            | -              |
| 5.0.1 (API 21) | -           | -            | -            | -              |
| 5.1.1 (API 22) | -           | -            | -            | -              |

#### Notes
 - WSS protocol is only supported TLS. SSLv3 is not.  
 - Android 3.x (Honeycomb) are not supported (might work but is not tested).  
 - A new WebView based on Chromium supports WebSocket. Specifically Android 4.4 (KitKat) and later support them, so this plugin is **NOT** used on them by default.  
 - In `cordova-android@4.0.0` and later, this plugin can be used together with [Crosswalk](https://crosswalk-project.org/). In this case also it is not used by default because Crosswalk supports WebSocket.  
 - To support Android 5.x (Lollipop), would be better to build with `cordova-android@3.7.1` or later.  

## Installation
Use Cordova Command-Line Interface (CLI). At first, check Cordova version:
```sh
$ cordova --version
```
If using 5.0.0 or later, you can install it via npm:
```sh
$ cordova plugin add cordova-plugin-websocket
```
If using other old versions, you can install it via GitHub:
```sh
$ cordova plugin add https://github.com/knowledgecode/WebSocket-for-Android.git
```

#### Caveats
Cordova core plugins have been moved to npm from Cordova plugins registry (CPR). This plugin has been moved as well. It will be **no longer updated** in CPR. Not recommended even if you can still install it from there:
```sh
$ cordova plugin add com.knowledgecode.cordova.websocket
```

#### Setting a Content-Security-Policy (CSP)
`cordova-android@4.0.0` supports SCP. In order to permit WebSocket access using `cordova-plugin-whitelist`, append `connect-src` directive in `index.html`:
```html
connect-src ws://example.com wss://example.com
```
For example:
```html
<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval'; style-src 'self' 'unsafe-inline'; media-src *; connect-src ws://example.com wss://example.com">
```

## Upgrading from previous versions
Check the plugin id:
```sh
$ cordova plugin
```
Remove and reinstall:
```sh
$ cordova plugin rm <PLUGIN ID>
$ cordova plugin add cordova-plugin-websocket
```
Also will need to install `cordova-plugin-whitelist` or `cordova-plugin-legacy-whitelist` if using `cordova-android@4.0.0` and later.

#### Caveats
When install this plugin, it adds `INTERNET` permission to `platforms/android/AndroidManifest.xml`. If remove this plugin, the permission is also removed at the same time even if it is required for other plugins.  

## Usage
### *WebSocket(url[, protocols])*
The WebSocket(url, protocols) constructor takes one or two arguments. The first argument, url, specifies the URL to which to connect. The second, protocols, is either a string or an array of strings.  
A simple code is as follows:  
```javascript
document.addEventListener('deviceready', function () {
    var ws = new WebSocket('ws://echo.websocket.org');

    ws.onopen = function () {
        console.log('open');
        this.send('hello');         // transmit "hello" after connecting
    };

    ws.onmessage = function (event) {
        console.log(event.data);    // will be "hello"
        this.close();
    };

    ws.onerror = function () {
        console.log('error occurred!');
    };

    ws.onclose = function (event) {
        console.log('close code=' + event.code);
    };
}, false);
```
#### Options
This plugin has the following options. All these parameters are optional. Of course these don't affect built-in WebSocket.  

| key                  | type    | default value       | supported version        |
|:---------------------|:--------|:--------------------|:-------------------------|
| origin               | String  | file:// (usually)   | v0.3.0 ~                 |
| maxConnectTime       | Number  | 75000               | v0.4.0 ~                 |
| maxTextMessageSize   | Number  | -1                  | v0.4.0 ~ (except v0.8.x) |
| maxBinaryMessageSize | Number  | -1                  | v0.4.0 ~ (except v0.8.x) |
| override             | Boolean | false               | v0.8.0 ~                 |
| agent                | String  | (depends on device) | v0.9.0 ~                 |
| perMessageDeflate    | Boolean | true                | v0.10.0 ~                |

`origin` is a value to set the request header field. Default value is usually `file://`. This is the same value as when using built-in WebSocket.  

`maxConnectTime` is time to wait for connection. A unit is millisecond.  

`maxTextMessageSize` and `maxBinaryMessageSize` are receivable maximum size from the server. Default value is -1 (unlimited. depends on heap size of devices). A unit is byte.  

`override` is a flag to force WebView to use this plugin even if it supports WebSocket. However in most cases it will be slower than built-in WebSocket.  

`agent` is user-agent to set the request header field. Default value depends on devices. This is the same value as when using built-in WebSocket.  

`perMessageDeflate` is a flag whether to use permessage-deflate extension or not. Default value is true (but as of v0.10 was false). Sends data with compression if the server also supports permessage-deflate. However if mainly sending compressed binary like JPEG images, recommended to set to false.  

If change these parameters, need to do before creating a instance:  
```javascript
WebSocket.pluginOptions = {
    origin: 'http://example.com',
    maxConnectTime: 5000,
    override: true
};

var ws = new WebSocket('ws://echo.websocket.org');
```
### *send(data)*
Transmits data to the server over the WebSocket connection. The data takes a string, a blob, or an arraybuffer.  

#### Notes
An upper limit of the message size depends on heap size of devices. It would be better to consider a way to split the message if it is quite large.  
### *close([code[, reason]])*
Closes the WebSocket connection or connection attempt, if any.  

## Change Log
See [CHANGELOG.md](https://github.com/knowledgecode/WebSocket-for-Android/blob/master/CHANGELOG.md).

## License
This plugin is available under the terms of the Apache License Version 2.0.
