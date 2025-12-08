// MongoDB Query: Get all MetaAdAccounts by name

function getAllMetaAdAccountsByName() {
    return db.metaAdAccounts.aggregate([
        {
            $project: {
                metaAdAccountId: "$_id",
                name: { $arrayElemAt: ["$snapshots.name", -1] }
            }
        },
        {
            $sort: { name: 1 }
        }
    ]).toArray();
}

// Usage: getAllMetaAdAccountsByName()
