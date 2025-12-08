import { Router } from "express";
import { getSession } from "../../db/neo4j.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-connector", async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (mc:MetaConnector)
       RETURN mc.connectorId AS connectorId, mc.accessToken AS accessToken, mc.userId AS userId, mc.businessId AS businessId`
    );

    const connectors = result.records.map(record => ({
      connectorId: record.get('connectorId'),
      accessToken: record.get('accessToken'),
      userId: record.get('userId'),
      businessId: record.get('businessId')
    }));

    return success(res, connectors);
  } catch (err) {
    console.error('Error fetching connectors:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.get("/meta-connector/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const result = await session.run(
      `MATCH (mc:MetaConnector {connectorId: $id})
       RETURN mc.connectorId AS connectorId, mc.accessToken AS accessToken, mc.userId AS userId, mc.businessId AS businessId`,
      { id }
    );

    if (result.records.length === 0) return notFound(res);

    const record = result.records[0];
    return success(res, {
      connectorId: record.get('connectorId'),
      accessToken: record.get('accessToken'),
      userId: record.get('userId'),
      businessId: record.get('businessId')
    });
  } catch (err) {
    console.error('Error fetching connector:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.post("/meta-connector", async (req, res) => {
  const session = getSession();
  try {
    const { connectorId, accessToken, userId, businessId } = req.body;
    if (!connectorId || !accessToken) {
      return error(res, "Missing required fields: connectorId, accessToken", 400);
    }

    let query = `CREATE (mc:MetaConnector {connectorId: $connectorId, accessToken: $accessToken, userId: $userId, businessId: $businessId})`;

    if (businessId) {
      query = `MATCH (b:Business {businessId: $businessId})
               CREATE (b)<-[:CONNECTED_VIA]-(mc:MetaConnector {connectorId: $connectorId, accessToken: $accessToken, userId: $userId, businessId: $businessId})`;
    }

    query += ` RETURN mc.connectorId AS connectorId, mc.accessToken AS accessToken, mc.userId AS userId, mc.businessId AS businessId`;

    const result = await session.run(query, {
      connectorId: Number(connectorId),
      accessToken,
      userId: userId ? Number(userId) : null,
      businessId: businessId ? Number(businessId) : null
    });

    const record = result.records[0];
    return created(res, {
      connectorId: record.get('connectorId'),
      accessToken: record.get('accessToken'),
      userId: record.get('userId'),
      businessId: record.get('businessId')
    });
  } catch (err) {
    if (err.code?.includes('ConstraintValidationFailed')) {
      return error(res, "Connector already exists", 409);
    }
    console.error('Error creating connector:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.delete("/meta-connector/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);

    const result = await session.run(
      `MATCH (mc:MetaConnector {connectorId: $id})
       WITH mc, mc.connectorId AS connectorId, mc.accessToken AS accessToken
       OPTIONAL MATCH (mc)-[:MANAGES]->(bm:BusinessManager)
       OPTIONAL MATCH (bm)-[:HAS_SNAPSHOT]->(bms:BusinessManagerSnapshot)
       OPTIONAL MATCH (bm)-[:HAS]->(aa:AdAccount)
       OPTIONAL MATCH (aa)-[:HAS_SNAPSHOT]->(aas:AdAccountSnapshot)
       OPTIONAL MATCH (aa)-[:CONTAINS]->(c:Campaign)
       OPTIONAL MATCH (c)-[:HAS_SNAPSHOT]->(cs:CampaignSnapshot)
       OPTIONAL MATCH (c)-[:HAS]->(ads:AdSet)
       OPTIONAL MATCH (ads)-[:HAS_SNAPSHOT]->(adss:AdSetSnapshot)
       OPTIONAL MATCH (ads)-[:CONTAINS]->(ad:Ad)
       OPTIONAL MATCH (ad)-[:HAS_SNAPSHOT]->(adsnap:AdSnapshot)
       OPTIONAL MATCH (aa)-[:HAS_METRICS]->(m:DailyMetrics)
       DETACH DELETE mc, bm, bms, aa, aas, c, cs, ads, adss, ad, adsnap, m
       RETURN connectorId, accessToken`,
      { id }
    );

    if (result.records.length === 0) return notFound(res);

    const record = result.records[0];
    return success(res, {
      connectorId: record.get('connectorId'),
      accessToken: record.get('accessToken')
    });
  } catch (err) {
    console.error('Error deleting connector:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

export default router;
