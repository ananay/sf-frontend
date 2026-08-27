import React from "react";
import { render, screen } from "@testing-library/react";
import ContactsGrid from "@/components/contacts/ContactsGrid";
import Pagination from "@/components/contacts/Pagination";
import EmptyState from "@/components/contacts/EmptyState";
import { DEFAULT_LIST_QUERY } from "@/lib/contacts/query";
import { CONTACTS } from "../mocks/handlers";

jest.mock("motion/react", () => {
  const ReactModule = jest.requireActual<typeof import("react")>("react");
  const motionProps = new Set([
    "animate",
    "initial",
    "layout",
    "transition",
    "variants",
    "whileHover",
    "whileTap",
  ]);

  return {
    motion: new Proxy(
      {},
      {
        get: (_target, tag: string) =>
          ReactModule.forwardRef<
            HTMLElement,
            React.PropsWithChildren<Record<string, unknown>>
          >(
            ({ children, ...props }, ref) => {
              const htmlProps = Object.fromEntries(
                Object.entries(props).filter(([name]) => !motionProps.has(name)),
              );
              return ReactModule.createElement(
                tag,
                { ...htmlProps, ref },
                children as React.ReactNode,
              );
            },
          ),
      },
    ),
    useReducedMotion: () => true,
  };
});

jest.mock("@/app/contacts/actions", () => ({
  deleteContactAction: jest.fn(async () => ({})),
}));

describe("ContactsGrid", () => {
  it("renders one card per contact with view, mail, edit, and delete actions", () => {
    render(<ContactsGrid contacts={CONTACTS} />);

    expect(screen.getByRole("list", { name: "Contacts" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(CONTACTS.length);
    expect(screen.getByRole("link", { name: "Ada Lovelace" })).toHaveAttribute(
      "href",
      "/contacts/1",
    );
    expect(screen.getByRole("link", { name: "ada@example.com" })).toHaveAttribute(
      "href",
      "mailto:ada@example.com",
    );
    expect(screen.getByRole("link", { name: /edit ada lovelace/i })).toHaveAttribute(
      "href",
      "/contacts/1/edit",
    );
    expect(screen.getByRole("button", { name: /delete ada lovelace/i })).toBeInTheDocument();
  });

  it("shows graceful labels for missing optional details", () => {
    render(
      <ContactsGrid contacts={[{ ...CONTACTS[0], phone: null, company: null }]} />,
    );

    expect(screen.getByText("No phone added")).toBeInTheDocument();
    expect(screen.getByText("No company added")).toBeInTheDocument();
  });
});

describe("Pagination", () => {
  it("reports the visible range and disables Previous on page one", () => {
    render(<Pagination query={DEFAULT_LIST_QUERY} total={60} shown={25} />);

    expect(screen.getByText(/showing/i)).toHaveTextContent("Showing 1–25 of 60");
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /previous/i })).toBeNull();
    expect(screen.getByRole("link", { name: /next/i })).toHaveAttribute(
      "href",
      "/contacts?page=2",
    );
  });

  it("offers both directions in the middle of the list", () => {
    render(
      <Pagination query={{ ...DEFAULT_LIST_QUERY, page: 2 }} total={60} shown={25} />,
    );

    expect(screen.getByText(/showing/i)).toHaveTextContent("Showing 26–50 of 60");
    expect(screen.getByRole("link", { name: /previous/i })).toHaveAttribute(
      "href",
      "/contacts",
    );
    expect(screen.getByRole("link", { name: /next/i })).toHaveAttribute(
      "href",
      "/contacts?page=3",
    );
  });
});

describe("EmptyState", () => {
  it("invites the first contact when the address book is empty", () => {
    render(<EmptyState clearHref="/contacts" />);
    expect(screen.getByRole("heading", { name: /no contacts yet/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /clear search/i })).toBeNull();
  });

  it("offers to clear the filter when a search found nothing", () => {
    render(<EmptyState searchTerm="zzz" clearHref="/contacts" />);
    expect(screen.getByRole("heading", { name: /no matching contacts/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /clear search/i })).toHaveAttribute(
      "href",
      "/contacts",
    );
  });
});
