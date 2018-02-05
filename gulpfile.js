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
env.proxy = (env.publish) ? '' : 'http://localhost:9090/https://docs.test.scanpay.dk';
if (!env.publish) { env.jst = env.csst = '1'; }

let index;
gulp.task('sidebar', (cb) => {
    index = JSON.parse(fs.readFileSync('i18n/index.json'));
    for (const x in index) {
        index[x].sidebar = createSidebar(index[x]);
    }
    cb(null);
});

function createSidebar(active) {
    let str = '';
    for (const file in index) {
        const o = index[file];
        if (o.hidden) { continue; }
        const APIlabel = o.API ? '<span class="sidebar--label">API</span>' : '';

        if (o.url === active.url) {
            let sublinks = '';
            for (const p of o.pages) {
                const url = p.url || '#' + p.title.toLowerCase().replace(/ /g, '-');
                sublinks += '<li><a href="' + url + '">' + p.title + '</a></li>';
            }
            str += `<li class="sidebar--active">
                        ${ mo3.getFile('src/img/fold.svg').str }
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
    return gulp.src('src/*.html')
        .pipe(through.obj((file, enc, cb) => {
            // Get meta data from links{}
            const filename = Path.basename(file.path);
            if (!index[filename]) { throw filename + ' was not found'; }
            const obj = mo3.flatten([env, index[filename]]);
            obj.filename = filename;

            // Sass and minify inline css.
            const str = file.contents.toString()
                .replace(/<style>([\S\s]*?)<\/style>/g, (m, data) => '<style>' + sass
                    .renderSync({ data, outputStyle: 'compressed' }).css + '</style>');

            // mo3 w. template.
            file.contents = Buffer.from(mo3.fromString(mo3.getFile('src/code/header.tpl').str +
                str + mo3.getFile('src/code/footer.tpl').str, obj));

            let upath = obj.url.substring(obj.url.indexOf('/'));
            if (upath.slice(-1) === '/') { upath += 'index'; }
            file.path = Path.join(__dirname, 'src', upath + '.html');

            cb(null, file);
        }))
        .pipe(gulp.dest('www'))
        .pipe(connect.reload());
}

function code() {
    // NB: We want '.html' last, since they often include other code.
    return gulp.src(['src/code/**/*.*', '!src/code/**/*.tpl',
        '!src/code/**/*.html', 'src/code/**/*.html'])
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
    return gulp.src(['src/assets/**/*.*'])
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

function images() {
    return gulp.src('src/img/**').pipe(gulp.dest('www/img/')).pipe(connect.reload());
}

gulp.task('serve', () => {
    const https = require('https');
    const { URL } = require('url');

    connect.server({
        root: 'www',
        livereload: true,
        middleware: () => ([(req, res, next) => {
            const isDir = req.url.slice(-1) === '/';
            if (isDir || req.url.indexOf('.') === -1) {
                const path = req.url.split('?')[0] + ((isDir) ? 'index' : '');
                req.url = path + '.html';
            }
            next();
        }])
    });
    connect.server({
        port: 9090,
        middleware: () => ([(req, res, next) => {
            const url = new URL(req.url.substring(req.url.lastIndexOf('/http') + 1));
            const opts = {
                hostname: url.hostname,
                path: url.pathname,
                headers: req.headers,
                method: req.method
            };
            opts.headers.host = opts.hostname; // Nginx security

            req.pipe(https.request(opts, (response) => {
                response.headers['access-control-allow-origin'] = '*';
                res.writeHead(response.statusCode, response.headers);
                response.pipe(res);
            }).on('error', () => next()));
        }])
    });

    gulp.watch(['src/*.html'], html);
    gulp.watch(['src/assets/**/*.*'], assets);
    gulp.watch(['src/img/**'], images);
    gulp.watch(['i18n/**'], gulp.series('build'));
    gulp.watch('src/code/**/*.*', gulp.series(code, html));
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

gulp.task('build', gulp.series('sidebar', assets, images, code, html, 'sitemap'));
gulp.task('default', gulp.series('build', 'serve'));
