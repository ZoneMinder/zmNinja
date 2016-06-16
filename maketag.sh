#!/bin/sh
read -p "Please generate CHANGELOG and commit it BEFORE you tag. Press a key when ready..."
orig=$1
VER="${orig/v//}"
echo $VER
exit
git tag -fa v$1 -m'v$1'
git push -f --tags
