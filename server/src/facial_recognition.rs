use std::path::Path;

use serde::Deserialize;
use sqlx::SqlitePool;
use tokio::{fs, process::Command};

use crate::error::AppError;

#[derive(Deserialize, Debug)]
struct FacialRecognitionResult {
    face_detected: String,
    bounding_box: [i64; 4], // (top, right, bottom, left)
}

pub async fn populate_tmp_directory(user_id: i64, db: &SqlitePool) -> Result<(), AppError> {
    let path = format!("/tmp/journal/test_faces/{user_id}");
    tokio::fs::create_dir_all(&path).await?;

    let people = sqlx::query!(
        r#"
        SELECT id, profile_image
        FROM people
        WHERE account_id = ?
        "#,
        user_id
    )
    .fetch_all(db)
    .await?;

    for person in &people {
        if let Some(ref profile_image) = person.profile_image {
            fs::write(format!("{}/{}.jpg", path, person.id), profile_image)
                .await
                .ok();
        }
    }

    Ok(())
}

pub async fn classify_faces_image(
    user_id: i64,
    test_image_id: i64,
    db: &SqlitePool,
) -> Result<(), AppError> {
    let path = format!("/tmp/journal/test_faces/{user_id}");
    let venv_python = Path::new("./venv/bin/python");
    let script_path = Path::new("./src/facial_recognition.py");

    let image = sqlx::query!("SELECT * FROM images WHERE id = ?", test_image_id)
        .fetch_one(db)
        .await?;

    let output = Command::new(venv_python)
        .arg(script_path)
        .arg(&path)
        .arg(&image.source)
        .output()
        .await
        .expect("Failed to execute Python script");

    if output.status.success() {
        // Handle the script's standard output
        let stdout = String::from_utf8_lossy(&output.stdout);
        let faces: Vec<FacialRecognitionResult> = serde_json::from_str(&stdout).unwrap();

        tracing::info!("faces: {faces:?}");

        let people_query = sqlx::query!(
            r#"SELECT id, name FROM people WHERE account_id = ?"#,
            user_id
        )
        .fetch_all(db)
        .await?;

        for face in faces {
            for person in &people_query {
                if face.face_detected.parse::<i64>().ok() == Some(person.id) {
                    sqlx::query!(
                        r#"
                        INSERT INTO image_bounding_boxes
                        (image_id, person_id, x_min, y_min, x_max, y_max)
                        VALUES (?, ?, ?, ?, ?, ?)
                        "#,
                        image.id,
                        person.id,
                        face.bounding_box[3],
                        face.bounding_box[0],
                        face.bounding_box[1],
                        face.bounding_box[2]
                    )
                    .execute(db)
                    .await?;

                    sqlx::query!(
                        r#"
                        INSERT INTO people_mentions (person_id, entry_id)
                        VALUES (
                            ?,
                            (SELECT e.id FROM entries e
                             INNER JOIN images i ON i.entry_id = e.id WHERE i.id = ?)
                        )"#,
                        person.id,
                        test_image_id
                    )
                    .execute(db)
                    .await
                    .ok();
                }
            }
        }

        Ok(())
    } else {
        let stderr = String::from(String::from_utf8_lossy(&output.stderr));
        Err(anyhow::anyhow!(stderr).into())
    }
}

pub async fn process_unprocessed_images(db: SqlitePool) {
    tokio::spawn(async move {
        loop {
            let images = sqlx::query!(
                r#"
                SELECT i.id as id, e.account_id as "account_id!"
                FROM images i INNER JOIN entries e ON e.id = i.entry_id
                WHERE i.is_facial_recognition_processed = false
                "#
            )
            .fetch_all(&db)
            .await;

            if let Ok(images) = images {
                for image in images {
                    tracing::info!("Processing image: {}", image.id);

                    populate_tmp_directory(image.account_id, &db).await.unwrap();

                    if let Err(e) = classify_faces_image(image.account_id, image.id, &db).await {
                        tracing::error!("Error processing image {}: {}", image.id, e.0);
                        continue;
                    }

                    sqlx::query!(
                        r#"
                        UPDATE images
                        SET is_facial_recognition_processed = true
                        WHERE id = ?
                        "#,
                        image.id
                    )
                    .execute(&db)
                    .await
                    .ok();
                }
            }

            tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
        }
    });
}
