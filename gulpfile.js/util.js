const { Transform } = require('stream');
const { statSync, readFileSync } = require('fs');
const inclRegex = /{% include "(.+?)" %}/g;
const varRegex = /{{ (.+?) }}/g;
const uri = 'src/'; // TODO: expose this as an option
const cache = new Map();

function argParser(args) {
    process.argv.slice(2).forEach((arg) => {
        const [key, value] = arg.split('=');
        args[key.replace('--', '')] = value || true;
    });
    return args;
}

function piper(fn) {
    return new Transform({
        objectMode: true,
        transform(file, enc, cb) {
            try {
                fn(file);
                cb(null, file);
            } catch (err) {
                cb(err);
            }
        },
    });
}

function getFile(filename) {
    const stat = statSync(uri + filename, { throwIfNoEntry: false });
    if (!stat) {
        console.error('File not found: ' + filename);
        throw 'File not found: ' + filename;
    }
    let obj = cache.get(filename);
    if (obj && obj.mtime >= stat.mtimeMs) return obj;
    // console.log('Reading file: ' + filename);
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
    if (typeof vars !== 'object') {
        return str;
    }
    const regex = opts.varRegex ? opts.varRegex : varRegex;

    const ret = str.replace(regex, (match, k1) => {
        if (typeof vars[k1] === 'string') {
            // Once more to replace vars in vars[k1].
            return vars[k1].replace(regex, (m2, k2) => vars[k2] || m2);
        }
        if (typeof vars[k1] === 'number') {
            return vars[k1];
        }
        return match;
    });
    return ret;
}

function fromString(str, vars, opts = {}) {
    const fullStr = includer(str);
    return replaceVariables(fullStr, vars, opts);
}

function parseFile(file) {
    const str = file.contents.toString();
    const obj = {
        str,
        path: file.path.substring(file._base.length + 1),
        mtime: file.stat.mtimeMs,
    };
    const lines = str.split('\n', 10); // TODO: make this more efficient and stop...
    if (lines[0] === '<!--') {
        for (let i = 1; i < lines.length; i++) {
            const split = lines[i].split(':');
            if (!split[1]) break;
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
    argParser,
    piper,
    cache,
    parseFile,
    fromString,
});
