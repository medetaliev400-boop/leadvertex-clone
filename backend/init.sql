-- PostgreSQL initialization script for LeadVertex
-- This script will be executed when the database container starts for the first time

-- Create user if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'leadvertex_user') THEN
      CREATE USER leadvertex_user WITH PASSWORD 'Vf9pXy7Kz@3mQw2h';
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE leadvertex TO leadvertex_user;

-- Connect to the leadvertex database
\c leadvertex;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO leadvertex_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO leadvertex_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO leadvertex_user;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Log initialization complete
\echo 'PostgreSQL initialization completed for LeadVertex with user leadvertex_user';