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
import argparse

import common as c
import wizard
import app
import montage
import state
import events
import logs
import timeline

 
class ZmninjaAndroidTests(unittest.TestCase):
    'Class to run tests against zmNinja'

    def setUp(self):
        c.log ('Setting up for platform: {}....'.format(c.platform))
        app_name = None
    
        if c.platform == 'android':
            app_name = "zmNinja.apk"
            desired_caps = {
                'platformName': 'Android',
                'automationName': 'UiAutomator2',
                'platformVersion': '8.0',
                'deviceName': 'DoesntMatter',
                'avd': c.avd,
                # 'avd': 'zmNinja_6_0',
                'nativeWebTap': True,
                'nativeWebScreenshot': True, # important, for screenshots
                'autoAcceptAlerts': True,
                'autoGrantPermissions': True,
                'appPackage': 'com.pliablepixels.zmninja_pro',
                'appActivity': 'com.pliablepixels.zmninja_pro.MainActivity'
            }
           
            
       

        else:
            # iOS settings
            app_name = "zmNinja.app"
            desired_caps = {
                'platformName': 'iOS',
                'platformVersion': '12.1',
                'deviceName': 'iPhone SE',
                'nativeWebTap': False,
                'permissions': '{"com.pliablepixels.zmninja-pro": {"photos": "YES"}}',
                
               #'connectHardwareKeyboard': False,
               # 'sendKeyStrategy': 'grouped',
                #'nativeWebScreenshot': True, # important, for screenshots
                'autoAcceptAlerts': True,
                'autoGrantPermissions': True # doesn't work with XCUI
            }
           
           # desired_caps['permissions']['com.pliablepixels.zmninja-pro']['photos'] = 'YES'
            

           
        desired_caps['app'] = os.path.abspath(os.path.join(os.path.dirname(__file__),'./binary/'+app_name))
        c.driver = webdriver.Remote('http://localhost:4723/wd/hub', desired_caps)
        contexts = c.driver.contexts
        c.log ("All app contexts: {}".format(contexts))
        c.web_context = contexts[1]
        c.native_context = contexts[0]
        c.driver.switch_to.context(c.web_context)
        
    def tearDown(self):
        c.log ('Test complete')
        c.driver.quit()


    def wait_for_app_start(self):
        c.log ('Waiting for app to start')
      

    def test_app(self):

        configs = [];

        # Add as many as you need

        '''
        configs.append ({
            'portal': 'https://zm',
            'user': 'admin',
            'password': '',
            'use_auth': True,
            'use_zm_auth': True,
            'use_basic_auth': False,
            'basic_user': None,
            'basic_password': None,
            'screenshot_dir': './screenshots',
            'restart': False,
            'prompt': True
        })
        '''
        
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
            'prompt': True
        })

        configs.append ({
            'portal': 'https://10.6.1.32/zm',
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
            run_dir = strftime(c.avd+'_'+c.platform+'-%b-%d-%I_%M_%S%p', localtime())
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
            
            sleep(5)
            wizard.run_tests(self, isFirstRun)
            isFirstRun = False
            logs.run_tests(self)
            montage.run_tests(self)
            events.run_tests(self)
            timeline.run_tests(self)
            if c.testConfig['restart']:
                state.run_tests(self)


    
#---START OF SCRIPT

platform = None
ap = argparse.ArgumentParser()
ap.add_argument('-i', '--ios', action='store_true')
ap.add_argument('-a', '--android', action='store_true')
ap.add_argument('--avd')
args, u = ap.parse_known_args()
args = vars(args)

if args['ios']:
    c.platform = 'ios'
else:
    c.platform = 'android'

if args['avd']:
    c.avd = args['avd']



suite = unittest.TestLoader().loadTestsFromTestCase(ZmninjaAndroidTests)
unittest.TextTestRunner(verbosity=2).run(suite)
