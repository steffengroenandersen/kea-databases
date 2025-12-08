import { Router } from "express";
import { getSession } from "../../db/neo4j.js";
import { success, created, notFound, error } from "../../utils/response.js";

const router = Router();

router.get("/membership", async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User)-[r:ACCESSES]->(b:Business)
       RETURN u.userId AS userId, b.businessId AS businessId`
    );

    const memberships = result.records.map(record => ({
      userId: record.get('userId'),
      businessId: record.get('businessId')
    }));

    return success(res, memberships);
  } catch (err) {
    console.error('Error fetching memberships:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.get("/membership/user/:userId", async (req, res) => {
  const session = getSession();
  try {
    const userId = Number(req.params.userId);
    const result = await session.run(
      `MATCH (u:User {userId: $userId})-[r:ACCESSES]->(b:Business)
       RETURN u.userId AS userId, b.businessId AS businessId`,
      { userId }
    );

    const memberships = result.records.map(record => ({
      userId: record.get('userId'),
      businessId: record.get('businessId')
    }));

    return success(res, memberships);
  } catch (err) {
    console.error('Error fetching memberships:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.get("/membership/business/:businessId", async (req, res) => {
  const session = getSession();
  try {
    const businessId = Number(req.params.businessId);
    const result = await session.run(
      `MATCH (u:User)-[r:ACCESSES]->(b:Business {businessId: $businessId})
       RETURN u.userId AS userId, b.businessId AS businessId`,
      { businessId }
    );

    const memberships = result.records.map(record => ({
      userId: record.get('userId'),
      businessId: record.get('businessId')
    }));

    return success(res, memberships);
  } catch (err) {
    console.error('Error fetching memberships:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.post("/membership", async (req, res) => {
  const session = getSession();
  try {
    const { userId, businessId } = req.body;
    if (!userId || !businessId) {
      return error(res, "Missing required fields: userId, businessId", 400);
    }

    const result = await session.run(
      `MATCH (u:User {userId: $userId}), (b:Business {businessId: $businessId})
       CREATE (u)-[r:ACCESSES]->(b)
       RETURN u.userId AS userId, b.businessId AS businessId`,
      { userId: Number(userId), businessId: Number(businessId) }
    );

    if (result.records.length === 0) {
      return error(res, "User or business not found", 404);
    }

    const record = result.records[0];
    return created(res, {
      userId: record.get('userId'),
      businessId: record.get('businessId')
    });
  } catch (err) {
    console.error('Error creating membership:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

router.delete("/membership/:userId/:businessId", async (req, res) => {
  const session = getSession();
  try {
    const userId = Number(req.params.userId);
    const businessId = Number(req.params.businessId);

    const result = await session.run(
      `MATCH (u:User {userId: $userId})-[r:ACCESSES]->(b:Business {businessId: $businessId})
       DELETE r
       RETURN u.userId AS userId, b.businessId AS businessId`,
      { userId, businessId }
    );

    if (result.records.length === 0) return notFound(res);

    const record = result.records[0];
    return success(res, {
      userId: record.get('userId'),
      businessId: record.get('businessId')
    });
  } catch (err) {
    console.error('Error deleting membership:', err);
    return error(res, "Database error", 500);
  } finally {
    await session.close();
  }
});

export default router;
