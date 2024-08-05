const { Transform } = require('stream');
const fs = require('fs');
const path = require('node:path');

const options = require('./config.json');
const gulp = require('gulp');
const connect = require('gulp-connect');
const hljs = require('highlight.js');
const mo3 = require('./lib/mo3place.js')();
const env = require('minimist')(process.argv.slice(2));
const sass = require('sass');
const uglifyJS = require("uglify-js");
const htmlmin = require("html-minifier");
env.currentYear = (new Date()).getFullYear();
env.server = env.server || 'docs.scanpay.dev';
if (!env.publish) env.jst = env.csst = '1';

function writeSourceMap(dest, str) {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFile(dest + '.map', str, (err) => {
        if (err) console.error(err);
    });
}

const tpl = {};
function loadTemplates(cb) {
    tpl.header = fs.readFileSync('./src/tpl/header.html', 'utf8').toString();
    tpl.footer = fs.readFileSync('./src/tpl/footer.html', 'utf8').toString();
    cb(null);
}


function createSidebar(fpath, sorted) {
    let path = fpath;
    let str = '';
    if (fileData[path].parent) {
        for (const x in fileData) {
            if (fileData[x].url === fileData[path].parent) {
                path = x;
                break;
            }
        }
        if (path === fpath) {
            console.error('ERROR: Parent not found: ' + fileData[path].parent);
        }
    }

    for (const arr of sorted) {
        const x = arr[1];
        const status = (x === path) ? 'active' : '';
        let ol = '';
        if (x === path && arr[2] && arr[2].length) {
            ol = `
            <ol class="nav--ul--li--ol">
                <li class="nav--ul--li--ol--li ${(x === fpath) ? 'nav--ul--li--ol--li--active' : ''}">
                    <a class="nav--ul--li--ol--li--a" href="${fileData[x].url}">Overview</a>
                </li>`;
            for (const subpage of arr[2]) {
                const y = subpage[1];
                ol += `
                <li class="nav--ul--li--ol--li ${(y === fpath) ? 'nav--ul--li--ol--li--active' : ''}">
                    <a class="nav--ul--li--ol--li--a" href="${fileData[y].url}">${fileData[y].link}</a>
                </li>`;
            }
            ol += '</ol>';
        }
        const iconAPI = (fileData[x].title.endsWith('API')) ? '<span class="nav--ul--li--a--label">API</span>' : '';
        str += `<li class="nav--ul--li">
            <a class="nav--ul--li--a ${status}" href="${fileData[x].url}">${fileData[x].link} ${iconAPI}</a>
            ${ol}
        </li>`;
    }
    return str;
}

function breadcrumb(data, sorted) {
    data.breadcrumbParent = '';
    data.BreadcrumbList = [];
    if (data.parent) {
        // Find parent
        let parent;
        for (const x in fileData) {
            if (fileData[x].url === data.parent) {
                parent = fileData[x];
                break;
            }
        }
        data.breadcrumbParent = `<span class="header--nav--raquo">»</span> <a href="${parent.url}">${parent.link}</a>`;
        data.BreadcrumbList.push({
            '@type': 'ListItem',
            position: 1,
            name: parent.link,
            item: 'https://docs.scanpay.dev' + parent.url
        });
    }
    data.BreadcrumbList.push({
        '@type': 'ListItem',
        position: data.BreadcrumbList.length + 1,
        name: data.link,
        item: 'https://docs.scanpay.dev' + data.url
    });
    data.BreadcrumbList = JSON.stringify(data.BreadcrumbList);
}


const fileData = {};
const files = [];
function html() {
    return gulp.src('src/docs/**/*.html')
        .pipe(new Transform({
            objectMode: true,
            transform(file, enc, cb) {
                if (!fileData[file.path] || fileData[file.path].mtime !== file.stat.mtimeMs) {
                    fileData[file.path] = mo3.parseFile(file);
                }
                files.push(file);
                cb();
            },
            flush(cb) {
                // Create sorted tree of links
                const sorted = [];
                for (const x in fileData) {
                    if (fileData[x].link && !fileData[x].parent) {
                        const page = [fileData[x].order, x];
                        const subpages = [];
                        for (const y in fileData) {
                            if (fileData[y].parent && fileData[y].parent === fileData[x].url) {
                                subpages.push([fileData[y].order, y]);
                            }
                        }
                        if (subpages.length) {
                            subpages.sort((a, b) => a[0] - b[0]);
                            page.push(subpages);
                        }
                        sorted.push(page);
                    }
                }
                sorted.sort((a, b) => a[0] - b[0]);

                files.forEach(file => {
                    const data = Object.assign({}, env, fileData[file.path]);
                    if (data.mtime !== file.stat.mtimeMs) {
                        breadcrumb(data, sorted);
                        data.sidebar = createSidebar(file.path, sorted);
                        data.mtime = file.stat.mtimeMs;
                    }
                    file.contents = Buffer.from(
                        htmlmin.minify(
                            mo3.fromString(tpl.header + data.str + tpl.footer, data),
                            options.htmlmin
                        ),
                        'utf-8'
                    );
                    this.push(file);
                });
                files.length = 0; // reset the array
                cb();
            }
        }))
        .pipe(gulp.dest('www'))
        .pipe(connect.reload());
}


function code() {
    return gulp.src(['src/docs/**/*.json'], { base: 'src/' })
        .pipe(new Transform({
            objectMode: true,
            transform(file, enc, cb) {
                const str = hljs.highlight(file.contents.toString(), { language: 'json' }).value;
                mo3.cache.set(file.relative, { str });
                cb();
            }
        }));
}


function js() {
    return gulp.src('src/assets/js/**.js', { base: 'src/assets/' })
        .pipe(new Transform({
            objectMode: true,
            transform(file, enc, cb) {
                // Handle JavaScript
                options.uglify.sourceMap.url = file.relative + '.map';
                const ugly = uglifyJS.minify(file.contents.toString(), options.uglify);
                file.contents = Buffer.from(ugly.code, 'utf-8');
                writeSourceMap('www/js/' + file.relative, ugly.map);
                cb(null, file);
            }
        }))
        .pipe(gulp.dest('www'))
        .pipe(connect.reload());
}


function assets() {
    return gulp.src('src/assets/{font,img}/**', { base: 'src/assets/', encoding: false })
        .pipe(gulp.dest('www'));
}

function scss() {
    return gulp.src(['src/assets/css/*.scss'])
        .pipe(new Transform({
            objectMode: true,
            transform(file, enc, cb) {
                try {
                    file.path = file.path.replace('.scss', '.css');
                    const cssobj = sass.compileString(file.contents.toString(), options.sass);
                    const str = cssobj.css + '\n /*# sourceMappingURL=' + file.relative + '.map */';
                    file.contents = Buffer.from(str, 'utf-8');
                    writeSourceMap('www/css/' + file.relative, JSON.stringify(cssobj.sourceMap));
                    cb(null, file);
                } catch (err) {
                    cb(err);
                }
            }
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

    gulp.watch('src/docs/**/*.html', html);
    gulp.watch('src/assets/{font,img}/**/**', assets);
    gulp.watch('src/assets/css/**/*.scss', scss);
    gulp.watch('src/assets/js/**/*.js', js);
    gulp.watch(['src/tpl/**/**', 'src/docs/**/code/*.*'], gulp.series('build'));
});

/*
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
*/

gulp.task('build', gulp.series(loadTemplates, code, assets, js, scss, html));
gulp.task('default', gulp.series('build', 'serve'));
