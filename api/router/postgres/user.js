import { Router } from "express";
import { pool } from "../../db/pg.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

// GET all users
router.get("/user", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT user_id, email, last_updated FROM users;");
    return success(res, rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    return error(res, "Database error", 500);
  }
});

// GET user by ID
router.get("/user/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      "SELECT user_id, email, last_updated FROM users WHERE user_id = $1;",
      [id]
    );
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    return error(res, "Database error", 500);
  }
});

// POST create user
router.post("/user", async (req, res) => {
  try {
    const { email, password_hash } = req.body;
    if (!email || !password_hash) {
      return error(res, "Missing required fields: email, password_hash", 400);
    }

    const { rows } = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING user_id, email, last_updated;",
      [email, password_hash]
    );
    return created(res, rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return error(res, "User with this email already exists", 409);
    }
    console.error('Error creating user:', err);
    return error(res, "Database error", 500);
  }
});

// DELETE user (cascades to user_businesses)
router.delete("/user/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      "DELETE FROM users WHERE user_id = $1 RETURNING user_id, email;",
      [id]
    );
    if (rows.length === 0) return notFound(res);
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error deleting user:', err);
    return error(res, "Database error", 500);
  }
});

export default router;
