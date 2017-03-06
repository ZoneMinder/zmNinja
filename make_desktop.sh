#!/bin/bash

exe() { echo "\$ $@" ; "$@" ; }

echo ----------------------------------------------------
echo Pliable Pixels Desktop build process
echo ----------------------------------------------------
APPVER=`cat config.xml | grep "widget " | sed 's/.* version=\"\([^\"]*\)\" xmlns.*/\1/'`
APPVER+="D"
echo "Application version:$APPVER"

declare -a app_ports=("../zmNinja-mac.app/Contents/Resources" "../zmNinja-linux32bit/resources" "../zmNinja-linux64bit/resources" "../zmNinja-win64bit/resources" "../zmNinja-win32bit/resources" "../zmNinja-linuxarm/resources")

for i in "${app_ports[@]}"
do
if [ -d "$i" ]; then
	DIRNAME=`expr "$i" : '\.\./\(.*\)/'`
        echo "Dirname:" $DIRNAME
        PDIRNAME=`echo "$DIRNAME" | sed "s/\/Contents//"  `
        echo "Pdirname:" $PDIRNAME
        ZIPNAME="${PDIRNAME}_${APPVER}.zip"
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
	exe cp -R www/* $i/app/
	exe cp electron_js/* $i/app
	exe cp www/ZMNINJA-LICENSE-DESKTOP-CLIENT.txt ../$DIRNAME
        echo $APPVER > ../$DIRNAME/version
	exe cp resources/icon.png ../$DIRNAME
	exe cd $i
	cat app/js/DataModel.js | sed "s/var zmAppVersion[ ]*=[ ]*\"unknown\"/var zmAppVersion=\"$APPVER\"/" > app/js/DataModel.js.tmp
	exe rm -fr app/js/DataModel.js
	exe mv app/js/DataModel.js.tmp app/js/DataModel.js
	
	
	rm -fr app.asar
	exe asar pack app app.asar
	exe rm -fr app
	exe cd - 
    #OSX ditto does a better job than zip!
    #echo "Creating ZIP $ZIPNAME..."
	#exe zip -r ../$ZIPNAME ../$DIRNAME

	echo "Done!"
	
else
	echo "$i does not exist, skipping"
fi
done


