# Delaware Conservative Event Database - TODO

## Phase 1: Database Schema & API Structure
- [ ] Design database schema with schema.org Event compliance
- [ ] Create DESIGN.md with complete specifications

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
- [ ] Integrate Google Places API for address autocomplete and validation
- [ ] Create admin dashboard layout
- [ ] Build pending events list for admin review
- [ ] Build pending organizer requests list for admin review
- [ ] Implement approve/reject functionality for events
- [ ] Implement approve/reject functionality for organizer requests
- [ ] Implement event editing (users edit own, admins override any)
- [ ] Write vitest tests for admin procedures

## Phase 4: Public Event Listing
- [ ] Create public event listing page
- [ ] Implement date range filtering
- [ ] Implement search functionality
- [ ] Implement event type filtering
- [ ] Add pagination support
- [ ] Create event detail view page
- [ ] Write vitest tests for public listing procedures

## Phase 5: RSS Feed Implementation
- [ ] Create RSS feed generation logic
- [ ] Implement /api/rss endpoint
- [ ] Validate RSS 2.0 XML output
- [ ] Test RSS feed with feed readers
- [ ] Add proper XML escaping and encoding
- [ ] Write vitest tests for RSS generation

## Phase 6: Testing & Refinement
- [ ] End-to-end testing of submission workflow
- [ ] End-to-end testing of approval workflow
- [ ] End-to-end testing of public listing
- [ ] End-to-end testing of RSS feed
- [ ] Test representative auto-approval
- [ ] Test role-based access control
- [ ] Performance testing with large event datasets

## Phase 7: Deployment & Documentation
- [ ] Create final checkpoint
- [ ] Document deployment instructions
- [ ] Provide user guide for admins and representatives
- [ ] Test on production environment


## Future Enhancements
- [ ] User event notifications (subscribe to categories, organizations, date ranges)
- [ ] Authenticated RSS feed for authorized organizations (full details on private/members events)
- [ ] API key system for organization access to full event data
- [ ] Social login options (Google, Facebook, Apple)
- [ ] Event calendar view
- [ ] Recurring event templates
- [ ] Event attendance tracking
- [ ] Email reminders for upcoming events
- [ ] Event analytics and reporting
