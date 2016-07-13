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
	ZIPNAME=$DIRNAME".zip"
	echo "------------------------------------------------------------------------"
	echo "Working on packaging $i"
	echo "------------------------------------------------------------------------"
	exe rm -fr $i/app
	exe mkdir $i/app
	exe cp -R www/ $i/app
	exe cp electron_js/* $i/app
	exe cp www/ZMNINJA-LICENSE-DESKTOP-CLIENT.txt ../$DIRNAME
	exe cd $i
	cat app/js/DataModel.js | sed "s/var zmAppVersion[ ]*=[ ]*\"unknown\"/var zmAppVersion=\"$APPVER\"/" > app/js/DataModel.js.tmp
	exe rm -fr app/js/DataModel.js
	exe mv app/js/DataModel.js.tmp app/js/DataModel.js
	
	
	rm -fr app.asar
	exe asar pack app app.asar
	exe rm -fr app
	exe cd - 
	#echo "creating build ZIP"
	#exe zip -r ../$ZIPNAME ../$DIRNAME
	echo "Done!"
	
else
	echo "$i does not exist, skipping"
fi
done


