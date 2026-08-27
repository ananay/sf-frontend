"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import {
  calculateSquareCrop,
  renderSquareCrop,
  type SquareCrop,
} from "@/lib/images/crop";

interface PhotoCropDialogProps {
  mimeType: string;
  source: string;
  onCancel: () => void;
  onComplete: (photo: string) => void;
  onError: (message: string) => void;
}

const INITIAL_CROP: SquareCrop = { zoom: 1, x: 0, y: 0 };

/** Accessible square-crop editor with zoom and two-axis positioning controls. */
export default function PhotoCropDialog({
  mimeType,
  source,
  onCancel,
  onComplete,
  onError,
}: PhotoCropDialogProps) {
  const [crop, setCrop] = useState(INITIAL_CROP);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    /** Close the crop editor without changing the current photo. */
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onCancel();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const rectangle = dimensions.width
    ? calculateSquareCrop(dimensions.width, dimensions.height, crop)
    : null;
  const backgroundPositionX = rectangle
    ? (rectangle.x / Math.max(dimensions.width - rectangle.size, 1)) * 100
    : 50;
  const backgroundPositionY = rectangle
    ? (rectangle.y / Math.max(dimensions.height - rectangle.size, 1)) * 100
    : 50;
  const backgroundSize = dimensions.width
    ? `${(dimensions.width / Math.min(dimensions.width, dimensions.height)) * crop.zoom * 100}% auto`
    : "cover";

  /** Update one crop control while preserving the other values. */
  function updateCrop(key: keyof SquareCrop, value: number): void {
    setCrop((current) => ({ ...current, [key]: value }));
  }

  /** Render the crop and return it to the parent photo field. */
  async function saveCrop(): Promise<void> {
    setIsSaving(true);
    try {
      onComplete(await renderSquareCrop(source, mimeType, crop));
    } catch (error) {
      onError(error instanceof Error ? error.message : "The photo could not be cropped.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-crop-title"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl">
        <h2 id="photo-crop-title" className="font-display text-lg font-semibold">
          Crop photo
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Adjust the image inside the square. Your contact avatar will use this crop.
        </p>

        <div
          className="mx-auto mt-5 aspect-square w-full max-w-72 overflow-hidden rounded-lg border border-border bg-secondary bg-no-repeat"
          style={{
            backgroundImage: `url(${source})`,
            backgroundPosition: `${backgroundPositionX}% ${backgroundPositionY}%`,
            backgroundSize,
          }}
        >
          {/* This image provides intrinsic dimensions; the background is the crop preview. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={source}
            alt=""
            className="invisible h-0 w-0"
            onLoad={(event) =>
              setDimensions({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
          />
        </div>

        <div className="mt-5 space-y-3">
          <CropRange label="Zoom" min={1} max={3} step={0.05} value={crop.zoom} onChange={(value) => updateCrop("zoom", value)} />
          <CropRange label="Horizontal position" min={-100} max={100} value={crop.x} onChange={(value) => updateCrop("x", value)} />
          <CropRange label="Vertical position" min={-100} max={100} value={crop.y} onChange={(value) => updateCrop("y", value)} />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={saveCrop} disabled={!dimensions.width || isSaving}>
            {isSaving ? "Saving…" : "Use crop"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface CropRangeProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}

/** Labeled range control shared by each crop adjustment. */
function CropRange({ label, min, max, step, value, onChange }: CropRangeProps) {
  return (
    <label className="grid grid-cols-[9rem_1fr] items-center gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-primary"
      />
    </label>
  );
}
