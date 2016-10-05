/** DCE dce-paella-opencast-extenstions */
/* v0.0.01 to build upv via this repo
 */
var path = require('path');

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
    clean: {
      options: {
        force: true
      },
      build:[ "build"]
    },
    
    copy: {
      paella: {
        files:[
        // Basic Paella
        {
          expand: true, dot: true, cwd: 'node_modules/PaellaPlayer', src:[ '**'], dest: 'build/paella'
        },
        // Paella Opencast
        {
          expand: true, cwd: 'paella-opencast/plugins', src:[ '**'], dest: 'build/paella/plugins'
        },
        // DCE temp Paella override fix for https://github.com/polimediaupv/paella/issues/219
        {
          expand: true, dot: true, cwd: 'vendor/paella_overrides/plugins', src:[ '**'], dest: 'build/paella/plugins'
        }, {
          expand: true, dot: true, cwd: 'vendor/paella_overrides/src', src:[ '**'], dest: 'build/paella/src'
        }]
      },
      "dce-paella-extensions": {
        files:[
        // DCE Paella Plugins
        {
          expand: true, dot: true, cwd: 'node_modules/dce-paella-extensions/vendor/plugins', src:[ '**'], dest: 'build/paella/plugins'
        }, {
          expand: true, dot: true, cwd: 'node_modules/dce-paella-extensions/resources/images', src:[ 'paella_icons_light_dce.png'], dest: 'build/paella/resources/images/'
        }, {
          expand: true, dot: true, cwd: 'node_modules/dce-paella-extensions/vendor/skins', src:[ '**'], dest: 'build/paella/resources/style/skins'
        }, {
          expand: true, dot: true, cwd: 'node_modules/dce-paella-extensions/resources/style', src:[ 'overrides.less'], dest: 'build/paella/resources/style'
        }]
      },
      "paella-opencast": {
        files:[
        // Basic Paella
        {
          expand: true, cwd: 'build/paella/build/player', src:[ '**', '!paella-standalone.js'], dest: 'build/paella-opencast'
        },
        {
          expand: true, cwd: 'paella-opencast/ui', src:[ '**'], dest: 'build/paella-opencast'
        }]
      },
      "dce-paella-opencast": {
        files:[
        // DCE Config (from dce-paella-extensions)
        {
          expand: true, dot: true, cwd: 'node_modules/dce-paella-extensions/config', src:[ '**'], dest: 'build/paella-opencast/config'
        },
        {
          expand: true, dot: true, cwd: 'vendor/mh_dce_resources', src:[ '**'], dest: 'build/paella-opencast/mh_dce_resources'
        }]
      }
    },
    
    subgrunt: {
      "build.debug": {
        projects: {
          'build/paella': 'build.debug'
        }
      },
      checksyntax: {
        projects: {
          'build/paella': 'checksyntax'
        }
      }
    },
    jshint: {
      options: {
        jshintrc: 'node_modules/PaellaPlayer/.jshintrc'
      },
      dist:[
      'paella-opencast/javascript/*.js',
      'paella-opencast/plugins/*/*.js']
    },
    browserify: {
      dist: {
        files: {
          'build/paella-opencast/javascript/app-index.js':[ 'app-src/index.js']
        }
      }
    },
    concat: {
      options: {
        separator: '\n',
        process: function (src, filepath) {
          return '/*** File: ' + filepath + ' ***/\n' + src;
        }
      },
      'less': {
        src:[
        'node_modules/dce-paella-extensions/vendor/skins/cs50.less',
        'node_modules/dce-paella-extensions/resources/style/overrides.less'],
        dest: 'build/temp/opencast_cs50.less'
      }
    },
    less: {
      development: {
        options: {
          paths:[ "css"]
        },
        modifyVars: {
          titleColor: '#AAAAFF'
        },
        files: {
          "build/paella-opencast/resources/style/opencast_cs50.css": "build/temp/opencast_cs50.less"
        }
      },
      production: {
        options: {
          paths:[ "css"]
        },
        modifyVars: {
          titleColor: '#FF0000'
        },
        files: {
          "build/paella-opencast/resources/style/opencast_cs50.css": "build/temp/opencast_cs50.less"
        }
      }
    },
    watch: {
      debug: {
        files:[
        'paella-opencast/ui/**',
        'paella-opencast/javascript/*.js',
        'paella-opencast/plugins/**'],
        tasks:[ 'build']
      }
    },
    express: {
      dist: {
        options: {
          port: 3000,
          server: path.resolve('./server')
        }
      }
    }
  });
  
  grunt.loadNpmTasks('grunt-subgrunt');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-express');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-browserify');
  
  grunt.registerTask('default',[ 'build']);
  
  grunt.registerTask('prepare',[ 'copy:paella', 'copy:dce-paella-extensions']);
  grunt.registerTask('dce-post-tasks',[ 'copy:dce-paella-opencast', 'build_dce_css', 'dce-browserify']);
  grunt.registerTask('build_dce_css',[ 'concat:less', 'less:production']);
  grunt.registerTask('dce-browserify',[ 'browserify']);
  
  grunt.registerTask('checksyntax',[ 'prepare', 'jshint', 'subgrunt:checksyntax']);
  grunt.registerTask('build',[ 'prepare', 'subgrunt:build.debug', 'copy:paella-opencast', 'dce-post-tasks']);
  
  
  grunt.registerTask('server',[ 'build', 'express', 'watch']);
};