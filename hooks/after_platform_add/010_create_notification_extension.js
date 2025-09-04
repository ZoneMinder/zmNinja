#!/usr/bin/env node
//
//Add xcode notification service extension automatically
//

const fs = require('fs');
const xcode = require('xcode');


module.exports = function(context) {
  console.log('Starting hook to add notification extension to project');

  const cordovaCommon = context.requireCordovaModule('cordova-common');
  const appConfig = new cordovaCommon.ConfigParser('config.xml');
  const appName = appConfig.name();

  const iosPath = 'platforms/ios/';
  const projPath = `${iosPath}${appName}.xcodeproj/project.pbxproj`;
  const extName = 'zmNinjaNotification';
  const extFiles = [
    'NotificationService.h',
    'NotificationService.m',
    `${extName}-Info.plist`,
  ];
  // The directory where the source extension files are stored
  const sourceDir = `etc/extensions/${extName}/`;

  // Wait a few seconds before parsing the project to let some other
  // asynchronous project file changes complete. Maybe there is a way to get
  // a promise?
  console.log('Waiting a few seconds for other project file changes to finish');
  setTimeout(function () {
    console.log(`Adding ${extName} notification extension to ${appName}`);
    let proj = xcode.project(projPath);
    proj.parse(function (err) {
      if (err) {
        console.log(`Error parsing iOS project: ${err}`);
      }
      // Copy in the extension files
      console.log('Copying in the extension files to the iOS project');
      try { fs.mkdirSync(`${iosPath}${extName}`, {recursive: true}); } catch (e) {}
      extFiles.forEach(function (extFile) {
        let targetFile = `${iosPath}${extName}/${extFile}`;
        fs.createReadStream(`${sourceDir}${extFile}`)
          .pipe(fs.createWriteStream(targetFile));
      });
      // Create new PBXGroup for the extension
      console.log('Creating new PBXGroup for the extension');
      let extGroup = proj.addPbxGroup(extFiles, extName, extName);
      // Add the new PBXGroup to the CustomTemplate group. This makes the
      // files appear in the file explorer in Xcode.
      console.log('Adding new PBXGroup to CustomTemplate PBXGroup');
      let groups = proj.hash.project.objects['PBXGroup'];
      Object.keys(groups).forEach(function (key) {
        if (groups[key].name === 'CustomTemplate') {
          proj.addToPbxGroup(extGroup.uuid, key);
        }
      });
      // Add a target for the extension
      console.log('Adding the new target');
      let target = proj.addTarget(extName, 'app_extension');


      // Get app bundle id from <widget id="..."> in config.xml
      const bundleId = appConfig.packageName();
      const desiredExtBundleId = `${bundleId}.${extName}`;
      const marketing = appConfig.version();

      // Point the target at the copied plist and set the bundle id
      const cfgs = proj.pbxXCBuildConfigurationSection();
      Object.keys(cfgs).forEach(ref => {
        const cfg = cfgs[ref];
        if (!cfg || !cfg.buildSettings) return;

        // Only touch the new extension target’s configs
        if (cfg.buildSettings.PRODUCT_NAME === `"${extName}"`) {
          cfg.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = desiredExtBundleId;
          cfg.buildSettings.INFOPLIST_FILE = `"${extName}/${extName}-Info.plist"`;
          cfg.buildSettings.DEVELOPMENT_TEAM = 'P97TSUFFDX';

          // sensible defaults for extensions
          cfg.buildSettings.SDKROOT = 'iphoneos';
          cfg.buildSettings.SKIP_INSTALL = 'YES';
          cfg.buildSettings.LD_RUNPATH_SEARCH_PATHS = `"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"`;
          cfg.buildSettings.MARKETING_VERSION = marketing;           // CFBundleShortVersionString
          cfg.buildSettings.CURRENT_PROJECT_VERSION = marketing;     // CFBundleVersion
        }
      });

      // Add build phases to the new target
      console.log('Adding build phases to the new target');
      proj.addBuildPhase([ 'NotificationService.m' ], 'PBXSourcesBuildPhase', 'Sources', target.uuid);
      proj.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
      proj.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', target.uuid);
      console.log('Write the changes to the iOS project file');
      fs.writeFileSync(projPath, proj.writeSync());
      console.log(`Added ${extName} notification extension to project`);
    });
  }, 3000);
};
