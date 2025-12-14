import { Request, Response } from "express";
import { getApprovedEvents } from "../db";

/**
 * Express endpoint handler for /api/calendar.ics
 * Returns iCal feed of all approved events for calendar subscription
 */
export async function handleCalendarFeed(req: Request, res: Response): Promise<void> {
  try {
    const result = await getApprovedEvents();
    const events = result.events;

    // Generate iCal content
    const icalContent = generateCalendarFeed(events);

    res.setHeader("Content-Type", "text/calendar;charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="delaware-right-now.ics"');
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(icalContent);
  } catch (error) {
    console.error("[Calendar Feed] Error generating feed:", error);
    res.status(500).json({
      error: "Failed to generate calendar feed",
    });
  }
}

/**
 * Generate iCal feed content for all events
 */
function generateCalendarFeed(
  events: Array<{
    id: number;
    name: string;
    description: string;
    startDate: Date;
    endDate: Date | null;
    location: string;
    visibility: "public" | "private" | "members";
    eventUrl: string | null;
  }>
): string {
  const now = new Date();
  const lastBuildDate = formatICalDate(now);

  // Escape special characters for iCal
  const escapeICalText = (text: string): string => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "");
  };

  // Build event entries
  const eventEntries = events
    .map((event) => {
      const uid = `event-${event.id}@delawarerightNow`;
      const dtstamp = formatICalDate(now);
      const dtstart = formatICalDate(event.startDate);
      const dtend = event.endDate ? formatICalDate(event.endDate) : formatICalDate(new Date(event.startDate.getTime() + 3600000));

      // Mask location for private/members events
      const location = event.visibility === "public" ? event.location : "Location details available upon request";

      return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${escapeICalText(event.name)}
DESCRIPTION:${escapeICalText(event.description)}
LOCATION:${escapeICalText(location)}
${event.eventUrl ? `URL:${event.eventUrl}` : ""}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT`;
    })
    .join("\n");

  const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Delaware Right Now//Events Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Delaware Right Now - Conservative & Republican Events
X-WR-DESCRIPTION:A community-driven calendar for conservative and Republican events across Delaware
X-WR-TIMEZONE:America/New_York
X-WR-CALDESC:Delaware Right Now Events
REFRESH-INTERVAL;VALUE=DURATION:PT1H
DTSTAMP:${lastBuildDate}
LAST-MODIFIED:${lastBuildDate}
${eventEntries}
END:VCALENDAR`;

  return ical;
}

/**
 * Format date for iCal (YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}
