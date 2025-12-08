import { Router } from "express";
import { pool } from "../../db/pg.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-adset", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT meta_adset_id, meta_campaign_id FROM meta_adsets;");
    return success(res, rows);
  } catch (err) {
    console.error('Error fetching adsets:', err);
    return error(res, "Database error", 500);
  }
});

router.get("/meta-adset/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query("SELECT meta_adset_id, meta_campaign_id FROM meta_adsets WHERE meta_adset_id = $1;", [id]);
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error fetching adset:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-adset", async (req, res) => {
  try {
    const { meta_campaign_id } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO meta_adsets (meta_campaign_id) VALUES ($1) RETURNING meta_adset_id, meta_campaign_id;",
      [meta_campaign_id || null]
    );
    return created(res, rows[0]);
  } catch (err) {
    if (err.code === '23503') return error(res, "Referenced campaign does not exist", 400);
    console.error('Error creating adset:', err);
    return error(res, "Database error", 500);
  }
});

router.delete("/meta-adset/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const id = Number(req.params.id);

    await client.query("DELETE FROM meta_metrics WHERE meta_adset_id = $1", [id]);
    await client.query("DELETE FROM meta_ads_snapshot WHERE meta_ad_id IN (SELECT meta_ad_id FROM meta_ads WHERE meta_adset_id = $1)", [id]);
    await client.query("DELETE FROM meta_ads WHERE meta_adset_id = $1", [id]);
    await client.query("DELETE FROM meta_adsets_snapshot WHERE meta_adset_id = $1", [id]);

    const { rows } = await client.query("DELETE FROM meta_adsets WHERE meta_adset_id = $1 RETURNING meta_adset_id, meta_campaign_id;", [id]);
    await client.query('COMMIT');

    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting adset:', err);
    return error(res, "Database error", 500);
  } finally {
    client.release();
  }
});

export default router;
