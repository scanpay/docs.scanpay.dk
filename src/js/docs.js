/**
*   @author ScanPay ApS.
**/

const preferedLang = sessionStorage && sessionStorage.getItem('lang');

function onBtnClick(evt) {
    const btn = evt.target;
    if (btn.tagName === 'BUTTON') {
        setProgrammingLanguage(btn, this);
        sessionStorage.setItem('lang', btn.textContent.toLowerCase());
    }
}

function setProgrammingLanguage(btn, parent) {
    parent.getElementsByClassName('code--btn--active')[0].className = '';
    btn.classList.add('code--btn--active');
    parent.getElementsByClassName('code--active')[0].classList.remove('code--active');
    parent.getElementsByClassName(btn.textContent.toLowerCase())[0].classList.add('code--active');
}


/*
    Very simple fetch polyfill (for Safari < 10.1)
*/
if (!self.fetch) {
    self.fetch = (url) => new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();

        xhr.onload = () => {
            resolve({
                body: xhr.response,
                json() {
                    return JSON.parse(xhr.response);
                }
            });
        };

        xhr.onerror = () => reject(new TypeError('Network request failed'));
        xhr.ontimeout = () => reject(new TypeError('Network request failed'));
        xhr.open('GET', url, true);
        xhr.send();
    });
}

function search(query) {
    const results = document.getElementById('search--ul');
    const spinner = document.getElementById('search--loading');

    if (!query) {
        results.textContent = 'No search results.';
        spinner.remove();
        return;
    }

    const url = 'https://www.googleapis.com/customsearch/v1?key=AIzaSyCih1rqEHYK71VhxLI0jsDG' +
        '_wvJ-yCaBmc&cx=009375899607126965623:qrd_0f4w284&fields=items(title,snippet,link)&q=';

    fetch(url + encodeURI(query))
    .then(res => res.json())
    .then(o => {
        if (!o.items) {
            results.textContent = 'No search results.';
            spinner.remove();
            return;
        }

        const list = document.createDocumentFragment();
        for (let x = 0; x < o.items.length; x++) {
            const li = document.createElement('li');
            const h2 = document.createElement('h2');
            const a = document.createElement('a');
            h2.className = 'search--h2';

            const item = o.items[x];
            a.textContent = item.title;
            a.href = item.link;
            h2.appendChild(a);
            li.appendChild(h2);
            li.appendChild(document.createTextNode(item.snippet));
            list.appendChild(li);
        }
        spinner.remove();
        results.appendChild(list);
    })
    .catch(err => {
        spinner.remove();
        results.textContent = 'Error: Please try to reload this page';
    });
}


/*
    selectAll(): Select text inside the clicked element.
*/

function selectAll() {
    window.getSelection().selectAllChildren(this);
}


(function () {
    // Code blocks (examples)
    const blocks = document.getElementsByClassName('code--');
    for (let i = 0; i < blocks.length; i++) {
        blocks[i].addEventListener('click', onBtnClick);

        if (preferedLang) {
            const children = blocks[i].children;
            for (let j = 0; j < children.length / 2; j++) {
                if (children[j].textContent.toLowerCase() === preferedLang) {
                    setProgrammingLanguage(children[j], blocks[i]);
                }
            }
        }
    }

    const pathname = location.pathname;
    if (pathname === '/search') {
        const obj = {};
        const pairs = location.search.slice(1).split('&');
        for (let x = 0; x < pairs.length; x++) {
            const pair = pairs[x].split('=');
            obj[pair[0]] = decodeURIComponent(pair[1] || '');
        }
        search(obj.q);
    } else if (pathname === '/synchronization') {
        document.getElementById('seq--selectdb').onchange = function () {
            this.nextElementSibling.className = 'pcode show--' + this.value.toLowerCase();
        };
    }

    const code = document.getElementsByClassName('code');
    for (let i = 0; i < code.length; i++) {
        code[i].addEventListener('click', selectAll);
    }

    /**
    *   A tiny Google Analytics client
    */
    function _ga(o) {
        const time = '' + Date.now();
        let cid = localStorage._ga;
        if (!cid) {
            localStorage._ga = cid = ((Math.random() * 10e7) | 0) + time;
        }

        let d = 'v=1&tid=UA-45595918-2&ds=web&cid=' + cid;
        for (let k in o) {
            d += '&' + k + '=' + o[k];
        }
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/_ga/collect?' + d + '&z=' + time);
        xhr.send();
    }

    _ga({
        t: 'pageview',
        dr: encodeURIComponent(document.referrer),
        dl: encodeURIComponent(location.href), // URL
        dh: encodeURIComponent(location.hostname), // Document Host Name
        dp: encodeURIComponent(location.pathname), // Document Path
        dt: encodeURIComponent(document.title), // Document Title

        // System Info
        sr: screen.width + 'x' + screen.height,
        vp: document.documentElement.clientWidth + 'x' + document.documentElement.clientHeight,
        sd: screen.colorDepth + '-bits',
        ul: navigator.language
    });

})();
