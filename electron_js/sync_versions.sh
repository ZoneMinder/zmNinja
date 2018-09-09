#!/bin/bash
APPVER=`cat config.xml | grep "widget " | sed 's/.* version=\"\([^\"]*\)\" xmlns.*/\1/'`

echo "Config.xml: App version: ${APPVER}"
echo "Syncing package.json and DataModel.js with this version..."

cat www/js/DataModel.js | sed s/"var zmAppVersion =.*"/"var zmAppVersion = \"${APPVER}\";"/g > www/js/DataModel.js.tmp

cat ./package.json | sed  s/"\"version\":.*"/"\"version\":\"${APPVER}\","/g > package.json.tmp

rm package.json
mv package.json.tmp package.json

rm  www/js/DataModel.js
mv  www/js/DataModel.js.tmp www/js/DataModel.js
echo "Done!"
