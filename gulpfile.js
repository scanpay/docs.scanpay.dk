/**
*   @author ScanPay ApS
**/
'use strict';
const gulp = require('gulp');
const connect = require('gulp-connect');
const nunjucks = require('nunjucks');
const lessjs = require('less');
const hljs = require('highlight.js');
const through = require('through2');
let env = require('minimist')(process.argv.slice(2));
env.currentYear = (new Date()).getFullYear();
env.code = {}; // used to store highlighted code

function highlight() {
    return gulp.src(['src/includes/code/*/*.*'], { since: gulp.lastRun(highlight) })
    .pipe(through.obj((file, enc, cb) => {
        const filename = file.path.split('/').pop();
        const ext = filename.split('.').splice(1).pop();
        const hlobj = hljs.highlight(ext, file.contents.toString('utf8'), false);
        env.code[filename] = hlobj.value;
        cb(null, file);
    }));
}

function less() {
    return through.obj((file, enc, cb) => {
        lessjs.render(file.contents.toString(), null, (err, res) => {
            if (err) { throw err; }
            file.contents = Buffer.from(res.css);
            file.path = file.path.substring(0, file.path.lastIndexOf('.')) + '.css';
            cb(null, file);
        });
    });
}

function webserver() {
    connect.server({
        root: 'www',
        livereload: true,
        middleware: (connect, opt) => ([(req, res, next) => {
            const path = req.url.split('?')[0];
            const ext = path.slice((path.lastIndexOf('.') - 1 >>> 0) + 2);
            if (!ext && path !== '/') {
                req.url = path + '.html';
            }
            next();
        }])
    });
}

let includes;
function loadIncludes(done) {
    includes = new nunjucks.FileSystemLoader(['src/includes/']);
    done();
}

const pages = ['/index', '/payment-link', '/subscriptions', '/synchronization',
    '/acquiring-banks', '/ecommerce-modules', '/API-libraries', '/security'];

function index() {
    let i = 0;
    env.index = [];
    return gulp.src(pages.map(s => 'src/' + s + '.html'))
    .pipe(through.obj((file, enc, cb) => {
        const nenv = new nunjucks.Environment(includes, {});
        const o = {
            sublist: []
        };

        nenv.addFilter('settitle', str => {
            o.title = str; return str;
        });
        nenv.addFilter('setlabel', str => {
            o.label = str; return str;
        });
        nenv.addGlobal('addsublist', (name, id) => {
            o.sublist.push({ name: name, id: id });
        });

        nenv.renderString(file.contents.toString('utf8'), {}, (err, res) => {
            if (err) { throw err; }
            o.path = pages[i++];
            if (o.path === '/index') { o.path = '/'; }
            env.index.push(o);
            cb(null, file);
        });
    }));
}

function html() {
    const nenv = new nunjucks.Environment(includes, {});
    nenv.addFilter('settitle', str => str);
    nenv.addFilter('setlabel', str => str);
    nenv.addGlobal('addsublist', () => {});

    return gulp.src('src/*.html').pipe(through.obj((file, enc, cb) => {
        env.filename = file.path.substring(file.path.lastIndexOf('/') + 1);
        nenv.renderString(file.contents.toString('utf8'), env, (err, res) => {
            if (err) { throw err; }
            file.contents = Buffer.from(res);
            cb(null, file);
        });
    }))
    .pipe(gulp.dest('www'))
    .pipe(connect.reload());
}

function css() {
    return gulp.src(['src/css/docs.less'])
    .pipe(less())
    .pipe(gulp.dest('www/a/'))
    .pipe(connect.reload());
}

function assets() {
    return gulp.src(['src/font/*.*', 'src/js/**'])
    .pipe(gulp.dest('www/a/'))
    .pipe(connect.reload());
}

function images() {
    return gulp.src('src/img/**')
    .pipe(gulp.dest('www/img/'))
    .pipe(connect.reload());
}

function stalker() {
    gulp.watch(['src/includes/**'], gulp.series(loadIncludes, index, html));
    gulp.watch(['src/*.html'], gulp.series(index, html));
    gulp.watch(['src/css/docs.less'], css);
    gulp.watch(['src/font/*.{woff,woff2}', 'src/js/**'], assets);
    gulp.watch(['src/img/**'], images);
    gulp.watch(['src/includes/code/**'], gulp.series(highlight, html));
}

gulp.task('build', gulp.parallel(assets, images, gulp.series(loadIncludes, gulp.parallel(highlight, index), html), css));
gulp.task('serve', gulp.parallel(stalker, webserver));
gulp.task('default', gulp.series('build', 'serve'));
