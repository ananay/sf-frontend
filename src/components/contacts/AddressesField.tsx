"use client";

import { useState, type ChangeEvent } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import type { AddressInput, AddressType } from "@/lib/contacts/types";

const EMPTY_ADDRESS: AddressInput = {
  type: "Home",
  address: "",
  city: null,
  state: null,
  postal_code: null,
  country: null,
};

const CONTROL =
  "w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-input";

interface AddressesFieldProps {
  initialAddresses: AddressInput[];
  error?: string;
}

/** Dynamic editor for a contact's normalized, typed address collection. */
export default function AddressesField({
  initialAddresses,
  error,
}: AddressesFieldProps) {
  const [addresses, setAddresses] = useState<AddressInput[]>(initialAddresses);

  function updateAddress(
    index: number,
    field: keyof AddressInput,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void {
    const value = event.target.value;
    setAddresses((current) =>
      current.map((address, itemIndex) =>
        itemIndex === index
          ? {
              ...address,
              [field]: field === "type" ? (value as AddressType) : value || null,
            }
          : address,
      ),
    );
  }

  function addAddress(): void {
    if (addresses.length < 10) {
      setAddresses((current) => [...current, { ...EMPTY_ADDRESS }]);
    }
  }

  function removeAddress(index: number): void {
    setAddresses((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Addresses</legend>
      <div className="flex items-end justify-between gap-4 border-b border-hairline pb-2">
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground">
            Addresses
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Add up to 10 Home, Work, or Other addresses.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addAddress}
          disabled={addresses.length >= 10}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          No addresses yet.
        </div>
      ) : null}

      {addresses.map((address, index) => (
        <div key={index} className="rounded-lg border border-border bg-card/50 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="font-display text-sm font-semibold text-foreground">
              Address {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeAddress(index)}
              aria-label={`Remove address ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-[13px] font-medium text-foreground">
              Type
              <select
                value={address.type}
                onChange={(event) => updateAddress(index, "type", event)}
                className={`${CONTROL} mt-1.5`}
              >
                <option>Home</option>
                <option>Work</option>
                <option>Other</option>
              </select>
            </label>
            <label className="text-[13px] font-medium text-foreground sm:col-span-2">
              Street address <span className="text-destructive">*</span>
              <input
                value={address.address}
                onChange={(event) => updateAddress(index, "address", event)}
                maxLength={300}
                required
                autoComplete="street-address"
                className={`${CONTROL} mt-1.5`}
              />
            </label>
            {(
              [
                ["city", "City", 120, "address-level2"],
                ["state", "State / region", 120, "address-level1"],
                ["postal_code", "Postal code", 20, "postal-code"],
                ["country", "Country", 120, "country-name"],
              ] as const
            ).map(([field, label, maxLength, autoComplete]) => (
              <label key={field} className="text-[13px] font-medium text-foreground">
                {label}
                <input
                  value={address[field] ?? ""}
                  onChange={(event) => updateAddress(index, field, event)}
                  maxLength={maxLength}
                  autoComplete={autoComplete}
                  className={`${CONTROL} mt-1.5`}
                />
              </label>
            ))}
          </div>
        </div>
      ))}

      <input type="hidden" name="addresses" value={JSON.stringify(addresses)} />
      {error ? (
        <p role="alert" className="text-[13px] text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
