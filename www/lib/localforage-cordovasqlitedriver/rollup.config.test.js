import babel from 'rollup-plugin-babel';
import multiEntry from 'rollup-plugin-multi-entry';

export default {
  entry: 'test/**/*_test.js',
  plugins: [babel(), multiEntry()],
  format: 'cjs',
  intro: 'require("source-map-support").install();',
  dest: 'build/test-bundle.js',
  sourceMap: true
};
