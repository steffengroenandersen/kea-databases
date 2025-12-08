import { Router } from "express";
import { getDb, client } from "../../db/mongo.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-ad", async (req, res) => {
  try {
    const db = getDb();
    const ads = await db.collection('metaAds').find({}).toArray();
    return success(res, ads);
  } catch (err) {
    console.error('Error fetching ads:', err);
    return error(res, "Database error", 500);
  }
});

router.get("/meta-ad/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const ad = await db.collection('metaAds').findOne({ _id: id });
    if (!ad) return notFound(res);
    return success(res, ad);
  } catch (err) {
    console.error('Error fetching ad:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-ad", async (req, res) => {
  try {
    const { _id, metaAdSetId, snapshots } = req.body;
    if (!_id) {
      return error(res, "Missing required field: _id", 400);
    }

    const db = getDb();
    const doc = {
      _id: Number(_id),
      metaAdSetId: metaAdSetId ? Number(metaAdSetId) : null,
      snapshots: snapshots || []
    };

    await db.collection('metaAds').insertOne(doc);
    return created(res, doc);
  } catch (err) {
    if (err.code === 11000) {
      return error(res, "Ad already exists", 409);
    }
    console.error('Error creating ad:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-ad/:id/snapshot", async (req, res) => {
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

    const result = await db.collection('metaAds').findOneAndUpdate(
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

router.delete("/meta-ad/:id", async (req, res) => {
  const session = client.startSession();
  try {
    const id = Number(req.params.id);
    const db = getDb();

    let deletedAd;

    await session.withTransaction(async () => {
      await db.collection('metaMetrics').deleteMany({ metaAdId: id }, { session });

      const result = await db.collection('metaAds').findOneAndDelete({ _id: id }, { session });

      if (!result) throw new Error('Ad not found');
      deletedAd = result;
    });

    return success(res, deletedAd);
  } catch (err) {
    if (err.message === 'Ad not found') return notFound(res);
    console.error('Error deleting ad:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.endSession();
  }
});

export default router;
