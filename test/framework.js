/**
 * A poor man's mocha framework (?)
 * Usage: in `test.js` fst line `const test = require('./framework.js');`
 *  $ node test.js
 */

// hack so it pretends to have HTML features
NodeList = {prototype: {}}
HTMLCollection = {prototype: {}}

// TODO classes don't get defined in node?
assert = {
  eq: function(x, y) {
    const cond = x == y;
    if (!cond) {
      throw { x, y, status: 'fail' };
    }
  }
}

function Wrap(f) {
  return { run: async function() {
    try { await f(); }
    catch(e) { return e; }
  }};
}


async function report(d, func) {
  let r = await func.run();
  if (r) {
    console.error('¬ ', d);
    console.error(' → ', r);
  } else {
    console.log(' ✓ ', d)
  }
}

// Collect functions?
// const funcs = [];
describe = (d, f) => {
  report(d, Wrap(f));
  //funcs.push({d, f: Wrap(f)};
}
