import type { Rule } from "../finding.js";
import { DOCS } from "../sources.js";

export const NATIVE_SENTINEL = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export const ap008: Rule = {
  id: "AP008",
  name: "native-asset-sentinel",
  title: "EIP-7528 native-asset sentinel must not alias Arc's USDC",
  severity: "medium",
  confidence: "high",
  docUrl: `${DOCS.stablecoinModel}#usdc-as-the-native-token`,
  sources: [DOCS.stablecoinModel, DOCS.porting],
  description:
    "DeFi SDKs use 0xEeee...EEeE as a stand-in for native ETH in routing tables. On Arc the native asset is USDC and already has an ERC-20 interface, so aliasing the sentinel to the USDC address conflates native value transfers with ERC-20 transfers.",
  suggestion:
    "Use the USDC ERC-20 address 0x3600000000000000000000000000000000000000 directly instead of a native-asset sentinel.",
  badExample: `contract Router {
    address constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    function isNative(address token) public pure returns (bool) {
        return token == NATIVE;
    }
}`,
  goodExample: `contract Router {
    address constant USDC = 0x3600000000000000000000000000000000000000;

    function isUsdc(address token) public pure returns (bool) {
        return token == USDC;
    }
}`,
  check(context) {
    return context.index.addresses
      .filter((entry) => entry.value === NATIVE_SENTINEL)
      .map((entry) => ({
        node: entry.info.node,
        message:
          "The EIP-7528 native-asset sentinel has no meaning on Arc, where USDC is both native and ERC-20.",
      }));
  },
};
