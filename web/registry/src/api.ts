export interface RuleVersion {
  rule_id: string;
  version: string;
  profile_id: string;
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
  kind: "rule" | "standard" | "profile" | "standard_entity" | "implementation";
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
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `API odpovědělo ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  meta: () => request<Record<string, string>>("/meta"),
  rules: () => request<{ data: RuleVersion[]; pagination: { total: number } }>("/rules?page_size=100"),
  rule: (id: string) => request<RuleDetailResponse>(`/rules/${encodeURIComponent(id)}`),
  why: (id: string) => request<KnowledgeGraphResponse>(`/rules/${encodeURIComponent(id)}/why`),
  standards: () => request<{ data: RegistryEntity[] }>("/standards"),
  standard: (id: string) => request<RegistryEntity & { entities: unknown[] }>(`/standards/${encodeURIComponent(id)}`),
  profiles: () => request<{ data: RegistryEntity[] }>("/profiles"),
  profile: (id: string) => request<RegistryEntity & { effective_rules: RuleVersion[] }>(`/profiles/${encodeURIComponent(id)}`),
};
