import { Router } from "express";
import { getSession } from "../../db/neo4j.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/business", async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (b:Business) RETURN b.businessId AS businessId, b.name AS name`
    );

    const businesses = result.records.map(record => ({
      businessId: record.get('businessId'),
      name: record.get('name')
    }));

    return success(res, businesses);
  } catch (err) {
    console.error('Error fetching businesses:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.get("/business/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const result = await session.run(
      `MATCH (b:Business {businessId: $id}) RETURN b.businessId AS businessId, b.name AS name`,
      { id }
    );

    if (result.records.length === 0) return notFound(res);

    const record = result.records[0];
    return success(res, {
      businessId: record.get('businessId'),
      name: record.get('name')
    });
  } catch (err) {
    console.error('Error fetching business:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.post("/business", async (req, res) => {
  const session = getSession();
  try {
    const { businessId, name } = req.body;
    if (!businessId || !name) {
      return error(res, "Missing required fields: businessId, name", 400);
    }

    const result = await session.run(
      `CREATE (b:Business {businessId: $businessId, name: $name})
       RETURN b.businessId AS businessId, b.name AS name`,
      { businessId: Number(businessId), name }
    );

    const record = result.records[0];
    return created(res, {
      businessId: record.get('businessId'),
      name: record.get('name')
    });
  } catch (err) {
    if (err.code?.includes('ConstraintValidationFailed')) {
      return error(res, "Business already exists", 409);
    }
    console.error('Error creating business:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.delete("/business/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);

    const result = await session.run(
      `MATCH (b:Business {businessId: $id})
       WITH b, b.businessId AS businessId, b.name AS name
       OPTIONAL MATCH (b)<-[:CONNECTED_VIA]-(mc:MetaConnector)
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
       DETACH DELETE b, mc, bm, bms, aa, aas, c, cs, ads, adss, ad, adsnap, m
       RETURN businessId, name`,
      { id }
    );

    if (result.records.length === 0) return notFound(res);

    const record = result.records[0];
    return success(res, {
      businessId: record.get('businessId'),
      name: record.get('name')
    });
  } catch (err) {
    console.error('Error deleting business:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

export default router;
