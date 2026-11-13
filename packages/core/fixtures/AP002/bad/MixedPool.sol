pragma solidity ^0.8.20;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract MixedPool {
    IERC20 public immutable usdc;
    mapping(address => uint256) public shares;

    constructor(IERC20 usdc_) {
        usdc = usdc_;
    }

    function deposit() external payable {
        require(msg.value <= usdc.balanceOf(msg.sender), "insufficient");
        shares[msg.sender] += msg.value;
    }

    function refund(address payable to) external {
        uint256 held = address(this).balance;
        usdc.transfer(to, held);
    }
}
