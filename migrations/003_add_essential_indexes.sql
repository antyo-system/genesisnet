-- Migration: Add essential indexes for search/metrics/topology

-- providers
CREATE INDEX IF NOT EXISTS idx_providers_rating ON providers (rating);

-- data_packages
CREATE INDEX IF NOT EXISTS idx_data_packages_price ON data_packages (price);
CREATE INDEX IF NOT EXISTS idx_data_packages_category_price ON data_packages (category, price);

