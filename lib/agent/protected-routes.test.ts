import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isMarkdownablePath,
  isProtectedAppPath,
  isPublicContentPath,
} from "./protected-routes";

describe("isProtectedAppPath", () => {
  it("protects known app surfaces", () => {
    assert.equal(isProtectedAppPath("/dashboard"), true);
    assert.equal(isProtectedAppPath("/board/x"), true);
    assert.equal(isProtectedAppPath("/settings/plan"), true);
    assert.equal(isProtectedAppPath("/admin"), true);
  });

  it("does not treat unknown paths as protected (avoids soft-404)", () => {
    assert.equal(isProtectedAppPath("/this-does-not-exist"), false);
    assert.equal(isProtectedAppPath("/about"), false);
    assert.equal(isProtectedAppPath("/llms.txt"), false);
  });
});

describe("isPublicContentPath / isMarkdownablePath", () => {
  it("marks trust and agent entry points as public", () => {
    assert.equal(isPublicContentPath("/about"), true);
    assert.equal(isPublicContentPath("/features"), true);
    assert.equal(isPublicContentPath("/pricing"), true);
    assert.equal(isPublicContentPath("/contact"), true);
    assert.equal(isPublicContentPath("/privacy"), true);
    assert.equal(isPublicContentPath("/llms.txt"), true);
    assert.equal(isPublicContentPath("/openapi.json"), true);
    assert.equal(isPublicContentPath("/.well-known/mcp.json"), true);
    assert.equal(isPublicContentPath("/oauth/authorize"), true);
    assert.equal(isPublicContentPath("/api/v1/product"), true);
  });

  it("lists markdownable marketing pages", () => {
    assert.equal(isMarkdownablePath("/"), true);
    assert.equal(isMarkdownablePath("/about"), true);
    assert.equal(isMarkdownablePath("/features"), true);
    assert.equal(isMarkdownablePath("/pricing"), true);
    assert.equal(isMarkdownablePath("/dashboard"), false);
  });
});
