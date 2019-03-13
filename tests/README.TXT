Appium install: http://appium.io/docs/en/about-appium/getting-started/
Python Appium client install: https://github.com/appium/python-client


Android
---------
I currently test on an Android 7.1.1 emulator. Change test.py config as needed

./startappium.sh


iOS
----
For iOS: Also needs `brew install carthage` (?)
Read/follow: http://appium.io/docs/en/drivers/ios-xcuitest/index.html
https://github.com/appium/appium-xcuitest-driver

brew tap wix/brew && brew install wix/brew/applesimutils

Just run appium (not start-appium.sh)
export USE_PORT=8100
