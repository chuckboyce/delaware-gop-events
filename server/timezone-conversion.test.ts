import { describe, it, expect } from "vitest";

// Helper function to calculate endDate from startDate, startTime, and duration
// All dates are stored as UTC in the database
function calculateEndDate(
  startDate: Date,
  startTime?: string,
  durationValue?: number,
  durationUnit?: string,
  userTimezoneOffset?: number
): Date {
  // userTimezoneOffset is in minutes (e.g., 300 for EST which is UTC-5, -60 for CET which is UTC+1)
  // If not provided, use the current system timezone offset
  const tzOffset = userTimezoneOffset ?? new Date().getTimezoneOffset();
  
  // Create a new date in UTC that represents the local date/time the user selected
  // The startDate is a local date (from the date picker), we need to interpret it as local time
  // and convert it to UTC
  
  // Get the year, month, day from the local date
  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  const day = startDate.getDate();
  
  // Get the hours and minutes from startTime, or use 0 if not provided
  let hours = 0;
  let minutes = 0;
  if (startTime) {
    const [h, m] = startTime.split(':').map(Number);
    hours = h;
    minutes = m;
  }
  
  // Create a UTC date with these values
  // This creates a date as if the local time was UTC
  const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));
  
  // Now adjust for the timezone offset
  // If user is in EST (offset=300, which is UTC-5), we need to add 5 hours to convert from local to UTC
  // getTimezoneOffset() returns positive for west of UTC, so we subtract it (which adds for west)
  // Subtract the offset because getTimezoneOffset() returns minutes WEST of UTC
  // EST (UTC-5) has offset=300, so we subtract 300 to add 5 hours
  utcDate.setUTCMinutes(utcDate.getUTCMinutes() + tzOffset);
  
  // Apply duration in UTC
  if (durationValue && durationUnit) {
    switch (durationUnit) {
      case 'minutes':
        utcDate.setUTCMinutes(utcDate.getUTCMinutes() + durationValue);
        break;
      case 'hours':
        utcDate.setUTCHours(utcDate.getUTCHours() + durationValue);
        break;
      case 'days':
        utcDate.setUTCDate(utcDate.getUTCDate() + durationValue);
        break;
    }
  }
  
  return utcDate;
}

