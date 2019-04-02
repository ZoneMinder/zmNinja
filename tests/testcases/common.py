'''
Common functions used by test cases

'''

from time import sleep, strftime
import os
from selenium.webdriver.common.touch_actions import TouchActions
from appium.webdriver.common.touch_action import TouchAction



from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC


# global pointer to chrome driver
driver = None
platform = None
avd = 'zmNinja_8_0'
native_context = None
web_context = None

# keeps incrementing by 1 for screenshots saved
image_counter = 1

# global ZM portal data
testConfig = {
    'portal': None,
    'user': None,
    'password': None,
    'use_auth': False,
    'use_zm_auth': False,
    'use_basic_auth': False,
    'basic_user': None,
    'basic_password': None,
    'screenshot_dir': './screenshots'

}


def log(s):
    print(strftime("%H:%M:%S") + ": " + s)


# central function to save a screenshot
def take_screenshot(id, fname):
    global image_counter
    log('Taking screenshot')
    if fname == None:
        fname = id+'-image.png'
    fname = '{:03d}-'.format(image_counter)+fname
    driver.get_screenshot_as_file(testConfig['screenshot_dir']+'/'+fname)
    log('Screenshot stored in '+fname)
    image_counter = image_counter + 1

# generic element clicker, will try retry times
# because sometimes, async loaders interfere
def _click_with_retry(element, max_retry=3):
    retry_count = 1
    while retry_count <= max_retry:
        try:
            element.click()
        except Exception as e:
            log('click error, try #{}...'.format(retry_count))
            log (' Error reported was: '+str(e))
            retry_count = retry_count + 1
            sleep(2)
        else:
            retry_count = max_retry + 1
            pass


# makes sure we can see the element to avoid out of view issues
def _goto_element(e):
    driver.execute_script("arguments[0].scrollIntoView();", e)
    #driver.execute_script("mobile:scroll", {"direction": 'up', 'element': e})

# waits for an element to load
# allows you to also specify if you want a screenshot after it comes in


def _wait_for_id(id=id, dur=30, save_screenshot=False, save_screenshot_file=None):
    log('Waiting for '+id+'...')
    WebDriverWait(driver, dur).until(
        EC.presence_of_element_located((By.ID, id)))
    # angular refresh?
    sleep(0.2)
    if save_screenshot:
        take_screenshot(id, save_screenshot_file)



# element properties
def get_element_attributes(id=id, save_screenshot=False, save_screenshot_file=None):
    _wait_for_id(id=id, save_screenshot=save_screenshot,
                 save_screenshot_file=save_screenshot_file)
    element = driver.find_element_by_id(id)
    return element

# handle ion-alerts. Only single button for now. May extend later if I need

# clicks an ionic popup with button matching provided text
def click_popup(txt='ok', save_screenshot=False, save_screenshot_file=None):
    log('Waiting for popup...')
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'popup-buttons')))
    if save_screenshot:
        if not save_screenshot_file:
            save_screenshot_file = 'popup-results.png'
        take_screenshot(None, save_screenshot_file)
    buttons = driver.find_element_by_class_name('popup-buttons')
    buttons = buttons.find_elements_by_tag_name('button')
    for element in buttons:
        if element.text.lower() == txt:
            log('click_popup: clicking '+element.text)
            _click_with_retry(element)

        else:
            log('click_popup: skipping '+element.text)


# handle ion-toggle
def tap_toggle(id, save_screenshot=False, save_screenshot_file=None):
    _wait_for_id(id=id, save_screenshot=save_screenshot,
                 save_screenshot_file=save_screenshot_file)
    element = driver.find_element_by_id(id)
    _goto_element(element)
    element = element.find_element_by_tag_name('label')
    _click_with_retry(element)


# generates click event for any web element id
def click_item(id=id, save_screenshot=False, save_screenshot_file=None, retry=3):
    _wait_for_id(id=id, save_screenshot=save_screenshot,
                 save_screenshot_file=save_screenshot_file)
    element = driver.find_element_by_id(id)
    _goto_element(element)
    _click_with_retry(element, retry)


def click_item_js(id=id, save_screenshot=False, save_screenshot_file=None):
    _wait_for_id(id=id, save_screenshot=save_screenshot,
                 save_screenshot_file=save_screenshot_file)
    element = driver.find_element_by_id(id)
    log ("clicking {} using JS".format(id))
    driver.execute_script("arguments[0].click()", element)
    # sleep(wait)

# returns text value of loader
def get_loading_text(save_screenshot=False, save_screenshot_file=None):
    log('Waiting for loading...')
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, 'loading')))
    if save_screenshot:
        take_screenshot(None, 'loading-results.png')
    element = driver.find_element_by_class_name('loading')
    return element.text

# waits for a loader to have a value specified in text_options list
def wait_for_loading_text(save_screenshot=False, save_screenshot_file=None, text_options=[]):
    log('waiting for loading text to be {}'.format(text_options))

    text_options = [element.lower() for element in text_options]
    while True:
        res = get_loading_text().lower()
        if res in text_options:
            log(res+' matched, exiting wait_for_loading_text')
            if save_screenshot:
                take_screenshot(None, save_screenshot_file)
            break
        else:
            log('wait_for_loading_text: got {}, waiting...'.format(res))
            sleep(0.5)


# generic function to double tap on any item
def dbl_click_item(id=id, save_screenshot=False, save_screenshot_file=None, max_retry=3):
    _wait_for_id(id=id, save_screenshot=save_screenshot,
                 save_screenshot_file=save_screenshot_file)
    element = driver.find_element_by_id(id)

  

    if platform == 'android':
        actions = TouchActions(driver)
        actions.double_tap(element)

    retry_count = 1
    while retry_count <= max_retry:
        try:
            if platform == 'ios':
                # Fix TBD
                log ('Hacky iOS double tap to a fixed location')
                driver.execute_script('mobile: doubleTap', {'x':200, 'y':200})
            else:
                actions.perform()
        except Exception as e:
            log('action error, try #{}...'.format(retry_count))
            log ('Error reported was: '+str(e))
            retry_count = retry_count + 1
            sleep(2)
        else:
            retry_count = max_retry + 1
            pass


# handles text input
def input_item(id=id, txt="you forgot to specify text", save_screenshot=False, save_screenshot_file=None):
    _wait_for_id(id=id, save_screenshot=save_screenshot,
                 save_screenshot_file=save_screenshot_file)
    element = driver.find_element_by_id(id)
    _goto_element(element)
    element.clear()
    element.send_keys(txt)
    '''
    if platform == 'ios':
        sleep(1)
        driver.execute_script('mobile: tap', {'x':100, 'y':20})
        sleep(1)
    else:
        driver.hide_keyboard()
    #driver.hide_keyboard(key_name='Done')
    '''
    sleep(1)
    # sleep(wait)
