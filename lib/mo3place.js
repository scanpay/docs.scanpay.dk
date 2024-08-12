'use strict';

const { Transform } = require('node:stream');
const Path = require('node:path');
const fs = require('fs');
const { statSync, readFileSync } = require('fs');
const inclRegex = /{% include "(.+?)" %}/g;
const varRegex = /{{ (.+?) }}/g;
const uri = 'src/'; // TODO: expose this as an option
const cache = new Map();

function getFile(filename) {
    const stat = statSync(uri + filename, { throwIfNoEntry: false });
    if (!stat) {
        console.error('File not found: ' + filename);
        throw 'File not found: ' + filename;
    }
    let obj = cache.get(filename);
    if (obj && obj.mtime >= stat.mtimeMs) return obj;
    console.log('Reading file: ' + filename);
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
    if (typeof vars !== 'object') { return str; }
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
    const obj = { str, path: file.path.substring(file._base.length + 1), mtime: file.stat.mtimeMs };
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

function tap(fn) {
    return new Transform({
        objectMode: true,
        async transform(file, enc, cb) {
            try {
                await fn(file);
                cb(null, file);
            } catch (err) {
                cb(err);
            }
        },
    });
}

function envParser(o) {
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const nextArg = args[i + 1];
            if (nextArg && !nextArg.startsWith('--')) {
                o[key] = nextArg;
                i++;
            }
        }
    }
    return o;
}

function writeSourceMap(dest, str) {
    const dir = Path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFile(dest + '.map', str, (err) => {
        if (err) console.error(err);
    });
}

const esbuildPlugin = {
    name: 'parse-input',
    setup(build) {
        build.onLoad({ filter: /\.ts$/ }, async (args) => {
            const contents = await fs.promises.readFile(args.path, 'utf8');
            return {
                contents: fromString(contents, {}),
                loader: 'ts',
            };
        });
    },
};

module.exports = () => ({ cache, parseFile, fromString, tap, envParser, writeSourceMap, esbuildPlugin });
