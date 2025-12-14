# Delaware Conservative Event Database - Design Document

## Overview

This document outlines the database schema, API structure, and workflows for a centralized event management system supporting event submission, admin approval, public listing, and RSS syndication.

## Database Schema

### Core Tables

#### `events` Table

Stores all event submissions with schema.org Event compliance. The schema captures comprehensive event metadata to support structured data export, RSS generation, and public listing.

| Field | Type | Constraints | Purpose |
|-------|------|-----------|---------|
| `id` | int | PK, auto-increment | Unique event identifier |
| `name` | varchar(255) | NOT NULL | Event title (schema.org: name) |
| `description` | text | NOT NULL | Event description (schema.org: description) |
| `startDate` | timestamp | NOT NULL | Event start date/time (schema.org: startDate, ISO 8601) |
| `endDate` | timestamp | | Event end date/time (schema.org: endDate, ISO 8601) |
| `location` | varchar(255) | NOT NULL | Physical location (schema.org: location.name) |
| `locationAddress` | text | | Full address for structured data (schema.org: location.address) |
| `locationLatitude` | decimal(10,8) | | Venue latitude (schema.org: location.geo.latitude) |
| `locationLongitude` | decimal(10,8) | | Venue longitude (schema.org: location.geo.longitude) |
| `organizerName` | varchar(255) | NOT NULL | Organization/person name (schema.org: organizer.name) |
| `organizerEmail` | varchar(320) | NOT NULL | Contact email (schema.org: organizer.email) |
| `organizerPhone` | varchar(20) | | Contact phone (schema.org: organizer.telephone) |
| `organizerUrl` | varchar(2048) | | Organizer website (schema.org: organizer.url) |
| `eventUrl` | varchar(2048) | | Event details URL (schema.org: url) |
| `imageUrl` | varchar(2048) | | Event image (schema.org: image) |
| `eventType` | enum | | Event category (e.g., 'fundraiser', 'rally', 'meeting', 'training', 'social') |
| `status` | enum | NOT NULL, default 'pending' | Submission status: 'pending', 'approved', 'rejected' |
| `submittedBy` | int | FK → users.id | User who submitted the event |
| `submittedAt` | timestamp | NOT NULL, default now | Submission timestamp |
| `approvedBy` | int | FK → users.id, nullable | Admin who approved/rejected |
| `approvedAt` | timestamp | nullable | Approval/rejection timestamp |
| `rejectionReason` | text | nullable | Reason for rejection |
| `createdAt` | timestamp | NOT NULL, default now | Record creation time |
| `updatedAt` | timestamp | NOT NULL, default now, auto-update | Record last modification time |

**Schema.org Mapping:**
- Full Event object compliance with properties: name, description, startDate, endDate, location, organizer, url, image
- Location supports both simple (name) and structured (address, geo) representations
- Organizer includes name, email, phone, and URL
- Extensible via imageUrl for rich media in RSS feeds

#### `users` Table (Extended)

The existing users table is extended with a `role` field to support role-based access control.

| Field | Type | Constraints | Purpose |
|-------|------|-----------|---------|
| `role` | enum | default 'user' | User role: 'user', 'representative', 'admin' |

**Roles:**
- `user`: Can submit events (requires approval)
- `representative`: Pre-approved user; events auto-approved on submission
- `admin`: Full access to approve/reject/edit all events and manage representatives

## API Procedures (tRPC)

### Public Procedures

#### `events.submit`
Submit a new event for approval or immediate publication (if representative).

**Input:**
```ts
{
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  locationAddress?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
  organizerUrl?: string;
  eventUrl?: string;
  imageUrl?: string;
  eventType: 'fundraiser' | 'rally' | 'meeting' | 'training' | 'social';
}
```

**Output:**
```ts
{
  id: number;
  status: 'pending' | 'approved';
  message: string;
}
```

**Behavior:**
- If user is `representative`, event is auto-approved (status = 'approved')
- If user is `user`, event is pending (status = 'pending')
- Returns event ID and status

#### `events.list`
Retrieve all approved events with optional filtering and search.

**Input:**
```ts
{
  startDate?: Date;
  endDate?: Date;
  search?: string;
  eventType?: string;
  limit?: number;
  offset?: number;
}
```

**Output:**
```ts
{
  events: Event[];
  total: number;
}
```

**Behavior:**
- Returns only approved events
- Supports date range filtering
- Supports full-text search on name and description
- Supports event type filtering
- Includes pagination via limit/offset

#### `events.getById`
Retrieve a single approved event by ID.

**Input:**
```ts
{
  id: number;
}
```

**Output:**
```ts
Event | null
```

### Protected Procedures (Authenticated Users)

#### `events.listSubmitted`
List events submitted by the current user.

