import React from "react";
import ReactDOM from "react-dom";

import App from "./App";
import PasteBin from "./PasteBin";

// Register icons and pull the fonts from the default SharePoint cdn.
import { initializeIcons } from "@uifabric/icons";
initializeIcons();

// Create global logger for development
const logger = (...args) => {
  if (process.env.NODE_ENV !== "production") console.log(...args);
};
window.logger = logger;

// Render main application
ReactDOM.render(<PasteBin />, document.getElementById("root"));
