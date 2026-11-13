pragma solidity ^0.8.20;

interface IWrapper {
    function deposit() external payable;
    function withdraw(uint256) external;
}

contract WrapUnwrapOnly {
    IWrapper public immutable wrapper;

    constructor(IWrapper wrapper_) {
        wrapper = wrapper_;
    }

    function roundTrip(uint256 amount) external payable {
        wrapper.deposit{value: msg.value}();
        wrapper.withdraw(amount);
    }
}
