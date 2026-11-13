pragma solidity ^0.8.20;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
}

contract AmountCheck {
    IERC20 public immutable usdc;

    constructor(IERC20 usdc_) {
        usdc = usdc_;
    }

    function canPay(address account, uint256 amount) external view returns (bool) {
        return usdc.balanceOf(account) >= amount;
    }

    function dust(address account) external view returns (bool) {
        return account.balance == 0;
    }
}
