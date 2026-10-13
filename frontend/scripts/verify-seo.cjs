const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const seo = require('../src/services/publicSeo.json');
const dist = path.resolve(__dirname,'../dist');
const titles = new Set();
for (const [route,page] of Object.entries(seo.pages)) {
  const html = fs.readFileSync(path.join(dist,route==='/'?'seo-home.html':'seo-'+route.slice(1)+'.html'),'utf8');
  assert(html.includes(`href="${seo.origin+route}"`));
  assert(html.includes('content="index,follow"'));
  assert(!html.includes('content="noindex,follow"'));
  assert(html.includes('<h1>') && html.includes('Gandhinagar'));
  assert(html.includes('google-site-verification'));
  assert(!titles.has(page.title)); titles.add(page.title);
  const schema = JSON.parse(html.match(/data-public-business>(.*?)<\/script>/s)[1]);
  assert.equal(schema.telephone,'+917016297983');
  assert.equal(schema.address.postalCode,'382006');
  assert(!schema.aggregateRating, 'Do not invent self-serving review stars');
}
assert(fs.readFileSync(path.join(dist,'index.html'),'utf8').includes('content="noindex,follow"'));
const sitemap = fs.readFileSync(path.join(dist,'sitemap.xml'),'utf8');
assert.equal((sitemap.match(/<loc>/g)||[]).length,6);
assert(!/customer|admin|login|bill|payment/.test(sitemap));
assert(fs.readFileSync(path.join(dist,'robots.txt'),'utf8').includes(seo.origin+'/sitemap.xml'));
console.log('PASS public crawlable content, six canonical URLs, verified contact/schema, private noindex and sitemap.');
