
## Install both Appium and Python Appium client
[Appium install](http://appium.io/docs/en/about-appium/getting-started/)
[Python Appium client instal](https://github.com/appium/python-client)


## Android
I currently test on an Android 7.1.1 emulator. Change test.py config as needed

```bash
./startappium.sh
```

## iOS

[Read/follow how to install XCUI deps](https://github.com/appium/appium-xcuitest-driver)
You also need:

```bash
brew install carthage 
brew tap wix/brew && brew install wix/brew/applesimutils
```

Just run appium (not start-appium.sh)
export USE_PORT=8100 (maybe)

To run test cases,

```bash
cd testcases
python ./test.py --ios OR --android
```