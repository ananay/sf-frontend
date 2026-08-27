import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddressesField from "@/components/contacts/AddressesField";

describe("AddressesField", () => {
  it("adds, edits, serializes, and removes an address", async () => {
    const { container } = render(<AddressesField initialAddresses={[]} />);

    expect(screen.getByText(/no addresses yet/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /add address/i }));
    await userEvent.selectOptions(screen.getByLabelText(/^type$/i), "Work");
    await userEvent.type(screen.getByLabelText(/street address/i), "1 Market St");
    await userEvent.type(screen.getByLabelText(/^city$/i), "San Francisco");

    const hidden = container.querySelector('input[name="addresses"]');
    expect(JSON.parse(hidden?.getAttribute("value") ?? "[]")).toEqual([
      expect.objectContaining({
        type: "Work",
        address: "1 Market St",
        city: "San Francisco",
      }),
    ]);

    await userEvent.click(screen.getByRole("button", { name: /remove address 1/i }));
    expect(hidden).toHaveValue("[]");
  });

  it("preserves multiple existing addresses and enforces the limit", () => {
    const addresses = Array.from({ length: 10 }, (_, index) => ({
      type: "Other" as const,
      address: `${index + 1} Main St`,
      city: null,
      state: null,
      postal_code: null,
      country: null,
    }));

    render(<AddressesField initialAddresses={addresses} />);

    expect(screen.getAllByLabelText(/street address/i)).toHaveLength(10);
    expect(screen.getByRole("button", { name: /add address/i })).toBeDisabled();
  });
});
