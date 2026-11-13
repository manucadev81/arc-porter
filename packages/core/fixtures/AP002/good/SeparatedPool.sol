pragma solidity ^0.8.20;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract SeparatedPool {
    IERC20 public immutable usdc;
    mapping(address => uint256) public shares;

    constructor(IERC20 usdc_) {
        usdc = usdc_;
    }

    function deposit(uint256 amount) external {
        require(usdc.balanceOf(msg.sender) >= amount, "insufficient");
        usdc.transferFrom(msg.sender, address(this), amount);
        shares[msg.sender] += amount;
    }

    function depositNative() external payable {
        shares[msg.sender] += msg.value / 1e12;
    }

    function held() external view returns (uint256) {
        return address(this).balance;
    }
}
