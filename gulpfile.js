/* @author ScanPay ApS */
/* eslint-env node */
const fs = require('fs');
const Path = require('path');
const gulp = require('gulp');
const connect = require('gulp-connect');
const sass = require('node-sass');
const hljs = require('highlight.js');
const through = require('through2');
const mo3 = require('mo3place')();
const env = require('minimist')(process.argv.slice(2));
env.currentYear = (new Date()).getFullYear();
env.server = env.server || 'docs.test.scanpay.dk';
if (!env.publish) { env.jst = env.csst = '1'; }

let index;
gulp.task('sidebar', (cb) => {
    index = JSON.parse(fs.readFileSync('index.json'));

    for (const name in index) {
        const o = index[name];
        if (!o.hidden) {
            o.sidebar = createSidebar(o);
            // Add the sidebar to subpages
            if (o.pages && !Array.isArray(o.pages)) {
                for (const name in o.pages) {
                    o.pages[name].sidebar = o.sidebar;
                }
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
        const APIlabel = o.API ? '<span class="sidebar--label">API</span>' : '';

        if (o.url === active.url) {
            let sublinks = '';
            if (Array.isArray(o.pages)) {
                for (const name of o.pages) {
                    sublinks += '<li><a href="#' + name.toLowerCase().replace(/ /g, '-') +
                        '">' + name + '</a></li>';
                }
            } else {
                for (const name in o.pages) {
                    sublinks += '<li><a href="' + o.pages[name].url + '">' +
                        name + '</a></li>';
                }
            }
            str += `<li class="sidebar--active">
                        ${ mo3.getFile('assets/img/fold.svg').str }
                        <a href="${o.url}">${name + APIlabel}</a>
                        <ol class="sidebar--sub">${sublinks}</ol>
                    </li>`;
        } else {
            str += '<li><a href="' + o.url + '">' + name + APIlabel + '</a></li>';
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
            obj.breadcrumb = '<span class="raquo">»</span> ' + key;
            return obj;
        }
        if (obj.pages && !Array.isArray(obj.pages)) {
            for (const subkey in obj.pages) {
                if (obj.pages[subkey].url === url) {
                    obj.pages[subkey].breadcrumb = '<span class="raquo">»</span> ' +
                        '<a href="./">' + key + '</a> <span class="raquo">»</span> ' +
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
            const str = file.contents.toString();

            // mo3 w. template.
            file.contents = Buffer.from(mo3.fromString(mo3
                .getFile('tpl/header.html').str +
                str + mo3.getFile('tpl/footer.html').str, obj));
            cb(null, file);
        }))
        .pipe(gulp.dest('www'))
        .pipe(connect.reload());
}


function code() {
    // NB: We want '.html' last, since they often include other code.
    return gulp.src(['code/**/*.*', '!code/**/*.html', 'code/**/*.html'])
        .pipe(through.obj((file, enc, cb) => {

            const ext = file.path.split('.').splice(1).pop();
            let str = file.contents.toString();
            if (ext === 'json' && str[0] !== '{') {
                // Hack for json w/o start braces.
                str = hljs.highlight('{' + str + '}', { language: 'json' }).value;
                str = str.substring(1, str.length - 1);
            } else if (ext === 'html') {
                str = mo3.fromString(str);
            } else {
                str = hljs.highlight(str, { language: ext }).value;
            }
            // Save highlighted code to mo3's cache
            mo3.setCache(file.path.substring(__dirname.length + 1), str);
            file.contents = Buffer.from(str);
            cb(null, file);
        }))
        .pipe(gulp.dest('www/a'));
}

function assets() {
    return gulp.src(['assets/**/*'])
        .pipe(through.obj((file, enc, cb) => {
            const ext = Path.extname(file.path);
            if (ext === '.scss') {
                file.contents = sass.renderSync({ data: file.contents.toString() }).css;
                file.path = file.path.slice(0, -4) + 'css';
            } else if (ext === '.js') {
                mo3.render(file, env);
            }
            cb(null, file);
        }))
        .pipe(gulp.dest('www/a'))
        .pipe(connect.reload());
}

gulp.task('serve', () => {
    connect.server({
        root: 'www',
        livereload: true,
        middleware: () => ([(req, res, next) => {
            const isDir = req.url.slice(-1) === '/';
            if (isDir || req.url.indexOf('.') === -1) {
                const path = req.url.split('?')[0] + ((isDir) ? 'index' : '');
                req.url = path + '.html';
            } else if (req.url.substring(0, 5) === '/img/') {
                req.url = '/a' + req.url;
            }
            next();
        }])
    });

    gulp.watch(['tpl/**/*.html'], gulp.series('build'));
    gulp.watch(['html/**/*.html'], html);
    gulp.watch(['assets/**/*'], assets);
    gulp.watch(['index.json'], gulp.series('build'));
    gulp.watch('/code/**/*.*', gulp.series(code, html));
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

gulp.task('build', gulp.series('sidebar', assets, code, html, 'sitemap'));
gulp.task('default', gulp.series('build', 'serve'));
