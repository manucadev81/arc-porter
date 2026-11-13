pragma solidity ^0.8.20;

contract Closable {
    address public immutable owner;

    constructor() {
        owner = msg.sender;
    }

    function close() external {
        require(msg.sender == owner);
        selfdestruct(payable(owner));
    }
}
