import { Router } from "express";
import { getDb, client } from "../../db/mongo.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-connector", async (req, res) => {
  try {
    const db = getDb();
    const connectors = await db.collection('metaConnectors').find({}).toArray();
    return success(res, connectors);
  } catch (err) {
    console.error('Error fetching meta connectors:', err);
    return error(res, "Database error", 500);
  }
});

router.get("/meta-connector/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const connector = await db.collection('metaConnectors').findOne({ _id: id });
    if (!connector) return notFound(res);
    return success(res, connector);
  } catch (err) {
    console.error('Error fetching meta connector:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-connector", async (req, res) => {
  try {
    const { _id, accessToken, userId, businessId } = req.body;
    if (!_id || !accessToken) {
      return error(res, "Missing required fields: _id, accessToken", 400);
    }

    const db = getDb();
    const doc = {
      _id: Number(_id),
      accessToken,
      userId: userId ? Number(userId) : null,
      businessId: businessId ? Number(businessId) : null
    };

    await db.collection('metaConnectors').insertOne(doc);
    return created(res, doc);
  } catch (err) {
    if (err.code === 11000) {
      return error(res, "Connector already exists", 409);
    }
    console.error('Error creating meta connector:', err);
    return error(res, "Database error", 500);
  }
});

router.delete("/meta-connector/:id", async (req, res) => {
  const session = client.startSession();
  try {
    const id = Number(req.params.id);
    const db = getDb();

    let deletedConnector;

    await session.withTransaction(async () => {
      // Get all business managers for this connector
      const managers = await db.collection('metaBusinessManagers')
        .find({ metaConnectorId: id }, { projection: { _id: 1 } })
        .toArray();

      if (managers.length > 0) {
        const managerIds = managers.map(m => m._id);

        // Get all ad accounts
        const accounts = await db.collection('metaAdAccounts')
          .find({ metaBusinessManagerId: { $in: managerIds } }, { projection: { _id: 1 } })
          .toArray();

        if (accounts.length > 0) {
          const accountIds = accounts.map(a => a._id);

          // Get campaigns
          const campaigns = await db.collection('metaCampaigns')
            .find({ metaAdAccountId: { $in: accountIds } }, { projection: { _id: 1 } })
            .toArray();

          if (campaigns.length > 0) {
            const campaignIds = campaigns.map(c => c._id);

            // Get adsets
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

        await db.collection('metaAdAccounts').deleteMany({ metaBusinessManagerId: { $in: managerIds } }, { session });
        await db.collection('metaBusinessManagers').deleteMany({ metaConnectorId: id }, { session });
      }

      const result = await db.collection('metaConnectors').findOneAndDelete({ _id: id }, { session });

      if (!result) throw new Error('Connector not found');
      deletedConnector = result;
    });

    return success(res, deletedConnector);
  } catch (err) {
    if (err.message === 'Connector not found') return notFound(res);
    console.error('Error deleting meta connector:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.endSession();
  }
});

export default router;
