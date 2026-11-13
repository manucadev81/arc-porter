pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract UsdcVault {
    IERC20 public constant USDC = IERC20(0x3600000000000000000000000000000000000000);
    mapping(address => uint256) public deposits;

    function deposit(uint256 amount) external {
        USDC.transferFrom(msg.sender, address(this), amount);
        deposits[msg.sender] += amount;
    }

    function withdraw(uint256 amount) external {
        deposits[msg.sender] -= amount;
        USDC.transfer(msg.sender, amount);
    }
}
