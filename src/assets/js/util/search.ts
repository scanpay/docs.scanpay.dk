/*
    TODO: switch to flexsearch
*/

const searchURL = '/_gapi/v1?cx=009375899607126965623:qrd_0f4w284&fields=items(title,snippet,link)&q=';
let delayTimer: number | undefined;

export function showSearchModal(this: HTMLHeadingElement) {
    const parent = document.createElement('div');
    parent.id = 'modal-parent';
    parent.tabIndex = -1;
    parent.role = 'dialog';

    const modal = document.createElement('div');
    modal.classList.add('modal-dialog');
    modal.role = 'document';

    const input = document.createElement('input');
    input.id = 'modal-search-input';
    input.type = 'search';
    input.placeholder = 'Search the docs';
    input.autocomplete = 'off';
    input.addEventListener('input', (e: Event) => {
        if (delayTimer) clearTimeout(delayTimer);
        const str = (e.target as HTMLInputElement).value;
        if (str.length < 3) return;
        delayTimer = setTimeout(() => {
            search(str);
        }, 1000);
    });
    modal.appendChild(input);

    const ul = document.createElement('ul');
    ul.id = 'search-results';
    modal.appendChild(ul);
    parent.appendChild(modal);
    document.body.appendChild(parent);
    input.focus();
}


export function search(query: string) {
    // const spinner = new Image();
    // spinner.src = '/img/loading.svg';
    // modal.appendChild(spinner);

    const modal = document.createElement('div');
    modal.id = 'search-modal';

    const spinner = new Image();
    spinner.src = '/img/loading.svg';
    modal.appendChild(spinner);

    const ul = document.createElement('ul');
    ul.id = 'search-results';
    modal.appendChild(ul);
    document.body.appendChild(modal);

    fetch(searchURL + encodeURI(query))
        .then(res => res.json())
        .then((o) => {
            if (!o.items) {
                ul.innerHTML = '<li>No search results.</li>';
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
            ul.appendChild(list);
        })
        .catch(() => {
            spinner.remove();
            ul.innerHTML = '<li>Error: Please try to reload this page</li>';
        });
}
