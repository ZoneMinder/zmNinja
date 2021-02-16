#!/bin/bash
DISTROS="all"
rm -fr dist/
echo $1
if [ ! -z "$1" ]; then
  DISTROS=$1
fi
npm run dist-${DISTROS}

cat << EOF
---- So I do not forget ---
If stuff fails:
a) login to apple dev + appstore connect and see if you've signed all agreements 
b) ./node_modules/.bin/electron-builder -m > out.txt - read it
c) Ignore npm debug logs, they are stupid and a waste of time
d) All else fails, upgrade versions in package.json, do npm install 
   package@ver or package@latest with --save or --savedev
EOF