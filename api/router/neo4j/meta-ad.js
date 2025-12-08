import { Router } from "express";
import { getSession } from "../../db/neo4j.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-ad", async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(`MATCH (ad:Ad) RETURN ad.adId AS adId, ad.currentName AS currentName`);
    return success(res, result.records.map(r => ({ adId: r.get('adId'), currentName: r.get('currentName') })));
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.get("/meta-ad/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const result = await session.run(`MATCH (ad:Ad {adId: $id}) RETURN ad.adId AS adId, ad.currentName AS currentName`, { id });
    if (result.records.length === 0) return notFound(res);
    const record = result.records[0];
    return success(res, { adId: record.get('adId'), currentName: record.get('currentName') });
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.post("/meta-ad", async (req, res) => {
  const session = getSession();
  try {
    const { adId, adsetId, currentName } = req.body;
    if (!adId) return error(res, "Missing required field: adId", 400);

    let query = `CREATE (ad:Ad {adId: $adId, currentName: $currentName})`;
    if (adsetId) {
      query = `MATCH (ads:AdSet {adsetId: $adsetId}) CREATE (ads)-[:CONTAINS]->(ad:Ad {adId: $adId, currentName: $currentName})`;
    }
    query += ` RETURN ad.adId AS adId, ad.currentName AS currentName`;

    const result = await session.run(query, { adId: Number(adId), adsetId: adsetId ? Number(adsetId) : null, currentName: currentName || null });
    const record = result.records[0];
    return created(res, { adId: record.get('adId'), currentName: record.get('currentName') });
  } catch (err) {
    if (err.code?.includes('ConstraintValidationFailed')) return error(res, "Ad already exists", 409);
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.post("/meta-ad/:id/snapshot", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const { snapshotId, date, name } = req.body;
    if (!snapshotId || !date || !name) return error(res, "Missing required fields", 400);

    const result = await session.run(
      `MATCH (ad:Ad {adId: $id})
       CREATE (ad)-[:HAS_SNAPSHOT]->(s:AdSnapshot {snapshotId: $snapshotId, adId: $id, date: date($date), name: $name})
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

router.delete("/meta-ad/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const result = await session.run(
      `MATCH (ad:Ad {adId: $id})
       WITH ad, ad.adId AS adId
       OPTIONAL MATCH (ad)-[:HAS_SNAPSHOT]->(adsnap:AdSnapshot)
       OPTIONAL MATCH (ad)-[:HAS_METRICS]->(m:DailyMetrics)
       DETACH DELETE ad, adsnap, m
       RETURN adId`,
      { id }
    );

    if (result.records.length === 0) return notFound(res);
    return success(res, { adId: result.records[0].get('adId') });
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

export default router;
