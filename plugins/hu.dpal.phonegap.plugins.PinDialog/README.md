PinDialog
=========

PhoneGap numeric password dialog plugin for Android and iOS. Forked from https://github.com/apache/cordova-plugin-dialogs.git

## Installation

Latest stable release: ```phonegap local plugin add hu.dpal.phonegap.plugins.pindialog```  
or ```cordova plugin add hu.dpal.phonegap.plugins.pindialog```

Current state from git: ```phonegap local plugin add https://github.com/Paldom/PinDialog.git```  
or ```cordova plugin add https://github.com/Paldom/PinDialog.git```

## Installation - PhoneGap Build 

Add following to config.xml: ```<gap:plugin name="hu.dpal.phonegap.plugins.pindialog" />```
or ```<gap:plugin name="hu.dpal.phonegap.plugins.pindialog" source="plugins.cordova.io" />```

## Supported Platforms

- Android
- iOS

## Usage:

    // Show pin dialog
    window.plugins.pinDialog.prompt("message", callback, "title", ["OK","Cancel"]);

Callback:

    function callback(results)
    {
        if(results.buttonIndex == 1)
        {
            // OK clicked, show input value
            alert(results.input1);
        }
        if(results.buttonIndex == 2)
        {
            // Cancel clicked
            alert("Cancel");
        }
    };
