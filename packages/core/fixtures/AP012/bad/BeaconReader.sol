pragma solidity ^0.8.20;

contract BeaconReader {
    address public constant BEACON_ROOTS = 0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02;

    function root(uint256 timestamp) external view returns (bytes32) {
        (bool ok, bytes memory data) = BEACON_ROOTS.staticcall(abi.encode(timestamp));
        require(ok);
        return abi.decode(data, (bytes32));
    }
}
