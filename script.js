//TODO
// add breadcrumbs
// search


const styles = `
    :root {
        --global-blue: color(display-p3 0.231 0.309 0.355);
        --global-white: color(display-p3 0.985 0.985 0.95);
        --global-orange: color(display-p3 1 0.6 0.4);
        --global-yellow: color(display-p3 0.95 0.85 0.5);
    }

    html {
        font-family: monospace;
        height: 100%;
        width: 100%;
        background-color: black !important;
    }
    
    body {
        margin: 0;
        padding: 0;
        color: var(--global-white);
        background-color: var(--global-blue);
        position: relative; /* Establish a containing block for absolute positioning */
        z-index: -3;
        min-height: 100vh; /* Ensures at least full viewport height */
        /* width: 100%; */
        overflow-x: hidden;
        height: auto; /* Let content grow, but min-height keeps at least 100% */
    }

    body a {
        color: var(--global-yellow);
    }
        
    
    #content {
        width: 65vw;
        margin: 1em;
    }
        
    @media (max-width: 768px) {
        body {
            min-height: 100vh; /* Ensure body takes full viewport height on mobile */
        }
    }

    body.light {
        background-color: #f0f0f0;
        color: #333;
    }

    body.dark {
        background-color: #555252;
        color: #f0f0f0;
    }

    a {
        color: inherit;
    }
    
    .edge {
        width: 100%;
        height: 100%;
        padding: .25em;
    }

    .el {
        color: var(--global-white);
        background-color: transparent;
        border: solid var(--global-blue);
        position: fixed; /* Change to fixed to ensure it fills the viewport height */
        display: flex;
        flex-direction: column;
        left: 0;
        top: 0;
        width: fit-content;
        height: 100vh; /* Fill the viewport height */
        align-content: center;
        z-index: -1;
        border-right: outset .01em;
    }

    .el > a {
        padding-left: .5em;
        padding-top: 2em;
    }

    .et {

        color: var(--global-white);
        background-color: var(--global-blue);
        border: solid var(--global-blue);
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 1em;
        z-index: 1;
        border-bottom: outset .01em;
        padding-left: 1em;
    }

    et > * {
        position: fixed;
    }


    .eb {

        color: var(--global-white);
        background-color: transparent;
        border: solid var(--global-blue);
        position: fixed; /* Fixed to bottom as footer */
        bottom: 0;
        left: 0;
        width: 100%;
        height: 1em;
        z-index: 2;
        border-top: outset .01em;
        padding-right: 1em;
    }

    .eb #year {
        float: right;
        padding-right: 1em;
    }

    .edge > a {
        padding-right: .5em;
    }
`;


const html = `
    <div id="nav">
        <div class="edge et"></div>
        <div class="edge eb"></div>
        <div class="edge el"></div>
    </div>
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

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

window.addEventListener('load', ()=>{    // Initialize the sitemap fetch and UI build
    fetchSitemap();
})

