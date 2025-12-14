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
  role: mysqlEnum("role", ["user", "representative", "admin"]).default("user").notNull(),
  organization: varchar("organization", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Events table storing all event submissions with schema.org Event compliance.
 * Supports event submission, approval workflow, and RSS syndication.
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  
  // Core event information (schema.org Event)
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  
  // Date/time (schema.org: startDate, endDate - ISO 8601)
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  
  // Location (schema.org: location)
  location: varchar("location", { length: 255 }).notNull(),
  locationAddress: text("locationAddress"),
  locationLatitude: varchar("locationLatitude", { length: 20 }),
  locationLongitude: varchar("locationLongitude", { length: 20 }),
  
  // Organization sponsor (schema.org: organizer)
  organizationId: int("organizationId"),
  
  // Individual organizer/contact (schema.org: organizer fallback)
  organizerName: varchar("organizerName", { length: 255 }).notNull(),
  organizerEmail: varchar("organizerEmail", { length: 320 }).notNull(),
  organizerPhone: varchar("organizerPhone", { length: 20 }),
  organizerUrl: varchar("organizerUrl", { length: 2048 }),
  
  // Event URL and image (schema.org: url, image)
  eventUrl: varchar("eventUrl", { length: 2048 }),
  imageUrl: varchar("imageUrl", { length: 2048 }),
  
  // Event classification
  eventType: mysqlEnum("eventType", ["fundraiser", "rally", "meeting", "training", "social", "other"]).default("other").notNull(),
  visibility: mysqlEnum("visibility", ["public", "private", "members"]).default("public").notNull(),
  
  // Submission and approval workflow
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  submittedBy: int("submittedBy"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  rejectionReason: text("rejectionReason"),
  
  // Audit timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Organizations table for storing event sponsors/hosts like committees, clubs, groups.
 * Allows tracking of all events from a specific organization.
 */
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  
  // Organization information
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  organizationType: mysqlEnum("organizationType", ["committee", "club", "group", "campaign", "party", "other"]).default("other").notNull(),
  
  // Contact information
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  website: varchar("website", { length: 2048 }),
  
  // Organization details
  logoUrl: varchar("logoUrl", { length: 2048 }),
  location: varchar("location", { length: 255 }),
  
  // Verification and management
  verified: mysqlEnum("verified", ["unverified", "verified", "pending"]).default("unverified").notNull(),
  verifiedBy: int("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
  
  // Audit timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

/**
 * Organizer access table for tracking which users have access to which organizations.
 * Supports one user managing multiple organizations.
 */
export const organizerAccess = mysqlTable("organizerAccess", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  organizationId: int("organizationId").notNull(),
  role: mysqlEnum("role", ["admin", "editor", "viewer"]).default("editor").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrganizerAccess = typeof organizerAccess.$inferSelect;
export type InsertOrganizerAccess = typeof organizerAccess.$inferInsert;

/**
 * Organizer requests table for tracking users requesting login access.
 * Admins review and approve these requests, then assign to organizations.
 */
export const organizerRequests = mysqlTable("organizerRequests", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  organizationName: varchar("organizationName", { length: 255 }).notNull(),
  organizationType: mysqlEnum("organizationType", ["committee", "club", "group", "campaign", "party", "other"]).default("other").notNull(),
  phone: varchar("phone", { length: 20 }),
  message: text("message"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrganizerRequest = typeof organizerRequests.$inferSelect;
export type InsertOrganizerRequest = typeof organizerRequests.$inferInsert;
