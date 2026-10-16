import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./App";
import "./styles/theme.css";
import "./styles/app.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("FlowInk root element is missing.");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
