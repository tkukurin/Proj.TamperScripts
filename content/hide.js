// Just remove selectors.
// Useful for junk parts of websites.
let baseSites = [
    'www.facebook.com',
];
let fullSites = []

let rmAll = (loc) => fullSites.indexOf(loc.hostname) >= 0;
let rmNow = (loc) => loc.pathname == '/' || rmAll(loc);

if (rmAll(window.location)) {
    const style = document.createElement('style');
    style.textContent = 'div[role="main"] { display: none !important; }';
    document.head.appendChild(style);
}

let doRm = (w) => document.querySelectorAll('div[role="main"]').forEach(element => {
    if (rmNow(w.location)) element.remove();
});

doRm(window)

// Create a Mutation Observer to watch for new elements with role="main"
const observer = new MutationObserver((mutationsList, observer) => {
    doRm(window)
    /*
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.matches('div[role="main"]')) {
                    node.remove();
                }
            });
        }
    }*/
});

observer.observe(document.body, { childList: true, subtree: true });
