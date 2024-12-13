import face_recognition
import pillow_avif
from pillow_heif import register_heif_opener
import json
import sys
import os

register_heif_opener()

reference_image_dir = sys.argv[1]
reference_image_paths = [os.path.join(reference_image_dir, filename) for filename in os.listdir(reference_image_dir) if filename.endswith("jpg")]

reference_images = [face_recognition.load_image_file(path) for path in reference_image_paths]
reference_encodings = [face_recognition.face_encodings(reference_image)[0] for reference_image in reference_images]

image_to_classify = face_recognition.load_image_file(sys.argv[2])

face_locations = face_recognition.face_locations(image_to_classify)
face_encodings = face_recognition.face_encodings(image_to_classify, face_locations)

output = []

for i, face_encoding in enumerate(face_encodings):
    # Compare face encoding to the reference encodings
    matches = face_recognition.compare_faces(reference_encodings, face_encoding)
    for j, match in enumerate(matches):
        if match:
            basename = os.path.splitext(os.path.basename(reference_image_paths[j]))[0]

            output.append({
                "face_detected": basename,
                "bounding_box": face_locations[i],
            })

print(json.dumps(output))
