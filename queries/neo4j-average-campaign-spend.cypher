// Neo4j Query: Find average spend on all campaigns for benchmarking

MATCH (c:Campaign)-[:HAS_METRICS]->(m:DailyMetrics)
RETURN avg(m.spend) AS averageSpend;

// Usage: Copy and paste into Neo4j Browser or Cypher Shell
