import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import PublicWebsiteLayout from "./layouts/PublicWebsiteLayout";
import Home from "./pages/Home";
import { CartProvider } from "./context/CartContext";
import PageLoading from "./components/PageLoading";
import "./styles/public-pages.css";
const About = lazy(() => import("./pages/About"));
const Plans = lazy(() => import("./pages/Plans"));
const Menu = lazy(() => import("./pages/Menu"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Contact = lazy(() => import("./pages/Contact"));
const FullApp = lazy(() => import("./FullApp"));
export default function PublicApp() {
  return <CartProvider><Suspense fallback={<PageLoading />}><Routes>
    <Route element={<PublicWebsiteLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/plans" element={<Plans />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/contact" element={<Contact />} />
    </Route>
    <Route path="*" element={<FullApp />} />
  </Routes></Suspense></CartProvider>;
}
