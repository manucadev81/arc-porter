pragma solidity ^0.8.20;

contract FeeReader {
    function fee() external view returns (uint256) {
        return block.basefee;
    }

    function hashOf(bytes memory blob) external pure returns (bytes32) {
        return keccak256(blob);
    }
}
