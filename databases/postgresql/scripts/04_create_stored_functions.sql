-- Connect to the markindex database
\connect markindex

-- Create a stored function to count all users
CREATE OR REPLACE FUNCTION count_all_users()
RETURNS INTEGER AS $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    RETURN user_count;
END;
$$ LANGUAGE plpgsql;