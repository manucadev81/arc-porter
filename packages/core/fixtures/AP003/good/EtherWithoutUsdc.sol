pragma solidity ^0.8.20;

contract EtherWithoutUsdc {
    uint256 public constant PRICE = 1 ether;
    uint256 public constant SCALE = 1e18;

    function cost(uint256 units) external pure returns (uint256) {
        return units * PRICE / SCALE;
    }
}
