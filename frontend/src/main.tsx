import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

const rootEl = document.getElementById("root")!;

try {
  createRoot(rootEl).render(
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>
  );

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
} catch (e) {
  rootEl.innerHTML = `<div style="padding:40px;text-align:center;font-family:sans-serif;color:#f0f2f5;background:#0a0e1a;min-height:100vh">
    <h2 style="margin-bottom:12px">Xatolik</h2>
    <p style="color:#8896a8;font-size:14px">Ilovani yuklab bo'lmadi</p>
    <button onclick="location.reload()" style="margin-top:20px;padding:12px 32px;border:none;border-radius:12px;background:#77b39b;color:#0a0e1a;font-size:15px;font-weight:600;cursor:pointer">Qayta yuklash</button>
  </div>`;
}
