pragma solidity ^0.8.20;

contract StrictHeartbeat {
    uint256 public lastTimestamp;
    mapping(address => uint256) public previousUpdateTime;

    function beat() external {
        require(block.timestamp > lastTimestamp, "same second");
        lastTimestamp = block.timestamp;
    }

    function touch() external {
        if (previousUpdateTime[msg.sender] < block.timestamp) {
            previousUpdateTime[msg.sender] = block.timestamp;
        }
    }
}
