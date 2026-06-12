const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PAGE_ID_PATTERN = /^\d{3,32}$/;

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

export function uuid(value: FormDataEntryValue | null, label: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!UUID_PATTERN.test(text)) throw new ValidationError(`Invalid ${label}.`);
  return text;
}

export function facebookPageId(value: FormDataEntryValue | null) {
  const text = requiredText(value, "Page ID", 32);
  if (!PAGE_ID_PATTERN.test(text)) {
    throw new ValidationError(
      "Page ID must be the numeric Facebook page identifier.",
    );
  }
  return text;
}

export function pageAccessToken(value: FormDataEntryValue | null) {
  const text = requiredText(value, "Access token", 1000);
  if (/\s/.test(text)) {
    throw new ValidationError("Access token must not contain spaces.");
  }
  return text;
}
