import { db } from "../db";
import { devicesTable, casesTable } from "../../shared/schema/schema";
import { eq, and, ilike, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const DEVICE_TYPE_WHITELIST = new Set([
  "router",
  "modem",
  "mesh_system",
  "access_point",
  "tv",
  "streaming_device",
  "smart_speaker",
  "smart_display",
  "smart_light",
  "smart_lock",
  "smart_plug",
  "smart_switch",
  "thermostat",
  "camera",
  "doorbell",
  "phone",
  "tablet",
  "laptop",
  "desktop",
  "printer",
  "washer",
  "dryer",
  "dishwasher",
  "refrigerator",
  "oven",
  "microwave",
  "hvac",
  "garage_door",
  "sprinkler",
  "other",
]);

function sanitize(val: unknown, maxLen = 255): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLen) : null;
}

export async function processDeviceIdentification(
  userId: string,
  caseId: string | null | undefined,
  args: Record<string, unknown>,
): Promise<{ deviceId: string; created: boolean } | null> {
  try {
    const rawType = sanitize(args.deviceType);
    const deviceType = rawType && DEVICE_TYPE_WHITELIST.has(rawType.toLowerCase())
      ? rawType.toLowerCase()
      : "other";
    const brand = sanitize(args.brand);
    const model = sanitize(args.model);
    const displayName = sanitize(args.displayName) || `${brand || "Unknown"} ${deviceType}`;

    // Dedup: look for existing device with same userId + type + brand
    let existingDevice: { id: string; model: string | null } | undefined;

    if (brand) {
      // Try exact match with model first
      if (model) {
        const [exact] = await db
          .select({ id: devicesTable.id, model: devicesTable.model })
          .from(devicesTable)
          .where(
            and(
              eq(devicesTable.userId, userId),
              ilike(devicesTable.type, deviceType),
              ilike(devicesTable.brand, brand),
              ilike(devicesTable.model, model),
            ),
          )
          .limit(1);
        existingDevice = exact;
      }

      // Fall back to brand-only match
      if (!existingDevice) {
        const [brandMatch] = await db
          .select({ id: devicesTable.id, model: devicesTable.model })
          .from(devicesTable)
          .where(
            and(
              eq(devicesTable.userId, userId),
              ilike(devicesTable.type, deviceType),
              ilike(devicesTable.brand, brand),
            ),
          )
          .limit(1);
        existingDevice = brandMatch;
      }
    }

    let deviceId: string;
    let created = false;

    if (existingDevice) {
      deviceId = existingDevice.id;
      // Update model if we have one now and existing didn't
      if (model && !existingDevice.model) {
        await db
          .update(devicesTable)
          .set({ model, updatedAt: new Date() })
          .where(eq(devicesTable.id, deviceId));
      }
    } else {
      // Create new device
      deviceId = uuidv4();
      await db.insert(devicesTable).values({
        id: deviceId,
        userId,
        name: displayName,
        type: deviceType,
        brand,
        model,
      });
      created = true;
    }

    // Link case to device (only if case exists and deviceId is currently null)
    if (caseId) {
      await db
        .update(casesTable)
        .set({ deviceId, updatedAt: new Date() })
        .where(
          and(
            eq(casesTable.id, caseId),
            eq(casesTable.userId, userId),
            isNull(casesTable.deviceId),
          ),
        );
    }

    return { deviceId, created };
  } catch (err) {
    console.error("[DeviceIdentification] Error (non-fatal):", (err as Error).message);
    return null;
  }
}
