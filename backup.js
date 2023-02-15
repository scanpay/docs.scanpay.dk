
let index;
gulp.task('sidebar', (cb) => {
    index = JSON.parse(fs.readFileSync('index.json'));
    for (const name in index) {
        const o = index[name];
        o.sidebar = createSidebar(o);
        // Add the sidebar to subpages
        if (o.pages && !Array.isArray(o.pages)) {
            for (const name in o.pages) {
                o.pages[name].sidebar = o.sidebar;
            }
        }
    }
    cb(null);
});

gulp.task('sidebar', (cb) => {
    index = JSON.parse(fs.readFileSync('index.json'));
    for (const name in index) {
        const o = index[name];
        o.sidebar = createSidebar(o);
        // Add the sidebar to subpages
        if (o.pages && !Array.isArray(o.pages)) {
            for (const name in o.pages) {
                o.pages[name].sidebar = o.sidebar;
            }
        }
    }
    cb(null);
});

function createSidebar(active) {
    let str = '';
    for (const name in index) {
        const o = index[name];
        if (o.hidden) { continue; }
        const APIlabel = o.API ? '<span class="nav--ul--li--a--label">API</span>' : '';

        if (o.url === active.url) {
            let sublinks = '';
            if (Array.isArray(o.pages)) {
                for (const name of o.pages) {
                    sublinks += `<li class="nav--ul--li--ol--li">
                        <a class="nav--ul--li--ol--li--a" href="#${name.toLowerCase().replace(/ /g, '-')}">
                            ${name}
                        </a>
                    </li>`;
                }
            } else {
                for (const name in o.pages) {
                    sublinks += `<li class="nav--ul--li--ol--li">
                        <a class="nav--ul--li--ol--li--a" href="${o.pages[name].url}">
                            ${name}
                        </a>
                    </li>`;
                }
            }
            str += `<li class="nav--ul--li">
                        <a class="nav--ul--li--a active" href="${o.url}">
                            ${ mo3.getFile('tpl/svg/fold.svg').str }
                            ${name} ${APIlabel}
                        </a>
                        <ol class="nav--ul--li--ol">
                            ${sublinks}
                        </ol>
                    </li>`;
        } else {
            str += `<li class="nav--ul--li">
                <a class="nav--ul--li--a" href="${o.url}">
                    ${name} ${APIlabel}
                </a>
            </li>`;
        }
    }
    return str;
}

function lookup(filename) {
    let url = filename.slice(0, -5); // rm .html from links
    if (url.substr(-5) === 'index') { url = url.slice(0, -5); }

    for (const key in index) {
        const obj = index[key];
        if (obj.url === url) {
            obj.breadcrumb = '<span class="header--nav--raquo">»</span> ' + key;
            return obj;
        }

        if (obj.pages && !Array.isArray(obj.pages)) {
            for (const subkey in obj.pages) {
                if (obj.pages[subkey].url === url) {
                    obj.pages[subkey].breadcrumb = '<span class="header--nav--raquo">»</span> ' +
                        '<a href="./">' + key + '</a> <span class="header--nav--raquo">»</span> ' +
                        subkey;
                    return obj.pages[subkey];
                }
            }
        }
    }
    throw filename + ' was not found in index.json';
}
