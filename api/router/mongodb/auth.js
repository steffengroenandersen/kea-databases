import { Router } from "express";
import { getDb } from "../../db/mongo.js";
import { success, error } from "../../utils/response.js";
import { randomUUID } from "crypto";

const router = Router();

// Login
router.get("/login", async (req, res) => {
  try {
    const { email, password_hash } = req.query;

    if (!email || !password_hash) {
      return error(res, "Missing required query parameters: email, password_hash", 400);
    }

    const db = getDb();
    const user = await db.collection('users').findOne({ email, passwordHash: password_hash });

    if (!user) {
      return error(res, "Invalid credentials", 401);
    }

    const sessionToken = randomUUID();
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { sessionToken, lastUpdated: new Date() } }
    );

    return success(res, {
      _id: user._id,
      email: user.email,
      sessionToken,
      lastUpdated: new Date()
    });
  } catch (err) {
    console.error('Error during login:', err);
    return error(res, "Database error", 500);
  }
});

// Logout
router.delete("/logout", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return error(res, "Missing required field: email", 400);
    }

    const db = getDb();
    const result = await db.collection('users').updateOne(
      { email },
      { $set: { sessionToken: null, lastUpdated: new Date() } }
    );

    if (result.matchedCount === 0) {
      return error(res, "User not found", 404);
    }

    return success(res, { message: "Logged out successfully" });
  } catch (err) {
    console.error('Error during logout:', err);
    return error(res, "Database error", 500);
  }
});

export default router;
