import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { InsertUser, users, aircraft, InsertAircraft, defects, InsertDefect, melItems, InsertMelItem, cabinDefects, InsertCabinDefect, actionLogs, InsertActionLog, spareParts, InsertSparePart, surveillanceReports, InsertSurveillanceReport, SurveillanceReport } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Aircraft queries
export async function listAircraft() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(aircraft).orderBy(aircraft.registration);
}

export async function getAircraftById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aircraft).where(eq(aircraft.id, id)).limit(1);
  return result[0];
}

export async function getAircraftByRegistration(registration: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(aircraft).where(eq(aircraft.registration, registration)).limit(1);
  return result[0];
}

export async function createAircraft(data: InsertAircraft) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(aircraft).values(data);
  return result;
}

export async function updateAircraft(id: number, data: Partial<InsertAircraft>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(aircraft).set(data).where(eq(aircraft.id, id));
}

// Defect queries
export async function listDefects(aircraftId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (aircraftId) {
    return db.select().from(defects).where(eq(defects.aircraftId, aircraftId)).orderBy(defects.createdAt);
  }
  return db.select().from(defects).orderBy(defects.createdAt);
}

export async function getDefectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(defects).where(eq(defects.id, id)).limit(1);
  return result[0];
}

export async function createDefect(data: InsertDefect) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(defects).values(data);
  return result;
}

export async function updateDefect(id: number, data: Partial<InsertDefect>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(defects).set(data).where(eq(defects.id, id));
}

// MEL queries
export async function listMelItems(defectId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (defectId) {
    return db.select().from(melItems).where(eq(melItems.defectId, defectId)).limit(1);
  }
  return db.select().from(melItems);
}

export async function getMelItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(melItems).where(eq(melItems.id, id)).limit(1);
  return result[0];
}

export async function createMelItem(data: InsertMelItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(melItems).values(data);
  return result;
}

export async function updateMelItem(id: number, data: Partial<InsertMelItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(melItems).set(data).where(eq(melItems.id, id));
}

// Cabin defect queries
export async function listCabinDefects(aircraftId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (aircraftId) {
    return db.select().from(cabinDefects).where(eq(cabinDefects.aircraftId, aircraftId)).orderBy(cabinDefects.createdAt);
  }
  return db.select().from(cabinDefects).orderBy(cabinDefects.createdAt);
}

export async function getCabinDefectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cabinDefects).where(eq(cabinDefects.id, id)).limit(1);
  return result[0];
}

export async function createCabinDefect(data: InsertCabinDefect) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cabinDefects).values(data);
  return result;
}

export async function updateCabinDefect(id: number, data: Partial<InsertCabinDefect>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(cabinDefects).set(data).where(eq(cabinDefects.id, id));
}

// Action log queries
export async function listActionLogs(defectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(actionLogs).where(eq(actionLogs.defectId, defectId)).orderBy(actionLogs.timestamp);
}

export async function createActionLog(data: InsertActionLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(actionLogs).values(data);
}

// Spare parts queries
export async function listSpareParts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(spareParts).orderBy(spareParts.partCode);
}

export async function getSparePartById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(spareParts).where(eq(spareParts.id, id)).limit(1);
  return result[0];
}

export async function createSparePart(data: InsertSparePart) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(spareParts).values(data);
}

export async function updateSparePart(id: number, data: Partial<InsertSparePart>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(spareParts).set(data).where(eq(spareParts.id, id));
}

export async function deleteDefect(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(defects).where(eq(defects.id, id));
}

export async function deleteSparePartById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(spareParts).where(eq(spareParts.id, id));
}

// Surveillance Reports queries
export async function listSurveillanceReports(aircraftId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (aircraftId) {
    return db.select().from(surveillanceReports).where(eq(surveillanceReports.aircraftId, aircraftId)).orderBy(surveillanceReports.createdAt);
  }
  return db.select().from(surveillanceReports).orderBy(surveillanceReports.createdAt);
}

export async function getSurveillanceReportById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(surveillanceReports).where(eq(surveillanceReports.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createSurveillanceReport(data: InsertSurveillanceReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(surveillanceReports).values(data);
}

export async function updateSurveillanceReport(id: number, data: Partial<SurveillanceReport>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(surveillanceReports).set(data).where(eq(surveillanceReports.id, id));
}

export async function deleteSurveillanceReport(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(surveillanceReports).where(eq(surveillanceReports.id, id));
}
