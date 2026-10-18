import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PublicApp from "./PublicApp";
import PublicWebsiteLayout from "./layouts/PublicWebsiteLayout";
import About from "./pages/About";
import { CartProvider } from "./context/CartContext";
export function renderHome() {
  return renderToString(<MemoryRouter initialEntries={["/"]}><PublicApp /></MemoryRouter>);
}
// Use the same About component/layout without a lazy boundary in the build-only entry.
// The first response contains visible content even when JavaScript is unavailable.
export function renderAbout() {
  return renderToString(<MemoryRouter initialEntries={["/about"]}><CartProvider><Routes>
    <Route element={<PublicWebsiteLayout />}><Route path="/about" element={<About />} /></Route>
  </Routes></CartProvider></MemoryRouter>);
}
