// hack so it pretends to have HTML features
const test = require('./framework.js');
const inc = require('../util/include');


describe('Promise', async () => {
  let x = await Promise.try(x => x, 1);
  assert.eq(x, 1);
});

describe('basic insert works for SortedArray', () => {
  let sc = new inc.SortedArray([{a:1}, {a:20}, {a:30}], 'a');
  sc.insert({a:2});
  assert.eq(sc.map(x => x.a), [1, 2, 20, 30]);
});

describe('gets lower index for same vals', () => {
  let sc = new inc.SortedArray([{a:1}, {a: 1, b:'here'}, {a: 1}], 'a');
  let i = sc.getIndex(1);
  assert.eq(i, 0);
});

describe('gets higher index for different vals', () => {
  let sc = new inc.SortedArray([{a:1}, {a: 3, b:'here'}], 'a');
  let i = sc.getIndex(2);
  assert.eq(i, 1);
});

describe('gets index in bounds', () => {
  let sc = new inc.SortedArray([{a:1}, {a: 1, b:'here'}], 'a');
  let i = sc.getIndex(2);
  assert.eq(i, 2);
});

describe('multiple identical inserts before', () => {
  let sc = new inc.SortedArray([{a:1, b:'old1'}, {a:1, b:'old2'}, {a:2}], 'a');
  sc.insert({a:1, b:'i am new'});
  assert.eq(sc.map(x => x.a), [1, 1, 1, 2]);
  assert.eq(sc.get(1).map(x => x.a), [1, 1, 1])
  assert.eq(sc.get(1).map(x => x.b), ['i am new', 'old1', 'old2'])
});

describe('insert in unique works on empty', () => {
  let sc = new inc.SortedUniqueArray([], 'a');
  sc.insert({a:20, b:'heyo'});
  assert.eq(sc.map(x => x.a), [20]);
  assert.eq(sc.get(20)[0].b, 'heyo');
  sc.insert({a:20, b:'replaced'});
  assert.eq(sc.map(x => x.a), [20]);
  assert.eq(sc.get(20)[0].b, 'replaced');
});

describe('insert in unique works on last', () => {
  let sc = new inc.SortedUniqueArray([{a:10}], 'a');
  sc.insert({a:20, b:'heyo'});
  assert.eq(sc.map(x => x.a), [10, 20]);
  assert.eq(sc.get(20)[0].b, 'heyo');
});

describe('insert replaces existing for SortedUnique', () => {
  let sc = new inc.SortedUniqueArray([{a:1}, {a:20}, {a:30}], 'a');
  sc.insert({a:20, b:'heyo'});
  assert.eq(sc.map(x => x.a), [1, 20, 30]);
  assert.eq(sc.get(20)[0].b, 'heyo');
});

