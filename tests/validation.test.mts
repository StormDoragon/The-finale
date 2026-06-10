import assert from "node:assert/strict";
import test from "node:test";
import {
  optionalHttpUrl,
  optionalText,
  postTransition,
  requiredText,
  uuid,
  ValidationError,
} from "../lib/validation.ts";

const validId = "c9b96c42-1b59-4ab2-9c3f-90f06f5ec03a";

test("requiredText trims valid input and rejects empty or oversized values", () => {
  assert.equal(requiredText("  useful signal  ", "Title", 20), "useful signal");
  assert.throws(() => requiredText("   ", "Title", 20), ValidationError);
  assert.throws(() => requiredText("too long", "Title", 3), ValidationError);
});

test("optionalText normalizes blank values to null", () => {
  assert.equal(optionalText("  ", "Voice", 20), null);
  assert.equal(optionalText("  direct  ", "Voice", 20), "direct");
});

test("optionalHttpUrl accepts web URLs and blocks unsafe protocols", () => {
  assert.equal(optionalHttpUrl("https://example.com/report"), "https://example.com/report");
  assert.equal(optionalHttpUrl(""), null);
  assert.throws(() => optionalHttpUrl("javascript:alert(1)"), ValidationError);
  assert.throws(() => optionalHttpUrl("not a URL"), ValidationError);
});

test("uuid accepts canonical IDs and rejects malformed identifiers", () => {
  assert.equal(uuid(validId, "trend"), validId);
  assert.throws(() => uuid("demo-1", "trend"), ValidationError);
});

test("postTransition enforces the editorial state machine", () => {
  assert.deepEqual(postTransition("approved"), { next: "approved", current: "draft" });
  assert.deepEqual(postTransition("published"), {
    next: "published",
    current: "approved",
  });
  assert.throws(() => postTransition("draft"), ValidationError);
  assert.throws(() => postTransition("deleted"), ValidationError);
});
