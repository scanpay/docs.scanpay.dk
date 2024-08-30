const gulp = require('gulp');
const connect = require('gulp-connect');
const fs = require('fs');
const util = require('./util.js')();

// Store arguments in global `args`
global.args = util.argParser({
    server: 'docs.scanpay.dev',
    dist: '/tmp/www/docs.scanpay.dev/',
    currentYear: new Date().getFullYear(),
});

// Load gulp tasks
let tasks = [];
function taskFinder(x) {
    for (let i = 0; i < tasks.length; i++) {
        const group = parseInt(tasks[i].split('_')[0], 10);
        if (group > x) {
            return tasks.slice(tasks.indexOf(i));
        }
    }
    return [];
}

fs.readdirSync(__dirname + '/tasks').forEach((filename) => {
    if (filename.endsWith('.js')) {
        const ex = require(__dirname + '/tasks/' + filename);
        const name = filename.split('.')[0];
        const group = parseInt(name.split('_')[0], 10);
        if (ex.task) {
            gulp.task(name, ex.task);
            tasks.push(name);
            if (ex.src) {
                gulp.watch(ex.src, (cb) => {
                    const seriesFunction = gulp.series(name, ...taskFinder(group));
                    seriesFunction(cb);
                });
            }
        }
    }
});

// TODO: parallelize tasks with the same dependencies (e.g. '40_code' and '40_template')
gulp.task('build', gulp.series(tasks));

// Default task is to 'build' and serve/watch
gulp.task(
    'default',
    gulp.series('build', () => {
        // We just rebuild everything if a template or highlighted file changes
        gulp.watch(['src/includes/**/**', 'src/docs/**/code/**'], gulp.series('build'));

        connect.server({
            root: global.args.dist,
            livereload: true,
            middleware: () => [
                (req, res, next) => {
                    // Add .html to URLs that don't have an ext
                    if (!req.url.includes('.') && !req.url.endsWith('/')) {
                        req.url += '.html';
                    }
                    next();
                },
            ],
        });
    })
);
