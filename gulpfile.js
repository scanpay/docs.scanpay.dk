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

    for (const x in index) {
        const o = index[x];
        o.path = x.substring(1);
        o.url = x.slice(0, -5); // rm .html from links

        if (o.pages && !Array.isArray(o.pages)) {
            for (const page in o.pages) {
                o.pages[page].subpage = true;
                o.pages[page].url = page.slice(0, -5);
                o.pages[page].path = page;
                index[page] = o.pages[page];
            }
        }
        if (o.url.slice(-6) === '/index') {
            o.url = o.url.substring(0, o.url.length - 5);
        }
    }
    for (const x in index) {
        const o = index[x];
        if (!o.hidden && !o.subpage) {
            o.sidebar = createSidebar(o);
            if (o.pages && !Array.isArray(o.pages)) {
                for (const page in o.pages) {
                    o.pages[page].sidebar = o.sidebar;
                }
            }
        }
    }
    cb(null);
});

function createSidebar(active) {
    let str = '';
    for (const file in index) {
        const o = index[file];
        if (o.hidden || o.subpage) { continue; }
        const APIlabel = o.API ? '<span class="sidebar--label">API</span>' : '';

        if (o.url === active.url) {
            let sublinks = '';
            if (Array.isArray(o.pages)) {
                for (const p of o.pages) {
                    sublinks += '<li><a href="#' + p.toLowerCase().replace(/ /g, '-') +
                        '">' + p + '</a></li>';
                }
            } else {
                for (const p in o.pages) {
                    sublinks += '<li><a href="' + o.pages[p].url + '">' +
                        o.pages[p].title + '</a></li>';
                }
            }
            str += `<li class="sidebar--active">
                        ${ mo3.getFile('src/assets/img/fold.svg').str }
                        <a href="${o.url}">${o.title + APIlabel}</a>
                        <ol class="sidebar--sub">${sublinks}</ol>
                    </li>`;
        } else {
            str += '<li><a href="' + o.url + '">' + o.title + APIlabel + '</a></li>';
        }
    }
    return str;
}

function html() {
    return gulp.src(['src/**/*.html', '!src/assets/**'])
        .pipe(through.obj((file, enc, cb) => {
            const filename = file.path.substring(file._base.length);
            const meta = index[filename];
            if (!meta) { throw filename + ' was not found'; }
            const obj = mo3.flatten([env, meta]);

            // Sass and minify inline css.
            const str = file.contents.toString()
                .replace(/<style>([\S\s]*?)<\/style>/g, (m, data) => '<style>' + sass
                    .renderSync({ data, outputStyle: 'compressed' }).css + '</style>');

            // mo3 w. template.
            file.contents = Buffer.from(mo3.fromString(mo3
                .getFile('src/assets/code/header.tpl').str +
                str + mo3.getFile('src/assets/code/footer.tpl').str, obj));
            cb(null, file);
        }))
        .pipe(gulp.dest('www'))
        .pipe(connect.reload());
}

function code() {
    // NB: We want '.html' last, since they often include other code.
    return gulp.src(['src/assets/code/**/*.*', '!src/assets/code/**/*.tpl',
        '!src/assets/code/**/*.html', 'src/assets/code/**/*.html'])
        .pipe(through.obj((file, enc, cb) => {

            const ext = file.path.split('.').splice(1).pop();
            let str = file.contents.toString();
            if (ext === 'json' && str[0] !== '{') {
                // Hack for json w/o start braces.
                str = hljs.highlight(ext, '{' + str + '}', true).value;
                str = str.substring(1, str.length - 1);
            } else if (ext === 'html') {
                // Already highlighted (handcrafted)
                str = mo3.fromString(str);
            } else {
                str = hljs.highlight(ext, str, true).value;
            }
            // Save highlighted code to mo3's cache
            mo3.setCache(file.path.substring(__dirname.length + 1), str);
            file.contents = Buffer.from(str);
            cb(null, file);
        }))
        .pipe(gulp.dest('www/a'));
}

function assets() {
    return gulp.src(['src/assets/**/*.*', '!src/assets/code/**'])
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

    gulp.watch(['src/**/*.html'], html);
    gulp.watch(['src/assets/**/*.*'], assets);
    gulp.watch(['index.json'], gulp.series('build'));
    gulp.watch('src/assets/code/**/*.*', gulp.series(code, html));
});

gulp.task('sitemap', (cb) => {
    let map = '<?xml version="1.0" encoding="UTF-8"?><urlset ' +
    'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    for (const x in index) {
        const o = index[x];
        if (o.hidden) { continue; }
        const path = o.url + ((o.url.slice(-1) === '/') ? 'index.html' : '.html');
        const stat = fs.statSync(Path.join(__dirname, 'www', path));
        map += '<url><loc>https://docs.scanpay.dk' + o.url + '</loc>';
        map += '<lastmod>' + stat.mtime.toISOString() + '</lastmod></url>';
    }
    map += '</urlset>';
    const fd = fs.openSync(Path.join(__dirname, 'www', 'sitemap.xml'), 'w');
    fs.writeSync(fd, map);
    fs.closeSync(fd);
    cb(null);
});

gulp.task('build', gulp.series('sidebar', assets, code, html, 'sitemap'));
gulp.task('default', gulp.series('build', 'serve'));
