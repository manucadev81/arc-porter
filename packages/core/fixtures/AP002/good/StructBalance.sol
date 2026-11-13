pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract StructBalance {
    struct Account {
        uint256 balance;
        uint256 updatedAt;
    }

    IERC20 public immutable usdc;
    mapping(address => Account) public accounts;

    constructor(IERC20 usdc_) {
        usdc = usdc_;
    }

    function withdraw(uint256 amount) external {
        accounts[msg.sender].balance -= amount;
        usdc.transfer(msg.sender, amount);
    }
}
