import { Router } from "express";
import { pool } from "../../db/pg.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-ad-account", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT meta_ad_account_id, meta_business_manager_id FROM meta_ad_accounts;");
    return success(res, rows);
  } catch (err) {
    console.error('Error fetching meta ad accounts:', err);
    return error(res, "Database error", 500);
  }
});

router.get("/meta-ad-account/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query("SELECT meta_ad_account_id, meta_business_manager_id FROM meta_ad_accounts WHERE meta_ad_account_id = $1;", [id]);
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error fetching meta ad account:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-ad-account", async (req, res) => {
  try {
    const { meta_business_manager_id } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO meta_ad_accounts (meta_business_manager_id) VALUES ($1) RETURNING meta_ad_account_id, meta_business_manager_id;",
      [meta_business_manager_id || null]
    );
    return created(res, rows[0]);
  } catch (err) {
    if (err.code === '23503') return error(res, "Referenced business manager does not exist", 400);
    console.error('Error creating meta ad account:', err);
    return error(res, "Database error", 500);
  }
});

router.delete("/meta-ad-account/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const id = Number(req.params.id);

    await client.query("DELETE FROM meta_metrics WHERE meta_ad_account_id = $1", [id]);
    await client.query(`DELETE FROM meta_ads_snapshot WHERE meta_ad_id IN (SELECT meta_ad_id FROM meta_ads WHERE meta_adset_id IN (SELECT meta_adset_id FROM meta_adsets WHERE meta_campaign_id IN (SELECT meta_campaign_id FROM meta_campaigns WHERE meta_ad_account_id = $1)))`, [id]);
    await client.query(`DELETE FROM meta_ads WHERE meta_adset_id IN (SELECT meta_adset_id FROM meta_adsets WHERE meta_campaign_id IN (SELECT meta_campaign_id FROM meta_campaigns WHERE meta_ad_account_id = $1))`, [id]);
    await client.query(`DELETE FROM meta_adsets_snapshot WHERE meta_adset_id IN (SELECT meta_adset_id FROM meta_adsets WHERE meta_campaign_id IN (SELECT meta_campaign_id FROM meta_campaigns WHERE meta_ad_account_id = $1))`, [id]);
    await client.query(`DELETE FROM meta_adsets WHERE meta_campaign_id IN (SELECT meta_campaign_id FROM meta_campaigns WHERE meta_ad_account_id = $1)`, [id]);
    await client.query("DELETE FROM meta_campaigns_snapshot WHERE meta_campaign_id IN (SELECT meta_campaign_id FROM meta_campaigns WHERE meta_ad_account_id = $1)", [id]);
    await client.query("DELETE FROM meta_campaigns WHERE meta_ad_account_id = $1", [id]);
    await client.query("DELETE FROM meta_ad_accounts_snapshot WHERE meta_ad_account_id = $1", [id]);

    const { rows } = await client.query("DELETE FROM meta_ad_accounts WHERE meta_ad_account_id = $1 RETURNING meta_ad_account_id, meta_business_manager_id;", [id]);
    await client.query('COMMIT');

    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting meta ad account:', err);
    return error(res, "Database error", 500);
  } finally {
    client.release();
  }
});

export default router;
