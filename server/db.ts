import { and, asc, between, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { Event, InsertEvent, InsertUser, Organization, InsertOrganization, OrganizerAccess, InsertOrganizerAccess, OrganizerRequest, InsertOrganizerRequest, events, organizations, organizerAccess, organizerRequests, users } from "../drizzle/schema";
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

// Event query helpers

export async function createEvent(event: InsertEvent): Promise<Event> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(events).values(event);
  const eventId = result[0].insertId as number;
  
  const created = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  return created[0]!;
}

export async function getEventById(id: number): Promise<Event | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getApprovedEvents(filters?: {
  startDate?: Date;
  endDate?: Date;
  search?: string;
  eventType?: string;
  limit?: number;
  offset?: number;
}): Promise<{ events: Event[]; total: number }> {
  const db = await getDb();
  if (!db) return { events: [], total: 0 };

  const conditions: any[] = [eq(events.status, "approved")];

  if (filters?.startDate && filters?.endDate) {
    conditions.push(between(events.startDate, filters.startDate, filters.endDate));
  } else if (filters?.startDate) {
    conditions.push(gte(events.startDate, filters.startDate));
  } else if (filters?.endDate) {
    conditions.push(lte(events.startDate, filters.endDate));
  }

  if (filters?.search) {
    conditions.push(
      or(
        ilike(events.name, `%${filters.search}%`),
        ilike(events.description, `%${filters.search}%`)
      )
    );
  }

  if (filters?.eventType) {
    const eventTypeValue = filters.eventType as "fundraiser" | "rally" | "meeting" | "training" | "social" | "other";
    conditions.push(eq(events.eventType, eventTypeValue));
  }

  const whereCondition = conditions.length > 1 ? and(...conditions) : conditions[0];
  const query = db.select().from(events).where(whereCondition).orderBy(asc(events.startDate));

  const countResult = await db.select().from(events).where(whereCondition);
  const total = countResult.length;

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const result = await query.limit(limit).offset(offset);
  return { events: result, total };
}

export async function getPendingEvents(filters?: {
  status?: "pending" | "rejected";
  limit?: number;
  offset?: number;
}): Promise<{ events: Event[]; total: number }> {
  const db = await getDb();
  if (!db) return { events: [], total: 0 };

  const conditions = filters?.status ? [eq(events.status, filters.status)] : [or(eq(events.status, "pending"), eq(events.status, "rejected"))];

  const countResult = await db.select().from(events).where(and(...conditions));
  const total = countResult.length;

  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const result = await db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(desc(events.submittedAt))
    .limit(limit)
    .offset(offset);

  return { events: result, total };
}

export async function getUserSubmittedEvents(userId: number): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(events).where(eq(events.submittedBy, userId)).orderBy(desc(events.submittedAt));
  return result;
}

export async function updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(events).set({ ...updates, updatedAt: new Date() }).where(eq(events.id, id));
  return getEventById(id);
}

export async function approveEvent(id: number, approvedBy: number): Promise<Event | undefined> {
  return updateEvent(id, {
    status: "approved",
    approvedBy,
    approvedAt: new Date(),
  });
}

export async function rejectEvent(id: number, approvedBy: number, reason: string): Promise<Event | undefined> {
  return updateEvent(id, {
    status: "rejected",
    approvedBy,
    approvedAt: new Date(),
    rejectionReason: reason,
  });
}

export async function deleteEvent(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(events).where(eq(events.id, id));
  return true;
}

export async function getRepresentatives(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(users).where(eq(users.role, "representative"));
  return result;
}

export async function setUserRole(userId: number, role: "user" | "representative" | "admin", organization?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set({ role, organization }).where(eq(users.id, userId));
}

// Organization query helpers

export async function createOrganization(organizer: InsertOrganization): Promise<Organization> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(organizations).values(organizer);
  const organizerId = result[0].insertId as number;
  
  const created = await db.select().from(organizations).where(eq(organizations.id, organizerId)).limit(1);
  return created[0]!;
}

