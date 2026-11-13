pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract BurnByTransfer {
    IERC20 public immutable usdc;

    constructor(IERC20 usdc_) {
        usdc = usdc_;
    }

    function burnNative() external payable {
        payable(address(0)).transfer(msg.value);
    }

    function burnWithCall() external payable {
        (bool ok, ) = address(0).call{value: msg.value}("");
        require(ok);
    }

    function burnToken(uint256 amount) external {
        usdc.transfer(address(0), amount);
    }

    function burnFrom(address from, uint256 amount) external {
        usdc.transferFrom(from, address(0), amount);
    }
}
