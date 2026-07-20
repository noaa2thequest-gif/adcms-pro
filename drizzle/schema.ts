import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "mcc", "cabin", "quality_auditor", "technician", "supervisor"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Aircraft table
export const aircraft = mysqlTable("aircraft", {
  id: int("id").autoincrement().primaryKey(),
  registration: varchar("registration", { length: 20 }).notNull().unique(),
  model: varchar("model", { length: 100 }).notNull(),
  location: varchar("location", { length: 100 }),
  status: mysqlEnum("status", ["SERVICEABLE", "DEFERRED", "AOG"]).default("SERVICEABLE").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Aircraft = typeof aircraft.$inferSelect;
export type InsertAircraft = typeof aircraft.$inferInsert;

// Defects table
export const defects = mysqlTable("defects", {
  id: int("id").autoincrement().primaryKey(),
  aircraftId: int("aircraftId").notNull(),
  source: varchar("source", { length: 100 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["OPEN", "CLOSED", "DEFERRED"]).default("OPEN").notNull(),
  reportedBy: int("reportedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Defect = typeof defects.$inferSelect;
export type InsertDefect = typeof defects.$inferInsert;

// MEL items table
export const melItems = mysqlTable("melItems", {
  id: int("id").autoincrement().primaryKey(),
  defectId: int("defectId").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  reference: varchar("reference", { length: 100 }),
  expiryDate: timestamp("expiryDate"),
  placardRequired: int("placardRequired").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MelItem = typeof melItems.$inferSelect;
export type InsertMelItem = typeof melItems.$inferInsert;

// Cabin defects table
export const cabinDefects = mysqlTable("cabinDefects", {
  id: int("id").autoincrement().primaryKey(),
  aircraftId: int("aircraftId").notNull(),
  area: varchar("area", { length: 100 }),
  description: text("description").notNull(),
  isMel: int("isMel").default(0),
  melItemId: int("melItemId"),
  reportedBy: int("reportedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CabinDefect = typeof cabinDefects.$inferSelect;
export type InsertCabinDefect = typeof cabinDefects.$inferInsert;

// Action logs table
export const actionLogs = mysqlTable("actionLogs", {
  id: int("id").autoincrement().primaryKey(),
  defectId: int("defectId").notNull(),
  actionTaken: text("actionTaken").notNull(),
  nextAction: text("nextAction"),
  engineerId: int("engineerId"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type ActionLog = typeof actionLogs.$inferSelect;
export type InsertActionLog = typeof actionLogs.$inferInsert;

// Spare parts inventory table
export const spareParts = mysqlTable("spareParts", {
  id: int("id").autoincrement().primaryKey(),
  partCode: varchar("partCode", { length: 100 }).notNull().unique(),
  description: text("description").notNull(),
  quantity: int("quantity").default(0).notNull(),
  location: varchar("location", { length: 100 }),
  minStock: int("minStock").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SparePart = typeof spareParts.$inferSelect;
export type InsertSparePart = typeof spareParts.$inferInsert;

// Permissions table
export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // defects, mel, inventory, reports, users
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

// User permissions junction table
export const userPermissions = mysqlTable("userPermissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  permissionId: int("permissionId").notNull(),
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
  grantedBy: int("grantedBy"), // admin who granted this permission
});

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = typeof userPermissions.$inferInsert;

// Add status field to users for active/inactive
export const usersUpdated = mysqlTable("users_updated", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "mcc", "cabin", "quality_auditor", "technician", "supervisor", "surveillance"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type UserUpdated = typeof usersUpdated.$inferSelect;
export type InsertUserUpdated = typeof usersUpdated.$inferInsert;

// Surveillance & SAFA Audit Reports table
export const surveillanceReports = mysqlTable("surveillanceReports", {
  id: int("id").autoincrement().primaryKey(),
  aircraftId: int("aircraftId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  auditType: mysqlEnum("auditType", ["SURVEILLANCE", "SAFA"]).default("SURVEILLANCE").notNull(),
  findings: text("findings"),
  severity: mysqlEnum("severity", ["CRITICAL", "MAJOR", "MINOR", "OBSERVATION"]).default("OBSERVATION").notNull(),
  status: mysqlEnum("status", ["OPEN", "IN_PROGRESS", "CLOSED", "SENT_TO_QA"]).default("OPEN").notNull(),
  reportedBy: int("reportedBy").notNull(),
  assignedTo: int("assignedTo"),
  actionTaken: text("actionTaken"),
  respondedBy: int("respondedBy"),
  respondedAt: timestamp("respondedAt"),
  sentToQaAt: timestamp("sentToQaAt"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SurveillanceReport = typeof surveillanceReports.$inferSelect;
export type InsertSurveillanceReport = typeof surveillanceReports.$inferInsert;