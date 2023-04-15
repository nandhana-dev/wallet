import { ethers } from './ethers.min.js';

const seedPhrase = document.getElementById("seedPhrase");

const provider = new ethers.providers.JsonRpcProvider('http://localhost:7545');  
const wallet = ethers.Wallet.createRandom();
const mnemonic = wallet.mnemonic.phrase;
console.log('New wallet created:');
console.log(`Address: ${wallet.address}`);
console.log(`Seed phrase: ${mnemonic}`);

localStorage.setItem("SeedPhrase", mnemonic);

seedPhrase.textContent = mnemonic;

document.addEventListener('DOMContentLoaded', function() {
    var btnGoTowallet = document.getElementById('btnGoTowallet');
    btnGoTowallet.addEventListener('click', function() {
        GoToWallet();
    });
});

function GoToWallet()
{
    window.location.href = 'Wallet.html';
}