-- Migration: Create core tables

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    wallet_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS providers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    rating NUMERIC DEFAULT 0,
    wallet_address TEXT,
    meta_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS data_packages (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC NOT NULL,
    rating NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    meta_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    provider_id BIGINT NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
    package_id BIGINT NOT NULL REFERENCES data_packages(id) ON DELETE RESTRICT,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL,
    tx_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS network_nodes (
    id BIGSERIAL PRIMARY KEY,
    host TEXT NOT NULL,
    status TEXT NOT NULL,
    latency_ms INTEGER,
    last_seen_at TIMESTAMPTZ,
    meta_json JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    level TEXT NOT NULL,
    msg TEXT NOT NULL,
    meta_json JSONB NOT NULL DEFAULT '{}'::jsonb
);
