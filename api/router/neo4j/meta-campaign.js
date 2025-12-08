import { Router } from "express";
import { getSession } from "../../db/neo4j.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-campaign", async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(`MATCH (c:Campaign) RETURN c.campaignId AS campaignId, c.currentName AS currentName, c.currentBudget AS currentBudget`);
    return success(res, result.records.map(r => ({ campaignId: r.get('campaignId'), currentName: r.get('currentName'), currentBudget: r.get('currentBudget') })));
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.get("/meta-campaign/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const result = await session.run(`MATCH (c:Campaign {campaignId: $id}) RETURN c.campaignId AS campaignId, c.currentName AS currentName, c.currentBudget AS currentBudget`, { id });
    if (result.records.length === 0) return notFound(res);
    const record = result.records[0];
    return success(res, { campaignId: record.get('campaignId'), currentName: record.get('currentName'), currentBudget: record.get('currentBudget') });
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.post("/meta-campaign", async (req, res) => {
  const session = getSession();
  try {
    const { campaignId, accountId, currentName, currentBudget } = req.body;
    if (!campaignId) return error(res, "Missing required field: campaignId", 400);

    let query = `CREATE (c:Campaign {campaignId: $campaignId, currentName: $currentName, currentBudget: $currentBudget})`;
    if (accountId) {
      query = `MATCH (aa:AdAccount {accountId: $accountId}) CREATE (aa)-[:CONTAINS]->(c:Campaign {campaignId: $campaignId, currentName: $currentName, currentBudget: $currentBudget})`;
    }
    query += ` RETURN c.campaignId AS campaignId, c.currentName AS currentName, c.currentBudget AS currentBudget`;

    const result = await session.run(query, { campaignId: Number(campaignId), accountId: accountId ? Number(accountId) : null, currentName: currentName || null, currentBudget: currentBudget || null });
    const record = result.records[0];
    return created(res, { campaignId: record.get('campaignId'), currentName: record.get('currentName'), currentBudget: record.get('currentBudget') });
  } catch (err) {
    if (err.code?.includes('ConstraintValidationFailed')) return error(res, "Campaign already exists", 409);
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.post("/meta-campaign/:id/snapshot", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const { snapshotId, date, name, budget } = req.body;
    if (!snapshotId || !date || !name) return error(res, "Missing required fields", 400);

    const result = await session.run(
      `MATCH (c:Campaign {campaignId: $id})
       CREATE (c)-[:HAS_SNAPSHOT]->(s:CampaignSnapshot {snapshotId: $snapshotId, campaignId: $id, date: date($date), name: $name, budget: $budget})
       RETURN s.snapshotId AS snapshotId`,
      { id, snapshotId: Number(snapshotId), date, name, budget: budget || null }
    );

    if (result.records.length === 0) return notFound(res);
    return created(res, { snapshotId: result.records[0].get('snapshotId'), date, name, budget });
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.delete("/meta-campaign/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const result = await session.run(
      `MATCH (c:Campaign {campaignId: $id})
       WITH c, c.campaignId AS campaignId
       OPTIONAL MATCH (c)-[:HAS_SNAPSHOT]->(cs:CampaignSnapshot)
       OPTIONAL MATCH (c)-[:HAS]->(ads:AdSet)
       OPTIONAL MATCH (ads)-[:HAS_SNAPSHOT]->(adss:AdSetSnapshot)
       OPTIONAL MATCH (ads)-[:CONTAINS]->(ad:Ad)
       OPTIONAL MATCH (ad)-[:HAS_SNAPSHOT]->(adsnap:AdSnapshot)
       OPTIONAL MATCH (c)-[:HAS_METRICS]->(m:DailyMetrics)
       DETACH DELETE c, cs, ads, adss, ad, adsnap, m
       RETURN campaignId`,
      { id }
    );

    if (result.records.length === 0) return notFound(res);
    return success(res, { campaignId: result.records[0].get('campaignId') });
  } catch (err) {
    console.error('Error:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

export default router;
