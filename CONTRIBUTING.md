## Contributing to zmNinja

### v1.6.009 and above
The license of zmNinja is GPLv3 and zmNinja appstore/playstore apps have been made free. The ZoneMinder devs have offered to take over zmNinja source, please contact them directly for any questions. It is their choice on what do
do with future app/play store releases and continue to offer it free or charge.
### v1.6.008 and below

The source code will always be available under CC BY-NC-SA 4.0. If you'd like to contribute please know that if your changes are accepted and merged they will make it to the App/Play Store when I publish the app. This does not entitle you to any remuneration - If you still would like to contribute and make this solution better, please go right ahead. If you feel this prohibits you from contributing, please create a bug report or enhancement request via the github issue tracker and I'll incorporate it when I have time/agree its a good idea.

Thanks.


## Steps for code contribution

It's best if you follow a proper process to contribute code - makes it easy for me to track/review. You will need `git` 

If you are familiar with doing Pull Requests, you can ignore detailed instructions below - just do the following:
* create a [github issue](https://github.com/pliablepixels/zmNinja/issues) in zmNinja describing your feature
* create a fork and create a local branch using the issue# created (Example 459-new-feature)
* Make your changes on that branch and push/PR

If you are not familiar with the Pull Request process, these steps explain further:

### Detailed instructions (for folks who are not familiar with Pull Requests)
#### One time 
* [Fork](https://guides.github.com/activities/forking/) zmNinja using the "Fork" button on the top right of the [zmNinja project](https://github.com/pliablepixels/zmNinja). This creates your own copy (or fork) of zmNinja on github:

* Now launch a command line and make a local copy of your fork
```
git clone https://github.com/<your github username>/zmNinja.git
```

* Now connect your copy to my repository (needed for future pushes)
```
git remote add upstream https://github.com/pliablepixels/zmNinja.git
```


#### Every time you want to contribute
* cd `<wherever you cloned my repo>/zmNinja`

* Make sure you have the latest version of my repo

```
git checkout master
git pull upstream master
```

* Let's suppose you want to add some "new-feature"

* Create an ISSUE on [zmNinja github issues](https://github.com/pliablepixels/zmNinja/issues)

* Note down the issue number (lets say its 1234)

* create a branch in your local git copy
```
git checkout -b 1234-new-feature (replace 1234 and new-feature)
```

You will now be in a new branch for you to develop the feature

* You can keep testing your changes. Make sure you commit often via `git add <files>` and `git commit -m "comments describing change" .`(you are committing to your local copy only here). 

* So far, you are committing changes to your local copy. To push it to your fork of zmNinja on github, do `git push origin 1234-new-feature` (replace 1234 and new-feature)

* Keep repeating above steps as many times as you want till the code is ready.	

* Once done, go to your github webpage and you will see a "create pull request" button in green. Review what you are doing a pull request for and click that button - I'll get an email you want me to review your changes





