PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS registry_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS standards (
  id TEXT PRIMARY KEY,
  title_cs TEXT,
  status TEXT NOT NULL,
  data_json TEXT NOT NULL CHECK (json_valid(data_json))
);

CREATE TABLE IF NOT EXISTS standard_entities (
  id TEXT PRIMARY KEY,
  standard_id TEXT NOT NULL REFERENCES standards(id),
  standard_version TEXT NOT NULL,
  name TEXT NOT NULL,
  namespace TEXT,
  entity_type TEXT NOT NULL,
  status TEXT NOT NULL,
  data_json TEXT NOT NULL CHECK (json_valid(data_json))
);

CREATE INDEX IF NOT EXISTS idx_standard_entities_resolver
  ON standard_entities(namespace, name, standard_version);
CREATE INDEX IF NOT EXISTS idx_standard_entities_standard
  ON standard_entities(standard_id, standard_version);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  title_cs TEXT,
  status TEXT NOT NULL,
  data_json TEXT NOT NULL CHECK (json_valid(data_json))
);

CREATE TABLE IF NOT EXISTS vocabularies (
  id TEXT PRIMARY KEY,
  title_cs TEXT,
  status TEXT NOT NULL,
  data_json TEXT NOT NULL CHECK (json_valid(data_json))
);

CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  title_cs TEXT,
  source_file TEXT,
  data_json TEXT NOT NULL CHECK (json_valid(data_json))
);

CREATE INDEX IF NOT EXISTS idx_rules_profile ON rules(profile_id);

CREATE TABLE IF NOT EXISTS rule_versions (
  rule_id TEXT NOT NULL REFERENCES rules(id),
  version TEXT NOT NULL,
  profile_id TEXT NOT NULL REFERENCES profiles(id),
  standard_id TEXT,
  target_id TEXT NOT NULL REFERENCES standard_entities(id),
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  search_text TEXT NOT NULL,
  data_json TEXT NOT NULL CHECK (json_valid(data_json)),
  PRIMARY KEY (rule_id, version)
);

CREATE INDEX IF NOT EXISTS idx_rule_versions_filters
  ON rule_versions(profile_id, version, standard_id, severity, status, category);
CREATE INDEX IF NOT EXISTS idx_rule_versions_target ON rule_versions(target_id);

CREATE TABLE IF NOT EXISTS relations (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  rule_version TEXT,
  data_json TEXT NOT NULL CHECK (json_valid(data_json))
);

CREATE INDEX IF NOT EXISTS idx_relations_from ON relations(from_id, relation_type);
CREATE INDEX IF NOT EXISTS idx_relations_to ON relations(to_id, relation_type);

CREATE TABLE IF NOT EXISTS implementations (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL REFERENCES rules(id),
  rule_version TEXT NOT NULL,
  application TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  data_json TEXT NOT NULL CHECK (json_valid(data_json))
);

CREATE INDEX IF NOT EXISTS idx_implementations_rule
  ON implementations(rule_id, rule_version);
