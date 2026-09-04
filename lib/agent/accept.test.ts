import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  appendVary,
  parseAccept,
  preferredType,
  prefersMarkdown,
} from "./accept";

describe("parseAccept / preferredType", () => {
  it("prefers text/markdown when listed first with equal q", () => {
    assert.equal(
      preferredType("text/markdown, text/html, */*"),
      "text/markdown",
    );
  });

  it("honors higher q for html", () => {
    assert.equal(
      preferredType("text/markdown;q=0.5, text/html;q=1"),
      "text/html",
    );
  });

  it("returns null when all produces are rejected", () => {
    assert.equal(
      preferredType("text/html;q=0, text/markdown;q=0, application/json"),
      null,
    );
  });

  it("defaults to html when Accept is missing", () => {
    assert.equal(preferredType(null), "text/html");
  });

  it("prefersMarkdown helper", () => {
    assert.equal(prefersMarkdown("text/markdown"), true);
    assert.equal(prefersMarkdown("text/html"), false);
  });

  it("parses q values", () => {
    const entries = parseAccept("text/html;q=0.8, text/markdown");
    assert.equal(entries[0]?.q, 0.8);
    assert.equal(entries[1]?.q, 1);
  });
});

describe("appendVary", () => {
  it("sets Accept and Accept-Encoding", () => {
    const headers = new Headers();
    appendVary(headers);
    assert.equal(headers.get("Vary"), "Accept, Accept-Encoding");
  });

  it("merges without duplicating Accept", () => {
    const headers = new Headers({ Vary: "Accept-Encoding" });
    appendVary(headers);
    assert.equal(headers.get("Vary"), "Accept-Encoding, Accept");
  });
});
