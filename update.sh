plugins=`cordova plugin list | awk '{print $1}' | grep -v {}`
for plugin in $plugins
do
        echo "Here $plugin"
done
