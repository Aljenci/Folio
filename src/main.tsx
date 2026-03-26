import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "katex/dist/katex.min.css";
import "@fontsource-variable/lora";
import "@fontsource-variable/source-serif-4";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
// gray-matter uses Buffer (a Node.js global). Polyfill it for the WebView.
import { Buffer } from "buffer";
if (!("Buffer" in globalThis)) {
  (globalThis as unknown as Record<string, unknown>).Buffer = Buffer;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
