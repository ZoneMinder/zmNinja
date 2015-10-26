#!/bin/sh

exe() { echo "\$ $@" ; "$@" ; }

# Custom stuff I need to do for zmNinja
echo ----------------------------------------------------
echo Pliable Pixels build pre-preprocessing
echo ----------------------------------------------------
echo Curr Dir: `pwd`
echo "Copying Modified GCMIntentService for custom sound"
exe cp www/external/GCMIntentService.java plugins/phonegap-plugin-push/src/android/com/adobe/phonegap/push/
exe cp www/external/GCMIntentService.java platforms/android/src/com/adobe/phonegap/push

echo "Copying custom sound"
echo "---------------------"
exe mkdir -p platforms/android/res/raw/
exe cp www/sounds/blop.mp3 platforms/android/res/raw/
exe cp www/sounds/blop.caf platforms/ios/zmNinja/Resources

echo "Copying plist hack for iOS for non SSL connections"
echo "--------------------------------------------------"
exe cp www/external/zmNinja-Info.plist.IOS9nonSSLPatch platforms/ios/zmNinja/zmNinja-Info.plist

echo "Copying Android notification icons to resource dir"
echo "--------------------------------------------------"
exe cp -R www/external/android-notification-icons/ platforms/android/res/


