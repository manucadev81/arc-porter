pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract LoopSplitter {
    IERC20 public immutable usdc;

    constructor(IERC20 usdc_) {
        usdc = usdc_;
    }

    function splitNative(address payable[] calldata to) external payable {
        uint256 part = msg.value / to.length;
        for (uint256 i; i < to.length; i++) {
            to[i].transfer(part);
        }
    }

    function splitWithCall(address[] calldata to) external payable {
        uint256 part = msg.value / to.length;
        uint256 i;
        while (i < to.length) {
            (bool ok, ) = to[i].call{value: part}("");
            require(ok);
            i++;
        }
    }

    function splitToken(address[] calldata to, uint256 amount) external {
        for (uint256 i; i < to.length; i++) {
            usdc.transfer(to[i], amount);
        }
    }
}
