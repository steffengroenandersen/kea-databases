-- Connect to the markindex database
\connect markindex

-- Insert users into the users table
INSERT INTO users (email, password_hash) VALUES
('john.doe@localhost.com', '$2b$10$rOzHqKtNlAOKBYZhFYmYLOX1cOqT8.ZNqVGvpYmWQoHqYmDQqT8.O');

-- Insert businesses into the businesses table
INSERT INTO businesses (business_name) VALUES
('Acme APS');

-- Insert user_business relations into the user_businesses table
INSERT INTO user_businesses (user_id, business_id) VALUES
(1, 1);

-- Insert meta_connectors into the meta_connector table
INSERT INTO meta_connectors (access_token, user_id, business_id) VALUES 
('EAABwzLixnjYBO1ZCxvZCQzKzVZBqZCWXhGzQ8ZAzMzVZBqZCWXhGzQ8ZAzMzVZBqZCWXhGzQ8', 1, 1);

-- Insert meta_business_managers into the meta_business_managers table
INSERT INTO meta_business_managers (meta_connector_id, business_id) VALUES
(1, 1);

-- Insert meta_business_manager into meta_business_managers snapshot table
INSERT INTO meta_business_managers_snapshot (meta_business_manager_id, date, meta_business_manager_name ) VALUES
(1, '2025-10-10', 'Acme Business Manager');

-- Insert meta_ad_accounts into meta_ad_accounts table
INSERT INTO meta_ad_accounts (meta_business_manager_id) VALUES
(1);

-- Insert meta_ad_accounts into meta_ad_accounts_snapshot table
INSERT INTO meta_ad_accounts_snapshot (meta_ad_account_id, date, meta_ad_account_name, currency) VALUES 
(1, '2025-10-10', 'Acme Ad Account', 'USD');

-- Insert meta_campaigns into meta_campaigns table
INSERT INTO meta_campaigns (meta_ad_account_id) VALUES
(1);

INSERT INTO meta_campaigns_snapshot (meta_campaign_id, date, meta_campaign_name, budget) VALUES
(1, '2025-10-10', 'Acme Campaign Name', 100);

-- Insert meta_adsets into meta_adsets table
INSERT INTO meta_adsets (meta_campaign_id) VALUES
(1);

-- Insert meta_adsets into meta_adsets_snapshot
INSERT INTO meta_adsets_snapshot (meta_adset_id, date, meta_adset_name) VALUES
(1, '2025-10-10', 'Acme Adset Name');

-- Insert meta_ads into meta_ads table
INSERT INTO meta_ads (meta_adset_id) VALUES
(1);

-- Insert meta_ads into meta_ads_snapshot table
INSERT INTO meta_ads_snapshot (meta_ad_id, date, meta_ad_name) VALUES
(1, '2025-10-10', 'Acme Ad Name');

-- Insert meta_metrics into meta_metrics table
INSERT INTO meta_metrics (date, meta_ad_account_id, meta_campaign_id, meta_adset_id, meta_ad_id, spend) VALUES
('2025-10-10',1, 1, 1, 1, 90);