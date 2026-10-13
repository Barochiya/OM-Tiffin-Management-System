import { createRoot } from "react-dom/client";
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
// The static public preview paints immediately; mount the interactive app
// normally so provider/portal changes cannot cause hydration mismatches.
createRoot(root).render(application);
