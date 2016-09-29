module.exports = {
  files: [
    'bower_components/angular/angular.js',
    'bower_components/angular-animate/angular-animate.js',
    'bower_components/angular-sanitize/angular-sanitize.js',
    'bower_components/angular-ui-router/release/angular-ui-router.js',
    'bower_components/ionic/release/js/ionic.js',
    'bower_components/ionic/release/js/ionic-angular.js',
    'bower_components/angular-mocks/angular-mocks.js',
    'js/ionic.scroll.sista.js'
  ],

  frameworks: ['jasmine'],
  reporters: ['progress'],
  port: 9876,
  colors: true,
  // possible values: 'OFF', 'ERROR', 'WARN', 'INFO', 'DEBUG'
  logLevel: 'INFO',
  autoWatch: true,
  captureTimeout: 60000,
  singleRun: false,

  // Start these browsers, currently available:
  // - Chrome
  // - ChromeCanary
  // - Firefox
  // - Opera (has to be installed with `npm install karma-opera-launcher`)
  // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
  // - PhantomJS
  // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
  browsers: ['PhantomJS']
};