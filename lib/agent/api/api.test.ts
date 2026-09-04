import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { publicFeatures, publicHealth, publicPricing, publicProduct } from "./catalog";
import { handleMcpJsonRpc, mcpManifest, mcpServerCard, mcpTools } from "./mcp";
import { buildOpenApiDocument } from "./openapi";
import {
  sha256Base64Url,
  signAccessToken,
  verifyAccessToken,
  verifyPkceS256,
} from "./oauth-crypto";
import {
  authorizationServerMetadata,
  protectedResourceMetadata,
} from "./oauth-metadata";
import { ALL_API_SCOPES, parseScopes } from "./scopes";

describe("agent API catalog", () => {
  it("exposes health, product, features, and pricing", () => {
    assert.equal(publicHealth().status, "ok");
    assert.equal(publicProduct().name, "Donyapp");
    assert.ok(publicProduct().links.openapi.includes("/openapi.json"));
    assert.ok(publicFeatures().areas.length >= 4);
    assert.equal(publicPricing().currency, "BRL");
    assert.ok(publicPricing().plans.some((p) => p.id === "pro"));
  });
});

describe("OpenAPI + OAuth metadata", () => {
  it("declares oauth2 scopes and public paths", () => {
    const doc = buildOpenApiDocument("https://www.donyapp.com");
    assert.equal(doc.openapi, "3.1.0");
    assert.ok(doc.paths["/api/v1/product"]);
    assert.ok(doc.paths["/api/v1/me"]);
    const scopes = doc.components.securitySchemes.oauth2.flows.authorizationCode.scopes;
    for (const s of ALL_API_SCOPES) {
      assert.ok(scopes[s]);
    }
  });

  it("publishes AS and protected-resource metadata with scopes_supported", () => {
    const as = authorizationServerMetadata("https://www.donyapp.com");
    assert.equal(as.issuer, "https://www.donyapp.com");
    assert.ok(as.code_challenge_methods_supported.includes("S256"));
    assert.deepEqual(as.scopes_supported, ALL_API_SCOPES);

    const pr = protectedResourceMetadata("https://www.donyapp.com");
    assert.equal(pr.resource, "https://www.donyapp.com");
    assert.deepEqual(pr.scopes_supported, ALL_API_SCOPES);
  });
});

describe("OAuth crypto", () => {
  it("signs and verifies access tokens", () => {
    const { token } = signAccessToken({
      iss: "https://www.donyapp.com",
      aud: "https://www.donyapp.com",
      sub: "user-1",
      scope: "profile:read account:read",
      client_id: "dny_test",
    });
    const claims = verifyAccessToken(
      token,
      "https://www.donyapp.com",
      "https://www.donyapp.com",
    );
    assert.ok(claims);
    assert.equal(claims?.sub, "user-1");
  });

  it("verifies PKCE S256", () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJE1v7Mf7f89_8-1QX5Y";
    const challenge = sha256Base64Url(verifier);
    assert.equal(verifyPkceS256(verifier, challenge), true);
    assert.equal(verifyPkceS256(verifier, "nope"), false);
  });

  it("parses scopes", () => {
    assert.deepEqual(parseScopes("profile:read"), ["profile:read"]);
    assert.ok(parseScopes(null).includes("account:read"));
  });
});

describe("MCP", () => {
  it("advertises streamable-http tools", () => {
    const manifest = mcpManifest("https://www.donyapp.com");
    assert.equal(manifest.transport, "streamable-http");
    assert.equal(manifest.remotes[0]?.type, "streamable-http");
    assert.ok(mcpTools().some((t) => t.name === "get_pricing"));

    const card = mcpServerCard("https://www.donyapp.com");
    assert.equal(card.serverUrl, "https://www.donyapp.com/api/mcp");
    assert.ok(card.tools.length >= 4);
  });

  it("handles initialize and tools/list over JSON-RPC", async () => {
    const init = await handleMcpJsonRpc(
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "t", version: "1" } },
      },
      null,
    );
    assert.ok(!("notification" in init));
    if ("notification" in init) return;
    const body = init.body as { result?: { serverInfo?: { name?: string } } };
    assert.equal(body.result?.serverInfo?.name, "donyapp");

    const list = await handleMcpJsonRpc(
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
      null,
    );
    assert.ok(!("notification" in list));
    if ("notification" in list) return;
    const toolsBody = list.body as { result?: { tools?: { name: string }[] } };
    assert.ok((toolsBody.result?.tools?.length ?? 0) >= 4);
  });

  it("calls get_product without auth", async () => {
    const res = await handleMcpJsonRpc(
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "get_product", arguments: {} },
      },
      null,
    );
    assert.ok(!("notification" in res));
    if ("notification" in res) return;
    const body = res.body as { result?: { content?: { text?: string }[] } };
    assert.match(body.result?.content?.[0]?.text ?? "", /Donyapp/);
  });
});
