var gulp = require('gulp'),
	iife = require('gulp-iife'),
	gulpif = require('gulp-if'),
	batch = require('gulp-batch'),
	watch = require('gulp-watch'),
	concat = require('gulp-concat'),
	inject = require('gulp-inject'),
	uglify = require('gulp-uglify'),
	addsrc = require('gulp-add-src'),
	cssnano = require('gulp-cssnano'),
	replace = require('gulp-replace-task'),
	autoprefixer = require('gulp-autoprefixer'),

	minimist = require('minimist'),

	options = minimist(process.argv.slice(2), {
		string: 'env',
		default: { env: process.env.NODE_ENV || 'local' }
	});

gulp.task('templates', function() {
	var replacements = {
		name: 'Rechorus',
		title: 'Rechorus',
		keywords: [],
		url: 'https://www.rechorus.com',
		twitter: {
			site: '@rechorus',
			creator: '@mockenoff',
		},
		description: 'Rechorus — Replay a live stream with the accompanying Twitter fun!',
	};
	return gulp.src(['templates/*.html']).pipe(replace({
		patterns: [
			{
				match: 'title',
				replacement: replacements.title,
			},
			{
				match: 'description',
				replacement: replacements.description,
			},
			{
				match: 'url',
				replacement: replacements.url,
			},
			{
				match: 'keywords',
				replacement: replacements.keywords.join(', '),
			},
			{
				match: 'twitterSite',
				replacement: replacements.twitter.site,
			},
			{
				match: 'twitterCreator',
				replacement: replacements.twitter.creator,
			},
			{
				match: 'jsonLd',
				replacement: JSON.stringify([{
					'@context': 'http://schema.org',
					'@id': '#amt-website',
					'@type': 'WebSite',
					'name': replacements.title,
					'headline': replacements.title,
					'url': replacements.url,
				}]),
			},
		],
	})).pipe(gulp.dest('build/templates/'));
});

gulp.task('scripts', function() {
	return gulp.src(['static/js/*.js'])
		.pipe(concat('all.js'))
		.pipe(iife({
			params: ['window', 'document', 'undefined'],
			args: ['window', 'document'],
		}))
		.pipe(gulpif(options.env === 'production', uglify()))
		.pipe(gulp.dest('build/static/'));
});

gulp.task('styles', function() {
	return gulp.src('static/css/*.css')
		.pipe(concat('all.css'))
		.pipe(autoprefixer({
			cascade: false,
			browsers: ['last 2 versions'],
		}))
		.pipe(gulpif(options.env === 'production', cssnano()))
		.pipe(gulp.dest('build/static/'));
});

gulp.task('assets', function() {
	gulp.src('static/favicon.ico').pipe(gulp.dest('build/static/'));
	return gulp.src(['static/img/*']).pipe(gulp.dest('build/static/img/'));
});

gulp.task('inject', ['templates', 'scripts', 'styles'], function() {
	return gulp.src(['build/templates/*.html'])
		.pipe(inject(gulp.src(['build/static/*.js', 'build/static/*.css'], {read: false}), {
			removeTags: true,
			ignorePath: 'build/static/'
		}))
		.pipe(gulp.dest('build/templates/'));
});

gulp.task('build', ['assets', 'inject']);

gulp.task('watch', ['build'], function() {
	watch(['static/js/*', 'static/css/*', 'templates/*.html', 'static/img/*'], batch(function (events, done) {
		gulp.start('build', done);
	}));
});

gulp.task('default', function() {
	console.log(options);
});
