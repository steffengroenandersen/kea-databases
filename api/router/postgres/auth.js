import { Router } from "express";
import { randomUUID } from "crypto";
import { pool } from "../../db/pg.js";

const router = Router();

router.get("/login", async (req, res) => {
  console.log("GET /auth/login");

  const { email, passwordHash } = req.body;
  if (!email || !passwordHash) return res.status(400).json({ error: "missing fields" });

  // lookup user
  const { rows } = await pool.query(
    "SELECT user_id, email, password_hash, session_token FROM users WHERE email = $1;",
    [email]
  );
  if (rows.length === 0) return res.status(401).json({ error: "invalid credentials" });

  const user = rows[0];
  if (user.passwordHash && user.passwordHash !== passwordHash) {
    // (If column comes back lowercased by driver) adjust for case differences
    return res.status(401).json({ error: "invalid credentials" });
  }
  if (user.hashPassword && user.hashPassword !== hashPassword) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  // issue / rotate session token
  const newToken = randomUUID();
  await pool.query("UPDATE users SET session_token = $1 WHERE user_id = $2;", [newToken, user.user_id]);

  res.json({
    data: {
      user_id: user.user_id,
      email: user.email,
      sessionToken: newToken,
    },
  });
});

router.delete("/logout", async (req, res) => {
  console.log("DELETE /auth/logout");
  const sessionToken = req.body?.sessionToken || req.query?.sessionToken;
  if (!sessionToken) return res.status(400).json({ error: "missing sessionToken" });

  const { rows } = await pool.query("SELECT user_id FROM users WHERE session_token = $1;", [sessionToken]);
  if (rows.length === 0) return res.status(404).json({ error: "not found" });

  await pool.query("UPDATE users SET session_token = NULL WHERE user_id = $1;", [rows[0].user_id]);

  res.json({
    data: {
      user_id: rows[0].user_id,
      sessionToken: null,
    },
  });
});

export default router;
