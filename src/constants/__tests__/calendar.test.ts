import { describe, it, expect } from "vitest";
import { timeToMinutes, getWeekNumber, getMondayOfWeek, formatDateRange, daysInMonth } from "../calendar";

describe("timeToMinutes", () => {
  it("converts HH:MM to minutes", () => {
    expect(timeToMinutes("08:30", 0)).toBe(510);
    expect(timeToMinutes("00:00", 0)).toBe(0);
    expect(timeToMinutes("23:59", 0)).toBe(1439);
  });

  it("returns fallback for null", () => {
    expect(timeToMinutes(null, 480)).toBe(480);
  });
});

describe("daysInMonth", () => {
  it("returns correct days", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29); // leap year
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 4)).toBe(30);
  });
});

describe("getMondayOfWeek", () => {
  it("returns monday for a wednesday", () => {
    const wed = new Date("2026-04-08T00:00:00"); // Wednesday
    const mon = getMondayOfWeek(wed);
    expect(mon.getDay()).toBe(1); // Monday
    expect(mon.getDate()).toBe(6);
  });

  it("returns same day for a monday", () => {
    const mon = new Date("2026-04-06T00:00:00");
    expect(getMondayOfWeek(mon).getDate()).toBe(6);
  });

  it("returns previous monday for a sunday", () => {
    const sun = new Date("2026-04-12T00:00:00"); // Sunday
    const mon = getMondayOfWeek(sun);
    expect(mon.getDate()).toBe(6);
  });
});

describe("getWeekNumber", () => {
  it("returns correct ISO week", () => {
    expect(getWeekNumber(new Date("2026-01-01"))).toBe(1);
    expect(getWeekNumber(new Date("2026-04-10"))).toBe(15);
  });
});

describe("formatDateRange", () => {
  it("formats same-month range", () => {
    const mon = new Date("2026-04-06T00:00:00");
    expect(formatDateRange(mon)).toBe("6 - 12 Abr, 2026");
  });

  it("formats cross-month range", () => {
    const mon = new Date("2026-03-30T00:00:00");
    expect(formatDateRange(mon)).toBe("30 Mar - 5 Abr, 2026");
  });
});
