-- No generic error -> mandatory conversion: a severity is not an obligation.
-- The authoritative YAML import supplies the actual levels after this migration.
ALTER TABLE rule_versions RENAME COLUMN severity TO obligation;
UPDATE rule_versions SET obligation = 'unspecified';
