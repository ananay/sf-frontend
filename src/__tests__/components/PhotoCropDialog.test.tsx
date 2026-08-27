import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhotoCropDialog from "@/components/contacts/PhotoCropDialog";

const SOURCE = "data:image/png;base64,iVBORw0KGgo=";

/** Supply the dimensions that a decoded browser image would report. */
function loadPreview(width = 800, height = 600): void {
  const image = screen.getByRole("presentation", { hidden: true });
  Object.defineProperties(image, {
    naturalWidth: { configurable: true, value: width },
    naturalHeight: { configurable: true, value: height },
  });
  fireEvent.load(image);
}

describe("PhotoCropDialog", () => {
  it("uses direct dragging, keeps focus inside, and exposes only the zoom slider", async () => {
    const onCancel = jest.fn();
    render(
      <PhotoCropDialog
        mimeType="image/png"
        source={SOURCE}
        onCancel={onCancel}
        onComplete={jest.fn()}
        onError={jest.fn()}
      />,
    );

    const zoom = screen.getByRole("slider", { name: /zoom/i });
    expect(zoom).toHaveFocus();
    expect(screen.getAllByRole("slider")).toHaveLength(1);
    expect(screen.getByLabelText(/drag to reposition/i)).toHaveClass("cursor-grab");

    await userEvent.tab({ shift: true });
    expect(screen.getByRole("button", { name: /cancel/i })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not apply an asynchronous crop after the user cancels", async () => {
    const originalImage = global.Image;
    const originalCreateElement = document.createElement.bind(document);

    class DeferredImage {
      static instance: DeferredImage;
      naturalWidth = 800;
      naturalHeight = 600;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor() {
        DeferredImage.instance = this;
      }

      set src(_value: string) {}

      complete(): void {
        this.onload?.();
      }
    }

    const onCancel = jest.fn();
    const onComplete = jest.fn();

    render(
      <PhotoCropDialog
        mimeType="image/png"
        source={SOURCE}
        onCancel={onCancel}
        onComplete={onComplete}
        onError={jest.fn()}
      />,
    );
    loadPreview();
    Object.defineProperty(global, "Image", {
      configurable: true,
      writable: true,
      value: DeferredImage,
    });
    jest.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage: jest.fn() }),
          toDataURL: () => "data:image/png;base64,cropped",
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName);
    });

    try {
      await userEvent.click(screen.getByRole("button", { name: /use crop/i }));
      await userEvent.keyboard("{Escape}");
      await act(async () => DeferredImage.instance.complete());

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
    } finally {
      jest.restoreAllMocks();
      Object.defineProperty(global, "Image", {
        configurable: true,
        writable: true,
        value: originalImage,
      });
    }
  });
});
