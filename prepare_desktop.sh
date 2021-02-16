#!/bin/bash

#REL="v4.0.0"
# If compiling on rPI make use 3.0.16
REL="v11.2.3"
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
echo This will delete all files in desktop/ and also remove icon associations
read -p "Press a key to continue or Ctrl-C to break..."


iswget=`which ${WGET}`
if [ $? -ne 0 ]; then
    echo "**ERROR** You need ${WGET} installed in your path to use this tool."  
    exit
fi
rm -rf desktop
mkdir -p desktop 2>/dev/null
cd desktop


declare -a release_names=("darwin-x64" "darwin-arm64" "win32-x64" "win32-ia32" "linux-arm" "linux-x64" "linux-ia32" "linux-arm64")
declare -a release_renames=("zmNinja-mac-x86.app" "zmNinja-mac-arm64.app" "zmNinja-win64bit" "zmNinja-win32bit" "zmNinja-linuxarmv7l" "zmNinja-linux64bit" "zmNinja-linux32bit" "zmNinja-linuxarm64")

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
    if [ "${release_names[$i]}" != "darwin-x64" ] && [ "${release_names[$i]}" != "darwin-arm64" ]; then
        exe mkdir electron-${REL}-${release_names[$i]} >/dev/null 2>&1
        exe rm -fr electron-${REL}-${release_names[$i]}/* >/dev/null 2>&1
        exe ${UNZIP}  electron-${REL}-${release_names[$i]}.zip  ${UNZIP_ARGS} electron-${REL}-${release_names[$i]} 2>/dev/null 
        exe mv electron-${REL}-${release_names[$i]} ${release_renames[$i]} >/dev/null 2>&1
        mv ${release_renames[$i]}/electron.exe ${release_renames[$i]}/zmNinja.exe >/dev/null 2>&1
        mv ${release_renames[$i]}/electron ${release_renames[$i]}/zmNinja >/dev/null 2>&1

    else # OSX
        exe ${UNZIP} electron-${REL}-${release_names[$i]}.zip  2>/dev/null 
        exe mv Electron.app ${release_renames[$i]}
        
    fi 
    
    rm LICENSE* >/dev/null 2>&1
    rm version >/dev/null 2>&1
done

rm *.zip >/dev/null 2>&1

echo
echo =========================================================
echo All done. Use ./make_desktop now
echo You need to associate icons for OSX and windows
echo for OSX
echo =========================================================
echo


