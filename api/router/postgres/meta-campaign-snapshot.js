import { Router } from "express";
import { pool } from "../../db/pg.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-campaign-snapshot/campaign/:campaignId", async (req, res) => {
  try {
    const campaignId = Number(req.params.campaignId);
    const { rows } = await pool.query("SELECT * FROM meta_campaigns_snapshot WHERE meta_campaign_id = $1 ORDER BY date DESC;", [campaignId]);
    return success(res, rows);
  } catch (err) {
    console.error('Error fetching snapshots:', err);
    return error(res, "Database error", 500);
  }
});

router.get("/meta-campaign-snapshot/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query("SELECT * FROM meta_campaigns_snapshot WHERE meta_campaign_snapshot_id = $1;", [id]);
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error fetching snapshot:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-campaign-snapshot", async (req, res) => {
  try {
    const { meta_campaign_id, date, meta_campaign_name, budget } = req.body;
    if (!meta_campaign_id || !date || !meta_campaign_name) {
      return error(res, "Missing required fields", 400);
    }

    const { rows } = await pool.query(
      "INSERT INTO meta_campaigns_snapshot (meta_campaign_id, date, meta_campaign_name, budget) VALUES ($1, $2, $3, $4) RETURNING *;",
      [meta_campaign_id, date, meta_campaign_name, budget || null]
    );
    return created(res, rows[0]);
  } catch (err) {
    if (err.code === '23503') return error(res, "Referenced campaign does not exist", 400);
    console.error('Error creating snapshot:', err);
    return error(res, "Database error", 500);
  }
});

router.delete("/meta-campaign-snapshot/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query("DELETE FROM meta_campaigns_snapshot WHERE meta_campaign_snapshot_id = $1 RETURNING *;", [id]);
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error deleting snapshot:', err);
    return error(res, "Database error", 500);
  }
});

export default router;
