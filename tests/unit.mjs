import { build } from "esbuild";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
await mkdir("work", { recursive: true });
await build({
  entryPoints: ["src/adapters/bilibili.ts"],
  outfile: "work/adapter.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
await build({
  entryPoints: ["src/player/bridge.ts"],
  outfile: "work/bridge.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
});
globalThis.location = new URL("https://www.bilibili.com/");
const a = await import("../work/adapter.mjs");
const { validMessage } = await import("../work/bridge.mjs");
assert.equal(a.safeURL(""), "");
assert.equal(a.safeURL("javascript:alert(1)"), "");
assert.equal(
  a.imageURL("http://i0.hdslb.com/bfs/archive/test.jpg"),
  "https://i0.hdslb.com/bfs/archive/test.jpg",
);
assert.equal(
  a.imageURL("//i1.hdslb.com/cover.webp"),
  "https://i1.hdslb.com/cover.webp",
);
assert.equal(
  a.imageURL("https://i2.hdslb.com/cover.avif"),
  "https://i2.hdslb.com/cover.avif",
);
assert.equal(a.imageURL("http://hdslb.com.evil.example/a.jpg"), "");
assert.equal(a.imageURL("javascript:alert(1)"), "");
assert.equal(a.imageURL("data:image/gif;base64,abc"), "");
assert.equal(a.safeURL("http://www.bilibili.com/video/BV1xx411c7mD/"), "");
assert.equal(
  a.safeURL("https://www.bilibili.com/c/tech/"),
  "https://www.bilibili.com/c/tech/",
);
assert.equal(a.safeURL("/c/tech/"), "https://www.bilibili.com/c/tech/");
globalThis.location = new URL(
  "https://www.bilibili.com/video/BV1xx411c7mD/?p=2",
);
assert.equal(a.routeFromLocation().part, 2);
const frame = { contentWindow: {} },
  base = {
    origin: "https://www.bilibili.com",
    source: frame.contentWindow,
    data: { channel: "bilioffice:v1", token: "secret", type: "ready" },
  };
assert.ok(validMessage(base, frame, "secret"));
assert.ok(
  !validMessage({ ...base, origin: "https://evil.example" }, frame, "secret"),
);
assert.ok(!validMessage({ ...base, source: {} }, frame, "secret"));
assert.ok(!validMessage(base, frame, "wrong"));
assert.ok(
  !validMessage(
    { ...base, data: { ...base.data, type: "unknown" } },
    frame,
    "secret",
  ),
);
const state = {
  ...base,
  data: {
    ...base.data,
    type: "state",
    time: 1,
    duration: 20,
    seekStart: 0,
    seekEnd: 20,
    paused: false,
  },
};
assert.ok(validMessage(state, frame, "secret"));
for (const invalid of [
  { time: NaN },
  { duration: Infinity },
  { seekStart: -1 },
  { seekStart: 21 },
  { paused: "false" },
]) {
  assert.ok(
    !validMessage(
      { ...state, data: { ...state.data, ...invalid } },
      frame,
      "secret",
    ),
  );
}
assert.ok(
  !validMessage(
    {
      ...state,
      data: { ...state.data, type: "seek:result", requestId: 1, ok: true },
    },
    frame,
    "secret",
  ),
);
console.log("actual adapter and bridge unit checks passed");
