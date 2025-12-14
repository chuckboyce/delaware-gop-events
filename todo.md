# Delaware Right Now - TODO

## Phase 1: Database Schema & API Structure
- [x] Design database schema with schema.org Event compliance
- [x] Create DESIGN.md with complete specifications

## Phase 2: Database Implementation
- [x] Update drizzle schema with events table
- [x] Update users table with representative role
- [x] Run database migrations (pnpm db:push)
- [x] Create query helpers in server/db.ts for event operations
- [x] Implement tRPC procedures for event management
- [x] Write vitest tests for event procedures

## Phase 3: Event Submission & Admin Dashboard
- [x] Add visibility field (public/private/members) to events schema
- [x] Add organizations table for recurring event organizers
- [x] Add organizerAccess table for one user managing multiple organizations
- [x] Add organizerRequests table for tracking login requests
- [x] Add query helpers for organizer operations in server/db.ts
- [x] Implement tRPC procedures for organizer requests (submit, listPending, approve, reject)
- [x] Build event submission form component with visibility selector and "request login" checkbox
- [x] Implement form validation with Zod
- [x] Integrate Google Places API for address autocomplete and validation
- [x] Create admin dashboard layout
- [x] Build pending events list for admin review
- [x] Build pending organizer requests list for admin review
- [x] Implement approve/reject functionality for events
- [x] Implement approve/reject functionality for organizer requests
- [x] Implement event editing (users edit own, admins override any)
- [x] Add success confirmation message after event submission
- [x] Make logo clickable to return home
- [x] Add login/signup buttons to navigation
- [ ] Fix Google Places autocomplete not loading (debug API key)
- [ ] Add fallback full address field with street autocomplete
- [x] Remove latitude/longitude display fields from form (save silently to database)
- [x] Add organizer/organization filtering to events listing
- [x] Add recurring monthly meeting support (nth day-of-week + month selection)
- [x] Move event type field above date/time on submission form
- [x] Add conditional recurring options (only for meeting type)
- [x] Write vitest tests for recurring meeting feature (10 tests passing)
- [ ] Write vitest tests for admin procedures

## Phase 4: Public Event Listing
- [x] Create public event listing page
- [x] Implement date range filtering
- [x] Implement search functionality
- [x] Implement event type filtering
- [x] Add to Calendar feature (Google Calendar, Outlook, iCal)
- [ ] Add pagination support
- [ ] Create event detail view page
- [ ] Write vitest tests for public listing procedures

## Phase 5: RSS Feed Implementation
- [x] Create RSS feed generation logic
- [x] Implement /api/rss endpoint
- [x] Validate RSS 2.0 XML format
- [ ] Test RSS feed with feed readers
- [ ] Write vitest tests for RSS feed generation

## Phase 6: Public Calendar Feed
- [x] Create iCal feed generation logic for all approved events
- [x] Implement /api/calendar.ics endpoint for public subscription
- [x] Add calendar feed subscription link to home page
- [x] Add RSS feed syndication instructions to home page
- [ ] Test calendar feed with Google Calendar, Outlook, Apple Calendar

## Phase 7: Testing & Refinement
- [ ] End-to-end testing of submission workflow
- [ ] End-to-end testing of approval workflow
- [ ] End-to-end testing of public listing
- [ ] End-to-end testing of RSS feed
- [ ] End-to-end testing of calendar feed
- [ ] Test representative auto-approval
- [ ] Test role-based access control
- [ ] Performance testing with large event datasets

## Phase 8: Deployment & Documentation
- [ ] Create final checkpoint
- [ ] Document deployment instructions
- [ ] Provide user guide for admins and representatives
- [ ] Test on production environment

## Future Enhancements
- [ ] Set up social media accounts (Facebook, Twitter/X, Instagram, TikTok, LinkedIn, YouTube)
- [ ] Social sharing of events (Facebook, Twitter, LinkedIn, email)
- [ ] User event notifications (subscribe to categories, organizations, date ranges)
- [ ] Authenticated RSS feed for authorized organizations (full details on private/members events)
- [ ] API key system for organization access to full event data
- [ ] Social login options (Google, Facebook, Apple)
- [ ] Event calendar view (month/week/day)
- [ ] Recurring event templates
- [ ] Event attendance tracking
- [ ] Email reminders for upcoming events
- [ ] Event analytics and reporting
- [x] Simplify date/time fields: remove end date, use time + duration
- [x] Add "All Day" checkbox for events
- [x] Add duration fields (number + unit: minutes/hours/days)
- [x] Calculate dates from time and duration on backend
- [x] Update database schema to store duration info
- [x] Write tests for date calculation logic (27 tests passing)
- [ ] For recurring meetings, calculate dates starting from current month
- [ ] For one-time meetings, use current date with provided time
- [x] Fix timezone handling: convert local time to UTC before saving
- [x] Capture user's timezone on frontend
- [x] Update calculateEndDate to work with UTC
- [x] Write tests for UTC timezone conversion (19 tests passing)
