import { Router } from "express";
import { db } from "../db";
import { devicesTable, casesTable } from "../../shared/schema/schema";
import { eq, and, desc, count } from "drizzle-orm";

const router = Router();

// GET: List user's devices with case count per device
router.get("/", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const devices = await db
      .select({
        id: devicesTable.id,
        userId: devicesTable.userId,
        name: devicesTable.name,
        type: devicesTable.type,
        brand: devicesTable.brand,
        model: devicesTable.model,
        location: devicesTable.location,
        notes: devicesTable.notes,
        createdAt: devicesTable.createdAt,
        updatedAt: devicesTable.updatedAt,
        caseCount: count(casesTable.id),
      })
      .from(devicesTable)
      .leftJoin(casesTable, eq(devicesTable.id, casesTable.deviceId))
      .where(eq(devicesTable.userId, req.user.id))
      .groupBy(devicesTable.id)
      .orderBy(desc(devicesTable.createdAt));

    res.json(devices);
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ error: "Failed to fetch devices" });
  }
});

// POST: Create device
router.post("/", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { name, type, brand, model, location, notes } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: "Name and type are required" });
  }

  try {
    const [device] = await db
      .insert(devicesTable)
      .values({
        userId: req.user.id,
        name,
        type,
        brand: brand || null,
        model: model || null,
        location: location || null,
        notes: notes || null,
      })
      .returning();

    res.json(device);
  } catch (error) {
    console.error("Error creating device:", error);
    res.status(500).json({ error: "Failed to create device" });
  }
});

// PATCH: Update device
router.patch("/:id", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.params;
  const { name, type, brand, model, location, notes } = req.body;

  try {
    // Verify ownership
    const [existing] = await db
      .select()
      .from(devicesTable)
      .where(and(eq(devicesTable.id, id), eq(devicesTable.userId, req.user.id)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Device not found" });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (brand !== undefined) updates.brand = brand;
    if (model !== undefined) updates.model = model;
    if (location !== undefined) updates.location = location;
    if (notes !== undefined) updates.notes = notes;

    const [updated] = await db
      .update(devicesTable)
      .set(updates)
      .where(eq(devicesTable.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error updating device:", error);
    res.status(500).json({ error: "Failed to update device" });
  }
});

// DELETE: Delete device
router.delete("/:id", async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.params;

  try {
    // Verify ownership
    const [existing] = await db
      .select()
      .from(devicesTable)
      .where(and(eq(devicesTable.id, id), eq(devicesTable.userId, req.user.id)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Device not found" });
    }

    await db.delete(devicesTable).where(eq(devicesTable.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting device:", error);
    res.status(500).json({ error: "Failed to delete device" });
  }
});

export default router;
