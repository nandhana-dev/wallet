import { useEffect, useState } from "react";

const MIN_BALANCE = 0.01;

export default function Wallet({ state, setState }) {
  const [balance, setBalance] = useState(0);
  const [rpcUrl, setRpcUrl] = useState(state.network?.rpcUrl || "");
  const [loading, setLoading] = useState(false);

  // NEW: send transaction state
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [txError, setTxError] = useState("");

  const sufficientBalance = balance >= MIN_BALANCE;

  useEffect(() => {
    fetchBalance();
  }, [state.address, rpcUrl]);

  const fetchBalance = () => {
    chrome.runtime.sendMessage(
      {
        type: "PROVIDER_REQUEST",
        payload: {
          method: "eth_getBalance",
          params: [state.address, "latest"]
        }
      },
      (res) => {
        if (res?.success) {
          const eth = parseInt(res.result, 16) / 1e18;
          setBalance(eth);
        }
      }
    );
  };

  const updateNetwork = () => {
    chrome.runtime.sendMessage(
      {
        type: "SET_NETWORK",
        rpcUrl
      },
      (res) => {
        if (!res.success) {
          alert(res.error);
        }
      }
    );
  };

  // NEW: send transaction handler
  const sendTransaction = () => {
    setTxError("");
    setTxHash("");

    if (!to || !amount) {
      setTxError("Recipient and amount are required");
      return;
    }

    let valueWei;
    try {
      valueWei = "0x" + BigInt(Math.floor(Number(amount) * 1e18)).toString(16);
    } catch {
      setTxError("Invalid amount");
      return;
    }

    setLoading(true);

    chrome.runtime.sendMessage(
      {
        type: "PROVIDER_REQUEST",
        payload: {
          method: "eth_sendTransaction",
          params: [
            {
              to,
              value: valueWei
            }
          ]
        }
      },
      (res) => {
        setLoading(false);

        if (!res?.success) {
          setTxError(res?.error || "Transaction failed");
          return;
        }

        setTxHash(res.result);
        setAmount("");
        fetchBalance();
      }
    );
  };

  const lock = () => {
    chrome.runtime.sendMessage({ type: "LOCK_WALLET" }, () => {
      setState({
        initialized: true,
        unlocked: false,
        address: state.address,
        view: "unlock"
      });
    });
  };

  return (
    <div className="container">
      <h3>Wallet</h3>

      <p>Address:</p>
      <code>{state.address}</code>

      <p>Balance:</p>
      <strong>{balance.toFixed(4)} ETH</strong>

      <p>Status:</p>
      {sufficientBalance ? (
        <strong style={{ color: "green" }}>Sufficient balance</strong>
      ) : (
        <strong style={{ color: "red" }}>
          Insufficient balance (min {MIN_BALANCE} ETH)
        </strong>
      )}

      <hr />

      <p>RPC Network:</p>
      <input
        type="text"
        value={rpcUrl}
        onChange={(e) => setRpcUrl(e.target.value)}
        placeholder="RPC URL"
      />
      <button onClick={updateNetwork}>Switch Network</button>

      <hr />

      {sufficientBalance && (
        <>
          <h4>Send Transaction</h4>

          <input
            type="text"
            placeholder="Recipient address"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />

          <input
            type="number"
            placeholder="Amount (ETH)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <button 
            type = "button"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                sendTransaction();
            }}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send"}
          </button>

          {txHash && (
            <p style={{ color: "green" }}>
              Tx sent: <code>{txHash}</code>
            </p>
          )}

          {txError && (
            <p style={{ color: "red" }}>{txError}</p>
          )}

          <hr />
        </>
      )}

      <button onClick={lock}>Lock</button>
    </div>
  );
}
