//TODO
// add breadcrumbs
// search

function buildUI(data) {


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

    // TODO check if the nav elements exist
    const et = document.querySelector(`.${classMap.Top}`);
    const el = document.querySelector(`.${classMap.Left}`);
    const currentPath = rootPath.join('/');

    // Clear existing content
    et.innerHTML = '';
    el.innerHTML = '';

    // Determine the current hierarchy and display appropriate links
    let dataCopy = data;
    let parentHref = DOMAIN_ROOT;
    let isRoot = currentPath == firstPathSegment || rootPath.length === 0;
    // rootPath.forEach((segment, index) => {
    let page_subs = dataCopy;

    let prev_path = rootPath.slice(-2,1)[0];
    let current_path = rootPath.slice(-1)[0]
    
    // Function to create and append links if they don't already exist
    const createLink = (text, href, parent) => {
        if (!Array.from(parent.children).some(child => child.href === href)) {
            const a = document.createElement('a');
            a.href = href;
            a.innerHTML = text;

            if(currentPath != '' && text == 'home') {
                a.style.color = 'var(--global-orange)';
            }
            
            parent.appendChild(a);
        }
    };

    // Add "back" link if on 3rd level or deeper
    if (rootPath.length > 1) {
        // console.log(DOMAIN_ROOT, rootPath, currentPath);
        const parentPath = rootPath.slice(0, -1).join('/');
        // Make back link stand out with bold text and a slightly different color
        createLink('back', `../`, et);
    }

    // Add "home" link if not on the homepage
    if (currentPath !== firstPathSegment) {
        // console.log(firstPathSegment, currentPath)
        createLink('home', DOMAIN_ROOT, et);
    }

    // Always add root-level links to .et
    Object.keys(data).forEach(key => {
        if (key === '.' || ebLinks.includes(key)) return;
        const href = key === 'home' ? `${DOMAIN_ROOT}` : `${DOMAIN_ROOT}${key}/`;
        createLink(key, href, et);
    });

    for(let s = 0; s < rootPath.length; s++) {
        let segment = rootPath[s];
        // if (segment === firstPathSegment) return;
        if (page_subs && page_subs[segment]) {
            let show_siblings = false;

            if(segment in page_subs) {
                // console.log(segment, page_subs, rootPath)

            //     console.log(segment, rootPath.slice(-1))
            //     // if(rootPath.length < 1 && segment == rootPath.slice(-1)) continue;
            //     for(let sub of sub_keys) {
            //         if(rootPath.length > 1) {
            //             console.log(rootPath, rootPath.length, sub)
            //         }
            //     }
            }
            page_subs = page_subs[segment];
            parentHref += `${segment}/`;

            // If not the last segment, add to .et
            // if (index < rootPath.length - 1) {
            //     createLink(segment, parentHref, et);
            // }
        } 
        else {
            page_subs = null
        }
    }

    // Populate .el with first-level children of the current path only if not at root
    if (!isRoot && page_subs && typeof page_subs === 'object') {
        sessionStorage.setItem('subpages', JSON.stringify(page_subs));
        let sub_keys = Object.keys(page_subs);
        // if(sub_keys)
        let is_sibling = false;
        if(Object.keys(dataCopy).includes(prev_path)) {
            // console.log(prev_path, Object.keys(dataCopy), dataCopy[prev_path])
            sub_keys = Object.keys(dataCopy[prev_path]);
            is_sibling = current_path in dataCopy[prev_path];
        }

        for (let i = 0; i < sub_keys.length; i++) {
            let childKey = sub_keys[i];
            let childHref = '';
            // console.log(is_sibling, parentHref, childKey, current_path)
            if(is_sibling) {
                childHref = '../'+childKey
            }
            else {
                childHref = `${parentHref}${childKey}`;
            }

            createLink(childKey, childHref, el);
        }

        document.body.style.paddingLeft = `${el.clientWidth + el.clientWidth / 10}px`;
        window.addEventListener('resize', () => {
            document.body.style.paddingLeft = `${el.clientWidth + el.clientWidth / 10}px`;
        });

    }

    const eb = document.querySelector(`.${classMap.Bottom}`);

    const other_site_links = document.createElement('span');
    eb.appendChild(other_site_links);
    // add copyright notice with year and link to license
    const year = new Date().getFullYear();
    const copyrightSpan = document.createElement('span');
    copyrightSpan.id = 'year';
    copyrightSpan.innerHTML = `&nbsp;&copy; ${year}`;
    eb.appendChild(copyrightSpan);
    

}

function loadScript(url, callback) {
    const script = document.createElement("script");
    script.src = url;
    script.onload = () => callback && callback();
    document.head.appendChild(script);
}

// -----------------------------------------

window.addEventListener('load', ()=>{
    // fetchSitemap();

    // let SITEMAP = sessionStorage.getItem('sitemap');
    // if (!SITEMAP) {
        SITEMAP = {
            ".": {},
            "webring": {},
            "photo": {},
            "music": {},
            "books": {},
            "links": {
                "articles": {}
            },
            "genart": {},
            // "doodles": {},
            "advent": {
                "day1": {},
                "day2": {},
                "day3": {},
                "day4": {},
                "day5": {},
                "day6": {},
                "day7": {}
            },
        };
        // sessionStorage.setItem('sitemap', JSON.stringify(SITEMAP));
    // }
    // else {
    //     SITEMAP = JSON.parse(SITEMAP);
    // }
    buildUI(SITEMAP);


    loadScript("https://cdn.dump.garden/wr/wr.js?", () => {
        console.log("wr.js loaded");
    });
})




// async function fetchSitemap(path = '', format = 'json') {
//     const sitemapFile = format === 'xml' ? 'sitemap.xml' : 'sitemap.json';
//     try {
//         const response = await fetch(`${DOMAIN_ROOT}${path}${sitemapFile}`);
//         if (!response.ok) throw new Error('Network response was not ok');
//         const data = await response.json();
//         // store in session storage
//         sessionStorage.setItem('sitemap', JSON.stringify(data));

//         buildUI(data);
//         return data;
//     } catch (error) {
//         console.error('Failed to fetch sitemap:', error);
//         return null;
//     }
// }
