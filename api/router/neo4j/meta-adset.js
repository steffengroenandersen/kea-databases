import { Router } from "express";
import { getSession } from "../../db/neo4j.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-adset", async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(`MATCH (ads:AdSet) RETURN ads.adsetId AS adsetId, ads.currentName AS currentName`);
    return success(res, result.records.map(r => ({ adsetId: r.get('adsetId'), currentName: r.get('currentName') })));
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.get("/meta-adset/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const result = await session.run(`MATCH (ads:AdSet {adsetId: $id}) RETURN ads.adsetId AS adsetId, ads.currentName AS currentName`, { id });
    if (result.records.length === 0) return notFound(res);
    const record = result.records[0];
    return success(res, { adsetId: record.get('adsetId'), currentName: record.get('currentName') });
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.post("/meta-adset", async (req, res) => {
  const session = getSession();
  try {
    const { adsetId, campaignId, currentName } = req.body;
    if (!adsetId) return error(res, "Missing required field: adsetId", 400);

    let query = `CREATE (ads:AdSet {adsetId: $adsetId, currentName: $currentName})`;
    if (campaignId) {
      query = `MATCH (c:Campaign {campaignId: $campaignId}) CREATE (c)-[:HAS]->(ads:AdSet {adsetId: $adsetId, currentName: $currentName})`;
    }
    query += ` RETURN ads.adsetId AS adsetId, ads.currentName AS currentName`;

    const result = await session.run(query, { adsetId: Number(adsetId), campaignId: campaignId ? Number(campaignId) : null, currentName: currentName || null });
    const record = result.records[0];
    return created(res, { adsetId: record.get('adsetId'), currentName: record.get('currentName') });
  } catch (err) {
    if (err.code?.includes('ConstraintValidationFailed')) return error(res, "AdSet already exists", 409);
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.post("/meta-adset/:id/snapshot", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const { snapshotId, date, name } = req.body;
    if (!snapshotId || !date || !name) return error(res, "Missing required fields", 400);

    const result = await session.run(
      `MATCH (ads:AdSet {adsetId: $id})
       CREATE (ads)-[:HAS_SNAPSHOT]->(s:AdSetSnapshot {snapshotId: $snapshotId, adsetId: $id, date: date($date), name: $name})
       RETURN s.snapshotId AS snapshotId`,
      { id, snapshotId: Number(snapshotId), date, name }
    );

    if (result.records.length === 0) return notFound(res);
    return created(res, { snapshotId: result.records[0].get('snapshotId'), date, name });
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.delete("/meta-adset/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const result = await session.run(
      `MATCH (ads:AdSet {adsetId: $id})
       WITH ads, ads.adsetId AS adsetId
       OPTIONAL MATCH (ads)-[:HAS_SNAPSHOT]->(adss:AdSetSnapshot)
       OPTIONAL MATCH (ads)-[:CONTAINS]->(ad:Ad)
       OPTIONAL MATCH (ad)-[:HAS_SNAPSHOT]->(adsnap:AdSnapshot)
       OPTIONAL MATCH (ads)-[:HAS_METRICS]->(m:DailyMetrics)
       DETACH DELETE ads, adss, ad, adsnap, m
       RETURN adsetId`,
      { id }
    );

    if (result.records.length === 0) return notFound(res);
    return success(res, { adsetId: result.records[0].get('adsetId') });
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

export default router;
