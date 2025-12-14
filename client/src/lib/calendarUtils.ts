/**
 * Utility functions for generating calendar links and files
 */

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  url?: string;
}

/**
 * Generate Google Calendar URL
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    location: event.location,
    dates: formatGoogleCalendarDates(event.startDate, event.endDate),
  });

  if (event.url) {
    params.append("url", event.url);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Format dates for Google Calendar (YYYYMMDDTHHMMSS/YYYYMMDDTHHMMSS)
 */
function formatGoogleCalendarDates(startDate: Date, endDate?: Date): string {
  const start = formatDateForCalendar(startDate);
  const end = endDate ? formatDateForCalendar(endDate) : formatDateForCalendar(new Date(startDate.getTime() + 3600000)); // Default 1 hour duration
  return `${start}/${end}`;
}

/**
 * Format date for calendar (YYYYMMDDTHHMMSS)
 */
function formatDateForCalendar(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Generate iCal (.ics) file content
 */
export function generateICalContent(event: CalendarEvent): string {
  const uid = `${Date.now()}@delawarerightNow`;
  const dtstamp = formatICalDate(new Date());
  const dtstart = formatICalDate(event.startDate);
  const dtend = event.endDate ? formatICalDate(event.endDate) : formatICalDate(new Date(event.startDate.getTime() + 3600000));

  // Escape special characters in iCal format
  const escapeICalText = (text: string): string => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
      .replace(/\n/g, "\\n");
  };

  const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Delaware Right Now//Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Delaware Right Now Events
X-WR-TIMEZONE:America/New_York
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${escapeICalText(event.title)}
DESCRIPTION:${escapeICalText(event.description)}
LOCATION:${escapeICalText(event.location)}
${event.url ? `URL:${event.url}` : ""}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
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

/**
 * Download iCal file
 */
export function downloadICalFile(event: CalendarEvent): void {
  const icalContent = generateICalContent(event);
  const blob = new Blob([icalContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${event.title.replace(/\s+/g, "-").toLowerCase()}.ics`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate Outlook Web URL
 */
export function generateOutlookUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    rru: "addevent",
    startdt: formatOutlookDate(event.startDate),
    enddt: event.endDate ? formatOutlookDate(event.endDate) : formatOutlookDate(new Date(event.startDate.getTime() + 3600000)),
    subject: event.title,
    body: event.description,
    location: event.location,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Format date for Outlook (YYYY-MM-DDTHH:MM:SS)
 */
function formatOutlookDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
