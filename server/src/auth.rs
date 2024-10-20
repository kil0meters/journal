use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::{
    extract::Request,
    http::{self, StatusCode},
    middleware::Next,
    response::Response,
    Extension, Json,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

use crate::Account;

#[derive(Clone, Serialize, Deserialize)]
pub struct UserClaim {
    id: i64,
    username: String,
}

// https://github.com/sam-rusty/axum-jwt-example/blob/main/src/main.rs
pub async fn validate_jwt(mut req: Request, next: Next) -> Result<Response, &'static str> {
    let jwt_token = req
        .headers()
        .get(http::header::AUTHORIZATION)
        .and_then(|header| header.to_str().ok());

    let jwt_token = match jwt_token {
        Some(jwt_token) => jwt_token.replace("Bearer ", ""),
        None => return Err("Authorization token is missing"),
    };
    let jwt_secret_key = std::env::var("JWT_SECRET_KEY").unwrap();

    let token_payload = decode::<UserClaim>(
        &jwt_token,
        &DecodingKey::from_secret(jwt_secret_key.as_ref()),
        &Validation::default(),
    );

    match token_payload {
        Ok(token_payload) => {
            req.extensions_mut().insert(token_payload.claims);
            Ok(next.run(req).await)
        }
        Err(_) => Err("Invalid Token"),
    }
}

pub async fn create_or_verify_account(
    Extension(db): Extension<SqlitePool>,
    Json(form): Json<Account>,
) -> Result<StatusCode, StatusCode> {
    // Check if account exists
    let existing = sqlx::query!(
        "SELECT password FROM accounts WHERE username = ?",
        form.username
    )
    .fetch_optional(&db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let argon2 = Argon2::default();

    if let Some(account) = existing {
        match argon2.verify_password(
            form.password.as_bytes(),
            &PasswordHash::new(&account.password).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?,
        ) {
            Ok(()) => Ok(StatusCode::OK),
            Err(_) => Err(StatusCode::UNAUTHORIZED),
        }
    } else {
        // Create new account
        let salt = SaltString::generate(&mut OsRng);
        let password_hash = argon2
            .hash_password(form.password.as_bytes(), &salt)
            .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
            .to_string();

        sqlx::query!(
            "INSERT INTO accounts (username, password) VALUES (?, ?)",
            form.username,
            password_hash
        )
        .execute(&db)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

        Ok(StatusCode::CREATED)
    }
}
