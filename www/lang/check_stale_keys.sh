#!/bin/bash
stale=0
clearline='\033[K'
echo "Checking keys..."
for i in `cat locale-en.json | awk '/^[[:blank:]]*"k/ {print $1}' | sed s/\"//g`
do
        t=`grep $i ../templates/*.html  ../js/*.js 2>/dev/null | wc -l`
        echo -en "\r${clearline}${i}..."
        if [ "$t" -eq "0" ]; then
                ((stale++))
                echo
                echo $i occurs $t times
        fi
done
echo -e "\r${clearline}All Done!"
echo 
echo "========= TOTAL: ${stale} stale keys ========";
echo
