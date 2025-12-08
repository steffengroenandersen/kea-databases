import { Router } from "express";
import { getSession } from "../../db/neo4j.js";
import { success, error } from "../../utils/response.js";
import { randomUUID } from "crypto";

const router = Router();

router.get("/login", async (req, res) => {
  const session = getSession();
  try {
    const { email, password_hash } = req.query;

    if (!email || !password_hash) {
      return error(res, "Missing required query parameters: email, password_hash", 400);
    }

    const sessionToken = randomUUID();

    const result = await session.run(
      `MATCH (u:User {email: $email, passwordHash: $password_hash})
       SET u.sessionToken = $sessionToken
       RETURN u.userId AS userId, u.email AS email, u.sessionToken AS sessionToken`,
      { email, password_hash, sessionToken }
    );

    if (result.records.length === 0) {
      return error(res, "Invalid credentials", 401);
    }

    const record = result.records[0];
    return success(res, {
      userId: record.get('userId'),
      email: record.get('email'),
      sessionToken: record.get('sessionToken')
    });
  } catch (err) {
    console.error('Error during login:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.delete("/logout", async (req, res) => {
  const session = getSession();
  try {
    const { email } = req.body;

    if (!email) {
      return error(res, "Missing required field: email", 400);
    }

    const result = await session.run(
      `MATCH (u:User {email: $email})
       SET u.sessionToken = null
       RETURN u.userId AS userId`,
      { email }
    );

    if (result.records.length === 0) {
      return error(res, "User not found", 404);
    }

    return success(res, { message: "Logged out successfully" });
  } catch (err) {
    console.error('Error during logout:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

export default router;
