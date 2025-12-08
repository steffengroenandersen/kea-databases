import { Router } from "express";
import { getDb, client } from "../../db/mongo.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/business", async (req, res) => {
  try {
    const db = getDb();
    const businesses = await db.collection('businesses').find({}).toArray();
    return success(res, businesses);
  } catch (err) {
    console.error('Error fetching businesses:', err);
    return error(res, "Database error", 500);
  }
});

router.get("/business/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const business = await db.collection('businesses').findOne({ _id: id });
    if (!business) return notFound(res);
    return success(res, business);
  } catch (err) {
    console.error('Error fetching business:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/business", async (req, res) => {
  try {
    const { _id, businessName } = req.body;
    if (!_id || !businessName) {
      return error(res, "Missing required fields: _id, businessName", 400);
    }

    const db = getDb();
    const doc = {
      _id: Number(_id),
      businessName
    };

    await db.collection('businesses').insertOne(doc);
    return created(res, doc);
  } catch (err) {
    if (err.code === 11000) {
      return error(res, "Business already exists", 409);
    }
    console.error('Error creating business:', err);
    return error(res, "Database error", 500);
  }
});

router.delete("/business/:id", async (req, res) => {
  const session = client.startSession();
  try {
    const id = Number(req.params.id);
    const db = getDb();

    let deletedBusiness;

    await session.withTransaction(async () => {
      // Get all connectors for this business
      const connectors = await db.collection('metaConnectors')
        .find({ businessId: id }, { projection: { _id: 1 } })
        .toArray();

      if (connectors.length > 0) {
        const connectorIds = connectors.map(c => c._id);

        // Get all business managers for these connectors
        const managers = await db.collection('metaBusinessManagers')
          .find({ $or: [{ businessId: id }, { metaConnectorId: { $in: connectorIds } }] }, { projection: { _id: 1 } })
          .toArray();

        if (managers.length > 0) {
          const managerIds = managers.map(m => m._id);

          // Get all ad accounts for these managers
          const accounts = await db.collection('metaAdAccounts')
            .find({ metaBusinessManagerId: { $in: managerIds } }, { projection: { _id: 1 } })
            .toArray();

          if (accounts.length > 0) {
            const accountIds = accounts.map(a => a._id);

            // Get all campaigns for these accounts
            const campaigns = await db.collection('metaCampaigns')
              .find({ metaAdAccountId: { $in: accountIds } }, { projection: { _id: 1 } })
              .toArray();

            if (campaigns.length > 0) {
              const campaignIds = campaigns.map(c => c._id);

              // Get all adsets for these campaigns
              const adsets = await db.collection('metaAdSets')
                .find({ metaCampaignId: { $in: campaignIds } }, { projection: { _id: 1 } })
                .toArray();

              if (adsets.length > 0) {
                const adsetIds = adsets.map(a => a._id);

                // Delete ads
                await db.collection('metaAds').deleteMany({ metaAdSetId: { $in: adsetIds } }, { session });
              }

              // Delete adsets
              await db.collection('metaAdSets').deleteMany({ metaCampaignId: { $in: campaignIds } }, { session });
            }

            // Delete campaigns
            await db.collection('metaCampaigns').deleteMany({ metaAdAccountId: { $in: accountIds } }, { session });

            // Delete metrics
            await db.collection('metaMetrics').deleteMany({ metaAdAccountId: { $in: accountIds } }, { session });
          }

          // Delete ad accounts
          await db.collection('metaAdAccounts').deleteMany({ metaBusinessManagerId: { $in: managerIds } }, { session });

          // Delete business managers
          await db.collection('metaBusinessManagers').deleteMany({ metaBusinessManagerId: { $in: managerIds } }, { session });
        }

        // Delete connectors
        await db.collection('metaConnectors').deleteMany({ $or: [{ businessId: id }, { _id: { $in: connectorIds } }] }, { session });
      }

      // Delete memberships
      await db.collection('memberships').deleteMany({ businessId: id }, { session });

      // Delete business
      const result = await db.collection('businesses').findOneAndDelete({ _id: id }, { session });

      if (!result) throw new Error('Business not found');
      deletedBusiness = result;
    });

    return success(res, deletedBusiness);
  } catch (err) {
    if (err.message === 'Business not found') return notFound(res);
    console.error('Error deleting business:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.endSession();
  }
});

export default router;
