/* Start of Selection */

const styles = `
        html {
            font-family: 'Arial', sans-serif;
            height: 100%;
            width: 100%;
            background-color: black !important;
        }
        body {
            margin: 0;
            padding: 0;
            background-color: #555252;
            color: #f0f0f0;
            position: relative; /* Establish a containing block for absolute positioning */
            z-index: -3;
            height: 100%;
            width: 100%;
            overflow-x: hidden;
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

        .er {
            background-color: #f12fa0;
            position: fixed; /* Change to fixed to ensure it fills the viewport height */
            right: 0;
            top: 0;
            width: 2em; /* Always show a sliver */
            height: 100vh; /* Fill the viewport height */
            align-content: center;
            z-index: -2;
            transition: width 0.3s; /* Smooth transition */
            color: transparent; /* Hide text */
            overflow: hidden; /* Hide overflow */
            border-left:outset .01em;
        }

        .er:hover {
            width: fit-content; /* Show full on hover */
            color: black; /* Show text */
        }

        .el {
            background-color: #a9be00;
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
            background-color: #00a9be;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 1em;
            z-index: 1;
            border-bottom: outset .01em;
        }


        .eb {
            background-color: #c3b0d3;
            position: fixed; /* Fixed to bottom as footer */
            bottom: 0;
            left: 0;
            width: 100%;
            height: 1em;
            z-index: 2;
            border-top: outset .01em;
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
        <div class="edge et"></div>
        <div class="edge eb"><a href="mailto:pm@rau.dev">pm@rau.dev</a></div>
        <div class="edge er"></div>
        <div class="edge el"></div>
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
    Right: 'er',
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
    const er = document.querySelector(`.${classMap.Right}`);
    const currentPath = rootPath.join('/');

    // Clear existing content
    et.innerHTML = '';
    el.innerHTML = '';
    er.innerHTML = '';

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
        if(segment === firstPathSegment) return;

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

    console.log(currentPath, firstPathSegment, rootPath)
    // Populate .el with first-level children of the current path only if not at root
    if (!isRoot && currentData && typeof currentData === 'object') {
        sessionStorage.setItem('subpages', JSON.stringify(currentData));
        for (let i = 0; i < Object.keys(currentData).length; i++) {
            const childKey = Object.keys(currentData)[i];
            const childHref = `${parentHref}${childKey}/`;
            createLink(childKey, childHref, el);
        }

        document.body.style.paddingLeft = `${el.clientWidth+el.clientWidth/10}px`;
        window.addEventListener('resize', () => {
            document.body.style.paddingLeft = `${el.clientWidth+el.clientWidth/10}px`;
        });
    
    }


    const eb = document.querySelector(`.${classMap.Bottom}`);
    // ebLinks.forEach(link => {
    //     const href = `${DOMAIN_ROOT}${link}/`;
    //     createLink(link, href, eb);
    // });

    // add copyright notice with year and link to license
    const year = new Date().getFullYear();
    const copyrightSpan = document.createElement('span');
    copyrightSpan.id = 'year';
    copyrightSpan.innerHTML = `&copy; ${year} <a href="${DOMAIN_ROOT}LICENSE.txt" target="_blank">Unlicense</a>`;
    eb.appendChild(copyrightSpan);
    

}
/* End of Selection */

// Initialize the sitemap fetch and UI build
fetchSitemap();

// slightly shift hue of background color over time smoothly using sin/cos
let time = (new Date()).getTime() / 1000; // Start time

function updateBackgroundColor() {
    const baseColor = { r: 85, g: 82, b: 82 }; // Base greyish color
    const hueShift = 10; // Amount to shift hue
    const r = Math.floor(baseColor.r + hueShift * Math.sin(time));
    const g = Math.floor(baseColor.g + hueShift * Math.cos(time));
    const b = Math.floor(baseColor.b + hueShift * Math.sin(time + Math.PI / 2));

    const styleElement = document.getElementById('dynamic-style');
    styleElement.textContent = `
        html, body { 
            background-color: rgb(${r}, ${g}, ${b}); 
        }
        
        .et { background-color: rgb(${r - 20}, ${g - 20}, ${b - 20}); } /* Darker */
        .er { background-color: rgb(${r - 25}, ${g - 25}, ${b - 25}); } /* Darker */
        .el { background-color: rgb(${r - 30}, ${g - 30}, ${b - 30}); } /* Darker */
        .eb { background-color: rgb(${r - 35}, ${g - 35}, ${b - 35}); } /* Darker */
    `;
    time += 1; // Increment time for smooth transition
}

const styleElement = document.createElement('style');
styleElement.id = 'dynamic-style';
document.head.appendChild(styleElement);

// setInterval(updateBackgroundColor, 1000);
updateBackgroundColor();
