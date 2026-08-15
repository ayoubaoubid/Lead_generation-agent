import { describe, expect, it } from "vitest";

import { parseCsv } from "@/lib/csv/csv-parser";

describe("parseCsv", () => {
  it("parses quoted commas, escaped quotes and CRLF", () => {
    const result = parseCsv(
      'name,description\r\n"Acme, Inc.","Says ""hello"""\r\n',
      ",",
    );

    expect(result.totalRowCount).toBe(1);
    expect(result.rows[0]).toEqual({
      name: "Acme, Inc.",
      description: 'Says "hello"',
    });
    expect(result.issues).toEqual([]);
  });

  it("reports duplicate headers and row width mismatches", () => {
    const result = parseCsv("email,EMAIL\none@example.com", ",");

    expect(result.issues).toEqual([
      "CSV_HEADER_DUPLICATED",
      "CSV_COLUMN_COUNT_MISMATCH:2",
    ]);
  });

  it("limits preview rows without changing the total count", () => {
    const result = parseCsv("name\none\ntwo\nthree", ",", 2);

    expect(result.rows).toHaveLength(2);
    expect(result.totalRowCount).toBe(3);
  });

  it("rejects an unterminated quoted field", () => {
    expect(() => parseCsv('name\n"unfinished', ",")).toThrow(
      "CSV_QUOTE_NOT_CLOSED",
    );
  });
});
