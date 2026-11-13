import type { Rule } from "../finding.js";
import { ap001 } from "./ap001-prevrandao-randomness.js";
import { ap002 } from "./ap002-native-erc20-decimal-mix.js";
import { ap003 } from "./ap003-usdc-18-decimals.js";
import { ap004 } from "./ap004-value-to-zero-address.js";
import { ap005 } from "./ap005-push-payment-loop.js";
import { ap006 } from "./ap006-selfdestruct-usage.js";
import { ap007 } from "./ap007-wrapped-native-pattern.js";
import { ap008 } from "./ap008-native-asset-sentinel.js";
import { ap009 } from "./ap009-native-balance-sweep.js";
import { ap010 } from "./ap010-zero-balance-check.js";
import { ap011 } from "./ap011-blob-opcodes.js";
import { ap012 } from "./ap012-beacon-roots.js";
import { ap013 } from "./ap013-timestamp-strict-ordering.js";

export const rules: readonly Rule[] = [
  ap001,
  ap002,
  ap003,
  ap004,
  ap005,
  ap006,
  ap007,
  ap008,
  ap009,
  ap010,
  ap011,
  ap012,
  ap013,
];

export const ruleIds: readonly string[] = rules.map((rule) => rule.id);

export function findRule(id: string): Rule | undefined {
  const wanted = id.toUpperCase();
  return rules.find((rule) => rule.id === wanted || rule.name === id);
}
