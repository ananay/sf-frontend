import {
  CONTACT_FIELDS,
  MAX_PHOTO_BYTES,
  contactInputSchema,
  formDataToValues,
  normalizeLinkedInUrl,
  zodFieldErrors,
} from "@/lib/contacts/schema";

function values(overrides: Record<string, unknown> = {}) {
  return {
    first_name: "Ada",
    last_name: "Lovelace",
    email: "Ada@Example.com",
    linkedin_url: "https://www.linkedin.com/in/ada-lovelace",
    phone: "",
    company: "",
    job_title: "",
    addresses: [],
    notes: "",
    photo: "",
    ...overrides,
  };
}

describe("contactInputSchema", () => {
  it("lowercases the email and nulls out the blanks", () => {
    const parsed = contactInputSchema.parse(values());

    expect(parsed.email).toBe("ada@example.com");
    expect(parsed.phone).toBeNull();
    expect(parsed.notes).toBeNull();
    expect(parsed.photo).toBeNull();
  });

  it("trims what the user typed", () => {
    expect(contactInputSchema.parse(values({ company: "  Acme  " })).company).toBe(
      "Acme",
    );
  });

  it("requires every mandatory identity field", () => {
    const result = contactInputSchema.safeParse(
      values({ first_name: " ", last_name: "", email: "", linkedin_url: "" }),
    );

    expect(result.success).toBe(false);
    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name is required",
      last_name: "Last name is required",
      email: "Email is required",
      linkedin_url: "LinkedIn URL is required",
    });
  });

  it("normalizes a LinkedIn profile URL", () => {
    expect(
      normalizeLinkedInUrl(
        " https://linkedin.com/in/Ada-Lovelace/?trk=contacts#about ",
      ),
    ).toBe("https://www.linkedin.com/in/ada-lovelace");
  });

  it.each([
    "http://www.linkedin.com/in/ada-lovelace",
    "https://example.com/in/ada-lovelace",
    "https://linkedin.com.evil.example/in/ada-lovelace",
    "https://user:password@linkedin.com/in/ada-lovelace",
    "https://linkedin.com:443/in/ada-lovelace",
    "https://www.linkedin.com/company/openai",
    "https://www.linkedin.com/in/a",
    `https://www.linkedin.com/in/${"a".repeat(101)}`,
    "https://www.linkedin.com/in/name/extra",
    "https://www.linkedin.com/in/name%2Fextra",
    "https://www.linkedin.com/in/ada lovelace",
    "https://linkedin.com/foo/../in/ada-lovelace",
    "https://linkedin.com\\@evil.example/in/ada-lovelace",
    "https://linkedin.com?next=/in/ada-lovelace",
  ])("rejects invalid LinkedIn URL %s", (linkedin_url) => {
    const result = contactInputSchema.safeParse(values({ linkedin_url }));
    expect(zodFieldErrors(result.error!).linkedin_url).toBeTruthy();
  });

  it("rejects a malformed email", () => {
    const result = contactInputSchema.safeParse(values({ email: "not-an-email" }));
    expect(zodFieldErrors(result.error!).email).toBe("Enter a valid email address");
  });

  it("enforces the API's length limits", () => {
    const result = contactInputSchema.safeParse(
      values({ first_name: "a".repeat(101) }),
    );

    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name must be 100 characters or fewer",
    });
  });

  it("accepts supported photo data and rejects unsafe image types", () => {
    const png = "data:image/png;base64,iVBORw0KGgo=";

    expect(contactInputSchema.parse(values({ photo: png })).photo).toBe(png);
    expect(
      contactInputSchema.safeParse(
        values({ photo: "data:image/svg+xml;base64,PHN2Zz4=" }),
      ).success,
    ).toBe(false);
    expect(
      contactInputSchema.safeParse(
        values({ photo: "data:image/png;base64,SGVsbG8=" }),
    ).success,
    ).toBe(false);
  });

  it("rejects a photo whose decoded payload exceeds two megabytes", () => {
    const oversizedPng = `data:image/png;base64,${btoa(
      "\x89PNG\r\n\x1a\n" + "x".repeat(MAX_PHOTO_BYTES),
    )}`;

    expect(
      contactInputSchema.safeParse(values({ photo: oversizedPng })).success,
    ).toBe(false);
  });

  it("validates typed nested addresses", () => {
    const result = contactInputSchema.safeParse(
      values({
        addresses: [
          {
            type: "Home",
            address: "  1 Main St  ",
            city: "  London ",
            state: "",
            postal_code: "",
            country: "UK",
          },
        ],
      }),
    );

    expect(result.success).toBe(true);
    expect(result.data?.addresses[0]).toMatchObject({
      type: "Home",
      address: "1 Main St",
      city: "London",
      state: null,
    });
  });

  it("normalizes nullable optional fields from stored addresses", () => {
    const result = contactInputSchema.safeParse(
      values({
        addresses: [
          {
            type: "Work",
            address: "1 Market St",
            city: null,
            state: null,
            postal_code: null,
            country: null,
          },
        ],
      }),
    );

    expect(result.success).toBe(true);
    expect(result.data?.addresses[0]).toEqual({
      type: "Work",
      address: "1 Market St",
      city: null,
      state: null,
      postal_code: null,
      country: null,
    });
  });

  it("rejects blank streets and more than ten addresses", () => {
    const blank = { type: "Home", address: "", city: "", state: "", postal_code: "", country: "" };
    expect(contactInputSchema.safeParse(values({ addresses: [blank] })).success).toBe(false);
    expect(
      contactInputSchema.safeParse(values({ addresses: Array.from({ length: 11 }, () => ({ ...blank, address: "1 Main St" })) })).success,
    ).toBe(false);
  });
});

describe("formDataToValues", () => {
  it("pulls every known field out, defaulting to an empty string", () => {
    const formData = new FormData();
    formData.set("first_name", "Grace");
    formData.set("email", "grace@example.com");
    formData.set("ignored", "nope");
    formData.set("addresses", JSON.stringify([{ type: "Home", address: "1 Main St" }]));

    const extracted = formDataToValues(formData);

    expect(extracted.first_name).toBe("Grace");
    expect(extracted.last_name).toBe("");
    expect(extracted.photo).toBe("");
    expect(extracted.addresses).toEqual([{ type: "Home", address: "1 Main St" }]);
    expect(Object.keys(extracted).sort()).toEqual(
      [...CONTACT_FIELDS.map((field) => field.name), "addresses", "photo"].sort(),
    );
  });
});
