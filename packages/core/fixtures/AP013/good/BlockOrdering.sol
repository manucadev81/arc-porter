pragma solidity ^0.8.20;

contract BlockOrdering {
    uint256 public lastBlock;
    uint256 public lastTimestamp;
    uint256 public deadline;

    function beat() external {
        require(block.number > lastBlock, "same block");
        lastBlock = block.number;
        lastTimestamp = block.timestamp;
    }

    function settle() external view returns (bool) {
        return block.timestamp > deadline;
    }

    function fresh() external view returns (bool) {
        return block.timestamp >= lastTimestamp;
    }
}
