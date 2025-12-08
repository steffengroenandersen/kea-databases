-- Connect to the markindex database
\connect markindex

-- Create a index for users emails
CREATE INDEX idx_users_email ON users (email);
