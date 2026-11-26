import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";



import App from "./PublicApp";
import SearchMetadata from "./components/SearchMetadata";
import NotificationCenter from "./components/NotificationCenter";
import VisitorTracker from "./components/VisitorTracker";

const application = (
  <BrowserRouter>
    <SearchMetadata />
    <VisitorTracker />
    <App />
    <NotificationCenter />
  </BrowserRouter>
);
export function mount() {
const root = document.getElementById("root");
// The static public preview paints immediately; mount the interactive app
// normally so provider/portal changes cannot cause hydration mismatches.
createRoot(root).render(application);

}
