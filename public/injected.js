/* ======================================================
   AetherPay Injected Provider
   - Runs in webpage context
   - Exposes window.ethereum
   - Talks ONLY via postMessage
====================================================== */

(function () {
  
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

      if (!response) {
        pending.reject(new Error("No response from extension"));
        return;
      }

      if (response.success === false) {
        pending.reject(new Error(response.error));
      } else {
        pending.resolve(response.result);
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

  const listeners = {};
  
  const ethereum = {
    isAetherPay: true,
    isMetaMask: false,
    request,
    enable: () => request({ method: "eth_requestAccounts" }),
    isConnected: () => true,
    on: (event, handler) => {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(handler);
      },

      removeListener: (event, handler) => {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(h => h !== handler);
      },

      emit: (event, data) => {
        if (!listeners[event]) return;
        listeners[event].forEach(handler => handler(data));
      }
  };

  if (window.ethereum?.providers) {
    window.ethereum.providers.push(ethereum);
  } else if (window.ethereum) {
    window.ethereum.providers = [window.ethereum, ethereum];
  } else {
    Object.defineProperty(window, "ethereum", {
      value: ethereum,
      writable: false
    });
  }

  function announce() {
    window.dispatchEvent(
      new CustomEvent("eip6963:announceProvider", {
        detail: {
          info: {
            uuid: "aetherpay-wallet",
            name: "AetherPay",
            icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjNjY2NmZmIi8+PHRleHQgeD0iMTYiIHk9IjIwIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QTwvdGV4dD48L3N2Zz4=",
            rdns: "com.aetherpay.wallet"
          },
          provider: ethereum
        }
      })
    );
  }

  // 🔹 announce immediately
  announce();

  // 🔹 also respond to requests
  window.addEventListener("eip6963:requestProvider", announce);

  console.log("🟢 AetherPay injected: window.ethereum is available");
})();
