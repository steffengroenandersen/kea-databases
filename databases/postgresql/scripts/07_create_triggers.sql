-- Connect to the markindex database
\connect markindex

-- Create a trigger function for users
CREATE OR REPLACE FUNCTION update_users_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger
CREATE TRIGGER users_last_updated_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_last_updated();
