import { Router } from "express";
import { pool } from "../../db/pg.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/meta-ad-account-snapshot/account/:accountId", async (req, res) => {
  try {
    const accountId = Number(req.params.accountId);
    const { rows } = await pool.query("SELECT * FROM meta_ad_accounts_snapshot WHERE meta_ad_account_id = $1 ORDER BY date DESC;", [accountId]);
    return success(res, rows);
  } catch (err) {
    console.error('Error fetching snapshots:', err);
    return error(res, "Database error", 500);
  }
});

router.get("/meta-ad-account-snapshot/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query("SELECT * FROM meta_ad_accounts_snapshot WHERE meta_ad_account_snapshot_id = $1;", [id]);
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error fetching snapshot:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/meta-ad-account-snapshot", async (req, res) => {
  try {
    const { meta_ad_account_id, date, meta_ad_account_name, currency } = req.body;
    if (!meta_ad_account_id || !date || !meta_ad_account_name || !currency) {
      return error(res, "Missing required fields", 400);
    }

    const { rows } = await pool.query(
      "INSERT INTO meta_ad_accounts_snapshot (meta_ad_account_id, date, meta_ad_account_name, currency) VALUES ($1, $2, $3, $4) RETURNING *;",
      [meta_ad_account_id, date, meta_ad_account_name, currency]
    );
    return created(res, rows[0]);
  } catch (err) {
    if (err.code === '23503') return error(res, "Referenced ad account does not exist", 400);
    console.error('Error creating snapshot:', err);
    return error(res, "Database error", 500);
  }
});

router.delete("/meta-ad-account-snapshot/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query("DELETE FROM meta_ad_accounts_snapshot WHERE meta_ad_account_snapshot_id = $1 RETURNING *;", [id]);
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error deleting snapshot:', err);
    return error(res, "Database error", 500);
  }
});

export default router;
