// Neo4j Data Seeding Script
// This script populates the graph database with test data from PostgreSQL

// ===== 1. CREATE USERS =====
CREATE (u:User {
  userId: 1,
  email: 'john.doe@localhost.com',
  passwordHash: '$2b$10$rOzHqKtNlAOKBYZhFYmYLOX1cOqT8.ZNqVGvpYmWQoHqYmDQqT8.O',
  sessionToken: 'tokenId'
});

// ===== 2. CREATE BUSINESSES =====
CREATE (b1:Business {businessId: 1, name: 'Acme ApS'}),
       (b2:Business {businessId: 2, name: 'Digital Marketing Pro'}),
       (b3:Business {businessId: 3, name: 'Creative Agency Co'}),
       (b4:Business {businessId: 4, name: 'E-commerce Experts'}),
       (b5:Business {businessId: 5, name: 'Social Media Masters'}),
       (b6:Business {businessId: 6, name: 'Brand Strategy Group'}),
       (b7:Business {businessId: 7, name: 'Growth Marketing LLC'}),
       (b8:Business {businessId: 8, name: 'Ad Performance Hub'}),
       (b9:Business {businessId: 9, name: 'Digital Ventures Ltd'}),
       (b10:Business {businessId: 10, name: 'Marketing Analytics Corp'});

// ===== 3. CREATE USER-BUSINESS RELATIONSHIPS =====
MATCH (u:User {userId: 1})
MATCH (b1:Business {businessId: 1})
CREATE (u)-[:ACCESSES]->(b1);

MATCH (u:User)
WHERE u.userId = 1
MATCH (b2:Business {businessId: 2})
CREATE (u)-[:ACCESSES]->(b2);

MATCH (u:User)
WHERE u.userId = 1
MATCH (b3:Business {businessId: 3})
CREATE (u)-[:ACCESSES]->(b3);

MATCH (u:User)
WHERE u.userId = 1
MATCH (b4:Business {businessId: 4})
CREATE (u)-[:ACCESSES]->(b4);

MATCH (u:User)
WHERE u.userId = 1
MATCH (b5:Business {businessId: 5})
CREATE (u)-[:ACCESSES]->(b5);

MATCH (u:User)
WHERE u.userId = 1
MATCH (b6:Business {businessId: 6})
CREATE (u)-[:ACCESSES]->(b6);

MATCH (u:User)
WHERE u.userId = 1
MATCH (b7:Business {businessId: 7})
CREATE (u)-[:ACCESSES]->(b7);

MATCH (u:User)
WHERE u.userId = 1
MATCH (b8:Business {businessId: 8})
CREATE (u)-[:ACCESSES]->(b8);

MATCH (u:User)
WHERE u.userId = 1
MATCH (b9:Business {businessId: 9})
CREATE (u)-[:ACCESSES]->(b9);

MATCH (u:User)
WHERE u.userId = 1
MATCH (b10:Business {businessId: 10})
CREATE (u)-[:ACCESSES]->(b10);

// ===== 4. CREATE META CONNECTOR =====
CREATE (mc:MetaConnector {
  connectorId: 1,
  accessToken: 'EAABwzLixnjYBO1ZCxvZCQzKzVZBqZCWXhGzQ8ZAzMzVZBqZCWXhGzQ8ZAzMzVZBqZCWXhGzQ8',
  userId: 1,
  businessId: 1
});

// ===== 5. CREATE BUSINESS MANAGER & SNAPSHOT =====
CREATE (bm:BusinessManager {
  managerId: 1,
  currentName: 'Acme Business Manager'
});

CREATE (bms:BusinessManagerSnapshot {
  snapshotId: 1,
  managerId: 1,
  date: date('2025-10-10'),
  name: 'Acme Business Manager'
});

// ===== 6. CREATE AD ACCOUNT & SNAPSHOT =====
CREATE (aa:AdAccount {
  accountId: 1,
  currentName: 'Acme Ad Account',
  currentCurrency: 'USD'
});

CREATE (aas:AdAccountSnapshot {
  snapshotId: 1,
  accountId: 1,
  date: date('2025-10-10'),
  name: 'Acme Ad Account',
  currency: 'USD'
});

// ===== 7. CREATE CAMPAIGN & SNAPSHOT =====
CREATE (c:Campaign {
  campaignId: 1,
  currentName: 'Fall sales 2025',
  currentBudget: 100
});

CREATE (cs:CampaignSnapshot {
  snapshotId: 1,
  campaignId: 1,
  date: date('2025-10-10'),
  name: 'Fall sales 2025',
  budget: 100
});

