#!/bin/bash

    APPVER=`cat config.xml | grep "widget " | sed 's/.* version=\"\([^\"]*\)\" xmlns.*/\1/'`
    # multipleApk adds 2 and 4 in Xwalk builds for arm and x86 respectively
    ver_pre5=${APPVER//.} 
    ver=${APPVER//.}9

# App signining credentials in this file
NINJAKEYSTORE=~/Desktop/zmNinja.keystore

if [ ! -f "$NINJAKEYSTORE" ]; then
        echo "zmNinja keystore not found"
        exit
fi

rm -f release_files 2>/dev/null
mkdir release_files

# no arguments - build both
# 1 == build crosswalk only
# 2 == build native only
BUILD_MODE="all"
if [ "$1" = "1" ]; then
        BUILD_MODE="xwalk"
        echo "only building crosswalk"
fi
        
if [ "$1" = "2" ]; then
        BUILD_MODE="native"
        echo "only building native view (5+)"
fi

echo "----------> Only building native. Not building crosswalk anymore due to compatibility issues <----------------------"
BUILD_MODE="native"

############ Native web view build ###############################
if [ "$BUILD_MODE" = "native" ] || [ "$BUILD_MODE" = "all" ]; then

    echo "${ver}: Building Release mode for android 5+..."
    echo "--------------------------------------------"
    
#    No longger needed as we are not supporting Xwalk
#    echo "Removing android and re-adding..."
#    cordova platform remove android
#    cordova platform add android@6.4.0

   #clean up past build stuff
#    echo "Adding default browser..."
#    cordova plugin remove cordova-plugin-crosswalk-webview

    # use the right plugin for SSL certificate mgmt
#    cordova plugin remove cordova-plugin-crosswalk-certificate-pp-fork
#    cordova plugin add cordova-plugin-certificates
    cp "$NINJAKEYSTORE" platforms/android/

    # Make sure native builds are only deployed in devices >= Android 5
    cordova build android --release -- --minSdkVersion=21 --versionCode=${ver}

    # copy build to release folder and sign
    cp platforms/android/build/outputs/apk/release/android-release-unsigned.apk release_files/
    echo "Copied files to release_files"

    cd release_files/
    jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../platforms/android/zmNinja.keystore android-release-unsigned.apk zmNinja
    ~/Library/Android/sdk/build-tools/25.0.2/zipalign -v 4 android-release-unsigned.apk zmNinja.apk
    rm -f android-release-unsigned.apk 
    cd ..
fi

# Do a phone perm check

    ./checkperms.sh release_files/zmNinja.apk
    echo "*** Phone State Check:"
    ./checkperms.sh release_files/zmNinja.apk | grep PHONE_STATE

    echo "***VERSION CODE CHECKS:"
    for f in release_files/*; do
        echo "$f:"
        `echo $ANDROID_HOME`/build-tools/23.0.1/aapt dump badging $f | grep versionCode
        `echo $ANDROID_HOME`/build-tools/23.0.1/aapt dump badging $f | grep native-code
    done
