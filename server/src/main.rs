use anyhow::Context;
use auth::{validate_jwt, UserClaim};
use axum::{
    extract::{Multipart, Path, State},
    http::StatusCode,
    routing::{get, post},
    Extension, Json, Router,
};
use error::AppError;
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use tokio::{fs::File, io::AsyncWriteExt};
use tower_http::trace::TraceLayer;
use tracing::Level;

mod auth;
mod error;

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

    let secure_routes = Router::new()
        .route("/save-entry", post(save_entry))
        .route("/get-entries", get(get_entries))
        .route("/upload_images/:entry_id", post(upload_images))
        .layer(axum::middleware::from_fn(validate_jwt));

    let routes = Router::new().route("/auth", post(auth::create_or_verify_account));

    let app = Router::new()
        .merge(routes)
        .merge(secure_routes)
        .layer(TraceLayer::new_for_http())
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
) -> StatusCode {
    tracing::info!("Updating entry for {} (id={})", claims.username, claims.id);

    match sqlx::query!(
        "INSERT OR REPLACE INTO entries (body, date, account_id) VALUES (?, ?, ?)",
        form.post_text,
        form.date,
        claims.id,
    )
    .execute(&db)
    .await
    {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

#[derive(Deserialize)]
struct Account {
    username: String,
    password: String,
}

async fn upload_images(
    Path(entry_id): Path<i64>,
    Extension(db): Extension<SqlitePool>,
    mut multipart: Multipart,
) -> Result<StatusCode, StatusCode> {
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|_| StatusCode::BAD_REQUEST)?
    {
        let file_name = field.file_name().unwrap_or("image").to_string();
        let content_type = field.content_type().unwrap_or("application/octet-stream");

        if content_type.starts_with("image/") {
            let data = field
                .bytes()
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            // Save the file locally
            let path = format!("./uploads/{}", file_name);
            let mut file = File::create(&path)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            file.write_all(&data)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

            sqlx::query!(
                "INSERT INTO images (entry_id, source)
                 SELECT ?, ?
                 WHERE NOT EXISTS (SELECT 1 FROM images WHERE source = ?)",
                entry_id,
                path,
                path
            )
            .execute(&db)
            .await
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
        }
    }

    Ok(StatusCode::OK)
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
