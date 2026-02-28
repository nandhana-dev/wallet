import { useState } from "react";

export default function Unlock({ setState }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const unlock = () => {
    if (!password) {
      alert("Enter password");
      return;
    }

    setLoading(true);

    chrome.runtime.sendMessage(
      { type: "UNLOCK_WALLET", password },
      (res) => {
        setLoading(false);

        if (!res) {
          alert("Background not responding");
          return;
        }

        if (res.success) {
          setState({
            initialized: true,
            unlocked: true,
            address: res.address,
            view: "wallet"
          });
        } else {
          alert(res.error || "Failed to unlock");
        }
      }
    );
  };

  return (
    <div className="container">
      <h3>Unlock AetherPay</h3>

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") unlock();
        }}
      />

      <button onClick={unlock} disabled={loading}>
        {loading ? "Unlocking..." : "Unlock"}
      </button>
    </div>
  );
}
