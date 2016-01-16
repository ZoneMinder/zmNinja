#!/bin/bash

NINJAKEYSTORE=~/Desktop/zmNinja.keystore

if [ ! -f "$NINJAKEYSTORE" ]; then
	echo "zmNinja keystore not found"
	exit
fi


echo "Building Release mode for Xwalk android..."
echo "--------------------------------------------"
rm -fr platforms/android/build/outputs/*
echo "Adding crosswalk..."
ionic browser add crosswalk@15.44.384.9
cp "$NINJAKEYSTORE" platforms/android
ionic build android --release

rm -f release_files/*
cp platforms/android/build/outputs/apk/android-x86-release-unsigned.apk release_files/
cp platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk release_files/
echo "Copied files to release_files"


#read -p "Press any key to jarsign... " -n1 -s
cd release_files/
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../platforms/android/zmNinja.keystore android-armv7-release-unsigned.apk zmNinja
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../platforms/android/zmNinja.keystore android-x86-release-unsigned.apk zmNinja

#read -p "Press any key to zipalign... " -n1 -s

~/Library/Android/sdk/build-tools/22.0.1/zipalign -v 4 android-x86-release-unsigned.apk zmNinja-x86-pre5.apk
~/Library/Android/sdk/build-tools/22.0.1/zipalign -v 4 android-armv7-release-unsigned.apk zmNinja-arm-pre5.apk
rm -f android-x86-release-unsigned.apk android-armv7-release-unsigned.apk

cd ..


echo "Building Release mode for android 5+..."
echo "--------------------------------------------"
rm -fr platforms/android/build/outputs/*
echo "Adding default browser..."
ionic browser revert android
cp "$NINJAKEYSTORE" platforms/android
ionic build android --release -- --minSdkVersion 21

cp platforms/android/build/outputs/apk/android-release-unsigned.apk release_files/
echo "Copied files to release_files"


#read -p "Press any key to jarsign... " -n1 -s
cd release_files/
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../platforms/android/zmNinja.keystore android-release-unsigned.apk zmNinja

#read -p "Press any key to zipalign... " -n1 -s

~/Library/Android/sdk/build-tools/22.0.1/zipalign -v 4 android-release-unsigned.apk zmNinja.apk
rm -f android-release-unsigned.apk 

cd ..


