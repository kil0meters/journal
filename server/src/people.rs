use crate::error::AppError;
use crate::{auth::UserClaim, JournalEntry};
use axum::http::header;
use axum::response::IntoResponse;
use axum::{extract::Path, Extension, Json};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

#[derive(Serialize, Deserialize)]
pub struct Person {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
}

pub async fn get_people(
    Extension(db): Extension<SqlitePool>,
    Extension(claims): Extension<UserClaim>,
) -> Result<Json<Vec<Person>>, AppError> {
    tracing::info!("Getting people for {}", claims.id);

    let people = sqlx::query_as!(
        Person,
        r#"
        SELECT
            id,
            name,
            description
        FROM people
        WHERE account_id = ?
        ORDER BY name
        "#,
        claims.id
    )
    .fetch_all(&db)
    .await?;

    Ok(Json(people))
}

pub async fn add_person(
    Extension(db): Extension<SqlitePool>,
    Extension(claims): Extension<UserClaim>,
    mut multipart: axum::extract::Multipart,
) -> Result<Json<Person>, AppError> {
    let mut name = None;
    let mut description = None;
    let mut profile_image = None;

    // https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&size=256

    while let Some(field) = multipart.next_field().await? {
        match field.name() {
            Some("name") => {
                name = Some(field.text().await?);
            }
            Some("description") => {
                description = Some(field.text().await?);
            }
            Some("image") => {
                if field
                    .content_type()
                    .map_or(false, |ct| ct.starts_with("image/"))
                {
                    let image_bytes = field.bytes().await?.to_vec();
                    let image = image::load_from_memory(&image_bytes)?;
                    let resized = image.resize(512, 512, image::imageops::FilterType::Lanczos3);
                    let mut cursor = std::io::Cursor::new(Vec::new());
                    resized.write_to(&mut cursor, image::ImageFormat::Jpeg)?;
                    profile_image = Some(cursor.into_inner());
                }
            }
            _ => {}
        }
    }

    let Some(name) = name else {
        return Err(anyhow::anyhow!("Name is required").into());
    };

    let result = sqlx::query!(
        r#"
        INSERT INTO people (name, description, profile_image, account_id)
        VALUES (?, ?, ?, ?)
        RETURNING id
        "#,
        name,
        description,
        profile_image,
        claims.id
    )
    .fetch_one(&db)
    .await?;

    let new_person = Person {
        id: result.id,
        name,
        description,
    };

    Ok(Json(new_person))
}

pub async fn get_profile_photo(
    Extension(db): Extension<SqlitePool>,
    Extension(claims): Extension<UserClaim>,
    Path(person_id): Path<i64>,
) -> Result<impl IntoResponse, AppError> {
    let person = sqlx::query!(
        r#"
        SELECT profile_image
        FROM people
        WHERE id = ? AND account_id = ?
        "#,
        person_id,
        claims.id
    )
    .fetch_optional(&db)
    .await?
    .ok_or_else(|| anyhow::anyhow!("Person not found"))?;

    let Some(image_data) = person.profile_image else {
        return Err(anyhow::anyhow!("No profile image found").into());
    };

    let headers = [(header::CONTENT_TYPE, "image/jpeg")];
    Ok((headers, image_data).into_response())
}

/// retrieves the list of journal entries where a particular person is mentioned
pub async fn get_entries_for_person(
    Extension(db): Extension<SqlitePool>,
    Extension(claims): Extension<UserClaim>,
    Path(person_id): Path<i64>,
) -> Result<Json<Vec<JournalEntry>>, AppError> {
    tracing::info!("Getting journal entries for person={person_id}");

    let entries = sqlx::query_as!(
        JournalEntry,
        r#"
        SELECT e.body as post_text, e.date as date
        FROM entries e INNER JOIN people_mentions p
        ON e.id = p.entry_id WHERE p.person_id = ? AND e.account_id = ?
        ORDER BY DATE(e.date) DESC
    "#,
        person_id,
        claims.id
    )
    .fetch_all(&db)
    .await?;

    return Ok(Json(entries));
}

pub async fn get_people_for_entry(
    Extension(db): Extension<SqlitePool>,
    Extension(claims): Extension<UserClaim>,
    Path(date): Path<String>,
) -> Result<Json<Vec<Person>>, AppError> {
    tracing::info!("Getting people for journal entry date={date}");

    let people = sqlx::query_as!(
        Person,
        r#"
        SELECT p.id as id,
               p.name as name,
               p.description as description
        FROM people p
        INNER JOIN people_mentions pm ON pm.person_id = p.id
        INNER JOIN entries e on e.id = pm.entry_id
        WHERE e.date = ? AND p.account_id = ?
    "#,
        date,
        claims.id
    )
    .fetch_all(&db)
    .await?;

    return Ok(Json(people));
}
