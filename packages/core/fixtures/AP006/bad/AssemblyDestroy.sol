pragma solidity ^0.8.20;

contract AssemblyDestroy {
    function destroy(address to) external {
        assembly {
            selfdestruct(to)
        }
    }
}
