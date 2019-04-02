'''
Validates Logs View
'''

import common as c  
from time import sleep
import app

def run_tests(self):
    app.tap_menu_js()
    c.log ('Validating logs')
    c.click_item('testaut_menu_logs')
    sleep(2)
    c.take_screenshot(None, 'logs-app-ver.png')

