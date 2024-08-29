/*
    Compile TypeScript files.
*/

const fs = require('fs');
const { build } = require('esbuild');

exports.src = ['src/assets/js/**/*.ts'];
exports.task = () => {
    return build({
        tsconfig: 'jsconfig.json',
        bundle: true,
        minify: true,
        entryPoints: exports.src,
        outdir: global.args.dist + '/js/',
        plugins: [
            // Plugin to manipulate input files before they are parsed by esbuild
            {
                name: 'parse-input',
                setup(build) {
                    build.onLoad({ filter: /\.ts$/ }, async (args) => {
                        const contents = await fs.promises.readFile(args.path, 'utf8');
                        return {
                            contents: contents,
                            loader: 'ts',
                        };
                    });
                },
            },
        ],
    }).catch((e) => console.error(e));
};
