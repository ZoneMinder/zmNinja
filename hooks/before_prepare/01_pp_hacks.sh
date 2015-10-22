#!/bin/sh
# Custom stuff I need to do for zmNinja
echo Curr Dir: `pwd`
echo "Copying Modified GCMIntentService for custom sound"
cp www/external/GCMIntentService.java plugins/phonegap-plugin-push/src/android/com/adobe/phonegap/push/
cp www/external/GCMIntentService.java platforms/android/src/com/adobe/phonegap/push

echo "Copying custom sound"
mkdir -p platforms/android/res/raw/
cp www/sounds/blop.mp3 platforms/android/res/raw/

cp www/sounds/blop.caf platforms/ios/zmNinja/Resources


