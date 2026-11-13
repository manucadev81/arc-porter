import type { Rule } from "../finding.js";
import { DOCS } from "../sources.js";

export const NATIVE_SENTINEL = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export const ap008: Rule = {
  id: "AP008",
  name: "native-asset-sentinel",
  title: "EIP-7528 native-asset sentinel must not be aliased to Arc's USDC",
  severity: "medium",
  confidence: "high",
  docUrl: `${DOCS.stablecoinModel}#two-interfaces-one-balance`,
  sources: [DOCS.stablecoinModel, DOCS.porting],
  description:
    "DeFi SDKs use 0xEeee...EEeE as a stand-in for the native asset in routing tables. Arc's docs say not to alias that sentinel to the USDC ERC-20 address 0x3600...0000: the two interfaces move the same balance with different decimals, so treating the sentinel as another name for USDC conflates native value transfers with ERC-20 transfers.",
  suggestion:
    "Keep the sentinel for native value paths only; never map it to 0x3600000000000000000000000000000000000000 or treat the two as interchangeable.",
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
