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
const pendingApprovals = new Map();
const approvedOrigins = new Map();

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

  console.log("UNLOCKED ADDRESS:", wallet.address);

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
  await storage.set({
    isLocked: false,
    address: wallet.address
  });

  return wallet.address; // ✅ important for UI
}


async function requireUnlocked() {
  const isLocked = await storage.get("isLocked");

  if (isLocked !== false) {
    throw new Error("Wallet is locked");
  }

  if (!wallet) {
    throw new Error("Wallet session expired. Please unlock again.");
  }

  return true;
}



/* =========================
   BALANCE CHECK (NEW)
========================= */

async function prepareTransaction(tx) {
  await requireUnlocked();

  const from = wallet.address;

  // 1️⃣ Get current balance
  const balance = await provider.getBalance(from);

  // 2️⃣ Get nonce
  const nonce = await provider.getTransactionCount(from);

// 3️⃣ Get fee data (EIP-1559)
  const feeData = await provider.getFeeData();

  let maxFeePerGas = tx.maxFeePerGas
    ? ethers.getBigInt(tx.maxFeePerGas)
    : feeData.maxFeePerGas ?? 1_000_000_000n; // 1 gwei fallback

  let maxPriorityFeePerGas = tx.maxPriorityFeePerGas
    ? ethers.getBigInt(tx.maxPriorityFeePerGas)
    : feeData.maxPriorityFeePerGas ?? 1_000_000_000n; // 1 gwei fallback

  // 4️⃣ Estimate gas limit (if not provided)
  let gasLimit = tx.gas
    ? ethers.getBigInt(tx.gas)
    : await provider.estimateGas({
        from,
        to: tx.to,
        value: tx.value || "0x0",
         data: tx.data || "0x"
      });

  const value = ethers.getBigInt(tx.value || "0x0");

  // 5️⃣ Calculate costs
  // 5️⃣ Calculate costs
  const gasCost = maxFeePerGas * gasLimit;
  const totalCost = value + gasCost;
  const remainingBalance = balance - totalCost;

  // 👇 ADD DEBUG LOGS HERE
  console.log("Balance:", balance.toString());
  console.log("Value:", value.toString());
  console.log("GasLimit:", gasLimit.toString());
  console.log("MaxFeePerGas:", maxFeePerGas.toString());
  console.log("GasCost:", gasCost.toString());
  console.log("TotalCost:", totalCost.toString());
  console.log("Remaining:", remainingBalance.toString());

  if (remainingBalance < 0n) {
    console.log("INSUFFICIENT TRIGGERED");
    throw new Error("Insufficient balance for value + gas");
  }

  return {
    balance,
    nonce,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasLimit,
    gasCost,
    totalCost,
    remainingBalance
  };
}

async function saveTransaction(tx) {
  const history = (await storage.get("txHistory")) || [];
  history.unshift(tx);
  await storage.set({ txHistory: history });
}

