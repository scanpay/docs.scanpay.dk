/**
*   @author ScanPay ApS.
**/

function search(query) {
    const results = document.getElementById('search--ul');
    const spinner = document.getElementById('search--loading');

    if (!query) {
        results.textContent = 'No search results.';
        spinner.remove();
        return;
    }

    const url = '/_gapi/v1?cx=009375899607126965623:qrd_0f4w284&' +
        'fields=items(title,snippet,link)&q=';

    fetch(url + encodeURI(query))
        .then(res => res.json())
        .then((o) => {
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
        .catch(() => {
            spinner.remove();
            results.textContent = 'Error: Please try to reload this page';
        });
}

(() => {
    const obj = {};
    const pairs = location.search.slice(1).split('&');
    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split('=');
        obj[pair[0]] = decodeURIComponent(pair[1] || '');
    }
    search(obj.q);
})();