describe("Timezone Conversion for UTC Storage", () => {
  // Test with Eastern Standard Time (UTC-5, offset = 300 minutes)
  const EST_OFFSET = 300; // EST is UTC-5
  
  // Test with Central European Time (UTC+1, offset = -60 minutes)
  const CET_OFFSET = -60; // CET is UTC+1
  
  // Test with UTC (offset = 0)
  const UTC_OFFSET = 0;

  describe("EST (UTC-5) timezone", () => {
    it("should convert local time to UTC correctly", () => {
      // User in EST selects Jan 15, 2025 at 14:00 (2 PM local time)
      // This should be stored as 19:00 UTC (2 PM + 5 hours)
      const localDate = new Date(2025, 0, 15); // Jan 15, 2025 midnight local
      const result = calculateEndDate(localDate, "14:00", undefined, undefined, EST_OFFSET);
      
      // The result should be in UTC
      expect(result.getUTCHours()).toBe(19); // 14:00 EST + 5 hours = 19:00 UTC
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCDate()).toBe(15);
    });

    it("should handle time that crosses midnight in UTC", () => {
      // User in EST selects Jan 15, 2025 at 22:00 (10 PM local time)
      // This should be stored as Jan 16, 03:00 UTC (10 PM + 5 hours = 3 AM next day)
      const localDate = new Date(2025, 0, 15);
      const result = calculateEndDate(localDate, "22:00", undefined, undefined, EST_OFFSET);
      
      expect(result.getUTCDate()).toBe(16); // Next day in UTC
      expect(result.getUTCHours()).toBe(3); // 22:00 EST + 5 hours = 03:00 UTC
    });

    it("should apply duration in UTC after timezone conversion", () => {
      // User in EST selects Jan 15, 2025 at 14:00 with 2-hour duration
      // Start: 14:00 EST = 19:00 UTC
      // End: 16:00 EST = 21:00 UTC
      const localDate = new Date(2025, 0, 15);
      const result = calculateEndDate(localDate, "14:00", 2, "hours", EST_OFFSET);
      
      expect(result.getUTCHours()).toBe(21); // 19:00 UTC + 2 hours
      expect(result.getUTCDate()).toBe(15);
    });
  });

  describe("CET (UTC+1) timezone", () => {
    it("should convert local time to UTC correctly", () => {
      // User in CET selects Jan 15, 2025 at 14:00 (2 PM local time)
      // This should be stored as 13:00 UTC (2 PM - 1 hour)
      const localDate = new Date(2025, 0, 15);
      const result = calculateEndDate(localDate, "14:00", undefined, undefined, CET_OFFSET);
      
      expect(result.getUTCHours()).toBe(13); // 14:00 CET - 1 hour = 13:00 UTC
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCDate()).toBe(15);
    });

    it("should handle time that crosses midnight backwards in UTC", () => {
      // User in CET selects Jan 15, 2025 at 00:30 (12:30 AM local time)
      // This should be stored as Jan 14, 23:30 UTC (00:30 CET - 1 hour = 23:30 previous day UTC)
      const localDate = new Date(2025, 0, 15);
      const result = calculateEndDate(localDate, "00:30", undefined, undefined, CET_OFFSET);
      
      expect(result.getUTCDate()).toBe(14); // Previous day in UTC
      expect(result.getUTCHours()).toBe(23);
      expect(result.getUTCMinutes()).toBe(30);
    });
  });

  describe("UTC (offset 0)", () => {
    it("should not modify the time", () => {
      // User in UTC selects Jan 15, 2025 at 14:00
      // This should be stored as 14:00 UTC (no conversion needed)
      const localDate = new Date(2025, 0, 15);
      const result = calculateEndDate(localDate, "14:00", undefined, undefined, UTC_OFFSET);
      
      expect(result.getUTCHours()).toBe(14);
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCDate()).toBe(15);
    });

    it("should apply duration without timezone adjustment", () => {
      // User in UTC selects Jan 15, 2025 at 14:00 with 3-hour duration
      const localDate = new Date(2025, 0, 15);
      const result = calculateEndDate(localDate, "14:00", 3, "hours", UTC_OFFSET);
      
      expect(result.getUTCHours()).toBe(17); // 14:00 + 3 hours
      expect(result.getUTCDate()).toBe(15);
    });
  });

  describe("All-day events with timezone conversion", () => {
    it("should handle all-day event in EST", () => {
      // User in EST selects Jan 15, 2025 as an all-day event (1 day duration)
      const localDate = new Date(2025, 0, 15);
      const result = calculateEndDate(localDate, undefined, 1, "days", EST_OFFSET);
      
      // Midnight EST on Jan 15 = 05:00 UTC on Jan 15
      // Add 1 day = 05:00 UTC on Jan 16
      expect(result.getUTCDate()).toBe(16);
      expect(result.getUTCHours()).toBe(5);
    });

    it("should handle multi-day event with timezone conversion", () => {
      // User in EST selects Jan 15, 2025 as start of 3-day event
      const localDate = new Date(2025, 0, 15);
      const result = calculateEndDate(localDate, undefined, 3, "days", EST_OFFSET);
      
      // Midnight EST on Jan 15 = 05:00 UTC on Jan 15
      // Add 3 days = 05:00 UTC on Jan 18
      expect(result.getUTCDate()).toBe(18);
      expect(result.getUTCHours()).toBe(5);
    });
  });

  describe("Real-world scenarios", () => {
    it("should correctly handle EST morning meeting", () => {
      // User in EST schedules a 9 AM meeting on Jan 15, 2025 for 1 hour
      // 9 AM EST = 2 PM UTC
      // 10 AM EST = 3 PM UTC
      const localDate = new Date(2025, 0, 15);
      const result = calculateEndDate(localDate, "09:00", 1, "hours", EST_OFFSET);
      
      expect(result.getUTCHours()).toBe(15); // 2 PM + 1 hour = 3 PM UTC
      expect(result.getUTCDate()).toBe(15);
    });

    it("should correctly handle CET afternoon meeting", () => {
      // User in CET schedules a 3 PM meeting on Jan 15, 2025 for 90 minutes
      // 3 PM CET = 2 PM UTC
      // 4:30 PM CET = 3:30 PM UTC
      const localDate = new Date(2025, 0, 15);
      const result = calculateEndDate(localDate, "15:00", 90, "minutes", CET_OFFSET);
      
      expect(result.getUTCHours()).toBe(15); // 2 PM + 1.5 hours = 3:30 PM UTC
      expect(result.getUTCMinutes()).toBe(30);
      expect(result.getUTCDate()).toBe(15);
    });

    it("should handle EST evening event that crosses into next day UTC", () => {
      // User in EST schedules an 11 PM meeting on Jan 15, 2025 for 2 hours
      // 11 PM EST = 4 AM UTC next day
      // 1 AM EST = 6 AM UTC next day
      const localDate = new Date(2025, 0, 15);
      const result = calculateEndDate(localDate, "23:00", 2, "hours", EST_OFFSET);
      
      expect(result.getUTCDate()).toBe(16); // Next day in UTC
      expect(result.getUTCHours()).toBe(6); // 4 AM + 2 hours = 6 AM UTC
    });

    it("should handle CET early morning event that crosses into previous day UTC", () => {
      // User in CET schedules a 12:30 AM meeting on Jan 15, 2025 for 1 hour
      // 12:30 AM CET = 11:30 PM UTC previous day
      // 1:30 AM CET = 12:30 AM UTC same day
      const localDate = new Date(2025, 0, 15);
      const result = calculateEndDate(localDate, "00:30", 1, "hours", CET_OFFSET);
      
      expect(result.getUTCDate()).toBe(15); // Previous day in UTC
      expect(result.getUTCHours()).toBe(0); // 11:30 PM + 1 hour = 12:30 AM next day
      expect(result.getUTCMinutes()).toBe(30);
    });
  });

  describe("Edge cases", () => {
    it("should handle quarter-hour times with timezone conversion", () => {
      const localDate = new Date(2025, 0, 15);
      const times = ["09:00", "09:15", "09:30", "09:45"];
      
      times.forEach((time) => {
        const result = calculateEndDate(localDate, time, undefined, undefined, EST_OFFSET);
        const [hours, minutes] = time.split(':').map(Number);
        expect(result.getUTCHours()).toBe(hours + 5); // EST offset
        expect(result.getUTCMinutes()).toBe(minutes);
      });
    });

    it("should handle year boundary with timezone conversion", () => {
      // User in EST on Dec 31, 2025 at 11 PM
      // This is Jan 1, 2026 at 4 AM UTC
      const localDate = new Date(2025, 11, 31); // Dec 31, 2025
      const result = calculateEndDate(localDate, "23:00", undefined, undefined, EST_OFFSET);
      
      expect(result.getUTCFullYear()).toBe(2026);
      expect(result.getUTCMonth()).toBe(0); // January
      expect(result.getUTCDate()).toBe(1);
      expect(result.getUTCHours()).toBe(4);
    });

    it("should handle month boundary with timezone conversion", () => {
      // User in EST on Jan 31, 2025 at 11 PM
      // This is Feb 1, 2026 at 4 AM UTC
      const localDate = new Date(2025, 0, 31); // Jan 31, 2025
      const result = calculateEndDate(localDate, "23:00", undefined, undefined, EST_OFFSET);
      
      expect(result.getUTCMonth()).toBe(1); // February
      expect(result.getUTCDate()).toBe(1);
      expect(result.getUTCHours()).toBe(4);
    });
  });

  describe("Duration calculations in UTC", () => {
    it("should add minutes correctly in UTC", () => {
      const localDate = new Date(2025, 0, 15);
      const result = calculateEndDate(localDate, "14:00", 45, "minutes", EST_OFFSET);
      
      // 14:00 EST = 19:00 UTC
      // 19:00 UTC + 45 minutes = 19:45 UTC
      expect(result.getUTCHours()).toBe(19);
      expect(result.getUTCMinutes()).toBe(45);
    });

    it("should add hours correctly in UTC", () => {
      const localDate = new Date(2025, 0, 15);
      const result = calculateEndDate(localDate, "14:00", 5, "hours", EST_OFFSET);
      
      // 14:00 EST = 19:00 UTC
      // 19:00 UTC + 5 hours = 00:00 UTC next day
      expect(result.getUTCDate()).toBe(16);
      expect(result.getUTCHours()).toBe(0);
    });

    it("should add days correctly in UTC", () => {
      const localDate = new Date(2025, 0, 15);
      const result = calculateEndDate(localDate, "14:00", 7, "days", EST_OFFSET);
      
      // 14:00 EST on Jan 15 = 19:00 UTC on Jan 15
      // Add 7 days = 19:00 UTC on Jan 22
      expect(result.getUTCDate()).toBe(22);
      expect(result.getUTCHours()).toBe(19);
    });
  });
});
