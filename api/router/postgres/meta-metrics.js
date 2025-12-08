import { Router } from "express";
import { pool } from "../../db/pg.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-metrics", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM meta_metrics;");
    return success(res, rows);
  } catch (err) {
    console.error('Error fetching metrics:', err);
    return error(res, "Database error", 500);
  }
});

router.get("/meta-metrics/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query("SELECT * FROM meta_metrics WHERE meta_metric_id = $1;", [id]);
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error fetching metric:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-metrics", async (req, res) => {
  try {
    const { date, meta_ad_account_id, meta_campaign_id, meta_adset_id, meta_ad_id, spend } = req.body;
    if (!date) {
      return error(res, "Missing required field: date", 400);
    }

    const { rows } = await pool.query(
      "INSERT INTO meta_metrics (date, meta_ad_account_id, meta_campaign_id, meta_adset_id, meta_ad_id, spend) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;",
      [date, meta_ad_account_id || null, meta_campaign_id || null, meta_adset_id || null, meta_ad_id || null, spend || null]
    );
    return created(res, rows[0]);
  } catch (err) {
    if (err.code === '23503') return error(res, "Referenced entity does not exist", 400);
    console.error('Error creating metric:', err);
    return error(res, "Database error", 500);
  }
});

router.delete("/meta-metrics/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query("DELETE FROM meta_metrics WHERE meta_metric_id = $1 RETURNING *;", [id]);
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error deleting metric:', err);
    return error(res, "Database error", 500);
  }
});

export default router;
