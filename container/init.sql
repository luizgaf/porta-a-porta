-- Porta a Porta - Initial Database Setup
-- This runs automatically when the PostgreSQL container starts for the first time

-- Ensure the database exists (handled by POSTGRES_DB env var)
-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- The Prisma migrations will create all tables
-- This file is for any pre-migration setup if needed

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE porta_a_porta TO porta_a_porta;