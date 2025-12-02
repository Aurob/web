//TODO
// add breadcrumbs
// search


const html = `
    <div id="nav">
        <div class="edge et"></div>
        <div class="edge eb"><div id="wr-widget"></div></div>
        <div class="edge el"></div>
    </div>
`;

document.body.style.padding = '2em';
const tempDiv = document.createElement('div');
tempDiv.innerHTML = html;
Array.from(tempDiv.children).forEach(child => document.body.appendChild(child));

const classMap = {
    Top: 'et',
    Bottom: 'eb',
    Left: 'el'
};

const ebLinks = [''];
let firstPathSegment = window.location.pathname.split('/').filter(Boolean)[0];
if (firstPathSegment && !firstPathSegment.includes('.')) {
    firstPathSegment = undefined;
}
const DOMAIN_ROOT = firstPathSegment ? `/${firstPathSegment}/` : '/';
const rootPath = window.location.pathname.split('/').filter(Boolean);

async function fetchSitemap(path = '', format = 'json') {
    const sitemapFile = format === 'xml' ? 'sitemap.xml' : 'sitemap.json';
    try {
        const response = await fetch(`${DOMAIN_ROOT}${path}${sitemapFile}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        // store in session storage
        sessionStorage.setItem('sitemap', JSON.stringify(data));

        buildUI(data);
        return data;
    } catch (error) {
        console.error('Failed to fetch sitemap:', error);
        return null;
    }
}

function buildUI(data) {
    const et = document.querySelector(`.${classMap.Top}`);
    const el = document.querySelector(`.${classMap.Left}`);
    const currentPath = rootPath.join('/');

    // Clear existing content
    et.innerHTML = '';
    el.innerHTML = '';

    // Function to create and append links if they don't already exist
    const createLink = (text, href, parent, styles = {}) => {
        if (!Array.from(parent.children).some(child => child.href === href)) {
            const a = document.createElement('a');
            a.href = href;
            a.innerHTML = text;

            // Apply optional styles
            if (styles.color) a.style.color = styles.color;
            // Apply any other styles passed in the styles object
            Object.entries(styles).forEach(([property, value]) => {
                if (property !== 'color') { // Skip color as it's already handled
                    a.style[property] = value;
                }
            });

            parent.appendChild(a);
        }
    };

    // Add "back" link if on 3rd level or deeper
    if (rootPath.length > 1) {
        // console.log(DOMAIN_ROOT, rootPath, currentPath);
        const parentPath = rootPath.slice(0, -1).join('/');
        // Make back link stand out with bold text and a slightly different color
        createLink('back', `../`, et, {
            fontWeight: 'bold',
            color: '#D4AF37',
            textDecoration: 'underline'
        });
    }

    // Add "home" link if not on the homepage
    if (currentPath !== firstPathSegment) {
        createLink('home', DOMAIN_ROOT, et);
    }

    // Always add root-level links to .et
    Object.keys(data).forEach(key => {
        if (key === '.' || ebLinks.includes(key)) return;
        const href = key === 'home' ? `${DOMAIN_ROOT}` : `${DOMAIN_ROOT}${key}/`;
        createLink(key, href, et);
    });

    // Determine the current hierarchy and display appropriate links
    let currentData = data;
    let parentHref = DOMAIN_ROOT;
    let isRoot = currentPath == firstPathSegment || rootPath.length === 0;

    rootPath.forEach((segment, index) => {
        if (segment === firstPathSegment) return;

        if (currentData && currentData[segment]) {
            currentData = currentData[segment];
            parentHref += `${segment}/`;

            // If not the last segment, add to .et
            // if (index < rootPath.length - 1) {
            //     createLink(segment, parentHref, et);
            // }
        } else {
            currentData = null;
        }
    });

    // Populate .el with first-level children of the current path only if not at root
    if (!isRoot && currentData && typeof currentData === 'object') {
        sessionStorage.setItem('subpages', JSON.stringify(currentData));
        for (let i = 0; i < Object.keys(currentData).length; i++) {
            const childKey = Object.keys(currentData)[i];
            const childHref = `${parentHref}${childKey}/`;
            createLink(childKey, childHref, el);
        }

        document.body.style.paddingLeft = `${el.clientWidth + el.clientWidth / 10}px`;
        window.addEventListener('resize', () => {
            document.body.style.paddingLeft = `${el.clientWidth + el.clientWidth / 10}px`;
        });

    }

    const eb = document.querySelector(`.${classMap.Bottom}`);
    // add copyright notice with year and link to license
    const year = new Date().getFullYear();
    const copyrightSpan = document.createElement('span');
    copyrightSpan.id = 'year';
    copyrightSpan.innerHTML = `&copy; ${year}`;
    eb.appendChild(copyrightSpan);

}

function loadScript(url, callback) {
    const script = document.createElement("script");
    script.src = url;
    script.onload = () => callback && callback();
    document.head.appendChild(script);
}


window.addEventListener('load', ()=>{
    fetchSitemap();
    loadScript("/webring/wr.js", () => {
        console.log("wr.js loaded");
    });
})

