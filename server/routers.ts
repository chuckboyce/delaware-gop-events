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
  startTime: z.string().optional(),
  isAllDay: z.number().optional().default(0),
  durationValue: z.number().optional(),
  durationUnit: z.enum(["minutes", "hours", "days"]).optional(),
  userTimezoneOffset: z.number().optional(),
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
  isRecurring: z.number().optional().default(0),
  recurringPattern: z.string().optional(),
  recurringMonths: z.string().optional(),
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


// Helper function to calculate endDate from startDate, startTime, and duration
// All dates are stored as UTC in the database
function calculateEndDate(
  startDate: Date,
  startTime?: string,
  durationValue?: number,
  durationUnit?: string,
  userTimezoneOffset?: number
): Date {
  // userTimezoneOffset is in minutes (e.g., 300 for EST which is UTC-5, -60 for CET which is UTC+1)
  // If not provided, use the current system timezone offset
  const tzOffset = userTimezoneOffset ?? new Date().getTimezoneOffset();
  
  // Create a new date in UTC that represents the local date/time the user selected
  // The startDate is a local date (from the date picker), we need to interpret it as local time
  // and convert it to UTC
  
  // Get the year, month, day from the local date
  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  const day = startDate.getDate();
  
  // Get the hours and minutes from startTime, or use 0 if not provided
  let hours = 0;
  let minutes = 0;
  if (startTime) {
    const [h, m] = startTime.split(':').map(Number);
    hours = h;
    minutes = m;
  }
  
  // Create a UTC date with these values
  // This creates a date as if the local time was UTC
  const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));
  
  // Now adjust for the timezone offset
  // If user is in EST (offset=300, which is UTC-5), we need to add 5 hours to convert from local to UTC
  // getTimezoneOffset() returns positive for west of UTC, so we subtract it (which adds for west)
  // Subtract the offset because getTimezoneOffset() returns minutes WEST of UTC
  // EST (UTC-5) has offset=300, so we subtract 300 to add 5 hours
  utcDate.setUTCMinutes(utcDate.getUTCMinutes() + tzOffset);
  
  // Apply duration in UTC
  if (durationValue && durationUnit) {
    switch (durationUnit) {
      case 'minutes':
        utcDate.setUTCMinutes(utcDate.getUTCMinutes() + durationValue);
        break;
      case 'hours':
        utcDate.setUTCHours(utcDate.getUTCHours() + durationValue);
        break;
      case 'days':
        utcDate.setUTCDate(utcDate.getUTCDate() + durationValue);
        break;
    }
  }
  
  return utcDate;
}

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
        // Public users can submit (event pending)
        // Authenticated representatives/admins can submit (auto-approved)
        const userId = ctx.user?.id;
        const isRepresentative = ctx.user?.role === "representative" || ctx.user?.role === "admin";

        // Calculate endDate from startTime and duration if provided
        const endDate = input.durationValue && input.durationUnit 
          ? calculateEndDate(input.startDate, input.startTime, input.durationValue, input.durationUnit, input.userTimezoneOffset)
          : input.endDate;

        const event = await createEvent({
          ...input,
          endDate,
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

  config: router({
    googlePlacesApiKey: publicProcedure.query(() => {
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Google Places API key not configured" });
      }
      return { apiKey };
    }),
  }),
});

export type AppRouter = typeof appRouter;
