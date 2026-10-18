// Public information only. No API credentials, customer data or volatile prices.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const seo = require('../src/services/publicSeo.json');
const dist = path.join(root, 'dist');
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
// Public pages render their styles in the first response, avoiding a CSS waterfall.
const publicTemplate = template.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, tag => {
  const href = tag.match(/href="([^"]+)"/)?.[1];
  if (!href?.startsWith('/assets/') || !href.endsWith('.css')) return tag;
  return '<style data-public-critical>' + fs.readFileSync(path.join(dist, href.slice(1)), 'utf8').replace(/<\/style/gi, '<\\/style') + '</style>';
});
const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const schema = {
  '@context':'https://schema.org', '@type':'FoodEstablishment', '@id':seo.origin+'/#business',
  name:'OM Tiffin Services', url:seo.origin+'/', telephone:seo.phone, sameAs:[seo.instagram],
  image:seo.origin+'/logo.png', hasMap:seo.map, areaServed:{'@type':'City',name:'Gandhinagar'},
  address:{'@type':'PostalAddress',streetAddress:'Plot No 1086/2, Bhuneshwari Society, Sector 6/C, near Civil Hospital',addressLocality:'Gandhinagar',addressRegion:'Gujarat',postalCode:'382006',addressCountry:'IN'},
  contactPoint:{'@type':'ContactPoint',telephone:seo.secondaryPhone,contactType:'customer service'}
};
// Unknown/private SPA routes receive noindex even before JavaScript runs.
fs.writeFileSync(path.join(dist,'index.html'),publicTemplate.replace('</head>','<meta name="robots" content="noindex,follow" /></head>'));
for (const [route,page] of Object.entries(seo.pages)) {
  const filename = route==='/' ? 'seo-home.html' : 'seo-'+route.slice(1)+'.html';
  const head = `<meta name="description" content="${escape(page.description)}" />
<meta name="robots" content="index,follow" /><link rel="canonical" href="${seo.origin+route}" />
<meta property="og:type" content="website" /><meta property="og:title" content="${escape(page.title)}" />
<meta property="og:description" content="${escape(page.description)}" /><meta property="og:url" content="${seo.origin+route}" />
<meta property="og:image" content="${seo.origin}/logo.png" />
<script type="application/ld+json" data-public-business>${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`;
  const nav = Object.entries(seo.pages).map(([url,p])=>`<a href="${url}">${escape(url==='/'?'Home':p.heading)}</a>`).join(' · ');
  const content = `<main style="max-width:70rem;margin:2rem auto;padding:1.5rem;font-family:system-ui;line-height:1.8"><nav>${nav}</nav><h1>${escape(page.heading)}</h1><p>${escape(page.text)}</p><h2>Gandhinagar enquiries and delivery availability</h2><p>Contact us to confirm delivery for your address and the current menu and plan prices.</p><address>${escape(seo.address)}</address><p><a href="tel:${seo.phone}">7016297983</a> · Additional contact: <a href="tel:${seo.secondaryPhone}">9409380470</a></p><p><a href="${seo.map}">Find OM Tiffin Services on Google Maps</a> · <a href="/customer-login">Customer login</a></p></main>`;
  const prerender = route === '/' ? 'home' : route === '/about' ? 'about' : null;
  const body = prerender ? fs.readFileSync(path.join(root, '.prerender/'+prerender+'.html'), 'utf8') : content;
  const rootTag = prerender ? '<div id="root" data-prerendered>' : '<div id="root">';
  fs.writeFileSync(path.join(dist,filename),publicTemplate.replace(/<title>.*?<\/title>/s,`<title>${escape(page.title)}</title>`).replace('</head>',head+'</head>').replace('<div id="root"></div>',`${rootTag}${body}</div>`));
}
fs.writeFileSync(path.join(dist,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+Object.keys(seo.pages).map(route=>`<url><loc>${seo.origin+route}</loc>${seo.pages[route].lastModified ? '<lastmod>'+seo.pages[route].lastModified+'</lastmod>' : ''}</url>`).join('')+'</urlset>');
fs.writeFileSync(path.join(dist,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${seo.origin}/sitemap.xml\n`);
console.log('Built six crawlable public pages; private SPA pages default to noindex.');
