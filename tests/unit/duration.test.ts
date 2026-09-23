import { describe, it, expect } from "vitest";
import { parseDurationMinutes, formatMinutes } from "@/lib/duration";

describe("parseDurationMinutes", () => {
  it("parses a plain number", () => {
    expect(parseDurationMinutes("80")).toBe(80);
    expect(parseDurationMinutes(80)).toBe(80);
  });

  it("parses '80 min' and '80m'", () => {
    expect(parseDurationMinutes("80 min")).toBe(80);
    expect(parseDurationMinutes("80m")).toBe(80);
  });

  it("parses '1h 20m'", () => {
    expect(parseDurationMinutes("1h 20m")).toBe(80);
    expect(parseDurationMinutes("1 hr 20 min")).toBe(80);
  });

  it("parses '1:20' as hh:mm", () => {
    expect(parseDurationMinutes("1:20")).toBe(80);
  });

  it("parses ISO 8601 durations", () => {
    expect(parseDurationMinutes("PT1H20M")).toBe(80);
    expect(parseDurationMinutes("PT45M")).toBe(45);
  });

  it("parses compact '1h20'", () => {
    expect(parseDurationMinutes("1h20")).toBe(80);
  });

  it("returns null for empty or garbage input", () => {
    expect(parseDurationMinutes("")).toBeNull();
    expect(parseDurationMinutes(null)).toBeNull();
    expect(parseDurationMinutes("not a duration")).toBeNull();
  });
});

describe("formatMinutes", () => {
  it("formats under an hour as minutes", () => {
    expect(formatMinutes(45)).toBe("45 min");
  });
  it("formats whole hours without minutes", () => {
    expect(formatMinutes(120)).toBe("2 hr");
  });
  it("formats hours and minutes", () => {
    expect(formatMinutes(80)).toBe("1 hr 20 min");
  });
});