export async function getOrganizationById(id: number): Promise<Organization | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllOrganizations(): Promise<Organization[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(organizations).orderBy(asc(organizations.name));
  return result;
}

export async function getVerifiedOrganizations(): Promise<Organization[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(organizations)
    .where(eq(organizations.verified, "verified"))
    .orderBy(asc(organizations.name));
  return result;
}

export async function updateOrganization(id: number, updates: Partial<InsertOrganization>): Promise<Organization | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(organizations).set({ ...updates, updatedAt: new Date() }).where(eq(organizations.id, id));
  return getOrganizationById(id);
}

export async function deleteOrganization(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(organizations).where(eq(organizations.id, id));
  return true;
}

export async function getOrganizationEvents(organizerId: number): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];

  // This will be implemented once we add organizerId foreign key to events
  // For now, return empty array
  return [];
}

// Organizer Access query helpers

export async function grantOrganizerAccess(
  userId: number,
  organizationId: number,
  role: "admin" | "editor" | "viewer" = "editor"
): Promise<OrganizerAccess> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(organizerAccess).values({
    userId,
    organizationId,
    role,
  });
  const accessId = result[0].insertId as number;
  
  const created = await db.select().from(organizerAccess).where(eq(organizerAccess.id, accessId)).limit(1);
  return created[0]!;
}

export async function getUserOrganizations(userId: number): Promise<Organization[]> {
  const db = await getDb();
  if (!db) return [];

  const accessRecords = await db
    .select()
    .from(organizerAccess)
    .where(eq(organizerAccess.userId, userId));

  const orgIds = accessRecords.map(a => a.organizationId);
  if (orgIds.length === 0) return [];

  return db.select().from(organizations).where(eq(organizations.id, orgIds[0]));
}

export async function revokeOrganizerAccess(userId: number, organizationId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(organizerAccess)
    .where(and(eq(organizerAccess.userId, userId), eq(organizerAccess.organizationId, organizationId)));
  return true;
}

// Organizer Requests query helpers

export async function createOrganizerRequest(request: InsertOrganizerRequest): Promise<OrganizerRequest> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(organizerRequests).values(request);
  const requestId = result[0].insertId as number;
  
  const created = await db.select().from(organizerRequests).where(eq(organizerRequests.id, requestId)).limit(1);
  return created[0]!;
}

export async function getOrganizerRequestById(id: number): Promise<OrganizerRequest | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(organizerRequests).where(eq(organizerRequests.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPendingOrganizerRequests(limit: number = 50, offset: number = 0): Promise<{ requests: OrganizerRequest[]; total: number }> {
  const db = await getDb();
  if (!db) return { requests: [], total: 0 };

  const countResult = await db.select().from(organizerRequests).where(eq(organizerRequests.status, "pending"));
  const total = countResult.length;

  const result = await db
    .select()
    .from(organizerRequests)
    .where(eq(organizerRequests.status, "pending"))
    .orderBy(desc(organizerRequests.createdAt))
    .limit(limit)
    .offset(offset);

  return { requests: result, total };
}

export async function approveOrganizerRequest(
  requestId: number,
  approvedBy: number,
  organizationId: number
): Promise<OrganizerRequest | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(organizerRequests)
    .set({
      status: "approved",
      approvedBy,
      approvedAt: new Date(),
    })
    .where(eq(organizerRequests.id, requestId));

  return getOrganizerRequestById(requestId);
}

export async function rejectOrganizerRequest(
  requestId: number,
  approvedBy: number,
  reason: string
): Promise<OrganizerRequest | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(organizerRequests)
    .set({
      status: "rejected",
      approvedBy,
      approvedAt: new Date(),
      rejectionReason: reason,
    })
    .where(eq(organizerRequests.id, requestId));

  return getOrganizerRequestById(requestId);
}
