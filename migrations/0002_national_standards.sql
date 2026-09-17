ALTER TABLE profiles RENAME TO national_standards;

ALTER TABLE rules RENAME COLUMN profile_id TO national_standard_id;
DROP INDEX idx_rules_profile;
CREATE INDEX idx_rules_national_standard ON rules(national_standard_id);

ALTER TABLE rule_versions RENAME COLUMN profile_id TO national_standard_id;
DROP INDEX idx_rule_versions_filters;
CREATE INDEX idx_rule_versions_filters
  ON rule_versions(national_standard_id, version, standard_id, severity, status, category);
