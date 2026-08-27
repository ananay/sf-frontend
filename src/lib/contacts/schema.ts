import { z } from "zod";
import type { AddressInput, ContactInput } from "./types";

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";
export const MAX_PHOTO_DATA_URI_LENGTH =
  4 * Math.ceil(MAX_PHOTO_BYTES / 3) + "data:image/jpeg;base64,".length;
const PHOTO_DATA_URI_PATTERN =
  /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

/** Check the decoded payload size rather than relying on encoded string length. */
export function isPhotoWithinSizeLimit(value: string): boolean {
  if (value === "") return true;
  const match = PHOTO_DATA_URI_PATTERN.exec(value);
  if (!match) return false;
  try {
    return atob(match[1]).length <= MAX_PHOTO_BYTES;
  } catch {
    return false;
  }
}

/** Confirm the decoded bytes match the MIME type declared by the data URI. */
function hasMatchingImageSignature(value: string): boolean {
  if (value === "") return true;
  const match = PHOTO_DATA_URI_PATTERN.exec(value);
  if (!match) return false;

  try {
    const bytes = Uint8Array.from(atob(match[1]), (character) =>
      character.charCodeAt(0),
    );
    if (value.startsWith("data:image/png")) {
      return [137, 80, 78, 71, 13, 10, 26, 10].every(
        (byte, index) => bytes[index] === byte,
      );
    }
    if (value.startsWith("data:image/jpeg")) {
      return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    }
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  } catch {
    return false;
  }
}

/**
 * Client/server-shared validation for the contact form.
 *
 * The rules mirror the API's Pydantic models (`ContactCreate` / `ContactReplace`)
 * so the user sees a mistake before a round trip — the API stays the authority,
 * and anything it rejects anyway is surfaced by `toFieldErrors` in `./api.ts`.
 */

/** Optional text: trimmed, and blank becomes `null` (the API clears the field). */
function optionalText(max: number, label: string) {
  return z.preprocess(
    (value) => value ?? "",
    z
      .string()
      .trim()
      .max(max, `${label} must be ${max} characters or fewer`)
      .transform((value) => value || null),
  ).default(null);
}

function requiredText(max: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);
}

const LINKEDIN_URL_MAX_LENGTH = 500;
const LINKEDIN_PROFILE_PATH =
  /^\/in\/([A-Za-z0-9][A-Za-z0-9-]{1,98}[A-Za-z0-9])\/?$/;

