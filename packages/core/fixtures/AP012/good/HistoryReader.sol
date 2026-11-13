pragma solidity ^0.8.20;

contract HistoryReader {
    address public constant HISTORY = 0x0000F90827F1C53a10cb7A02335B175320002935;

    function hashAt(uint256 number) external view returns (bytes32) {
        (bool ok, bytes memory data) = HISTORY.staticcall(abi.encode(number));
        require(ok);
        return abi.decode(data, (bytes32));
    }
}
