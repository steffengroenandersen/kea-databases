import { Router } from "express";
import { pool } from "../../db/pg.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

// GET all meta connectors
router.get("/meta-connector", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT meta_connector_id, access_token, user_id, business_id FROM meta_connectors;"
    );
    return success(res, rows);
  } catch (err) {
    console.error('Error fetching meta connectors:', err);
    return error(res, "Database error", 500);
  }
});

// GET meta connector by ID
router.get("/meta-connector/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      "SELECT meta_connector_id, access_token, user_id, business_id FROM meta_connectors WHERE meta_connector_id = $1;",
      [id]
    );
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error fetching meta connector:', err);
    return error(res, "Database error", 500);
  }
});

// POST create meta connector
router.post("/meta-connector", async (req, res) => {
  try {
    const { access_token, user_id, business_id } = req.body;
    if (!access_token) {
      return error(res, "Missing required field: access_token", 400);
    }

    const { rows } = await pool.query(
      "INSERT INTO meta_connectors (access_token, user_id, business_id) VALUES ($1, $2, $3) RETURNING meta_connector_id, access_token, user_id, business_id;",
      [access_token, user_id || null, business_id || null]
    );
    return created(res, rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return error(res, "Referenced user or business does not exist", 400);
    }
    console.error('Error creating meta connector:', err);
    return error(res, "Database error", 500);
  }
});

// DELETE meta connector (manual cascade to meta hierarchy)
router.delete("/meta-connector/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const id = Number(req.params.id);

    // Delete meta hierarchy associated with this connector
    // First get all business managers for this connector
    const { rows: managers } = await client.query(
      "SELECT meta_business_manager_id FROM meta_business_managers WHERE meta_connector_id = $1",
      [id]
    );

    if (managers.length > 0) {
      const managerIds = managers.map(m => m.meta_business_manager_id);

      // Delete metrics
      await client.query(`
        DELETE FROM meta_metrics
        WHERE meta_ad_account_id IN (
          SELECT meta_ad_account_id FROM meta_ad_accounts
          WHERE meta_business_manager_id = ANY($1)
        )
      `, [managerIds]);

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
                WHERE meta_business_manager_id = ANY($1)
              )
            )
          )
        )
      `, [managerIds]);

      await client.query(`
        DELETE FROM meta_ads
        WHERE meta_adset_id IN (
          SELECT meta_adset_id FROM meta_adsets
          WHERE meta_campaign_id IN (
            SELECT meta_campaign_id FROM meta_campaigns
            WHERE meta_ad_account_id IN (
              SELECT meta_ad_account_id FROM meta_ad_accounts
              WHERE meta_business_manager_id = ANY($1)
            )
          )
        )
      `, [managerIds]);

      // Delete adsets and snapshots
      await client.query(`
        DELETE FROM meta_adsets_snapshot
        WHERE meta_adset_id IN (
          SELECT meta_adset_id FROM meta_adsets
          WHERE meta_campaign_id IN (
            SELECT meta_campaign_id FROM meta_campaigns
            WHERE meta_ad_account_id IN (
              SELECT meta_ad_account_id FROM meta_ad_accounts
              WHERE meta_business_manager_id = ANY($1)
            )
          )
        )
      `, [managerIds]);

      await client.query(`
        DELETE FROM meta_adsets
        WHERE meta_campaign_id IN (
          SELECT meta_campaign_id FROM meta_campaigns
          WHERE meta_ad_account_id IN (
            SELECT meta_ad_account_id FROM meta_ad_accounts
            WHERE meta_business_manager_id = ANY($1)
          )
        )
      `, [managerIds]);

      // Delete campaigns and snapshots
      await client.query(`
        DELETE FROM meta_campaigns_snapshot
        WHERE meta_campaign_id IN (
          SELECT meta_campaign_id FROM meta_campaigns
          WHERE meta_ad_account_id IN (
            SELECT meta_ad_account_id FROM meta_ad_accounts
            WHERE meta_business_manager_id = ANY($1)
          )
        )
      `, [managerIds]);

      await client.query(`
        DELETE FROM meta_campaigns
        WHERE meta_ad_account_id IN (
          SELECT meta_ad_account_id FROM meta_ad_accounts
          WHERE meta_business_manager_id = ANY($1)
        )
      `, [managerIds]);

      // Delete ad accounts and snapshots
      await client.query(`
        DELETE FROM meta_ad_accounts_snapshot
        WHERE meta_ad_account_id IN (
          SELECT meta_ad_account_id FROM meta_ad_accounts
          WHERE meta_business_manager_id = ANY($1)
        )
      `, [managerIds]);

      await client.query(
        "DELETE FROM meta_ad_accounts WHERE meta_business_manager_id = ANY($1)",
        [managerIds]
      );

      // Delete business managers and snapshots
      await client.query(
        "DELETE FROM meta_business_managers_snapshot WHERE meta_business_manager_id = ANY($1)",
        [managerIds]
      );

      await client.query(
        "DELETE FROM meta_business_managers WHERE meta_business_manager_id = ANY($1)",
        [managerIds]
      );
    }

    // Finally delete the connector
    const { rows } = await client.query(
      "DELETE FROM meta_connectors WHERE meta_connector_id = $1 RETURNING meta_connector_id, access_token, user_id, business_id;",
      [id]
    );

    await client.query('COMMIT');

    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting meta connector:', err);
    return error(res, "Database error", 500);
  } finally {
    client.release();
  }
});

export default router;
