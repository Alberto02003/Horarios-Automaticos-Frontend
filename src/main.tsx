import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { installGlobalErrorHandlers } from "./lib/errorReporter";
import App from "./App";
import "./index.css";

installGlobalErrorHandlers();

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn("[Horarios] VITE_API_URL no definida — usando fallback http://localhost:8080");
}

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
