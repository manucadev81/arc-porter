pragma solidity ^0.8.20;

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
}

contract WethRouter {
    IWETH public immutable WETH;

    constructor(IWETH weth) {
        WETH = weth;
    }

    function wrap() external payable {
        WETH.deposit{value: msg.value}();
    }

    function unwrap(uint256 amount) external {
        WETH.withdraw(amount);
    }
}
