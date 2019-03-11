'''
Validates Events view
'''

import common as c  
from time import sleep
import app

def run_tests(self):
    app.tap_menu_js()
    c.log ('Validating events')
    c.click_item('testaut_menu_events')

    # Can't use click_item (el.click) due to footer button
    # focus conflict
    # taking 2nd event - first one goes off in emulator
    # no idea why
    
    c.click_item_js('testaut_events_footage_button-1')
  
    sleep(4)
    c.take_screenshot(None,'events-playback.png')
    sleep(1)
    c.dbl_click_item('testaut_events_playwindow')

        


