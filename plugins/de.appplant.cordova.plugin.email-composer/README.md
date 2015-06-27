
<p align="right">
    <a href="https://github.com/katzer/cordova-plugin-email-composer/tree/example">EXAMPLE :point_right:</a>
</p>

Cordova Email Plugin
====================

<img width="260px" align="right" hspace="7" vspace="5" src="http://flashsimulations.com/wp-content/uploads/2011/12/air-ios-in-app-mail-app.png">

The plugin provides access to the standard interface that manages the editing and sending an email message. You can use this view controller to display a standard email view inside your application and populate the fields of that view with initial values, such as the subject, email recipients, body text, and attachments. The user can edit the initial contents you specify and choose to send the email or cancel the operation.

Using this interface does not guarantee immediate delivery of the corresponding email message. The user may cancel the creation of the message, and if the user does choose to send the message, the message is only queued in the Mail application outbox. This allows you to generate emails even in situations where the user does not have network access, such as in airplane mode. This interface does not provide a way for you to verify whether emails were actually sent.


### Plugin's Purpose
The purpose of the plugin is to create an platform independent javascript interface for [Cordova][cordova] based mobile applications to access the specific email composition API on each platform.


## Overview
1. [Supported Platforms](#supported-platforms)
2. [Installation](#installation)
3. [ChangeLog](#changelog)
4. [Using the plugin](#using-the-plugin)
5. [Examples](#examples)
6. [Quirks](#quirks)


## Supported Platforms
- __iOS__ _(up to iOS8)_
- __Android__ _(up to KitKat and L)_
- __WP 8.0__ and __WP 8.1 Silverlight__
- __Windows__


## Installation
The plugin can either be installed from git repository, from local file system through the [Command-line Interface][CLI]. Or cloud based through [PhoneGap Build][PGB].

### Local development environment
From master:
```bash
# ~~ from master branch ~~
cordova plugin add https://github.com/katzer/cordova-plugin-email-composer.git
```
from a local folder:
```bash
# ~~ local folder ~~
cordova plugin add de.appplant.cordova.plugin.email-composer --searchpath path/to/plugin
```
or to use the last stable version:
```bash
# ~~ stable version ~~
cordova plugin add de.appplant.cordova.plugin.email-composer@0.8.2
```

### PhoneGap Build
Add the following xml to your config.xml to always use the latest version of this plugin:
```xml
<gap:plugin name="de.appplant.cordova.plugin.email-composer" version="0.8.2" />
```
More informations can be found [here][PGB_plugin].


## ChangeLog
#### Version 0.8.2 (01.03.2015)
- Added new namespace `cordova.plugins.email`<br>
  **Note:** The former `plugin.email` namespace is now deprecated and will be removed with the next major release.
- [___change:___] Unified `absolute:` and `relative:` to `file:`
- [___change:___] Renamed `isServiceAvailable` to `isAvailable`
- [feature:] `app:` allows to specify target mail app on Android
- [feature:] `res:` prefix for native ressource attachments
- [enhancement:] Support attachments on Windows Phone 8.1
- [enhancement:] `open` supports callbacks
- [enhancement:] `isHTML` can be used next `isHtml`
- [enhancement:] Set mime type to binary if unknown
- [bugfix:] Defaults were ignored

#### Known issues
- _\<img\>_ tags do not work on Android.
- Callbacks for WP8/Windows platform are called immediately.
- _isAvailable_ does always return _true_ for WP8/Windows platform.
- The plugin may crash on WP8.1/Windows if an attachmant does not exist.

#### Further informations
- See [CHANGELOG.md][changelog] to get the full changelog for the plugin.


## Using the plugin
The plugin creates the object ```cordova.plugins.email``` with following methods:

1. [email.isAvailable][available]
2. [email.open][open]

### Plugin initialization
The plugin and its methods are not available before the *deviceready* event has been fired.

```javascript
document.addEventListener('deviceready', function () {
    // cordova.plugins.email is now available
}, false);
```

### Determine if the device is capable to send emails
The ability to send emails can be revised through the `email.isAvailable` interface. The method takes a callback function, passed to which is a boolean property. Optionally the callback scope can be assigned as a second parameter.

The Email service is only available on devices capable which are able to send emails. E.g. which have configured an email account and have installed an email app. You can use this function to hide email functionality from users who will be unable to use it.

```javascript
cordova.plugins.email.isAvailable(
    function (isAvailable) {
        // alert('Service is not available') unless isAvailable;
    }
);
```

### Open a pre-filled email draft
A pre-filled email draft can be opened through the `email.open` or `email.openDraft` interface. The method takes a hash as an argument to specify the email's properties. All properties are optional. Further more it accepts an callback function to be called after the email view has been dismissed.

After opening the draft the user may have the possibilities to edit, delete or send the email.

#### Further informations
- An [configured email account][available] is required to send emails.
- Attachments can be either base64 encoded datas, files from the the device storage or assets from within the *www* folder.
- The default value for *isHTML* is *true*.
- Its possible to [specify][email_app] the email app on Android.
- See the [examples][examples] for how to create and show an email draft.

```javascript
cordova.plugins.email.open({
    to:          Array, // email addresses for TO field
    cc:          Array, // email addresses for CC field
    bcc:         Array, // email addresses for BCC field
    attachments: Array, // file paths or base64 data streams
    subject:    String, // subject of the email
    body:       String, // email body (for HTML, set isHtml to true)
    isHtml:    Boolean, // indicats if the body is HTML or plain text
}, callback, scope);
```


## Examples

### Open an email draft
The following example shows how to create and show an email draft pre-filled with different kind of properties.

```javascript
cordova.plugins.email.open({
    to:      'max@mustermann.de',
    cc:      'erika@mustermann.de',
    bcc:     ['john@doe.com', 'jane@doe.com'],
    subject: 'Greetings',
    body:    'How are you? Nice greetings from Leipzig'
});
```

Of course its also possible to open a blank draft.
```javascript
cordova.plugins.email.open();
```

### Send HTML encoded body
Its possible to send the email body either as text or HTML. In the case of HTML the `isHTML` properties needs to be set.

```javascript
cordova.plugins.email.open({
    to:      'max@mustermann.de',
    subject: 'Greetings',
    body:    '<h1>Nice greetings from Leipzig</h1>',
    isHtml:  true
});
```

### Get informed when the view has been dismissed
The `open` method supports additional callback to get informed when the view has been dismissed.

```javascript
cordova.plugins.email.open(properties, function () {
    console.log('email view dismissed');
}, this);
```

### Adding attachments
Attachments can be either base64 encoded datas, files from the the device storage or assets from within the *www* folder.

#### Attach Base64 encoded content
The code below shows how to attach an base64 encoded image which will be added as a image with the name *icon.png*.

```javascript
cordova.plugins.email.open({
    subject:     'Cordova Icon',
    attachments: 'base64:icon.png//iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/...'
});
```

#### Attach files from the device storage
The path to the files must be defined absolute from the root of the file system.

```javascript
cordova.plugins.email.open({
    attachments: 'file:///storage/sdcard/icon.png', //=> Android
});
```

#### Attach native app resources
Each app has a resource folder, e.g. the _res_ folder for Android apps or the _Resource_ folder for iOS apps. The following example shows how to attach the app icon from within the app's resource folder.

```javascript
cordova.plugins.email.open({
    attachments: 'res://icon.png' //=> res/drawable/icon (Android)
});
```

#### Attach assets from the www folder
The path to the files must be defined relative from the root of the mobile web app folder, which is located under the _www_ folder.

```javascript
cordova.plugins.email.open({
    attachments: [
        'file://img/logo.png', //=> assets/www/img/logo.png (Android)
        'file://css/index.css' //=> www/css/index.css (iOS)
    ]
});
```


## Platform specifics

### Specify email app
Its possible to specify the email app __on Android__ which shall open the draft for further editing. By default `email.open` does show a chooser with all available applications.

The app can be specified by either an alias or its package name. The alias _gmail_ is available by default.

```javascript
// Add app alias
cordova.plugins.email.addAlias('gmail', 'com.google.android.gm');

// Specify app by name or alias
cordova.plugins.email.open({
    app: 'gmail',
    subject: 'Sent from Gmail'
})
```


## Quirks

### HTML and CSS on Android
Even Android is capable to render HTML formatted mails, most native Mail clients like the standard app or Gmail only support rich formatted text while writing mails. That means that __CSS cannot be used__ (no _class_ and _style_ support).

The following table gives an overview which tags and attributes can be used:

<table>
<td width="60%">
    <ul>
        <li><code>&lt;a href="..."&gt;</code></li>
        <li><code>&lt;b&gt;</code></li>
        <li><code>&lt;big&gt;</code></li>
        <li><code>&lt;blockquote&gt;</code></li>
        <li><code>&lt;br&gt;</code></li>
        <li><code>&lt;cite&gt;</code></li>
        <li><code>&lt;dfn&gt;</code></li>
        <li><code>&lt;div align="..."&gt;</code></li>
        <li><code>&lt;em&gt;</code></li>
        <li><code>&lt;font size="..." color="..." face="..."&gt;</code></li>
        <li><code>&lt;h1&gt;</code></li>
        <li><code>&lt;h2&gt;</code></li>
        <li><code>&lt;h3&gt;</code></li>
    </ul>
</td>
<td width="40%">
    <ul>
        <li><code>&lt;h4&gt;</code></li>
        <li><code>&lt;h5&gt;</code></li>
        <li><code>&lt;h6&gt;</code></li>
        <li><code>&lt;i&gt;</code></li>
        <li><code>&lt;img src="..."&gt;</code></li>
        <li><code>&lt;p&gt;</code></li>
        <li><code>&lt;small&gt;</code></li>
        <li><code>&lt;strike&gt;</code></li>
        <li><code>&lt;strong&gt;</code></li>
        <li><code>&lt;sub&gt;</code></li>
        <li><code>&lt;sup&gt;</code></li>
        <li><code>&lt;tt&gt;</code></li>
        <li><code>&lt;u&gt;</code></li>
    </ul>
</td>
</table>

### HTML, CSS and attachments on Windows Phone 8
Attachments and HTML+CSS formatted body are not supported through the native API for Windows Phone 8.0 and Windows Phone 8.1 Silverlight.

### Compile error on iOS
The error indicates, that the `MessageUI.framework` is not linked to your project. The framework is linked automatically when the plugin was installed, but may removed later.

```
Undefined symbols for architecture i386:
  "_OBJC_CLASS_$_MFMailComposeViewController", referenced from:
      objc-class-ref in APPEmailComposer.o
ld: symbol(s) not found for architecture i386
clang: error: linker command failed with exit code 1 (use -v to see invocation)
```


## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request


## License

This software is released under the [Apache 2.0 License][apache2_license].

© 2013-2015 appPlant UG, Inc. All rights reserved


[cordova]: https://cordova.apache.org
[ios_guide]: http://developer.apple.com/library/ios/documentation/MessageUI/Reference/MFMailComposeViewController_class/Reference/Reference.html
[wp8_guide]: http://msdn.microsoft.com/en-us/library/windowsphone/develop/hh394003.aspx
[CLI]: http://cordova.apache.org/docs/en/edge/guide_cli_index.md.html#The%20Command-line%20Interface
[PGB]: http://docs.build.phonegap.com/en_US/index.html
[PGB_plugin]: https://build.phonegap.com/plugins/2055
[messageui_framework]: #compile-error-on-ios
[changelog]: https://github.com/katzer/cordova-plugin-email-composer/blob/master/CHANGELOG.md
[available]: #determine-if-the-device-is-capable-to-send-emails
[open]: #open-a-pre-filled-email-draft
[email_app]: #specify-email-app
[examples]: #examples
[apache2_license]: http://opensource.org/licenses/Apache-2.0
