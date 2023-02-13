/* @author ScanPay ApS */
/* eslint-env node */
const fs = require('fs');
const path = require('node:path');
const gulp = require('gulp');
const connect = require('gulp-connect');
const hljs = require('highlight.js');
const through = require('through2');
const mo3 = require('mo3place')();
const env = require('minimist')(process.argv.slice(2));
const sass = require('sass');
const uglifyJS = require("uglify-js");
const htmlmin = require("html-minifier");
const { ESLint } = require("eslint");
const eslint = new ESLint();

env.currentYear = (new Date()).getFullYear();
env.server = env.server || 'docs.test.scanpay.dk';
if (!env.publish) env.jst = env.csst = '1';

const options = {
    sass: {
        loadPaths: ['assets/css/'],
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

function writeSourceMap(dest, str) {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFile(dest + '.map', str, (err) => {
        if (err) console.error(err);
    });
}

const tpl = {};
function loadTemplates(cb) {
    tpl.header = fs.readFileSync('./tpl/header.html', 'utf8').toString();
    tpl.footer = fs.readFileSync('./tpl/footer.html', 'utf8').toString();
    cb(null);
}


function html() {
    return gulp.src(['html/**/*.html'])
        .pipe(through.obj((file, enc, cb) => {
            const filename = file.path.substring(file._base.length);
            //console.log(file._base);
            //console.log(__dirname);

            const obj = mo3.flatten([env, lookup(filename)]);
            obj.path = filename.substring(1);

            file.contents = Buffer.from(htmlmin.minify(
                mo3.fromString(tpl.header + file.contents.toString() + tpl.footer, obj),
                options.htmlmin
            ), 'utf-8');
            cb(null, file);
        }))
        .pipe(gulp.dest('www'))
        .pipe(connect.reload());
}


function code() {
    return gulp.src(['code/**/*.*', '!code/**/*.html', 'code/**/*.html'])
        .pipe(through.obj((file, enc, cb) => {
            const ext = path.extname(file.path);
            if (ext !== '.html') {
                let str = file.contents.toString();
                str = hljs.highlight(str, { language: ext.substring(1) }).value;
                file.contents = Buffer.from(str, 'utf-8');
            }
            cb(null, file);
        }))
        .pipe(gulp.dest('www/code'));
}


function assets() {
    return gulp.src('assets/{font,img}/**', { base: 'assets/' })
        .pipe(gulp.dest('www'))
        .pipe(connect.reload());
}


function js() {
    return gulp.src(['assets/js/*.js'])
        .pipe(through.obj(async (file, enc, cb) => {
            const str = file.contents.toString();
            const results = await eslint.lintText(str);
            const formatter = await eslint.loadFormatter("stylish");
            const resultText = formatter.format(results);
            if (results[0].warningCount || results[0].errorCount) {
                console.error(resultText); // output ESlint errors
            }
            const ugly = uglifyJS.minify(str, options.uglify);
            file.contents = Buffer.from(ugly.code, 'utf-8');
            writeSourceMap('www/js/' + file.relative, ugly.map);
            cb(null, file);
        }))
        .pipe(gulp.dest('www/js/'))
        .pipe(connect.reload());
}


function scss() {
    return gulp.src(['assets/css/*.scss'])
        .pipe(through.obj((file, enc, cb) => {
            file.path = file.path.replace('.scss', '.css');
            const cssobj = sass.compileString(file.contents.toString(), options.sass);
            writeSourceMap('www/css/' + file.relative, JSON.stringify(cssobj.sourceMap));
            const str = cssobj.css + '\n /*# sourceMappingURL=' + file.relative + '.map */';
            file.contents = Buffer.from(str, 'utf-8');
            cb(null, file);
        }))
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
                const fname = req.url.split('?')[0] + ((isDir) ? 'index' : '');
                req.url = fname + '.html';
            }
            next();
        }])
    });

    gulp.watch(['tpl/**/**', 'code/**'], gulp.series('build'));
    gulp.watch(['html/**/*.html'], html);
    gulp.watch('assets/{font,img}/**', assets);
    gulp.watch('assets/css/**/*.scss', scss);
    gulp.watch('assets/js/*.js', js);
    gulp.watch(['index.json'], gulp.series('build'));
    gulp.watch('/code/**/*.*', gulp.series('build'));
});


function sitemapEntry(url) {
    const fname = url + ((url.slice(-1) === '/') ? 'index.html' : '.html');
    const stat = fs.statSync(path.join(__dirname, 'www', fname));
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
    const fd = fs.openSync(path.join(__dirname, 'www', 'sitemap.xml'), 'w');
    fs.writeSync(fd, map);
    fs.closeSync(fd);
    cb(null);
});

gulp.task('build', gulp.series(loadTemplates, 'sidebar', assets, js, scss, code, html, 'sitemap'));
gulp.task('default', gulp.series('build', 'serve'));
