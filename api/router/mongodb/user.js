import { Router } from "express";
import { getDb, client } from "../../db/mongo.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

// GET all users
router.get("/user", async (req, res) => {
  try {
    const db = getDb();
    const users = await db.collection('users')
      .find({}, { projection: { passwordHash: 0 } })
      .toArray();
    return success(res, users);
  } catch (err) {
    console.error('Error fetching users:', err);
    return error(res, "Database error", 500);
  }
});

// GET user by ID
router.get("/user/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const db = getDb();
    const user = await db.collection('users').findOne(
      { _id: id },
      { projection: { passwordHash: 0 } }
    );
    if (!user) return notFound(res);
    return success(res, user);
  } catch (err) {
    console.error('Error fetching user:', err);
    return error(res, "Database error", 500);
  }
});

// POST create user
router.post("/user", async (req, res) => {
  try {
    const { _id, email, passwordHash } = req.body;
    if (!_id || !email || !passwordHash) {
      return error(res, "Missing required fields: _id, email, passwordHash", 400);
    }

    const db = getDb();
    const doc = {
      _id: Number(_id),
      email,
      passwordHash,
      sessionToken: null,
      lastUpdated: new Date()
    };

    await db.collection('users').insertOne(doc);

    const { passwordHash: _, ...userWithoutPassword } = doc;
    return created(res, userWithoutPassword);
  } catch (err) {
    if (err.code === 11000) {
      return error(res, "User already exists", 409);
    }
    console.error('Error creating user:', err);
    return error(res, "Database error", 500);
  }
});

// DELETE user (manual cascade to memberships)
router.delete("/user/:id", async (req, res) => {
  const session = client.startSession();
  try {
    const id = Number(req.params.id);
    const db = getDb();

    let deletedUser;

    await session.withTransaction(async () => {
      // Delete memberships first
      await db.collection('memberships').deleteMany({ userId: id }, { session });

      // Delete user
      const result = await db.collection('users').findOneAndDelete(
        { _id: id },
        { session, projection: { passwordHash: 0 } }
      );

      if (!result) throw new Error('User not found');
      deletedUser = result;
    });

    return success(res, deletedUser);
  } catch (err) {
    if (err.message === 'User not found') return notFound(res);
    console.error('Error deleting user:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.endSession();
  }
});

export default router;
