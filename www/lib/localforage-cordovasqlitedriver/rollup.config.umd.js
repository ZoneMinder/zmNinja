import config from './rollup.config';

config.format = 'umd';
config.dest = 'dist/localforage-cordovasqlitedriver.js';
config.moduleName = 'cordovaSQLiteDriver';

export default config;
