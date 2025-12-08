# MongoDB Document Model

All data comes from Postgres.

Run the migraine tool to enrich.

## Collections

1. users
2. businesses
3. memberships

### Users

Purpose: Application users. A user may exist without any business access.

Fields:

1. \_id
2. email
3. passwordHash
4. sessionToken

### Businesses

Purpose: Represents a customers business. Multiple users can have access.

Fields:

1. \_id
2. name

### Memberships

Purpose: Many-to-many relationship between users and businesses.

Fields:

1. \_id
2. userId
3. businessId
4. role
