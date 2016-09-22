/** DCE dce-paella-opencast-extenstions */
/* v0.0.01 to build upv via this repo
 */
// TODO: v0.0.02 to build and insert dce-paella-extensions
// TODO: v0.0.03 to build and inject the DCE auth for the 01_ js
// TODO: v0.0.04 to build and inject the rest of the DCE matterhorn customizations

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
            "upv-paella-opencast": {
                files:[ {
                    // Basic Paella-Opencast
                    expand: true, dot: true, cwd: 'node_modules/paella-engage-ui', src:[ '**', '!paella-opencast/plugins/es.upv.paella.opencast.loader/01_prerequisites.js'], dest: 'build/upv-paella-opencast'
                },
                {
                    // copy in DCE Paella-Extension plugins (DCE plugins are added to opencast-paella plugins here instead of to paella plugins as before. All plugins end up in the same file when built by upv's paella-opencast)
                    expand: true, dot: true, cwd: 'node_modules/dce-paella-extensions/vendor/plugins', src:[ '**'], dest: 'build/upv-paella-opencast/paella-opencast/plugins'
                },
                {
                    // The DCE auth file replaces the UPV default auth
                    expand: true, cwd: 'vendor/plugins/es.upv.paella.opencast.loader-DCE', src:[ '01_prerequisites_DCE.js'], dest: 'build/upv-paella-opencast/paella-opencast/plugins/es.upv.paella.opencast.loader'
                },
                {
                    // copy in DCE Paella-Opencast customized plugins
                    expand: true, cwd: 'vendor/plugins', src:[ '**'], dest: 'build/upv-paella-opencast/paella-opencast/plugins'
                }]
            },
            "dce-paella-opencast": {
                files:[ {
                    // Basic Paella-Matterhorn
                    // copy all except the files we are relacing
                    expand: true, cwd: 'build/upv-paella-opencast/build/paella-opencast', src:[ '**', '!watch.html'], dest: 'build/dce-paella-opencast'
                }, {
                    // copy in the DCE paella-opencast customized files
                    expand: true, cwd: 'vendor/ui', src:[ '**'], dest: 'build/dce-paella-opencast'
                }, {
                    // copy in the DCE paella-extension resources
                    expand: true, dot: true, cwd: 'node_modules/dce-paella-extensions/resources', src:[ '**'], dest: 'build/dce-paella-opencast/resources'
                },
                {
                    // Use HUDCE specific config to determine defaults and plugins to enable
                    expand: true, dot: true, cwd: 'node_modules/dce-paella-extensions/config', src:[ 'config.json'], dest: 'build/dce-paella-opencast/config'
                },
                {
                    // The CS50 look and feel
                    expand: true, dot: true, cwd: 'node_modules/dce-paella-extensions/vendor/skins', src:[ '**'], dest: 'build/dce-paella-opencast/resources/style'
                },
                {
                    // The jquery-ui and help page resources
                    expand: true, dot: true, cwd: 'vendor/mh_dce_resources', src:[ '**'], dest: 'build/dce-paella-opencast/mh_dce_resources'
                }]
            }
        },
        subgrunt: {
            "build.debug": {
                projects: {
                    'build/upv-paella-opencast': 'build'
                }
            },
            checksyntax: {
                projects: {
                    'build/upv-paella-opencast': 'checksyntax'
                }
            }
        },
        jshint: {
            options: {
                jshintrc: 'node_modules/paella-engage-ui/.jshintrc'
            },
            dist:[
            'dce-paella-opencast/javascript/*.js',
            'dce-paella-opencast/plugins/*/*.js']
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
                dest: 'build/temp/style_cs50.less'
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
                    "build/dce-paella-opencast/resources/style/dce-matterhorn-style.css": "build/temp/dce-matterhorn-style.less"
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
                    "build/dce-paella-opencast/resources/style/style_cs50.css": "build/temp/style_cs50.less"
                }
            }
        },
        browserify: {
            dist: {
                files: {
                    'build/dce-paella-opencast/javascript/app-index.js':[ 'app-src/index.js']
                }
            }
        },
        watch: {
            debug: {
                files:[
                'dce-paella-opencast/ui/**',
                'dce-paella-opencast/javascript/*.js',
                'dce-paella-opencast/plugins/**'],
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
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    //grunt.loadNpmTasks('grunt-merge-json');
    grunt.loadNpmTasks('grunt-jsonlint');
    grunt.loadNpmTasks('grunt-express');
    grunt.loadNpmTasks('grunt-browserify');
    //grunt.loadNpmTasks('grunt-make');
    
    grunt.registerTask('default',[ 'build']);
    grunt.registerTask('dce-browserify',[ 'browserify']);
    grunt.registerTask('build_dce_css',[ 'concat:less', 'less:production']);
    grunt.registerTask('prepare',[ 'copy:upv-paella-opencast']);
    grunt.registerTask('checksyntax',[ 'prepare', 'jshint', 'subgrunt:checksyntax']);
    grunt.registerTask('build',[ 'prepare', 'subgrunt:build.debug', 'copy:dce-paella-opencast', 'build_dce_css', 'dce-browserify']);
    grunt.registerTask('server',[ 'build', 'express', 'watch']);
};