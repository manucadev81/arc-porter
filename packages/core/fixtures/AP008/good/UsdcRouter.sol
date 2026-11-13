pragma solidity ^0.8.20;

contract UsdcRouter {
    address public constant USDC = 0x3600000000000000000000000000000000000000;
    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;

    function isUsdc(address token) external pure returns (bool) {
        return token == USDC;
    }
}
