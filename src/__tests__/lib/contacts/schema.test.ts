import {
  CONTACT_FIELDS,
  contactInputSchema,
  formDataToValues,
  zodFieldErrors,
} from "@/lib/contacts/schema";

function values(overrides: Record<string, unknown> = {}) {
  return {
    first_name: "Ada",
    last_name: "Lovelace",
    email: "Ada@Example.com",
    phone: "",
    company: "",
    job_title: "",
    addresses: [],
    notes: "",
    ...overrides,
  };
}

describe("contactInputSchema", () => {
  it("lowercases the email and nulls out the blanks", () => {
    const parsed = contactInputSchema.parse(values());

    expect(parsed.email).toBe("ada@example.com");
    expect(parsed.phone).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it("trims what the user typed", () => {
    expect(contactInputSchema.parse(values({ company: "  Acme  " })).company).toBe(
      "Acme",
    );
  });

  it("requires the three fields the API requires", () => {
    const result = contactInputSchema.safeParse(
      values({ first_name: " ", last_name: "", email: "" }),
    );

    expect(result.success).toBe(false);
    expect(zodFieldErrors(result.error!)).toEqual({
      first_name: "First name is required",
      last_name: "Last name is required",
      email: "Email is required",
    });
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
    expect(extracted.addresses).toEqual([{ type: "Home", address: "1 Main St" }]);
    expect(Object.keys(extracted).sort()).toEqual(
      [...CONTACT_FIELDS.map((field) => field.name), "addresses"].sort(),
    );
  });
});
