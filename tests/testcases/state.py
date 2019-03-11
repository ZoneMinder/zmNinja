'''
Validates State view
'''

import common as c  
from time import sleep
import app

def run_tests(self):
    app.tap_menu_js()
    c.log ('Validating state with restart')
    c.click_item('testaut_menu_state')
    c.click_item('testaut_state_restart_button')
    c.click_popup(save_screenshot=True, save_screenshot_file='state-restart-prompt.png')
    # Wait for state change to show
    sleep(2)
    c.take_screenshot(None,'state-after-restart.png')

        


