import { useEffect, useState } from "react";

export default function Approve() {
  const [origin, setOrigin] = useState("");
  const params = new URLSearchParams(window.location.search);
  const approvalId = params.get("approvalId");

  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: "GET_PENDING_CONNECT", approvalId },
      (res) => {
        if (res?.success) {
          setOrigin(res.origin);
        }
      }
    );
  }, []);

  const approve = () => {
    chrome.runtime.sendMessage({
      type: "APPROVE_CONNECT",
      approvalId
    });
    window.close();
  };

  const reject = () => {
    chrome.runtime.sendMessage({
      type: "REJECT_CONNECT",
      approvalId
    });
    window.close();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Connect to Site</h2>
      <p>{origin} wants to connect to your wallet.</p>

      <button onClick={approve}>Approve</button>
      <button onClick={reject}>Reject</button>
    </div>
  );
}