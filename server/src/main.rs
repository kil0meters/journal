use anyhow::Context;

use axum::{
    http::StatusCode,
    routing::{get, post},
    Extension, Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use tracing::Level;

// mod jpeg;
// mod process_image;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv::dotenv().ok();

    // initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(Level::TRACE)
        .finish();

    // let endpoint_url = format!("https://{}.r2.cloudflarestorage.com", config.account_id);
    // let credentials =
    //     Credentials::new(config.access_id, config.access_secret, None, None, "custom");
    // let r2_config = aws_config::from_env()
    //     .region(Region::new(config.region))
    //     .credentials_provider(SharedCredentialsProvider::new(credentials))
    //     .endpoint_url(&endpoint_url)
    //     .load()
    //     .await;
    // let client = aws_sdk_s3::Client::new(&r2_config);

    let db = SqlitePoolOptions::new()
        .connect("./database.sqlite")
        .await
        .context("Failed to connect to server")?;

    sqlx::migrate!().run(&db).await?;

    let app = Router::new()
        .route("/save-entry", post(save_entry))
        .route("/get-entries", get(get_entries))
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
    Json(form): Json<JournalEntry>,
) -> StatusCode {
    match sqlx::query!(
        "INSERT OR REPLACE INTO entries (body, date) VALUES (?, ?)",
        form.post_text,
        form.date
    )
    .execute(&db)
    .await
    {
        Ok(_) => StatusCode::OK,
        Err(_) => StatusCode::INTERNAL_SERVER_ERROR,
    }
}

async fn get_entries(
    Extension(db): Extension<SqlitePool>,
) -> (StatusCode, Json<Vec<JournalEntry>>) {
    match sqlx::query!("SELECT date, body FROM entries ORDER BY date DESC")
        .fetch_all(&db)
        .await
    {
        Ok(rows) => {
            let entries = rows
                .into_iter()
                .map(|row| JournalEntry {
                    date: row.date,
                    post_text: row.body,
                })
                .collect();
            (StatusCode::OK, Json(entries))
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![])),
    }
}
