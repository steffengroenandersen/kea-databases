import { Router } from "express";
import { getDb } from "../../db/mongo.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/membership", async (req, res) => {
  try {
    const db = getDb();
    const memberships = await db.collection('memberships').find({}).toArray();
    return success(res, memberships);
  } catch (err) {
    console.error('Error fetching memberships:', err);
    return error(res, "Database error", 500);
  }
});

router.get("/membership/user/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const db = getDb();
    const memberships = await db.collection('memberships').find({ userId }).toArray();
    return success(res, memberships);
  } catch (err) {
    console.error('Error fetching memberships by user:', err);
    return error(res, "Database error", 500);
  }
});

router.get("/membership/business/:businessId", async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const db = getDb();
    const memberships = await db.collection('memberships').find({ businessId }).toArray();
    return success(res, memberships);
  } catch (err) {
    console.error('Error fetching memberships by business:', err);
    return error(res, "Database error", 500);
  }
});

router.post("/membership", async (req, res) => {
  try {
    const { userId, businessId } = req.body;
    if (!userId || !businessId) {
      return error(res, "Missing required fields: userId, businessId", 400);
    }

    const db = getDb();
    const doc = {
      userId: Number(userId),
      businessId: Number(businessId)
    };

    const result = await db.collection('memberships').insertOne(doc);
    return created(res, { _id: result.insertedId, ...doc });
  } catch (err) {
    if (err.code === 11000) {
      return error(res, "Membership already exists", 409);
    }
    console.error('Error creating membership:', err);
    return error(res, "Database error", 500);
  }
});

router.delete("/membership/:userId/:businessId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const businessId = Number(req.params.businessId);
    const db = getDb();

    const result = await db.collection('memberships').findOneAndDelete({ userId, businessId });

    if (!result) return notFound(res);
    return success(res, result);
  } catch (err) {
    console.error('Error deleting membership:', err);
    return error(res, "Database error", 500);
  }
});

export default router;
