import { getDb } from "./db";
import { events } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Generate RSS 2.0 feed for approved events
 * Location details are masked for private/members events
 */
export async function generateRSSFeed(baseUrl: string): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get all approved events sorted by date
  const approvedEvents = await db
    .select()
    .from(events)
    .where(eq(events.status, "approved"))
    .orderBy(events.startDate);

  const now = new Date().toUTCString();
  const lastBuildDate = approvedEvents.length > 0
    ? new Date(approvedEvents[0].updatedAt).toUTCString()
    : now;

  // Escape XML special characters
  const escapeXml = (str: string | null | undefined): string => {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  // Format date to RFC 822 (required for RSS 2.0)
  const toRFC822 = (date: Date): string => {
    return new Date(date).toUTCString();
  };

  // Build RSS items
  const items = approvedEvents
    .map((event) => {
      const eventUrl = `${baseUrl}/events#event-${event.id}`;
      const shouldMaskLocation = event.visibility === "private" || event.visibility === "members";
      
      const location = shouldMaskLocation
        ? "Location details available upon request"
        : escapeXml(event.location);

      const address = shouldMaskLocation
        ? ""
        : event.locationAddress
          ? `<br/>Address: ${escapeXml(event.locationAddress)}`
          : "";

      const description = `
        <p><strong>${escapeXml(event.organizerName)}</strong> is organizing this event.</p>
        <p><strong>Date:</strong> ${escapeXml(toRFC822(event.startDate))}</p>
        <p><strong>Location:</strong> ${location}${address}</p>
        <p><strong>Type:</strong> ${escapeXml(event.eventType)}</p>
        <p><strong>Visibility:</strong> ${escapeXml(event.visibility)}</p>
        ${event.eventUrl ? `<p><a href="${escapeXml(event.eventUrl)}">Learn More</a></p>` : ""}
        <p>${escapeXml(event.description)}</p>
      `;

      return `
    <item>
      <title>${escapeXml(event.name)}</title>
      <link>${escapeXml(eventUrl)}</link>
      <guid isPermaLink="false">event-${event.id}@delawarerightnow.local</guid>
      <description>${description}</description>
      <pubDate>${toRFC822(event.createdAt)}</pubDate>
      <lastBuildDate>${toRFC822(event.updatedAt)}</lastBuildDate>
      <category>${escapeXml(event.eventType)}</category>
      <category>${escapeXml(event.visibility)}</category>
    </item>
      `;
    })
    .join("\n");

  // Build complete RSS feed
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Delaware Right Now - Events Calendar</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>A community-driven calendar for conservative and Republican events across Delaware</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <ttl>60</ttl>
    <image>
      <title>Delaware Right Now</title>
      <url>${escapeXml(baseUrl)}/favicon.ico</url>
      <link>${escapeXml(baseUrl)}</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return rss;
}
