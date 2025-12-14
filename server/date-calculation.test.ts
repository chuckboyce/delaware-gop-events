import { describe, it, expect } from "vitest";

// Helper function to calculate endDate from startDate, startTime, and duration
function calculateEndDate(startDate: Date, startTime?: string, durationValue?: number, durationUnit?: string): Date {
  const endDate = new Date(startDate);
  
  if (startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    endDate.setHours(hours, minutes, 0, 0);
  }
  
  if (durationValue && durationUnit) {
    switch (durationUnit) {
      case 'minutes':
        endDate.setMinutes(endDate.getMinutes() + durationValue);
        break;
      case 'hours':
        endDate.setHours(endDate.getHours() + durationValue);
        break;
      case 'days':
        endDate.setDate(endDate.getDate() + durationValue);
        break;
    }
  }
  
  return endDate;
}

describe("Date Calculation Logic", () => {
  // Create a local date to avoid timezone offset issues
  const baseDate = new Date(2025, 0, 15); // January 15, 2025

  describe("Start time only (no duration)", () => {
    it("should set the time without changing the date", () => {
      const result = calculateEndDate(baseDate, "14:30");
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getDate()).toBe(15);
    });

    it("should handle midnight time", () => {
      const result = calculateEndDate(baseDate, "00:00");
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it("should handle end-of-day time", () => {
      const result = calculateEndDate(baseDate, "23:45");
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(45);
    });
  });

  describe("Duration in minutes", () => {
    it("should add minutes without crossing hour boundary", () => {
      const result = calculateEndDate(baseDate, "10:00", 30, "minutes");
      expect(result.getHours()).toBe(10);
      expect(result.getMinutes()).toBe(30);
    });

    it("should add minutes and cross hour boundary", () => {
      const result = calculateEndDate(baseDate, "10:45", 30, "minutes");
      expect(result.getHours()).toBe(11);
      expect(result.getMinutes()).toBe(15);
    });

    it("should add minutes and cross day boundary", () => {
      const result = calculateEndDate(baseDate, "23:45", 30, "minutes");
      expect(result.getDate()).toBe(16);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(15);
    });

    it("should handle 1 minute duration", () => {
      const result = calculateEndDate(baseDate, "12:00", 1, "minutes");
      expect(result.getHours()).toBe(12);
      expect(result.getMinutes()).toBe(1);
    });

    it("should handle 60 minute duration", () => {
      const result = calculateEndDate(baseDate, "12:00", 60, "minutes");
      expect(result.getHours()).toBe(13);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe("Duration in hours", () => {
    it("should add hours without crossing day boundary", () => {
      const result = calculateEndDate(baseDate, "10:00", 2, "hours");
      expect(result.getHours()).toBe(12);
      expect(result.getDate()).toBe(15);
    });

    it("should add hours and cross day boundary", () => {
      const result = calculateEndDate(baseDate, "22:00", 3, "hours");
      expect(result.getDate()).toBe(16);
      expect(result.getHours()).toBe(1);
    });

    it("should handle 1 hour duration", () => {
      const result = calculateEndDate(baseDate, "14:00", 1, "hours");
      expect(result.getHours()).toBe(15);
      expect(result.getMinutes()).toBe(0);
    });

    it("should handle 24 hour duration", () => {
      const result = calculateEndDate(baseDate, "10:00", 24, "hours");
      expect(result.getDate()).toBe(16);
      expect(result.getHours()).toBe(10);
    });

    it("should preserve minutes from start time", () => {
      const result = calculateEndDate(baseDate, "14:30", 2, "hours");
      expect(result.getHours()).toBe(16);
      expect(result.getMinutes()).toBe(30);
    });
  });

  describe("Duration in days", () => {
    it("should add days and preserve time", () => {
      const result = calculateEndDate(baseDate, "14:30", 2, "days");
      expect(result.getDate()).toBe(17);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
    });

    it("should handle 1 day duration", () => {
      const result = calculateEndDate(baseDate, "10:00", 1, "days");
      expect(result.getDate()).toBe(16);
      expect(result.getHours()).toBe(10);
    });

    it("should handle month boundary crossing", () => {
      const endOfMonth = new Date(2025, 0, 31); // January 31, 2025
      const result = calculateEndDate(endOfMonth, "10:00", 1, "days");
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(1); // February
    });

    it("should handle year boundary crossing", () => {
      const endOfYear = new Date(2025, 11, 31); // December 31, 2025
      const result = calculateEndDate(endOfYear, "10:00", 1, "days");
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2026);
    });
  });

  describe("No start time, no duration", () => {
    it("should return the same date with time set to midnight", () => {
      const result = calculateEndDate(baseDate);
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle quarter-hour increments (00, 15, 30, 45)", () => {
      const times = ["10:00", "10:15", "10:30", "10:45"];
      times.forEach((time) => {
        const result = calculateEndDate(baseDate, time, 1, "hours");
        const [expectedHours, expectedMinutes] = time.split(':').map(Number);
        expect(result.getHours()).toBe(expectedHours + 1);
        expect(result.getMinutes()).toBe(expectedMinutes);
      });
    });

    it("should handle all-day events (no start time, full day duration)", () => {
      const result = calculateEndDate(baseDate, undefined, 1, "days");
      expect(result.getDate()).toBe(16);
      expect(result.getHours()).toBe(0);
    });

    it("should handle multi-hour meetings", () => {
      const result = calculateEndDate(baseDate, "09:00", 3, "hours");
      expect(result.getHours()).toBe(12);
      expect(result.getMinutes()).toBe(0);
    });

    it("should handle multi-day events", () => {
      const result = calculateEndDate(baseDate, "09:00", 3, "days");
      expect(result.getDate()).toBe(18);
      expect(result.getHours()).toBe(9);
    });
  });

  describe("Real-world scenarios", () => {
    it("should calculate end time for a 2-hour meeting at 2 PM", () => {
      const result = calculateEndDate(baseDate, "14:00", 2, "hours");
      expect(result.getHours()).toBe(16);
      expect(result.getMinutes()).toBe(0);
      expect(result.getDate()).toBe(15);
    });

    it("should calculate end time for a 90-minute meeting at 3:30 PM", () => {
      const result = calculateEndDate(baseDate, "15:30", 90, "minutes");
      expect(result.getHours()).toBe(17);
      expect(result.getMinutes()).toBe(0);
      expect(result.getDate()).toBe(15);
    });

    it("should calculate end time for an all-day event", () => {
      const result = calculateEndDate(baseDate, undefined, 1, "days");
      expect(result.getDate()).toBe(16);
    });

    it("should calculate end time for a 3-day conference", () => {
      const result = calculateEndDate(baseDate, "09:00", 3, "days");
      expect(result.getDate()).toBe(18);
      expect(result.getHours()).toBe(9);
    });

    it("should calculate end time for an evening event that spans midnight", () => {
      const result = calculateEndDate(baseDate, "23:00", 2, "hours");
      expect(result.getDate()).toBe(16);
      expect(result.getHours()).toBe(1);
    });
  });
});
