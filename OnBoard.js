var button = document.getElementById('createNewWallet');
button.addEventListener('click', function() {
  window.location.href = 'ShowSeedPhrase.html';
});

var importExistingWallet = document.getElementById('importExistingWallet');
importExistingWallet.addEventListener('click', function() {
    window.location.href = 'ImportWallet.html';
});