import { ethers } from './ethers.min.js';

// Get the walletPassword input element from the HTML page
const walletPasswordInput = document.getElementById("txtWalletPassword");
const btnSubmit = document.getElementById("btnSubmit");

document.addEventListener('DOMContentLoaded', function() {
  btnSubmit.addEventListener('click', function() {
    savewalletPassword();    });
}); 

// Encrypt the walletPassword and store it in local storage
function savewalletPassword() {
  const walletPassword = walletPasswordInput.value;
  const encryptedData = window.btoa(walletPassword);
  localStorage.setItem("EncryptedwalletPassword", encryptedData);
  console.log("walletPassword saved:", walletPassword);
  const result = loadwalletPassword();
  window.location.href = 'OnBoard.html';
}

// Retrieve the encrypted walletPassword from local storage and decrypt it
function loadwalletPassword() {
  const encryptedData = localStorage.getItem("EncryptedwalletPassword");
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