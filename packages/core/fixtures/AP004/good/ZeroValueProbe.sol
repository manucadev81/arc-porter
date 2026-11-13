pragma solidity ^0.8.20;

contract ZeroValueProbe {
    function probe() external returns (bool ok) {
        (ok, ) = address(0).call{value: 0}("");
    }
}
