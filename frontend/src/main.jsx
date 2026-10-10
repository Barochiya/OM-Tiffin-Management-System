import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./styles/design-system.css";
import "./styles/admin-mobile.css";
import App from "./App";
import NotificationCenter from "./components/NotificationCenter";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
    <NotificationCenter />
  </BrowserRouter>
);