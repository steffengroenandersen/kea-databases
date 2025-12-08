import { Router } from "express";
import { getDb, client } from "../../db/mongo.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-ad-account", async (req, res) => {
  try {
    const db = getDb();
    const accounts = await db.collection('metaAdAccounts').find({}).toArray();
    return success(res, accounts);
  } catch (err) {
    console.error('Error fetching ad accounts:', err);
    return error(res, "Database error", 500);
  }
});

router.get("/meta-ad-account/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const account = await db.collection('metaAdAccounts').findOne({ _id: id });
    if (!account) return notFound(res);
    return success(res, account);
  } catch (err) {
    console.error('Error fetching ad account:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-ad-account", async (req, res) => {
  try {
    const { _id, metaBusinessManagerId, snapshots } = req.body;
    if (!_id) {
      return error(res, "Missing required field: _id", 400);
    }

    const db = getDb();
    const doc = {
      _id: Number(_id),
      metaBusinessManagerId: metaBusinessManagerId ? Number(metaBusinessManagerId) : null,
      snapshots: snapshots || []
    };

    await db.collection('metaAdAccounts').insertOne(doc);
    return created(res, doc);
  } catch (err) {
    if (err.code === 11000) {
      return error(res, "Ad account already exists", 409);
    }
    console.error('Error creating ad account:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-ad-account/:id/snapshot", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { date, name, currency } = req.body;
    if (!date || !name || !currency) {
      return error(res, "Missing required fields: date, name, currency", 400);
    }

    const db = getDb();
    const snapshot = {
      date: new Date(date),
      name,
      currency
    };

    const result = await db.collection('metaAdAccounts').findOneAndUpdate(
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

router.delete("/meta-ad-account/:id", async (req, res) => {
  const session = client.startSession();
  try {
    const id = Number(req.params.id);
    const db = getDb();

    let deletedAccount;

    await session.withTransaction(async () => {
      const campaigns = await db.collection('metaCampaigns')
        .find({ metaAdAccountId: id }, { projection: { _id: 1 } })
        .toArray();

      if (campaigns.length > 0) {
        const campaignIds = campaigns.map(c => c._id);

        const adsets = await db.collection('metaAdSets')
          .find({ metaCampaignId: { $in: campaignIds } }, { projection: { _id: 1 } })
          .toArray();

        if (adsets.length > 0) {
          const adsetIds = adsets.map(a => a._id);
          await db.collection('metaAds').deleteMany({ metaAdSetId: { $in: adsetIds } }, { session });
        }

        await db.collection('metaAdSets').deleteMany({ metaCampaignId: { $in: campaignIds } }, { session });
      }

      await db.collection('metaCampaigns').deleteMany({ metaAdAccountId: id }, { session });
      await db.collection('metaMetrics').deleteMany({ metaAdAccountId: id }, { session });

      const result = await db.collection('metaAdAccounts').findOneAndDelete({ _id: id }, { session });

      if (!result) throw new Error('Ad account not found');
      deletedAccount = result;
    });

    return success(res, deletedAccount);
  } catch (err) {
    if (err.message === 'Ad account not found') return notFound(res);
    console.error('Error deleting ad account:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.endSession();
  }
});

export default router;
