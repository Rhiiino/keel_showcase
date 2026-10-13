import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildPayload,
  classifyClient,
  extractTitle,
  isDocumentRequest,
  requestPath,
} from "./keelPageVisits.mjs";

describe("document filtering", () => {
  it("accepts a browser navigation", () => {
    assert.equal(
      isDocumentRequest({
        method: "GET",
        url: "/pricing?ref=1",
        headers: {
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          accept: "text/html",
        },
      }),
      true,
    );
  });

  it("rejects assets, health checks, vite internals, and prefetches", () => {
    const navigation = {
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      accept: "text/html",
    };
    for (const url of ["/assets/index-abc.js", "/style.css", "/font.woff2", "/model.glb", "/data.json"]) {
      assert.equal(isDocumentRequest({ method: "GET", url, headers: navigation }), false);
    }
    assert.equal(
      isDocumentRequest({
        method: "GET",
        url: "/",
        headers: { "sec-fetch-dest": "script", "sec-fetch-mode": "cors", accept: "text/html" },
      }),
      false,
    );
    assert.equal(
      isDocumentRequest({
        method: "GET",
        url: "/projects",
        headers: { ...navigation, purpose: "prefetch" },
      }),
      false,
    );
    for (const url of ["/health", "/@vite/client", "/src/main.tsx", "/node_modules/vite/dist/client.js"]) {
      assert.equal(isDocumentRequest({ method: "GET", url, headers: { accept: "text/html" } }), false);
    }
    assert.equal(isDocumentRequest({ method: "POST", url: "/", headers: { accept: "text/html" } }), false);
  });

  it("falls back to Accept when fetch metadata is absent", () => {
    assert.equal(
      isDocumentRequest({ method: "GET", url: "/projects", headers: { accept: "text/html,application/xhtml+xml" } }),
      true,
    );
    assert.equal(
      isDocumentRequest({ method: "GET", url: "/projects", headers: { accept: "*/*" } }),
      false,
    );
  });
});

describe("payload building", () => {
  it("classifies user agents", () => {
    assert.equal(
      classifyClient("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Safari/604.1"),
      "mobile",
    );
    assert.equal(
      classifyClient("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"),
      "desktop",
    );
    assert.equal(classifyClient("curl/8.4.0"), undefined);
    assert.equal(classifyClient(undefined), undefined);
  });

  it("trims optional fields and omits a timestamp", () => {
    const payload = buildPayload({
      path: "  /pricing  ",
      title: `  ${"T".repeat(400)}`,
      referrer: ` ${"R".repeat(3000)}`,
      client: "desktop",
    });
    assert.equal(payload.path, "/pricing");
    assert.equal(payload.title?.length, 300);
    assert.equal(payload.referrer?.length, 2048);
    assert.equal(payload.client, "desktop");
    assert.equal("timestamp" in payload, false);

    assert.deepEqual(buildPayload({ path: "/", title: "  ", referrer: "", client: "unknown" }), { path: "/" });
    assert.equal(requestPath("/projects?x=1#section"), "/projects");
    assert.equal(requestPath(`/${"a".repeat(3000)}`).length, 2048);
  });

  it("reads the first title", () => {
    assert.equal(
      extractTitle("<title>  Midhun   Raj \n | Software Developer  </title>"),
      "Midhun Raj | Software Developer",
    );
  });
});
