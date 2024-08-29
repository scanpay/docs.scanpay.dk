/*
    Clean dist directory.
*/
exports.task = (cb) => {
    const { rmSync } = require('fs');
    const dist = global.args && global.args.dist;

    try {
        if (!dist) {
            throw new Error('dist directory is not defined.');
        }
        rmSync(dist, { recursive: true, force: true });
        cb(null);
    } catch (err) {
        console.error('Error cleaning dist directory: ', err);
        cb(err);
    }
};
