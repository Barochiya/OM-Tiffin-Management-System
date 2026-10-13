import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import seo from "../services/publicSeo.json";

export default function SearchMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = seo.pages[pathname];
    const meta = (name, content, property = false) => {
      const attr = property ? "property" : "name";
      let tag = document.head.querySelector(`meta[${attr}="${name}"]`);
      if (!tag) { tag = document.createElement("meta"); tag.setAttribute(attr, name); document.head.appendChild(tag); }
      tag.content = content;
    };
    meta("robots", page ? "index,follow" : "noindex,follow");
    meta("description", page?.description || "OM Tiffin Service account access.");
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (page) {
      document.title = page.title;
      if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
      canonical.href = seo.origin + pathname;
      meta("og:title", page.title, true);
      meta("og:description", page.description, true);
      meta("og:url", seo.origin + pathname, true);
    } else {
      const accountTitles = {
        "/admin": "Admin Login", "/login": "Admin Login",
        "/customer-login": "Customer Login",
        "/customer-account-setup": "Customer Account Setup",
        "/customer-forgot-user-id": "Recover Customer User ID",
        "/customer-forgot-password": "Reset Customer Password",
      };
      if (accountTitles[pathname]) document.title = accountTitles[pathname] + " | OM Tiffin Service";
      canonical?.remove();
      document.querySelectorAll('meta[property^="og:"], script[data-public-business]').forEach(tag => tag.remove());
    }
  }, [pathname]);
  return null;
}
