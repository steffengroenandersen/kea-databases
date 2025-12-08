import { Router } from "express";
import { pool } from "../../db/pg.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

// GET all snapshots for a business manager
router.get("/meta-business-manager-snapshot/manager/:managerId", async (req, res) => {
  try {
    const managerId = Number(req.params.managerId);
    const { rows } = await pool.query(
      "SELECT meta_business_manager_snapshot_id, meta_business_manager_id, date, meta_business_manager_name FROM meta_business_managers_snapshot WHERE meta_business_manager_id = $1 ORDER BY date DESC;",
      [managerId]
    );
    return success(res, rows);
  } catch (err) {
    console.error('Error fetching snapshots:', err);
    return error(res, "Database error", 500);
  }
});

// GET snapshot by ID
router.get("/meta-business-manager-snapshot/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      "SELECT meta_business_manager_snapshot_id, meta_business_manager_id, date, meta_business_manager_name FROM meta_business_managers_snapshot WHERE meta_business_manager_snapshot_id = $1;",
      [id]
    );
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error fetching snapshot:', err);
    return error(res, "Database error", 500);
  }
});

// POST create snapshot
router.post("/meta-business-manager-snapshot", async (req, res) => {
  try {
    const { meta_business_manager_id, date, meta_business_manager_name } = req.body;
    if (!meta_business_manager_id || !date || !meta_business_manager_name) {
      return error(res, "Missing required fields", 400);
    }

    const { rows } = await pool.query(
      "INSERT INTO meta_business_managers_snapshot (meta_business_manager_id, date, meta_business_manager_name) VALUES ($1, $2, $3) RETURNING meta_business_manager_snapshot_id, meta_business_manager_id, date, meta_business_manager_name;",
      [meta_business_manager_id, date, meta_business_manager_name]
    );
    return created(res, rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return error(res, "Referenced business manager does not exist", 400);
    }
    console.error('Error creating snapshot:', err);
    return error(res, "Database error", 500);
  }
});

// DELETE snapshot
router.delete("/meta-business-manager-snapshot/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      "DELETE FROM meta_business_managers_snapshot WHERE meta_business_manager_snapshot_id = $1 RETURNING meta_business_manager_snapshot_id, meta_business_manager_id, date, meta_business_manager_name;",
      [id]
    );
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error deleting snapshot:', err);
    return error(res, "Database error", 500);
  }
});

export default router;
