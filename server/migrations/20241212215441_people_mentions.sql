-- keeps track of whether a person is "mentioned" in a specific entry
-- gets updated by checking whether the person's name is mentioned in the body of an entry
-- OR the person's face is in one of the images associated with the entry
CREATE TABLE IF NOT EXISTS people_mentions (
  entry_id INTEGER NOT NULL,
  person_id INTEGER NOT NULL,
  FOREIGN KEY (entry_id) REFERENCES entries (id),
  FOREIGN KEY (person_id) REFERENCES people (id)
);