/** Validate and canonicalize a public LinkedIn profile URL. */
export function normalizeLinkedInUrl(value: string): string {
  const candidate = value.trim();
  if (!candidate) throw new Error("LinkedIn URL is required");
  if (candidate.length > LINKEDIN_URL_MAX_LENGTH) {
    throw new Error(
      `LinkedIn URL must be ${LINKEDIN_URL_MAX_LENGTH} characters or fewer`,
    );
  }
  if (/\s/.test(candidate) || candidate.includes("\\")) {
    throw new Error("LinkedIn URL cannot contain whitespace or backslashes");
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("Enter a valid LinkedIn profile URL");
  }

  if (url.protocol !== "https:") {
    throw new Error("LinkedIn URL must use HTTPS");
  }
  if (!["linkedin.com", "www.linkedin.com"].includes(url.hostname.toLowerCase())) {
    throw new Error("Enter a linkedin.com profile URL");
  }
  const afterScheme = candidate.slice(candidate.indexOf("//") + 2);
  const authorityEnd = afterScheme.search(/[/?#]/);
  const authority =
    authorityEnd === -1 ? afterScheme : afterScheme.slice(0, authorityEnd);
  const hasExplicitPort = /:\d+$/.test(authority);
  if (url.username || url.password || url.port || hasExplicitPort) {
    throw new Error(
      "Enter a standard LinkedIn profile URL without credentials or a port",
    );
  }

  const remainder = authorityEnd === -1 ? "" : afterScheme.slice(authorityEnd);
  const rawPath = remainder.startsWith("/") ? remainder.split(/[?#]/)[0] : "";
  const match = LINKEDIN_PROFILE_PATH.exec(rawPath);
  if (!match) {
    throw new Error(
      "LinkedIn URL must look like https://www.linkedin.com/in/profile-name",
    );
  }
  return `https://www.linkedin.com/in/${match[1].toLowerCase()}`;
}

const linkedinUrlSchema = z.string().transform((value, context) => {
  try {
    return normalizeLinkedInUrl(value);
  } catch (error) {
    context.addIssue({
      code: "custom",
      message:
        error instanceof Error
          ? error.message
          : "Enter a valid LinkedIn profile URL",
    });
    return z.NEVER;
  }
});

export const contactInputSchema = z.object({
  first_name: requiredText(100, "First name"),
  last_name: requiredText(100, "Last name"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(320, "Email must be 320 characters or fewer")
    .pipe(z.email("Enter a valid email address"))
    .transform((value) => value.toLowerCase()),
  linkedin_url: linkedinUrlSchema,
  phone: optionalText(40, "Phone"),
  company: optionalText(200, "Company"),
  job_title: optionalText(200, "Job title"),
  addresses: z
    .array(
      z.object({
        type: z.enum(["Home", "Work", "Other"]),
        address: requiredText(300, "Street address"),
        city: optionalText(120, "City"),
        state: optionalText(120, "State"),
        postal_code: optionalText(20, "Postal code"),
        country: optionalText(120, "Country"),
      }) satisfies z.ZodType<AddressInput, unknown>,
    )
    .max(10, "A contact can have at most 10 addresses"),
  notes: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable()
    .default(null),
  photo: z
    .string()
    .trim()
    .max(MAX_PHOTO_DATA_URI_LENGTH, "Photo must be 2 MB or smaller")
    .refine(
      (value) => value === "" || PHOTO_DATA_URI_PATTERN.test(value),
      "Choose a JPEG, PNG, or WebP image",
    )
    .refine(isPhotoWithinSizeLimit, "Photo must be 2 MB or smaller")
    .refine(hasMatchingImageSignature, "Photo content does not match its image type")
    .transform((value) => value || null)
    .nullable()
    .default(null),
}) satisfies z.ZodType<ContactInput, unknown>;

export type ContactFormValues = z.input<typeof contactInputSchema>;

/** Collapse a ZodError into one message per field, keyed by input name. */
export function zodFieldErrors(
  error: z.ZodError,
): Partial<Record<keyof ContactInput, string>> {
  const fieldErrors: Partial<Record<keyof ContactInput, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in fieldErrors)) {
      fieldErrors[key as keyof ContactInput] = issue.message;
    }
  }
  return fieldErrors;
}

/* ------------------------------------------------------------------ */
/* Form metadata — one source of truth for the fields and their limits */
/* ------------------------------------------------------------------ */

export interface ContactFieldSpec {
  name: Exclude<keyof ContactInput, "addresses">;
  label: string;
  type?: "text" | "email" | "tel" | "url" | "textarea";
  required?: boolean;
  maxLength: number;
  placeholder?: string;
  autoComplete?: string;
  /** Column span inside the section grid. */
  wide?: boolean;
}

export interface ContactFieldGroup {
  title: string;
  description: string;
  fields: ContactFieldSpec[];
}

export const CONTACT_FIELD_GROUPS: ContactFieldGroup[] = [
  {
    title: "Identity",
    description: "Names, email, and LinkedIn profile are required.",
    fields: [
      {
        name: "first_name",
        label: "First name",
        required: true,
        maxLength: 100,
        placeholder: "Ada",
        autoComplete: "given-name",
      },
      {
        name: "last_name",
        label: "Last name",
        required: true,
        maxLength: 100,
        placeholder: "Lovelace",
        autoComplete: "family-name",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        required: true,
        maxLength: 320,
        placeholder: "ada@example.com",
        autoComplete: "email",
      },
      {
        name: "linkedin_url",
        label: "LinkedIn profile",
        type: "url",
        required: true,
        maxLength: LINKEDIN_URL_MAX_LENGTH,
        placeholder: "https://www.linkedin.com/in/ada-lovelace",
        autoComplete: "url",
        wide: true,
      },
      {
        name: "phone",
        label: "Phone",
        type: "tel",
        maxLength: 40,
        placeholder: "+1-415-555-0101",
        autoComplete: "tel",
      },
    ],
  },
  {
    title: "Work",
    description: "Where they work and what they do.",
    fields: [
      {
        name: "company",
        label: "Company",
        maxLength: 200,
        placeholder: "Analytical Engines",
        autoComplete: "organization",
      },
      {
        name: "job_title",
        label: "Job title",
        maxLength: 200,
        placeholder: "Mathematician",
        autoComplete: "organization-title",
      },
    ],
  },
  {
    title: "Notes",
    description: "Anything worth remembering. No length limit.",
    fields: [
      {
        name: "notes",
        label: "Notes",
        type: "textarea",
        maxLength: 10_000,
        placeholder: "Met at the SF hackathon.",
        wide: true,
      },
    ],
  },
];

export const CONTACT_FIELDS: ContactFieldSpec[] = CONTACT_FIELD_GROUPS.flatMap(
  (group) => group.fields,
);

/** Pull the contact fields out of a submitted form, as raw strings. */
export function formDataToValues(
  formData: FormData,
): ContactFormValues {
  const textValues = Object.fromEntries(
    CONTACT_FIELDS.map((field) => [
      field.name,
      String(formData.get(field.name) ?? ""),
    ]),
  );
  let addresses: unknown;
  try {
    addresses = JSON.parse(String(formData.get("addresses") ?? "[]"));
  } catch {
    addresses = null;
  }
  return {
    ...textValues,
    addresses,
    photo: String(formData.get("photo") ?? ""),
  } as ContactFormValues;
}
