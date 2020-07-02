#!/bin/sh
SDK_VERSION='29.0.3'
if [ -z "$1" ]; then
	FILE="platforms/android/build/outputs/apk/android-debug.apk"
else
	FILE="$1"
fi
echo "*** Permissions for $FILE ***"
`echo $ANDROID_SDK_ROOT`/build-tools/${SDK_VERSION}/aapt d permissions $FILE
