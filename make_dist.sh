#!/bin/bash
DISTROS="all"
rm -fr dist/
echo $1
if [ ! -z "$1" ]; then
  DISTROS=$1
fi
npm run dist-${DISTROS}
