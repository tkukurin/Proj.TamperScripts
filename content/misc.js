function lowestCommonAncestor(node1, node2) {
    const ancestors1 = [];
    let current = node1;
    while (current) {
        ancestors1.push(current);
        current = current.parentElement;
    }
    current = node2;
    while (current) {
        if (ancestors1.includes(current)) {
            return current;
        }
        current = current.parentElement;
    }
    return null;
}

function calculateDistance(node, ancestor) {
    let distance = 0;
    let current = node;
    while (current && current !== ancestor) {
        distance++;
        current = current.parentElement;
    }
    return {node, distance};
}

function nodeDistance(node, headings) {
    return headings.map(targetNode => {
        const lca = lowestCommonAncestor(node, targetNode);
        if (!lca) return 99999;
        const m1 = calculateDistance(node, lca);
        const m2 = calculateDistance(targetNode, lca);
        return {n1: node, n2: targetNode, d: m1.distance + m2.distance};
    });
}

window.onkeyup = document.onkeyup = Shortcut.init({
  a: [
    Shortcut.fun('c', () => {
      // alt-c copies meta-info along with text.
      let sel = window.getSelection();
      let node = sel.anchorNode;
      let urls = [window.location.href];
      let wHref= window.location.href.slice(0, window.location.href.lastIndexOf('#'))
      // TODO decide whether to keep this
      let hrefs = Array.from(document.querySelectorAll('a')).filter(
        a => a.href && a.href.includes('#'));
      let cands = nodeDistance(node, hrefs);
      let closest = cands.reduce((a, b) => a.d < b.d ? a : b).n2;
      if (closest && closest.href) {
        urls.push(
          closest.href.startsWith('#') 
          ? `${wHref}${closest.href}` : closest.href);
      }
      while (node) {
        if (node.id) {
          urls.push(`${wHref}#${node.id}`)
        }
        node = node.parentElement;
      }
      let src = 'src: ' + urls.join('\nsrc: ');
      let text = `${src}\n\n${sel.toString()}`;
      // document.execCommand('copy')
      navigator.clipboard.writeText(text);
      console.log(text)
      Util.toast('Copied with source')
    })
  ]
})
