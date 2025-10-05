-- Connect to the markindex database
\connect markindex

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    last_updated TIMESTAMP
);

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
    business_id SERIAL PRIMARY KEY,
    business_name TEXT NOT NULL
);

-- Create user_businesses table
CREATE TABLE IF NOT EXISTS user_businesses (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    business_id INTEGER REFERENCES businesses(business_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, business_id)
);

-- Create meta_connectors table
CREATE TABLE IF NOT EXISTS meta_connectors (
    meta_connector_id SERIAL PRIMARY KEY,
    access_token TEXT NOT NULL,
    user_id INTEGER REFERENCES users(user_id),
    business_id INTEGER REFERENCES businesses(business_id)
);

-- Create meta_business_managers table
CREATE TABLE IF NOT EXISTS meta_business_managers (
    meta_business_manager_id SERIAL PRIMARY KEY,
    meta_connector_id INTEGER REFERENCES meta_connectors(meta_connector_id),
    business_id INTEGER REFERENCES businesses(business_id)
);

-- Create meta_business_managers_snapshot table
CREATE TABLE IF NOT EXISTS meta_business_managers_snapshot (
    meta_business_manager_snapshot_id SERIAL PRIMARY KEY,
    meta_business_manager_id INTEGER REFERENCES meta_business_managers(meta_business_manager_id),
    date DATE NOT NULL,
    meta_business_manager_name TEXT NOT NULL
);

-- Create meta_ad_accounts table
CREATE TABLE IF NOT EXISTS meta_ad_accounts (
    meta_ad_account_id SERIAL PRIMARY KEY,
    meta_business_manager_id INTEGER REFERENCES meta_business_managers(meta_business_manager_id)
);

-- Create meta_ad_accounts_snapshot table
CREATE TABLE IF NOT EXISTS meta_ad_accounts_snapshot (
    meta_ad_account_snapshot_id SERIAL PRIMARY KEY,
    meta_ad_account_id SERIAL REFERENCES meta_ad_accounts(meta_ad_account_id),
    date DATE NOT NULL,
    meta_ad_account_name TEXT NOT NULL,
    currency TEXT NOT NULL
);

-- Create meta_campaigns table
CREATE TABLE IF NOT EXISTS meta_campaigns (
    meta_campaign_id SERIAL PRIMARY KEY,
    meta_ad_account_id INTEGER REFERENCES meta_ad_accounts(meta_ad_account_id)
);

-- Create meta_campaigns_snapshot table
CREATE TABLE IF NOT EXISTS meta_campaigns_snapshot (
    meta_campaign_snapshot_id SERIAL PRIMARY KEY,
    meta_campaign_id INTEGER REFERENCES meta_campaigns(meta_campaign_id),
    date DATE NOT NULL,
    meta_campaign_name TEXT NOT NULL,
    budget NUMERIC(10, 2)
);

-- Create meta_adsets table
CREATE TABLE IF NOT EXISTS meta_adsets (
    meta_adset_id SERIAL PRIMARY KEY,
    meta_campaign_id INTEGER REFERENCES meta_campaigns(meta_campaign_id)
);

-- Create meta_adsets_snapshot table
CREATE TABLE IF NOT EXISTS meta_adsets_snapshot (
    meta_adset_snapshot_id SERIAL PRIMARY KEY,
    meta_adset_id INTEGER REFERENCES meta_adsets(meta_adset_id),
    date DATE NOT NULL,
    meta_adset_name TEXT NOT NULL
);

-- Create meta_ads table
CREATE TABLE IF NOT EXISTS meta_ads (
    meta_ad_id SERIAL PRIMARY KEY,
    meta_adset_id INTEGER REFERENCES meta_adsets(meta_adset_id)
);

-- Create meta_ads_snapshot table
CREATE TABLE IF NOT EXISTS meta_ads_snapshot (
    meta_ad_snapshot_id SERIAL PRIMARY KEY,
    meta_ad_id INTEGER REFERENCES meta_ads(meta_ad_id),
    date DATE NOT NULL,
    meta_ad_name TEXT NOT NULL
);

-- Create meta_metrics table
CREATE TABLE IF NOT EXISTS meta_metrics (
    meta_metric_id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    meta_ad_account_id INTEGER REFERENCES meta_ad_accounts(meta_ad_account_id),
    meta_campaign_id INTEGER REFERENCES meta_campaigns(meta_campaign_id),
    meta_adset_id INTEGER REFERENCES meta_adsets(meta_adset_id),
    meta_ad_id INTEGER REFERENCES meta_ads(meta_ad_id),
    spend NUMERIC(10,2)
);