-- Add migration script here
CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY NOT NULL,
    body TEXT NOT NULL,
    date TEXT default (DATE('now')) UNIQUE NOT NULL
);
