use anyhow::Context;
use auth::{validate_jwt, UserClaim};
use axum::{
    extract::{DefaultBodyLimit, Multipart, Path},
    routing::{get, post},
    Extension, Json, Router,
};
use error::AppError;
use lazy_static::lazy_static;
use people::Person;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use tokio::{fs::File, io::AsyncWriteExt};
use tower_http::trace::TraceLayer;
use tracing::Level;

mod auth;
mod error;
mod facial_recognition;
mod people;
mod photos;

lazy_static! {
    static ref JWT_KEY: Vec<u8> = std::env::var("JWT_KEY")
        .expect("JWT_KEY must be set")
        .as_bytes()
        .to_vec();
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv::dotenv().ok();

    // initialize tracing
    tracing_subscriber::fmt().with_max_level(Level::INFO).init();

    let db = SqlitePoolOptions::new()
        .connect("./database.sqlite")
        .await
        .context("Failed to connect to server")?;

    sqlx::migrate!().run(&db).await?;

    facial_recognition::process_unprocessed_images(db.clone()).await;

    let secure_routes = Router::new()
        .route("/save-entry", post(save_entry))
        .route("/get-entries", get(get_entries))
        .route("/get-people", get(people::get_people))
        .route("/add-person", post(people::add_person))
        .route(
            "/get-profile-photo/:person_id",
            get(people::get_profile_photo),
        )
        .route(
            "/get-photos-for-entry/:date",
            get(photos::get_photos_for_entry),
        )
        .route("/photo/:id", get(photos::get_photo))
        .route(
            "/get-entries-for-person/:person_id",
            get(people::get_entries_for_person),
        )
        .route(
            "/get-people-for-entry/:date",
            get(people::get_people_for_entry),
        )
        .route("/upload-image/:timestamp", post(upload_image))
        .layer(axum::middleware::from_fn(validate_jwt));

    let routes = Router::new().route("/auth", post(auth::create_or_verify_account));

    let app = Router::new()
        .merge(routes)
        .merge(secure_routes)
        .layer(TraceLayer::new_for_http())
        .layer(DefaultBodyLimit::disable())
        .layer(Extension(db));

    tracing::info!("Listening on 0.0.0.0:3000");

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await?;

    Ok(())
}

#[derive(Deserialize, Serialize, Debug)]
struct JournalEntry {
    date: String,
    post_text: String,
}

async fn save_entry(
    Extension(db): Extension<SqlitePool>,
    Extension(claims): Extension<UserClaim>,
    Json(form): Json<JournalEntry>,
) -> Result<(), AppError> {
    tracing::info!("Updating entry for {} (id={})", claims.username, claims.id);

    // get all people for user
    let people = sqlx::query_as!(
        Person,
        r#"
        SELECT id,
               name,
               description
        FROM people p
        WHERE account_id = ?
        "#,
        claims.id,
    )
    .fetch_all(&db)
    .await?;

    match sqlx::query!(
        "INSERT INTO entries (body, date, account_id) VALUES (?, ?, ?)",
        form.post_text,
        form.date,
        claims.id,
    )
    .execute(&db)
    .await
    {
        // no entry
        Ok(_) => {}
        // if we already have entry
        Err(_) => {
            sqlx::query!(
                "UPDATE entries SET body = ? WHERE date = ?",
                form.post_text,
                form.date
            )
            .execute(&db)
            .await?;
        }
    }

    for person in &people {
        // check if person name is contained in post text
        if form.post_text.contains(&person.name) {
            tracing::info!(
                "Found reference to person {} in post on {}",
                person.name,
                form.date
            );

            sqlx::query!(
                "INSERT INTO people_mentions (person_id, entry_id) VALUES (?, (SELECT id FROM entries WHERE date = ?))",
                person.id,
                form.date
            )
            .execute(&db)
            .await
            .ok();
        }
    }

    Ok(())
}

#[derive(Deserialize)]
struct Account {
    username: String,
    password: String,
}

async fn upload_image(
    Path(timestamp): Path<i64>,
    Extension(db): Extension<SqlitePool>,
    Extension(claims): Extension<UserClaim>,
    mut multipart: Multipart,
) -> Result<(), AppError> {
    tracing::info!("Uploading image");

    let Some(field) = multipart.next_field().await.map_err(|e| {
        tracing::error!("what error: {e}");
        e
    })?
    else {
        return Err(anyhow::anyhow!("form data required").into());
    };

    let file_name_original = field.file_name().unwrap_or("image").to_string();
    let content_type = field.content_type().unwrap_or("application/octet-stream");

    if content_type.starts_with("image/") {
        let data = field.bytes().await.unwrap();

        let mut hasher = Sha256::new();
        hasher.update(&data);
        let mut file_name = format!("{:x}_", hasher.finalize());
        file_name.push_str(&file_name_original);

        // Save the file locally
        let path = format!("./uploads/{}", file_name);
        let mut file = File::create(&path).await?;

        file.write_all(&data).await?;

        let date = chrono::DateTime::from_timestamp(timestamp, 0)
            .unwrap_or_default()
            .format("%Y-%m-%d")
            .to_string();

        // make sure we have entry for all images
        sqlx::query!(
            "INSERT OR IGNORE INTO entries (date, body, account_id)
             VALUES (?, '', ?)",
            date,
            claims.id
        )
        .execute(&db)
        .await?;

        sqlx::query!(
            "INSERT INTO images (entry_id, source)
                 SELECT (SELECT id FROM entries WHERE date = ?), ?
                 WHERE NOT EXISTS (SELECT 1 FROM images WHERE source = ?)",
            date,
            path,
            path
        )
        .execute(&db)
        .await?;
    }

    Ok(())
}

async fn create_today(db: &SqlitePool, claims: &UserClaim) -> Result<(), AppError> {
    let today = chrono::Utc::now().format("%Y-%m-%d").to_string();

    tracing::info!(
        "Creating entry ({}) for {} (id={})",
        today,
        claims.username,
        claims.id
    );

    sqlx::query!(
        "INSERT OR IGNORE INTO entries (date, body, account_id)
         VALUES (?, '', ?)",
        today,
        claims.id
    )
    .execute(db)
    .await?;

    Ok(())
}

async fn get_entries(
    Extension(db): Extension<SqlitePool>,
    Extension(claims): Extension<UserClaim>,
) -> Result<Json<Vec<JournalEntry>>, AppError> {
    tracing::info!("Getting entries for {} (id={})", claims.username, claims.id);

    create_today(&db, &claims).await?;

    let rows = sqlx::query!(
        "SELECT date, body FROM entries WHERE account_id = ? ORDER BY date DESC",
        claims.id
    )
    .fetch_all(&db)
    .await?;

    let entries = rows
        .into_iter()
        .map(|row| JournalEntry {
            date: row.date,
            post_text: row.body,
        })
        .collect();

    Ok(Json(entries))
}
