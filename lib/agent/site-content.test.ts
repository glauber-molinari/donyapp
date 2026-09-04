import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { llmsTxtBody, markdownForPath, notFoundMarkdown } from "./markdown-content";
import { homeJsonLdGraph, organizationJsonLd } from "./site";

describe("agent markdown content", () => {
  it("includes when-to-use guidance in llms.txt", () => {
    const body = llmsTxtBody();
    assert.match(body, /## When to use this/);
    assert.match(body, /sitemap\.xml/);
    assert.match(body, /Accept: text\/markdown/);
    assert.match(body, /\/features/);
    assert.match(body, /\/pricing/);
    assert.match(body, /openapi\.json/);
    assert.match(body, /\/api\/mcp/);
    assert.match(body, /API catalog index/);
    assert.match(body, /WebMCP/);
    assert.match(body, /oauth-authorization-server/);
  });

  it("404 markdown points at sitemap and llms.txt", () => {
    const body = notFoundMarkdown("/missing-page");
    assert.match(body, /# 404/);
    assert.match(body, /sitemap\.xml/);
    assert.match(body, /llms\.txt/);
    assert.match(body, /\/features/);
    assert.match(body, /\/pricing/);
  });

  it("serves markdown for home, discovery, and trust pages", () => {
    assert.ok((markdownForPath("/") ?? "").length > 100);
    assert.ok((markdownForPath("/about") ?? "").length > 100);
    assert.ok((markdownForPath("/features") ?? "").length > 100);
    assert.ok((markdownForPath("/pricing") ?? "").length > 100);
    assert.match(markdownForPath("/pricing") ?? "", /Pro/);
    assert.ok((markdownForPath("/contact") ?? "").length > 100);
    assert.ok((markdownForPath("/privacy") ?? "").length > 100);
    assert.equal(markdownForPath("/nope"), null);
  });
});

describe("JSON-LD identity", () => {
  it("organization has contactPoint and address", () => {
    const org = organizationJsonLd("https://www.donyapp.com");
    assert.equal(org.name, "Donyapp");
    assert.ok(org.description.length > 20);
    assert.equal(org.contactPoint[0]?.email, "suporte@donyapp.com");
    assert.equal(org.contactPoint[0]?.contactType, "customer support");
    assert.equal(org.address["@type"], "PostalAddress");
    assert.equal(org.address.addressCountry, "BR");
  });

  it("home graph includes Organization, SoftwareApplication, WebSite with name+description", () => {
    const graph = homeJsonLdGraph("https://www.donyapp.com");
    const types = graph["@graph"].map((n) => n["@type"]);
    assert.deepEqual(types, ["Organization", "SoftwareApplication", "WebSite"]);
    for (const node of graph["@graph"]) {
      assert.ok("name" in node && typeof node.name === "string");
      assert.ok("description" in node && typeof node.description === "string");
    }
  });
});
