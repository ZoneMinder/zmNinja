#!/bin/bash
if [ -z "$1" ]; then
    echo "Inferring version name from config.xml"
    APPVER=`cat config.xml | grep "widget " | sed 's/.* version=\"\([^\"]*\)\" xmlns.*/\1/'`
else
    APPVER=$1
fi

VER="${APPVER/v/}"
read -p "Future release is v${VER}. Please press any key to confirm..."
github_changelog_generator -u ZoneMinder -p zmNinja  --future-release v${VER}
#github_changelog_generator  --future-release v${VER}
