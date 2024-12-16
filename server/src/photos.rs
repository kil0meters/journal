use axum::{extract::Path, http::header, response::IntoResponse, Extension, Json};
use serde::Serialize;
use sqlx::SqlitePool;

use crate::{auth::UserClaim, error::AppError, people::Person};

#[derive(Serialize)]
struct ImageBoundingBox {
    person: Person,
    bounding_box: [i64; 4],
}

#[derive(Serialize)]
pub struct Photo {
    id: i64,
    url: String,
    bounding_boxes: Vec<ImageBoundingBox>,
}

pub async fn get_photos_for_entry(
    Path(date): Path<String>,
    Extension(db): Extension<SqlitePool>,
    Extension(claims): Extension<UserClaim>,
) -> Result<Json<Vec<Photo>>, AppError> {
    tracing::info!(
        "Getting photos for date {} (user={})",
        date,
        claims.username
    );

    let photos = sqlx::query!(
        r#"
        SELECT i.id
        FROM images i
        JOIN entries e ON e.id = i.entry_id
        WHERE e.date = ?
        AND e.account_id = ?
        "#,
        date,
        claims.id
    )
    .fetch_all(&db)
    .await?;

    let mut photos = photos
        .iter()
        .map(|photo| Photo {
            id: photo.id,
            url: format!("/photo/{}", photo.id),
            bounding_boxes: Vec::new(),
        })
        .collect::<Vec<_>>();

    for photo in photos.iter_mut() {
        let bounding_boxes = sqlx::query!(
            r#"
            SELECT person_id, description, name, x_min, y_min, x_max, y_max
            FROM image_bounding_boxes INNER JOIN people ON person_id = people.id
            WHERE image_id = ?
            "#,
            photo.id
        )
        .fetch_all(&db)
        .await?;

        photo
            .bounding_boxes
            .extend(bounding_boxes.into_iter().map(|bb| ImageBoundingBox {
                person: Person {
                    id: bb.person_id,
                    name: bb.name,
                    description: bb.description,
                },
                bounding_box: [bb.x_min, bb.y_min, bb.x_max, bb.y_max],
            }));
    }

    Ok(Json(photos))
}

pub async fn get_photo(
    Path(id): Path<i64>,
    Extension(db): Extension<SqlitePool>,
    Extension(claims): Extension<UserClaim>,
) -> Result<impl IntoResponse, AppError> {
    tracing::info!("Getting photo {} (user={})", id, claims.username);

    let photo = sqlx::query!(
        r#"
        SELECT i.source
        FROM images i
        JOIN entries e ON e.id = i.entry_id
        WHERE i.id = ?
        AND e.account_id = ?
        "#,
        id,
        claims.id
    )
    .fetch_optional(&db)
    .await?
    .ok_or_else(|| anyhow::anyhow!("Photo not found"))?;

    let content_type = match mime_guess::from_path(&photo.source).first_raw() {
        Some(mime) => mime,
        None => return Err(anyhow::anyhow!("MIME Type couldn't be determined").into()),
    };

    let file_bytes = tokio::fs::read(&photo.source).await?;

    let headers = [(header::CONTENT_TYPE, content_type)];
    Ok((headers, file_bytes).into_response())
}
