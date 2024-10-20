CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY NOT NULL,
    entry_id INTEGER NOT NULL,
    source TEXT NOT NULL,
    FOREIGN KEY (entry_id) REFERENCES entries(id)
);
