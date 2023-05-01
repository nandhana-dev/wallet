// Get the walletPassword input element from the HTML page
const walletPasswordInput = document.getElementById("txtWalletPassword");

// Encrypt the walletPassword and store it in local storage
function savewalletPassword() {
  const walletPassword = walletPasswordInput.value;
  const encryptedData = window.btoa(walletPassword);
  localStorage.setItem("encryptedwalletPassword", encryptedData);
  console.log("walletPassword saved:", walletPassword);
  const result = loadwalletPassword();
}

// Retrieve the encrypted walletPassword from local storage and decrypt it
function loadwalletPassword() {
  const encryptedData = localStorage.getItem("encryptedwalletPassword");
  if (!encryptedData) {
    console.log("No walletPassword saved");
    return;
  }
  try {
    const decryptedData = window.atob(encryptedData);
    console.log("walletPassword loaded:", decryptedData);
    walletPasswordInput.value = decryptedData;
  } catch (error) {
    console.error("Error decoding base64 string:", error);
  }
}

// Bind the savewalletPassword and loadwalletPassword functions to the appropriate events
document.getElementById("save-button").addEventListener("click", savewalletPassword);
window.addEventListener("load", loadwalletPassword);