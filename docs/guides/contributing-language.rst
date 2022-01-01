Contributing a new language
---------------------------

If you are familiar with using git, I'd prefer if you follow the Pull
Request process
`here <https://github.com/zoneminder/zmninja/blob/master/CONTRIBUTING.md#steps-for-code-contribution>`__.

Adding a new language
^^^^^^^^^^^^^^^^^^^^^

-  Languages translations are available
   `here <https://github.com/zoneminder/zmninja/tree/master/www/lang>`__
-  To contribute a new language, add a new ``locale-xx.json`` (where
   ``xx`` is your language code).
-  Ideally, you should also provide a language translation for the
   zmNinja help file inside
   `lang/help <https://github.com/zoneminder/zmninja/tree/master/www/lang/help>`__

The best way is to simply look at an existing language translation and
follow the same model for yours. If any language translation keywords
are missed, it will fallback to English.

Main Language file
^^^^^^^^^^^^^^^^^^

-  Make sure there is no comma after the last element
-  Comments are not allowed
-  Make sure you don't add ellipsis "..." anywhere, they are added to
   messages in code when needed
-  After you complete the translation file, do the following:

(replace ``-it`` with the language you are working on)

``python ./checklang.py -f locale-it.json -b``

This validates your JSON file, makes sure all keys are in sync with -en
and if valid, creates pretty-locale-it.json. If you are sure it looks
good,

``python ./checklang.py -f locale-it.json -b -o``

This validates your JSON file,makes sure all keys are in sync with -en
and if valid, OVERWRITES your local file with a pretty formatted
version, which is what you should PR

Translating Help language file
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

-  Located inside lang/help
-  Please be careful not to mess up the html tags, please only focus on
   text translation

How to recognize a new language:
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

(This is only for zmNinja developers. Not relevant for language
translators) 

- Modify languages array in NVR.js (look for ``var languages``) 
- Register language glob code in app.js - make sure its added to array list and mapping (look for ``registerAvailableLanguageKeys``)
