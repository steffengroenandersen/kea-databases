import { Router } from "express";
import { getSession } from "../../db/neo4j.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/user", async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User) RETURN u.userId AS userId, u.email AS email`
    );

    const users = result.records.map(record => ({
      userId: record.get('userId'),
      email: record.get('email')
    }));

    return success(res, users);
  } catch (err) {
    console.error('Error fetching users:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.get("/user/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);
    const result = await session.run(
      `MATCH (u:User {userId: $id}) RETURN u.userId AS userId, u.email AS email`,
      { id }
    );

    if (result.records.length === 0) return notFound(res);

    const record = result.records[0];
    return success(res, {
      userId: record.get('userId'),
      email: record.get('email')
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.post("/user", async (req, res) => {
  const session = getSession();
  try {
    const { userId, email, passwordHash } = req.body;
    if (!userId || !email || !passwordHash) {
      return error(res, "Missing required fields: userId, email, passwordHash", 400);
    }

    const result = await session.run(
      `CREATE (u:User {userId: $userId, email: $email, passwordHash: $passwordHash, sessionToken: null})
       RETURN u.userId AS userId, u.email AS email`,
      { userId: Number(userId), email, passwordHash }
    );

    const record = result.records[0];
    return created(res, {
      userId: record.get('userId'),
      email: record.get('email')
    });
  } catch (err) {
    if (err.code?.includes('ConstraintValidationFailed')) {
      return error(res, "User already exists", 409);
    }
    console.error('Error creating user:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.delete("/user/:id", async (req, res) => {
  const session = getSession();
  try {
    const id = Number(req.params.id);

    const result = await session.run(
      `MATCH (u:User {userId: $id})
       WITH u, u.userId AS userId, u.email AS email
       DETACH DELETE u
       RETURN userId, email`,
      { id }
    );

    if (result.records.length === 0) return notFound(res);

    const record = result.records[0];
    return success(res, {
      userId: record.get('userId'),
      email: record.get('email')
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

export default router;
