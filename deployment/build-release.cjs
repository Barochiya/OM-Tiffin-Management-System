// Code-only production artifact. Database/imports/config/uploads/backups are never inputs.
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'..'),output=path.join(root,'.bigrock-build');
if(fs.existsSync(output))throw Error('Build output must be a fresh directory');
const revision=process.env.GITHUB_SHA||process.argv[2];if(!/^[a-f0-9]{40}$/.test(revision||''))throw Error('An exact Git commit SHA is required');
fs.mkdirSync(output,{recursive:true});
const runtime=['accounts.php','backup.php','announcements.php','auth.php','barcodes.php','billing.php','catalog.php','config.php','customers.php','dashboard.php','deliveries.php','document-notifications.php','documents.php','entry.php','health.php','http.php','inbox.php','model-defaults.json','modifications.php','notifications.php','outbox-crypto.php','outbox.php','profiles.php','read-models.php','recovery.php','router.php','security.php','store.php','webhook.php','whatsapp.php','worker.php'];
for(const file of runtime){fs.mkdirSync(path.join(output,'php'),{recursive:true});fs.copyFileSync(path.join(root,'backend-bigrock',file),path.join(output,'php',file));}
fs.cpSync(path.join(root,'frontend/dist'),path.join(output,'web'),{recursive:true});
// Keep pre-cutover public hashed chunks for browsers with an old entry bundle.
const legacyAssets=path.join(__dirname,'legacy-assets');
if(fs.existsSync(legacyAssets))for(const name of fs.readdirSync(legacyAssets)){
 if(!/^[A-Za-z0-9_.-]+\.(js|css|woff2?|ttf|png|svg|jpe?g)$/.test(name))throw Error('Unexpected legacy asset');
 const destination=path.join(output,'web/assets',name);
 if(!fs.existsSync(destination))fs.copyFileSync(path.join(legacyAssets,name),destination);
}
const render=path.join(output,'render'),backend=path.join(root,'backend'),modules=path.join(backend,'node_modules');
fs.mkdirSync(path.join(render,'backend/utils'),{recursive:true});fs.mkdirSync(path.join(render,'frontend/src/assets'),{recursive:true});
for(const file of ['billPdfGenerator.js','receiptPdfGenerator.js','receiptCardPdf.js','customDocumentPdf.js','documentDesign.js','signatureImage.js'])fs.copyFileSync(path.join(backend,'utils',file),path.join(render,'backend/utils',file));
fs.cpSync(path.join(backend,'assets'),path.join(render,'backend/assets'),{recursive:true});fs.copyFileSync(path.join(root,'frontend/src/assets/logo.png'),path.join(render,'frontend/src/assets/logo.png'));fs.copyFileSync(path.join(__dirname,'pdf-renderer.cjs'),path.join(render,'renderer.cjs'));
const visited=new Set();function dependency(name,from){const req=createRequire(path.join(from,'package.json'));let folder=path.dirname(req.resolve(name)),meta;while(folder!==path.dirname(folder)){const p=path.join(folder,'package.json');if(fs.existsSync(p)){const value=JSON.parse(fs.readFileSync(p));if(value.name===name){meta=value;break;}}folder=path.dirname(folder);}if(!meta||!folder.startsWith(modules+path.sep))throw Error('Dependency outside backend node_modules');if(visited.has(folder))return;visited.add(folder);fs.cpSync(folder,path.join(render,'backend/node_modules',path.relative(modules,folder)),{recursive:true});for(const name of Object.keys(meta.dependencies||{}))dependency(name,folder);}
dependency('pdfkit',backend);dependency('qrcode',backend);
const privateRelease='/home1/maapn1f6/omtiffin-private/releases/'+revision;
fs.writeFileSync(path.join(output,'web/index.php'),`<?php\ndeclare(strict_types=1);\n$path=parse_url($_SERVER['REQUEST_URI']??'/',PHP_URL_PATH);\nif($path==='/api'||str_starts_with($path,'/api/')){putenv('OMTIFFIN_CONFIG=/home1/maapn1f6/omtiffin-private/private/config.local.json');require '${privateRelease}/php/entry.php';exit;}\nheader('Content-Type: text/html; charset=utf-8');header('Cache-Control: no-cache');readfile(__DIR__.'/index.html');\n`);
fs.copyFileSync(path.join(output,'web/index.php'),path.join(output,'web/api-'+revision+'.php'));
fs.writeFileSync(path.join(output,'web/.htaccess'),`Options -Indexes\nDirectoryIndex seo-home.html\n<IfModule mod_headers.c>\n<FilesMatch "\\.html$">\nHeader set Cache-Control "no-cache"\n</FilesMatch>\n</IfModule>\n<IfModule mod_headers.c>\n<FilesMatch "\\.(?:js|css|woff2?|webp|png|jpe?g|svg)$">\nHeader set Cache-Control "public, max-age=31536000, immutable"\n</FilesMatch>\n</IfModule>\n<IfModule mod_deflate.c>\nAddOutputFilterByType DEFLATE text/html text/css text/plain application/javascript application/json application/xml image/svg+xml\n</IfModule>\nRewriteEngine On\nRewriteCond %{HTTPS} !=on\nRewriteCond %{HTTP_HOST} ^(www\\.)?omtiffinservices\\.com$ [NC]\nRewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]\nRewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]\nRewriteRule ^api(?:/.*)?$ api-${revision}.php [L,QSA]\nRewriteRule ^$ seo-home.html [L]\nRewriteRule ^(about|plans|menu|how-it-works|contact)/?$ seo-$1.html [L]\nRewriteCond %{REQUEST_FILENAME} -f [OR]\nRewriteCond %{REQUEST_FILENAME} -d\nRewriteRule ^ - [L]\nRewriteRule ^ index.html [L]\n`);
fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({project:'omtiffinservices.com',revision,format:1,codeOnly:true},null,2));
console.log('Built code-only OM Tiffin release '+revision+'; no database/config/uploads included.');


