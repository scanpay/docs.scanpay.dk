/**
*   @author ScanPay ApS.
**/

// Very simple fetch polyfill (for Safari < 10.1)
if (!window.fetch) {
    window.fetch = url => new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.onload = () => {
            resolve({
                text() {
                    return xhr.responseText;
                },
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

function changeCodeEx(evt) {
    const btn = evt.target;
    if (btn.tagName === 'BUTTON') {
        fetchCode(btn.dataset.file, this);
        this.querySelector('.code--active').classList.remove('code--active');
        btn.classList.add('code--active');

        if (btn.dataset.lang) {
            sessionStorage.setItem('lang', btn.dataset.lang);
        }
    }
}

function fetchCode(file, div) {
    div.classList.add('code--loading');
    fetch('/a/' + file)
        .then(res => res.text())
        .then((txt) => {
            div.querySelector('.code--code').innerHTML = txt;
            div.classList.remove('code--loading');
        });
}

// selectAll(): Select text inside the clicked element.
function selectAll() {
    window.getSelection().selectAllChildren(this);
}

const postman = {
    'paymentLink': () => {
        fetch('{{ proxy }}https://docs.scanpay.dk/_v1/new', {
            method: 'POST',
            body: JSON.stringify({
                items: [{
                    name: 'test',
                    quantity: 2,
                    total: '159.95 DKK'
                }]
            })
        }).then(res => res.json().then((o) => {
            if (confirm('You just created a payment link on our test environment. ' +
                'Do you want to check it out? ' + o.url)) {
                window.location.href = o.url;
            }
        })).catch(() => {
            alert('Sorry. The test environment is offline. Try again later.');
        });
    }
};

function showHash() {
    const a = document.createElement('a');
    a.className = 'hlink';
    a.href = '#' + this.id;
    const img = new Image();
    img.src = '/img/link.svg';
    a.appendChild(img);
    this.appendChild(a);
}

function removeHash() {
    this.querySelector('.hlink').remove();
}


(() => {
    const prefLang = sessionStorage && sessionStorage.getItem('lang');

    // Code examples
    const codeSamples = document.getElementsByClassName('code--');
    for (let i = 0; i < codeSamples.length; i++) {
        codeSamples[i].addEventListener('click', changeCodeEx);

        if (prefLang) {
            const children = codeSamples[i].children;
            for (let j = 0; j < children.length - 1; j++) {
                const btn = children[j];
                if (btn.dataset.lang === prefLang &&
                    !btn.classList.contains('code--active')) {
                    fetchCode(btn.dataset.file, codeSamples[i]);
                    codeSamples[i].querySelector('.code--active')
                        .classList.remove('code--active');
                    btn.classList.add('code--active');
                }
            }
        }
    }

    const egSync = document.getElementById('eg--sync');
    if (egSync) {
        egSync.onchange = (e) => {
            fetchCode('/sync/db.' + e.target.value.toLowerCase() +
             '.html', e.target.parentNode);
        };
    }

    // Attach events to "run code" buttons
    const postmans = document.getElementsByClassName('postman');
    for (let i = 0; i < postmans.length; i++) {
        postmans[i].addEventListener('click', postman[postmans[i].dataset.fn]);
    }

    const code = document.getElementsByClassName('code');
    for (let i = 0; i < code.length; i++) {
        code[i].addEventListener('click', selectAll);
    }

    const headings = document.querySelectorAll('h2, h3, h4');
    for (let i = 0; i < headings.length; i++) {
        headings[i].addEventListener('mouseenter', showHash);
        headings[i].addEventListener('mouseleave', removeHash);
    }

    /**
    *   A tiny Google Analytics client (Measurement Protocol)
    */
    function _ga(o) {
        const time = Date.now();
        let cid = localStorage._ga;
        if (!cid) {
            // Pseudo-unique string with 32 chars UUIDv4 w/o hyphens.
            localStorage._ga = cid = (Math.random() +
                '00000000000000000000').substring(2, 21) + time;
        }
        let url = '/_ga/collect?v=1&tid=UA-45595918-2&ds=web&cid=' +
                    cid + '&z=' + time;
        for (const k in o) {
            url += '&' + k + '=' + o[k];
        }
        fetch(url);
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
        vp: document.documentElement.clientWidth + 'x' +
            document.documentElement.clientHeight,
        sd: screen.colorDepth + '-bits',
        ul: navigator.language
    });

})();
