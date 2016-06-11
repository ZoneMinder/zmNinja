####Main Language file
* Make sure there is no comma after the last element
* Comments are not allowed
* Make sure you don't add ellipsis "..." anywhere, they are added to messages in code when needed
* After you complete the translation file, do the following:

(replace ``-it`` with the language you are working on)

``
./checklang.py -f locale-it.json -b
``

This validates your JSON file, makes sure all keys are in sync with -en and if valid, creates pretty-locale-it.json. If you are sure it looks good,

``
./checklang.py -f locale-it.json -b -o
``

This validates your JSON file,makes sure all keys are in sync with -en  and if valid, OVERWRITES your local file with a pretty formatted version, which is what you should PR


####Translating Help language file
* Located inside lang/help
* Please be careful not to mess up the html tags, please only focus on text translation


