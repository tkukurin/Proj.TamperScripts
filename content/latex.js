/*
 * Extracts LaTex from a page using some reasonable heuristics.
 * See last block for how to invoke.
 */
function extractLatex() {
  // Common math element classes and data attributes
  const mathSelectors = [
    '.MathJax',
    '.latex', 
    '.math',
    '.mwe-math-element',
    '[data-math]',
    'math',
    '.math-inline',
    '.math-display'
  ].join(',');
  
  const elements = document.querySelectorAll(mathSelectors);
  const latex = [];

  // Extract from elements
  elements.forEach(el => {
    // Check for TeX annotation
    const texAnnotation = el.querySelector('annotation[encoding="application/x-tex"]');
    if (texAnnotation) {
      latex.push(texAnnotation.textContent);
      return;
    }

    // Check data attributes
    for (const attr of ['data-latex', 'data-math', 'data-tex']) {
      const value = el.getAttribute(attr);
      if (value) {
        latex.push(value);
        return;
      }
    }

    // Direct text content if no other source found
    if (el.textContent.includes('\\') || el.textContent.includes('\\(') || 
        el.textContent.includes('\\[')) {
      latex.push(el.textContent);
    }
  });

  // Find delimited LaTeX in text
  const delimiters = [
    /\$[^$]+\$/g,                // Single $
    /\$\$[^$]+\$\$/g,            // Double $$
    /\\\([^)]+\\\)/g,            // \( \)
    /\\\[[^]]+\\\]/g,            // \[ \]
    /\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g  // \begin \end
  ];

  const textNodes = document.evaluate('//text()', document.body, null, 
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

  for (let i = 0; i < textNodes.snapshotLength; i++) {
    const text = textNodes.snapshotItem(i).textContent;
    delimiters.forEach(regex => {
      const matches = text.match(regex) || [];
      latex.push(...matches);
    });
  }

  return [...new Set(latex)].filter(Boolean);
}

function latexToMarkdown(latexList) {
  return latexList.map(latex => {
    // Strip existing delimiters
    latex = latex.replace(/^\$\$|\$\$$/g, '')
                 .replace(/^\$|\$$/g, '')
                 .replace(/^\\\(|\\\)$/g, '')
                 .replace(/^\\\[|\\\]$/g, '');
    // Use $$ for display math
    const isDisplayMath = /\\begin|\\\\|\\[|\\]|\\displaystyle/.test(latex);
    return isDisplayMath ? `$$${latex}$$` : `$${latex}$`;
  }).join('\n\n');
}

(function() {
  document.onkeyup = Shortcut.init({
    a: [
      Shortcut.fun('l', () => {
        Util.inputBox(e => {
          console.log(e);
        });
        let l = extractLatex();
        let md = latexToMarkdown(l);
        navigator.clipboard.writeText(md);
        Util.toast(`Copied markdown latex ${l.length}`);
      })
    ],
  });
})();
