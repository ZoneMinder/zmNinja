echo "*** Using old build system due to XCode 10 issues ** "
echo "see https://forum.ionicframework.com/t/how-to-build-ionic-cordova-with-xcode-10/142044"

if [ "$1" != "skip" ]
then
  ionic cordova plugin remove cordova-plugin-ionic-webview 2>/dev/null
  ionic cordova plugin add https://github.com/pliablepixels/cordova-plugin-ionic-webview.git
  cordova plugin remove cordova-plugin-media-pp-fork
  cordova plugin add cordova-plugin-media-pp-fork
else
  echo "Skipping plugin update process. Make sure you did not build for Android before this"
fi

echo
echo "-- Copying manual files --"

cp ./etc/NotificationService.m ./platforms/ios/zmNinjaNotification/NotificationService.m
if [ $? -ne 0 ]
then
    echo "Error copying over Notification Service"
    exit 1
fi

#echo "--- readding certificate plugin to make sure... ---"
#ionic cordova plugin remove cordova-plugin-certificates
#ionic cordova plugin add cordova-plugin-certificates

echo "-- building --"
#ionic cordova build ios --release --buildConfig="./build-auto.json"
cordova prepare
ionic cordova build ios --buildConfig="./build-auto.json"
echo "********* Done *************"
echo "Make sure you are using Legacy build in XCode (File->Workspace) or push/etc may stop working"
