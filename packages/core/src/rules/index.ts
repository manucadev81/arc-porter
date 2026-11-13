import type { Rule } from "../finding.js";
import { ap001 } from "./ap001-prevrandao-randomness.js";
import { ap004 } from "./ap004-value-to-zero-address.js";
import { ap006 } from "./ap006-selfdestruct-usage.js";
import { ap008 } from "./ap008-native-asset-sentinel.js";

export const rules: readonly Rule[] = [ap001, ap004, ap006, ap008];

export const ruleIds: readonly string[] = rules.map((rule) => rule.id);

export function findRule(id: string): Rule | undefined {
  const wanted = id.toUpperCase();
  return rules.find((rule) => rule.id === wanted || rule.name === id);
}
