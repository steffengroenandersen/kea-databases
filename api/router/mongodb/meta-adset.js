import { Router } from "express";
import { getDb, client } from "../../db/mongo.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-adset", async (req, res) => {
  try {
    const db = getDb();
    const adsets = await db.collection('metaAdSets').find({}).toArray();
    return success(res, adsets);
  } catch (err) {
    console.error('Error fetching adsets:', err);
    return error(res, "Database error", 500);
  }
});

router.get("/meta-adset/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const adset = await db.collection('metaAdSets').findOne({ _id: id });
    if (!adset) return notFound(res);
    return success(res, adset);
  } catch (err) {
    console.error('Error fetching adset:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-adset", async (req, res) => {
  try {
    const { _id, metaCampaignId, snapshots } = req.body;
    if (!_id) {
      return error(res, "Missing required field: _id", 400);
    }

    const db = getDb();
    const doc = {
      _id: Number(_id),
      metaCampaignId: metaCampaignId ? Number(metaCampaignId) : null,
      snapshots: snapshots || []
    };

    await db.collection('metaAdSets').insertOne(doc);
    return created(res, doc);
  } catch (err) {
    if (err.code === 11000) {
      return error(res, "AdSet already exists", 409);
    }
    console.error('Error creating adset:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-adset/:id/snapshot", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { date, name } = req.body;
    if (!date || !name) {
      return error(res, "Missing required fields: date, name", 400);
    }

    const db = getDb();
    const snapshot = {
      date: new Date(date),
      name
    };

    const result = await db.collection('metaAdSets').findOneAndUpdate(
      { _id: id },
      { $push: { snapshots: snapshot } },
      { returnDocument: 'after' }
    );

    if (!result) return notFound(res);
    return success(res, result);
  } catch (err) {
    console.error('Error adding snapshot:', err);
    return error(res, "Database error", 500);
  }
});

router.delete("/meta-adset/:id", async (req, res) => {
  const session = client.startSession();
  try {
    const id = Number(req.params.id);
    const db = getDb();

    let deletedAdset;

    await session.withTransaction(async () => {
      await db.collection('metaAds').deleteMany({ metaAdSetId: id }, { session });
      await db.collection('metaMetrics').deleteMany({ metaAdSetId: id }, { session });

      const result = await db.collection('metaAdSets').findOneAndDelete({ _id: id }, { session });

      if (!result) throw new Error('AdSet not found');
      deletedAdset = result;
    });

    return success(res, deletedAdset);
  } catch (err) {
    if (err.message === 'AdSet not found') return notFound(res);
    console.error('Error deleting adset:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.endSession();
  }
});

export default router;
