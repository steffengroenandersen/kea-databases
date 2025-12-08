// MongoDB Initialization Script: Create Collections and Indexes
// This script creates all collections with validation schemas and performance indexes

// Connect to the markindex database
db = db.getSiblingDB('markindex');

print('=== Starting MongoDB Schema Initialization ===');

// Drop existing collections for idempotency
print('Dropping existing collections...');
db.users.drop();
db.businesses.drop();
db.memberships.drop();
db.metaConnectors.drop();
db.metaBusinessManagers.drop();
db.metaAdAccounts.drop();
db.metaCampaigns.drop();
db.metaAdSets.drop();
db.metaAds.drop();
db.metaMetrics.drop();

// ===== 1. Users Collection =====
print('Creating users collection...');
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "email", "passwordHash"],
      properties: {
        _id: {
          bsonType: "int",
          description: "User ID - required integer"
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "User email - required valid email format"
        },
        passwordHash: {
          bsonType: "string",
          minLength: 1,
          description: "Bcrypt password hash - required non-empty string"
        },
        sessionToken: {
          bsonType: ["string", "null"],
          description: "Session token - optional string"
        },
        lastUpdated: {
          bsonType: ["date", "null"],
          description: "Last update timestamp - optional date"
        }
      }
    }
  }
});

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ sessionToken: 1 });
print('✓ Users collection created with indexes');

// ===== 2. Businesses Collection =====
print('Creating businesses collection...');
db.createCollection("businesses", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "businessName"],
      properties: {
        _id: {
          bsonType: "int",
          description: "Business ID - required integer"
        },
        businessName: {
          bsonType: "string",
          minLength: 1,
          description: "Business name - required non-empty string"
        }
      }
    }
  }
});

db.businesses.createIndex({ businessName: 1 });
print('✓ Businesses collection created with indexes');

// ===== 3. Memberships Collection =====
print('Creating memberships collection...');
db.createCollection("memberships", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "businessId"],
      properties: {
        _id: {
          bsonType: "objectId",
          description: "Auto-generated ObjectId"
        },
        userId: {
          bsonType: "int",
          description: "Reference to users._id - required integer"
        },
        businessId: {
          bsonType: "int",
          description: "Reference to businesses._id - required integer"
        }
      }
    }
  }
});

db.memberships.createIndex({ userId: 1, businessId: 1 }, { unique: true });
db.memberships.createIndex({ userId: 1 });
db.memberships.createIndex({ businessId: 1 });
print('✓ Memberships collection created with indexes');

// ===== 4. Meta Connectors Collection =====
print('Creating metaConnectors collection...');
db.createCollection("metaConnectors", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "accessToken"],
      properties: {
        _id: {
          bsonType: "int",
          description: "Meta connector ID - required integer"
        },
        accessToken: {
          bsonType: "string",
          minLength: 1,
          description: "Meta API access token - required non-empty string"
        },
        userId: {
          bsonType: ["int", "null"],
          description: "Reference to users._id - optional integer"
        },
        businessId: {
          bsonType: ["int", "null"],
          description: "Reference to businesses._id - optional integer"
        }
      }
    }
  }
});

db.metaConnectors.createIndex({ userId: 1 });
db.metaConnectors.createIndex({ businessId: 1 });
print('✓ MetaConnectors collection created with indexes');

// ===== 5. Meta Business Managers Collection =====
print('Creating metaBusinessManagers collection...');
db.createCollection("metaBusinessManagers", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "snapshots"],
      properties: {
        _id: {
          bsonType: "int",
          description: "Meta business manager ID - required integer"
        },
        metaConnectorId: {
          bsonType: ["int", "null"],
          description: "Reference to metaConnectors._id - optional integer"
        },
        businessId: {
          bsonType: ["int", "null"],
          description: "Reference to businesses._id - optional integer"
        },
        snapshots: {
          bsonType: "array",
          description: "Business manager snapshot history - required array",
          items: {
            bsonType: "object",
            required: ["date", "name"],
            properties: {
              date: {
                bsonType: "date",
                description: "Snapshot date - required"
              },
              name: {
                bsonType: "string",
                minLength: 1,
                description: "Business manager name - required non-empty string"
              }
            }
          }
        }
      }
    }
  }
});

db.metaBusinessManagers.createIndex({ metaConnectorId: 1 });
db.metaBusinessManagers.createIndex({ businessId: 1 });
db.metaBusinessManagers.createIndex({ "snapshots.date": -1 });
print('✓ MetaBusinessManagers collection created with indexes');

// ===== 6. Meta Ad Accounts Collection =====
print('Creating metaAdAccounts collection...');
db.createCollection("metaAdAccounts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "snapshots"],
      properties: {
        _id: {
          bsonType: "int",
          description: "Meta ad account ID - required integer"
        },
        metaBusinessManagerId: {
          bsonType: ["int", "null"],
          description: "Reference to metaBusinessManagers._id - optional integer"
        },
        snapshots: {
          bsonType: "array",
          description: "Ad account snapshot history - required array",
          items: {
            bsonType: "object",
            required: ["date", "name", "currency"],
            properties: {
              date: {
                bsonType: "date",
                description: "Snapshot date - required"
              },
              name: {
                bsonType: "string",
                minLength: 1,
                description: "Ad account name - required non-empty string"
              },
              currency: {
                bsonType: "string",
                minLength: 3,
                maxLength: 3,
                description: "Currency code - required 3-letter string"
              }
            }
          }
        }
      }
    }
  }
});

