import { snapshotRequest } from "./snapshot.ts";
import type { Relation } from "./explore.ts";

export const isPrivateRegistry = import.meta.env.VITE_PRIVATE_REGISTRY === "true";

export interface RuleVersion {
  rule_id: string;
  version: string;
  national_standard_id: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  status: string;
  target: { entity: string };
  relation_to_target: { type: string };
  category: string;
  severity: string;
  normative_requirement: Record<string, string>;
  requirement: Record<string, unknown>;
  condition?: unknown;
  source: Record<string, unknown>;
  references?: Array<Record<string, unknown>>;
  verification: { status: string; date: string | null; reference: string | null };
  interpretation?: Record<string, string>;
  implementations?: Implementation[];
  discrepancies?: Array<Record<string, string>>;
  validator_behaviour?: Record<string, string>;
  fix_recommendation?: Record<string, string>;
  source_file?: string;
  object_types?: { vocabulary: string; values: string[] };
}

export interface Implementation {
  id: string;
  application: string;
  role: string;
  status: string;
  verification: string;
  notes?: Record<string, string>;
}

export interface RuleDetailResponse {
  id: string;
  versions: RuleVersion[];
  relations: Array<{ id: string; from: string; to: string; type: string }>;
  implementations: Implementation[];
}

export interface KnowledgeGraphNode {
  id: string;
  kind: "rule" | "standard" | "national_standard" | "standard_entity" | "implementation";
  data?: {
    title?: Record<string, string>;
    application?: string;
    name?: string;
    verification?: { status?: string } | string;
  };
}

export interface KnowledgeGraphResponse {
  root: string;
  nodes: KnowledgeGraphNode[];
  edges: Array<{ id?: string; from: string; to: string; type: string }>;
}

export interface RegistryEntity {
  id: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  status: string;
  versions: Array<Record<string, unknown>>;
  source_file?: string;
  entities?: Array<{ id: string; name: string; version: string; title: Record<string, string>; definition?: Record<string, string>; source: Record<string, unknown>; verification?: { status: string; date: string | null; reference: string | null } }>;
  effective_rules?: RuleVersion[];
  verification?: { status: string; date: string | null; reference: string | null };
}

async function request<T>(path: string): Promise<T> {
  if (isPrivateRegistry) return snapshotRequest<T>(path);
  const response = await fetch(`/api/v1${path}`, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `API odpovědělo ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  meta: () => request<Record<string, string>>("/meta"),
  rules: async () => {
    const first = await request<{ data: RuleVersion[]; pagination: { total: number } }>("/rules?page_size=100");
    if (!isPrivateRegistry && first.pagination.total > first.data.length) {
      for (let page = 2; first.data.length < first.pagination.total; page++) {
        const next = await request<typeof first>(`/rules?page_size=100&page=${page}`);
        if (!next.data.length) break;
        first.data.push(...next.data);
      }
    }
    return first;
  },
  relations: () => request<{ data: Relation[] }>("/relations"),
  rule: (id: string) => request<RuleDetailResponse>(`/rules/${encodeURIComponent(id)}`),
  why: (id: string) => request<KnowledgeGraphResponse>(`/rules/${encodeURIComponent(id)}/why`),
  standards: () => request<{ data: RegistryEntity[] }>("/standards"),
  standard: (id: string) => request<RegistryEntity & { entities: unknown[] }>(`/standards/${encodeURIComponent(id)}`),
  nationalStandards: () => request<{ data: RegistryEntity[] }>("/national-standards"),
  nationalStandard: (id: string) => request<RegistryEntity & { effective_rules: RuleVersion[] }>(`/national-standards/${encodeURIComponent(id)}`),
};
