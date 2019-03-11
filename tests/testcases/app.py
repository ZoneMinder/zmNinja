'''
App level functions for view interaction
'''



import common as c


# tap global menu directly by invoking its controller JS
# seems reliable
def tap_menu_js():
    c.log ('Tapping menu')
    c.driver.execute_script("angular.element(document.getElementById('testaut-menu-controller')).scope().openMenu();")


# bah, in some cases this won't work, when the menu is open,
# there are two left items
# so I'm probably not going to use this
def tap_menu():
    c.log ('Tapping menu')
    element = c.driver.find_element_by_id('testaut_app_menu')
    element = element.find_element_by_class_name('left-buttons')
    element = element.find_element_by_tag_name('button')
    element.click()

