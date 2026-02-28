/* ======================================================
   AetherPay Content Script
   - Runs in isolated world
   - Bridges webpage <-> background
====================================================== */

/**
 * Inject injected.js into the webpage context
 */
function injectProvider() {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.type = "text/javascript";
  script.onload = () => {
    script.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

if (!window.__AETHERPAY_INJECTED__) {
  window.__AETHERPAY_INJECTED__ = true;
  injectProvider();
}
/* ======================================================
   Message Flow: Webpage -> Extension
====================================================== */

window.addEventListener("message", (event) => {
  // Only accept messages from the same page
  if (event.source !== window) return;

  const message = event.data;

  if (!message || message.target !== "AETHERPAY_EXTENSION") return;

  chrome.runtime.sendMessage(
    {
      type: "PROVIDER_REQUEST",
      payload: message.payload,
      requestId: message.requestId,
      origin: window.location.origin
    },
    (response) => {
      window.postMessage(
        {
          target: "AETHERPAY_INJECTED",
          requestId: message.requestId,
          response
        },
        "*"
      );
    }
  );
});

/* ======================================================
   Messages from Background -> Webpage (Events)
====================================================== */

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "PROVIDER_EVENT") {
    window.postMessage(
      {
        target: "AETHERPAY_INJECTED",
        event: message.event,
        data: message.data
      },
      "*"
    );
  }
});
