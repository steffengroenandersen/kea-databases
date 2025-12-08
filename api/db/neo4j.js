import neo4j from 'neo4j-driver';

const {
  NEO4J_URI = 'bolt://neo4j:7687',
  NEO4J_USER = 'neo4j',
  NEO4J_PASSWORD = 'password',
} = process.env;

export const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  {
    maxConnectionPoolSize: 50,
    connectionTimeout: 30000,
  }
);

export const getSession = () => {
  return driver.session({ database: 'neo4j' });
};

export const close = async () => {
  await driver.close();
};
