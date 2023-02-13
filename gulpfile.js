/* @author ScanPay ApS */
/* eslint-env node */
const fs = require('fs');
const Path = require('path');
const gulp = require('gulp');
const connect = require('gulp-connect');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const hljs = require('highlight.js');
const through = require('through2');
const mo3 = require('mo3place')();
const env = require('minimist')(process.argv.slice(2));
const sass = require('sass');
const uglifyJS = require("uglify-js");
const htmlmin = require("html-minifier");

env.currentYear = (new Date()).getFullYear();
env.server = env.server || 'docs.test.scanpay.dk';
if (!env.publish) env.jst = env.csst = '1';

const options = {
    sass: {
        loadPaths: ['css/'],
        sourceMap: true,
        sourceMapIncludeSources: true,
        style: 'compressed'
    },
    uglify: {
        mangle: {
            toplevel: true,
        },
        sourceMap: {
            includeSources: true,
            url: 'pay.' + env.i18n + '.js.map'
        }
    },
    htmlmin: {
        collapseWhitespace: true,
        removeComments: true,
    }
}


let index;
gulp.task('sidebar', (cb) => {
    index = JSON.parse(fs.readFileSync('index.json'));
    for (const name in index) {
        const o = index[name];
        o.sidebar = createSidebar(o);
        // Add the sidebar to subpages
        if (o.pages && !Array.isArray(o.pages)) {
            for (const name in o.pages) {
                o.pages[name].sidebar = o.sidebar;
            }
        }
    }
    cb(null);
});

function createSidebar(active) {
    let str = '';
    for (const name in index) {
        const o = index[name];
        if (o.hidden) { continue; }
        const APIlabel = o.API ? '<span class="nav--ul--li--a--label">API</span>' : '';

        if (o.url === active.url) {
            let sublinks = '';
            if (Array.isArray(o.pages)) {
                for (const name of o.pages) {
                    sublinks += `<li class="nav--ul--li--ol--li">
                        <a class="nav--ul--li--ol--li--a" href="#${name.toLowerCase().replace(/ /g, '-')}">
                            ${name}
                        </a>
                    </li>`;
                }
            } else {
                for (const name in o.pages) {
                    sublinks += `<li class="nav--ul--li--ol--li">
                        <a class="nav--ul--li--ol--li--a" href="${o.pages[name].url}">
                            ${name}
                        </a>
                    </li>`;
                }
            }
            str += `<li class="nav--ul--li">
                        <a class="nav--ul--li--a active" href="${o.url}">
                            ${ mo3.getFile('tpl/svg/fold.svg').str }
                            ${name} ${APIlabel}
                        </a>
                        <ol class="nav--ul--li--ol">
                            ${sublinks}
                        </ol>
                    </li>`;
        } else {
            str += `<li class="nav--ul--li">
                <a class="nav--ul--li--a" href="${o.url}">
                    ${name} ${APIlabel}
                </a>
            </li>`;
        }
    }
    return str;
}


function lookup(filename) {
    let url = filename.slice(0, -5); // rm .html from links
    if (url.substr(-5) === 'index') { url = url.slice(0, -5); }

    for (const key in index) {
        const obj = index[key];
        if (obj.url === url) {
            obj.breadcrumb = '<span class="header--nav--raquo">»</span> ' + key;
            return obj;
        }

        if (obj.pages && !Array.isArray(obj.pages)) {
            for (const subkey in obj.pages) {
                if (obj.pages[subkey].url === url) {
                    obj.pages[subkey].breadcrumb = '<span class="header--nav--raquo">»</span> ' +
                        '<a href="./">' + key + '</a> <span class="header--nav--raquo">»</span> ' +
                        subkey;
                    return obj.pages[subkey];
                }
            }
        }
    }
    throw filename + ' was not found in index.json';
}

