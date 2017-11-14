"use strict"
var gulp = require('gulp');
var clean = require('gulp-clean');
var less = require('gulp-less');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var browserify = require('gulp-browserify');
var spawn = require('child_process').spawn;
var mergeStream = require('merge-stream');
var gls = require('gulp-live-server');

var connect = require('gulp-connect');
var serveStatic = require('serve-static');
var httpProxy = require('http-proxy');

var proxy = httpProxy.createProxyServer({
  secure: false
});


gulp.task('paella-opencast:clean', function () {
  return gulp.src('build', {
    read: false
  }).pipe(clean());
});


gulp.task('paella-opencast:prepare:source', function () {
  var s1 = gulp.src('node_modules/paellaplayer/**').pipe(gulp.dest('build/paella'));
  var s2 = gulp.src('paella-opencast/plugins/**').pipe(gulp.dest('build/paella/plugins'));
  
  return mergeStream(s1, s2);
});

// #DCE redirect dependency to prepare source.dce
gulp.task('paella-opencast:prepare',[ 'paella-opencast:prepare:source.dce'], function (cb) {
  var cmd_npm = spawn('npm',[ 'install'], {
    cwd: 'build/paella', stdio: 'inherit'
  });
  cmd_npm.on('close', function (code) {
    cb(code);
  });
});

// #DCE for Jim's app router
gulp.task('dce-paella-opencast:app', function () {
  gulp.src('app-src/index.js').pipe(browserify()).pipe(rename({
    dirname: '', basename: 'app-index'
  })).pipe(gulp.dest('build/paella-opencast/javascript'));
});

gulp.task('paella-opencast:prepare:source.dce',[ 'paella-opencast:prepare:source'], function () {
  // #DCE MATT-2386 After paellalayer is copied, override with DCE overrisdes
  var s1 = gulp.src('vendor/paella_overrides/plugins/**').pipe(gulp.dest('build/paella/plugins'));
  var s2 = gulp.src('vendor/paella_overrides/src/**').pipe(gulp.dest('build/paella/src'));
  var s7 = gulp.src('vendor/paella_overrides/javascript/**').pipe(gulp.dest('build/paella/javascript'));
  // #DCE MATT-2386 include DCE dce-paella-extension plugins, icons, override style, skin
  var s3 = gulp.src('node_modules/dce-paella-extensions/vendor/plugins/**').pipe(gulp.dest('build/paella/plugins'));
  var s4 = gulp.src('node_modules/dce-paella-extensions/vendor/skins/**').pipe(gulp.dest('build/paella/resources/style/skins'));
  var s5 = gulp.src('node_modules/dce-paella-extensions/resources/images/paella_icons_light_dce.png').pipe(gulp.dest('build/paella/resources/images'));
  var s6 = gulp.src('node_modules/dce-paella-extensions/resources/style/overrides.less').pipe(gulp.dest('build/paella/resources/style'));
  
  return mergeStream(s1, s2, s3, s4, s5, s6, s7);
});

gulp.task('paella-opencast:compile.release',[ 'paella-opencast:prepare'], function (cb) {
  var cmd_npm = spawn('node',[ 'node_modules/gulp/bin/gulp.js', 'build.release'], {
    cwd: 'build/paella'/*, stdio: 'inherit'*/
  });
  cmd_npm.on('close', function (code) {
    cb(code);
  });
});

gulp.task('paella-opencast:compile.debug',[ 'paella-opencast:prepare'], function (cb) {
  var cmd_npm = spawn('node',[ 'node_modules/gulp/bin/gulp.js', 'build.debug'], {
    cwd: 'build/paella'/*, stdio: 'inherit'*/
  });
  cmd_npm.on('close', function (code) {
    cb(code);
  });
});

gulp.task('paella-opencast:build',[ "paella-opencast:compile.debug"], function () {
  return gulp.src([
  'build/paella/build/player/**',
  'paella-opencast/ui/**']).pipe(gulp.dest('build/paella-opencast'));
});

gulp.task('paella-opencast:build.dce',[ "paella-opencast:build", "dce-paella-opencast:app"], function () {
  // #DCE MATT-2386 after all is built copy DCE config and profiles (from extensions) and DCE's opencast style
  var s1 = gulp.src('node_modules/dce-paella-extensions/config/config.json').pipe(gulp.dest('build/paella-opencast/config'));
  var s2 = gulp.src('node_modules/dce-paella-extensions/config/profiles/profiles.json').pipe(gulp.dest('build/paella-opencast/config/profiles'));
  var s3 = gulp.src('vendor/mh_dce_resources/**').pipe(gulp.dest('build/paella-opencast/mh_dce_resources'));
  
  return mergeStream(s1, s2, s3);
});

/// #DCE use DCE Test server and local data fixture files
gulp.task('paella-opencast:serverproxied', function () {
  var server = gls.new ('test-server.js');
  server.start();
});

gulp.task('paella-opencast:server', function () {
  var server = gls.static ('build/paella-opencast', 8000);
  server.start();
});

gulp.task('paella-opencast:server:rebuild',[ 'paella-opencast:build'], function () {
  return connect.reload();
});

gulp.task('paella-opencast:server:watch', function () {
  return gulp.watch([ 'paella-opencast/plugins/**'],[ 'paella-opencast:server:rebuild']);
  server.start();
});

gulp.task('paella-opencast:server:run', function () {
  return connect.server({
    port: 8000,
    middleware: function (connect, opt) {
      return[[ "/paella/ui", serveStatic('build/paella-opencast', {'index':[ 'index.html']})],
      [ "/", function (req, res, next) {
        // proxy.web(req, res, { target: 'http://engage.opencast.org/' });
        // proxy.web(req, res, {target: 'http://engage.videoapuntes.upv.es:8080/'});
        // proxy.web(req, res, { target: 'https://opencast-dev.uni-koeln.de/' });
        proxy.web(req, res, {target: 'http://engage.videoapuntes.upv.es:8080/'});
      }]]
    },
    livereload: true
  });
});

gulp.task('paella-opencast:server',[ 'paella-opencast:server:run', 'paella-opencast:server:watch']);

gulp.task('default',[ 'paella-opencast:build.dce']);
gulp.task('build',[ 'paella-opencast:build.dce']);

gulp.task('server',[ 'paella-opencast:serverproxied']);
