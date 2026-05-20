/**
 *   @author ScanPay ApS.
 **/

import { showSearchModal } from './util/search';

(() => {
    /*
        When a heading (h2-h4) is hovered, a link icon is shown.
    */
    const headings = document.querySelectorAll<HTMLHeadingElement>('h2, h3, h4');
    headings.forEach((heading) => {
        const a = document.createElement('a');
        a.className = 'hlink';
        a.href = '#' + heading.id;
        const img = new Image();
        img.src = '/img/link.svg';
        a.appendChild(img);
        heading.appendChild(a);
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
})();
