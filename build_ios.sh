
if [ "$1" != "skip" ]
then
#  ionic cordova plugin remove cordova-plugin-ionic-webview 2>/dev/null
  echo "Adding wkwebview..."
  cordova plugin add cordova-plugin-ionic-webview

else
  echo "Skipping plugin update process. Make sure you did not build for Android before this"
fi


echo "-- building --"
#ionic cordova build ios --release --buildConfig="./build-auto.json"
cordova prepare
cordova build ios --release --device --buildConfig="./build.json"
echo "********* Done *************"

