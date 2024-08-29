/*
    TODO: switch to flexsearch
*/

const searchURL = '/_gapi/v1?cx=009375899607126965623:qrd_0f4w284&fields=items(title,snippet,link)&q=';
let delayTimer: ReturnType<typeof setTimeout>;

function removeSearchModal() {
    document.getElementById('modal-parent')!.remove();
    document.removeEventListener('keydown', handleEscapeKey);
}

function handleEscapeKey(e: KeyboardEvent) {
    if (e.key === 'Escape') removeSearchModal();
}

function searchInput(e: Event) {
    if (delayTimer) clearTimeout(delayTimer);
    const str = (e.target as HTMLInputElement).value;
    if (str.length < 3) return;
    delayTimer = setTimeout(() => {
        search(str);
    }, 1000);
}

export function showSearchModal(this: HTMLHeadingElement) {
    const parent = document.createElement('div');
    parent.id = 'modal-parent';
    parent.tabIndex = -1;
    parent.role = 'dialog';
    parent.addEventListener('click', (e: Event) => {
        if (e.target === parent) removeSearchModal();
    });
    parent.innerHTML = `{% include "tpl/search.html" %}`;
    document.body.appendChild(parent);

    const input = document.getElementById('search-input') as HTMLInputElement;
    input.focus();
    input.addEventListener('input', searchInput);
    document.addEventListener('keydown', handleEscapeKey);
}

export function search(query: string) {
    const ul = document.getElementById('search-results')!;
    ul.innerHTML = '<li><img src="/img/loading.svg"></li>';

    fetch(searchURL + encodeURI(query))
        .then((res) => res.json())
        .then((o) => {
            if (!o.items || !o.items.length) {
                ul.innerHTML = '<li>No search results.</li>';
            } else {
                let html = '';
                for (let x = 0; x < o.items.length; x++) {
                    html += `<li><h2 class="search--h2"><a href="${o.items[x].link}">${o.items[x].title}</a></h2>${o.items[x].snippet}</li>`;
                }
                ul.innerHTML = html;
            }
        })
        .catch(() => {
            ul.innerHTML = '<li>Error: Please try to reload this page</li>';
        });
}
