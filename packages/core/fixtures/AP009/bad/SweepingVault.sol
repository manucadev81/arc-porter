pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract SweepingVault {
    IERC20 public immutable usdc;
    address public immutable owner;

    constructor(IERC20 usdc_) {
        usdc = usdc_;
        owner = msg.sender;
    }

    function deposit(uint256 amount) external {
        usdc.transferFrom(msg.sender, address(this), amount);
    }

    function sweep() external {
        require(msg.sender == owner);
        payable(owner).transfer(address(this).balance);
    }

    function sweepWithCall() external {
        (bool ok, ) = owner.call{value: address(this).balance}("");
        require(ok);
    }
}
