"use client";

import Link from "next/link";
import { Building2, Mail, MapPin, Pencil, Phone } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import ContactAvatar from "./ContactAvatar";
import DeleteContactButton from "./DeleteContactButton";
import { buttonClasses } from "@/components/ui/Button";
import { jobLine } from "@/lib/contacts/format";
import type { Contact } from "@/lib/contacts/types";

const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.065, delayChildren: 0.04 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.975 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 25 },
  },
};

/** Responsive, animated card view for the current page of contacts. */
export default function ContactsGrid({ contacts }: { contacts: Contact[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.ul
      aria-label="Contacts"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      variants={reduceMotion ? undefined : gridVariants}
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
    >
      {contacts.map((contact) => {
        const subtitle = jobLine(contact);

        return (
          <motion.li
            key={contact.id}
            layout
            variants={reduceMotion ? undefined : cardVariants}
            whileHover={reduceMotion ? undefined : { y: -6, scale: 1.012 }}
            whileTap={reduceMotion ? undefined : { scale: 0.992 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            className="glass-card group relative isolate cursor-pointer overflow-hidden rounded-3xl p-5"
          >
            <Link
              href={`/contacts/${contact.id}`}
              aria-label={`Open ${contact.full_name}`}
              className="absolute inset-0 z-0 rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-primary/15 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden="true"
            />

            <div className="pointer-events-none relative z-10 flex items-start gap-3.5">
              <ContactAvatar contact={contact} size="lg" />
              <div className="min-w-0 flex-1 pt-0.5">
                <span className="block truncate font-display text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                  {contact.full_name}
                </span>
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                  {subtitle ?? "Personal contact"}
                </p>
              </div>
            </div>

            <div className="pointer-events-none relative z-10 mt-5 space-y-2.5 text-[13px]">
              <a
                href={`mailto:${contact.email}`}
                className="pointer-events-auto flex min-w-0 items-center gap-2.5 text-muted-foreground transition-colors hover:text-primary"
              >
                <Mail className="h-4 w-4 shrink-0" strokeWidth={1.7} aria-hidden="true" />
                <span className="truncate">{contact.email}</span>
              </a>
              <div className="flex min-w-0 items-center gap-2.5 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" strokeWidth={1.7} aria-hidden="true" />
                {contact.phone ? (
                  <a
                    href={`tel:${contact.phone}`}
                    className="pointer-events-auto truncate hover:text-primary"
                  >
                    {contact.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground/55">No phone added</span>
                )}
              </div>
              <div className="flex min-w-0 items-center gap-2.5 text-muted-foreground">
                <Building2 className="h-4 w-4 shrink-0" strokeWidth={1.7} aria-hidden="true" />
                <span className="truncate">{contact.company ?? "No company added"}</span>
              </div>
            </div>

            <div className="pointer-events-none relative z-10 mt-5 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {contact.addresses.length} {contact.addresses.length === 1 ? "address" : "addresses"}
              </span>
              <div className="pointer-events-auto flex items-center gap-1">
                <Link
                  href={`/contacts/${contact.id}/edit`}
                  aria-label={`Edit ${contact.full_name}`}
                  className={buttonClasses("ghost", "sm")}
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </Link>
                <DeleteContactButton contactId={contact.id} contactName={contact.full_name} />
              </div>
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
