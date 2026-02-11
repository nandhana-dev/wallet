import { useState } from "react";

export default function CreateWallet({ setState }) {
  const [password, setPassword] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const create = () => {
    if (!password) {
      alert("Enter a password");
      return;
    }

    setLoading(true);

    chrome.runtime.sendMessage(
      { type: "CREATE_WALLET", password },
      (res) => {
        setLoading(false);

        if (!res) {
          alert("Background not responding");
          return;
        }

        if (res.success) {
          setResult(res.data);
        } else {
          alert(res.error);
        }
      }
    );
  };

  // 🔐 Seed confirmation screen
  if (result) {
    return (
      <div className="container">
        <h3>Save Your Seed Phrase</h3>

        <textarea readOnly value={result.mnemonic} />

        <p>Address:</p>
        <code>{result.address}</code>

        <button
          onClick={() =>
            setState({
              initialized: true,
              unlocked: true,          // ✅ IMPORTANT
              address: result.address,
              view: "wallet"           // ✅ go straight to wallet
            })
          }
        >
          I’ve saved it
        </button>
      </div>
    );
  }

  // 🔑 Password entry screen
  return (
    <div className="container">
      <h3>Create Wallet</h3>

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={create} disabled={loading}>
        {loading ? "Creating..." : "Create"}
      </button>
    </div>
  );
}
