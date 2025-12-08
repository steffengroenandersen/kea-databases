import { Router } from "express";
import { getDb, client } from "../../db/mongo.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-business-manager", async (req, res) => {
  try {
    const db = getDb();
    const managers = await db.collection('metaBusinessManagers').find({}).toArray();
    return success(res, managers);
  } catch (err) {
    console.error('Error fetching business managers:', err);
    return error(res, "Database error", 500);
  }
});

router.get("/meta-business-manager/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const manager = await db.collection('metaBusinessManagers').findOne({ _id: id });
    if (!manager) return notFound(res);
    return success(res, manager);
  } catch (err) {
    console.error('Error fetching business manager:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-business-manager", async (req, res) => {
  try {
    const { _id, metaConnectorId, businessId, snapshots } = req.body;
    if (!_id) {
      return error(res, "Missing required field: _id", 400);
    }

    const db = getDb();
    const doc = {
      _id: Number(_id),
      metaConnectorId: metaConnectorId ? Number(metaConnectorId) : null,
      businessId: businessId ? Number(businessId) : null,
      snapshots: snapshots || []
    };

    await db.collection('metaBusinessManagers').insertOne(doc);
    return created(res, doc);
  } catch (err) {
    if (err.code === 11000) {
      return error(res, "Business manager already exists", 409);
    }
    console.error('Error creating business manager:', err);
    return error(res, "Database error", 500);
  }
});

// Add snapshot to business manager
router.post("/meta-business-manager/:id/snapshot", async (req, res) => {
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

    const result = await db.collection('metaBusinessManagers').findOneAndUpdate(
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

router.delete("/meta-business-manager/:id", async (req, res) => {
  const session = client.startSession();
  try {
    const id = Number(req.params.id);
    const db = getDb();

    let deletedManager;

    await session.withTransaction(async () => {
      // Get ad accounts
      const accounts = await db.collection('metaAdAccounts')
        .find({ metaBusinessManagerId: id }, { projection: { _id: 1 } })
        .toArray();

      if (accounts.length > 0) {
        const accountIds = accounts.map(a => a._id);

        const campaigns = await db.collection('metaCampaigns')
          .find({ metaAdAccountId: { $in: accountIds } }, { projection: { _id: 1 } })
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

        await db.collection('metaCampaigns').deleteMany({ metaAdAccountId: { $in: accountIds } }, { session });
        await db.collection('metaMetrics').deleteMany({ metaAdAccountId: { $in: accountIds } }, { session });
      }

      await db.collection('metaAdAccounts').deleteMany({ metaBusinessManagerId: id }, { session });

      const result = await db.collection('metaBusinessManagers').findOneAndDelete({ _id: id }, { session });

      if (!result) throw new Error('Business manager not found');
      deletedManager = result;
    });

    return success(res, deletedManager);
  } catch (err) {
    if (err.message === 'Business manager not found') return notFound(res);
    console.error('Error deleting business manager:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.endSession();
  }
});

export default router;
