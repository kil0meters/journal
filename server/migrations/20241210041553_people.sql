CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY NOT NULL,
    account_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    profile_image BLOB, -- should include clear view of their face
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);
