import "./index.css";
import "./styles/design-system.css";
const publicPaths = new Set(["/", "/about", "/plans", "/menu", "/how-it-works", "/contact"]);
const path = window.location.pathname.replace(/\/$/, "") || "/";
// Private entry points do not download the homepage or public marketing code.
const runtime = publicPaths.has(path) ? import("./PublicRoot") : import("./PrivateRoot");
runtime.then(module => module.mount());
