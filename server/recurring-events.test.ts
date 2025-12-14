import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { db } from "./_core/db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createRepresentativeContext(): { ctx: TrpcContext; user: AuthenticatedUser } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "rep-user",
    email: "rep@example.com",
    name: "Representative User",
    loginMethod: "manus",
    role: "representative",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx, user };
}

describe("Recurring Monthly Meetings Feature", () => {
  describe("Event submission with recurring meeting", () => {
    it("should accept recurring meeting submission with nth day pattern and months", async () => {
      const { ctx } = createRepresentativeContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date("2025-02-10T18:00:00Z");
      const result = await caller.events.submit({
        name: "Monthly Board Meeting",
        description: "Regular monthly board meeting for the organization",
        startDate,
        location: "Conference Room A",
        organizerName: "John Doe",
        organizerEmail: "john@example.com",
        eventType: "meeting",
        visibility: "public",
        isRecurring: 1,
        recurringPattern: "2nd-monday",
        recurringMonths: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
      });

      expect(result.status).toBe("approved");
      expect(result.id).toBeDefined();

      // Verify the event was created with recurring fields
      const event = await caller.events.getById({ id: result.id });
      expect(event.isRecurring).toBe(1);
      expect(event.recurringPattern).toBe("2nd-monday");
      expect(event.recurringMonths).toBe(JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));
    });

    it("should accept recurring meeting with seasonal breaks (selected months only)", async () => {
      const { ctx } = createRepresentativeContext();
      const caller = appRouter.createCaller(ctx);

      const startDate = new Date("2025-03-15T14:00:00Z");
      const result = await caller.events.submit({
        name: "Summer Meetings - Suspended July & August",
        description: "Monthly meeting that takes a summer break",
        startDate,
        location: "Main Office",
        organizerName: "Jane Smith",
        organizerEmail: "jane@example.com",
        eventType: "meeting",
        visibility: "public",
        isRecurring: 1,
        recurringPattern: "3rd-friday",
        // Exclude July (7) and August (8)
        recurringMonths: JSON.stringify([1, 2, 3, 4, 5, 6, 9, 10, 11, 12]),
      });

      expect(result.status).toBe("approved");

      const event = await caller.events.getById({ id: result.id });
      const months = JSON.parse(event.recurringMonths || "[]");
      expect(months).toEqual([1, 2, 3, 4, 5, 6, 9, 10, 11, 12]);
      expect(months).not.toContain(7);
      expect(months).not.toContain(8);
    });

    it("should accept all nth day patterns (1st through last)", async () => {
      const { ctx } = createRepresentativeContext();
      const caller = appRouter.createCaller(ctx);

      const patterns = [
        "1st-monday",
        "2nd-tuesday",
        "3rd-wednesday",
        "4th-thursday",
        "last-friday",
      ];

      for (const pattern of patterns) {
        const result = await caller.events.submit({
          name: `Meeting on ${pattern}`,
          description: `Test meeting pattern: ${pattern}`,
          startDate: new Date("2025-02-15T10:00:00Z"),
          location: "Test Location",
          organizerName: "Test Organizer",
          organizerEmail: "test@example.com",
          eventType: "meeting",
          visibility: "public",
          isRecurring: 1,
          recurringPattern: pattern,
          recurringMonths: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
        });

        expect(result.status).toBe("approved");
        const event = await caller.events.getById({ id: result.id });
        expect(event.recurringPattern).toBe(pattern);
      }
    });
  });

  describe("Non-recurring events", () => {
    it("should accept non-meeting event types (UI prevents recurring fields)", async () => {
      const { ctx } = createRepresentativeContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.events.submit({
        name: "Annual Fundraiser",
        description: "One-time fundraising event",
        startDate: new Date("2025-06-15T18:00:00Z"),
        location: "Ballroom",
        organizerName: "Fundraiser Team",
        organizerEmail: "fundraiser@example.com",
        eventType: "fundraiser",
        visibility: "public",
      });

      expect(result.status).toBe("approved");

      const event = await caller.events.getById({ id: result.id });
      // Non-meeting types should have default/empty recurring fields
      expect(event.eventType).toBe("fundraiser");
      expect(event.isRecurring).toBe(0);
    });

    it("should accept non-recurring meeting events", async () => {
      const { ctx } = createRepresentativeContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.events.submit({
        name: "One-Time Special Meeting",
        description: "A special meeting that happens only once",
        startDate: new Date("2025-04-20T19:00:00Z"),
        location: "Special Venue",
        organizerName: "Event Organizer",
        organizerEmail: "organizer@example.com",
        eventType: "meeting",
        visibility: "public",
        isRecurring: 0,
        recurringPattern: undefined,
        recurringMonths: undefined,
      });

      expect(result.status).toBe("approved");

      const event = await caller.events.getById({ id: result.id });
      expect(event.isRecurring).toBe(0);
      expect(event.recurringPattern).toBeNull();
      expect(event.recurringMonths).toBeNull();
    });
  });

  describe("Public event submission with recurring meetings", () => {
    it("should allow public users to submit recurring meeting events (pending approval)", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.events.submit({
        name: "Community Monthly Meetup",
        description: "Public community meeting open to all",
        startDate: new Date("2025-05-10T17:00:00Z"),
        location: "Community Center",
        organizerName: "Community Organizer",
        organizerEmail: "community@example.com",
        eventType: "meeting",
        visibility: "public",
        isRecurring: 1,
        recurringPattern: "2nd-saturday",
        recurringMonths: JSON.stringify([3, 4, 5, 6, 7, 8, 9, 10]),
      });

      expect(result.status).toBe("pending");
      expect(result.id).toBeDefined();
    });
  });

  describe("Recurring meeting data validation", () => {
    it("should store recurring months as valid JSON array", async () => {
      const { ctx } = createRepresentativeContext();
      const caller = appRouter.createCaller(ctx);

      const monthsArray = [1, 3, 5, 7, 9, 11];
      const result = await caller.events.submit({
        name: "Odd Month Meetings",
        description: "Meetings on odd-numbered months only",
        startDate: new Date("2025-01-15T15:00:00Z"),
        location: "Office",
        organizerName: "Scheduler",
        organizerEmail: "scheduler@example.com",
        eventType: "meeting",
        visibility: "public",
        isRecurring: 1,
        recurringPattern: "3rd-wednesday",
        recurringMonths: JSON.stringify(monthsArray),
      });

      const event = await caller.events.getById({ id: result.id });
      const storedMonths = JSON.parse(event.recurringMonths || "[]");
      expect(storedMonths).toEqual(monthsArray);
    });

    it("should handle empty recurring months gracefully", async () => {
      const { ctx } = createRepresentativeContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.events.submit({
        name: "Test Event",
        description: "Test event with empty months",
        startDate: new Date("2025-02-01T10:00:00Z"),
        location: "Test",
        organizerName: "Test",
        organizerEmail: "test@example.com",
        eventType: "meeting",
        visibility: "public",
        isRecurring: 1,
        recurringPattern: "1st-monday",
        recurringMonths: JSON.stringify([]),
      });

      const event = await caller.events.getById({ id: result.id });
      const months = JSON.parse(event.recurringMonths || "[]");
      expect(months).toEqual([]);
    });
  });

  describe("Recurring meeting visibility and privacy", () => {
    it("should respect visibility settings for recurring meetings", async () => {
      const { ctx } = createRepresentativeContext();
      const caller = appRouter.createCaller(ctx);

      const visibilityOptions = ["public", "private", "members"] as const;

      for (const visibility of visibilityOptions) {
        const result = await caller.events.submit({
          name: `${visibility} Recurring Meeting`,
          description: `Meeting with ${visibility} visibility`,
          startDate: new Date("2025-03-20T16:00:00Z"),
          location: "Location",
          organizerName: "Organizer",
          organizerEmail: "org@example.com",
          eventType: "meeting",
          visibility,
          isRecurring: 1,
          recurringPattern: "4th-tuesday",
          recurringMonths: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
        });

        const event = await caller.events.getById({ id: result.id });
        expect(event.visibility).toBe(visibility);
      }
    });
  });

  describe("Recurring meeting with location details", () => {
    it("should store location details for recurring meetings", async () => {
      const { ctx } = createRepresentativeContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.events.submit({
        name: "Monthly Meeting with Full Location",
        description: "Meeting with complete location information",
        startDate: new Date("2025-04-10T14:00:00Z"),
        location: "Downtown Conference Center",
        locationAddress: "123 Main Street, Wilmington, DE 19801",
        locationLatitude: "39.1582",
        locationLongitude: "-75.5244",
        organizerName: "Organizer",
        organizerEmail: "org@example.com",
        eventType: "meeting",
        visibility: "public",
        isRecurring: 1,
        recurringPattern: "1st-thursday",
        recurringMonths: JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
      });

      const event = await caller.events.getById({ id: result.id });
      expect(event.location).toBe("Downtown Conference Center");
      expect(event.locationAddress).toBe("123 Main Street, Wilmington, DE 19801");
      expect(event.locationLatitude).toBe("39.1582");
      expect(event.locationLongitude).toBe("-75.5244");
      expect(event.isRecurring).toBe(1);
    });
  });
});
