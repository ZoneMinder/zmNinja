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
          cfg.buildSettings.DEVELOPMENT_TEAM = process.env.DEVELOPMENT_TEAM || 'P97TSUFFDX';

          // sensible defaults for extensions
          cfg.buildSettings.SDKROOT = 'iphoneos';
          cfg.buildSettings.SKIP_INSTALL = 'YES';
          cfg.buildSettings.LD_RUNPATH_SEARCH_PATHS = `"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"`;
          cfg.buildSettings.MARKETING_VERSION = marketing;           // CFBundleShortVersionString
          cfg.buildSettings.CURRENT_PROJECT_VERSION = marketing;     // CFBundleVersion
          cfg.buildSettings.ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES = 'NO';
        }
      });

      // Ensure all targets meet minimum deployment target (Xcode 16+ requires >= 12.0)
      const minDeployTarget = appConfig.getPreference('deployment-target', 'ios') || '15.0';
      console.log(`Setting minimum IPHONEOS_DEPLOYMENT_TARGET to ${minDeployTarget} for all configs`);
      Object.keys(cfgs).forEach(ref => {
        const cfg = cfgs[ref];
        if (!cfg || !cfg.buildSettings) return;
        const cur = cfg.buildSettings.IPHONEOS_DEPLOYMENT_TARGET;
        if (cur) {
          const curNum = parseFloat(cur.replace(/"/g, ''));
          const minNum = parseFloat(minDeployTarget);
          if (curNum < minNum) {
            cfg.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = minDeployTarget;
          }
        }
      });

      // Add build phases to the new target
      console.log('Adding build phases to the new target');
      proj.addBuildPhase([ 'NotificationService.m' ], 'PBXSourcesBuildPhase', 'Sources', target.uuid);
      proj.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);
      proj.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', target.uuid);

      // Fix "run script output dependency" warnings by marking shell script
      // build phases with alwaysOutOfDate = 1 so Xcode doesn't warn about
      // missing output files
      console.log('Fixing script phase dependency warnings');
      let shellScriptPhases = proj.hash.project.objects['PBXShellScriptBuildPhase'];
      if (shellScriptPhases) {
        Object.keys(shellScriptPhases).forEach(key => {
          let phase = shellScriptPhases[key];
          if (phase && typeof phase === 'object' && phase.isa === 'PBXShellScriptBuildPhase') {
            phase.alwaysOutOfDate = 1;
          }
        });
      }

      // Fix build cycle: move script phases (Crashlytics, etc.) to the end
      // of the main target's build phases so they run after "Embed App
      // Extensions" (the copy-files phase for the appex). Without this,
      // Xcode sees: copy appex → Crashlytics → dSYM → copy appex = cycle.
      console.log('Reordering build phases to break dependency cycle');
      let nativeTargets = proj.hash.project.objects['PBXNativeTarget'];
      Object.keys(nativeTargets).forEach(key => {
        let nt = nativeTargets[key];
        if (!nt || !nt.buildPhases || nt.name !== `"${appName}"`) return;
        let phases = nt.buildPhases;
        let scriptPhaseIndices = [];
        let scriptPhases = [];
        phases.forEach((p, idx) => {
          // Check if this phase ref is a shell script phase
          if (shellScriptPhases && shellScriptPhases[p.value]) {
            scriptPhaseIndices.push(idx);
            scriptPhases.push(p);
          }
        });
        // Remove script phases from their current position and append at end
        for (let i = scriptPhaseIndices.length - 1; i >= 0; i--) {
          phases.splice(scriptPhaseIndices[i], 1);
        }
        scriptPhases.forEach(p => phases.push(p));
      });

      console.log('Write the changes to the iOS project file');
      fs.writeFileSync(projPath, proj.writeSync());
      console.log(`Added ${extName} notification extension to project`);

      // Patch CordovaLib deployment target (separate xcodeproj)
      const cordovaLibProjPath = `${iosPath}CordovaLib/CordovaLib.xcodeproj/project.pbxproj`;
      if (fs.existsSync(cordovaLibProjPath)) {
        console.log(`Patching CordovaLib deployment target to ${minDeployTarget}`);
        let cordovaProj = xcode.project(cordovaLibProjPath);
        cordovaProj.parse(function (libErr) {
          if (libErr) {
            console.log(`Error parsing CordovaLib project: ${libErr}`);
            return;
          }
          const libCfgs = cordovaProj.pbxXCBuildConfigurationSection();
          Object.keys(libCfgs).forEach(ref => {
            const cfg = libCfgs[ref];
            if (!cfg || !cfg.buildSettings) return;
            const cur = cfg.buildSettings.IPHONEOS_DEPLOYMENT_TARGET;
            if (cur) {
              const curNum = parseFloat(cur.replace(/"/g, ''));
              const minNum = parseFloat(minDeployTarget);
              if (curNum < minNum) {
                cfg.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = minDeployTarget;
              }
            }
          });
          fs.writeFileSync(cordovaLibProjPath, cordovaProj.writeSync());
          console.log('CordovaLib deployment target patched');
        });
      }
    });
  }, 3000);
};
