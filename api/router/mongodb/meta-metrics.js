import { Router } from "express";
import { getDb } from "../../db/mongo.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-metrics", async (req, res) => {
  try {
    const db = getDb();
    const metrics = await db.collection('metaMetrics').find({}).toArray();
    return success(res, metrics);
  } catch (err) {
    console.error('Error fetching metrics:', err);
    return error(res, "Database error", 500);
  }
});

router.get("/meta-metrics/:id", async (req, res) => {
  try {
    const db = getDb();
    const metric = await db.collection('metaMetrics').findOne({ _id: req.params.id });
    if (!metric) return notFound(res);
    return success(res, metric);
  } catch (err) {
    console.error('Error fetching metric:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-metrics", async (req, res) => {
  try {
    const { date, metaAdAccountId, metaCampaignId, metaAdSetId, metaAdId, spend } = req.body;
    if (!date) {
      return error(res, "Missing required field: date", 400);
    }

    const db = getDb();
    const doc = {
      date: new Date(date),
      metaAdAccountId: metaAdAccountId ? Number(metaAdAccountId) : null,
      metaCampaignId: metaCampaignId ? Number(metaCampaignId) : null,
      metaAdSetId: metaAdSetId ? Number(metaAdSetId) : null,
      metaAdId: metaAdId ? Number(metaAdId) : null,
      spend: spend || null
    };

    const result = await db.collection('metaMetrics').insertOne(doc);
    return created(res, { _id: result.insertedId, ...doc });
  } catch (err) {
    console.error('Error creating metric:', err);
    return error(res, "Database error", 500);
  }
});

router.delete("/meta-metrics/:id", async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('metaMetrics').findOneAndDelete({ _id: req.params.id });

    if (!result) return notFound(res);
    return success(res, result);
  } catch (err) {
    console.error('Error deleting metric:', err);
    return error(res, "Database error", 500);
  }
});

export default router;
