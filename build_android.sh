#!/bin/bash
SDK_VERSION='33.0.2'


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
        # App signining credentials in this file
        NINJAKEYSTORE=~/personal/zmninja_keys/zmNinja.keystore

        if [ ! -f "$NINJAKEYSTORE" ]; then
                echo "zmNinja keystore not found"
                exit
        fi

        if [[ -z "${ANDROID_SDK_ROOT}" ]]; then
            echo "ANDROID_SDK_ROOT must be set for the build process"
            exit 1
        fi


       BUILD_MODE="native"
        rm -rf release_files 2>/dev/null
        mkdir release_files


        ############ Native web view build ###############################

            echo "${ver}: Building Release mode for android..."
            echo "--------------------------------------------"

            cp "$NINJAKEYSTORE" platforms/android/

            # Make sure native builds are only deployed in devices >= Android 5
            # minSdk and targetSdk version are in config.xml
            cordova build android --release --  --versionCode=${ver}

            # copy build to release folder and sign
            cp platforms/android/app/build/outputs/bundle/release/app-release.aab release_files/zmNinja.aab
            echo "Signing bundle"
            jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore platforms/android/zmNinja.keystore release_files/zmNinja.aab zmNinja
            echo "Signed aab in release_files"

            # Build apk from bundle for verification if bundletool is available
            if command -v bundletool >/dev/null 2>&1; then
                bundletool build-apks --bundle=release_files/zmNinja.aab --output=release_files/zmNinja.apks --mode=universal
                unzip -d release_files release_files/zmNinja.apks universal.apk

                cd release_files/
                $ANDROID_SDK_ROOT/build-tools/${SDK_VERSION}/zipalign -v 4 universal.apk zmNinja.apk
                rm -f zmNinja.apks universal.apk
                echo "Signing apk"
                $ANDROID_SDK_ROOT/build-tools/${SDK_VERSION}/apksigner sign --ks-key-alias zmNinja --ks ../platforms/android/zmNinja.keystore zmNinja.apk
                ret=$?
                if [ $ret -ne 0 ]; then
                    echo "Unable to sign jar, please fix the error(s) above"
                    exit 1
                else
                    echo "Signed apk in release_files"
                fi

                cd ..

                # Do a phone perm check
                ./checkperms.sh release_files/zmNinja.apk
                echo "*** Phone State Check:"
                ./checkperms.sh release_files/zmNinja.apk | grep PHONE_STATE

                echo "***VERSION CODE CHECKS:"
                for f in release_files/*.apk; do
                    echo "$f:"
                    `echo $ANDROID_SDK_ROOT`/build-tools/${SDK_VERSION}/aapt dump badging $f | grep versionCode
                    `echo $ANDROID_SDK_ROOT`/build-tools/${SDK_VERSION}/aapt dump badging $f | grep native-code
                done
	    fi

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


echo "About to build version: $APPVER [$ver] ($MODE)"
echo $ver
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


