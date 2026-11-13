pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract AccountedVault {
    IERC20 public immutable usdc;
    address public immutable owner;
    uint256 public owed;

    constructor(IERC20 usdc_) {
        usdc = usdc_;
        owner = msg.sender;
    }

    function deposit(uint256 amount) external {
        usdc.transferFrom(msg.sender, address(this), amount);
        owed += amount;
    }

    function sweepSurplus() external {
        require(msg.sender == owner);
        usdc.transfer(owner, usdc.balanceOf(address(this)) - owed);
    }
}
