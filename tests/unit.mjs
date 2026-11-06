import assert from 'node:assert/strict';
const esc = (s) => s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
assert.equal(esc('<img src=x onerror=1>'), '&lt;img src=x onerror=1&gt;');
const u = new URL('https://search.bilibili.com/all?keyword=test&page=2');
assert.equal(u.searchParams.get('keyword'),'test'); assert.equal(u.searchParams.get('page'),'2');
console.log('unit checks passed');
