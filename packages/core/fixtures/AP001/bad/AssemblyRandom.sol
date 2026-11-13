pragma solidity ^0.8.20;

contract AssemblyRandom {
    function roll() external view returns (uint256 r) {
        assembly {
            r := prevrandao()
        }
    }
}
