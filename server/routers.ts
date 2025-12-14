import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { generateRSSFeed } from "./rss";
import {
  createEvent,
  getEventById,
  getApprovedEvents,
  getPendingEvents,
  getUserSubmittedEvents,
  updateEvent,
  approveEvent,
  rejectEvent,
  deleteEvent,
  createOrganizerRequest,
  getOrganizerRequestById,
  getPendingOrganizerRequests,
  approveOrganizerRequest,
  rejectOrganizerRequest,
} from "./db";

// Validation schemas
const eventInputSchema = z.object({
  name: z.string().min(1, "Event title is required").max(255),
  description: z.string().min(1, "Description is required"),
  startDate: z.date(),
  endDate: z.date().optional(),
  location: z.string().min(1, "Location is required").max(255),
  locationAddress: z.string().optional(),
  locationLatitude: z.string().optional(),
  locationLongitude: z.string().optional(),
  organizerName: z.string().min(1, "Organizer name is required").max(255),
  organizerEmail: z.string().email("Valid email required"),
  organizerPhone: z.string().optional(),
  organizerUrl: z.string().url().optional(),
  eventUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  eventType: z.enum(["fundraiser", "rally", "meeting", "training", "social", "other"]).default("other"),
  visibility: z.enum(["public", "private", "members"]).default("public"),
});

const updateEventSchema = z.object({
  id: z.number(),
  name: z.string().max(255).optional(),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  location: z.string().max(255).optional(),
  locationAddress: z.string().optional(),
  locationLatitude: z.string().optional(),
  locationLongitude: z.string().optional(),
  organizerName: z.string().max(255).optional(),
  organizerEmail: z.string().email().optional(),
  organizerPhone: z.string().optional(),
  organizerUrl: z.string().url().optional(),
  eventUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  eventType: z.enum(["fundraiser", "rally", "meeting", "training", "social", "other"]).optional(),
  visibility: z.enum(["public", "private", "members"]).optional(),
});

const organizerRequestSchema = z.object({
  email: z.string().email("Valid email required"),
  name: z.string().min(1, "Name is required").max(255),
  organizationName: z.string().min(1, "Organization name is required").max(255),
  organizationType: z.enum(["committee", "club", "group", "campaign", "party", "other"]).default("other"),
  phone: z.string().optional(),
  message: z.string().optional(),
});

// Admin-only procedure
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  events: router({
    // Public procedures
    list: publicProcedure
      .input(
        z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          search: z.string().optional(),
          eventType: z.string().optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return getApprovedEvents({
          startDate: input.startDate,
          endDate: input.endDate,
          search: input.search,
          eventType: input.eventType,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const event = await getEventById(input.id);
        if (!event || event.status !== "approved") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }
        return event;
      }),

    submit: publicProcedure
      .input(eventInputSchema)
      .mutation(async ({ input, ctx }) => {
        // If user is not authenticated, they can still submit but event will be pending
        // If user is authenticated and is a representative, event is auto-approved
        const userId = ctx.user?.id;
        if (!userId) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Must be logged in to submit events" });
        }

        const isRepresentative = ctx.user?.role === "representative";

        const event = await createEvent({
          ...input,
          submittedBy: userId,
          status: isRepresentative ? "approved" : "pending",
          submittedAt: new Date(),
          approvedBy: isRepresentative ? userId : undefined,
          approvedAt: isRepresentative ? new Date() : undefined,
        });

        return {
          id: event.id,
          status: event.status,
          message: isRepresentative
            ? "Event submitted and automatically approved!"
            : "Event submitted for review. An admin will review it shortly.",
        };
      }),

    // Protected procedures (authenticated users)
    listSubmitted: protectedProcedure.query(async ({ ctx }) => {
      return getUserSubmittedEvents(ctx.user.id);
    }),

    updateOwn: protectedProcedure
      .input(updateEventSchema)
      .mutation(async ({ input, ctx }) => {
        const event = await getEventById(input.id);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }

        // Users can only edit their own events (unless admin)
        if (event.submittedBy !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Can only edit your own events" });
        }

        const { id, ...updates } = input;
        const updateData: Record<string, any> = {};
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined) {
            updateData[key] = value;
          }
        });
        await updateEvent(id, updateData);

        return {
          success: true,
          message: "Event updated successfully",
        };
      }),

    // Admin procedures
    listPending: adminProcedure
      .input(
        z.object({
          status: z.enum(["pending", "rejected"]).optional(),
          limit: z.number().optional(),
          offset: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        return getPendingEvents({
          status: input.status,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const event = await getEventById(input.id);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }

        await approveEvent(input.id, ctx.user.id);

        return {
          success: true,
          message: "Event approved and published",
        };
      }),

    reject: adminProcedure
      .input(
        z.object({
          id: z.number(),
          reason: z.string().min(1, "Rejection reason required"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const event = await getEventById(input.id);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }

        await rejectEvent(input.id, ctx.user.id, input.reason);

        return {
          success: true,
          message: "Event rejected",
        };
      }),

    update: adminProcedure
      .input(updateEventSchema)
      .mutation(async ({ input, ctx }) => {
        const event = await getEventById(input.id);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }

        const { id, ...updates } = input;
        const updateData: Record<string, any> = {};
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined) {
            updateData[key] = value;
          }
        });
        await updateEvent(id, updateData);

        return {
          success: true,
          message: "Event updated successfully",
        };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const event = await getEventById(input.id);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
        }

        await deleteEvent(input.id);

        return {
          success: true,
          message: "Event deleted",
        };
      }),
  }),

  organizerRequests: router({
    submit: publicProcedure
      .input(organizerRequestSchema)
      .mutation(async ({ input }) => {
        const request = await createOrganizerRequest({
          email: input.email,
          name: input.name,
          organizationName: input.organizationName,
          organizationType: input.organizationType,
          phone: input.phone,
          message: input.message,
          status: "pending",
        });
        return {
          success: true,
          message: "Your request has been submitted. We'll review it and contact you soon.",
          id: request.id,
        };
      }),

    listPending: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        const { requests, total } = await getPendingOrganizerRequests(input.limit, input.offset);
        return { requests, total };
      }),

    approve: adminProcedure
      .input(z.object({ id: z.number(), organizationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const request = await getOrganizerRequestById(input.id);
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }

        const approved = await approveOrganizerRequest(input.id, ctx.user.id, input.organizationId);
        return {
          success: true,
          message: "Organizer request approved",
          request: approved,
        };
      }),

    reject: adminProcedure
      .input(z.object({ id: z.number(), reason: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const request = await getOrganizerRequestById(input.id);
        if (!request) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }

        const rejected = await rejectOrganizerRequest(input.id, ctx.user.id, input.reason);
        return {
          success: true,
          message: "Organizer request rejected",
          request: rejected,
        };
      }),
  }),

  rss: router({
    feed: publicProcedure.query(async () => {
      const baseUrl = process.env.VITE_APP_ID ? `https://${process.env.VITE_APP_ID}.manus.space` : "http://localhost:3000";
      const feed = await generateRSSFeed(baseUrl);
      return feed;
    }),
  }),
});

export type AppRouter = typeof appRouter;
