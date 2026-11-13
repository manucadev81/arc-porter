pragma solidity ^0.8.20;

contract Pausable {
    address public immutable owner;
    bool public closed;

    constructor() {
        owner = msg.sender;
    }

    function close() external {
        require(msg.sender == owner);
        closed = true;
        payable(owner).transfer(address(this).balance);
    }

    function destroy() external pure returns (string memory) {
        return "not supported";
    }
}
