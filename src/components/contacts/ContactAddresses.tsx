import { MapPin } from "lucide-react";
import { addressLine } from "@/lib/contacts/format";
import type { Address, AddressType } from "@/lib/contacts/types";

const ADDRESS_TYPE_ORDER: readonly AddressType[] = ["Home", "Work", "Other"];

interface ContactAddressesProps {
  addresses: Address[];
}

/** Display saved addresses in predictable Home, Work, and Other groups. */
export default function ContactAddresses({ addresses }: ContactAddressesProps) {
  if (addresses.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-dashed border-border bg-secondary/30 px-4 py-3">
        <MapPin
          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <div>
          <p className="font-medium text-foreground">No addresses saved yet</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Add a Home, Work, or Other address when editing this contact.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ADDRESS_TYPE_ORDER.map((type) => {
        const matchingAddresses = addresses.filter((address) => address.type === type);
        if (matchingAddresses.length === 0) return null;

        return (
          <section key={type}>
            <h3 className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {type}
            </h3>
            <ul className="space-y-2">
              {matchingAddresses.map((address) => (
                <li key={address.id} className="flex items-start gap-2">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span>{addressLine(address)}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
