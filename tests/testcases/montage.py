'''
Validates Montage view
'''

import common as c  
from time import sleep
import app

def run_tests(self):
    app.tap_menu_js()
    c.log ('Validating montage')
    c.click_item('testaut_menu_montage')
    c.click_item('img-1')
    sleep(4)
    c.take_screenshot(None,'montage-singleview.png')
    c.dbl_click_item('singlemonitor')

        


