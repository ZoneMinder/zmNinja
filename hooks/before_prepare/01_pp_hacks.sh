#!/bin/sh

exe() { echo "\$ $@" ; "$@" ; }

# Custom stuff I need to do for zmNinja
echo ----------------------------------------------------
echo Pliable Pixels build pre-preprocessing
echo ----------------------------------------------------
echo Curr Dir: `pwd`

#if [ -d "plugins/phonegap-plugin-push/src/android/com/adobe/phonegap/push/" ]; then
#	echo "Copying Modified GCMIntentService for custom sound"
#	exe cp www/external/GCMIntentService.java plugins/phonegap-plugin-push/src/android/com/adobe/phonegap/push/
#	exe cp www/external/GCMIntentService.java platforms/android/src/com/adobe/phonegap/push
#else
#	echo "Directory plugins/phonegap-plugin-push/src/android/com/adobe/phonegap/push/ does not exist, skipping..."
#fi

echo "Copying custom sound"
echo "---------------------"

if [ -d "platforms/android" ]; then
	exe mkdir -p platforms/android/res/raw/
	exe cp www/sounds/blop.mp3 platforms/android/res/raw/
	exe cp www/sounds/blop.caf platforms/ios/zmNinja/Resources
else
	echo "Directory platforms/android does not exist, skipping..."
fi

echo "Copying plist hack for iOS for non SSL connections"
echo "--------------------------------------------------"
if [ -d "platforms/ios/zmNinja" ]; then
	exe cp www/external/zmNinja-Info.plist.IOS9nonSSLPatch platforms/ios/zmNinja/zmNinja-Info.plist
else
	echo "Directory platforms/ios/zmNinja does not exist, skipping..."
fi

echo "Copying Android notification icons to resource dir"
echo "--------------------------------------------------"
if [ -d "platforms/android/res/" ]; then
	exe cp -R www/external/android-notification-icons/ platforms/android/res/
else
	echo "Directory platforms/android/res/ does not exist, skipping..."
fi

#echo "Fixing insecure SSL permission problem"
#echo "--------------------------------------------------"
#if [ -d "platforms/android/CordovaLib/src/org/apache/cordova/engine" ]; then
#	exe cp www/external/SystemWebViewClient.java platforms/android/CordovaLib/src/org/apache/cordova/engine
#else
#	echo "Directory platforms/android/CordovaLib/src/org/apache/cordova/engine does not exist, skipping..."
#fi
#if [ -d "platforms/ios/zmNinja/Classes" ]; then
#	exe cp www/external/AppDelegate.m platforms/ios/zmNinja/Classes/
#else
#	echo "Directory platforms/ios/zmNinja/Classes does not exist, skipping..."
#fi





