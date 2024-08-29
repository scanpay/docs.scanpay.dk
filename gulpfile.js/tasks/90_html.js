/*
    Build and minify the HTML files.
*/

const { Transform } = require('stream');
const { minify } = require('html-minifier');
const { src, dest } = require('gulp');
const { writeFileSync } = require('fs');
const util = require('../util.js')();

// HTML minifier options
const options = {
    collapseWhitespace: true,
    removeComments: true,
};

// eslint-disable-next-line max-statements
function createSidebar(fpath, sorted) {
    let path = fpath;
    let str = '';
    if (fileData[path].parent) {
        for (const x in fileData) {
            if (fileData[x].url === fileData[path].parent) {
                path = x;
                break;
            }
        }
        if (path === fpath) {
            console.error('ERROR: Parent not found: ' + fileData[path].parent);
        }
    }

    for (const arr of sorted) {
        const x = arr[1];
        const status = x === path ? 'active' : '';
        let ol = '';
        if (x === path && arr[2] && arr[2].length) {
            ol = '<ol class="nav--ul--li--ol">';
            for (const subpage of arr[2]) {
                const y = subpage[1];
                ol += `
                <li class="nav--ul--li--ol--li ${y === fpath ? 'nav--ul--li--ol--li--active' : ''}">
                    <a class="nav--ul--li--ol--li--a" href="${fileData[y].url}">${fileData[y].link}</a>
                </li>`;
            }
            ol += '</ol>';
        }
        const iconAPI = fileData[x].title.endsWith('API') ? '<span class="nav--ul--li--a--label">API</span>' : '';
        str += `<li class="nav--ul--li">
            <a class="nav--ul--li--a ${status}" href="${fileData[x].url}">${fileData[x].link} ${iconAPI}</a>
            ${ol}
        </li>`;
    }
    return str;
}

function breadcrumb(data) {
    data.breadcrumbParent = '';
    data.BreadcrumbList = [];
    if (data.parent) {
        // Find parent
        let parent;
        for (const x in fileData) {
            if (fileData[x].url === data.parent) {
                parent = fileData[x];
                break;
            }
        }
        data.breadcrumbParent = `<span class="header--nav--raquo">»</span> <a href="${parent.url}">${parent.link}</a>`;
        data.BreadcrumbList.push({
            '@type': 'ListItem',
            position: 1,
            name: parent.link,
            item: 'https://docs.scanpay.dev' + parent.url,
        });
    }
    data.BreadcrumbList.push({
        '@type': 'ListItem',
        position: data.BreadcrumbList.length + 1,
        name: data.link,
        item: 'https://docs.scanpay.dev' + data.url,
    });
    data.BreadcrumbList = JSON.stringify(data.BreadcrumbList);
}

// Create sorted tree of links
function sortPages() {
    const sorted = [];
    for (const x in fileData) {
        if (fileData[x].link && !fileData[x].parent) {
            const page = [fileData[x].order, x];
            const subpages = [];
            for (const y in fileData) {
                if (fileData[y].parent && fileData[y].parent === fileData[x].url) {
                    subpages.push([fileData[y].order, y]);
                }
            }
            if (subpages.length) {
                subpages.sort((a, b) => a[0] - b[0]);
                page.push(subpages);
            }
            sorted.push(page);
        }
    }
    sorted.sort((a, b) => a[0] - b[0]);
    return sorted;
}

function createSitemap() {
    let s = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    for (const x in fileData) {
        const o = fileData[x];
        const ts = new Date(o.mtime).toISOString();
        s += `<url><loc>https://docs.scanpay.dev${o.url}</loc><lastmod>${ts}</lastmod></url>`;
    }
    s += '</urlset>';
    writeFileSync(global.args.dist + 'sitemap.xml', s);
}

const fileData = {};
exports.src = ['src/docs/**/*.html'];

exports.task = () => {
    const files = [];
    return src(exports.src)
        .pipe(
            new Transform({
                objectMode: true,
                transform(file, enc, cb) {
                    try {
                        if (!fileData[file.relative] || fileData[file.relative].mtime !== file.stat.mtimeMs) {
                            fileData[file.relative] = util.parseFile(file);
                        }
                        files.push(file);
                        cb(null, file);
                    } catch (err) {
                        console.log(err);
                        cb(err);
                    }
                },
                flush(cb) {
                    try {
                        const sorted = sortPages(fileData);
                        files.forEach((file) => {
                            const o = Object.assign({}, global.args, fileData[file.relative]);
                            breadcrumb(o, sorted);
                            o.sidebar = createSidebar(file.relative, sorted);

                            file.contents = Buffer.from(
                                minify(util.fromString(global.tpl.header + o.str + global.tpl.footer, o), options)
                            );
                            this.push(file);
                        });
                        createSitemap();

                        // TODO: call connect to reload the page
                        cb();
                    } catch (err) {
                        console.log(err);
                        cb(err);
                    }
                },
            })
        )
        .pipe(dest(global.args.dist));
};
