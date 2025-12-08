// MongoDB Query: Get all campaigns by name for a selected ad account

function getCampaignsByAdAccount(adAccountId) {
    return db.metaCampaigns.aggregate([
        {
            $match: { metaAdAccountId: adAccountId }
        },
        {
            $project: {
                metaCampaignId: "$_id",
                campaignName: { $arrayElemAt: ["$snapshots.name", -1] }
            }
        },
        {
            $sort: { campaignName: 1 }
        }
    ]).toArray();
}

// Usage: getCampaignsByAdAccount(1)
