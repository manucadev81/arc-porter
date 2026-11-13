pragma solidity ^0.8.20;

contract SentinelRouter {
    address public constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    function isNative(address token) external pure returns (bool) {
        return token == NATIVE;
    }
}
