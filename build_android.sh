#!/bin/bash
SDK_VERSION='29.0.2'


build_debug() {
        echo "*********** Building Debug Build **************"
        rm -rf debug_files 2>/dev/null
        mkdir debug_files
        ionic cordova build android
        # adding back wkwebview clears platform debug directory later
        cp platforms/android/app/build/outputs/apk/debug/app-debug.apk  debug_files
        echo "*** Your debug file has been moved to  debug_files/app-debug.apk"
}


build_release() {
        echo "*********** Building Release Build **************"
        echo "----> Only building native. Not building crosswalk anymore due to compatibility issues <----------"
        # App signining credentials in this file
        NINJAKEYSTORE=~/Desktop/zmNinja.keystore

        if [ ! -f "$NINJAKEYSTORE" ]; then
                echo "zmNinja keystore not found"
                exit
        fi

       BUILD_MODE="native"
        rm -rf release_files 2>/dev/null
        mkdir release_files


        ############ Native web view build ###############################

            echo "${ver}: Building Release mode for android 5+..."
            echo "--------------------------------------------"
            
        #    No longer needed as we are not supporting Xwalk
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
            # minSdk and targetSdk version are in config.xml
            cordova build android --release --  --versionCode=${ver}

            # copy build to release folder and sign
            cp platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk release_files/android-release-unsigned.apk
            echo "Copied files to release_files"

            cd release_files/
            jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ../platforms/android/zmNinja.keystore android-release-unsigned.apk zmNinja
            ~/Library/Android/sdk/build-tools/${SDK_VERSION}/zipalign -v 4 android-release-unsigned.apk zmNinja.apk
            rm -f android-release-unsigned.apk 
            cd ..

         # Do a phone perm check

            ./checkperms.sh release_files/zmNinja.apk
            echo "*** Phone State Check:"
            ./checkperms.sh release_files/zmNinja.apk | grep PHONE_STATE

            echo "***VERSION CODE CHECKS:"
            for f in release_files/*; do
                echo "$f:"
                `echo $ANDROID_HOME`/build-tools/${SDK_VERSION}/aapt dump badging $f | grep versionCode
                `echo $ANDROID_HOME`/build-tools/${SDK_VERSION}/aapt dump badging $f | grep native-code
            done

  }


# parse arguments
# credit: https://stackoverflow.com/a/14203146/1361529
MODE="release"
while [[ $# -gt 0 ]]
do
key="$1"
case $key in
    -d|--debug)
    MODE="debug"
    shift # past argument
    ;;
    -r|--release)
    MODE="release"
    shift # past argument
    ;;
    *)    # unknown option
    shift # past argument
    ;;
esac
done  

./electron_js/sync_versions.sh

APPVER=`cat config.xml | grep "<widget" | sed -n 's/.*version="\([^"]*\).*/\1/p'`
# multipleApk adds 2 and 4 in Xwalk builds for arm and x86 respectively
ver_pre5=${APPVER//.} 
ver=${APPVER//.}9


echo "About to build version: $APPVER ($MODE)"
read -p "Press any key..."

echo "Removing wkwebview..."
cordova plugin remove cordova-plugin-ionic-webview > /dev/null 2>&1

echo "Adding cordova-plugin-certificates-pp-fork..."
cordova plugin add cordova-plugin-certificates-pp-fork > /dev/null 2>&1


if [ "${MODE}" = "debug" ]; then
        build_debug
else
        build_release
fi



echo "Removing certificate fork..."
cordova plugin remove cordova-plugin-certificates-pp-fork > /dev/null 2>&1
#cordova plugin add  https://github.com/pliablepixels/cordova-plugin-ionic-webview.git > /dev/null 2>&1

echo "If you faced DEX etc goofy errors, cd platforms/android && gradle clean or try removing/adding android"

  
