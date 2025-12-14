import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Users, Globe, Lock } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const calendarFeedUrl = typeof window !== "undefined" ? `${window.location.origin}/api/calendar.ics` : "/api/calendar.ics";
  const rssFeedUrl = typeof window !== "undefined" ? `${window.location.origin}/api/rss` : "/api/rss";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
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
              onClick={() => setLocation("/events")}
              className="hover:opacity-80 transition-opacity"
            >
              Events
            </button>
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">{user?.name}</span>
                <button
                  onClick={() => setLocation("/dashboard")}
                  className="px-4 py-2 bg-accent text-white rounded-md hover:opacity-90 transition-opacity"
                >
                  Dashboard
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLocation("/submit")}
                className="px-4 py-2 bg-accent text-white rounded-md hover:opacity-90 transition-opacity"
              >
                Submit Event
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-blue-900 text-primary-foreground py-20">
        <div className="container">
          <div className="max-w-3xl">
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Delaware Right Now
            </h2>
            <p className="text-xl mb-8 opacity-90">
              A community-driven calendar for conservative and Republican events across Delaware. 
              Discover, organize, and share with committees, clubs, campaigns, and community leaders.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => setLocation("/events")}
                className="bg-accent hover:bg-red-700 text-white px-8 py-3 text-lg"
              >
                Browse Events
              </Button>
              <Button
                onClick={() => setLocation("/submit")}
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg"
              >
                Submit Event
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-off-white">
        <div className="container">
          <h3 className="text-3xl font-bold text-center mb-16 text-foreground">
            How It Works
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <Calendar className="w-12 h-12 text-accent" />
              </div>
              <h4 className="text-lg font-semibold mb-3 text-foreground">
                Submit Events
              </h4>
              <p className="text-muted-foreground">
                Anyone can submit events. Representatives get instant approval; public submissions are reviewed.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <Users className="w-12 h-12 text-accent" />
              </div>
              <h4 className="text-lg font-semibold mb-3 text-foreground">
                Organize Together
              </h4>
              <p className="text-muted-foreground">
                One organizer can manage multiple organizations. Discover recurring meetings and events.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <Globe className="w-12 h-12 text-accent" />
              </div>
              <h4 className="text-lg font-semibold mb-3 text-foreground">
                Syndicate Widely
              </h4>
              <p className="text-muted-foreground">
                RSS feed available for any website. Share events across your platforms effortlessly.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <Lock className="w-12 h-12 text-accent" />
              </div>
              <h4 className="text-lg font-semibold mb-3 text-foreground">
                Privacy Options
              </h4>
              <p className="text-muted-foreground">
                Mark events as public, private, or members-only. Location details masked when needed.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Subscribe & Syndicate Section */}
      <section className="py-20 bg-white border-t border-border">
        <div className="container">
          <h3 className="text-3xl font-bold text-center mb-4 text-foreground">
            Subscribe &amp; Syndicate
          </h3>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Add Delaware Right Now events to your website, calendar app, or email. Choose the method that works best for you.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Calendar Feed */}
            <Card className="p-8">
              <h4 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Add to Your Calendar
              </h4>
              <p className="text-muted-foreground mb-6">
                Subscribe to our calendar feed in Google Calendar, Outlook, Apple Calendar, or any calendar app that supports iCal.
              </p>
              <div className="bg-muted p-4 rounded-md mb-4 font-mono text-sm break-all">
                {calendarFeedUrl}
              </div>
              <ol className="text-sm text-muted-foreground space-y-2 mb-4">
                <li><strong>1.</strong> Copy the URL above</li>
                <li><strong>2.</strong> Open your calendar app</li>
                <li><strong>3.</strong> Select "Subscribe to Calendar" or "Add Calendar Feed"</li>
                <li><strong>4.</strong> Paste the URL and save</li>
              </ol>
              <button
                onClick={() => copyToClipboard(calendarFeedUrl, "Calendar feed URL")}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-blue-900 transition-colors"
              >
                Copy Calendar Feed URL
              </button>
            </Card>

            {/* RSS Feed */}
            <Card className="p-8">
              <h4 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
                <Globe className="w-5 h-5 text-accent" />
                Add to Your Website
              </h4>
              <p className="text-muted-foreground mb-6">
                Embed our RSS feed on your website to automatically display the latest events.
              </p>
              <div className="bg-muted p-4 rounded-md mb-4 font-mono text-sm break-all">
                {rssFeedUrl}
              </div>
              <ol className="text-sm text-muted-foreground space-y-2 mb-4">
                <li><strong>1.</strong> Copy the RSS feed URL above</li>
                <li><strong>2.</strong> Use an RSS widget or plugin on your site</li>
                <li><strong>3.</strong> Paste the URL to display events automatically</li>
                <li><strong>4.</strong> Events update in real-time as they are approved</li>
              </ol>
              <button
                onClick={() => copyToClipboard(rssFeedUrl, "RSS feed URL")}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-blue-900 transition-colors"
              >
                Copy RSS Feed URL
              </button>
            </Card>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-sm text-foreground">
              <strong>Need help?</strong> Both feeds update automatically with approved events. Location details are masked for private and members-only events.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h3 className="text-3xl font-bold mb-6">
            Ready to Get Started?
          </h3>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Submit your first event or request organizer access to manage multiple events for your organization.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={() => setLocation("/submit")}
              className="bg-accent hover:bg-red-700 text-white px-8 py-3"
            >
              Submit Event
            </Button>
            <Button
              onClick={() => setLocation("/events")}
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 py-3"
            >
              View All Events
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-primary-foreground py-12">
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
                <li><button onClick={() => setLocation("/events")} className="hover:opacity-100">Browse Events</button></li>
                <li><button onClick={() => setLocation("/submit")} className="hover:opacity-100">Submit Event</button></li>
                <li><a href="/api/rss" className="hover:opacity-100">RSS Feed</a></li>
                <li><a href="/api/calendar.ics" className="hover:opacity-100">Calendar Feed</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-sm opacity-80">
                Questions? Contact us for more information.
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
