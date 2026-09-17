import type { NationalStandardDocument } from "./model.ts";

export function nationalStandardAncestors(nationalStandards: NationalStandardDocument[], nationalStandardId: string): string[] {
  const byId = new Map(nationalStandards.map((nationalStandard) => [nationalStandard.id, nationalStandard]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(id: string): void {
    if (visiting.has(id)) throw new Error(`National standard inheritance cycle at ${id}`);
    if (visited.has(id)) return;
    const nationalStandard = byId.get(id);
    if (!nationalStandard) throw new Error(`Unknown national standard ${id}`);
    visiting.add(id);
    for (const parent of nationalStandard.inherits ?? []) visit(parent.national_standard);
    visiting.delete(id);
    visited.add(id);
    if (id !== nationalStandardId) result.push(id);
  }

  visit(nationalStandardId);
  return result;
}
