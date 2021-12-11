// hack so it pretends to have HTML features
const test = require('./framework.js');
const inc = require('../util/include');


describe('Promise', async () => {
  let x = await Promise.try(x => x, 1);
  assert.eq(x, 1);
});


