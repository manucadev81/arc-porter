pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract ZeroVariants {
    IERC20 public immutable usdc;

    constructor(IERC20 usdc_) {
        usdc = usdc_;
    }

    function hexZero() external payable {
        payable(address(0x0)).transfer(msg.value);
    }

    function castZero(uint256 amount) external {
        usdc.transfer(address(uint160(0)), amount);
    }

    function literalZero() external payable {
        payable(0x0000000000000000000000000000000000000000).transfer(msg.value);
    }
}
