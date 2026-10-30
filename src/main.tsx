import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { registerSW } from "virtual:pwa-register";

// Installs the service worker so the whole app, SQL engine included, works offline. New versions apply on next load.
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
