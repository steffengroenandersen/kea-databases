import { Router } from "express";
import { pool } from "../../db/pg.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

// GET all meta business managers
router.get("/meta-business-manager", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT meta_business_manager_id, meta_connector_id, business_id FROM meta_business_managers;"
    );
    return success(res, rows);
  } catch (err) {
    console.error('Error fetching meta business managers:', err);
    return error(res, "Database error", 500);
  }
});

// GET meta business manager by ID
router.get("/meta-business-manager/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      "SELECT meta_business_manager_id, meta_connector_id, business_id FROM meta_business_managers WHERE meta_business_manager_id = $1;",
      [id]
    );
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error fetching meta business manager:', err);
    return error(res, "Database error", 500);
  }
});

// POST create meta business manager
router.post("/meta-business-manager", async (req, res) => {
  try {
    const { meta_connector_id, business_id } = req.body;

    const { rows } = await pool.query(
      "INSERT INTO meta_business_managers (meta_connector_id, business_id) VALUES ($1, $2) RETURNING meta_business_manager_id, meta_connector_id, business_id;",
      [meta_connector_id || null, business_id || null]
    );
    return created(res, rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return error(res, "Referenced connector or business does not exist", 400);
    }
    console.error('Error creating meta business manager:', err);
    return error(res, "Database error", 500);
  }
});

// DELETE meta business manager (cascade to ad accounts, snapshots, etc.)
router.delete("/meta-business-manager/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const id = Number(req.params.id);

    // Delete metrics
    await client.query(`
      DELETE FROM meta_metrics
      WHERE meta_ad_account_id IN (
        SELECT meta_ad_account_id FROM meta_ad_accounts
        WHERE meta_business_manager_id = $1
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
              WHERE meta_business_manager_id = $1
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
            WHERE meta_business_manager_id = $1
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
            WHERE meta_business_manager_id = $1
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
          WHERE meta_business_manager_id = $1
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
          WHERE meta_business_manager_id = $1
        )
      )
    `, [id]);

    await client.query(`
      DELETE FROM meta_campaigns
      WHERE meta_ad_account_id IN (
        SELECT meta_ad_account_id FROM meta_ad_accounts
        WHERE meta_business_manager_id = $1
      )
    `, [id]);

    // Delete ad accounts and snapshots
    await client.query(`
      DELETE FROM meta_ad_accounts_snapshot
      WHERE meta_ad_account_id IN (
        SELECT meta_ad_account_id FROM meta_ad_accounts
        WHERE meta_business_manager_id = $1
      )
    `, [id]);

    await client.query(
      "DELETE FROM meta_ad_accounts WHERE meta_business_manager_id = $1",
      [id]
    );

    // Delete business manager snapshots
    await client.query(
      "DELETE FROM meta_business_managers_snapshot WHERE meta_business_manager_id = $1",
      [id]
    );

    // Finally delete the business manager
    const { rows } = await client.query(
      "DELETE FROM meta_business_managers WHERE meta_business_manager_id = $1 RETURNING meta_business_manager_id, meta_connector_id, business_id;",
      [id]
    );

    await client.query('COMMIT');

    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting meta business manager:', err);
    return error(res, "Database error", 500);
  } finally {
    client.release();
  }
});

export default router;
