#!/bin/bash
APPVER=`cat config.xml | grep "<widget" | sed -n 's/.*version="\([^"]*\).*/\1/p'`

echo "Config.xml: App version: ${APPVER}"
echo "Syncing package.json and NVR.js with this version..."

cat www/js/NVR.js | sed s/"var zmAppVersion =.*"/"var zmAppVersion = \"${APPVER}\";"/g > www/js/NVR.js.tmp

cat ./package.json | sed  s/"\"version\":.*"/"\"version\":\"${APPVER}\","/g > package.json.tmp

rm package.json
mv package.json.tmp package.json

rm  www/js/NVR.js
mv  www/js/NVR.js.tmp www/js/NVR.js
echo "Done!"
