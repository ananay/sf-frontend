"use client";

import {
  useEffect,
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
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

interface DragStart {
  crop: SquareCrop;
  pointerId: number;
  pointerX: number;
  pointerY: number;
  viewportSize: number;
}

const INITIAL_CROP: SquareCrop = { zoom: 1, x: 0, y: 0 };
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Square photo cropper with direct mouse/touch dragging and keyboard-safe focus. */
export default function PhotoCropDialog({
  mimeType,
  source,
  onCancel,
  onComplete,
  onError,
}: PhotoCropDialogProps) {
  const [crop, setCrop] = useState(INITIAL_CROP);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<DragStart | null>(null);
  const isActiveRef = useRef(true);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  /** Cancel pending output before closing the editor. */
  const cancelDialog = useCallback((): void => {
    isActiveRef.current = false;
    onCancelRef.current();
  }, []);

  useEffect(() => {
    const previousFocus = document.activeElement;
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

    /** Keep keyboard focus inside the modal and support Escape to cancel. */
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelDialog();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      isActiveRef.current = false;
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [cancelDialog]);

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

  /** Start moving the image from its current crop position. */
  function startDragging(event: ReactPointerEvent<HTMLDivElement>): void {
    if (!dimensions.width) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      crop,
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      viewportSize: event.currentTarget.getBoundingClientRect().width,
    };
    setIsDragging(true);
  }

  /** Reposition the source image while keeping every edge inside the crop frame. */
  function dragImage(event: ReactPointerEvent<HTMLDivElement>): void {
    const start = dragStartRef.current;
    if (!start || start.pointerId !== event.pointerId) return;

    const shortestSide = Math.min(dimensions.width, dimensions.height);
    const renderedWidth =
      (dimensions.width / shortestSide) * crop.zoom * start.viewportSize;
    const renderedHeight =
      (dimensions.height / shortestSide) * crop.zoom * start.viewportSize;
    const overflowX = renderedWidth - start.viewportSize;
    const overflowY = renderedHeight - start.viewportSize;
    const x =
      overflowX > 0
        ? start.crop.x - ((event.clientX - start.pointerX) / overflowX) * 200
        : 0;
    const y =
      overflowY > 0
        ? start.crop.y - ((event.clientY - start.pointerY) / overflowY) * 200
        : 0;

    setCrop((current) => ({
      ...current,
      x: Math.max(-100, Math.min(100, x)),
      y: Math.max(-100, Math.min(100, y)),
    }));
  }

  /** Finish a pointer drag and release capture. */
  function stopDragging(event: ReactPointerEvent<HTMLDivElement>): void {
    if (dragStartRef.current?.pointerId !== event.pointerId) return;
    dragStartRef.current = null;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  /** Render the current crop and return it only if the dialog is still active. */
  async function saveCrop(): Promise<void> {
    setIsSaving(true);
    try {
      const result = await renderSquareCrop(source, mimeType, crop);
      if (isActiveRef.current) onComplete(result);
    } catch (error) {
      if (isActiveRef.current) {
        onError(
          error instanceof Error
            ? error.message
            : "The photo could not be cropped.",
        );
      }
    } finally {
      if (isActiveRef.current) setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-crop-title"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl"
      >
        <h2 id="photo-crop-title" className="font-display text-lg font-semibold">
          Crop photo
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag to reposition your photo, then zoom if needed.
        </p>

        <div
          className={`relative mx-auto mt-5 aspect-square w-full max-w-72 touch-none select-none overflow-hidden rounded-lg border border-border bg-secondary bg-no-repeat ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            backgroundImage: `url(${source})`,
            backgroundPosition: `${backgroundPositionX}% ${backgroundPositionY}%`,
            backgroundSize,
          }}
          aria-label="Photo crop area. Drag to reposition the image."
          onPointerDown={startDragging}
          onPointerMove={dragImage}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(to right, transparent 33.1%, white 33.3%, white 33.6%, transparent 33.8%, transparent 66.4%, white 66.6%, white 66.9%, transparent 67.1%), linear-gradient(to bottom, transparent 33.1%, white 33.3%, white 33.6%, transparent 33.8%, transparent 66.4%, white 66.6%, white 66.9%, transparent 67.1%)",
            }}
            aria-hidden="true"
          />
          {/* This image supplies intrinsic dimensions; the background is the crop preview. */}
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

        <label className="mt-5 grid grid-cols-[4rem_1fr] items-center gap-3 text-sm">
          <span className="text-muted-foreground">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={crop.zoom}
            onChange={(event) =>
              setCrop((current) => ({
                ...current,
                zoom: Number(event.target.value),
              }))
            }
            className="accent-primary"
          />
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={cancelDialog}>
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
