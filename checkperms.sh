#!/bin/sh
if [ -z "$1" ]; then
	FILE="platforms/android/build/outputs/apk/android-debug.apk"
else
	FILE="$1"
fi
echo "*** Permissions for $FILE ***"
`echo $ANDROID_HOME`/build-tools/23.0.1/aapt d permissions $FILE
