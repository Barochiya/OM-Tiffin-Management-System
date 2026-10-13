import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./styles/design-system.css";

import App from "./PublicApp";
import SearchMetadata from "./components/SearchMetadata";
import NotificationCenter from "./components/NotificationCenter";

const application = (
  <BrowserRouter>
    <SearchMetadata />
    <App />
    <NotificationCenter />
  </BrowserRouter>
);
const root = document.getElementById("root");
if (root.hasAttribute("data-prerendered")) hydrateRoot(root, application);
else createRoot(root).render(application);
