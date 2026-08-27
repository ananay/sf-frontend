"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { MAX_PHOTO_BYTES, PHOTO_ACCEPT } from "@/lib/contacts/schema";

interface PhotoFieldProps {
  initialPhoto: string | null;
  error?: string;
}

/** Image picker that submits a validated data URI through the server action. */
export default function PhotoField({ initialPhoto, error }: PhotoFieldProps) {
  const [photo, setPhoto] = useState(initialPhoto);
  const [clientError, setClientError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const message = clientError ?? error;

  function choosePhoto(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!PHOTO_ACCEPT.split(",").includes(file.type)) {
      setClientError("Choose a JPEG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setClientError("Photo must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhoto(reader.result);
        setClientError(undefined);
      }
    };
    reader.onerror = () => setClientError("The selected photo could not be read.");
    reader.readAsDataURL(file);
  }

  function removePhoto(): void {
    setPhoto(null);
    setClientError(undefined);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Contact photo</legend>
      <div className="border-b border-hairline pb-2">
        <h2 className="font-display text-sm font-semibold text-foreground">
          Photo
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Optional JPEG, PNG, or WebP image up to 2 MB.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-muted-foreground">
          {photo ? (
            // The API validates this data URI before it is stored.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Contact photo preview" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-[13px] font-medium text-foreground">
            <span className="sr-only">Choose contact photo</span>
            <input
              ref={inputRef}
              type="file"
              accept={PHOTO_ACCEPT}
              onChange={choosePhoto}
              aria-describedby={message ? "photo-error" : "photo-help"}
              aria-invalid={message ? true : undefined}
              className="block text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-secondary/70"
            />
          </label>
          <p id="photo-help" className="text-xs text-muted-foreground">
            The photo is stored with this contact.
          </p>
          {photo ? (
            <Button type="button" variant="ghost" size="sm" onClick={removePhoto}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove photo
            </Button>
          ) : null}
        </div>
      </div>

      <input type="hidden" name="photo" value={photo ?? ""} />
      {message ? (
        <p id="photo-error" role="alert" className="text-[13px] text-destructive">
          {message}
        </p>
      ) : null}
    </fieldset>
  );
}
