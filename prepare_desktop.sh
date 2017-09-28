#!/bin/bash

REL="v1.7.8"
WGET='wget'
WGET_ARGS='-q --show-progress'
UNZIP='unzip'
UNZIP_ARGS='-d'

exe() { echo "\$ $@" ; "$@" ; }

echo ----------------------------------------------------
echo Pliable Pixels Desktop preparation process
echo Use this to download electron images
echo You really need to do this one time
echo ----------------------------------------------------
echo


iswget=`which ${WGET}`
if [ $? -ne 0 ]; then
    echo "**ERROR** You need ${WGET} installed in your path to use this tool."  
    exit
fi
rm -rf desktop
mkdir -p desktop 2>/dev/null
cd desktop


declare -a release_names=("darwin-x64" "win32-x64" "linux-arm" "linux-x64" "linux-ia32")
declare -a release_renames=("zmNinja-mac.app" "zmNinja-win32-64bit" "zmNinja-linuxarm" "zmNinja-linux64bit" "zmNinja-linux32bit")

for i in "${!release_names[@]}"
do
    RELEASE="https://github.com/electron/electron/releases/download/${REL}/electron-${REL}-${release_names[$i]}.zip"
    echo
    echo "Working on ${RELEASE}..."
    #echo "Rename to ${release_renames[$i]}"
    echo "---------------------------------------------"
    
    echo "Downloading ${release_names[i]}  ..."
    exe ${WGET} ${RELEASE} ${WGET_ARGS}
    

    echo "Decompressing image..."
    if [ "${release_names[$i]}" != "darwin-x64" ]; then
        exe mkdir electron-${REL}-${release_names[$i]} >/dev/null 2>&1
        exe rm -fr electron-${REL}-${release_names[$i]}/* >/dev/null 2>&1
        exe ${UNZIP}  -f electron-${REL}-${release_names[$i]}.zip  ${UNZIP_ARGS} electron-${REL}-${release_names[$i]} >/dev/null 2>&1
        exe mv electron-${REL}-${release_names[$i]} ${release_renames[$i]} >/dev/null 2>&1
    else
        exe ${UNZIP} -f electron-${REL}-${release_names[$i]}.zip  >/dev/null 2>&1
        exe mv Electron.app ${release_renames[$i]}
    fi 
    
    rm LICENSE* 2>/dev/null
    rm version 2>/dev/null
done
echo
echo =========================================================
echo All done. Use ./make_desktop now
echo You need to associate icons for OSX and windows
echo for OSX
echo =========================================================
echo


