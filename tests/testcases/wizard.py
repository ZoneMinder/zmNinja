'''
Validates Wizard view 
'''

import common as c
import app
from time import sleep

def run_tests(self):

    success_color = 'rgba(22, 160, 133, 1)'
    fail_color = 'rgba(231, 76, 60, 1)'

    c.log ('Validating wizard test case')
    c.click_item('testaut_wizard_button')

    c.log ('Entering portal text')
    c.input_item('testaut_portal_input', c.testConfig['portal'])

    c.click_item('testaut_wiz1_next_button')

    c.log ('Setting up auth parameters')
    # fill in auth settings based on how you configured the server
    if c.testConfig['use_auth']:
        c.tap_toggle('testaut_useauth_toggle')
        if c.testConfig['use_zm_auth']:
            c.tap_toggle('testaut_usezmauth_toggle')
            c.input_item('testaut_zmauthusername_input', c.testConfig['user'])
            c.input_item('testaut_zmauthpassword_input', c.testConfig['password'])
        if c.testConfig['use_basic_auth']:
            c.tap_toggle('testaut_usebasicauth_toggle')
            c.input_item('testaut_basicauthusername_input', c.testConfig['user'])
            c.input_item('testaut_basicauthpassword_input', c.testConfig['password'])
    c.click_item('testaut_wiz2_next_button')

    # Now check wizard results
    portal_ok = c.get_element_attributes('testaut_wizard_portal_results')
    portal_color = portal_ok.value_of_css_property('color')
    self.assertEqual(portal_color,success_color)
    # don't do this before assert. If portal fails, api won't show
    api_ok = c.get_element_attributes('testaut_wizard_api_results')
    api_color = api_ok.value_of_css_property('color')
    self.assertEqual(api_color,success_color)
    
    # Wait for bit for cgi-bin. Don't really care, but hey if we catch it, cool
    sleep(3)
    c.take_screenshot(None,'wizard-detection-results.png')

    c.click_item('testaut_wizard_goto_login')
    c.click_item('testaut_settings_save')


    # discard the popup and get to sane state
    c.click_popup(save_screenshot=True, save_screenshot_file='./screenshots/wizard-save-report.png')
    sleep(3)
    app.tap_menu_js()
