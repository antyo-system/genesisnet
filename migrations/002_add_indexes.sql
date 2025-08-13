-- Migration: Add indexes for core tables

-- users
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users (wallet_address);

-- providers
CREATE INDEX IF NOT EXISTS idx_providers_name ON providers (name);
CREATE INDEX IF NOT EXISTS idx_providers_wallet_address ON providers (wallet_address);

-- data_packages
CREATE INDEX IF NOT EXISTS idx_data_packages_provider_id ON data_packages (provider_id);
CREATE INDEX IF NOT EXISTS idx_data_packages_category ON data_packages (category);

-- transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_provider_id ON transactions (provider_id);
CREATE INDEX IF NOT EXISTS idx_transactions_package_id ON transactions (package_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions (created_at);

-- network_nodes
CREATE UNIQUE INDEX IF NOT EXISTS idx_network_nodes_host ON network_nodes (host);
CREATE INDEX IF NOT EXISTS idx_network_nodes_status ON network_nodes (status);

-- activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_ts ON activity_logs (ts);
CREATE INDEX IF NOT EXISTS idx_activity_logs_level ON activity_logs (level);
