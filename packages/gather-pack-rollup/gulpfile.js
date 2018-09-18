
// require('babel-core/register');
const gulp = require('gulp');
const babel = require('gulp-babel');
const runSequence = require('run-sequence');
const del = require('del');
const plumber = require('gulp-plumber');

const DIR = {
  src: './src/**/*.js',
  dist: 'lib',
};
gulp.task('clean', () => del([DIR.dist]));
gulp.task('babel', () => gulp.src(DIR.src)
  .pipe(plumber())
  .pipe(babel())
  .pipe(gulp.dest(DIR.dist)));


gulp.task('build', (cb) => {
  runSequence('clean', 'babel');
  cb();
});

gulp.task('watch', () => {
  gulp.watch([DIR.src], ['babel']);
});

