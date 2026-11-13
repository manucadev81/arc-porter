pragma solidity ^0.8.20;

contract LegacyDifficulty {
    function roll() external view returns (uint256) {
        return block.difficulty % 6;
    }
}
