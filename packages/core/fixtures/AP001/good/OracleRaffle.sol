pragma solidity ^0.8.20;

interface IRandomness {
    function latest() external view returns (uint256);
}

contract OracleRaffle {
    IRandomness public immutable oracle;
    address[] public players;
    uint256 public difficulty;

    constructor(IRandomness oracle_) {
        oracle = oracle_;
    }

    function enter() external payable {
        players.push(msg.sender);
    }

    function setDifficulty(uint256 value) external {
        difficulty = value;
    }

    function winner() external view returns (address) {
        return players[oracle.latest() % players.length];
    }

    function height() external view returns (uint256) {
        return block.number;
    }
}
