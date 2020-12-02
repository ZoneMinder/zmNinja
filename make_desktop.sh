#!/bin/bash
RED='\033[0;31m'
NC='\033[1m\033[0m'
GREEN='\033[0;32m'
ORANGE='\033[0;33m'
GREY='\033[0;37m'


err() { echo -e "${RED}$@${NC}"; }
warn() { echo -e "${ORANGE}$@${NC}"; }
success() { echo -e "${GREEN}$@${NC}"; }
debug() { echo -e "${GREY}->$@${NC}"; }

exe() {  debug "\$ $@" ; "$@" ; }

if [ ! -d "desktop" ]; then
	echo "You have not downloaded desktop images"
	echo "Please run ./prepare_desktop.sh"
	echo
	exit
fi

while [[ $# -gt 0 ]]
do
        arg="$1"
        case $arg in
              -h|--help)
                      echo "./make_desktop.sh [--port|-p mac|linux32|linux64|linuxarm|win32|win64|arm|<any substring that matches one or more port names>]"
                      echo "                  so -p linux will build linux32/64/arm as they all match linux"
                      echo "                  [--nocolor|nc] to disable color output"
                      echo
                      exit
                      ;;

              -p|--port)
                      PORT="$2"
                      shift
                      shift
                      ;;
              -nc|--nocolor)
                      RED=''
                      NC=''
                      GREEN=''
                      ORANGE=''
                      GREY=''
                      shift
                      ;;
              *)
                      echo "Unknown argument $1, ignoring..."
                      shift
                      ;;
        esac
done

[[ ! -z $PORT ]]  && echo "Only creating build for $PORT" && PORT="-$PORT"

echo ----------------------------------------------------
echo Pliable Pixels Desktop build process
echo This is DEPRECATED. Please use the new build process
echo ----------------------------------------------------
APPVER=`cat config.xml | grep "widget " | sed 's/.* version=\"\([^\"]*\)\" xmlns.*/\1/'`
APPVER+="D"
echo "Application version:$APPVER"

declare -a app_ports=("desktop/zmNinja-mac.app/Contents/Resources" "desktop/zmNinja-linux32bit/resources" "desktop/zmNinja-linux64bit/resources" "desktop/zmNinja-win64bit/resources" "desktop/zmNinja-win32bit/resources"  "desktop/zmNinja-linuxarmv7l/resources" "desktop/zmNinja-linuxarm64/resources")

for i in "${app_ports[@]}"
do
        if [[ "$i" =~ $PORT || -z $PORT ]]; then
                :
        else
                warn "$i will be skipped (did not match $PORT)"
                continue
        fi
        if [ -d "$i" ]; then
        	DIRNAME=$i

        	if [ "${i}" == "desktop/zmNinja-mac.app/Contents/Resources" ]; then
        		BASENAME="desktop/zmNinja-mac.app/Contents"
        	else
        		BASENAME=`expr "$i" : '\(.*\)/resources'`
        	fi

                echo "------------------------------------------------------------------------"
                success "Working on packaging $i"
                echo "------------------------------------------------------------------------"
                echo Creating paths...
                exe rm -fr $i/app
                exe mkdir $i/app
                exe mkdir $i/app/node_modules
                exe mkdir $i/app/www
                exe mkdir $i/app/electron_js

                echo Copying over relevant node modules...
                exe cp -R node_modules/electron-window-state $i/app/node_modules
                exe cp -R node_modules/jsonfile $i/app/node_modules
                exe cp -R node_modules/mkdirp $i/app/node_modules
                exe cp -R node_modules/deep-equal $i/app/node_modules
                exe cp -R node_modules/minimist $i/app/node_modules
                exe cp -R node_modules/menu $i/app/node_modules
                exe cp -R node_modules/clivas $i/app/node_modules
                exe cp -R node_modules/keypress $i/app/node_modules
                exe cp -R node_modules/define-properties $i/app/node_modules
                exe cp -R node_modules/es-abstract $i/app/node_modules
                exe cp -R node_modules/function-bind $i/app/node_modules
                exe cp -R node_modules/has $i/app/node_modules
                exe cp -R node_modules/has-symbols $i/app/node_modules
                exe cp -R node_modules/is-arguments $i/app/node_modules
                exe cp -R node_modules/is-date-object $i/app/node_modules
                exe cp -R node_modules/is-regex $i/app/node_modules
                exe cp -R node_modules/object-is $i/app/node_modules
                exe cp -R node_modules/object-keys $i/app/node_modules
                exe cp -R node_modules/regexp.prototype.flags $i/app/node_modules
                
                echo Copying over zmNinja code...
                exe cp package.json $i/app
                exe cp -R www/* $i/app/www
                exe cp electron_js/main.js $i/app/electron_js
                exe cp www/ZMNINJA-LICENSE-DESKTOP-CLIENT.txt $BASENAME
                echo $APPVER > $BASENAME/version
                echo "APP VER IS $APPVER"
                exe cp resources/icon.png $BASENAME
                exe cd $i 
                cat app/www/js/NVR.js | sed "s/var zmAppVersion[ ]*=[ ]*\".*\"/var zmAppVersion=\"$APPVER\"/" > app/www/js/NVR.js.tmp
                exe rm -fr app/www/js/NVR.js
                exe mv app/www/js/NVR.js.tmp app/www/js/NVR.js
                exe cp app/www/js/NVR.js /tmp
                
                rm -fr app.asar

                # No idea why but asar is causing problems in windows
                # main.js changes are not showig up. wuh? - Sep 29, 2017

                #exe asar pack app app.asar
                #read -p "Press a key to remove app dir for $i..."
                #exe rm -fr app
                cd - 
                #OSX ditto does a better job than zip!
                #echo "Creating ZIP $ZIPNAME..."
                #exe zip -r ../$ZIPNAME ../$DIRNAME

                success "Done!"
                echo
                
        else # dirname exists
        	echo "$i does not exist, skipping"
        fi
done
echo
warn "Note, SASS changes won't be reflected. Run 'ionic build' for that"
echo


