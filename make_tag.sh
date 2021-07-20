#!/bin/bash
if [ -z "$1" ]; then
    echo "Inferring version name from config.xml"
    APPVER=`cat config.xml | grep "widget " | sed 's/.* version=\"\([^\"]*\)\" xmlns.*/\1/'`
else
    APPVER=$1
fi
VER="${APPVER/v/}"
echo "Creating tag:v$VER"

read -p "Please generate CHANGELOG and commit it BEFORE you tag. Press a key when ready..."
read -p "Press any key to create the tag or Ctrl-C to break..." -n1 
git tag -fa v$VER -m"v$VER"
git push -f --tags
git push upstream -f  --tags
