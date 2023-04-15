import { ethers } from './ethers.min.js';

var button = document.getElementById('btnRegister');
button.addEventListener('click', function() {
  
  const password = "your_password";
  localStorage.setItem("password", password);

  const storedPassword = localStorage.getItem("password");

  const provider = new ethers.providers.JsonRpcProvider('http://localhost:7545');  
  const wallet = ethers.Wallet.createRandom();
  const mnemonic = wallet.mnemonic.phrase;
  console.log('New wallet created:');
  console.log(`Address: ${wallet.address}`);
  console.log(`Seed phrase: ${mnemonic}`);

  localStorage.setItem("seedphrase", mnemonic);

  window.location.href = 'ShowSeedPhrase.html';

  if (storedUsername) {
    alert("username retrieved from local storage: " + storedUsername);
  } else {
    alert("No username found in local storage.");
  }

});