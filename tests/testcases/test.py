#!/usr/bin/python

'''
Main zmNinja test driver
Invokes other test cases
'''

import unittest
from time import sleep,localtime,strftime
from appium import webdriver
import os
import glob
import errno

import common as c
import wizard
import app
import montage
import state
import events

 
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
       
        desired_caps['app'] = os.path.abspath(os.path.join(os.path.dirname(__file__),'./zmNinja.apk'))
        c.driver = webdriver.Remote('http://localhost:4723/wd/hub', desired_caps)
        c.driver.switch_to.context('WEBVIEW_com.pliablepixels.zmninja_pro')
        
      
    def tearDown(self):
        c.log ('Test complete')
        c.driver.quit()


    def wait_for_app_start(self):
        c.log ('Waiting for app to start')
      

    def test_app(self):

        configs = [];

        # Add as many as you need
        
        configs.append ({
            'portal': 'https://demo.zoneminder.com/zm',
            'user': 'zmuser',
            'password': 'zmpass',
            'use_auth': True,
            'use_zm_auth': True,
            'use_basic_auth': False,
            'basic_user': None,
            'basic_password': None,
            'screenshot_dir': './screenshots',
            'restart': False,
            'prompt': False
        })

        configs.append ({
            'portal': 'https://10.6.1.16/zm',
            'user': 'admin',
            'password': 'admin',
            'use_auth': True,
            'use_zm_auth': True,
            'use_basic_auth': False,
            'basic_user': None,
            'basic_password': None,
            'screenshot_dir': './screenshots',
            'restart': True,
            'prompt': True
        })
        
        self.wait_for_app_start()

        isFirstRun = True
        for config in configs:


            c.log ('\n\n***** Test Run for: {} *****\n\n'.format(config['portal']))
            if config['prompt']:
                proceed = input ("Should I run this profile? [y/N]")
                if proceed.lower() != 'y':
                    c.log ('Skipping profile')
                    continue


            c.testConfig = config
            run_dir = strftime('%b-%d-%I_%M_%S%p', localtime())
            c.testConfig['screenshot_dir'] = './screenshots/'+run_dir
            try:
                os.makedirs(c.testConfig['screenshot_dir'])
            except OSError as exc:
                if exc.errno == errno.EEXIST and os.path.isdir(path):
                    pass
                else:
                    raise


            #files = glob.glob(c.testConfig['screenshot_dir']+'/*')
            #for f in files:
            #    os.remove(f)
            
            wizard.run_tests(self, isFirstRun)
            isFirstRun = False
            montage.run_tests(self)
            events.run_tests(self)
            if c.testConfig['restart']:
                state.run_tests(self)


    
#---START OF SCRIPT
if __name__ == '__main__':
    suite = unittest.TestLoader().loadTestsFromTestCase(ZmninjaAndroidTests)
    unittest.TextTestRunner(verbosity=2).run(suite)
