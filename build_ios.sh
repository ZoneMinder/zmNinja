
if [ "$1" != "skip" ]
then
#  ionic cordova plugin remove cordova-plugin-ionic-webview 2>/dev/null
  echo "Adding wkwebview..."
  cordova plugin add https://github.com/ZoneMinder/cordova-plugin-ionic-webview.git

else
  echo "Skipping plugin update process. Make sure you did not build for Android before this"
fi


echo "-- building --"
#ionic cordova build ios --release --buildConfig="./build-auto.json"
cordova prepare
cordova build ios --buildConfig="./build.json"
echo "********* Done *************"

