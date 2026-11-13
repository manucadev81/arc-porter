pragma solidity ^0.8.20;

contract Raffle {
    address[] public players;

    function enter() external payable {
        players.push(msg.sender);
    }

    function winner() external view returns (address) {
        uint256 at = uint256(keccak256(abi.encodePacked(block.prevrandao, players.length))) % players.length;
        return players[at];
    }
}
