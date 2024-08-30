const { Transform } = require('stream');

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

module.exports = () => ({
    argParser,
    piper,
});