**Output:**
```ts
Event[]
```

### Admin Procedures (Admin Role Only)

#### `events.listPending`
List all pending and rejected events for review.

**Input:**
```ts
{
  status?: 'pending' | 'rejected';
  limit?: number;
  offset?: number;
}
```

**Output:**
```ts
{
  events: Event[];
  total: number;
}
```

#### `events.approve`
Approve a pending event.

**Input:**
```ts
{
  id: number;
}
```

**Output:**
```ts
{
  success: boolean;
  message: string;
}
```

#### `events.reject`
Reject a pending event.

**Input:**
```ts
{
  id: number;
  reason: string;
}
```

**Output:**
```ts
{
  success: boolean;
  message: string;
}
```

#### `events.update`
Update event details (admin can edit any event; representatives can edit their own).

**Input:**
```ts
{
  id: number;
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  locationAddress?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  organizerName?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  organizerUrl?: string;
  eventUrl?: string;
  imageUrl?: string;
  eventType?: string;
}
```

**Output:**
```ts
{
  success: boolean;
  message: string;
}
```

#### `events.delete`
Delete an event (admin only).

**Input:**
```ts
{
  id: number;
}
```

**Output:**
```ts
{
  success: boolean;
  message: string;
}
```

#### `representatives.list`
List all representatives.

**Output:**
```ts
{
  id: number;
  name: string;
  email: string;
  organization?: string;
}[]
```

#### `representatives.add`
Add a user as a representative.

**Input:**
```ts
{
  userId: number;
  organization?: string;
}
```

**Output:**
```ts
{
  success: boolean;
  message: string;
}
```

#### `representatives.remove`
Remove representative status from a user.

**Input:**
```ts
{
  userId: number;
}
```

**Output:**
```ts
{
  success: boolean;
  message: string;
}
```

### Public RSS Endpoint

#### `GET /api/rss`

Returns valid RSS 2.0 XML feed of all approved events.

**Features:**
- Includes all approved events sorted by start date (ascending)
- Each item includes:
  - title (event name)
  - description (event description with location and organizer)
  - pubDate (approval date)
  - link (event URL or public event page)
  - guid (unique event identifier)
  - enclosure (event image if available)
- Valid RSS 2.0 schema compliance
- Proper XML encoding and escaping

## User Workflows

### Public User Submission
1. User navigates to submission form
2. Fills in event details
3. Submits form
4. Event created with status = 'pending'
5. Admin reviews and approves/rejects
6. User notified of status (future enhancement)

### Representative Submission
1. Representative logs in
2. Navigates to submission form
3. Fills in event details
4. Submits form
5. Event created with status = 'approved' (auto-approved)
6. Event immediately appears in public listing

### Admin Approval Workflow
1. Admin logs in
2. Views pending events dashboard
3. Reviews event details
4. Can edit event details before approval
5. Approves event → status = 'approved', appears in public listing
6. Or rejects event → status = 'rejected', includes rejection reason

### Public Event Discovery
1. User visits public event listing page
2. Sees all approved events sorted by date
3. Can filter by date range
4. Can search by keyword
5. Can view event details
6. Can subscribe to RSS feed

## RSS Feed Specification

**Format:** RSS 2.0 (RFC 2822 compliant)

**Channel Properties:**
- title: "Delaware Conservative Events"
- link: Base URL of the application
- description: "Centralized calendar of conservative and Republican events in Delaware"
- language: "en-us"
- lastBuildDate: Current timestamp

**Item Properties (per event):**
- title: Event name
- description: Event description, location, organizer, and contact info
- pubDate: Approval date (RFC 2822 format)
- link: Event URL or public event page
- guid: Unique identifier (event ID)
- enclosure: Event image (if available)
- category: Event type

## Technical Considerations

### Data Validation
- All date/time inputs validated and stored as UTC timestamps
- Email validation for organizer contact
- URL validation for event and organizer URLs
- Location data supports both simple strings and structured addresses

### Performance
- Index on `status` and `startDate` for efficient filtering
- Index on `submittedBy` for user event lookups
- Pagination support for large event lists

### Security
- Role-based access control enforced at procedure level
- Users can only edit their own submitted events (non-admins)
- Admins have full edit/delete capabilities
- Input sanitization for all text fields before storage and output

### SEO & Structured Data
- Full schema.org Event compliance enables rich snippets
- RSS feed enables content syndication
- Structured data can be exported as JSON-LD for web pages

## Future Enhancements

1. Event image uploads to S3 storage
2. Email notifications for submission status changes
3. Recurring event support
4. Event categories and tags
5. User notifications/subscriptions
6. Analytics on event views and RSS feed consumption
7. iCalendar (.ics) feed export
8. Event import from external calendars
