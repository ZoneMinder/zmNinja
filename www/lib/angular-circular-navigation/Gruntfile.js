'use strict';

module.exports = function (grunt) {

   // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // default task
  grunt.registerTask('default', ['jshint', 'karma:unit']);
  grunt.registerTask('watch', ['karma:watch']);
  grunt.registerTask('coverage', ['karma:coverage', 'coveralls']);


  // perform test in Firefox on travis ci
  var testConfig = function(configFile, customOptions) {
    var options = { configFile: configFile, keepalive: true };
    var travisOptions = process.env.TRAVIS && { browsers: ['Firefox'] };
    return grunt.util._.extend(options, customOptions, travisOptions);
  };

  grunt.initConfig({

    // Compiles Sass to CSS and generates necessary files if requested
    compass: {
      dist: {
        options: {
          sassDir: 'scss',
          cssDir: '.',
          // environment: 'production'
        }
      }
    },

    karma: {
      unit: {
        options: testConfig('test/karma.conf.js')
      },
      watch: {
        options: testConfig('test/karma.conf.js'),
        singleRun: false,
        autoWatch: true
      },
      coverage: {
        options: testConfig('test/karma.conf.js'),
        reporters: ['coverage']
      }
    },

    coveralls: {
      options: {
        debug: true,
        coverage_dir: 'coverage'
      }
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: 'Gruntfile.js',
      angularChart: 'angular-circular-navigation.js',
      test: 'test/*.js',
      // demo: 'demo/*.js'
    }

  });

};
