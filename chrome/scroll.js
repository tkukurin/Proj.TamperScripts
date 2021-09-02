console.log('Vim shortcuts loaded');


let state = null;

window.addEventListener('keydown', e => {
  const AMOUNT = 40;

  let scrollY = 0;
  let scrollX = 0;
  switch (e.key) {
    // up
    case 'k': case 'w': scrollY = -AMOUNT; break;
    case 'u': scrollY = -AMOUNT * 2; break;

    // down
    case 'j': case 's': scrollY = AMOUNT; break;
    case 'd': scrollY = AMOUNT * 2; break;

    // left / right
    case 'l': scrollX = AMOUNT; break;
    case 'h': scrollX = -AMOUNT; break;

    case 'G': scrollY = document.body.scrollHeight; break;
    case 'g': scrollY = (state === 'g') * -document.body.scrollHeight; break;
  }

  window.scrollBy(scrollX, scrollY);
  state = state == e.key ? null : e.key;
}, false);


