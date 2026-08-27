import { calculateSquareCrop, renderSquareCrop } from "@/lib/images/crop";

describe("square photo crop", () => {
  it("calculates a centered crop and honors zoom and position", () => {
    expect(calculateSquareCrop(800, 600, { zoom: 1, x: 0, y: 0 })).toEqual({
      size: 600,
      x: 100,
      y: 0,
    });
    expect(calculateSquareCrop(800, 600, { zoom: 2, x: 100, y: -100 })).toEqual({
      size: 300,
      x: 500,
      y: 0,
    });
  });

  it("renders a bounded square canvas using the selected source rectangle", async () => {
    const originalImage = global.Image;
    const drawImage = jest.fn();
    const toDataURL = jest.fn(() => "data:image/png;base64,cropped");
    const originalCreateElement = document.createElement.bind(document);

    class LoadedImage {
      naturalWidth = 1000;
      naturalHeight = 800;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        this.onload?.();
      }
    }

    Object.defineProperty(global, "Image", {
      configurable: true,
      writable: true,
      value: LoadedImage,
    });
    jest.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage }),
          toDataURL,
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName);
    });

    try {
      await expect(
        renderSquareCrop("data:image/png;base64,source", "image/png", {
          zoom: 1,
          x: 0,
          y: 0,
        }),
      ).resolves.toBe("data:image/png;base64,cropped");
      expect(drawImage).toHaveBeenCalledWith(
        expect.any(LoadedImage),
        100,
        0,
        800,
        800,
        0,
        0,
        512,
        512,
      );
      expect(toDataURL).toHaveBeenCalledWith("image/png", 0.9);
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
