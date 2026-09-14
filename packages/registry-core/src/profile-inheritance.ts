import type { ProfileDocument } from "./model.ts";

export function profileAncestors(profiles: ProfileDocument[], profileId: string): string[] {
  const byId = new Map(profiles.map((profile) => [profile.id, profile]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(id: string): void {
    if (visiting.has(id)) throw new Error(`Profile inheritance cycle at ${id}`);
    if (visited.has(id)) return;
    const profile = byId.get(id);
    if (!profile) throw new Error(`Unknown profile ${id}`);
    visiting.add(id);
    for (const parent of profile.inherits ?? []) visit(parent.profile);
    visiting.delete(id);
    visited.add(id);
    if (id !== profileId) result.push(id);
  }

  visit(profileId);
  return result;
}
