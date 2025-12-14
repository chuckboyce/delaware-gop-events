import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown } from "lucide-react";
import {
  generateGoogleCalendarUrl,
  generateOutlookUrl,
  downloadICalFile,
  type CalendarEvent,
} from "@/lib/calendarUtils";

interface AddToCalendarProps {
  event: CalendarEvent;
  className?: string;
}

export default function AddToCalendar({ event, className = "" }: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(event);
    window.open(url, "_blank");
    setIsOpen(false);
  };

  const handleOutlook = () => {
    const url = generateOutlookUrl(event);
    window.open(url, "_blank");
    setIsOpen(false);
  };

  const handleICalDownload = () => {
    downloadICalFile(event);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        <Calendar className="w-4 h-4" />
        <span>Add to Calendar</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg z-50">
          <button
            onClick={handleGoogleCalendar}
            className="w-full text-left px-4 py-3 hover:bg-muted transition-colors first:rounded-t-md"
          >
            <div className="font-medium text-foreground">Google Calendar</div>
            <div className="text-xs text-muted-foreground">Add to your Google Calendar</div>
          </button>

          <button
            onClick={handleOutlook}
            className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-t border-border"
          >
            <div className="font-medium text-foreground">Outlook</div>
            <div className="text-xs text-muted-foreground">Add to Outlook Calendar</div>
          </button>

          <button
            onClick={handleICalDownload}
            className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-t border-border last:rounded-b-md"
          >
            <div className="font-medium text-foreground">Download iCal</div>
            <div className="text-xs text-muted-foreground">Save as .ics file</div>
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
