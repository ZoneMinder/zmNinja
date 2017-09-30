#!/bin/bash

exe() { echo "\$ $@" ; "$@" ; }

if [ ! -d "desktop" ]; then
	echo "You have not downloaded desktop images"
	echo "Please run ./prepare_desktop.sh"
	echo
	exit
fi

echo ----------------------------------------------------
echo Pliable Pixels Desktop build process
echo ----------------------------------------------------
APPVER=`cat config.xml | grep "widget " | sed 's/.* version=\"\([^\"]*\)\" xmlns.*/\1/'`
APPVER+="D"
echo "Application version:$APPVER"

declare -a app_ports=("desktop/zmNinja-mac.app/Contents/Resources" "desktop/zmNinja-linux32bit/resources" "desktop/zmNinja-linux64bit/resources" "desktop/zmNinja-win64bit/resources" "desktop/zmNinja-win32bit/resources"  "desktop/zmNinja-linuxarm/resources")

for i in "${app_ports[@]}"
do
if [ -d "$i" ]; then
	DIRNAME=$i

	if [ "${i}" == "desktop/zmNinja-mac.app/Contents/Resources" ]; then
		BASENAME="desktop/zmNinja-mac.app/Contents"
	else
		BASENAME=`expr "$i" : '\(.*\)/resources'`
	fi

    echo "------------------------------------------------------------------------"
	echo "Working on packaging $i"
	echo "------------------------------------------------------------------------"
	exe rm -fr $i/app
	exe mkdir $i/app
	exe mkdir $i/app/node_modules
    exe cp -R node_modules/electron-window-state $i/app/node_modules
    exe cp -R node_modules/jsonfile $i/app/node_modules
    exe cp -R node_modules/mkdirp $i/app/node_modules
    exe cp -R node_modules/deep-equal $i/app/node_modules
	exe cp -R node_modules/minimist $i/app/node_modules
	
	exe cp -R www/* $i/app/
	exe cp electron_js/* $i/app
	exe cp www/ZMNINJA-LICENSE-DESKTOP-CLIENT.txt $BASENAME
        echo $APPVER > $BASENAME/version
	exe cp resources/icon.png $BASENAME
	exe cd $i
	cat app/js/DataModel.js | sed "s/var zmAppVersion[ ]*=[ ]*\"unknown\"/var zmAppVersion=\"$APPVER\"/" > app/js/DataModel.js.tmp
	exe rm -fr app/js/DataModel.js
	exe mv app/js/DataModel.js.tmp app/js/DataModel.js
	
	
	rm -fr app.asar

	# No idea why but asar is causing problems in windows
	# main.js changes are not showig up. wuh? - Sep 29, 2017

	#exe asar pack app app.asar
	#read -p "Press a key to remove app dir for $i..."
	#exe rm -fr app
	exe cd - 
    #OSX ditto does a better job than zip!
    #echo "Creating ZIP $ZIPNAME..."
	#exe zip -r ../$ZIPNAME ../$DIRNAME

	echo "Done!"
	
else
	echo "$i does not exist, skipping"
fi
done


