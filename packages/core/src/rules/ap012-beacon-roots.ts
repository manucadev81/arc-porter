import type { Rule } from "../finding.js";
import { DOCS } from "../sources.js";

export const BEACON_ROOTS = "0x000f3df6d732807ef1319fb7b8bb8522d0beac02";

export const ap012: Rule = {
  id: "AP012",
  name: "beacon-roots",
  title: "The EIP-4788 beacon-roots contract is absent on Arc",
  severity: "medium",
  confidence: "high",
  docUrl: `${DOCS.evmDifferences}#execution-and-opcode-differences`,
  sources: [DOCS.evmDifferences],
  description:
    "Arc omits the EIP-4788 beacon-roots contract, so calls to 0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02 return empty data. Anything that treats it as an oracle or a randomness source gets nothing back.",
  suggestion:
    "Drop the beacon-roots dependency. The EIP-2935 block-hash history contract is deployed on Arc if you need past block hashes.",
  badExample: `contract BeaconReader {
    address constant BEACON_ROOTS = 0x000F3df6D732807Ef1319fB7B8bB8522d0Beac02;

    function root(uint256 timestamp) external view returns (bytes32) {
        (, bytes memory data) = BEACON_ROOTS.staticcall(abi.encode(timestamp));
        return abi.decode(data, (bytes32));
    }
}`,
  goodExample: `contract HistoryReader {
    address constant HISTORY = 0x0000F90827F1C53a10cb7A02335B175320002935;

    function hashAt(uint256 number) external view returns (bytes32) {
        (, bytes memory data) = HISTORY.staticcall(abi.encode(number));
        return abi.decode(data, (bytes32));
    }
}`,
  check(context) {
    return context.index.addresses
      .filter((entry) => entry.value === BEACON_ROOTS)
      .map((entry) => ({
        node: entry.info.node,
        message: "The beacon-roots contract is not deployed on Arc; reads return empty data.",
      }));
  },
};
