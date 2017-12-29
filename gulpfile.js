"use strict";
const gulp = require('gulp');
const less = require('gulp-less');
const sourcemaps = require('gulp-sourcemaps');
const path = require('path');
const browserSync = require('browser-sync').create(); //https://browsersync.io/docs/gulp

const lessPath = path.join(__dirname, './src/style/less');
const cssPath = path.join(__dirname, './src/style/css');

gulp.task('lesscompile', function() {
    return gulp.src(`${lessPath}/index.less`)
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(cssPath))
    .pipe(browserSync.stream());
});

gulp.task('watch', function() {
    let watchless = gulp.watch([`${lessPath}/**/*.less`], ['lesscompile']);
    watchless.on('change', function(event) {
      console.log('File ' + event.path + ' was ' + event.type + ', less编译');
    });
    let watctjs = gulp.watch([`src/*.js`, `test/*/**.js`], browserSync.reload);
    watctjs.on('change', function(event) {
        console.log('File ' + event.path + ' was ' + event.type + ',  服务器重启');
    });
});

gulp.task('server', function() {
    browserSync.init({
        server: {
            baseDir: "./",
            index: "test/index.html",
        },
        port: 7777
    });
});

gulp.task('default', ['server', 'lesscompile', 'watch']);