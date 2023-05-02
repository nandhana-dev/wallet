// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

contract KBAWalletInfo {
    string private WalletInfo;
    
    constructor() {
        WalletInfo = "KBA wallet.Version 1.0";
    }
    
    function store_it() public view returns (string memory) {
        return WalletInfo;
    }
}