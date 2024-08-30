const { statSync, readFileSync } = require('fs');
const uri = 'src/';
const cache = new Map();

// Regex for includes and variables
const inclRegex = /{% include "(.+?)" %}/g;
const varRegex = /{{ (.+?) }}/g;

function getFile(filename) {
    const stat = statSync(uri + filename, { throwIfNoEntry: false });
    if (!stat) {
        console.error('File not found: ' + filename);
        throw 'File not found: ' + filename;
    }
    let obj = cache.get(filename);
    if (obj && obj.mtime >= stat.mtimeMs) return obj;
    obj = {
        str: readFileSync(uri + filename, 'utf8'),
        mtime: stat.mtimeMs,
    };
    cache.set(filename, obj);
    return obj;
}

// Recursively replace inclRegex with the content of the included file
function includer(str, mainFile = false) {
    return str.replace(inclRegex, (m, path) => {
        const file = getFile(path);
        // Update the mtime of the parent file
        if (mainFile && file.mtime > mainFile.stat.mtimeMs) {
            mainFile.stat.mtimeMs = file.mtime;
        }
        return includer(file.str, mainFile);
    });
}

function replaceVariables(str, vars, opts) {
    const regex = opts.varRegex ? opts.varRegex : varRegex;
    return str.replace(regex, (match, k1) => {
        const value = vars[k1];
        if (typeof value === 'string') {
            // Once more to replace vars in vars[k1].
            return value.replace(regex, (m2, k2) => vars[k2] || m2);
        }
        if (typeof value === 'number') {
            return value;
        }
        return match;
    });
}

function fromString(str, vars, opts = {}) {
    const fullStr = includer(str);
    if (typeof vars !== 'object') {
        return fullStr;
    }
    return replaceVariables(fullStr, vars, opts);
}

function parseDoc(file) {
    const obj = {
        path: file.path.substring(file._base.length + 1),
        mtime: file.stat.mtimeMs,
    };
    let str = file.contents.toString();
    const endOfConfig = str.indexOf('-->');
    if (!endOfConfig) {
        throw 'No end of config found in file: ' + file.path;
    }
    obj.content = fromString(str.substring(endOfConfig + 3));
    str = str.substring(4, endOfConfig - 1);
    const lines = str.split('\n');
    for (let i = 1; i < lines.length; i++) {
        const split = lines[i].split(':');
        if (split.length === 2) {
            obj[split[0]] = split[1].trim();
        }
    }
    if (!obj.title) {
        throw 'No title found in file: ' + file.path;
    }
    if (!obj.url) {
        throw 'No URL found in file: ' + file.path;
    }
    return obj;
}

module.exports = () => ({
    cache,
    fromString,
    parseDoc,
});
