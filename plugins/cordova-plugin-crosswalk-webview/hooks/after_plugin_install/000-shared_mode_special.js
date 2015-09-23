#!/usr/bin/env node

module.exports = function(context) {

    /** @external */
    var fs = context.requireCordovaModule('fs'),
        path = context.requireCordovaModule('path'),
        deferral = context.requireCordovaModule('q').defer(),
        ConfigParser = context.requireCordovaModule("cordova-lib/src/configparser/ConfigParser"),
        XmlHelpers = context.requireCordovaModule("cordova-lib/src/util/xml-helpers"),
        et = context.requireCordovaModule('elementtree');

    /** @defaults */
    var xwalkVariables = {'xwalkVersion':'14+', 'xwalkCommandLine':'--disable-pull-to-refresh-effect',
            'xwalkMode':'embedded'},
        argumentsString = context.cmdLine,
        androidPlatformDir = path.join(context.opts.projectRoot,
            'platforms', 'android'),
        projectConfigurationFile = path.join(context.opts.projectRoot,
            'config.xml'),
        projectManifestFile = path.join(androidPlatformDir,
            'AndroidManifest.xml'),
        platformJsonFile = path.join(context.opts.projectRoot,
            'plugins', 'android.json');

    /** Init */
    var CordovaConfig = new ConfigParser(projectConfigurationFile);

    var addPermission = function() {
        var projectManifestXmlRoot = XmlHelpers.parseElementtreeSync(projectManifestFile);
        var child = et.XML('<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />');
        XmlHelpers.graftXML(projectManifestXmlRoot, [child], '/manifest');
        fs.writeFileSync(projectManifestFile, projectManifestXmlRoot.write({indent: 4}), 'utf-8');
    }

    /** Set preference */
    var addPreferences = function() {
        var configXmlRoot = XmlHelpers.parseElementtreeSync(projectConfigurationFile);
        for (name in xwalkVariables) {
            var child = et.XML('<preference name="' + name + '" value="' + xwalkVariables[name] + '" />');
            XmlHelpers.graftXML(configXmlRoot, [child], '/*');
        }
        fs.writeFileSync(projectConfigurationFile, configXmlRoot.write({indent: 4}), 'utf-8');
    }

    /** The style of name align with config.xml */
    var setConfigPreference = function(name, value) {
        var localName = null;
        if (name == 'XWALK_VERSION') {
            localName = 'xwalkVersion';
        } else if (name == 'XWALK_COMMANDLINE') {
            localName = 'xwalkCommandLine';
        } else if (name == 'XWALK_MODE') {
            localName = 'xwalkMode';
        }

        if (localName) {
            xwalkVariables[localName] = value;
        }
    }

    /** Pase the cli command to get the specific preferece*/
    var parseCliPreference = function() {
        var commandlineVariablesList = argumentsString.split('variable');
        if (commandlineVariablesList) {
            commandlineVariablesList.forEach(function(element) {
                var spaceList = element.split(' ');
                if (spaceList) {
                    spaceList.forEach(function(element) {
                        var preference = element.split('=');
                        if (preference && preference.length == 2) {
                            setConfigPreference(preference[0].toUpperCase(), preference[1]);
                        }
                    });
                }
            });
        }
    }

    /** Main method */
    var main = function() {
        // Parse cli preference
        parseCliPreference();

        // Add xwalk preference to config.xml
        addPreferences();

        if (xwalkVariables['xwalkMode'] == 'shared') {
            // Add the permission of write_external_storage in shared mode
            addPermission();
        }

        deferral.resolve();
    };

    main();

    return deferral.promise;

};
