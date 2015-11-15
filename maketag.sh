#!/bin/sh
git tag -a v$1 -m'v$1'
git push origin v$1
