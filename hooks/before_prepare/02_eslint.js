#!/usr/bin/env node

var childProcess = require('child_process');
var path = require('path');

var projectRoot = path.resolve(__dirname, '..', '..');
var eslintBin = path.join(projectRoot, 'node_modules', '.bin', 'eslint');

console.log('Linting www/js/ with ESLint...');

try {
    childProcess.execSync(
        eslintBin + ' www/js/',
        { cwd: projectRoot, stdio: 'inherit' }
    );
    console.log('ESLint: no errors found.');
} catch (e) {
    console.error('ESLint found errors. Build aborted.');
    process.exit(1);
}
