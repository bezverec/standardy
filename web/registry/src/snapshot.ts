import type { NormalizedRegistry } from "../../../packages/registry-core/src/model.ts";

let pending: Promise<NormalizedRegistry> | undefined;
async function dataset(): Promise<NormalizedRegistry> {
  pending ??= fetch("/data/registry.json", { credentials: "same-origin" }).then(async (response) => {
    if (!response.ok) throw new Error("Databázi se nepodařilo načíst. Obnovte stránku a zkuste to znovu.");
    return response.json() as Promise<NormalizedRegistry>;
  }).catch((error: unknown) => { pending = undefined; throw error; });
  return pending;
}

export async function snapshotRequest<T>(path: string): Promise<T> {
  const db = await dataset();
  const url = new URL(path, "https://registry.invalid");
  const route = url.pathname;
  let result: unknown;
  if (route === "/meta") result = db.meta;
  else if (route === "/rules") result = { data: db.rule_versions, pagination: { total: db.rule_versions.length } };
  else if (route === "/standards") result = { data: db.standards };
  else if (route === "/national-standards") result = { data: db.national_standards };
  else if (route === "/relations") result = { data: db.relations };
  else {
    const match = route.match(/^\/(rules|standards|national-standards)\/([^/]+)(\/why)?$/);
    if (!match) throw new Error("Požadovaný záznam nebyl nalezen.");
    const id = decodeURIComponent(match[2]!);
    if (match[1] === "rules") {
      const versions = db.rule_versions.filter((rule) => rule.rule_id === id).sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
      if (!versions.length) throw new Error("Pravidlo nebylo nalezeno.");
      if (match[3]) {
        const ids = new Set([id]);
        const edges = db.relations.filter((edge) => edge.from === id);
        edges.forEach((edge) => ids.add(edge.to));
        // Related rules remain leaves: their evidence must not be attributed to this rule.
        for (const edge of db.relations) {
          if (edge.type === "defined_by" && ids.has(edge.from) && !db.rules.some((rule) => rule.id === edge.from)) {
            edges.push(edge); ids.add(edge.to);
          }
        }
        const collections = [
          ["rule", db.rules], ["standard", db.standards], ["national_standard", db.national_standards],
          ["standard_entity", db.standard_entities], ["implementation", db.implementations],
        ] as const;
        result = { root: id, edges, nodes: [...ids].map((nodeId) => {
          for (const [kind, records] of collections) {
            const data = records.find((record) => record.id === nodeId);
            if (data) return { id: nodeId, kind, data };
          }
          throw new Error(`Neplatný cíl vazby: ${nodeId}`);
        }) };
      } else result = { id, versions, relations: db.relations.filter((edge) => edge.from === id || edge.to === id), implementations: db.implementations.filter((item) => item.rule_id === id) };
    } else if (match[1] === "standards") {
      const item = db.standards.find((standard) => standard.id === id);
      if (!item) throw new Error("Standard nebyl nalezen.");
      result = { ...item, entities: db.standard_entities.filter((entity) => entity.standard_id === id) };
    } else {
      const item = db.national_standards.find((standard) => standard.id === id);
      if (!item) throw new Error("Standard NDK nebyl nalezen.");
      result = { ...item, effective_rules: db.rule_versions.filter((rule) => rule.national_standard_id === id) };
    }
  }
  return result as T;
}
