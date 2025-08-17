import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zoneminder.zmNinja',
  appName: 'zmNinja',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#2980b9'
    },
    SplashScreen: {
      launchShowDuration: 300,
      backgroundColor: '#ababab',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true
    },
    Keyboard: {
      resizeOnFullScreen: true
    }
  },
  cordova: {
    preferences: {
      KeyboardResize: 'true',
      KeyboardResizeMode: 'ionic',
      iosPersistentFileLocation: 'Library',
      AllowInlineMediaPlayback: 'true',
      DisallowOverscroll: 'true',
      BackupWebStorage: 'none',
      AutoHideSplashScreen: 'false',
      ShowSplashScreenSpinner: 'false',
      SplashScreen: 'screen',
      'deployment-target': '15.0',
      SplashScreenDelay: '300',
      SplashMaintainAspectRatio: 'true',
      FadeSplashScreen: 'false',
      BackgroundColor: '#444444',
      'android-targetSdkVersion': '34',
      'android-compileSdkVersion': '34',
      'android-minSdkVersion': '22',
      SplashScreenBackgroundColor: '#ababab',
      StatusBarOverlaysWebView: 'false',
      StatusBarBackgroundColor: '#2980b9',
      SplashShowOnlyFirstTime: 'false'
    }
  }
};

export default config;
