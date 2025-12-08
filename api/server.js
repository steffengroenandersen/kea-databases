import express from "express";
import { connect as connectMongo } from "./db/mongo.js";

import postgresRouter from "./router/postgres/postgres-router.js";
import mongodbRouter from "./router/mongodb/mongodb-router.js";
import neo4jRouter from "./router/neo4j/neo4j-router.js";

const app = express();
app.use(express.json());

// Initialize MongoDB connection on startup
await connectMongo();

// Mount routers with versioned API paths
app.use("/api/v1/postgres", postgresRouter);
app.use("/api/v1/mongodb", mongodbRouter);
app.use("/api/v1/neo4j", neo4jRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || "Internal server error"
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log("Server is running on port", PORT));
