#!/bin/bash

echo "Building Release mode for android..."
ionic build android --release

rm -f release_files/*
cp platforms/android/build/outputs/apk/android-x86-release-unsigned.apk release_files/
cp platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk release_files/
echo "Copied files to release_files"


read -p "Press any key to jarsign... " -n1 -s
cd release_files/
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../platforms/android/zmNinja.keystore android-armv7-release-unsigned.apk zmNinja
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../platforms/android/zmNinja.keystore android-x86-release-unsigned.apk zmNinja

read -p "Press any key to zipalign... " -n1 -s

~/Library/Android/sdk/build-tools/22.0.1/zipalign -v 4 android-x86-release-unsigned.apk zmNinja-x86.apk
~/Library/Android/sdk/build-tools/22.0.1/zipalign -v 4 android-armv7-release-unsigned.apk zmNinja-arm.apk

cd ..


