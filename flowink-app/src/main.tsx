import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./App";
import { useFlowInkStore } from "./stores/useFlowInkStore";
import "./styles/theme.css";
import "./styles/app.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("FlowInk root element is missing.");
}

try {
  const savedTheme = root.ownerDocument.defaultView?.localStorage.getItem(
    "flowink-editor-theme",
  );
  if (savedTheme === "light" || savedTheme === "dark") {
    useFlowInkStore.getState().setEditorTheme(savedTheme);
  }
} catch {
  // Private browsing or disabled storage falls back to the light theme.
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
