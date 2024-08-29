/*
    Load the template files.
*/

const { readFileSync } = require('fs');

exports.src = ['src/tpl/header.html', 'src/tpl/footer.html'];
exports.task = (cb) => {
    global.tpl = {
        header: readFileSync('./src/tpl/header.html', 'utf8').toString(),
        footer: readFileSync('./src/tpl/footer.html', 'utf8').toString(),
    };
    cb(null);
};
