/**
*   @author ScanPay ApS.
**/

function changeCodeEx(evt) {
    const btn = evt.target;
    if (btn.tagName === 'BUTTON') {
        fetchCode(btn.dataset.file, this);
        this.querySelector('.code--example--active')
            .classList.remove('code--example--active');
        btn.classList.add('code--example--active');

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

/*
// Attach events to "run code" buttons
const postmans = document.getElementsByClassName('postman');
for (let i = 0; i < postmans.length; i++) {
    postmans[i].addEventListener('click', postman[postmans[i].dataset.fn]);
}
const postman = {
    'paymentLink': () => {
        fetch('/_v1/new', {
            method: 'POST',
            body: JSON.stringify({
                items: [{
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
*/


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
    document.getElementById('nav--burger').onclick = () => {
        document.getElementById('nav--ul').classList.toggle('show');
    };

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
                    !btn.classList.contains('code--example--active')) {
                    fetchCode(btn.dataset.file, codeSamples[i]);
                    codeSamples[i].querySelector('.code--example--active')
                        .classList.remove('code--example--active');
                    btn.classList.add('code--example--active');
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

    const code = document.getElementsByClassName('code');
    for (let i = 0; i < code.length; i++) {
        code[i].addEventListener('click', selectAll);
    }

    const headings = document.querySelectorAll('h2, h3, h4');
    for (let i = 0; i < headings.length; i++) {
        const target = headings[i];
        if (target.id) {
            target.addEventListener('mouseenter', showHash);
            target.addEventListener('mouseleave', removeHash);
        }
    }

    // TODO: Improve performance and class/ID names
    const pics = document.getElementsByClassName('enlarge');
    for (let i = 0; i < pics.length; i++) {
        pics[i].onclick = imageZoom;
    }

    function imageZoom(e) {
        const bg = document.createElement('div');
        bg.id = 'picbg';
        const img = document.createElement('img');
        img.src = e.target.src;
        bg.appendChild(img);
        bg.onclick = () => {
            document.getElementById('picbg').remove();
        };
        document.body.appendChild(bg);
        document.addEventListener('keydown', (evt) => {
            if (evt.key === 'Escape') {
                const picbg = document.getElementById('picbg');
                if (picbg) { picbg.remove(); }
            }
        }, { once: true });
    }

})();
