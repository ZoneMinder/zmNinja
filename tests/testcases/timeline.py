'''
Validates Timeline View
'''

import common as c  
from time import sleep
import app

def run_tests(self):
    app.tap_menu_js()
    c.log ('Validating timeline')
    c.click_item('testaut_menu_timeline')
    c._wait_for_id('timeline-ctrl')
    c.take_screenshot(None, 'view-after-timeline-draw.png')