// ===== 8. CREATE AD SET & SNAPSHOT =====
CREATE (ads:AdSet {
  adsetId: 1,
  currentName: 'Men, ages 18-55, location DK'
});

CREATE (adss:AdSetSnapshot {
  snapshotId: 1,
  adsetId: 1,
  date: date('2025-10-10'),
  name: 'Men, ages 18-55, location DK'
});

// ===== 9. CREATE AD & SNAPSHOT =====
CREATE (ad:Ad {
  adId: 1,
  currentName: 'Fall version 1'
});

CREATE (adsnap:AdSnapshot {
  snapshotId: 1,
  adId: 1,
  date: date('2025-10-10'),
  name: 'Fall version 1'
});

// ===== 10. CREATE DAILY METRICS =====
CREATE (m:DailyMetrics {
  metricId: 1,
  date: date('2025-10-10'),
  spend: 10
});

// ===== 11. CREATE HIERARCHY RELATIONSHIPS =====

// Business -> MetaConnector
MATCH (b:Business {businessId: 1})
MATCH (mc:MetaConnector {connectorId: 1})
CREATE (b)-[:CONNECTED_VIA]->(mc);

// MetaConnector -> BusinessManager
MATCH (mc:MetaConnector {connectorId: 1})
MATCH (bm:BusinessManager {managerId: 1})
CREATE (mc)-[:MANAGES]->(bm);

// BusinessManager -> AdAccount
MATCH (bm:BusinessManager {managerId: 1})
MATCH (aa:AdAccount {accountId: 1})
CREATE (bm)-[:HAS]->(aa);

// AdAccount -> Campaign
MATCH (aa:AdAccount {accountId: 1})
MATCH (c:Campaign {campaignId: 1})
CREATE (aa)-[:CONTAINS]->(c);

// Campaign -> AdSet
MATCH (c:Campaign {campaignId: 1})
MATCH (ads:AdSet {adsetId: 1})
CREATE (c)-[:HAS]->(ads);

// AdSet -> Ad
MATCH (ads:AdSet {adsetId: 1})
MATCH (ad:Ad {adId: 1})
CREATE (ads)-[:CONTAINS]->(ad);

// ===== 12. CREATE SNAPSHOT RELATIONSHIPS =====

// BusinessManager -> BusinessManagerSnapshot
MATCH (bm:BusinessManager {managerId: 1})
MATCH (bms:BusinessManagerSnapshot {snapshotId: 1})
CREATE (bm)-[:HAS_SNAPSHOT]->(bms);

// AdAccount -> AdAccountSnapshot
MATCH (aa:AdAccount {accountId: 1})
MATCH (aas:AdAccountSnapshot {snapshotId: 1})
CREATE (aa)-[:HAS_SNAPSHOT]->(aas);

// Campaign -> CampaignSnapshot
MATCH (c:Campaign {campaignId: 1})
MATCH (cs:CampaignSnapshot {snapshotId: 1})
CREATE (c)-[:HAS_SNAPSHOT]->(cs);

// AdSet -> AdSetSnapshot
MATCH (ads:AdSet {adsetId: 1})
MATCH (adss:AdSetSnapshot {snapshotId: 1})
CREATE (ads)-[:HAS_SNAPSHOT]->(adss);

// Ad -> AdSnapshot
MATCH (ad:Ad {adId: 1})
MATCH (adsnap:AdSnapshot {snapshotId: 1})
CREATE (ad)-[:HAS_SNAPSHOT]->(adsnap);

// ===== 13. CREATE METRICS RELATIONSHIPS =====

// AdAccount -> DailyMetrics
MATCH (aa:AdAccount {accountId: 1})
MATCH (m:DailyMetrics {metricId: 1})
CREATE (aa)-[:HAS_METRICS]->(m);

// Campaign -> DailyMetrics
MATCH (c:Campaign {campaignId: 1})
MATCH (m:DailyMetrics {metricId: 1})
CREATE (c)-[:HAS_METRICS]->(m);

// AdSet -> DailyMetrics
MATCH (ads:AdSet {adsetId: 1})
MATCH (m:DailyMetrics {metricId: 1})
CREATE (ads)-[:HAS_METRICS]->(m);

// Ad -> DailyMetrics
MATCH (ad:Ad {adId: 1})
MATCH (m:DailyMetrics {metricId: 1})
CREATE (ad)-[:HAS_METRICS]->(m);
