/**
 *   @author ScanPay ApS.
 **/

import { search, showSearchModal } from './util/search';

function showHeadingLink(this: HTMLElement) {
    const a = document.createElement('a');
    a.className = 'hlink';
    a.href = '#' + this.id;
    const img = new Image();
    img.src = '/img/link.svg';
    a.appendChild(img);
    this.appendChild(a);
}

function removeHeadingLink(this: HTMLElement) {
    const link = this.querySelector('.hlink');
    if (link) link.remove();
}

(() => {
    /*
        When a heading (h2-h4) is hovered, a link icon is shown.
    */
    const headings = document.querySelectorAll<HTMLHeadingElement>('h2, h3, h4');
    headings.forEach((heading) => {
        heading.addEventListener('mouseenter', showHeadingLink);
        heading.addEventListener('mouseleave', removeHeadingLink);
    });

    /*
        CSS hides the sidebar on small screens. Instead a burger is shown.
        Add an event listener to the burger.
    */
    document.getElementById('nav--burger')!.onclick = () => {
        document.getElementById('nav--ul')!.classList.toggle('show');
    };

    /*
        Add event listener to the search input.
    */
    document.getElementById('nav--search--input')!.addEventListener('click', showSearchModal);

    /*
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
    */
})();
