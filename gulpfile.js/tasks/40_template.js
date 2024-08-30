/*
    Load the template files.
*/

const { readFileSync } = require('fs');

exports.src = ['src/includes/template.html'];
exports.task = (cb) => {
    global.tpl = readFileSync('./src/includes/template.html', 'utf8').toString();
    cb(null);
};