function startPolling(hash) {
  const interval = setInterval(async () => {
    try {
      const receipt = await provider.getTransactionReceipt(hash);

      if (receipt) {
        clearInterval(interval);

        const history = (await storage.get("txHistory")) || [];
        const updated = history.map(tx =>
          tx.hash === hash
            ? {
                ...tx,
                status: "confirmed",
                blockNumber: receipt.blockNumber
              }
            : tx
        );

        await storage.set({ txHistory: updated });

        chrome.runtime.sendMessage({
          type: "TX_CONFIRMED",
          hash,
          receipt
        });
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  }, 7000);
}

/* =========================
   PROVIDER METHODS
========================= */

async function handleProviderRequest({ method, params, origin }, sender) {
  switch (method) {

    case "eth_requestAccounts": {
      await requireUnlocked();

      if (!origin) throw new Error("Origin missing");

      const approved = await storage.get("approvedOrigins") || [];

      if (!approved.includes(origin)) {

        const approvalId = crypto.randomUUID();

        return new Promise((resolve, reject) => {

          pendingApprovals.set(approvalId, {
            type: "connect",
            origin,
            resolve,
            reject,
            tabId: sender?.tab?.id
          });

          chrome.windows.create({
            url: `index.html?connect=true&approvalId=${approvalId}`,
            type: "popup",
            width: 420,
            height: 600
          });
        });
      }

      return [wallet.address];
    }

    case "eth_accounts": {
      try {
        await requireUnlocked();

        const approved = await storage.get("approvedOrigins") || [];
        if (!approved.includes(origin)) return [];

        return [wallet.address];
      } catch {
        return [];
      }
    }

    case "eth_chainId":
      return ACTIVE_NETWORK.chainId;

    case "eth_blockNumber": {
      const block = await provider.getBlockNumber();
      return ethers.toQuantity(block);
    }      

    case "eth_getBalance": {
      const address = params?.[0];

      if (address) {
        const balance = await provider.getBalance(address);
        return ethers.toQuantity(balance);
      }

      await requireUnlocked();
      const balance = await provider.getBalance(wallet.address);
      return ethers.toQuantity(balance);
    }

    case "eth_sendTransaction": {
      await requireUnlocked();

      const tx = params[0];

      const txData = await prepareTransaction(tx);

      // Attach calculated fields
      tx.nonce = ethers.toQuantity(txData.nonce);
      tx.gas = ethers.toQuantity(txData.gasLimit);

      tx.maxFeePerGas = ethers.toQuantity(txData.maxFeePerGas);
      tx.maxPriorityFeePerGas = ethers.toQuantity(txData.maxPriorityFeePerGas);

      const approvalId = crypto.randomUUID();

      return new Promise((resolve, reject) => {

        console.log("TX CREATED FROM:", wallet.address);

        pendingApprovals.set(approvalId, {
          tx,
          txMeta: txData,
          from: wallet.address, 
          resolve,
          reject
        });

        chrome.windows.create({
          url: `index.html?confirm=true&approvalId=${approvalId}`,
          type: "popup",
          width: 420,
          height: 600
        });
      });
    }

    case "eth_call": {
      const tx = params[0];
      const result = await provider.call(tx);
      return result;
    }

    case "eth_estimateGas": {
      await requireUnlocked();

      const tx = params[0];
      if (!tx) throw new Error("Transaction object required");

      const gasLimit = await provider.estimateGas({
        from: wallet.address,
        to: tx.to,
        value: tx.value || "0x0",
        data: tx.data || "0x"
      });

      const feeData = await provider.getFeeData();
      const maxFeePerGas = feeData.maxFeePerGas ?? 1_000_000_000n;
      const gasCost = gasLimit * maxFeePerGas;

      return {
        gasLimit: ethers.toQuantity(gasLimit),
        gasCost: ethers.formatEther(gasCost) // returns as ETH string
      };
    }

    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

/* =========================
   MESSAGE ROUTER
========================= */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Incoming message:", message.type);
  (async () => {
    try {

      /* ---------- PROVIDER PIPELINE ---------- */
      if (message.type === "PROVIDER_REQUEST") {
        const result = await handleProviderRequest(
          {
            method: message.payload.method,
            params: message.payload.params,
            origin: message.origin
          },
          sender
        );

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

          sendResponse({
            unlocked: !isLocked,
            address,
            network: ACTIVE_NETWORK
          });

          break;
        }

        case "GET_PENDING_CONNECT": {
          const pending = pendingApprovals.get(message.approvalId);
          if (!pending) {
            sendResponse({ success: false });
            break;
          }

          sendResponse({
            success: true,
            origin: pending.origin
          });
          break;
        }        

        case "APPROVE_CONNECT": {
          const pending = pendingApprovals.get(message.approvalId);
          if (!pending || pending.type !== "connect")
            throw new Error("Approval not found");

          const approved = (await storage.get("approvedOrigins")) || [];
          approved.push(pending.origin);
          await storage.set({ approvedOrigins: approved });

          if (pending.tabId) {
            chrome.tabs.sendMessage(pending.tabId, {
              type: "PROVIDER_EVENT",
              event: "connect",
              data: { chainId: ACTIVE_NETWORK.chainId }
            });

            chrome.tabs.sendMessage(pending.tabId, {
              type: "PROVIDER_EVENT",
              event: "accountsChanged",
              data: [wallet.address]
            });

            chrome.tabs.sendMessage(pending.tabId, {
              type: "PROVIDER_EVENT",
              event: "chainChanged",
              data: ACTIVE_NETWORK.chainId
            });
          }

          pending.resolve([wallet.address]);
          pendingApprovals.delete(message.approvalId);

          sendResponse({ success: true });
          break;
        }

        case "REJECT_CONNECT": {
          const pending = pendingApprovals.get(message.approvalId);
          if (!pending) throw new Error("Approval not found");

          pending.reject(new Error("User rejected connection"));
          pendingApprovals.delete(message.approvalId);

          sendResponse({ success: true });
          break;
        }        

        case "GET_PENDING_TX": {
          console.log("GET_PENDING_TX hit");
          console.log("Pending approvals map size:", pendingApprovals.size);
          const pending = pendingApprovals.get(message.approvalId);

          if (!pending) {
            sendResponse({ success: false, error: "Approval not found" });
            break;
          }          

          sendResponse({
            success: true,
            tx: {
              from: pending.from,
              to: pending.tx.to,
              value: pending.tx.value || "0x0"
            }
            
          });

          break;
        }

        case "APPROVE_TX": {
          await requireUnlocked();

          const pending = pendingApprovals.get(message.approvalId);
          if (!pending) throw new Error("Approval not found");

          const { tx, resolve, reject } = pending;

          try {

            console.log("SIGNING WITH:", wallet.address);
            console.log("EXPECTED FROM:", pending.from);

            const txObject = {
              from: pending.from,
              to: tx.to,
              value: tx.value || "0x0",
              data: tx.data || "0x",
              gasLimit: tx.gas,
              maxFeePerGas: tx.maxFeePerGas,
              maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
              nonce: tx.nonce,
              chainId: parseInt(ACTIVE_NETWORK.chainId, 16),
              type: 2
            };

            if (wallet.address !== pending.from) {
              throw new Error("Active wallet does not match transaction sender");
            }            

            const signedTx = await wallet.signTransaction(txObject);
            const hash = await provider.send("eth_sendRawTransaction", [signedTx]);

            await saveTransaction({
              hash,
              from: txObject.from,
              to: txObject.to,
              value: txObject.value,
              status: "pending",
              timestamp: Date.now()
            });

            startPolling(hash);

            pendingApprovals.delete(message.approvalId);

            resolve(hash);
            sendResponse({ success: true });

          } catch (err) {
            pendingApprovals.delete(message.approvalId);
            reject(err);
            sendResponse({ success: false, error: err.message });
          }

          break;
        }

        case "REJECT_TX": {
          const pending = pendingApprovals.get(message.approvalId);
          if (!pending) throw new Error("Approval not found");

          pending.reject(new Error("User rejected transaction"));
          pendingApprovals.delete(message.approvalId);

          sendResponse({ success: true });
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
