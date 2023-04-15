pragma solidity ^0.8.0;

contract MyContract {
    uint256 public myUint;

    function setUint(uint256 _myUint) public {
        myUint = _myUint;
    }
}