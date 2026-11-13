# Corpus

Third-party and reference contracts used by the corpus tests (SC-002 to SC-004). They are not fixtures: files from other projects are kept verbatim, including their original comments, so the analysis runs over real code.

| Directory | Origin | Commit | License | Used for |
| :- | :- | :- | :- | :- |
| `arc-milestone-escrow/` | https://github.com/manucadev81/arc-milestone-escrow (`src/MilestoneEscrow.sol`, branch `f0-hardening`) | 8ffbf77 | MIT | SC-002: no high-severity finding |
| `patterns/WethStyleRouter.sol` | Written for this repository; reproduces the wrap and unwrap pattern of Uniswap's `UniswapV2Router02` (GPL-3.0, not vendored) | - | MIT | SC-003: AP007 fires |
| `sample-apps/` | Official Arc sample apps, see `sample-apps/SOURCES.md` | per app | Apache-2.0 (`sample-apps/LICENSE`) | SC-004: analysis runs without failing |

`corpus/external/` is ignored by git. When `corpus/external/UniswapV2Router02.sol` is present (download it from https://github.com/Uniswap/v2-periphery/blob/master/contracts/UniswapV2Router02.sol), the SC-003 test also runs over the real file.
