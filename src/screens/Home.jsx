export default function Home({ setState }) {
  return (
    <div className="container">
      <h2>AetherPay</h2>
      <p>Create a new wallet to get started.</p>

      <button
        onClick={() =>
          setState((s) => ({ ...s, view: "create" }))
        }
      >
        Create Wallet
      </button>
    </div>
  );
}
