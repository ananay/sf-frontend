import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import ApiErrorPanel from "@/components/contacts/ApiErrorPanel";
import ContactsGrid from "@/components/contacts/ContactsGrid";
import ContactsToolbar from "@/components/contacts/ContactsToolbar";
import EmptyState from "@/components/contacts/EmptyState";
import Pagination from "@/components/contacts/Pagination";
import { buttonClasses } from "@/components/ui/Button";
import { ApiUnreachableError, apiBaseUrl } from "@/lib/apiClient";
import { listContacts } from "@/lib/contacts/api";
import {
  contactsHref,
  parseContactListQuery,
  toApiParams,
  type RawSearchParams,
} from "@/lib/contacts/query";
import type { ContactPage } from "@/lib/contacts/types";

export const metadata: Metadata = {
  title: "Contacts",
  description: "Browse, search, and manage contacts.",
};

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const query = parseContactListQuery(await searchParams);

  const outcome = await listContacts(toApiParams(query)).catch(
    (error: unknown) => error as Error,
  );

  const result: ContactPage | null = outcome instanceof Error ? null : outcome;
  const error: Error | null = outcome instanceof Error ? outcome : null;

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
            Your network
          </span>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Contacts
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {result
              ? `${result.total} ${result.total === 1 ? "contact" : "contacts"}${
                  query.search ? ` matching “${query.search}”` : ""
                }`
              : "Manage the people in your address book."}
          </p>
        </div>

        <Link href="/contacts/new" className={buttonClasses("primary")}>
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          New contact
        </Link>
      </header>

      {error ? (
        <ApiErrorPanel
          message={
            error instanceof ApiUnreachableError
              ? "The Contacts API did not respond. Start the backend and reload."
              : error.message
          }
          hint={`API base URL: ${apiBaseUrl || "(same origin)"}`}
        />
      ) : (
        <>
          <ContactsToolbar query={query} />

          {result && result.items.length > 0 ? (
            <>
              <ContactsGrid contacts={result.items} />
              <Pagination
                query={query}
                total={result.total}
                shown={result.items.length}
              />
            </>
          ) : (
            <EmptyState
              searchTerm={query.search || undefined}
              clearHref={contactsHref(query, { search: "", page: 1 })}
            />
          )}
        </>
      )}
    </div>
  );
}
