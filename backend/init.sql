-- PostgreSQL initialization script for LeadVertex
-- This script will be executed when the database container starts for the first time

-- Create database if it doesn't exist (already created by POSTGRES_DB env var)
-- CREATE DATABASE IF NOT EXISTS leadvertex;

-- Create user if it doesn't exist (already created by POSTGRES_USER env var)
-- CREATE USER IF NOT EXISTS leadvertex_user WITH PASSWORD 'password';

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
\echo 'PostgreSQL initialization completed for LeadVertex';