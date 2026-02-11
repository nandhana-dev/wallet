import { useEffect, useState } from "react";
import Home from "./Home";
import CreateWallet from "./CreateWallet";
import Unlock from "./Unlock";
import Wallet from "./Wallet";

export default function App() {
  const [state, setState] = useState({
    initialized: false,
    unlocked: false,
    address: null,
    view: "home"
  });

  // NEW: single source of truth re-sync
  const syncWithBackground = () => {
    chrome.runtime.sendMessage({ type: "GET_STATE" }, (res) => {
      // No wallet yet
      if (!res || !res.address) {
        setState({
          initialized: false,
          unlocked: false,
          address: null,
          view: "home"
        });
        return;
      }

      // Wallet exists
      setState({
        initialized: true,
        unlocked: res.unlocked,
        address: res.address,
        view: res.unlocked ? "wallet" : "unlock"
      });
    });
  };

  useEffect(() => {
    syncWithBackground();
  }, []);

  switch (state.view) {
    case "home":
      return <Home setState={setState} />;

    case "create":
      return <CreateWallet setState={setState} />;

    case "unlock":
      return <Unlock setState={setState} />;

    case "wallet":
      return (
        <Wallet
          state={state}
          setState={setState}
          syncWithBackground={syncWithBackground}
        />
      );

    default:
      return <Home setState={setState} />;
  }
}
