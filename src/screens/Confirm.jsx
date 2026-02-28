import { useEffect, useState } from "react";

function short(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function Confirm() {
  const [tx, setTx] = useState(null);
  const [network, setNetwork] = useState(null);
  const [approvalId, setApprovalId] = useState(null);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    console.log("Confirm mounted");

    const params = new URLSearchParams(window.location.search);
    const id = params.get("approvalId");

    console.log("approvalId from URL:", id);

    if (!id) {
        console.error("No approvalId found in URL");
        setLoading(false);
        return;
    }

    setApprovalId(id);

    console.log("Requesting GET_PENDING_TX...");

    chrome.runtime.sendMessage(
        { type: "GET_PENDING_TX", approvalId: id },
        (res) => {
        console.log("GET_PENDING_TX response:", res);

        if (chrome.runtime.lastError) {
            console.error("GET_PENDING_TX runtime error:", chrome.runtime.lastError);
            setLoading(false);
            return;
        }

        if (!res) {
            console.error("No response received");
            setLoading(false);
            return;
        }

        if (!res.success) {
            console.error("Response unsuccessful:", res);
            setLoading(false);
            return;
        }

        console.log("Setting tx + txMeta");
        if (!res.tx?.from) {
        console.error("Invalid pending tx data");
        setLoading(false);
        return;
        }

        setTx(res.tx);
        setLoading(false);
        }
    );

    console.log("Requesting GET_STATE...");

    chrome.runtime.sendMessage(
        { type: "GET_STATE" },
        (res) => {
        console.log("GET_STATE response:", res);

        if (!chrome.runtime.lastError && res) {
            setNetwork(res.network);
        }
        }
    );
    }, []);

  const approveTx = () => {
    chrome.runtime.sendMessage(
      { type: "APPROVE_TX", approvalId },
      () => window.close()
    );
  };

  const rejectTx = () => {
    chrome.runtime.sendMessage(
      { type: "REJECT_TX", approvalId },
      () => window.close()
    );
  };

  if (loading) return <div style={styles.container}>Loading...</div>;
  if (!tx) return <div style={styles.container}>Transaction not found</div>;

  function formatEther(value) {
    const wei = BigInt(value);
    const whole = wei / 1000000000000000000n;
    const fraction = wei % 1000000000000000000n;

    const fractionStr = fraction.toString().padStart(18, "0").slice(0, 6);
    return `${whole}.${fractionStr}`;
  }


  const eth = formatEther(tx.value ?? "0x0");

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Confirm Transaction</h2>

      <div style={styles.card}>
        <p><strong>Account:</strong> {short(tx.from)}</p>
        <p><strong>Recipient:</strong> {short(tx.to)}</p>
        <p><strong>Network:</strong> {network?.name}</p>
        <p><strong>Amount:</strong> {eth} ETH</p>
      </div>

      <div style={styles.buttonRow}>
        <button style={styles.rejectBtn} onClick={rejectTx}>
          Reject
        </button>
        <button style={styles.approveBtn} onClick={approveTx}>
          Approve
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial",
    backgroundColor: "#0f172a",
    color: "white",
    height: "100vh"
  },
  title: {
    textAlign: "center",
    marginBottom: "20px"
  },
  card: {
    backgroundColor: "#1e293b",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
    wordBreak: "break-word"
  },
  buttonRow: {
    display: "flex",
    justifyContent: "space-between"
  },
  approveBtn: {
    backgroundColor: "#22c55e",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer"
  },
  rejectBtn: {
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer"
  }
};