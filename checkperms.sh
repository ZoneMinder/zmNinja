#!/bin/sh
SDK_VERSION='29.0.1'
if [ -z "$1" ]; then
	FILE="platforms/android/build/outputs/apk/android-debug.apk"
else
	FILE="$1"
fi
echo "*** Permissions for $FILE ***"
`echo $ANDROID_HOME`/build-tools/${SDK_VERSION}/aapt d permissions $FILE
