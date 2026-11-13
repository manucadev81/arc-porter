pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract EighteenDecimalPayout {
    IERC20 public constant USDC = IERC20(0x3600000000000000000000000000000000000000);
    uint256 public constant ONE = 10 ** 18;

    function payDollars(address to, uint256 dollars) external {
        USDC.transfer(to, dollars * 1e18);
    }

    function payOne(address to) external {
        USDC.transfer(to, 1 ether);
    }
}
