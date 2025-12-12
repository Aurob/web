const SITES_BACKUPS = [
    'https://cdn.dump.garden/wr/sites.txt?' + Math.random(),
    'https://wr.dump.garden/wr/sites.txt?' + Math.random(),
    'https://git.sr.ht/~rau/wr/blob/main/sites.txt?' + Math.random()
];
let sites_url = null;
let sites = [];
let site_index = -1;

async function fetchFirstValid(urls) {
    for (const url of urls) {
        try {
            const resp = await fetch(url);
            if (resp.ok) {
                sites_url = url;
                const data = await resp.text();
                sites = data.split('\n').map(x => x.trim()).filter(x => x !== '');
                return;
            }
        } catch (e) {
            continue;
        }
    }
}

function createWidget() {
    let widget_el = document.querySelector('#wr-widget');
    if (!widget_el) {
        widget_el = document.createElement('div');
        widget_el.id = 'wr-widget';

        if (!document.body) {
            const body = document.createElement('body');
            document.documentElement.appendChild(body);
        }
        document.body.appendChild(widget_el);
    } else {
        widget_el.innerHTML = "";
    }

    // widget_el.style.position = 'fixed';
    widget_el.style.width = 'fit-content';

    // Calculate prev/next indices with wrap-around
    const prevIndex = (site_index === 0) ? sites.length - 1 : site_index - 1;
    const nextIndex = (site_index === sites.length - 1) ? 0 : site_index + 1;

    function setButtonTitle(btn, link, label, noSiteMsg) {
        if (link) {
            btn.title = `${label}: ${link}`;
            btn.setAttribute('aria-label', `${label}: ${link}`);
        } else {
            btn.title = noSiteMsg;
            btn.setAttribute('aria-label', noSiteMsg);
        }

        btn.style.fontSize = 'clamp(12px, 4vw, 16px)';
    }


    const prevBtn = document.createElement('button');
    prevBtn.id = 'pbut';
    prevBtn.textContent = '◄';
    // let a = document.createElement('a');
    // a.innerText = '◄';
    // a.href = sites[prevIndex];

    const randBtn = document.createElement('button');
    randBtn.id = 'rbut';
    randBtn.textContent = '✦';

    const nextBtn = document.createElement('button');
    nextBtn.id = 'nbut';
    nextBtn.textContent = '►';

    widget_el.appendChild(prevBtn);
    widget_el.appendChild(randBtn);
    widget_el.appendChild(nextBtn);

    let this_host = window.location.host;
    site_index = -1;

    for (let i = 0; i < sites.length; ++i) {
        try {
            let site_url = new URL(sites[i]);
            if (this_host === site_url.host) {
                site_index = i;
                break;
            }
        } catch (e) {
            continue;
        }
    }

    // If not found, treat as first in the list
    if (site_index === -1) {
        site_index = 0;
    }


    setButtonTitle(prevBtn, sites[prevIndex], 'Previous', 'No previous site');
    randBtn.title = sites.length > 1 ? 'Random site' : 'No random site available';
    randBtn.setAttribute('aria-label', randBtn.title);
    setButtonTitle(nextBtn, sites[nextIndex], 'Next', 'No next site');

    setButtonTitle(randBtn);

    prevBtn.disabled = false;
    nextBtn.disabled = false;

    prevBtn.addEventListener('click', () => {
        window.location = sites[prevIndex];
    });

    randBtn.addEventListener('click', () => {
        let rand_sites = sites.slice();
        rand_sites.splice(site_index, 1); // Remove current site
        if (rand_sites.length > 0) {
            let choice = Math.floor(Math.random() * rand_sites.length);
            window.location = rand_sites[choice];
        }
    });

    nextBtn.addEventListener('click', () => {
        window.location = sites[nextIndex];
    });
}

async function init() {
    await fetchFirstValid(SITES_BACKUPS);
    if (sites.length > 0) {
        createWidget();
    }
}

init();
