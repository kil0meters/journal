CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL
);

ALTER TABLE entries ADD COLUMN account_id INTEGER REFERENCES accounts(id);
