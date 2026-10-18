import { writeFileSync } from "node:fs";
import { renderHome, renderAbout } from "../.prerender/prerender.js";
writeFileSync(new URL("../.prerender/home.html", import.meta.url), renderHome());
console.log("Rendered public homepage without network requests or private data.");

writeFileSync(new URL("../.prerender/about.html", import.meta.url), await renderAbout());
console.log("Rendered full public About page without network requests or private data.");
