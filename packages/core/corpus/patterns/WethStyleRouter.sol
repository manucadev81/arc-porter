pragma solidity ^0.8.20;

interface IWETH {
    function deposit() external payable;
    function withdraw(uint256) external;
    function transfer(address to, uint256 value) external returns (bool);
}

interface IPair {
    function swap(uint256 amount0Out, uint256 amount1Out, address to) external;
}

contract WethStyleRouter {
    address public immutable factory;
    address public immutable WETH;

    constructor(address factory_, address weth_) {
        factory = factory_;
        WETH = weth_;
    }

    receive() external payable {
        assert(msg.sender == WETH);
    }

    function swapExactETHForTokens(uint256 amountOutMin, address pair, address to) external payable returns (uint256) {
        IWETH(WETH).deposit{value: msg.value}();
        assert(IWETH(WETH).transfer(pair, msg.value));
        IPair(pair).swap(0, amountOutMin, to);
        return amountOutMin;
    }

    function swapExactTokensForETH(uint256 amountOut, address pair, address payable to) external {
        IPair(pair).swap(amountOut, 0, address(this));
        IWETH(WETH).withdraw(amountOut);
        to.transfer(amountOut);
    }
}
