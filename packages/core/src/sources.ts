export const SOURCES_VERIFIED_AT = "2026-11-13";

export const DISCLAIMER =
  "Arc Porter is not an audit. The analysis is syntactic: it can miss problems and raise false alarms. It complements arc-forge tests and a security review; it replaces neither.";

export const DOCS = {
  porting: "https://docs.arc.io/arc/tutorials/porting-contracts-to-arc",
  evmDifferences: "https://docs.arc.io/arc/references/evm-differences",
  stablecoinModel: "https://docs.arc.io/arc/concepts/stablecoin-native-model",
  contractAddresses: "https://docs.arc.io/arc/references/contract-addresses",
} as const;

export interface DocSource {
  url: string;
  verifiedAt: string;
}

export const SOURCE_LIST: DocSource[] = Object.values(DOCS).map((url) => ({
  url,
  verifiedAt: SOURCES_VERIFIED_AT,
}));
