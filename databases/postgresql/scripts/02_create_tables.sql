-- Connect to the markindex database
\connect markindex

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
    business_id SERIAL PRIMARY KEY,
    business_name TEXT
);

CREATE TABLE IF NOT EXISTS user_businesses (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    business_id INTEGER REFERENCES businesses(business_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, business_id)
);