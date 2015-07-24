/*global module, require*/
(function setUp(module, require) {
  'use strict';

  var banner = ['/*!',
      ' * Angular Tooltips v<%= pkg.version %>',
      ' *',
      ' * Released under the MIT license',
      ' * www.opensource.org/licenses/MIT',
      ' *',
      ' * Brought to you by 720kb.net',
      ' *',
      ' * <%= grunt.template.today("yyyy-mm-dd") %>',
      ' */\n\n'].join('\n')
    , modRewrite = require('connect-modrewrite');

  module.exports = function doGrunt(grunt) {

    grunt.initConfig({
      'pkg': grunt.file.readJSON('package.json'),
      'confs': {
        'dist': 'dist',
        'config': 'config',
        'css': 'src/css',
        'js': 'src/js',
        'serverPort': 8000
      },
      'csslint': {
        'options': {
          'csslintrc': '<%= confs.config %>/csslintrc.json'
        },
        'strict': {
          'src': [
            '<%= confs.css %>/**/*.css'
          ]
        }
      },
      'eslint': {
        'options': {
          'config': '<%= confs.config %>/eslint.json'
        },
        'target': [
          'Gruntfile.js',
          '<%= confs.js %>/**/*.js'
        ]
      },
      'uglify': {
        'options': {
          'sourceMap': true,
          'sourceMapName': '<%= confs.dist %>/angular-tooltips.sourcemap.map',
          'preserveComments': false,
          'report': 'gzip',
          'banner': banner
        },
        'minifyTarget': {
          'files': {
            '<%= confs.dist %>/angular-tooltips.min.js': [
              '<%= confs.js %>/angular-tooltips.js'
            ]
          }
        }
      },
      'cssmin': {
        'options': {
          'report': 'gzip',
          'banner': banner
        },
        'minifyTarget': {
          'files': {
            '<%= confs.dist %>/angular-tooltips.min.css': [
              '<%= confs.css %>/angular-tooltips.css'
            ]
          }
        }
      },
      'connect': {
        'server': {
          'options': {
            'port': '<%= confs.serverPort %>',
            'base': '.',
            'keepalive': true,
            'middleware': function manageMiddlewares(connect, options) {
              var middlewares = []
                , directory = options.directory || options.base[options.base.length - 1];

              // enable Angular's HTML5 mode
              middlewares.push(modRewrite(['!\\.html|\\.js|\\.svg|\\.css|\\.png|\\.gif$ /index.html [L]']));

              if (!Array.isArray(options.base)) {
                options.base = [options.base];
              }
              options.base.forEach(function forEachOption(base) {
                // Serve static files.
                middlewares.push(connect.static(base));
              });

              // Make directory browse-able.
              middlewares.push(connect.directory(directory));

              return middlewares;
            }
          }
        }
      },
      'watch': {
        'dev': {
          'files': [
            'Gruntfile.js',
            '<%= confs.css %>/**/*.css',
            '<%= confs.js %>/**/*.js'
          ],
          'tasks': [
            'csslint',
            'eslint'
          ],
          'options': {
            'spawn': false
          }
        }
      },
      'concurrent': {
        'dev': {
          'tasks': [
            'connect:server',
            'watch:dev'
          ],
          'options': {
            'limit': '<%= concurrent.dev.tasks.length %>',
            'logConcurrentOutput': true
          }
        }
      }
    });

    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', [
      'csslint',
      'eslint',
      'concurrent:dev'
    ]);

    grunt.registerTask('prod', [
      'csslint',
      'eslint',
      'cssmin',
      'uglify'
    ]);
  };
}(module, require));
