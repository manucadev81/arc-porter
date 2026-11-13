# Arc Porter

Static checker that reads Solidity source and flags code that breaks or behaves differently on [Arc](https://www.arc.io/).

Most Ethereum contracts run on Arc unchanged. The ones that do not usually trip over the same fact: USDC is the native asset, with 18 decimals natively and 6 through its ERC-20 interface, over a single balance. Arc documents the checks in a manual guide, [Port a contract to Arc](https://docs.arc.io/arc/tutorials/porting-contracts-to-arc). Arc Porter turns that guide into rules that run on your source before you deploy.

## Status

| Part | State |
| :- | :- |
| Rule engine and the 13 rules | Done, with bad and good examples for every rule |
| Text, JSON and SARIF 2.1.0 output | Done |
| Configuration and suppressions | Done |
| Command line | Done, not yet published to npm |
| GitHub Action | Not yet |
| Web playground | Not yet |

## First run

Requires Node 20 or newer. Until the package is on npm, run it from a clone:

```bash
git clone https://github.com/manucadev81/arc-porter.git
cd arc-porter
pnpm install
pnpm build
node packages/cli/dist/main.js check path/to/your/contracts
```

The command lists every finding with its rule, severity, confidence, file, line, a one-line explanation and the link to the Arc docs page it comes from. It skips `lib/`, `node_modules/`, `out/` and `cache/`.

```text
HIGH AP001 block.prevrandao always returns 0 on Arc.
  src/Raffle.sol:11:34  confidence high
  uint256 at = uint256(keccak256(abi.encodePacked(block.prevrandao, players.length))) % players.length;
  Suggestion: Use a verifiable random function or a randomness oracle instead of block.prevrandao.
  Docs: https://docs.arc.io/arc/references/evm-differences#execution-and-opcode-differences
```

Exit codes: `0` when no finding reaches the threshold, `1` when at least one does, `2` on a usage error or when a file could not be parsed (the other files are still analyzed and the broken one is named).

## Commands

```text
arc-porter check [paths...] [--format text|json|sarif] [--fail-on low|medium|high]
                 [--config <file>] [--output <file>] [--no-color]
arc-porter rules [--format text|json]
arc-porter explain <rule-id>
arc-porter --version
```

`--fail-on` defaults to `high`. `--format sarif` produces a SARIF 2.1.0 log that GitHub code scanning accepts.

### Configuration

Create `arc-porter.json` and pass it with `--config`:

```json
{
  "failOn": "high",
  "ignore": ["test/**", "script/**"],
  "rules": { "AP010": "off", "AP005": "high" },
  "suppressions": [
    { "rule": "AP006", "file": "src/Legacy.sol", "reason": "Contract is never deployed on Arc" }
  ]
}
```

A suppression needs a `reason`; without one the configuration is rejected. Suppressed findings leave the counts and appear in a "Suppressed" section of the report, with their reason. `line` is optional and narrows the suppression to one line.

## Rules

| ID | Rule | Flags | Severity | Confidence |
| :- | :- | :- | :- | :- |
| AP001 | prevrandao-randomness | `block.prevrandao` or `block.difficulty`; `PREVRANDAO` always returns 0 on Arc | high | high |
| AP002 | native-erc20-decimal-mix | `msg.value` or a native `.balance` mixed with token calls in one function | high | medium |
| AP003 | usdc-18-decimals | The Arc USDC address next to a `1e18`, `10**18` or `ether` scale | high | medium |
| AP004 | value-to-zero-address | Value or tokens sent to `address(0)` | high | high |
| AP005 | push-payment-loop | Transfers inside a loop, which one blocklisted recipient can revert | medium | high |
| AP006 | selfdestruct-usage | Any `selfdestruct` | high | high |
| AP007 | wrapped-native-pattern | `WETH`, `IWETH`, `WUSDC` names, or `deposit{value:}` paired with `withdraw(amount)` | medium | medium |
| AP008 | native-asset-sentinel | The EIP-7528 native-asset sentinel address | medium | high |
| AP009 | native-balance-sweep | Sweeping `address(this).balance` in a contract that also calls the token interface | high | medium |
| AP010 | zero-balance-check | `balanceOf(...) == 0` used as a condition | low | low |
| AP011 | blob-opcodes | `blobhash(...)` or `block.blobbasefee` | medium | high |
| AP012 | beacon-roots | The EIP-4788 beacon-roots contract address | medium | high |
| AP013 | timestamp-strict-ordering | `block.timestamp >` a stored timestamp, which can fail when two blocks share a second | low | low |

Severity is the impact when the pattern is real; confidence is how sure the syntactic match is. Every rule cites the Arc documentation page it comes from, and `arc-porter explain <id>` shows the bad example, the good example and the source. Sources were last verified on 2026-11-13.

## Limits

- The analysis is syntactic. There are no resolved types, so a token call is recognized by its member name (`transfer`, `transferFrom`, `balanceOf`, `approve` and the `safe` variants) and by its argument count. That is why AP002, AP003, AP007 and AP009 carry medium confidence.
- Imports are not resolved and the project is not compiled. Each file is judged on its own.
- Vyper, Yul and bytecode are out of scope.
- The tool never reads the network while analyzing and sends nothing anywhere.

## What it is not

Arc Porter is not an audit. The analysis is syntactic, so it can miss problems and raise false alarms. It complements `arc-forge test` from [Arc Foundry](https://github.com/circlefin/arc-foundry) and a security review; it replaces neither. Every report says so.

## Development

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

Rules live in `packages/core/src/rules/`, one file each, with their examples under `packages/core/fixtures/<ID>/bad` and `good`. The test suite requires every bad example to fire its rule and no good example to fire any rule, and runs the rules over the contracts in `packages/core/corpus/` (see `corpus/SOURCES.md`). On a 2024 laptop, 100 files totaling about 6,000 lines are analyzed in under a second.

## Author

Manoel Lúcio, Nearxlabs. [GitHub](https://github.com/manucadev81)

## License

MIT. Third-party contracts under `packages/core/corpus/` keep their own licenses, listed in `corpus/SOURCES.md`.
