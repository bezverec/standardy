import type { Relation } from "./explore.ts";
import type { NdkObligationCode, Obligation } from "../../../packages/registry-core/src/model.ts";
import type { RuleExample } from "../../../packages/registry-core/src/model.ts";

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
  obligation: Obligation;
  obligation_code?: NdkObligationCode;
  normative_requirement: Record<string, string>;
  requirement: Record<string, unknown>;
  condition?: unknown;
  source: Record<string, unknown>;
  references?: Array<Record<string, unknown>>;
  examples?: RuleExample[];
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
  behaviour?: Record<string, string>;
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
    standard_id?: string;
    category?: string;
    target?: { entity: string };
    versions?: Array<{ category?: string; target?: { entity: string } }>;
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
  const response = await fetch(`/api/v1${path}`, { cache: "no-cache", headers: { Accept: "application/json" } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `API odpovědělo ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function allPages<T>(path: string, pageSize: number): Promise<{ data: T[]; pagination: { total: number } }> {
  const result = await request<{ data: T[]; pagination: { total: number } }>(`${path}?page_size=${pageSize}`);
  for (let page = 2; result.data.length < result.pagination.total; page++) {
    const next = await request<typeof result>(`${path}?page_size=${pageSize}&page=${page}`);
    if (!next.data.length) throw new Error("API vrátilo neúplná data registru.");
    result.data.push(...next.data);
  }
  return result;
}

export const api = {
  meta: () => request<Record<string, string>>("/meta"),
  rules: () => allPages<RuleVersion>("/rules", 100),
  relations: () => allPages<Relation>("/relations", 500),
  rule: (id: string) => request<RuleDetailResponse>(`/rules/${encodeURIComponent(id)}`),
  why: (id: string) => request<KnowledgeGraphResponse>(`/rules/${encodeURIComponent(id)}/why`),
  standards: () => request<{ data: RegistryEntity[] }>("/standards"),
  standard: (id: string) => request<RegistryEntity & { entities: unknown[] }>(`/standards/${encodeURIComponent(id)}`),
  nationalStandards: () => request<{ data: RegistryEntity[] }>("/national-standards"),
  nationalStandard: (id: string) => request<RegistryEntity & { effective_rules: RuleVersion[] }>(`/national-standards/${encodeURIComponent(id)}`),
};
