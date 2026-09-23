import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { ArrowRight, ShoppingCart } from "lucide-react";
import logo from "../assets/logo.png";
import { getWebsiteSettings } from "../services/websiteSettingsService";
import { useCart } from "../context/CartContext";
export default function PublicWebsiteLayout() {
  const { cartItems = [] } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState({
    websiteEnabled: true,
    plansEnabled: true,
    menuEnabled: true,
    onlineOrdersEnabled: false,
    contactEnabled: true,
    customerLoginEnabled: true,
  });
  const cartItemCount = cartItems.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );
  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const response = await getWebsiteSettings();
        if (isMounted && response?.success && response.data) {
          setSettings((previous) => ({
            ...previous,
            ...response.data,
          }));
        }
      } catch (error) {
        console.error("Public Website Settings Load Error:", error);
      }
    };
    loadSettings();
    const interval = setInterval(loadSettings, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);
  if (!settings.websiteEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl">
          <img
            src={logo}
            alt="OM Tiffin Service"
            className="mx-auto h-20 w-20 rounded-full border border-slate-200 object-cover"
          />
          <h1 className="mt-6 text-2xl font-black text-slate-900">
            Website Temporarily Unavailable
          </h1>
          <p className="mt-3 text-slate-600">
            Our website is currently unavailable. Please contact OM Tiffin
            Service for assistance.
          </p>
          <a
            href="tel:9409380470"
            className="mt-7 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700"
          >
            Contact Us
          </a>
        </div>
      </div>
    );
  }
  const closeMobileMenu = () => setMobileMenuOpen(false);
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="order-first inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-md transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-95 md:hidden"
            aria-label="Open website menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="flex w-5 flex-col gap-1.5" aria-hidden="true">
              <span className="h-0.5 w-5 rounded-full bg-slate-700" />
              <span className="h-0.5 w-5 rounded-full bg-slate-700" />
              <span className="h-0.5 w-5 rounded-full bg-slate-700" />
            </span>
          </button>
          <Link
            to="/"
            className="order-last flex items-center gap-3 md:order-none"
          >
            <img
              src={logo}
              alt="OM Tiffin Service"
              className="h-12 w-12 rounded-full border border-slate-200 object-cover"
            />
            <div>
              <div className="text-lg font-extrabold tracking-tight text-blue-700">
                OM TIFFIN
              </div>
              <div className="text-xs font-semibold tracking-[0.18em] text-slate-500">
                SERVICE
              </div>
            </div>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <Link
              to="/"
              className="text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              About
            </Link>
            {settings.plansEnabled && (
              <Link
                to="/plans"
                className="text-sm font-semibold text-slate-700 hover:text-blue-600"
              >
                Plans
              </Link>
            )}
            {settings.menuEnabled && (
              <Link
                to="/menu"
                className="text-sm font-semibold text-slate-700 hover:text-blue-600"
              >
                Menu
              </Link>
            )}
            <Link
              to="/how-it-works"
              className="text-sm font-semibold text-slate-700 hover:text-blue-600"
            >
              How It Works
            </Link>
            {settings.contactEnabled && (
              <Link
                to="/contact"
                className="text-sm font-semibold text-slate-700 hover:text-blue-600"
              >
                Contact
              </Link>
            )}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {settings.onlineOrdersEnabled && (
              <Link
                to="/cart"
                aria-label={`Shopping cart with ${cartItemCount} items`}
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <ShoppingCart size={20} />
                {cartItemCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[11px] font-black leading-none text-white ring-2 ring-white">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </Link>
            )}
            {settings.customerLoginEnabled && (
              <Link
                to="/customer-login"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                Customer Login
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </header>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <button
            type="button"
            aria-label="Close website menu"
            onClick={closeMobileMenu}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
          />
          <aside className="absolute left-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="flex items-center gap-3"
              >
                <img
                  src={logo}
                  alt="OM Tiffin Service"
                  className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                />
                <div>
                  <div className="text-base font-extrabold tracking-tight text-blue-700">
                    OM TIFFIN
                  </div>
                  <div className="text-[10px] font-semibold tracking-[0.18em] text-slate-500">
                    SERVICE
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl font-bold text-slate-700 hover:bg-slate-200"
                aria-label="Close website menu"
              >
                ✕
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-5">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="flex items-center rounded-xl px-4 py-3.5 text-base font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                Home
              </Link>
              <Link
                to="/about"
                onClick={closeMobileMenu}
                className="flex items-center rounded-xl px-4 py-3.5 text-base font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                About
              </Link>
              {settings.plansEnabled && (
                <Link
                  to="/plans"
                  onClick={closeMobileMenu}
                  className="flex items-center rounded-xl px-4 py-3.5 text-base font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  Plans
                </Link>
              )}
              {settings.menuEnabled && (
                <Link
                  to="/menu"
                  onClick={closeMobileMenu}
                  className="flex items-center rounded-xl px-4 py-3.5 text-base font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  Menu
                </Link>
              )}
              <Link
                to="/how-it-works"
                onClick={closeMobileMenu}
                className="flex items-center rounded-xl px-4 py-3.5 text-base font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
              >
                How It Works
              </Link>
              {settings.contactEnabled && (
                <Link
                  to="/contact"
                  onClick={closeMobileMenu}
                  className="flex items-center rounded-xl px-4 py-3.5 text-base font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  Contact
                </Link>
              )}
              <div className="my-4 border-t border-slate-200" />
              {settings.onlineOrdersEnabled && (
                <Link
                  to="/cart"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3.5 font-bold text-blue-700"
                >
                  <span>Shopping Cart</span>
                  <span className="flex items-center gap-2">
                    <ShoppingCart size={19} />
                    {cartItemCount > 0 && (
                      <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-black text-white">
                        {cartItemCount > 99 ? "99+" : cartItemCount}
                      </span>
                    )}
                  </span>
                </Link>
              )}
              {settings.customerLoginEnabled && (
                <Link
                  to="/customer-login"
                  onClick={closeMobileMenu}
                  className="mt-3 flex items-center justify-between rounded-xl bg-blue-600 px-4 py-3.5 font-bold text-white shadow-sm hover:bg-blue-700"
                >
                  <span>Customer Login</span>
                  <ArrowRight size={18} />
                </Link>
              )}
            </nav>
            <div className="border-t border-slate-200 px-5 py-4">
              <p className="text-center text-xs font-medium text-slate-500">
                OM Tiffin Service
              </p>
            </div>
          </aside>
        </div>
      )}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
