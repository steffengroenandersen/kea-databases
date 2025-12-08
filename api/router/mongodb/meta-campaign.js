import { Router } from "express";
import { getDb, client } from "../../db/mongo.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-campaign", async (req, res) => {
  try {
    const db = getDb();
    const campaigns = await db.collection('metaCampaigns').find({}).toArray();
    return success(res, campaigns);
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    return error(res, "Database error", 500);
  }
});

router.get("/meta-campaign/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const campaign = await db.collection('metaCampaigns').findOne({ _id: id });
    if (!campaign) return notFound(res);
    return success(res, campaign);
  } catch (err) {
    console.error('Error fetching campaign:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-campaign", async (req, res) => {
  try {
    const { _id, metaAdAccountId, snapshots } = req.body;
    if (!_id) {
      return error(res, "Missing required field: _id", 400);
    }

    const db = getDb();
    const doc = {
      _id: Number(_id),
      metaAdAccountId: metaAdAccountId ? Number(metaAdAccountId) : null,
      snapshots: snapshots || []
    };

    await db.collection('metaCampaigns').insertOne(doc);
    return created(res, doc);
  } catch (err) {
    if (err.code === 11000) {
      return error(res, "Campaign already exists", 409);
    }
    console.error('Error creating campaign:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-campaign/:id/snapshot", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { date, name, budget } = req.body;
    if (!date || !name) {
      return error(res, "Missing required fields: date, name", 400);
    }

    const db = getDb();
    const snapshot = {
      date: new Date(date),
      name,
      budget: budget || null
    };

    const result = await db.collection('metaCampaigns').findOneAndUpdate(
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

router.delete("/meta-campaign/:id", async (req, res) => {
  const session = client.startSession();
  try {
    const id = Number(req.params.id);
    const db = getDb();

    let deletedCampaign;

    await session.withTransaction(async () => {
      const adsets = await db.collection('metaAdSets')
        .find({ metaCampaignId: id }, { projection: { _id: 1 } })
        .toArray();

      if (adsets.length > 0) {
        const adsetIds = adsets.map(a => a._id);
        await db.collection('metaAds').deleteMany({ metaAdSetId: { $in: adsetIds } }, { session });
      }

      await db.collection('metaAdSets').deleteMany({ metaCampaignId: id }, { session });
      await db.collection('metaMetrics').deleteMany({ metaCampaignId: id }, { session });

      const result = await db.collection('metaCampaigns').findOneAndDelete({ _id: id }, { session });

      if (!result) throw new Error('Campaign not found');
      deletedCampaign = result;
    });

    return success(res, deletedCampaign);
  } catch (err) {
    if (err.message === 'Campaign not found') return notFound(res);
    console.error('Error deleting campaign:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.endSession();
  }
});

export default router;
