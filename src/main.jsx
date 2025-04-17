import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { parseStylesSrc } from "./utils/constants.js";
const appElement = document.createElement("div");

document.body.appendChild(appElement);
const root = ReactDOM.createRoot(appElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Extract script attributes from dataset (browser already handles data- attributes)
const extractScriptAttributes = () => {
  const script = document.currentScript;
  if (!script) {
    console.warn("[AnythingLLM Embed] No script element found");
    return {};
  }

  // Get the standard dataset (camelCased, without data- prefix)
  // Browser automatically transforms data-xxx-yyy to xxxYyy
  const datasetAttrs = Object.assign({}, script.dataset || {});

  return datasetAttrs;
};

const scriptSettings = extractScriptAttributes();

export const embedderSettings = {
  settings: scriptSettings,
  stylesSrc: parseStylesSrc(document?.currentScript?.src),
  USER_STYLES: {
    msgBg: scriptSettings?.userBgColor ?? "#3DBEF5",
    base: `allm-text-white allm-rounded-t-[18px] allm-rounded-bl-[18px] allm-rounded-br-[4px] allm-mx-[20px]`,
  },
  ASSISTANT_STYLES: {
    msgBg: scriptSettings?.assistantBgColor ?? "#FFFFFF",
    base: `allm-text-[#222628] allm-rounded-t-[18px] allm-rounded-br-[18px] allm-rounded-bl-[4px] allm-mr-[37px] allm-ml-[9px]`,
  },
};
