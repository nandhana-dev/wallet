export default function Home({ setState }) {
  return (
    <div className="container">
      <h2>AetherPay</h2>
      <p>Create a new wallet to get started.</p>

      <button
        onClick={() =>
          chrome.runtime.sendMessage({ type: "GET_STATE" }, (res) => {
            if (res?.address) {
              // Wallet exists → go unlock instead of create
              setState((s) => ({ ...s, view: "unlock", initialized: true }));
            } else {
              setState((s) => ({ ...s, view: "create" }));
            }
          })
        }
      >
        Create Wallet
      </button>
    </div>
  );
}
