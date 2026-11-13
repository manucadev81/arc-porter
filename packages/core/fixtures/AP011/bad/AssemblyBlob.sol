pragma solidity ^0.8.20;

contract AssemblyBlob {
    function fee() external view returns (uint256 f) {
        assembly {
            f := blobbasefee()
        }
    }
}
