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
    sleep(2)
    c.take_screenshot(None, 'montage-view-initial.png')
    c.click_item('img-0')
    sleep(4)
    c.take_screenshot(None,'montage-singleview.png')
    c.log ('Trying to save to gallery...')
    c.click_item('testaut_monitormodal_camera_button')
    if c.platform == 'ios':
        sleep(3)
        try:
            c.log ("iOS:Auto accepting alert...")
            c.driver.execute('mobile:alert', { action: 'accept' });
            #c.driver.switchTo().alert().accept();
        except:
            pass
    c.wait_for_loading_text(save_screenshot=True, save_screenshot_file='single-view-photo-save-results.png', text_options = ['done', 'Error - could not save'])
    sleep(1)
    c.dbl_click_item('singlemonitor')

        


