pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract PullSplitter {
    IERC20 public immutable usdc;
    mapping(address => uint256) public claimable;

    constructor(IERC20 usdc_) {
        usdc = usdc_;
    }

    function split(address[] calldata to, uint256 amount) external {
        for (uint256 i; i < to.length; i++) {
            claimable[to[i]] += amount;
        }
    }

    function total(address[] calldata accounts) external view returns (uint256 sum) {
        for (uint256 i; i < accounts.length; i++) {
            sum += usdc.balanceOf(accounts[i]);
        }
    }

    function withdraw() external {
        uint256 amount = claimable[msg.sender];
        claimable[msg.sender] = 0;
        usdc.transfer(msg.sender, amount);
    }
}
