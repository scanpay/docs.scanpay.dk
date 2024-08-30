/*
    Highlight JSON code examples.
*/

const { src } = require('gulp');
const { highlight } = require('highlight.js');
const util = require('../util.js')();
const braces = require('../braces.js')();

exports.src = ['src/docs/**/*.json'];
exports.task = (cb) => {
    return src(exports.src, { base: 'src/' }).pipe(
        util.piper((file) => {
            braces.cache.set(file.relative, {
                str: highlight(file.contents.toString(), { language: 'json' }).value,
                mtime: Date.now(),
            });
        })
    );
};
