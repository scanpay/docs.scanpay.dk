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
const index = JSON.parse(fs.readFileSync('src/index.json', 'utf8'));
const files = {};

function createSidebar(active) {
    let str = '';
    for (let i = 0; i < index.length; i++) {
        const o = index[i];
        if (!o.path) { o.path = o.title.toLowerCase().replace(/ /g, '-') + '.html'; }
        if (!o.url) { o.url = '/' + o.path.substring(0, o.path.length - 5); }

        if (o.hidden) { continue; }
        const APIlabel = o.API ? '<span class="sidebar--label">API</span>' : '';

        if (i === active) {
            let sublinks = '';
            for (const p of o.pages) {
                const url = p.url || '#' + p.title.toLowerCase().replace(/ /g, '-');
                sublinks += '<li><a href="' + url + '">' + p.title + '</a></li>';
            }
            str += `<li class="sidebar--active">
                        <a href="${o.url}">${o.title + APIlabel}</a>
                        <ol class="sidebar--sub">${sublinks}</ol>
                    </li>`;
        } else {
            str += '<li><a href="' + o.url + '">' + o.title + APIlabel + '</a></li>';
        }
    }
    return str;
}

for (let i = 0; i < index.length; i++) {
    const o = index[i];
    o.sidebar = createSidebar(i);
    files[o.path] = o;
}

function html() {
    return gulp.src('src/*.html')
        .pipe(through.obj((file, enc, cb) => {
            // Get meta data from links{}
            const filename = Path.basename(file.path);
            const obj = mo3.flatten([env, files[filename]]);
            obj.filename = filename;

            // mo3 w. template.
            file.contents = Buffer.from(mo3.render(mo3
                .getStr('src/code/header.tpl.html') + file.contents.toString() +
                    mo3.getStr('src/code/footer.tpl.html'), obj));
            cb(null, file);
        }))
        .pipe(gulp.dest('www'))
        .pipe(connect.reload());
}

function code() {
    return gulp.src(['src/code/**/*.*', '!src/code/**/*.html'])
        .pipe(through.obj((file, enc, cb) => {
            const ext = file.path.split('.').splice(1).pop();
            let str = file.contents.toString();
            if (ext === 'json' && str[0] !== '{') {
                // Hack for json w/o start braces.
                str = hljs.highlight(ext, '{' + str + '}', true).value;
                str = str.substring(1, str.length - 1);
            } else {
                str = hljs.highlight(ext, str, true).value;
            }
            // Save highlighted code to mo3's cache
            mo3.setCache(file.path.substring(__dirname.length + 1), str);
            file.contents = Buffer.from(str);
            cb(null, file);
        }))
        .pipe(gulp.dest('www/code'));
}

function htmlCode() {
    return gulp.src('src/code/**/*.html')
        .pipe(through.obj((file, enc, cb) => {
            const str = mo3.render(file.contents.toString());
            mo3.setCache(file.path.substring(__dirname.length + 1), str);
            file.contents = Buffer.from(str);
            cb(null, file);
        }))
        .pipe(gulp.dest('www/code'));
}

function assets() {
    return gulp.src(['src/assets/*.*', 'src/assets/font/*.*'])
        .pipe(through.obj((file, enc, cb) => {
            if (Path.extname(file.path) === '.sass') {
                file.contents = sass.renderSync({ data: file.contents.toString() }).css;
                file.path = file.path.slice(0, -4) + 'css';
            }
            cb(null, file);
        }))
        .pipe(gulp.dest('www/a/'))
        .pipe(connect.reload());
}

function images() {
    return gulp.src('src/img/**').pipe(gulp.dest('www/img/')).pipe(connect.reload());
}

gulp.task('serve', () => {
    connect.server({
        root: 'www',
        livereload: true,
        middleware: () => ([(req, res, next) => {
            const path = req.url.split('?')[0];
            const ext = path.slice((path.lastIndexOf('.') - 1 >>> 0) + 2);
            if (!ext && path !== '/') {
                req.url = path + '.html';
            }
            next();
        }])
    });
    gulp.watch(['src/*.html'], html);
    gulp.watch(['src/assets/**/*.*'], assets);
    gulp.watch(['src/img/**'], images);
    gulp.watch('src/code/**/*.*', gulp.series(code, htmlCode, html));
});

gulp.task('build', gulp.series(assets, images, code, htmlCode, html));
gulp.task('default', gulp.series('build', 'serve'));
