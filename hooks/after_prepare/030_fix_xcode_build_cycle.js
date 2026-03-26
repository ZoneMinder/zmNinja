#!/usr/bin/env node

// Fix Xcode build cycle caused by script phases (Crashlytics, etc.)
// ordering before the "Embed App Extensions" copy-files phase.
//
// Runs after_prepare so all plugins have already added their build phases.
// Moves all PBXShellScriptBuildPhase entries to the end of each native
// target's buildPhases array, breaking the cycle:
//   copy appex → script phase → dSYM → Info.plist → copy appex

var fs = require('fs');
var path = require('path');

module.exports = function (ctx) {
  if (ctx.opts.platforms.indexOf('ios') === -1) return;

  var xcode;
  try {
    xcode = ctx.requireCordovaModule('xcode');
  } catch (e) {
    xcode = require('xcode');
  }

  var iosPath = path.join(ctx.opts.projectRoot, 'platforms', 'ios');
  var projDir = fs.readdirSync(iosPath).find(function (f) {
    return f.endsWith('.xcodeproj');
  });
  if (!projDir) {
    console.log('030_fix_xcode_build_cycle: No .xcodeproj found, skipping');
    return;
  }

  var projPath = path.join(iosPath, projDir, 'project.pbxproj');
  var proj = xcode.project(projPath);
  proj.parseSync();

  var shellScriptPhases = proj.hash.project.objects['PBXShellScriptBuildPhase'] || {};
  var nativeTargets = proj.hash.project.objects['PBXNativeTarget'] || {};
  var changed = false;

  Object.keys(nativeTargets).forEach(function (key) {
    var nt = nativeTargets[key];
    if (!nt || !nt.buildPhases || !Array.isArray(nt.buildPhases)) return;

    var phases = nt.buildPhases;
    var scriptIndices = [];
    var scripts = [];

    phases.forEach(function (p, idx) {
      if (p && p.value && shellScriptPhases[p.value]) {
        scriptIndices.push(idx);
        scripts.push(p);
      }
    });

    if (scripts.length === 0) return;

    // Check if scripts are already at the end
    var lastNonScript = -1;
    phases.forEach(function (p, idx) {
      if (!p || !p.value || !shellScriptPhases[p.value]) {
        lastNonScript = idx;
      }
    });
    if (scriptIndices.length > 0 && scriptIndices[0] > lastNonScript) return;

    // Remove from current positions (reverse order to preserve indices)
    for (var i = scriptIndices.length - 1; i >= 0; i--) {
      phases.splice(scriptIndices[i], 1);
    }
    // Append at end
    scripts.forEach(function (p) { phases.push(p); });
    changed = true;

    var name = nt.name || nt.productName || key;
    console.log('030_fix_xcode_build_cycle: Moved ' + scripts.length +
      ' script phase(s) to end of ' + name);
  });

  if (changed) {
    fs.writeFileSync(projPath, proj.writeSync());
    console.log('030_fix_xcode_build_cycle: Project file updated');
  } else {
    console.log('030_fix_xcode_build_cycle: No reordering needed');
  }
};
