import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(user?: Partial<AuthenticatedUser>): TrpcContext {
  const defaultUser: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: user ? { ...defaultUser, ...user } : undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("events", () => {
  describe("submit", () => {
    it("should reject submission from unauthenticated user", async () => {
      const ctx = createMockContext(undefined);
      const caller = appRouter.createCaller(ctx);

      const input = {
        name: "Test Event",
        description: "A test event",
        startDate: new Date("2025-12-25"),
        location: "Delaware",
        organizerName: "Test Org",
        organizerEmail: "org@example.com",
        eventType: "rally" as const,
      };

      try {
        await caller.events.submit(input);
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should create pending event for regular user", async () => {
      const ctx = createMockContext({ role: "user" });
      const caller = appRouter.createCaller(ctx);

      const input = {
        name: "Test Event",
        description: "A test event",
        startDate: new Date("2025-12-25"),
        location: "Delaware",
        organizerName: "Test Org",
        organizerEmail: "org@example.com",
        eventType: "rally" as const,
      };

      const result = await caller.events.submit(input);

      expect(result.status).toBe("pending");
      expect(result.message).toContain("submitted for review");
      expect(result.id).toBeDefined();
    });

    it("should create approved event for representative", async () => {
      const ctx = createMockContext({ role: "representative" });
      const caller = appRouter.createCaller(ctx);

      const input = {
        name: "Representative Event",
        description: "Event from representative",
        startDate: new Date("2025-12-25"),
        location: "Delaware",
        organizerName: "Rep Org",
        organizerEmail: "rep@example.com",
        eventType: "meeting" as const,
      };

      const result = await caller.events.submit(input);

      expect(result.status).toBe("approved");
      expect(result.message).toContain("automatically approved");
      expect(result.id).toBeDefined();
    });
  });

  describe("list", () => {
    it("should return approved events", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.events.list({});

      expect(result.events).toBeDefined();
      expect(Array.isArray(result.events)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);
      result.events.forEach(event => {
        expect(event.status).toBe("approved");
      });
    });
  });

  describe("listPending", () => {
    it("should reject non-admin access", async () => {
      const ctx = createMockContext({ role: "user" });
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.events.listPending({});
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should allow admin access", async () => {
      const ctx = createMockContext({ role: "admin" });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.events.listPending({});

      expect(result.events).toBeDefined();
      expect(result.total).toBeDefined();
    });
  });

  describe("approve", () => {
    it("should reject non-admin access", async () => {
      const ctx = createMockContext({ role: "user" });
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.events.approve({ id: 999 });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should reject approval of non-existent event", async () => {
      const ctx = createMockContext({ role: "admin" });
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.events.approve({ id: 999 });
        expect.fail("Should have thrown NOT_FOUND error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });
  });

  describe("updateOwn", () => {
    it("should reject update of other user's event", async () => {
      const ctx = createMockContext({ id: 1, role: "user" });
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.events.updateOwn({
          id: 999,
          name: "Updated Event",
        });
        expect.fail("Should have thrown NOT_FOUND or FORBIDDEN error");
      } catch (error: any) {
        expect(["NOT_FOUND", "FORBIDDEN"]).toContain(error.code);
      }
    });
  });

  describe("delete", () => {
    it("should reject non-admin access", async () => {
      const ctx = createMockContext({ role: "user" });
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.events.delete({ id: 999 });
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("should reject deletion of non-existent event", async () => {
      const ctx = createMockContext({ role: "admin" });
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.events.delete({ id: 999 });
        expect.fail("Should have thrown NOT_FOUND error");
      } catch (error: any) {
        expect(error.code).toBe("NOT_FOUND");
      }
    });
  });
});
