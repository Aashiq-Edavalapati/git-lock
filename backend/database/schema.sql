-- Enable crypto extension for UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS (Identity & Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    password_hash VARCHAR(255), -- Nullable for OAuth users
    auth_provider VARCHAR(50) DEFAULT 'email', -- 'email', 'google', 'github'
    role VARCHAR(50) CHECK (role IN ('DEVELOPER', 'CLIENT', 'ADMIN')),
    mfa_secret VARCHAR(255), -- For TOTP/MFA logic
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PROJECTS (The Contract)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    budget DECIMAL(10, 2),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    developer_email VARCHAR(255) NOT NULL, -- To send invite
    developer_id UUID REFERENCES users(id), -- Null until Dev accepts
    status VARCHAR(50) CHECK (status IN ('INVITE_SENT', 'IN_PROGRESS', 'LOCKED_REVIEW', 'COMPLETED', 'CANCELLED', 'REJECTED')) DEFAULT 'INVITE_SENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PROJECT_VERSIONS (The Immutable Ledger)
CREATE TABLE project_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Source Data
    encrypted_blob BYTEA NOT NULL, -- The AES-256 Encrypted ZIP
    zip_hash VARCHAR(64) NOT NULL, -- SHA-256 of upload
    
    -- GitHub Binding
    commit_sha VARCHAR(40),
    github_repo_url VARCHAR(255),
    
    -- Verification
    staging_url VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. AUDIT_LOGS (Security Requirement)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100), -- 'LOGIN', 'UPLOAD_ATTEMPT', 'PAYMENT_VERIFIED'
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);