import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/dist/ethers.min.js";

/* ======================================================
   AetherPay – Background Service Worker
   Wallet Core + Provider Handler
====================================================== */

/* =========================
   CONFIG
========================= */

const NETWORKS = {
  hardhat: {
    name: "Hardhat",
    chainId: "0x7A69", // 31337
    rpcUrl: "http://127.0.0.1:8545"
  }
};

const ACTIVE_NETWORK = NETWORKS.hardhat;
const DERIVATION_PATH = "m/44'/60'/0'/0/0";

/* =========================
   RUNTIME STATE (memory)
========================= */

let provider = new ethers.JsonRpcProvider(ACTIVE_NETWORK.rpcUrl);
let wallet = null;
let unlocked = false;

/* =========================
   STORAGE HELPERS
========================= */

const storage = {
  get(key) {
    return new Promise(resolve => {
      chrome.storage.local.get(key, result => resolve(result[key]));
    });
  },
  set(data) {
    return new Promise(resolve => {
      chrome.storage.local.set(data, resolve);
    });
  }
};

/* =========================
   CRYPTO HELPERS
========================= */

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const PBKDF2_ITERATIONS = 310000;

async function sha256(text) {
  const bytes = encoder.encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function deriveAESKey(password, salt, usage) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256
    },
    false,
    [usage]
  );
}

async function encrypt(text, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveAESKey(password, salt, "encrypt");

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(text)
  );

  return {
    salt: Array.from(salt),
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  };
}

async function decrypt(payload, password) {
  const key = await deriveAESKey(
    password,
    new Uint8Array(payload.salt),
    "decrypt"
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(payload.iv) },
    key,
    new Uint8Array(payload.data)
  );

  return decoder.decode(decrypted);
}

/* =========================
   WALLET CORE
========================= */

async function createWallet(password) {
  const mnemonic = ethers.Mnemonic.fromEntropy(ethers.randomBytes(16));
  const node = ethers.HDNodeWallet.fromMnemonic(mnemonic, DERIVATION_PATH);

  const encryptedVault = await encrypt(mnemonic.phrase, password);
  const passwordHash = await sha256(password);

  wallet = node.connect(provider);
  unlocked = true;

  await storage.set({
    vault: encryptedVault,
    passwordHash,
    address: node.address,
    isLocked: false   // ✅ FIXED
  });

  return {
    mnemonic: mnemonic.phrase,
    address: node.address
  };
}

async function unlockWallet(password) {
  const vault = await storage.get("vault");
  const savedHash = await storage.get("passwordHash");

  if (!vault || !savedHash) {
    throw new Error("Wallet not initialized");
  }

  const inputHash = await sha256(password);
  if (inputHash !== savedHash) {
    throw new Error("Invalid password");
  }

  // Decrypt mnemonic
  const phrase = await decrypt(vault, password);

  // Recreate wallet
  const node = ethers.HDNodeWallet.fromMnemonic(
    ethers.Mnemonic.fromPhrase(phrase),
    DERIVATION_PATH
  );

  wallet = node.connect(provider);
  unlocked = true;

  // 🔐 Store decrypted private key in SESSION storage
  await chrome.storage.session.set({
    sessionPrivateKey: node.privateKey
  });

  // Mark unlocked in persistent storage
  await storage.set({ isLocked: false });

  return wallet.address; // ✅ important for UI
}


async function requireUnlocked() {
  const isLocked = await storage.get("isLocked");

  if (isLocked) {
    throw new Error("Wallet is locked");
  }

  // If wallet already exists in memory → good
  if (wallet) {
    return;
  }

  // 🔁 Worker restarted → try restoring from session storage
  const session = await chrome.storage.session.get("sessionPrivateKey");

  if (!session.sessionPrivateKey) {
    throw new Error("Wallet session expired. Please unlock again.");
  }

  // Reconstruct wallet from stored private key
  wallet = new ethers.Wallet(
    session.sessionPrivateKey,
    provider
  );

  unlocked = true;
}



/* =========================
   BALANCE CHECK (NEW)
========================= */

async function ensureSufficientBalance(to, valueWei) {
  const balance = await provider.getBalance(wallet.address);
  const value = ethers.getBigInt(valueWei || "0x0");

  if (balance < value) {
    throw new Error("Insufficient balance");
  }
}

/* =========================
   PROVIDER METHODS
========================= */

async function handleProviderRequest({ method, params }) {
  switch (method) {

    case "eth_requestAccounts":
      requireUnlocked();
      return [wallet.address];

    case "eth_accounts":
      if (!unlocked) return [];
      return [wallet.address];

    case "eth_chainId":
      return ACTIVE_NETWORK.chainId;

    case "eth_getBalance": {
      const address = params?.[0];

      // If checking wallet's own balance, ensure restoration
      if (!address || address === wallet?.address) {
        await requireUnlocked();
      }

      const targetAddress = address || wallet.address;

      const balance = await provider.getBalance(targetAddress);

      return ethers.toQuantity(balance);
    }


    case "eth_sendTransaction": {
      await requireUnlocked();


      const tx = params[0];

      await ensureSufficientBalance(tx.to, tx.value);

      const response = await wallet.sendTransaction({
        to: tx.to,
        value: tx.value
      });

      const receipt = await response.wait();

      return response.hash;
    }

    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

/* =========================
   MESSAGE ROUTER
========================= */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {

      /* ---------- PROVIDER PIPELINE ---------- */
      if (message.type === "PROVIDER_REQUEST") {
        const result = await handleProviderRequest({
          method: message.payload.method,
          params: message.payload.params
        });

        sendResponse({ success: true, result });
        return;
      }

      /* ---------- INTERNAL UI MESSAGES ---------- */
      switch (message.type) {

        case "CREATE_WALLET": {
          const data = await createWallet(message.password);
          sendResponse({ success: true, data });
          break;
        }

        case "UNLOCK_WALLET": {
          const address = await unlockWallet(message.password);
          sendResponse({ success: true, address });
          break;
        }

        case "LOCK_WALLET": {
          wallet = null;
          unlocked = false;
          await chrome.storage.session.clear();
          await storage.set({ isLocked: true });
          sendResponse({ success: true });
          break;
        }

        case "SET_NETWORK": {
          if (!message.rpcUrl) {
            throw new Error("RPC URL required");
          }

          provider = new ethers.JsonRpcProvider(message.rpcUrl);

          if (wallet) {
            wallet = wallet.connect(provider);
          }

          ACTIVE_NETWORK.rpcUrl = message.rpcUrl;

          sendResponse({ success: true });
          break;
        }

        case "GET_STATE": {
          const isLocked = await storage.get("isLocked");
          let address = await storage.get("address");

          // 🔁 If worker restarted but wallet was unlocked, restore from session
          if (!wallet && !isLocked) {
            const session = await chrome.storage.session.get("sessionPrivateKey");

            if (session.sessionPrivateKey) {
              wallet = new ethers.Wallet(
                session.sessionPrivateKey,
                provider
              );
              unlocked = true;
              address = wallet.address;
            }
          }

          sendResponse({
            unlocked: !isLocked,
            address,
            network: ACTIVE_NETWORK
          });

          break;
        }


        default:
          throw new Error("Unknown message type");
      }

    } catch (err) {
      sendResponse({
        success: false,
        error: err.message
      });
    }
  })();

  return true; // async
});
