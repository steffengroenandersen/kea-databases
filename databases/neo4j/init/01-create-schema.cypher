// Neo4j Schema Initialization Script
// This script creates constraints and indexes for the Markindex graph database

// ===== CONSTRAINTS (enforce uniqueness + auto-create index) =====

// Primary Entity Constraints
CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.userId IS UNIQUE;

CREATE CONSTRAINT business_id_unique IF NOT EXISTS
FOR (b:Business) REQUIRE b.businessId IS UNIQUE;

CREATE CONSTRAINT connector_id_unique IF NOT EXISTS
FOR (c:MetaConnector) REQUIRE c.connectorId IS UNIQUE;

CREATE CONSTRAINT manager_id_unique IF NOT EXISTS
FOR (m:BusinessManager) REQUIRE m.managerId IS UNIQUE;

CREATE CONSTRAINT account_id_unique IF NOT EXISTS
FOR (a:AdAccount) REQUIRE a.accountId IS UNIQUE;

CREATE CONSTRAINT campaign_id_unique IF NOT EXISTS
FOR (c:Campaign) REQUIRE c.campaignId IS UNIQUE;

CREATE CONSTRAINT adset_id_unique IF NOT EXISTS
FOR (a:AdSet) REQUIRE a.adsetId IS UNIQUE;

CREATE CONSTRAINT ad_id_unique IF NOT EXISTS
FOR (a:Ad) REQUIRE a.adId IS UNIQUE;

// Snapshot Constraints (combination of entity ID + date must be unique)
CREATE CONSTRAINT manager_snapshot_unique IF NOT EXISTS
FOR (s:BusinessManagerSnapshot) REQUIRE (s.managerId, s.date) IS UNIQUE;

CREATE CONSTRAINT account_snapshot_unique IF NOT EXISTS
FOR (s:AdAccountSnapshot) REQUIRE (s.accountId, s.date) IS UNIQUE;

CREATE CONSTRAINT campaign_snapshot_unique IF NOT EXISTS
FOR (s:CampaignSnapshot) REQUIRE (s.campaignId, s.date) IS UNIQUE;

CREATE CONSTRAINT adset_snapshot_unique IF NOT EXISTS
FOR (s:AdSetSnapshot) REQUIRE (s.adsetId, s.date) IS UNIQUE;

CREATE CONSTRAINT ad_snapshot_unique IF NOT EXISTS
FOR (s:AdSnapshot) REQUIRE (s.adId, s.date) IS UNIQUE;

// ===== ADDITIONAL INDEXES (for query performance) =====

// User Indexes
CREATE INDEX user_email IF NOT EXISTS
FOR (u:User) ON (u.email);

// Business Indexes
CREATE INDEX business_name IF NOT EXISTS
FOR (b:Business) ON (b.name);

// Snapshot Date Indexes (for temporal queries)
CREATE INDEX manager_snapshot_date IF NOT EXISTS
FOR (s:BusinessManagerSnapshot) ON (s.date);

CREATE INDEX account_snapshot_date IF NOT EXISTS
FOR (s:AdAccountSnapshot) ON (s.date);

CREATE INDEX campaign_snapshot_date IF NOT EXISTS
FOR (s:CampaignSnapshot) ON (s.date);

CREATE INDEX adset_snapshot_date IF NOT EXISTS
FOR (s:AdSetSnapshot) ON (s.date);

CREATE INDEX ad_snapshot_date IF NOT EXISTS
FOR (s:AdSnapshot) ON (s.date);

// Metrics Date Index (for time-series queries)
CREATE INDEX metrics_date IF NOT EXISTS
FOR (m:DailyMetrics) ON (m.date);
