#!/bin/bash

NINJAKEYSTORE=~/Desktop/zmNinja.keystore

if [ ! -f "$NINJAKEYSTORE" ]; then
	echo "zmNinja keystore not found"
	exit
fi


rm -fr platforms/android/build/outputs/*
mkdir release_files
rm -f release_files/*

BUILD_MODE="all"
if [ "$1" = "1" ]; then
	BUILD_MODE="xwalk"
	echo "only building crosswalk"
fi

if [ "$1" = "2" ]; then
	BUILD_MODE="native"
	echo "only building native view (5+)"
fi

if [ "$BUILD_MODE" = "xwalk" ] || [ "$BUILD_MODE" = "all" ]; then

	echo "Building Release mode for Xwalk android..."
	echo "--------------------------------------------"
	echo "Adding crosswalk..."
  ionic plugin add cordova-plugin-crosswalk-webview


  echo "Adding crosswalk cert plugin..."
  cordova plugin remove cordova-plugin-certificates
  cordova plugin add https://github.com/danjarvis/cordova-plugin-crosswalk-certificate
  ionic platform remove android
  ionic platform add android
	cp "$NINJAKEYSTORE" platforms/android

	ionic build android --release

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
fi

if [ "$BUILD_MODE" = "native" ] || [ "$BUILD_MODE" = "all" ]; then

	echo "Building Release mode for android 5+..."
	echo "--------------------------------------------"
	rm -fr platforms/android/build/outputs/*
	echo "Adding default browser..."
  ionic plugin remove cordova-plugin-crosswalk-webview

  cordova plugin remove cordova-plugin-crosswalk-certificate
  cordova plugin add https://github.com/hypery2k/cordova-certificate-plugin
  ionic platform remove android
  ionic platform add android
	cp "$NINJAKEYSTORE" platforms/android

	ionic build android --release -- --minSdkVersion=21

	cp platforms/android/build/outputs/apk/android-release-unsigned.apk release_files/
	echo "Copied files to release_files"


	#read -p "Press any key to jarsign... " -n1 -s
	cd release_files/
	jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../platforms/android/zmNinja.keystore android-release-unsigned.apk zmNinja

	#read -p "Press any key to zipalign... " -n1 -s

	~/Library/Android/sdk/build-tools/22.0.1/zipalign -v 4 android-release-unsigned.apk zmNinja.apk
	rm -f android-release-unsigned.apk 

	cd ..
fi


