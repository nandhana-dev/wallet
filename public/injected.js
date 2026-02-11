/* ======================================================
   AetherPay Injected Provider
   - Runs in webpage context
   - Exposes window.ethereum
   - Talks ONLY via postMessage
====================================================== */

(function () {
  if (window.ethereum) {
    // Prevent double injection
    return;
  }

  let requestId = 0;
  const pendingRequests = new Map();

  /* ======================================================
     Core request() implementation (EIP-1193 style)
  ====================================================== */

  function request({ method, params }) {
    return new Promise((resolve, reject) => {
      const id = ++requestId;

      pendingRequests.set(id, { resolve, reject });

      window.postMessage(
        {
          target: "AETHERPAY_EXTENSION",
          requestId: id,
          payload: {
            method,
            params
          }
        },
        "*"
      );
    });
  }

  /* ======================================================
     Listen for responses from content script
  ====================================================== */

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    const message = event.data;
    if (!message || message.target !== "AETHERPAY_INJECTED") return;

    // Handle responses to requests
    if (message.requestId) {
      const pending = pendingRequests.get(message.requestId);
      if (!pending) return;

      pendingRequests.delete(message.requestId);

      const { response } = message;

      if (response && response.success === false) {
        pending.reject(new Error(response.error));
      } else {
        pending.resolve(response);
      }
    }

    // Handle provider events (future use)
    if (message.event) {
      // Example: accountsChanged, chainChanged
      if (ethereum && typeof ethereum.emit === "function") {
        ethereum.emit(message.event, message.data);
      }
    }
  });

  /* ======================================================
     Minimal Ethereum Provider Object
  ====================================================== */

  const ethereum = {
    isAetherPay: true,
    isMetaMask: false,

    request,

    // Optional helpers (MetaMask compatibility)
    enable: () => request({ method: "eth_requestAccounts" }),

    on: (event, handler) => {
      window.addEventListener(event, handler);
    },

    removeListener: (event, handler) => {
      window.removeEventListener(event, handler);
    }
  };

  Object.defineProperty(window, "ethereum", {
    value: ethereum,
    writable: false
  });

  console.log("🟢 AetherPay injected: window.ethereum is available");
})();
