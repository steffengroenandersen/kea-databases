# KEA Databases - Markindex Project

A comprehensive database implementation project for the "Markindex" marketing analytics platform, demonstrating database design and implementation across PostgreSQL, MongoDB, and Neo4j.

## Project Overview

**Markindex** is a marketing analytics platform that integrates with Meta's advertising APIs to provide comprehensive reporting and analytics for digital marketing campaigns.

### Domain Entities

1. **Users** - Platform users who can access multiple businesses
2. **Businesses** - Customer companies that pay for the service
3. **Sessions** - Authentication tokens for web application access
4. **Meta Connectors** - Access tokens for Meta API integration
5. **Meta Business Managers** - Business managers from Meta API
6. **Meta Ad Accounts** - Ad accounts from Meta Business Manager
7. **Meta Metrics** - Daily advertising statistics (spend, impressions, etc.)
8. **Meta Campaigns Snapshot** - Campaign information with history
9. **Meta Ad Groups Snapshot** - Ad group information with history
10. **Meta Ads Snapshot** - Ad information with history

## Project Structure

```
├── databases/
│   ├── postgresql/     # PostgreSQL implementation
│   ├── mongodb/        # MongoDB implementation
│   └── neo4j/          # Neo4j implementation
├── api/                # Express.js API server
└── docs/               # Documentation and ERDs
```

## Report

https://docs.google.com/document/d/1F-ysB2HH01QXZIwTl-DLjf1scuIV6_KNCHyHOFms99o/edit?usp=sharing
