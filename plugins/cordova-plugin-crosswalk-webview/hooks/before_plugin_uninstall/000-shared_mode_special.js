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
    var xwalkVariables = ['xwalkVersion', 'xwalkCommandLine', 'xwalkMode'];
        androidPlatformDir = path.join(context.opts.projectRoot,
            'platforms', 'android'),
        projectConfigurationFile = path.join(context.opts.projectRoot,
            'config.xml'),
        projectManifestFile = path.join(androidPlatformDir,
            'AndroidManifest.xml');

    /** Init */
    var CordovaConfig = new ConfigParser(projectConfigurationFile);

    var removePermission = function() {
        var projectManifestXmlRoot = XmlHelpers.parseElementtreeSync(projectManifestFile);
        var child = et.XML('<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />');
        XmlHelpers.pruneXML(projectManifestXmlRoot, [child], '/manifest');
        fs.writeFileSync(projectManifestFile, projectManifestXmlRoot.write({indent: 4}), 'utf-8');
    }

    var removeXWalkVariables = function() {
        var configXmlRoot = XmlHelpers.parseElementtreeSync(projectConfigurationFile);
        for (var index = 0; index < xwalkVariables.length; index++) {
            var child = configXmlRoot.find('./preference[@name="' + xwalkVariables[index] + '"]');
            if (child) {
                XmlHelpers.pruneXML(configXmlRoot, [child], '/*');
            }
        }
        fs.writeFileSync(projectConfigurationFile, configXmlRoot.write({indent: 4}), 'utf-8');
    }

    /** Main method */
    var main = function() {
        // Remove the xwalk variables
        removeXWalkVariables();

        if (CordovaConfig.getGlobalPreference('xwalkMode') == 'shared') {
            // Add the permission of write_external_storage in shared mode
            removePermission();
        }

        deferral.resolve();
    };

    main();

    return deferral.promise;

};
