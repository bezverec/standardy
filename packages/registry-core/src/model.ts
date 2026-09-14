export const SUPPORTED_SCHEMA_VERSION = "1.0" as const;

export type EntityKind = "standard" | "profile" | "rule" | "vocabulary";
export type RegistryStatus =
  | "normative"
  | "ambiguous"
  | "disputed"
  | "deprecated"
  | "draft"
  | "implementation_defined";

export type RelationType =
  | "defined_by"
  | "derived_from"
  | "restricts"
  | "extends"
  | "clarifies"
  | "implements"
  | "conflicts_with"
  | "supersedes"
  | "equivalent_to"
  | "related_to"
  | "validated_by"
  | "generated_by"
  | "provides_value_for";

export interface LocalizedText {
  cs?: string;
  en?: string;
  [language: string]: string | undefined;
}

export interface Source {
  document: string;
  version: string | null;
  page: string | number | null;
  section: string | null;
  url: string | null;
}

export interface Verification {
  status: "verified" | "unverified" | "disputed";
  date: string | null;
  reference: string | null;
}

export interface RelationDeclaration {
  type: RelationType;
  target: string;
  note?: LocalizedText;
}

export interface BaseDocument {
  schema_version: typeof SUPPORTED_SCHEMA_VERSION;
  kind: EntityKind;
  id: string;
  title: LocalizedText;
  description?: LocalizedText;
  source_file?: string | undefined;
}

export interface StandardDocument extends BaseDocument {
  kind: "standard";
  status: RegistryStatus;
  verification: Verification;
  versions: Array<{
    version: string;
    status: RegistryStatus;
    namespace?: string;
    source: Source;
  }>;
  entities: StandardEntity[];
  relations?: RelationDeclaration[];
}

export interface StandardEntity {
  id: string;
  type: "element" | "attribute" | "format" | "property" | "concept" | "value";
  version: string;
  name: string;
  namespace?: string;
  title: LocalizedText;
  definition?: LocalizedText;
  status: RegistryStatus;
  source: Source;
  verification: Verification;
}

export interface ProfileDocument extends BaseDocument {
  kind: "profile";
  status: RegistryStatus;
  verification: Verification;
  inherits?: Array<{
    profile: string;
    version: string;
    strategy: "inherit" | "add" | "restrict" | "override" | "extend";
  }>;
  versions: Array<{
    version: string;
    status: RegistryStatus;
    source: Source;
  }>;
}

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | {
      field: string;
      operator: "exists" | "equals" | "matches" | "in" | "greater_than" | "less_than";
      value?: unknown;
    };

export interface RuleVersion {
  version: string;
  status: RegistryStatus;
  target: { entity: string };
  relation_to_target: { type: RelationType };
  category: string;
  severity: "error" | "warning" | "info";
  object_types?: { vocabulary: string; values: string[] };
  normative_requirement: LocalizedText;
  requirement: Record<string, unknown>;
  condition?: Condition;
  source: Source;
  references?: Source[];
  verification: Verification;
  interpretation?: LocalizedText;
  implementations?: Array<{
    id: string;
    application: string;
    role: string;
    status: string;
    verification: "verified" | "unverified" | "disputed";
    notes?: LocalizedText;
    behaviour?: LocalizedText;
  }>;
  discrepancies?: LocalizedText[];
  validator_behaviour?: LocalizedText;
  fix_recommendation?: LocalizedText;
  [field: string]: unknown;
}

export interface RuleDocument extends BaseDocument {
  kind: "rule";
  profile: { id: string };
  versions: RuleVersion[];
  relations?: RelationDeclaration[];
}

export interface VocabularyDocument extends BaseDocument {
  kind: "vocabulary";
  status: RegistryStatus;
  verification: Verification;
  values: Array<{
    id: string;
    label: LocalizedText;
    description?: LocalizedText;
    deprecated?: boolean;
  }>;
}

export type RegistryDocument =
  | StandardDocument
  | ProfileDocument
  | RuleDocument
  | VocabularyDocument;

export interface GraphRelation {
  id: string;
  from: string;
  to: string;
  type: RelationType;
  rule_version?: string;
  note?: LocalizedText;
}

export interface NormalizedRegistry {
  meta: {
    dataset_version: string;
    git_commit: string;
    generated_at: string;
    schema_version: typeof SUPPORTED_SCHEMA_VERSION;
  };
  standards: StandardDocument[];
  standard_entities: Array<StandardEntity & { standard_id: string }>;
  profiles: ProfileDocument[];
  rules: RuleDocument[];
  rule_versions: Array<RuleVersion & {
    rule_id: string;
    profile_id: string;
    title: LocalizedText;
    description?: LocalizedText;
    source_file?: string | undefined;
  }>;
  relations: GraphRelation[];
  implementations: Array<NonNullable<RuleVersion["implementations"]>[number] & {
    rule_id: string;
    rule_version: string;
  }>;
  vocabularies: VocabularyDocument[];
}
