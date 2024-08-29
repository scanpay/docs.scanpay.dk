/*
    Copy assets and compile Sass to css.
*/

const { writeFile } = require('fs');
const { src, dest } = require('gulp');
const { compileString } = require('sass');
const util = require('../util.js')();

exports.src = ['src/assets/**/*', '!src/assets/js/**'];
exports.task = (cb) => {
    return src(exports.src, { encoding: false })
        .pipe(
            util.piper((file) => {
                if (file.extname === '.scss') {
                    file.path = file.path.replace(/\.scss$/, '.css');
                    const { css, sourceMap } = compileString(file.contents.toString(), {
                        loadPaths: ['src/assets/css/'],
                        sourceMap: true,
                        sourceMapIncludeSources: true,
                        style: 'compressed',
                    });
                    const sourceMapComment = `/*# sourceMappingURL=${file.relative}.map */`;
                    file.contents = Buffer.from(`${css}\n${sourceMapComment}`, 'utf-8');

                    // Write source map
                    const sourceMapPath = global.args.dist + file.relative + '.map';
                    writeFile(sourceMapPath, JSON.stringify(sourceMap), (err) => {
                        if (err) console.error(err);
                    });
                }
            })
        )
        .pipe(dest(global.args.dist));
};
