'''
Common functions used by test cases

'''


from time import sleep,strftime
import os
from selenium.webdriver.common.touch_actions import TouchActions
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC



# global pointer to chrome driver
driver = None

# keeps incrementing by 1 for screenshots saved
image_counter = 1

# global ZM portal data
testConfig = {
        'portal':None,
        'user':None,
        'password':None,
        'use_auth':False,
        'use_zm_auth':False,
        'use_basic_auth':False,
        'basic_user':None,
        'basic_password':None,
        'screenshot_dir':'./screenshots'

}

def log(s):
    print (strftime("%H:%M:%S") + ": " + s)


# central function to save a screenshot
def take_screenshot(id,fname):
    global image_counter
    log ('Taking screenshot')
    if fname == None:
        fname = id+'-image.png'
    fname = '{:03d}-'.format(image_counter)+fname
    driver.get_screenshot_as_file(testConfig['screenshot_dir']+'/'+fname)
    log ('Screenshot stored in '+fname)
    image_counter = image_counter + 1


# makes sure we can see the element to avoid out of view issues
def _goto_element(e):
    driver.execute_script("arguments[0].scrollIntoView();", e)

# waits for an element to load
# allows you to also specify if you want a screenshot after it comes in
def _wait_for_id(id=id,dur=30, save_screenshot=False, save_screenshot_file=None):
    log ('Waiting for '+id+'...')
    WebDriverWait(driver, dur).until(EC.presence_of_element_located((By.ID, id)))
    if save_screenshot:
        take_screenshot(id,save_screenshot_file)


def get_element_attributes(id=id, wait_dur=30, save_screenshot=False, save_screenshot_file=None):
    _wait_for_id(id=id, save_screenshot=save_screenshot, save_screenshot_file = save_screenshot_file)
    element = driver.find_element_by_id(id)
    return element

# handle ion-alerts. Only single button for now. May extend later if I need
def click_popup(save_screenshot=False, save_screenshot_file=None):
    log ('Waiting for popup...')
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CLASS_NAME, 'popup-buttons')))
    if save_screenshot:
        take_screenshot(None,'wizard-save-results.png')
    element = driver.find_element_by_class_name('popup-buttons')
    element = element.find_element_by_tag_name('button')
    element.click()


# handle ion-toggle
def tap_toggle(id, save_screenshot=False, save_screenshot_file=None):
    _wait_for_id(id=id, save_screenshot=save_screenshot, save_screenshot_file = save_screenshot_file)
    element = driver.find_element_by_id(id)
    _goto_element(element)
    element = element.find_element_by_tag_name('label')
    element.click()

# generates click event for any web element id
def click_item(id=id, save_screenshot=False, save_screenshot_file=None):
    _wait_for_id(id=id, save_screenshot=save_screenshot, save_screenshot_file = save_screenshot_file)
    element = driver.find_element_by_id(id)
    _goto_element(element)
    element.click()
    #sleep(wait)

# generated double click event for any web element id
def dbl_click_item(id=id, save_screenshot=False, save_screenshot_file=None):
    _wait_for_id(id=id, save_screenshot=save_screenshot, save_screenshot_file = save_screenshot_file)
    element = driver.find_element_by_id(id)
    actions = TouchActions(driver)
    actions.double_tap(element)
    actions.perform() 

# handles text input
def input_item(id=id,txt="you forgot to specify text", save_screenshot=False, save_screenshot_file=None):
    _wait_for_id(id=id, save_screenshot=save_screenshot, save_screenshot_file = save_screenshot_file)
    element = driver.find_element_by_id(id)
    _goto_element(element)
    element.send_keys(txt)
    driver.hide_keyboard()
    #sleep(wait)
