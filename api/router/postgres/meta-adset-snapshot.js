import { Router } from "express";
import { pool } from "../../db/pg.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-adset-snapshot/adset/:adsetId", async (req, res) => {
  try {
    const adsetId = Number(req.params.adsetId);
    const { rows } = await pool.query("SELECT * FROM meta_adsets_snapshot WHERE meta_adset_id = $1 ORDER BY date DESC;", [adsetId]);
    return success(res, rows);
  } catch (err) {
    console.error('Error fetching snapshots:', err);
    return error(res, "Database error", 500);
  }
});

router.get("/meta-adset-snapshot/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query("SELECT * FROM meta_adsets_snapshot WHERE meta_adset_snapshot_id = $1;", [id]);
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error fetching snapshot:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-adset-snapshot", async (req, res) => {
  try {
    const { meta_adset_id, date, meta_adset_name } = req.body;
    if (!meta_adset_id || !date || !meta_adset_name) {
      return error(res, "Missing required fields", 400);
    }

    const { rows } = await pool.query(
      "INSERT INTO meta_adsets_snapshot (meta_adset_id, date, meta_adset_name) VALUES ($1, $2, $3) RETURNING *;",
      [meta_adset_id, date, meta_adset_name]
    );
    return created(res, rows[0]);
  } catch (err) {
    if (err.code === '23503') return error(res, "Referenced adset does not exist", 400);
    console.error('Error creating snapshot:', err);
    return error(res, "Database error", 500);
  }
});

router.delete("/meta-adset-snapshot/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query("DELETE FROM meta_adsets_snapshot WHERE meta_adset_snapshot_id = $1 RETURNING *;", [id]);
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error deleting snapshot:', err);
    return error(res, "Database error", 500);
  }
});

export default router;
