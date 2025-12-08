// Neo4j Query: Get all AdAccounts by name

MATCH (aa:AdAccount)
OPTIONAL MATCH (aa)-[:HAS_SNAPSHOT]->(aas:AdAccountSnapshot)
WITH aa, aas
ORDER BY aas.date DESC
WITH aa, COLLECT(aas)[0] AS latestSnapshot
RETURN aa.accountId AS metaAdAccountId,
       latestSnapshot.name AS name
ORDER BY latestSnapshot.name;

// Usage: Copy and paste into Neo4j Browser or Cypher Shell
