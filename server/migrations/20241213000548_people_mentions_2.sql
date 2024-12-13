-- make it work
DROP TABLE people_mentions;

CREATE TABLE IF NOT EXISTS people_mentions (
  entry_id INTEGER NOT NULL,
  person_id INTEGER NOT NULL,
  FOREIGN KEY (entry_id) REFERENCES entries (id),
  FOREIGN KEY (person_id) REFERENCES people (id),
  UNIQUE (entry_id, person_id) ON CONFLICT REPLACE
);
