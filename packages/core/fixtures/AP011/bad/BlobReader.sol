pragma solidity ^0.8.20;

contract BlobReader {
    function first() external view returns (bytes32) {
        return blobhash(0);
    }

    function fee() external view returns (uint256) {
        return block.blobbasefee;
    }
}
