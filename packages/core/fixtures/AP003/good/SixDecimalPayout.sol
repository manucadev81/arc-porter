pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

contract SixDecimalPayout {
    IERC20 public constant USDC = IERC20(0x3600000000000000000000000000000000000000);
    uint256 public constant ONE = 10 ** 6;

    function payDollars(address to, uint256 dollars) external {
        USDC.transfer(to, dollars * 1e6);
    }

    function payScaled(address to, uint256 dollars) external {
        USDC.transfer(to, dollars * 10 ** USDC.decimals());
    }
}
