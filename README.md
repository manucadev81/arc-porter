# Arc Porter

Static checker that reads Solidity source and flags code that breaks or behaves differently on [Arc](https://www.arc.io/).

Most Ethereum contracts run on Arc unchanged. The ones that do not usually trip over the same fact: USDC is the native asset, with 18 decimals natively and 6 through its ERC-20 interface, over a single balance. Arc documents the checks in a manual guide, [Port a contract to Arc](https://docs.arc.io/arc/tutorials/porting-contracts-to-arc). Arc Porter turns that guide into rules that run on your source before you deploy.

## Status

Specification approved. Implementation is starting; nothing is published to npm yet.

| Part | State |
| :- | :- |
| Specification, plan and tasks | Done, in [`specs/001-arc-porter`](specs/001-arc-porter) (Portuguese) |
| Rule engine and rules | Not yet |
| Command line | Not yet |
| GitHub Action | Not yet |
| Web playground | Not yet |

## Planned rules

| ID | Rule | Flags |
| :- | :- | :- |
| AP001 | prevrandao-randomness | `block.prevrandao` or `block.difficulty`; `PREVRANDAO` always returns 0 on Arc |
| AP002 | native-erc20-decimal-mix | `msg.value` or `.balance` mixed with token calls in one function |
| AP003 | usdc-18-decimals | The Arc USDC address scaled with `1e18` or `ether` |
| AP004 | value-to-zero-address | Value or tokens sent to `address(0)` |
| AP005 | push-payment-loop | Transfers inside a loop, which one blocklisted recipient can revert |
| AP006 | selfdestruct-usage | Any `selfdestruct` |
| AP007 | wrapped-native-pattern | `WETH`, `IWETH`, `WUSDC` and wrap or unwrap calls |
| AP008 | native-asset-sentinel | The EIP-7528 native-asset sentinel address |
| AP009 | native-balance-sweep | Sweeping `address(this).balance` in a contract that also handles tokens |
| AP010 | zero-balance-check | `balanceOf(...) == 0` used as a condition |
| AP011 | blob-opcodes | `blobhash(...)` or `block.blobbasefee` |
| AP012 | beacon-roots | The EIP-4788 beacon-roots contract address |
| AP013 | timestamp-strict-ordering | Logic that assumes `block.timestamp` strictly increases |

Every rule cites the Arc documentation page it comes from, and every finding carries a severity and a confidence level.

## What it is not

Arc Porter is not an audit. The analysis is syntactic, so it can miss problems and raise false alarms. It complements `arc-forge test` from [Arc Foundry](https://github.com/circlefin/arc-foundry) and a security review; it replaces neither.

## Author

Manoel Lúcio, Nearxlabs. [GitHub](https://github.com/manucadev81)

## License

MIT
