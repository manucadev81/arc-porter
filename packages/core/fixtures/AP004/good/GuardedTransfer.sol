pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract GuardedTransfer {
    IERC20 public immutable usdc;
    address public vault;

    constructor(IERC20 usdc_, address vault_) {
        require(vault_ != address(0), "vault");
        usdc = usdc_;
        vault = vault_;
    }

    function retire(uint256 amount) external {
        require(vault != address(0));
        usdc.transfer(vault, amount);
    }

    function forward() external payable {
        payable(vault).transfer(msg.value);
    }

    function isUnset(address account) external pure returns (bool) {
        return account == address(0);
    }
}
