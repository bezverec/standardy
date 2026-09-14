import type { RuleVersion } from "./model.ts";

export interface FieldChange {
  field: string;
  old: unknown;
  new: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function diffFields(before: unknown, after: unknown, prefix = ""): FieldChange[] {
  if (Object.is(before, after)) return [];
  if (Array.isArray(before) || Array.isArray(after)) {
    return JSON.stringify(before) === JSON.stringify(after) ? [] : [{ field: prefix, old: before, new: after }];
  }
  if (!isObject(before) || !isObject(after)) return [{ field: prefix, old: before, new: after }];

  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  return keys.flatMap((key) => diffFields(before[key], after[key], prefix ? `${prefix}.${key}` : key));
}

export function semanticProfileDiff(
  rules: Array<{ rule_id: string; profile_id: string } & RuleVersion>,
  profileId: string,
  versionA: string,
  versionB: string,
) {
  const select = (version: string) => new Map(
    rules.filter((rule) => rule.profile_id === profileId && rule.version === version).map((rule) => [rule.rule_id, rule]),
  );
  const before = select(versionA);
  const after = select(versionB);
  const added = [...after.keys()].filter((id) => !before.has(id)).sort();
  const removed = [...before.keys()].filter((id) => !after.has(id)).sort();
  const changed = [...before.keys()].filter((id) => after.has(id)).sort().flatMap((id) => {
    const changes = diffFields(before.get(id), after.get(id)).filter((change) => !["source_file"].includes(change.field));
    return changes.length ? [{ rule: id, changes }] : [];
  });
  return { profile: profileId, version_a: versionA, version_b: versionB, added, removed, changed };
}
