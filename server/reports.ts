import { getDb } from "./db";
import { defects, melItems, actionLogs, spareParts, aircraft } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  aircraftId?: number;
  status?: string;
}

/**
 * Generate defect report data
 */
export async function generateDefectReportData(filters: ReportFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  const defectList = await db.select().from(defects);
  const aircraftList = await db.select().from(aircraft);
  const aircraftMap = new Map(aircraftList.map((a: any) => [a.id, a]));

  let filtered = defectList;

  if (filters.aircraftId) {
    filtered = filtered.filter((d: any) => d.aircraftId === filters.aircraftId);
  }

  if (filters.status) {
    filtered = filtered.filter((d: any) => d.status === filters.status);
  }

  if (filters.startDate && filters.endDate) {
    filtered = filtered.filter((d: any) => {
      const date = new Date(d.createdAt);
      return date >= filters.startDate! && date <= filters.endDate!;
    });
  }

  return filtered.map((d: any) => ({
    ...d,
    aircraftName: aircraftMap.get(d.aircraftId)?.registration || "Unknown",
  }));
}

/**
 * Generate MEL report data
 */
export async function generateMelReportData(filters: ReportFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  const melList = await db.select().from(melItems);
  const defectList = await db.select().from(defects);
  const aircraftList = await db.select().from(aircraft);

  const defectMap = new Map(defectList.map((d: any) => [d.id, d]));
  const aircraftMap = new Map(aircraftList.map((a: any) => [a.id, a]));

  let filtered = melList;

  if (filters.startDate && filters.endDate) {
    filtered = filtered.filter((m: any) => {
      const date = new Date(m.createdAt);
      return date >= filters.startDate! && date <= filters.endDate!;
    });
  }

  return filtered.map((m: any) => {
    const defect = defectMap.get(m.defectId);
    const ac = defect ? aircraftMap.get(defect.aircraftId) : null;
    return {
      ...m,
      defectDescription: defect?.description || "Unknown",
      aircraftName: ac?.registration || "Unknown",
      status: m.expiryDate && new Date(m.expiryDate) < new Date() ? "EXPIRED" : "ACTIVE",
    };
  });
}

/**
 * Generate action log report data
 */
export async function generateActionLogReportData(filters: ReportFilters) {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  const logs = await db.select().from(actionLogs);
  const defectList = await db.select().from(defects);
  const aircraftList = await db.select().from(aircraft);

  const defectMap = new Map(defectList.map((d: any) => [d.id, d]));
  const aircraftMap = new Map(aircraftList.map((a: any) => [a.id, a]));

  let filtered = logs;

  if (filters.startDate && filters.endDate) {
    filtered = filtered.filter((log: any) => {
      const date = new Date(log.timestamp);
      return date >= filters.startDate! && date <= filters.endDate!;
    });
  }

  return filtered.map((log: any) => {
    const defect = defectMap.get(log.defectId);
    const ac = defect ? aircraftMap.get(defect.aircraftId) : null;
    return {
      ...log,
      defectDescription: defect?.description || "Unknown",
      aircraftName: ac?.registration || "Unknown",
    };
  });
}

/**
 * Generate inventory report data
 */
export async function generateInventoryReportData() {
  const db = await getDb();
  if (!db) throw new Error("Database not connected");

  const parts = await db.select().from(spareParts);

  return parts.map((p: any) => ({
    ...p,
    stockStatus:
      p.quantity === 0 ? "OUT_OF_STOCK" : p.quantity <= (p.minStock || 2) ? "LOW_STOCK" : "IN_STOCK",
  }));
}

/**
 * Format date for report
 */
export function formatReportDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get report summary statistics
 */
export async function getReportSummary(filters: ReportFilters) {
  const defectList = await generateDefectReportData(filters);
  const melList = await generateMelReportData(filters);
  const inventoryList = await generateInventoryReportData();

  return {
    totalDefects: defectList.length,
    openDefects: defectList.filter((d: any) => d.status === "OPEN").length,
    closedDefects: defectList.filter((d: any) => d.status === "CLOSED").length,
    deferredDefects: defectList.filter((d: any) => d.status === "DEFERRED").length,
    totalMelItems: melList.length,
    expiredMel: melList.filter((m: any) => m.status === "EXPIRED").length,
    activeMel: melList.filter((m: any) => m.status === "ACTIVE").length,
    totalInventory: inventoryList.length,
    outOfStock: inventoryList.filter((p: any) => p.stockStatus === "OUT_OF_STOCK").length,
    lowStock: inventoryList.filter((p: any) => p.stockStatus === "LOW_STOCK").length,
  };
}
