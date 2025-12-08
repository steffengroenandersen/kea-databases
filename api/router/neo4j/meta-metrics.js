import { Router } from "express";
import { getSession } from "../../db/neo4j.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-metrics", async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(`MATCH (m:DailyMetrics) RETURN m.metricId AS metricId, m.date AS date, m.spend AS spend LIMIT 100`);
    return success(res, result.records.map(r => ({ metricId: r.get('metricId'), date: r.get('date'), spend: r.get('spend') })));
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.get("/meta-metrics/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const result = await session.run(`MATCH (m:DailyMetrics {metricId: $id}) RETURN m.metricId AS metricId, m.date AS date, m.spend AS spend`, { id });
    if (result.records.length === 0) return notFound(res);
    const record = result.records[0];
    return success(res, { metricId: record.get('metricId'), date: record.get('date'), spend: record.get('spend') });
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.post("/meta-metrics", async (req, res) => {
  const session = getSession();
  try {
    const { metricId, date, spend, accountId, campaignId, adsetId, adId } = req.body;
    if (!metricId || !date) return error(res, "Missing required fields: metricId, date", 400);

    let query = `CREATE (m:DailyMetrics {metricId: $metricId, date: date($date), spend: $spend})`;

    if (accountId) {
      query = `MATCH (aa:AdAccount {accountId: $accountId}) CREATE (aa)-[:HAS_METRICS]->(m:DailyMetrics {metricId: $metricId, date: date($date), spend: $spend})`;
    } else if (campaignId) {
      query = `MATCH (c:Campaign {campaignId: $campaignId}) CREATE (c)-[:HAS_METRICS]->(m:DailyMetrics {metricId: $metricId, date: date($date), spend: $spend})`;
    } else if (adsetId) {
      query = `MATCH (ads:AdSet {adsetId: $adsetId}) CREATE (ads)-[:HAS_METRICS]->(m:DailyMetrics {metricId: $metricId, date: date($date), spend: $spend})`;
    } else if (adId) {
      query = `MATCH (ad:Ad {adId: $adId}) CREATE (ad)-[:HAS_METRICS]->(m:DailyMetrics {metricId: $metricId, date: date($date), spend: $spend})`;
    }

    query += ` RETURN m.metricId AS metricId, m.date AS date, m.spend AS spend`;

    const result = await session.run(query, {
      metricId: Number(metricId),
      date,
      spend: spend || null,
      accountId: accountId ? Number(accountId) : null,
      campaignId: campaignId ? Number(campaignId) : null,
      adsetId: adsetId ? Number(adsetId) : null,
      adId: adId ? Number(adId) : null
    });

    const record = result.records[0];
    return created(res, { metricId: record.get('metricId'), date: record.get('date'), spend: record.get('spend') });
  } catch (err) {
    if (err.code?.includes('ConstraintValidationFailed')) return error(res, "Metric already exists", 409);
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.delete("/meta-metrics/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const result = await session.run(
      `MATCH (m:DailyMetrics {metricId: $id})
       WITH m, m.metricId AS metricId
       DETACH DELETE m
       RETURN metricId`,
      { id }
    );

    if (result.records.length === 0) return notFound(res);
    return success(res, { metricId: result.records[0].get('metricId') });
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

export default router;
