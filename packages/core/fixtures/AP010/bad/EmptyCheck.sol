pragma solidity ^0.8.20;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

contract EmptyCheck {
    IERC20 public immutable usdc;

    constructor(IERC20 usdc_) {
        usdc = usdc_;
    }

    function isEmpty(address account) external view returns (bool) {
        return usdc.balanceOf(account) == 0;
    }

    function drained() external view returns (bool) {
        return 0 == usdc.balanceOf(address(this));
    }
}