db.metaAdAccounts.createIndex({ metaBusinessManagerId: 1 });
db.metaAdAccounts.createIndex({ "snapshots.date": -1 });
print('✓ MetaAdAccounts collection created with indexes');

// ===== 7. Meta Campaigns Collection =====
print('Creating metaCampaigns collection...');
db.createCollection("metaCampaigns", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "snapshots"],
      properties: {
        _id: {
          bsonType: "int",
          description: "Meta campaign ID - required integer"
        },
        metaAdAccountId: {
          bsonType: ["int", "null"],
          description: "Reference to metaAdAccounts._id - optional integer"
        },
        snapshots: {
          bsonType: "array",
          description: "Campaign snapshot history - required array",
          items: {
            bsonType: "object",
            required: ["date", "name"],
            properties: {
              date: {
                bsonType: "date",
                description: "Snapshot date - required"
              },
              name: {
                bsonType: "string",
                minLength: 1,
                description: "Campaign name - required non-empty string"
              },
              budget: {
                bsonType: ["double", "int", "null"],
                minimum: 0,
                description: "Campaign budget - optional non-negative number"
              }
            }
          }
        }
      }
    }
  }
});

db.metaCampaigns.createIndex({ metaAdAccountId: 1 });
db.metaCampaigns.createIndex({ "snapshots.date": -1 });
print('✓ MetaCampaigns collection created with indexes');

// ===== 8. Meta Ad Sets Collection =====
print('Creating metaAdSets collection...');
db.createCollection("metaAdSets", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "snapshots"],
      properties: {
        _id: {
          bsonType: "int",
          description: "Meta ad set ID - required integer"
        },
        metaCampaignId: {
          bsonType: ["int", "null"],
          description: "Reference to metaCampaigns._id - optional integer"
        },
        snapshots: {
          bsonType: "array",
          description: "Ad set snapshot history - required array",
          items: {
            bsonType: "object",
            required: ["date", "name"],
            properties: {
              date: {
                bsonType: "date",
                description: "Snapshot date - required"
              },
              name: {
                bsonType: "string",
                minLength: 1,
                description: "Ad set name - required non-empty string"
              }
            }
          }
        }
      }
    }
  }
});

db.metaAdSets.createIndex({ metaCampaignId: 1 });
db.metaAdSets.createIndex({ "snapshots.date": -1 });
print('✓ MetaAdSets collection created with indexes');

// ===== 9. Meta Ads Collection =====
print('Creating metaAds collection...');
db.createCollection("metaAds", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["_id", "snapshots"],
      properties: {
        _id: {
          bsonType: "int",
          description: "Meta ad ID - required integer"
        },
        metaAdSetId: {
          bsonType: ["int", "null"],
          description: "Reference to metaAdSets._id - optional integer"
        },
        snapshots: {
          bsonType: "array",
          description: "Ad snapshot history - required array",
          items: {
            bsonType: "object",
            required: ["date", "name"],
            properties: {
              date: {
                bsonType: "date",
                description: "Snapshot date - required"
              },
              name: {
                bsonType: "string",
                minLength: 1,
                description: "Ad name - required non-empty string"
              }
            }
          }
        }
      }
    }
  }
});

db.metaAds.createIndex({ metaAdSetId: 1 });
db.metaAds.createIndex({ "snapshots.date": -1 });
print('✓ MetaAds collection created with indexes');

// ===== 10. Meta Metrics Collection =====
print('Creating metaMetrics collection...');
db.createCollection("metaMetrics", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["date"],
      properties: {
        _id: {
          bsonType: "objectId",
          description: "Auto-generated ObjectId"
        },
        date: {
          bsonType: "date",
          description: "Metric date - required"
        },
        metaAdAccountId: {
          bsonType: ["int", "null"],
          description: "Reference to metaAdAccounts._id - optional integer"
        },
        metaCampaignId: {
          bsonType: ["int", "null"],
          description: "Reference to metaCampaigns._id - optional integer"
        },
        metaAdSetId: {
          bsonType: ["int", "null"],
          description: "Reference to metaAdSets._id - optional integer"
        },
        metaAdId: {
          bsonType: ["int", "null"],
          description: "Reference to metaAds._id - optional integer"
        },
        spend: {
          bsonType: ["double", "int", "null"],
          minimum: 0,
          description: "Advertising spend - optional non-negative number"
        }
      }
    }
  }
});

db.metaMetrics.createIndex({ date: -1 });
db.metaMetrics.createIndex({ metaAdAccountId: 1, date: -1 });
db.metaMetrics.createIndex({ metaCampaignId: 1, date: -1 });
db.metaMetrics.createIndex({ metaAdSetId: 1, date: -1 });
db.metaMetrics.createIndex({ metaAdId: 1, date: -1 });
print('✓ MetaMetrics collection created with indexes');

print('=== Schema Initialization Complete ===');
print('Collections created: ' + db.getCollectionNames().length);
