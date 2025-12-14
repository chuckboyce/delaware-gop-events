import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Users, Lock, Globe } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { format } from "date-fns";

export default function Events() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<"upcoming" | "all">("upcoming");

  const { data: eventsData, isLoading } = trpc.events.list.useQuery({});
  const events = eventsData?.events || [];

  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    let filtered = [...events];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.organizerName.toLowerCase().includes(query)
      );
    }

    // Event type filter
    if (eventTypeFilter !== "all") {
      filtered = filtered.filter((event) => event.eventType === eventTypeFilter);
    }

    // Date range filter
    if (dateRangeFilter === "upcoming") {
      const now = new Date();
      filtered = filtered.filter((event) => new Date(event.startDate) >= now);
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return filtered;
  }, [events, searchQuery, eventTypeFilter, dateRangeFilter]);

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "private":
        return <Lock className="w-4 h-4 text-amber-600" />;
      case "members":
        return <Users className="w-4 h-4 text-blue-600" />;
      default:
        return <Globe className="w-4 h-4 text-green-600" />;
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case "private":
        return "Private";
      case "members":
        return "Members Only";
      default:
        return "Public";
    }
  };

  const shouldMaskLocation = (visibility: string) => {
    return visibility === "private" || visibility === "members";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-primary text-primary-foreground shadow-md">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center font-bold">
              DE
            </div>
            <h1 className="text-xl font-bold">Delaware Right Now</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="hover:opacity-80 transition-opacity"
            >
              Home
            </button>
            <button
              onClick={() => setLocation("/submit")}
              className="px-4 py-2 bg-accent text-white rounded-md hover:opacity-90 transition-opacity"
            >
              Submit Event
            </button>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <section className="bg-gradient-to-r from-primary to-blue-900 text-primary-foreground py-12">
        <div className="container">
          <h2 className="text-4xl font-bold mb-2">Upcoming Events</h2>
          <p className="text-lg opacity-90">
            Discover conservative and Republican events happening across Delaware
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-off-white border-b border-border">
        <div className="container py-8">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Search Events
              </label>
              <input
                type="text"
                placeholder="Search by title, organizer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Event Type Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Event Type
              </label>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Types</option>
                <option value="fundraiser">Fundraiser</option>
                <option value="rally">Rally</option>
                <option value="meeting">Meeting</option>
                <option value="training">Training</option>
                <option value="social">Social Event</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date Range
              </label>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value as "upcoming" | "all")}
                className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="upcoming">Upcoming Events</option>
                <option value="all">All Events</option>
              </select>
            </div>
          </div>

          {/* RSS Feed Link */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-foreground">
              <strong>Subscribe to updates:</strong> Add our{" "}
              <a href="/api/rss" className="text-accent hover:underline font-medium">
                RSS feed
              </a>
              {" "}to your website or feed reader to automatically display Delaware Right Now events.
            </p>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="container py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {events.length === 0
                ? "No events have been approved yet. Check back soon!"
                : "No events match your search criteria."}
            </p>
            <Button
              onClick={() => setLocation("/submit")}
              className="bg-primary hover:bg-blue-900 text-white"
            >
              Submit the First Event
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredEvents && filteredEvents.map((event) => (
              <Card
                key={event.id}
                className="p-6 hover:shadow-lg transition-shadow border border-border"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-foreground">{event.name}</h3>
                      <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 rounded-full text-sm">
                        {getVisibilityIcon(event.visibility)}
                        <span className="text-foreground font-medium">
                          {getVisibilityLabel(event.visibility)}
                        </span>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="space-y-2 text-sm text-foreground">
                      {/* Date & Time */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-accent" />
                        <span>
                          {format(new Date(event.startDate), "EEE, MMM d, yyyy")} at{" "}
                          {format(new Date(event.startDate), "h:mm a")}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-accent" />
                        {shouldMaskLocation(event.visibility) ? (
                          <span className="italic text-muted-foreground">
                            Location details available upon request
                          </span>
                        ) : (
                          <span>{event.location}</span>
                        )}
                      </div>

                      {/* Organizer */}
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-accent" />
                        <span>
                          Organized by <strong>{event.organizerName}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex flex-col gap-2 md:w-48">
                    {event.eventUrl && (
                      <a
                        href={event.eventUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-accent hover:bg-red-700 text-white rounded-md text-center transition-colors"
                      >
                        Learn More
                      </a>
                    )}
                    {event.organizerEmail && (
                      <a
                        href={`mailto:${event.organizerEmail}`}
                        className="px-4 py-2 border border-accent text-accent hover:bg-accent/10 rounded-md text-center transition-colors"
                      >
                        Contact Organizer
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-primary-foreground py-12 mt-12">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">About</h4>
              <p className="text-sm opacity-80">
                Delaware Right Now is a community-driven calendar for conservative and Republican events across Delaware.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="text-sm space-y-2 opacity-80">
                <li>
                  <button onClick={() => setLocation("/")} className="hover:opacity-100">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => setLocation("/submit")} className="hover:opacity-100">
                    Submit Event
                  </button>
                </li>
                <li>
                  <a href="/api/rss" className="hover:opacity-100">
                    RSS Feed
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-sm opacity-80">
                Questions about an event? Contact the organizer directly through the event listing.
              </p>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 text-center text-sm opacity-80">
            <p>&copy; 2025 Delaware Right Now. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
