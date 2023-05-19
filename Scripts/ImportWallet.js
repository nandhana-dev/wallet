import { WalletGlobal } from './WalletGlobal.js';
import { ethers } from './ethers.min.js';

//const seedPhrase = WalletGlobal.WalletSeedPhrase;
const password = WalletGlobal.WalletPassword;
//const walletAccounts = WalletGlobal.WalletAccounts;
const walletNetworkEndpoint = WalletGlobal.WalletNetworkEndpoint;
const provider = new ethers.providers.JsonRpcProvider(walletNetworkEndpoint);
const decryptPassword = window.atob(password) ; 
const walletphraseInput = document.getElementById("txtWalletPhrase");

const btnimportwallet = document.getElementById("importwallet");

document.addEventListener('DOMContentLoaded', function() {
  btnimportwallet.addEventListener('click', function() {
    const walletPhrase=walletphraseInput.value;
    localStorage.setItem("SeedPhrase", walletPhrase.trim());
    importwallet(walletPhrase);    });
});

async function importwallet(seedPhrase) {

  console.log('Importing wallet with seed phrase: ' + seedPhrase);  
  const wallet = ethers.Wallet.fromMnemonic(seedPhrase).connect(provider);

  // Get all the wallet addresses
  const accounts = await provider.listAccounts();
  console.log('Wallet addresses:', accounts);

  // Encrypt the wallet and store it in local storage
  const encryptedJson = await wallet.encrypt(decryptPassword);
  await localStorage.setItem("EncryptedWallet", encryptedJson);
  console.log("Wallet is successfully imported and encrypted!");
  loadWallet();
  
}
function loadWallet(){
  window.location.href = 'Wallet.html';
}


