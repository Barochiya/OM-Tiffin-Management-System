import { writeFileSync } from "node:fs";
import { renderHome } from "../.prerender/prerender.js";
writeFileSync(new URL("../.prerender/home.html", import.meta.url), renderHome());
console.log("Rendered public homepage without network requests or private data.");
