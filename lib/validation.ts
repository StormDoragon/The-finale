import type { PostStatus } from "./types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ValidationError extends Error {}

export function requiredText(
  value: FormDataEntryValue | null,
  label: string,
  maxLength: number,
) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new ValidationError(`${label} is required.`);
  if (text.length > maxLength) {
    throw new ValidationError(`${label} must be ${maxLength} characters or less.`);
  }
  return text;
}

export function optionalText(
  value: FormDataEntryValue | null,
  label: string,
  maxLength: number,
) {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length > maxLength) {
    throw new ValidationError(`${label} must be ${maxLength} characters or less.`);
  }
  return text || null;
}

export function optionalHttpUrl(value: FormDataEntryValue | null) {
  const text = optionalText(value, "Source URL", 500);
  if (!text) return null;

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new ValidationError("Source URL must be a valid web address.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ValidationError("Source URL must use HTTP or HTTPS.");
  }
  return url.toString();
}

export function uuid(value: FormDataEntryValue | null, label: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!UUID_PATTERN.test(text)) throw new ValidationError(`Invalid ${label}.`);
  return text;
}

const TRANSITIONS = {
  approved: "draft",
  rejected: "draft",
  published: "approved",
} as const satisfies Partial<Record<PostStatus, PostStatus>>;

export type ActionablePostStatus = keyof typeof TRANSITIONS;

export function postTransition(value: FormDataEntryValue | null) {
  const status = typeof value === "string" ? value : "";
  if (!(status in TRANSITIONS)) {
    throw new ValidationError("That post status change is not allowed.");
  }
  const next = status as ActionablePostStatus;
  return { next, current: TRANSITIONS[next] };
}
