import { Router } from "express";
import { pool } from "../../db/pg.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

// GET all memberships
router.get("/membership", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT user_id, business_id FROM user_businesses;");
    return success(res, rows);
  } catch (err) {
    console.error('Error fetching memberships:', err);
    return error(res, "Database error", 500);
  }
});

// GET memberships by user
router.get("/membership/user/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { rows } = await pool.query(
      "SELECT user_id, business_id FROM user_businesses WHERE user_id = $1;",
      [userId]
    );
    return success(res, rows);
  } catch (err) {
    console.error('Error fetching memberships by user:', err);
    return error(res, "Database error", 500);
  }
});

// GET memberships by business
router.get("/membership/business/:businessId", async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const { rows } = await pool.query(
      "SELECT user_id, business_id FROM user_businesses WHERE business_id = $1;",
      [businessId]
    );
    return success(res, rows);
  } catch (err) {
    console.error('Error fetching memberships by business:', err);
    return error(res, "Database error", 500);
  }
});

// POST create membership
router.post("/membership", async (req, res) => {
  try {
    const { user_id, business_id } = req.body;
    if (!user_id || !business_id) {
      return error(res, "Missing required fields: user_id, business_id", 400);
    }

    const { rows } = await pool.query(
      "INSERT INTO user_businesses (user_id, business_id) VALUES ($1, $2) RETURNING user_id, business_id;",
      [user_id, business_id]
    );
    return created(res, rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return error(res, "Membership already exists", 409);
    }
    if (err.code === '23503') {
      return error(res, "Referenced user or business does not exist", 400);
    }
    console.error('Error creating membership:', err);
    return error(res, "Database error", 500);
  }
});

// DELETE membership
router.delete("/membership/:userId/:businessId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const businessId = Number(req.params.businessId);

    const { rows } = await pool.query(
      "DELETE FROM user_businesses WHERE user_id = $1 AND business_id = $2 RETURNING user_id, business_id;",
      [userId, businessId]
    );
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error deleting membership:', err);
    return error(res, "Database error", 500);
  }
});

export default router;
