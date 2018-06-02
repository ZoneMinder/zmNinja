#!/bin/bash
stale=0
echo
for i in `cat locale-en.json | awk '/^[[:blank:]]*"k/ {print $1}' | sed s/\"//g`
do
        t=`grep $i ../templates/*.html  ../js/*.js 2>/dev/null | wc -l`
        if [ "$t" -eq "0" ]; then
                ((stale++))
                echo $i occurs $t times
        fi
done
echo "========= TOTAL: ${stale} stale keys ========";
echo