function html() {
    return gulp.src(['html/**/*.html'])
        .pipe(through.obj((file, enc, cb) => {
            const filename = file.path.substring(file._base.length);
            const meta = lookup(filename);
            const obj = mo3.flatten([env, meta]);
            obj.path = filename.substring(1);

            const header = mo3.getFile('tpl/header.html').str;
            const footer = mo3.getFile('tpl/footer.html').str;
            const html = mo3.fromString(header + file.contents.toString() + footer, obj);
            const minified = htmlmin.minify(html, options.htmlmin);
            file.contents = Buffer.from(minified, 'utf-8');
            cb(null, file);
        }))
        .pipe(gulp.dest('www'))
        .pipe(connect.reload());
}

function code() {
    // NB: We want '.html' last, since they often include other code.
    return gulp.src(['code/**/*.*', '!code/**/*.html', 'code/**/*.html'])
        .pipe(through.obj((file, enc, cb) => {
            let str = file.contents.toString();
            const ext = file.path.split('.').splice(1).pop();
            if (ext !== 'html') {
                str = hljs.highlight(str, { language: ext }).value;
            }

            // Save highlighted code to mo3's cache
            mo3.setCache(file.path.substring(__dirname.length + 1), str);
            file.contents = Buffer.from(str);
            cb(null, file);
        }))
        .pipe(gulp.dest('www/code'));
}

function assets() {
    return gulp.src(['assets/font/**', 'assets/img/**'], { base: 'assets/' })
        .pipe(gulp.dest('www'))
        .pipe(connect.reload());
}

function js() {
    return gulp.src(['assets/js/*.js'])
        .pipe(through.obj((file, enc, cb) => {
            mo3.render(file, env);
            cb(null, file);
        }))
        .pipe(gulp.dest('www/js/'))
        .pipe(connect.reload());
}

function scss() {
    return gulp.src(['assets/css/**/*.scss'], { base: 'assets/css/' })
        .pipe(through.obj((file, enc, cb) => {
            const sassobj = sass.compileString(file.contents.toString());
            file.contents = Buffer.from(sassobj.css, 'utf-8');
            cb(null, file);
        }))
        .pipe(sourcemaps.init())
        .pipe(concat('docs.css'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('www/css/'))
        .pipe(connect.reload());
}

gulp.task('serve', () => {
    connect.server({
        root: 'www',
        livereload: true,
        middleware: () => ([(req, res, next) => {
            // Add .html (url->file)
            const isDir = req.url.slice(-1) === '/';
            if (isDir || req.url.indexOf('.') === -1) {
                const path = req.url.split('?')[0] + ((isDir) ? 'index' : '');
                req.url = path + '.html';
            }
            next();
        }])
    });

    gulp.watch(['tpl/**/*', 'code/**'], html);
    gulp.watch(['html/**/*.html'], html);
    gulp.watch(['assets/font/**', 'assets/img/**'], assets);
    gulp.watch('assets/css/**/*.scss', scss);
    gulp.watch('assets/*.js', js);
    gulp.watch(['index.json'], gulp.series('build'));
    gulp.watch('/code/**/*.*', gulp.series('build'));
});


function sitemapEntry(url) {
    const path = url + ((url.slice(-1) === '/') ? 'index.html' : '.html');
    const stat = fs.statSync(Path.join(__dirname, 'www', path));
    return '<url><loc>https://docs.scanpay.dk' + url + '</loc><lastmod>' +
            stat.mtime.toISOString() + '</lastmod><changefreq>monthly</changefreq></url>';
}

gulp.task('sitemap', (cb) => {
    let map = '<?xml version="1.0" encoding="UTF-8"?><urlset ' +
    'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    for (const x in index) {
        const o = index[x];
        if (o.hidden) { continue; }
        map += sitemapEntry(o.url);

        if (o.pages && !Array.isArray(o.pages)) {
            for (const name in o.pages) {
                map += sitemapEntry(o.pages[name].url);
            }
        }
    }
    map += '</urlset>';
    const fd = fs.openSync(Path.join(__dirname, 'www', 'sitemap.xml'), 'w');
    fs.writeSync(fd, map);
    fs.closeSync(fd);
    cb(null);
});

gulp.task('build', gulp.series('sidebar', assets, js, scss, code, html, 'sitemap'));
gulp.task('default', gulp.series('build', 'serve'));
