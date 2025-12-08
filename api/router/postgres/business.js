import { Router } from "express";
import { pool } from "../../db/pg.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

// GET all businesses
router.get("/business", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT business_id, business_name FROM businesses;");
    return success(res, rows);
  } catch (err) {
    console.error('Error fetching businesses:', err);
    return error(res, "Database error", 500);
  }
});

// GET business by ID
router.get("/business/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      "SELECT business_id, business_name FROM businesses WHERE business_id = $1;",
      [id]
    );
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error fetching business:', err);
    return error(res, "Database error", 500);
  }
});

// POST create business
router.post("/business", async (req, res) => {
  try {
    const { business_name } = req.body;
    if (!business_name) {
      return error(res, "Missing required field: business_name", 400);
    }

    const { rows } = await pool.query(
      "INSERT INTO businesses (business_name) VALUES ($1) RETURNING business_id, business_name;",
      [business_name]
    );
    return created(res, rows[0]);
  } catch (err) {
    console.error('Error creating business:', err);
    return error(res, "Database error", 500);
  }
});

// DELETE business (cascades to user_businesses, but needs manual cascade for meta hierarchy)
router.delete("/business/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const id = Number(req.params.id);

    // Delete meta hierarchy bottom-up
    // Delete metrics first
    await client.query(`
      DELETE FROM meta_metrics
      WHERE meta_ad_account_id IN (
        SELECT meta_ad_account_id FROM meta_ad_accounts
        WHERE meta_business_manager_id IN (
          SELECT meta_business_manager_id FROM meta_business_managers
          WHERE business_id = $1
        )
      )
    `, [id]);

    // Delete ads and snapshots
    await client.query(`
      DELETE FROM meta_ads_snapshot
      WHERE meta_ad_id IN (
        SELECT meta_ad_id FROM meta_ads
        WHERE meta_adset_id IN (
          SELECT meta_adset_id FROM meta_adsets
          WHERE meta_campaign_id IN (
            SELECT meta_campaign_id FROM meta_campaigns
            WHERE meta_ad_account_id IN (
              SELECT meta_ad_account_id FROM meta_ad_accounts
              WHERE meta_business_manager_id IN (
                SELECT meta_business_manager_id FROM meta_business_managers
                WHERE business_id = $1
              )
            )
          )
        )
      )
    `, [id]);

    await client.query(`
      DELETE FROM meta_ads
      WHERE meta_adset_id IN (
        SELECT meta_adset_id FROM meta_adsets
        WHERE meta_campaign_id IN (
          SELECT meta_campaign_id FROM meta_campaigns
          WHERE meta_ad_account_id IN (
            SELECT meta_ad_account_id FROM meta_ad_accounts
            WHERE meta_business_manager_id IN (
              SELECT meta_business_manager_id FROM meta_business_managers
              WHERE business_id = $1
            )
          )
        )
      )
    `, [id]);

    // Delete adsets and snapshots
    await client.query(`
      DELETE FROM meta_adsets_snapshot
      WHERE meta_adset_id IN (
        SELECT meta_adset_id FROM meta_adsets
        WHERE meta_campaign_id IN (
          SELECT meta_campaign_id FROM meta_campaigns
          WHERE meta_ad_account_id IN (
            SELECT meta_ad_account_id FROM meta_ad_accounts
            WHERE meta_business_manager_id IN (
              SELECT meta_business_manager_id FROM meta_business_managers
              WHERE business_id = $1
            )
          )
        )
      )
    `, [id]);

    await client.query(`
      DELETE FROM meta_adsets
      WHERE meta_campaign_id IN (
        SELECT meta_campaign_id FROM meta_campaigns
        WHERE meta_ad_account_id IN (
          SELECT meta_ad_account_id FROM meta_ad_accounts
          WHERE meta_business_manager_id IN (
            SELECT meta_business_manager_id FROM meta_business_managers
            WHERE business_id = $1
          )
        )
      )
    `, [id]);

    // Delete campaigns and snapshots
    await client.query(`
      DELETE FROM meta_campaigns_snapshot
      WHERE meta_campaign_id IN (
        SELECT meta_campaign_id FROM meta_campaigns
        WHERE meta_ad_account_id IN (
          SELECT meta_ad_account_id FROM meta_ad_accounts
          WHERE meta_business_manager_id IN (
            SELECT meta_business_manager_id FROM meta_business_managers
            WHERE business_id = $1
          )
        )
      )
    `, [id]);

    await client.query(`
      DELETE FROM meta_campaigns
      WHERE meta_ad_account_id IN (
        SELECT meta_ad_account_id FROM meta_ad_accounts
        WHERE meta_business_manager_id IN (
          SELECT meta_business_manager_id FROM meta_business_managers
          WHERE business_id = $1
        )
      )
    `, [id]);

    // Delete ad accounts and snapshots
    await client.query(`
      DELETE FROM meta_ad_accounts_snapshot
      WHERE meta_ad_account_id IN (
        SELECT meta_ad_account_id FROM meta_ad_accounts
        WHERE meta_business_manager_id IN (
          SELECT meta_business_manager_id FROM meta_business_managers
          WHERE business_id = $1
        )
      )
    `, [id]);

    await client.query(`
      DELETE FROM meta_ad_accounts
      WHERE meta_business_manager_id IN (
        SELECT meta_business_manager_id FROM meta_business_managers
        WHERE business_id = $1
      )
    `, [id]);

    // Delete business managers and snapshots
    await client.query(`
      DELETE FROM meta_business_managers_snapshot
      WHERE meta_business_manager_id IN (
        SELECT meta_business_manager_id FROM meta_business_managers
        WHERE business_id = $1
      )
    `, [id]);

    await client.query(
      "DELETE FROM meta_business_managers WHERE business_id = $1",
      [id]
    );

    // Delete meta connectors
    await client.query("DELETE FROM meta_connectors WHERE business_id = $1", [id]);

    // Finally delete the business (user_businesses will cascade automatically)
    const { rows } = await client.query(
      "DELETE FROM businesses WHERE business_id = $1 RETURNING business_id, business_name;",
      [id]
    );

    await client.query('COMMIT');

    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting business:', err);
    return error(res, "Database error", 500);
  } finally {
    client.release();
  }
});

export default router;
