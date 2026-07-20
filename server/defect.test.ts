import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import * as db from "./db";

describe("Defect Operations", () => {
  beforeAll(async () => {
    const database = await getDb();
    if (!database) {
      console.warn("Database not available for tests");
    }
  });

  it("should list defects", async () => {
    const defects = await db.listDefects();
    expect(Array.isArray(defects)).toBe(true);
  });

  it("should get a defect by ID", async () => {
    // This test assumes at least one defect exists
    const defects = await db.listDefects();
    if (defects && defects.length > 0) {
      const defect = await db.getDefectById(defects[0].id);
      expect(defect).toBeDefined();
      expect(defect?.id).toBe(defects[0].id);
    }
  });

  it("should update a defect", async () => {
    const defects = await db.listDefects();
    if (defects && defects.length > 0) {
      const result = await db.updateDefect(defects[0].id, {
        status: "CLOSED",
      });
      expect(result).toBeDefined();
    }
  });
});

describe("Spare Parts Operations", () => {
  it("should list spare parts", async () => {
    const parts = await db.listSpareParts();
    expect(Array.isArray(parts)).toBe(true);
  });

  it("should get a spare part by ID", async () => {
    const parts = await db.listSpareParts();
    if (parts && parts.length > 0) {
      const part = await db.getSparePartById(parts[0].id);
      expect(part).toBeDefined();
      expect(part?.id).toBe(parts[0].id);
    }
  });

  it("should update a spare part", async () => {
    const parts = await db.listSpareParts();
    if (parts && parts.length > 0) {
      const result = await db.updateSparePart(parts[0].id, {
        quantity: 10,
      });
      expect(result).toBeDefined();
    }
  });
});

describe("MEL Operations", () => {
  it("should list MEL items", async () => {
    const melItems = await db.listMelItems();
    expect(Array.isArray(melItems)).toBe(true);
  });

  it("should get a MEL item by ID", async () => {
    const melItems = await db.listMelItems();
    if (melItems && melItems.length > 0) {
      const item = await db.getMelItemById(melItems[0].id);
      expect(item).toBeDefined();
      expect(item?.id).toBe(melItems[0].id);
    }
  });
});

describe("Aircraft Operations", () => {
  it("should list aircraft", async () => {
    const aircraft = await db.listAircraft();
    expect(Array.isArray(aircraft)).toBe(true);
  });

  it("should get an aircraft by ID", async () => {
    const aircraft = await db.listAircraft();
    if (aircraft && aircraft.length > 0) {
      const ac = await db.getAircraftById(aircraft[0].id);
      expect(ac).toBeDefined();
      expect(ac?.id).toBe(aircraft[0].id);
    }
  });

  it("should update aircraft status", async () => {
    const aircraft = await db.listAircraft();
    if (aircraft && aircraft.length > 0) {
      const result = await db.updateAircraft(aircraft[0].id, {
        status: "SERVICEABLE",
      });
      expect(result).toBeDefined();
    }
  });
});
