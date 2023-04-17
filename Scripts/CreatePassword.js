import { ethers } from './ethers.min.js';

  var button = document.getElementById('btnRegister');

  document.addEventListener('DOMContentLoaded', function() {
    
  button.addEventListener('click', function() {
    const password = "your_password";
    localStorage.setItem("Password", password);
    const storedPassword = localStorage.getItem("Password");
    window.location.href = 'OnBoard.html';
    });

  });


  