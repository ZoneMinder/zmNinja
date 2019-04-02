#!/bin/bash
rm -rf binary/*
#cp ../../debug_files/app-debug.apk binary/zmNinja.apk
cp ../../release_files/zmNinja.apk binary/zmNinja.apk
cp -R ~/Library/Developer/Xcode/DerivedData/zmNinja-dgoooijqwytvduflzaereulftmpl/Build/Products/Debug-iphonesimulator/zmNinja.app binary/
