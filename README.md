# Delaware Right Now

A community-driven calendar for conservative and Republican events across Delaware. Discover, organize, and share with committees, clubs, campaigns, and community leaders.

**Live Site**: [delawarerightnow.com](https://delawarerightnow.com)

## Overview

Delaware Right Now is a centralized event management platform designed to help Delaware's conservative and Republican community discover and organize political events. The platform enables organizers to submit events, manage recurring meetings, and reach a broader audience while allowing community members to browse and stay informed about upcoming activities.

## Key Features

### Event Management
- **Event Submission Form** - Intuitive form for organizers to submit events with comprehensive details
- **Simplified Date/Time Handling** - Users enter just time and duration; dates are calculated automatically
- **Recurring Monthly Meetings** - Support for recurring meetings with nth day-of-week selection (1st-4th and Last) and month selection for seasonal breaks
- **All-Day Events** - Checkbox option to mark events as all-day with no specific time
- **Duration Fields** - Flexible duration input with units (minutes, hours, days)

### Location Management
- **Google Places Autocomplete** - Address autocomplete powered by Google Places API with new AutocompleteSuggestion and Place APIs
- **Location Coordinates** - Automatic extraction of latitude/longitude from selected addresses
- **Public/Private Visibility** - Control whether event locations are shown or masked

### Event Types
- Fundraisers
- Rallies
- Meetings
- Training Events

### Data & Timezone Handling
- **UTC Storage** - All event times stored in UTC for consistency across timezones
- **Timezone Conversion** - Frontend captures user's timezone and converts local time to UTC before saving
- **Accurate Display** - Events display in user's local timezone when retrieved

### Technical Features
- **Manus OAuth Authentication** - Secure user authentication with Manus OAuth
- **Database Integration** - MySQL/TiDB database for persistent event storage
- **tRPC API** - Type-safe API procedures with end-to-end type safety
- **React 19 + Tailwind CSS 4** - Modern frontend with responsive design
- **Express.js Backend** - Robust backend server with tRPC routing

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, TypeScript
- **Backend**: Express.js 4, tRPC 11, Node.js
- **Database**: MySQL/TiDB with Drizzle ORM
- **Authentication**: Manus OAuth
- **Maps**: Google Maps API with Places, Geocoding, and Directions services
- **Testing**: Vitest (46 tests passing)

## Setup Instructions

### Prerequisites
- Node.js 22.13.0+
- pnpm (package manager)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/chuckboyce/delaware-gop-events.git
   cd delaware-gop-events
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory with the following variables:
   ```
   DATABASE_URL=your_database_url
   JWT_SECRET=your_jwt_secret
   VITE_APP_ID=your_manus_app_id
   OAUTH_SERVER_URL=https://api.manus.im
   VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
   OWNER_OPEN_ID=your_owner_id
   OWNER_NAME=Your Name
   GOOGLE_PLACES_API_KEY=your_google_places_api_key
   BUILT_IN_FORGE_API_URL=https://api.manus.im
   BUILT_IN_FORGE_API_KEY=your_forge_api_key
   VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_key
   VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
   VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint
   VITE_ANALYTICS_WEBSITE_ID=your_website_id
   ```

4. **Set up the database**
   ```bash
   pnpm db:push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

### Running Tests

```bash
pnpm test
```

This runs all Vitest tests including:
- Date calculation tests (27 tests)
- Timezone conversion tests (19 tests)

## Project Structure

```
├── client/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── lib/             # Utilities and helpers
│   │   ├── App.tsx          # Main app component
│   │   └── index.css        # Global styles
│   └── index.html
├── server/
│   ├── db.ts                # Database queries
│   ├── routers.ts           # tRPC procedures
│   ├── auth.logout.test.ts  # Auth tests
│   ├── date-calculation.test.ts
│   └── timezone-conversion.test.ts
├── drizzle/
│   └── schema.ts            # Database schema
├── storage/                 # S3 storage helpers
└── package.json
```

## Key Files

- **`client/src/pages/SubmitEvent.tsx`** - Event submission form with all form fields and validation
- **`client/src/components/GooglePlacesAutocomplete.tsx`** - Google Places address autocomplete component
- **`server/routers.ts`** - tRPC procedures for event submission, retrieval, and management
- **`drizzle/schema.ts`** - Database schema definition for events and related tables
- **`server/date-calculation.test.ts`** - Tests for date and duration calculations

## Features in Development

- Event detail pages with embedded Google Maps
- Event pagination and filtering
- Organizer dashboard for managing submitted events
- Email notifications for event submissions
- Social sharing buttons (Facebook, Twitter, LinkedIn)
- Event analytics and view tracking

## API Endpoints

All API endpoints use tRPC and are available under `/api/trpc`:

### Event Management
- `events.submit` - Submit a new event
- `events.list` - Get list of events with pagination
- `events.getById` - Get event details by ID
- `events.update` - Update event details (organizer only)
- `events.delete` - Delete event (organizer only)

### Configuration
- `config.googlePlacesApiKey` - Get Google Places API key for frontend

### Authentication
- `auth.me` - Get current user info
- `auth.logout` - Log out current user

## Timezone Handling

The application uses UTC timestamps for all event storage to ensure consistency across timezones:

1. **Frontend**: User selects local time and duration
2. **Conversion**: Frontend captures user's timezone offset and converts to UTC
3. **Storage**: UTC timestamp stored in database
4. **Display**: Events converted back to user's local timezone when displayed

Example: A user in EST (UTC-5) creating a 2 PM event:
- User enters: 14:00 (2 PM local time)
- Stored as: 19:00 UTC (2 PM + 5 hours)
- Displayed to user: 14:00 (converted back to local timezone)

## Google Places Integration

The application uses Google Places API for address autocomplete:

- **API Version**: New AutocompleteSuggestion and Place APIs (migrated from deprecated AutocompleteService)
- **Features**: Address suggestions, coordinates extraction, place details
- **Performance**: Async script loading with `loading=async` parameter
- **Session Tokens**: Uses session tokens for billing optimization

## Testing

The project includes comprehensive test coverage:

### Date Calculation Tests (27 tests)
- Duration conversion (minutes, hours, days)
- End date calculation
- Month boundary handling
- Leap year handling

### Timezone Conversion Tests (19 tests)
- EST, CET, UTC, and other timezone conversions
- Early morning and late night edge cases
- Cross-timezone calculations

Run tests with:
```bash
pnpm test
```

## Deployment

The application is deployed on Manus platform at:
- **Sandbox**: https://3000-iiu8ostlktmgx9fbtp222-2020ef04.manusvm.computer
- **Custom Domain**: https://delawarerightnow.com

To deploy updates:
1. Create a checkpoint in the Manus UI
2. Click the "Publish" button to deploy

## Contributing

To contribute to this project:

1. Create a feature branch from `main`
2. Make your changes and add tests
3. Run `pnpm test` to ensure all tests pass
4. Commit with clear commit messages
5. Push to your fork and create a pull request

## Known Issues & Limitations

- **CORS Configuration**: The custom domain deployment requires CORS configuration on the Manus API infrastructure (contact Manus support for resolution)
- **Google Places Autocomplete**: Requires valid Google Places API key with appropriate permissions

## Support & Feedback

For issues, feature requests, or questions:
- Create an issue on [GitHub](https://github.com/chuckboyce/delaware-gop-events/issues)
- Contact the project maintainer

## License

This project is open source and available under the MIT License.

## Acknowledgments

Built with:
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [Drizzle ORM](https://orm.drizzle.team)
- [Google Maps API](https://developers.google.com/maps)
- [Manus Platform](https://manus.im)

---

**Last Updated**: December 14, 2025
