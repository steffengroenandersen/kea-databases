import { MongoClient } from 'mongodb';

const {
  MONGO_HOST = 'mongo',
  MONGO_PORT = 27017,
  MONGO_DATABASE = 'markindex',
  MONGO_USER = 'admin',
  MONGO_PASSWORD = 'admin',
} = process.env;

const url = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/?authSource=admin`;

export const client = new MongoClient(url, {
  maxPoolSize: 10,
  minPoolSize: 2,
});

let db;

export const connect = async () => {
  if (!db) {
    await client.connect();
    db = client.db(MONGO_DATABASE);
    console.log('Connected to MongoDB');
  }
  return db;
};

export const getDb = () => {
  if (!db) throw new Error('Database not connected');
  return db;
};

export const close = async () => {
  await client.close();
};
