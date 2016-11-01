'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('sass', function () {
  return gulp.src('./sass/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./assets/css'));
});

gulp.task('watch', function() {
  // Watch .js files
  // gulp.watch('src/js/*.js', ['scripts']);
  // Watch .scss files
  gulp.watch('./sass/**/*.scss', ['sass']);
  // Watch image files
  // gulp.watch('src/images/**/*', ['images']);
});

gulp.task('default', ['sass', 'watch']);