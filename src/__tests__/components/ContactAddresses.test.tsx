import { render, screen } from "@testing-library/react";
import ContactAddresses from "@/components/contacts/ContactAddresses";
import type { Address } from "@/lib/contacts/types";

function address(overrides: Partial<Address>): Address {
  return {
    id: 1,
    type: "Home",
    address: "1 Main St",
    city: null,
    state: null,
    postal_code: null,
    country: null,
    ...overrides,
  };
}

describe("ContactAddresses", () => {
  it("groups addresses in Home, Work, and Other order", () => {
    render(
      <ContactAddresses
        addresses={[
          address({ id: 1, type: "Other", address: "PO Box 9" }),
          address({ id: 2, type: "Work", address: "2 Market St" }),
          address({ id: 3, type: "Home", address: "3 Oak Ave" }),
          address({ id: 4, type: "Home", address: "4 Pine Rd" }),
        ]}
      />,
    );

    expect(
      screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(["Home", "Work", "Other"]);
    expect(screen.getByText("3 Oak Ave")).toBeInTheDocument();
    expect(screen.getByText("4 Pine Rd")).toBeInTheDocument();
    expect(screen.getByText("2 Market St")).toBeInTheDocument();
    expect(screen.getByText("PO Box 9")).toBeInTheDocument();
  });

  it("shows a helpful empty state", () => {
    render(<ContactAddresses addresses={[]} />);

    expect(screen.getByText("No addresses saved yet")).toBeInTheDocument();
    expect(screen.getByText(/add a Home, Work, or Other address/i)).toBeInTheDocument();
  });
});
