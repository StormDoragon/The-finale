import assert from "node:assert/strict";
import test from "node:test";
import {
  facebookPageId,
  pageAccessToken,
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

test("uuid accepts canonical identifiers only", () => {
  assert.equal(uuid(validId, "page"), validId);
  assert.equal(uuid(` ${validId} `, "page"), validId);
  assert.throws(() => uuid("not-a-uuid", "page"), ValidationError);
  assert.throws(() => uuid(null, "page"), ValidationError);
});

test("facebookPageId accepts numeric page identifiers", () => {
  assert.equal(facebookPageId(" 123456789012345 "), "123456789012345");
  assert.throws(() => facebookPageId("my-page"), ValidationError);
  assert.throws(() => facebookPageId("12"), ValidationError);
  assert.throws(() => facebookPageId(""), ValidationError);
  assert.throws(() => facebookPageId("1".repeat(40)), ValidationError);
});

test("pageAccessToken rejects blanks, whitespace, and oversized tokens", () => {
  assert.equal(pageAccessToken(" EAABtokenvalue123 "), "EAABtokenvalue123");
  assert.throws(() => pageAccessToken("has space inside"), ValidationError);
  assert.throws(() => pageAccessToken(""), ValidationError);
  assert.throws(() => pageAccessToken("a".repeat(1001)), ValidationError);
});
