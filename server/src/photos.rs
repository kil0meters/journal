use axum::{extract::Path, http::header, response::IntoResponse, Extension, Json};
use sqlx::SqlitePool;

use crate::{auth::UserClaim, error::AppError};

pub async fn get_photos_for_entry(
    Path(date): Path<String>,
    Extension(db): Extension<SqlitePool>,
    Extension(claims): Extension<UserClaim>,
) -> Result<Json<Vec<String>>, AppError> {
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

    Ok(Json(
        photos
            .iter()
            .map(|photo| format!("/photo/{}", photo.id))
            .collect::<Vec<_>>(),
    ))
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
