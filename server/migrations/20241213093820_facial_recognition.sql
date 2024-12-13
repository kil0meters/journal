ALTER TABLE images
ADD COLUMN is_facial_recognition_processed BOOLEAN DEFAULT FALSE;

CREATE TABLE image_bounding_boxes (
  id INTEGER PRIMARY KEY NOT NULL,
  image_id INTEGER NOT NULL,
  person_id INTEGER NOT NULL,
  x_min INTEGER NOT NULL,
  y_min INTEGER NOT NULL,
  x_max INTEGER NOT NULL,
  y_max INTEGER NOT NULL,
  FOREIGN KEY (image_id) REFERENCES images (id) ON DELETE CASCADE,
  FOREIGN KEY (person_id) REFERENCES people (id) ON DELETE CASCADE
);
