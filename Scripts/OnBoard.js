    var button = document.getElementById('createNewWallet');
    button.addEventListener('click', function() {
      console.log("ShowSeedPhrase");
      window.location.href = '../Page/ShowSeedPhrase.html';
    });
    
    var importExistingWallet = document.getElementById('importExistingWallet');
    importExistingWallet.addEventListener('click', function() {
        console.log("ImportWallet");
        window.location.href = '../Page/ImportWallet.html';
    });