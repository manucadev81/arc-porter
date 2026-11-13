pragma solidity ^0.8.20;

contract NativeOnlyTipJar {
    address public immutable owner;

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

    function sweep() external {
        require(msg.sender == owner);
        payable(owner).transfer(address(this).balance);
    }
}
