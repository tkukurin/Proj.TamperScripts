console.log('Vim shortcuts loaded');

const SCROLL_BY = 50;
const INPUT_TAGS = ['INPUT', 'TEXTAREA'];

let state = null;
window.addEventListener('keydown', e => {
  if (INPUT_TAGS.indexOf(document.activeElement.tagName) >= 0) {
    return;
  }

  let scrollY = 0;
  let scrollX = 0;
  switch (e.key) {
    // up
    case 'k': case 'w': scrollY = -SCROLL_BY; break;
    case 'u': scrollY = -SCROLL_BY * 2; break;

    // down
    case 'j': case 's': scrollY = SCROLL_BY; break;
    case 'd': scrollY = SCROLL_BY * 2; break;

    // left / right
    case 'l': scrollX = SCROLL_BY; break;
    case 'h': scrollX = -SCROLL_BY; break;

    // full (doesn't work if scrollHeight undefined, e.g. YouTube)
    case 'G': scrollY = document.body.scrollHeight; break;
    case 'g': scrollY = (state === 'g') * -document.body.scrollHeight; break;

    // history
    case 'H': return window.history.back();
    case 'L': return window.history.forward();
  }

  window.scrollBy(scrollX, scrollY);
  state = state == e.key ? null : e.key;
}, false);


