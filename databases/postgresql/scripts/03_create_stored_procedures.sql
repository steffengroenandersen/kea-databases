-- Connect to the markindex database
\connect markindex

-- Create a stored procedure to insert a user
CREATE OR REPLACE PROCEDURE insert_user(
    p_email TEXT,
    p_password_hash TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO users (email, password_hash)
    VALUES (p_email, p_password_hash);
END;
$$;