// Neo4j Query: Get all campaigns by name for a selected ad account

MATCH (aa:AdAccount {accountId: $adAccountId})-[:CONTAINS]->(c:Campaign)
RETURN c.campaignId AS metaCampaignId,
       c.currentName AS campaignName
ORDER BY c.currentName;
