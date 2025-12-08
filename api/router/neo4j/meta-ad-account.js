import { Router } from "express";
import { getSession } from "../../db/neo4j.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-ad-account", async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(`MATCH (aa:AdAccount) RETURN aa.accountId AS accountId, aa.currentName AS currentName, aa.currentCurrency AS currentCurrency`);
    return success(res, result.records.map(r => ({ accountId: r.get('accountId'), currentName: r.get('currentName'), currentCurrency: r.get('currentCurrency') })));
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.get("/meta-ad-account/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const result = await session.run(`MATCH (aa:AdAccount {accountId: $id}) RETURN aa.accountId AS accountId, aa.currentName AS currentName, aa.currentCurrency AS currentCurrency`, { id });
    if (result.records.length === 0) return notFound(res);
    const record = result.records[0];
    return success(res, { accountId: record.get('accountId'), currentName: record.get('currentName'), currentCurrency: record.get('currentCurrency') });
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.post("/meta-ad-account", async (req, res) => {
  const session = getSession();
  try {
    const { accountId, managerId, currentName, currentCurrency } = req.body;
    if (!accountId) return error(res, "Missing required field: accountId", 400);

    let query = `CREATE (aa:AdAccount {accountId: $accountId, currentName: $currentName, currentCurrency: $currentCurrency})`;
    if (managerId) {
      query = `MATCH (bm:BusinessManager {managerId: $managerId}) CREATE (bm)-[:HAS]->(aa:AdAccount {accountId: $accountId, currentName: $currentName, currentCurrency: $currentCurrency})`;
    }
    query += ` RETURN aa.accountId AS accountId, aa.currentName AS currentName, aa.currentCurrency AS currentCurrency`;

    const result = await session.run(query, { accountId: Number(accountId), managerId: managerId ? Number(managerId) : null, currentName: currentName || null, currentCurrency: currentCurrency || null });
    const record = result.records[0];
    return created(res, { accountId: record.get('accountId'), currentName: record.get('currentName'), currentCurrency: record.get('currentCurrency') });
  } catch (err) {
    if (err.code?.includes('ConstraintValidationFailed')) return error(res, "Ad account already exists", 409);
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.post("/meta-ad-account/:id/snapshot", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const { snapshotId, date, name, currency } = req.body;
    if (!snapshotId || !date || !name || !currency) return error(res, "Missing required fields", 400);

    const result = await session.run(
      `MATCH (aa:AdAccount {accountId: $id})
       CREATE (aa)-[:HAS_SNAPSHOT]->(s:AdAccountSnapshot {snapshotId: $snapshotId, accountId: $id, date: date($date), name: $name, currency: $currency})
       RETURN s.snapshotId AS snapshotId`,
      { id, snapshotId: Number(snapshotId), date, name, currency }
    );

    if (result.records.length === 0) return notFound(res);
    return created(res, { snapshotId: result.records[0].get('snapshotId'), date, name, currency });
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.delete("/meta-ad-account/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const result = await session.run(
      `MATCH (aa:AdAccount {accountId: $id})
       WITH aa, aa.accountId AS accountId
       OPTIONAL MATCH (aa)-[:HAS_SNAPSHOT]->(aas:AdAccountSnapshot)
       OPTIONAL MATCH (aa)-[:CONTAINS]->(c:Campaign)
       OPTIONAL MATCH (c)-[:HAS_SNAPSHOT]->(cs:CampaignSnapshot)
       OPTIONAL MATCH (c)-[:HAS]->(ads:AdSet)
       OPTIONAL MATCH (ads)-[:HAS_SNAPSHOT]->(adss:AdSetSnapshot)
       OPTIONAL MATCH (ads)-[:CONTAINS]->(ad:Ad)
       OPTIONAL MATCH (ad)-[:HAS_SNAPSHOT]->(adsnap:AdSnapshot)
       OPTIONAL MATCH (aa)-[:HAS_METRICS]->(m:DailyMetrics)
       DETACH DELETE aa, aas, c, cs, ads, adss, ad, adsnap, m
       RETURN accountId`,
      { id }
    );

    if (result.records.length === 0) return notFound(res);
    return success(res, { accountId: result.records[0].get('accountId') });
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

export default router;
