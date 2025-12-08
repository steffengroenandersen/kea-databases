import { Router } from "express";
import { getSession } from "../../db/neo4j.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-business-manager", async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(`MATCH (bm:BusinessManager) RETURN bm.managerId AS managerId, bm.currentName AS currentName`);
    return success(res, result.records.map(r => ({ managerId: r.get('managerId'), currentName: r.get('currentName') })));
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.get("/meta-business-manager/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const result = await session.run(`MATCH (bm:BusinessManager {managerId: $id}) RETURN bm.managerId AS managerId, bm.currentName AS currentName`, { id });
    if (result.records.length === 0) return notFound(res);
    const record = result.records[0];
    return success(res, { managerId: record.get('managerId'), currentName: record.get('currentName') });
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.post("/meta-business-manager", async (req, res) => {
  const session = getSession();
  try {
    const { managerId, connectorId, currentName } = req.body;
    if (!managerId) return error(res, "Missing required field: managerId", 400);

    let query = `CREATE (bm:BusinessManager {managerId: $managerId, currentName: $currentName})`;
    if (connectorId) {
      query = `MATCH (mc:MetaConnector {connectorId: $connectorId}) CREATE (mc)-[:MANAGES]->(bm:BusinessManager {managerId: $managerId, currentName: $currentName})`;
    }
    query += ` RETURN bm.managerId AS managerId, bm.currentName AS currentName`;

    const result = await session.run(query, { managerId: Number(managerId), connectorId: connectorId ? Number(connectorId) : null, currentName: currentName || null });
    const record = result.records[0];
    return created(res, { managerId: record.get('managerId'), currentName: record.get('currentName') });
  } catch (err) {
    if (err.code?.includes('ConstraintValidationFailed')) return error(res, "Manager already exists", 409);
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.post("/meta-business-manager/:id/snapshot", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const { snapshotId, date, name } = req.body;
    if (!snapshotId || !date || !name) return error(res, "Missing required fields", 400);

    const result = await session.run(
      `MATCH (bm:BusinessManager {managerId: $id})
       CREATE (bm)-[:HAS_SNAPSHOT]->(s:BusinessManagerSnapshot {snapshotId: $snapshotId, managerId: $id, date: date($date), name: $name})
       RETURN s.snapshotId AS snapshotId, s.date AS date, s.name AS name`,
      { id, snapshotId: Number(snapshotId), date, name }
    );

    if (result.records.length === 0) return notFound(res);
    const record = result.records[0];
    return created(res, { snapshotId: record.get('snapshotId'), date: record.get('date'), name: record.get('name') });
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.delete("/meta-business-manager/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const result = await session.run(
      `MATCH (bm:BusinessManager {managerId: $id})
       WITH bm, bm.managerId AS managerId
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
       DETACH DELETE bm, bms, aa, aas, c, cs, ads, adss, ad, adsnap, m
       RETURN managerId`,
      { id }
    );

    if (result.records.length === 0) return notFound(res);
    return success(res, { managerId: result.records[0].get('managerId') });
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

export default router;
