'''
Main zmNinja test driver
Invokes other test cases
'''

import unittest
from time import sleep
from appium import webdriver
import os
import glob

import common as c
import wizard
import app
import montage
 
class ZmninjaAndroidTests(unittest.TestCase):
    'Class to run tests against zmNinja'

    def setUp(self):
        c.log ('Setting up....')

        desired_caps = {
            'platformName': 'Android',
            'automationName': 'UiAutomator2',
            'platformVersion': '7.1.1',
            'deviceName': 'Pixel',
            'nativeWebTap': True,
            'nativeWebScreenshot': True, # important, for screenshots
            'autoAcceptAlerts': True,
            'autoGrantPermissions': True,
            'appPackage': 'com.pliablepixels.zmninja_pro',
            'appActivity': 'com.pliablepixels.zmninja_pro.MainActivity'
        }
        # Returns abs path relative to this file and not cwd
        desired_caps['app'] = os.path.abspath(os.path.join(os.path.dirname(__file__),'./zmNinja.apk'))
        c.driver = webdriver.Remote('http://localhost:4723/wd/hub', desired_caps)
        c.driver.switch_to.context('WEBVIEW_com.pliablepixels.zmninja_pro')
        
      
    def tearDown(self):
        c.log ('Test complete')
        c.driver.quit()


    def wait_for_app_start(self):
        c.log ('Waiting for app to start')
        #sleep (5)

    def test_app(self):
        c.testConfig['portal'] = 'https://demo.zoneminder.com/zm'
        c.testConfig['user'] = 'zmuser'
        c.testConfig['password'] = 'zmpass'
        c.testConfig['use_auth'] = True
        c.testConfig['use_zm_auth'] = True
        c.testConfig['use_basic_auth'] = False
        c.testConfig['screenshot_dir'] = './screenshots'

        if not os.path.exists(c.testConfig['screenshot_dir']):
            os.makedirs(c.testConfig['screenshot_dir'])
        files = glob.glob(c.testConfig['screenshot_dir']+'/*')
        for f in files:
            os.remove(f)

        self.wait_for_app_start()
        wizard.run_tests(self)
        montage.run_tests(self)


    
#---START OF SCRIPT
if __name__ == '__main__':
    suite = unittest.TestLoader().loadTestsFromTestCase(ZmninjaAndroidTests)
    unittest.TextTestRunner(verbosity=2).run(suite)
