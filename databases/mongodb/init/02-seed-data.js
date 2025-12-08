// MongoDB Initialization Script: Seed Data
// This script populates the database with test data transformed from PostgreSQL

// Connect to the markindex database
db = db.getSiblingDB('markindex');

print('=== Starting MongoDB Data Seeding ===');

// Clear existing data for idempotency
print('Clearing existing data...');
db.users.deleteMany({});
db.businesses.deleteMany({});
db.memberships.deleteMany({});
db.metaConnectors.deleteMany({});
db.metaBusinessManagers.deleteMany({});
db.metaAdAccounts.deleteMany({});
db.metaCampaigns.deleteMany({});
db.metaAdSets.deleteMany({});
db.metaAds.deleteMany({});
db.metaMetrics.deleteMany({});

// ===== 1. Insert Users =====
print('Inserting users...');
db.users.insertMany([
  {
    _id: 1,
    email: "john.doe@localhost.com",
    passwordHash: "$2b$10$rOzHqKtNlAOKBYZhFYmYLOX1cOqT8.ZNqVGvpYmWQoHqYmDQqT8.O",
    sessionToken: "tokenId",
    lastUpdated: null
  }
]);
print('✓ Inserted ' + db.users.countDocuments() + ' user(s)');

// ===== 2. Insert Businesses =====
print('Inserting businesses...');
db.businesses.insertMany([
  { _id: 1, businessName: "Acme ApS" },
  { _id: 2, businessName: "Digital Marketing Pro" },
  { _id: 3, businessName: "Creative Agency Co" },
  { _id: 4, businessName: "E-commerce Experts" },
  { _id: 5, businessName: "Social Media Masters" },
  { _id: 6, businessName: "Brand Strategy Group" },
  { _id: 7, businessName: "Growth Marketing LLC" },
  { _id: 8, businessName: "Ad Performance Hub" },
  { _id: 9, businessName: "Digital Ventures Ltd" },
  { _id: 10, businessName: "Marketing Analytics Corp" }
]);
print('✓ Inserted ' + db.businesses.countDocuments() + ' business(es)');

// ===== 3. Insert Memberships =====
print('Inserting memberships...');
db.memberships.insertMany([
  { userId: 1, businessId: 1 },
  { userId: 2, businessId: 2 },
  { userId: 3, businessId: 3 },
  { userId: 4, businessId: 4 },
  { userId: 5, businessId: 5 },
  { userId: 6, businessId: 6 },
  { userId: 7, businessId: 7 },
  { userId: 8, businessId: 8 },
  { userId: 9, businessId: 9 },
  { userId: 10, businessId: 10 }
]);
print('✓ Inserted ' + db.memberships.countDocuments() + ' membership(s)');

// ===== 4. Insert Meta Connectors =====
print('Inserting metaConnectors...');
db.metaConnectors.insertMany([
  {
    _id: 1,
    accessToken: "EAABwzLixnjYBO1ZCxvZCQzKzVZBqZCWXhGzQ8ZAzMzVZBqZCWXhGzQ8ZAzMzVZBqZCWXhGzQ8",
    userId: 1,
    businessId: 1
  }
]);
print('✓ Inserted ' + db.metaConnectors.countDocuments() + ' meta connector(s)');

// ===== 5. Insert Meta Business Managers with Embedded Snapshots =====
print('Inserting metaBusinessManagers with snapshots...');
db.metaBusinessManagers.insertMany([
  {
    _id: 1,
    metaConnectorId: 1,
    businessId: 1,
    snapshots: [
      {
        date: new Date("2025-10-10T00:00:00.000Z"),
        name: "Acme Business Manager"
      }
    ]
  }
]);
print('✓ Inserted ' + db.metaBusinessManagers.countDocuments() + ' meta business manager(s)');

// ===== 6. Insert Meta Ad Accounts with Embedded Snapshots =====
print('Inserting metaAdAccounts with snapshots...');
db.metaAdAccounts.insertMany([
  {
    _id: 1,
    metaBusinessManagerId: 1,
    snapshots: [
      {
        date: new Date("2025-10-10T00:00:00.000Z"),
        name: "Acme Ad Account",
        currency: "USD"
      }
    ]
  }
]);
print('✓ Inserted ' + db.metaAdAccounts.countDocuments() + ' meta ad account(s)');

// ===== 7. Insert Meta Campaigns with Embedded Snapshots =====
print('Inserting metaCampaigns with snapshots...');
db.metaCampaigns.insertMany([
  {
    _id: 1,
    metaAdAccountId: 1,
    snapshots: [
      {
        date: new Date("2025-10-10T00:00:00.000Z"),
        name: "Fall sales 2025",
        budget: 100
      }
    ]
  }
]);
print('✓ Inserted ' + db.metaCampaigns.countDocuments() + ' meta campaign(s)');

// ===== 8. Insert Meta Ad Sets with Embedded Snapshots =====
print('Inserting metaAdSets with snapshots...');
db.metaAdSets.insertMany([
  {
    _id: 1,
    metaCampaignId: 1,
    snapshots: [
      {
        date: new Date("2025-10-10T00:00:00.000Z"),
        name: "Men, ages 18-55, location DK"
      }
    ]
  }
]);
print('✓ Inserted ' + db.metaAdSets.countDocuments() + ' meta ad set(s)');

// ===== 9. Insert Meta Ads with Embedded Snapshots =====
print('Inserting metaAds with snapshots...');
db.metaAds.insertMany([
  {
    _id: 1,
    metaAdSetId: 1,
    snapshots: [
      {
        date: new Date("2025-10-10T00:00:00.000Z"),
        name: "Fall version 1"
      }
    ]
  }
]);
print('✓ Inserted ' + db.metaAds.countDocuments() + ' meta ad(s)');

// ===== 10. Insert Meta Metrics =====
print('Inserting metaMetrics...');
db.metaMetrics.insertMany([
  {
    date: new Date("2025-10-10T00:00:00.000Z"),
    metaAdAccountId: 1,
    metaCampaignId: 1,
    metaAdSetId: 1,
    metaAdId: 1,
    spend: 10
  }
]);
print('✓ Inserted ' + db.metaMetrics.countDocuments() + ' meta metric(s)');

// ===== Verification Summary =====
print('');
print('=== Data Seeding Complete ===');
print('Summary of inserted documents:');
print('  - Users:                 ' + db.users.countDocuments());
print('  - Businesses:            ' + db.businesses.countDocuments());
print('  - Memberships:           ' + db.memberships.countDocuments());
print('  - Meta Connectors:       ' + db.metaConnectors.countDocuments());
print('  - Meta Business Managers: ' + db.metaBusinessManagers.countDocuments());
print('  - Meta Ad Accounts:      ' + db.metaAdAccounts.countDocuments());
print('  - Meta Campaigns:        ' + db.metaCampaigns.countDocuments());
print('  - Meta Ad Sets:          ' + db.metaAdSets.countDocuments());
print('  - Meta Ads:              ' + db.metaAds.countDocuments());
print('  - Meta Metrics:          ' + db.metaMetrics.countDocuments());
print('');
print('Verify snapshot embedding:');
var campaign = db.metaCampaigns.findOne({ _id: 1 });
if (campaign && campaign.snapshots && campaign.snapshots.length > 0) {
  print('✓ Campaign snapshots embedded successfully');
  print('  Latest snapshot: ' + campaign.snapshots[0].name + ' (Budget: ' + campaign.snapshots[0].budget + ')');
} else {
  print('✗ Warning: Campaign snapshots not found');
}
