# Arc sample applications - Solidity corpus sources

Collected 2026-11-13 from the apps listed at https://docs.arc.io/arc/references/sample-applications.
Each repo was shallow-cloned (`git clone --depth 1`) into `/Users/manoellucio/OpenBot/Shared/arc-porter/external/<repo-name>`.
Only `.sol` files were copied into this directory (relative paths preserved; `node_modules`, `lib`, `out`, `cache`, `artifacts` skipped).
All 12 repos ship a `LICENSE` file containing the Apache License, Version 2.0.

| App name | Docs page | Repo | Commit SHA | License | .sol copied | Notes |
|---|---|---|---|---|---|---|
| Arc commerce | https://docs.arc.io/build/sample-apps/arc-commerce | https://github.com/circlefin/arc-commerce | 1a4f09d79883c15cb2fa8527a3ad210b3e01a552 | LICENSE (Apache-2.0) | 0 | Repo has no .sol files (TypeScript app using Circle APIs only) |
| Arc P2P payments | https://docs.arc.io/build/sample-apps/arc-p2p-payments | https://github.com/circlefin/arc-p2p-payments | 499d1f5fb0ea85b0b3d4f38fdcca00e668f6c351 | LICENSE (Apache-2.0) | 0 | Repo has no .sol files |
| Arc escrow | https://docs.arc.io/build/sample-apps/arc-escrow | https://github.com/circlefin/arc-escrow | d5006bc44518db7ee85ad9bc645646c04bf4c090 | LICENSE (Apache-2.0) | 1 | `contracts/escrow_smart_contract/RefundProtocol.sol` |
| Arc nanopayments | https://docs.arc.io/build/sample-apps/arc-nanopayments | https://github.com/circlefin/arc-nanopayments | a29f920ed8eef89bec36d5138892c72b13759710 | LICENSE (Apache-2.0) | 0 | Repo has no .sol files |
| Arc e-commerce payments | https://docs.arc.io/build/sample-apps/arc-ecommerce-payments | https://github.com/circlefin/arc-ecommerce-payments | be2017d8a700e8cd292bb39132de85a68baf5f12 | LICENSE (Apache-2.0) | 0 | Repo has no .sol files; `contracts/artifacts/*.json` are ABIs only (AuthCaptureEscrow, ERC3009PaymentCollector, OperatorRefundCollector). Solidity source lives in the third-party repo https://github.com/base/commerce-payments, which is not an Arc sample app and was not cloned |
| USDC Onramp Demo | https://docs.arc.io/build/sample-apps/usdc-onramp-demo | https://github.com/circlefin/onramp-kit-demo | 676363250f1e80995437a45e2438462c5ed190d9 | LICENSE (Apache-2.0) | 0 | Repo has no .sol files |
| Arc multichain wallet | https://docs.arc.io/build/sample-apps/arc-multichain-wallet | https://github.com/circlefin/arc-multichain-wallet | 17befda546b6d6e3ba8942f2039acd53a1b55ea9 | LICENSE (Apache-2.0) | 0 | Repo has no .sol files |
| Arc fintech | https://docs.arc.io/build/sample-apps/arc-fintech | https://github.com/circlefin/arc-fintech | 0b10d386ce2a30e1a0572f28a5aad4aaf4fc66e6 | LICENSE (Apache-2.0) | 0 | Repo has no .sol files |
| Arc stablecoin FX | https://docs.arc.io/build/sample-apps/arc-stablecoin-fx | https://github.com/circlefin/arc-stablecoin-fx | 53b2b39a4041a5df7fbce199727705b4a6fa8aab | LICENSE (Apache-2.0) | 0 | Repo has no .sol files |
| Arc DeFi lend and borrow | https://docs.arc.io/build/sample-apps/arc-defi-lend-borrow | https://github.com/circlefin/arc-defi-lend-borrow | d621644e29ddac521fefb55dd923adba5c797d0d | LICENSE (Apache-2.0) | 2 | `contracts/LendingBorrowing.sol`, `contracts/TestnetERC20.sol` |
| Arc USDC borrowing | https://docs.arc.io/build/sample-apps/arc-usdc-borrowing | https://github.com/circlefin/arc-usdc-borrowing | 5d558bcc9b08412a2276d28e8706aa5b52790185 | LICENSE (Apache-2.0) | 0 | Repo has no .sol files |
| Arc prediction markets | https://docs.arc.io/build/sample-apps/arc-prediction-markets | https://github.com/circlefin/arc-prediction-markets | 89b57f85ee92df3922d2c4ef16469a04ef716fe2 | LICENSE (Apache-2.0) | 4 | `contracts/EventBasedPredictionMarket.sol`, `contracts/PredictionMarketAMM.sol`, `contracts/test/MockPredictionMarket.sol`, `contracts/test/TestCollateral.sol` |

Total `.sol` files copied: 7 (3 of 12 apps contain Solidity).

No `.sol` files were found in excluded directories either (no git submodules, no `lib/`, `out/`, `cache/` Solidity), so the exclusion rules did not drop anything.
