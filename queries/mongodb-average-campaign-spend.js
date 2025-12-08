// MongoDB Query: Find average spend on all campaigns for benchmarking

function getAverageCampaignSpend() {
    return db.metaMetrics.aggregate([
        {
            $match: { metaCampaignId: { $ne: null } }
        },
        {
            $group: {
                _id: null,
                averageSpend: { $avg: "$spend" }
            }
        },
        {
            $project: {
                _id: 0,
                averageSpend: 1
            }
        }
    ]).toArray();
}

// Usage: getAverageCampaignSpend()
