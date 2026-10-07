-- Private database only. Never apply to the published registry database.
CREATE TABLE editor_members (
  user_id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('editor', 'reviewer', 'admin')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);
CREATE TABLE editor_drafts (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES editor_members(user_id),
  rule_id TEXT NOT NULL,
  base_commit TEXT NOT NULL,
  base_document TEXT,
  document TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX editor_drafts_owner ON editor_drafts(owner_id, updated_at);
CREATE TABLE editor_revisions (
  draft_id TEXT NOT NULL REFERENCES editor_drafts(id),
  revision INTEGER NOT NULL,
  actor_id TEXT NOT NULL,
  document TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  PRIMARY KEY (draft_id, revision)
);
CREATE TRIGGER editor_draft_created AFTER INSERT ON editor_drafts BEGIN
  INSERT INTO editor_revisions VALUES (NEW.id, NEW.revision, NEW.owner_id, NEW.document, NEW.content_hash, NEW.updated_at);
END;
CREATE TRIGGER editor_draft_updated AFTER UPDATE ON editor_drafts BEGIN
  INSERT INTO editor_revisions VALUES (NEW.id, NEW.revision, NEW.owner_id, NEW.document, NEW.content_hash, NEW.updated_at);
END;
CREATE TABLE editor_rate_limits (
  user_id TEXT NOT NULL,
  minute INTEGER NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (user_id, minute)
);
