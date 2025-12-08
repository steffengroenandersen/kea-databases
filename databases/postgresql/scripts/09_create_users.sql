-- Connect to markindex database
\connect markindex


-- =========================
-- Admin user
-- =========================
-- Create admin user with login privileges and full access
CREATE USER admin WITH PASSWORD 'admin';

-- Grant all privileges on markindex database to admin
GRANT ALL PRIVILEGES ON DATABASE markindex TO admin;

-- Grant all privileges on all tables in public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;

-- Grant all privileges on all sequences (for auto-incrementing IDs)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;

-- Grant execute on all functions and procedures
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO admin;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA public TO admin;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON ROUTINES TO admin;

-- =========================
-- CRUD-only database user
-- =========================
CREATE USER database WITH PASSWORD 'database';

GRANT CONNECT ON DATABASE markindex TO database;
GRANT USAGE ON SCHEMA public TO database;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO database;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO database;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO database;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO database;